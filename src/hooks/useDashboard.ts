import { useState, useEffect, useRef } from "react";
import { getAuth, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getFirebaseToken } from "@/utils";

export interface Post {
    _id: string;
    title: string;
    content: string;
    comments: [string];
    picture?: string;
    author: User;
    likes: number;
    color: string;
}

export interface User {
    name: string;
    username: string;
    email: string;
    bio?: string;
    profilePicture?: string;
    posts?: Post[];
    snapchat: string;
    defaultPostColor: string;
    instagram: string;
    isVerified: boolean;
    followers: string[];
    following: string[];
}

export function useDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Interactions
    const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>({});
    const fetchedInteractionIdsRef = useRef<Set<string>>(new Set());

    // 1. Auth & User Data Logic
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser?.email) {
                setUser(firebaseUser);

                const cached = localStorage.getItem("userData");
                const cachedAt = localStorage.getItem("userDataCachedAt");
                const oneHour = 60 * 60 * 1000;
                const isCacheValid = cached && cachedAt && Date.now() - Number(cachedAt) < oneHour;

                if (isCacheValid) {
                    try {
                        const parsed = JSON.parse(cached);
                        setUserData(parsed);
                        setLoading(false);
                    } catch (error) {
                        console.error("Cache parse error:", error);
                        fetchUserData(firebaseUser.email).then(updateCache).finally(() => setLoading(false));
                    }
                } else {
                    fetchUserData(firebaseUser.email).then(updateCache).finally(() => setLoading(false));
                }
            } else {
                router.replace("/");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const updateCache = (data: User | null) => {
        if (data) {
            setUserData(data);
            localStorage.setItem("userData", JSON.stringify(data));
            localStorage.setItem("userDataCachedAt", Date.now().toString());
        }
    };

    const fetchUserData = async (email: string): Promise<User | null> => {
        try {
            const token = await getFirebaseToken();
            const res = await fetch(`/api/user/posts?email=${encodeURIComponent(email)}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            return res.ok ? data.user : null;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    useEffect(() => {
        if (!userData) return;

        const fetchPosts = async () => {
            if (loadingPosts || !hasMore) return;

            setLoadingPosts(true);
            try {
                const res = await fetch(`/api/getallposts?page=${page}&limit=9`);
                const data = await res.json();

                const filtered = data.posts.filter((p: Post) => p.author.email !== userData.email);

                setPosts((prev) => (prev ? [...prev, ...filtered] : filtered));
                setHasMore(data.hasMore);
            } catch (err) {
                console.error("Error fetching posts:", err);
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchPosts();
    }, [page, userData]);

    useEffect(() => {
        if (!user || !posts?.length) return;

        const fetchInteractions = async () => {
            const newPostIds = posts
                .map((p) => p._id)
                .filter((id) => !fetchedInteractionIdsRef.current.has(id));

            if (newPostIds.length === 0) return;

            try {
                const token = await getFirebaseToken();
                const res = await fetch(`/api/interactions`, {
                    method: "POST",
                    body: JSON.stringify({
                        email: user.email,
                        postIds: newPostIds,
                        page,
                        limit: 9,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                });

                const data = await res.json();

                if (res.ok) {
                    setLikedPosts((prev) => {
                        const updated = { ...prev };
                        data.likes.forEach((id: string) => (updated[id] = true));
                        return updated;
                    });

                    setBookmarkedPosts((prev) => {
                        const updated = { ...prev };
                        data.bookmarks.forEach((id: string) => (updated[id] = true));
                        return updated;
                    });

                    newPostIds.forEach((id) => fetchedInteractionIdsRef.current.add(id));
                }
            } catch (err) {
                console.error("Failed to load interactions", err);
            }
        };

        fetchInteractions();
    }, [user, posts, page]);

    const handleLogout = async () => {
        try {
            await signOut(getAuth());
            setUser(null);
            localStorage.removeItem("userData");
            localStorage.removeItem("userDataCachedAt");
            router.replace("/");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const toggleLike = async (postId: string) => {
        if (!user) return;

        setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));

        try {
            const token = await getFirebaseToken();
            const res = await fetch(`/api/post/like`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ postId, email: user.email }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to like post");

            setPosts((prev) =>
                prev ? prev.map((p) => p._id === postId ? { ...p, likes: data.likes } : p) : prev
            );
        } catch (err) {
            console.error("Error liking post:", err);
        }
    };

    const toggleBookmark = async (postId: string) => {
        if (!user) return;

        setBookmarkedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));

        try {
            const token = await getFirebaseToken();
            const res = await fetch(`/api/post/bookmark`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ postId, email: user.email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to bookmark post");
        } catch (err) {
            console.error(err);
        }
    };

    return {
        user,
        userData,
        posts,
        loading,
        loadingPosts,
        hasMore,
        likedPosts,
        bookmarkedPosts,
        handleLogout,
        toggleLike,
        toggleBookmark,
        setPage
    };
}