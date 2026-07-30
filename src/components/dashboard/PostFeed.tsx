import React, { useEffect, useState, useMemo, useRef } from "react";
import PostCard from "./PostCard";
import { User, Post } from "@/hooks/useDashboard";
import { useRouter } from "next/navigation";
import { getTextColor, getIconColor, getCommentColor } from "@/lib/utils";
import { User as FirebaseUser } from "firebase/auth";
import { Loader2, Feather } from "lucide-react";
import CreatePostModal from "@/components/post/CreatePostModal";
import PostInteractionsModal from "./PostInteractionsModal";

interface FeedProps {
  posts: Post[] | null;
  userData: User | null;
  firebaseUser: FirebaseUser;
  likedPosts: Record<string, boolean>;
  bookmarkedPosts: Record<string, boolean>;
  repostedPosts?: Record<string, boolean>;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onRepost?: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingPosts: boolean;
  isFetchingNextPage?: boolean;
}

export default function PostFeed({
  posts,
  userData,
  firebaseUser,
  likedPosts,
  bookmarkedPosts,
  repostedPosts = {},
  onLike,
  onBookmark,
  onRepost,
  onLoadMore,
  hasMore,
  loadingPosts,
  isFetchingNextPage = false,
}: FeedProps) {
  const [filter, setFilter] = useState<"ALL" | "FRIENDS">("ALL");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [interactionsModal, setInteractionsModal] = useState<{
    isOpen: boolean;
    postId: string;
    postTitle: string;
    initialTab: "likes" | "reposts" | "comments";
  }>({
    isOpen: false,
    postId: "",
    postTitle: "",
    initialTab: "reposts",
  });

  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const defaultPostColor = userData?.defaultPostColor;

  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

  // Filter logic
  const displayPosts = useMemo(() => {
    return filter === "ALL"
      ? posts
      : posts?.filter((p) => userData?.following?.includes(p.author.email));
  }, [filter, posts, userData?.following]);

  // Auto infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isFetchingNextPage || loadingPosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage && !loadingPosts) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, isFetchingNextPage, loadingPosts, onLoadMore]);

  const handleOpenInteractions = (
    tab: "likes" | "reposts" | "comments",
    postId: string,
    title: string
  ) => {
    setInteractionsModal({
      isOpen: true,
      postId,
      postTitle: title,
      initialTab: tab,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
            Welcome back, {userData?.name || "Writer"}
          </h1>
          <p className="text-gray-600 font-medium text-sm">
            Discover creative writing, poetry, and stories from the community.
          </p>
        </div>

        {/* Quick Create Post Button */}
        <button
          onClick={() => setIsCreatePostOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-bold text-sm shadow-md hover:bg-gray-800 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Feather size={16} />
          <span>New Post</span>
        </button>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${
            filter === "ALL"
              ? "bg-gray-900 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Recents
        </button>
        <button
          onClick={() => setFilter("FRIENDS")}
          className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${
            filter === "FRIENDS"
              ? "bg-gray-900 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Friends
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingPosts && (!displayPosts || displayPosts.length === 0) ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-100 p-6 rounded-2xl bg-white shadow-sm animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="h-4 w-28 bg-gray-200 rounded-md"></div>
              </div>

              <div className="h-5 w-40 bg-gray-200 rounded-md mt-3"></div>

              <div className="h-3 w-16 bg-gray-100 rounded-md"></div>

              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-100 rounded-md"></div>
                <div className="h-4 w-3/4 bg-gray-100 rounded-md"></div>
                <div className="h-4 w-2/3 bg-gray-100 rounded-md"></div>
              </div>

              <div className="w-full h-48 bg-gray-100 rounded-xl"></div>

              <div className="flex items-center gap-6 mt-4 pt-2">
                <div className="h-4 w-12 bg-gray-100 rounded-md"></div>
                <div className="h-4 w-12 bg-gray-100 rounded-md"></div>
              </div>
            </div>
          ))
        ) : displayPosts?.length ? (
          displayPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              defaultPostColor={defaultPostColor || "null"}
              firebaseUser={firebaseUser}
              userData={userData}
              likedPosts={likedPosts}
              bookmarkedPosts={bookmarkedPosts}
              repostedPosts={repostedPosts}
              handleLike={onLike}
              handleBookmark={onBookmark}
              handleRepost={onRepost}
              getTextColor={getTextColor}
              getIconColor={getIconColor}
              getCommentColor={getCommentColor}
              getInitials={getInitials}
              router={router}
              onOpenInteractions={handleOpenInteractions}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-base font-bold text-gray-800">No posts found</p>
            <p className="text-xs text-gray-400 mt-1">Check back later or change your filter.</p>
          </div>
        )}
      </div>

      {/* Auto Infinite Scroll Sentinel Element */}
      <div ref={sentinelRef} className="py-8 flex justify-center items-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium shadow-xs">
            <Loader2 size={16} className="animate-spin text-gray-900" />
            <span>Loading more posts...</span>
          </div>
        )}
        {!hasMore && displayPosts && displayPosts.length > 0 && (
          <p className="text-xs font-semibold text-gray-400">You've reached the end of the feed.</p>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        firebaseUser={firebaseUser}
      />

      {/* Post Interactions List Breakdown Modal */}
      <PostInteractionsModal
        isOpen={interactionsModal.isOpen}
        onClose={() =>
          setInteractionsModal((prev) => ({ ...prev, isOpen: false }))
        }
        postId={interactionsModal.postId}
        postTitle={interactionsModal.postTitle}
        initialTab={interactionsModal.initialTab}
      />
    </div>
  );
}
