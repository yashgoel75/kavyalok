import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseToken } from "@/utils";
import { useUser, User } from "@/context/UserContext";

export type { User };

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

export function useDashboard() {
    const router = useRouter();
    const { firebaseUser: user, userData, loading, logout: handleLogout } = useUser();

    const [posts, setPosts] = useState<Post[] | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Interactions
    const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>({});
    const fetchedInteractionIdsRef = useRef<Set<string>>(new Set());

    // Redirect unauthenticated user to home
    useEffect(() => {
        if (!loading && !user) {
            router.replace("/");
        }
    }, [loading, user, router]);

    // Parallel feed fetch (does NOT block on userData loading)
    useEffect(() => {
        const fetchPosts = async () => {
            if (loadingPosts || !hasMore) return;

            setLoadingPosts(true);
            try {
                const exclude = user?.email ? `&excludeEmail=${encodeURIComponent(user.email)}` : "";
                const res = await fetch(`/api/getallposts?page=${page}&limit=9${exclude}`);
                const data = await res.json();

                const userEmail = user?.email || userData?.email;
                const filtered = userEmail 
                    ? data.posts.filter((p: Post) => p.author?.email !== userEmail)
                    : data.posts;

                setPosts((prev) => (prev ? [...prev, ...filtered] : filtered));
                setHasMore(data.hasMore);
            } catch (err) {
                console.error("Error fetching posts:", err);
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchPosts();
    }, [page, user?.email]);

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