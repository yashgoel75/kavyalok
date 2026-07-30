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
  repostCount?: number;
  repostedBy?: any[];
  isRepost?: boolean;
  originalPost?: string;
  repostedByAuthor?: User;
  repostedByAuthors?: User[];
  createdAt?: string;
  updatedAt?: string;
  lastRepostedAt?: string;
  lastActivityAt?: string;
}

const fetchPostsPage = async ({
  pageParam = 1,
  userEmail,
}: {
  pageParam: number;
  userEmail?: string | null;
}) => {
  const exclude = userEmail ? `&excludeEmail=${encodeURIComponent(userEmail)}` : "";
  const res = await fetch(`/api/getallposts?page=${pageParam}&limit=9${exclude}`);
  if (!res.ok) throw new Error("Failed to fetch posts");
  const data = await res.json();

  return {
    posts: (data.posts || []) as Post[],
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

  // Deduplicate and sort posts feed by latest activity (new creation or recent repost)
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

    // Sort by modified date (repost timestamp override > updatedAt > createdAt)
    items.sort((a, b) => {
      const timeA =
        repostTimestampOverrides[a._id] ||
        (a.updatedAt ? new Date(a.updatedAt).getTime() : 0) ||
        (a.createdAt ? new Date(a.createdAt).getTime() : 0);

      const timeB =
        repostTimestampOverrides[b._id] ||
        (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) ||
        (b.createdAt ? new Date(b.createdAt).getTime() : 0);

      return timeB - timeA;
    });

    return items;
  }, [rawPosts, likesOverrides, repostCountOverrides, repostTimestampOverrides]);

  const toggleLike = async (postId: string) => {
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
    if (!user) return;

    const isCurrentlyReposted = !!repostedPosts[postId];
    const newStatus = !isCurrentlyReposted;

    setRepostedPosts((prev) => ({ ...prev, [postId]: newStatus }));
    if (newStatus) {
      setRepostTimestampOverrides((prev) => ({ ...prev, [postId]: Date.now() }));
    }

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

      if (responseData.isReposted) {
        setRepostTimestampOverrides((prev) => ({ ...prev, [postId]: Date.now() }));
      }
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