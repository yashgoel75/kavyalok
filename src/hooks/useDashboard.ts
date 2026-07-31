"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { getFirebaseToken } from "@/utils";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

export interface User {
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
  posts?: any[];
  reposts?: string[];
  isVerified?: boolean;
  defaultPostColor?: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  author: User;
  likes: number;
  comments: [string];
  createdAt: string;
  updatedAt: string;
  color: string;
  sortByTime?: string;
  repostCount?: number;
  repostedBy?: any[];
  isRepost?: boolean;
  originalPost?: string;
  repostedByAuthor?: User;
  repostedByAuthors?: User[];
}

const fetchPostsPage = async ({
  pageParam = 1,
  userEmail,
}: {
  pageParam?: number;
  userEmail?: string;
}) => {
  const token = await getFirebaseToken();
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const queryParams = new URLSearchParams({
    page: pageParam.toString(),
    limit: "10",
  });
  if (userEmail) queryParams.append("email", userEmail);

  const res = await fetch(`/api/getallposts?${queryParams.toString()}`, {
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch posts");

  return {
    posts: (data.posts || []) as Post[],
    nextPage: data.hasMore ? pageParam + 1 : undefined,
    totalPages: data.totalPages,
  };
};

export function useDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { firebaseUser: user, userData, loading, logout: handleLogout, requireAuth } = useUser();

  const userEmail = user?.email || userData?.email;

  // TanStack React Query for infinite scrolling (enabled for both guests and authenticated users)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingPosts,
  } = useInfiniteQuery({
    queryKey: ["dashboard-posts", userEmail || "guest"],
    queryFn: ({ pageParam = 1 }) => fetchPostsPage({ pageParam, userEmail }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: true,
  });

  const rawPosts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) ?? [];
  }, [data]);

  // Local override state for likes, bookmarks & reposts
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>({});
  const [repostedPosts, setRepostedPosts] = useState<Record<string, boolean>>({});

  const [likesOverrides, setLikesOverrides] = useState<Record<string, number>>({});
  const [repostCountOverrides, setRepostCountOverrides] = useState<Record<string, number>>({});
  const [repostTimestampOverrides, setRepostTimestampOverrides] = useState<Record<string, number>>({});

  const fetchedInteractionIdsRef = useRef<Set<string>>(new Set());

  // Fetch user interaction statuses (likes/bookmarks) for loaded posts
  useEffect(() => {
    if (!user || !rawPosts.length) return;

    const fetchInteractions = async () => {
      const newPostIds = rawPosts
        .map((p) => (p.isRepost && p.originalPost ? p.originalPost : p._id))
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
            Authorization: `Bearer ${token}`,
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
  }, [user, rawPosts]);

  // Initial user reposts map check
  useEffect(() => {
    if (userData && userData.reposts && Array.isArray(userData.reposts)) {
      setRepostedPosts((prev) => {
        const updated = { ...prev };
        userData.reposts?.forEach((id: string) => {
          updated[id] = true;
        });
        return updated;
      });
    }
  }, [userData]);

  // Deduplicate and sort posts feed strictly by sortByTime
  const displayPosts = useMemo(() => {
    const postMap = new Map<string, Post>();

    for (const post of rawPosts) {
      const canonicalId = post.isRepost && post.originalPost ? post.originalPost : post._id;

      if (!postMap.has(canonicalId)) {
        const repostedByAuthors: User[] = [];
        if (post.repostedBy && Array.isArray(post.repostedBy)) {
          post.repostedBy.forEach((u: any) => {
            if (typeof u === "object" && u.username) repostedByAuthors.push(u);
          });
        }
        if (post.isRepost && post.repostedByAuthor) {
          const exists = repostedByAuthors.some((u) => u.username === post.repostedByAuthor?.username);
          if (!exists) repostedByAuthors.push(post.repostedByAuthor);
        }

        postMap.set(canonicalId, {
          ...post,
          _id: canonicalId,
          repostedByAuthors,
          likes: likesOverrides[canonicalId] !== undefined ? likesOverrides[canonicalId] : post.likes,
          repostCount:
            repostCountOverrides[canonicalId] !== undefined
              ? repostCountOverrides[canonicalId]
              : post.repostCount || 0,
        });
      }
    }

    const items = Array.from(postMap.values());

    // Sort strictly by sortByTime (repost timestamp override > sortByTime > createdAt)
    items.sort((a, b) => {
      const timeA =
        repostTimestampOverrides[a._id] ||
        (a.sortByTime ? new Date(a.sortByTime).getTime() : 0) ||
        (a.createdAt ? new Date(a.createdAt).getTime() : 0);

      const timeB =
        repostTimestampOverrides[b._id] ||
        (b.sortByTime ? new Date(b.sortByTime).getTime() : 0) ||
        (b.createdAt ? new Date(b.createdAt).getTime() : 0);

      return timeB - timeA;
    });

    return items;
  }, [rawPosts, likesOverrides, repostCountOverrides, repostTimestampOverrides]);

  const toggleLike = async (postId: string) => {
    if (!requireAuth(undefined, "Log In to Like Posts", "Log in to show appreciation for creative pieces.")) return;
    if (!user) return;

    setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));

    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/post/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    if (!requireAuth(undefined, "Log In to Bookmark", "Save your favorite poems, stories, and posts to read anytime.")) return;
    if (!user) return;

    setBookmarkedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));

    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/post/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, email: user.email }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to bookmark post");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRepost = async (postId: string) => {
    if (!requireAuth(undefined, "Log In to Repost", "Share inspiring poetry and stories with your followers.")) return;
    if (!user) return;

    const isCurrentlyReposted = !!repostedPosts[postId];
    const newStatus = !isCurrentlyReposted;

    setRepostedPosts((prev) => ({ ...prev, [postId]: newStatus }));

    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/post/repost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, email: user.email }),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to repost");

      setRepostedPosts((prev) => ({
        ...prev,
        [postId]: responseData.isReposted,
      }));

      setRepostCountOverrides((prev) => ({
        ...prev,
        [postId]: responseData.repostCount,
      }));

      if (responseData.sortByTime) {
        setRepostTimestampOverrides((prev) => ({
          ...prev,
          [postId]: new Date(responseData.sortByTime).getTime(),
        }));
      }

      // Invalidate queries so TanStack Query refetches page 1 sorted by fresh sortByTime from MongoDB!
      queryClient.invalidateQueries({ queryKey: ["dashboard-posts"] });
    } catch (err) {
      console.error("Error reposting:", err);
      // Revert optimistic update
      setRepostedPosts((prev) => ({ ...prev, [postId]: isCurrentlyReposted }));
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
    repostedPosts,
    handleLogout,
    toggleLike,
    toggleBookmark,
    toggleRepost,
  };
}
