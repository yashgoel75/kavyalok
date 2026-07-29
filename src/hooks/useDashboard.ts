import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
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

const fetchPostsPage = async ({ pageParam = 1, userEmail }: { pageParam: number; userEmail?: string | null }) => {
    const exclude = userEmail ? `&excludeEmail=${encodeURIComponent(userEmail)}` : "";
    const res = await fetch(`/api/getallposts?page=${pageParam}&limit=9${exclude}`);
    if (!res.ok) throw new Error("Failed to fetch posts");
    const data = await res.json();

    const filtered = userEmail 
        ? data.posts.filter((p: Post) => p.author?.email !== userEmail)
        : data.posts;

    return {
        posts: filtered as Post[],
        hasMore: data.hasMore as boolean,
        nextPage: data.hasMore ? pageParam + 1 : undefined,
    };
};

export function useDashboard() {
    const router = useRouter();
    const { firebaseUser: user, userData, loading, logout: handleLogout } = useUser();

    const userEmail = user?.email || userData?.email;

    // Redirect unauthenticated user to home
    useEffect(() => {
        if (!loading && !user) {
            router.replace("/");
        }
    }, [loading, user, router]);

    // TanStack React Query for infinite scrolling
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loadingPosts,
    } = useInfiniteQuery({
        queryKey: ["dashboard-posts", userEmail],
        queryFn: ({ pageParam = 1 }) => fetchPostsPage({ pageParam, userEmail }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: !loading,
    });

    const posts = useMemo(() => {
        return data?.pages.flatMap((page) => page.posts) ?? [];
    }, [data]);

    // Local override state for likes count & status
    const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>({});
    const [likesOverrides, setLikesOverrides] = useState<Record<string, number>>({});
    const fetchedInteractionIdsRef = useRef<Set<string>>(new Set());

    // Fetch user interaction statuses (likes/bookmarks) for loaded posts
    useEffect(() => {
        if (!user || !posts.length) return;

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
                        page: 1,
                        limit: newPostIds.length,
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
    }, [user, posts]);

    const displayPosts = useMemo(() => {
        return posts.map((p) => ({
            ...p,
            likes: likesOverrides[p._id] !== undefined ? likesOverrides[p._id] : p.likes,
        }));
    }, [posts, likesOverrides]);

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

            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Failed to like post");

            setLikesOverrides((prev) => ({
                ...prev,
                [postId]: responseData.likes,
            }));
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
            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Failed to bookmark post");
        } catch (err) {
            console.error(err);
        }
    };

    return {
        user,
        userData,
        posts: displayPosts,
        loading,
        loadingPosts,
        hasMore: !!hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        likedPosts,
        bookmarkedPosts,
        handleLogout,
        toggleLike,
        toggleBookmark,
    };
}