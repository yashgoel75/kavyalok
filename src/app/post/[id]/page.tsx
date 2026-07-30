"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  Heart,
  Bookmark,
  MessageCircle,
  ArrowLeft,
  Share2,
  Clock,
  Send,
  CornerDownRight,
  UserCheck,
  UserPlus,
  Loader2,
  Tag,
  Copy,
  Repeat2,
} from "lucide-react";
import { getFirebaseToken } from "@/utils";
import PostCardModal from "@/components/post/PostCardModal";
import PostInteractionsModal from "@/components/dashboard/PostInteractionsModal";

interface Author {
  _id: string;
  name: string;
  username: string;
  email?: string;
  profilePicture?: string;
  isVerified: boolean;
}

interface Comment {
  _id: string;
  author: Author;
  content: string;
  likes: number;
  parentComment: string | null;
  createdAt: string;
  replies: Comment[];
}

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  author: Author;
  tags: string[];
  likes: number;
  repostCount?: number;
  repostedBy?: Author[];
  color: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const [organizedComments, setOrganizedComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPostCardOpen, setIsPostCardOpen] = useState(false);

  const [interactionsModal, setInteractionsModal] = useState<{
    isOpen: boolean;
    initialTab: "likes" | "reposts" | "comments";
  }>({
    isOpen: false,
    initialTab: "reposts",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setFirebaseUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (postId) fetchPost(postId);
  }, [postId]);

  const organizeComments = (comments: Comment[]): Comment[] => {
    const map: Record<string, Comment> = {};
    const roots: Comment[] = [];

    comments.forEach((c) => {
      map[c._id] = { ...c, replies: [] };
    });

    comments.forEach((c) => {
      if (c.parentComment) {
        const parent = map[c.parentComment];
        if (parent) parent.replies.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });

    return roots;
  };

  const fetchPost = async (id: string) => {
    try {
      const res = await fetch(`/api/post?postId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const mergedPost = {
        ...data.post,
        comments: data.comments || [],
      };

      setPost(mergedPost);
      setOrganizedComments(organizeComments(mergedPost.comments));

      if (firebaseUser?.email) {
        checkUserInteractions(id, firebaseUser.email, mergedPost.repostedBy);
        if (mergedPost.author?.email) {
          checkAuthorFollowStatus(mergedPost.author.email, firebaseUser.email);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkUserInteractions = async (postId: string, email: string, repostedBy?: Author[]) => {
    try {
      const token = await getFirebaseToken();
      const res = await fetch(
        `/api/interactions?email=${encodeURIComponent(
          email
        )}&postIds=${encodeURIComponent(JSON.stringify([postId]))}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.likes.includes(postId));
        setIsBookmarked(data.bookmarks.includes(postId));
      }

      if (repostedBy && Array.isArray(repostedBy)) {
        const hasUserReposted = repostedBy.some(
          (u) => u.email === email || u.username === firebaseUser?.displayName
        );
        setIsReposted(hasUserReposted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkAuthorFollowStatus = async (authorEmail: string, currentUserEmail: string) => {
    try {
      const res = await fetch(`/api/getuserfriends?email=${encodeURIComponent(currentUserEmail)}`);
      const data = await res.json();
      if (res.ok && data.user?.following) {
        setIsFollowingAuthor(data.user.following.includes(authorEmail));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowAuthor = async () => {
    if (!firebaseUser || !post?.author?.email) return;
    setIsFollowLoading(true);
    try {
      const token = await getFirebaseToken();
      const action = isFollowingAuthor ? "unfollow" : "follow";
      const res = await fetch(`/api/user/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentUserEmail: firebaseUser.email,
          targetEmail: post.author.email,
          action,
        }),
      });

      if (res.ok) {
        setIsFollowingAuthor(!isFollowingAuthor);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleLike = async () => {
    if (!firebaseUser || !post) return;

    setIsLiked((prev) => !prev);
    setPost((prev) =>
      prev ? { ...prev, likes: isLiked ? prev.likes - 1 : prev.likes + 1 } : prev
    );

    try {
      const token = await getFirebaseToken();
      const res = await fetch("/api/post/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: post._id, email: firebaseUser.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPost((prev) => (prev ? { ...prev, likes: data.likes } : prev));
    } catch (e) {
      console.error(e);
      setIsLiked((prev) => !prev);
    }
  };

  const handleBookmark = async () => {
    if (!firebaseUser || !post) return;

    setIsBookmarked((prev) => !prev);

    try {
      const token = await getFirebaseToken();
      const res = await fetch("/api/post/bookmark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: post._id, email: firebaseUser.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (e) {
      console.error(e);
      setIsBookmarked((prev) => !prev);
    }
  };

  const handleRepost = async () => {
    if (!firebaseUser || !post) return;

    const currentStatus = isReposted;
    setIsReposted(!currentStatus);
    setPost((prev) =>
      prev
        ? {
            ...prev,
            repostCount: currentStatus
              ? Math.max(0, (prev.repostCount || 1) - 1)
              : (prev.repostCount || 0) + 1,
          }
        : prev
    );

    try {
      const token = await getFirebaseToken();
      const res = await fetch("/api/post/repost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId: post._id, email: firebaseUser.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsReposted(data.isReposted);
      setPost((prev) =>
        prev ? { ...prev, repostCount: data.repostCount } : prev
      );
    } catch (e) {
      console.error(e);
      setIsReposted(currentStatus);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitComment = async () => {
    if (!firebaseUser || !post || !commentText.trim()) return;

    setIsSubmittingComment(true);

    try {
      const token = await getFirebaseToken();
      const res = await fetch("/api/post/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId: post._id,
          email: firebaseUser.email,
          content: commentText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data.comment] } : prev
      );

      setOrganizedComments((prev) => [
        ...prev,
        { ...data.comment, replies: [] },
      ]);

      setCommentText("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!firebaseUser || !post || !replyText.trim()) return;

    setIsSubmittingComment(true);

    try {
      const token = await getFirebaseToken();
      const res = await fetch("/api/post/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId: post._id,
          email: firebaseUser.email,
          content: replyText,
          parentComment: parentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data.comment] } : prev
      );

      setOrganizedComments((prev) => {
        const clone = structuredClone(prev);

        const insert = (list: Comment[]): boolean => {
          for (const c of list) {
            if (c._id === parentId) {
              c.replies.push({ ...data.comment, replies: [] });
              return true;
            }
            if (insert(c.replies)) return true;
          }
          return false;
        };

        insert(clone);
        return clone;
      });

      setReplyText("");
      setReplyTo(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getTextColor = (hex: string) => {
    if (!hex) return "#0f172a";
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#0f172a" : "#ffffff";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-12 w-full flex-1">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl animate-pulse space-y-6">
            <div className="h-8 w-64 bg-slate-200 rounded-md" />
            <div className="h-4 w-40 bg-slate-100 rounded-md" />
            <div className="h-64 w-full bg-slate-200 rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center bg-white p-10 rounded-3xl border border-slate-200 shadow-xl max-w-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Post Not Found</h2>
            <p className="text-slate-500 text-sm mb-6">The requested post does not exist or was removed.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const wordCount = post.content?.replace(/<[^>]*>?/gm, " ").split(/\s+/).filter(Boolean).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const textColor = getTextColor(post.color || "#ffffff");

  const hasReposts = post.repostedBy && post.repostedBy.length > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans selection:bg-slate-900 selection:text-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 w-full flex-1">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 mb-6 text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>

        {/* 70:30 Desktop Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          {/* Left Column (70% width = col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Post Reader Card */}
            <div
              style={{ backgroundColor: post.color || "#ffffff", color: textColor }}
              className="rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-6 transition-all"
            >
              {/* Repost Header Indicator */}
              {hasReposts && (
                <div
                  onClick={() =>
                    setInteractionsModal({ isOpen: true, initialTab: "reposts" })
                  }
                  className="flex items-center gap-2 text-xs font-bold opacity-85 pb-3 border-b border-black/10 cursor-pointer hover:opacity-100 transition-opacity"
                >
                  <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-600">
                    <Repeat2 size={13} className="stroke-[2.5]" />
                  </div>
                  <span>
                    Reposted by <span className="font-extrabold">@{post.repostedBy![0]?.username}</span>
                    {post.repostedBy!.length > 1 ? ` and ${post.repostedBy!.length - 1} others` : ""}
                  </span>
                </div>
              )}

              {/* Post Title */}
              <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                {post.title}
              </h1>

              {/* Author & Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4">
                <div
                  onClick={() => router.push(`/user/${post.author?.username}`)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-black/20 flex-shrink-0 bg-white/20">
                    {post.author?.profilePicture ? (
                      <Image
                        src={post.author.profilePicture}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-extrabold text-lg">
                        {post.author?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-extrabold text-sm sm:text-base group-hover:underline">
                        {post.author?.name}
                      </h4>
                      {post.author?.isVerified && (
                        <Check size={13} className="stroke-[3] text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs opacity-75 font-semibold">@{post.author?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold opacity-80">
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {readingTime} min read
                  </span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>

                  {firebaseUser?.email !== post.author?.email && (
                    <button
                      onClick={handleFollowAuthor}
                      disabled={isFollowLoading}
                      className={`ml-2 px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                        textColor !== "#ffffff"
                          ? "bg-black/10 hover:bg-black/20 text-slate-900"
                          : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
                      }`}
                    >
                      {isFollowLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : isFollowingAuthor ? (
                        <>
                          <UserCheck size={13} />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Cover Picture */}
              {post.picture && (
                <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-black/10">
                  <Image src={post.picture} alt={post.title} fill className="object-cover" />
                </div>
              )}

              {/* Article Content */}
              <div
                className="text-base sm:text-lg leading-relaxed font-normal space-y-4 pt-2"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-black/10">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        textColor !== "#ffffff"
                          ? "bg-black/10 text-slate-900"
                          : "bg-white/15 text-white border border-white/20"
                      }`}
                    >
                      <Tag size={11} />
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Interactive Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/10">
                <div className="flex items-center gap-3">
                  {/* Like Button */}
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                      isLiked
                        ? textColor === "#ffffff"
                          ? "bg-white text-slate-900 shadow-md"
                          : "bg-rose-600 text-white shadow-md"
                        : textColor !== "#ffffff"
                        ? "bg-black/10 hover:bg-black/20 text-slate-900"
                        : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
                    }`}
                  >
                    <Heart
                      size={16}
                      className={
                        isLiked
                          ? textColor === "#ffffff"
                            ? "fill-slate-900 text-slate-900"
                            : "fill-white text-white"
                          : ""
                      }
                    />
                    <span>{post.likes || 0}</span>
                  </button>

                  {/* Repost Button */}
                  <button
                    onClick={handleRepost}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                      isReposted
                        ? "bg-emerald-600 text-white shadow-md"
                        : textColor !== "#ffffff"
                        ? "bg-black/10 hover:bg-black/20 text-slate-900"
                        : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
                    }`}
                    title={isReposted ? "Undo Repost" : "Repost Piece"}
                  >
                    <Repeat2 size={16} className={isReposted ? "stroke-[2.5]" : ""} />
                    <span>{post.repostCount || 0}</span>
                  </button>

                  {/* Bookmark Button */}
                  <button
                    onClick={handleBookmark}
                    className={`p-2.5 rounded-2xl font-extrabold transition-all active:scale-95 cursor-pointer ${
                      isBookmarked
                        ? "bg-amber-600 text-white shadow-md"
                        : textColor !== "#ffffff"
                        ? "bg-black/10 hover:bg-black/20 text-slate-900"
                        : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
                    }`}
                    title={isBookmarked ? "Bookmarked" : "Bookmark Post"}
                  >
                    <Bookmark size={16} className={isBookmarked ? "fill-white" : ""} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setInteractionsModal({ isOpen: true, initialTab: "reposts" })
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-black/10 hover:bg-black/20 text-xs font-extrabold transition-all cursor-pointer"
                    title="View all interactions"
                  >
                    <span>Interactions</span>
                  </button>

                  <button
                    onClick={() => setIsPostCardOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-md hover:bg-slate-800"
                  >
                    <Share2 size={15} />
                    <span>Share Card</span>
                  </button>

                  <button
                    onClick={copyLink}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                      textColor !== "#ffffff"
                        ? "bg-black/10 hover:bg-black/20 text-slate-900"
                        : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
                    }`}
                  >
                    <Copy size={15} />
                    <span>{copiedLink ? "Copied!" : "Link"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (30% width = col-span-3) - Discussion & Comments */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg space-y-5 lg:sticky lg:top-20">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div
                  onClick={() =>
                    setInteractionsModal({ isOpen: true, initialTab: "comments" })
                  }
                  className="flex items-center gap-2 font-extrabold text-slate-900 text-base cursor-pointer hover:underline"
                >
                  <MessageCircle size={18} />
                  <span>Discussion ({post.comments?.length || 0})</span>
                </div>
              </div>

              {/* Add Comment Input */}
              {firebaseUser ? (
                <div className="space-y-3">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts on this piece..."
                    className="w-full p-3 rounded-2xl text-xs font-medium bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingComment ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Post Comment</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-center">
                  <p className="text-xs text-slate-500 font-medium mb-2">Log in to join the conversation.</p>
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
                  >
                    Log In
                  </button>
                </div>
              )}

              {/* Comment Thread List */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pt-2">
                {organizedComments.length > 0 ? (
                  organizedComments.map((comment) => (
                    <div key={comment._id} className="space-y-2 text-xs border-b border-slate-100 pb-3 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden flex-shrink-0">
                            {comment.author?.profilePicture ? (
                              <Image src={comment.author.profilePicture} alt={comment.author.name} width={28} height={28} className="object-cover" />
                            ) : (
                              comment.author?.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{comment.author?.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">@{comment.author?.username}</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-700 font-normal leading-relaxed pl-9">{comment.content}</p>

                      {/* Reply Button */}
                      {firebaseUser && (
                        <div className="pl-9 pt-1">
                          <button
                            onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            {replyTo === comment._id ? "Cancel" : "Reply"}
                          </button>

                          {replyTo === comment._id && (
                            <div className="mt-2 space-y-2">
                              <textarea
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full p-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none"
                              />
                              <button
                                onClick={() => handleSubmitReply(comment._id)}
                                disabled={isSubmittingComment || !replyText.trim()}
                                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
                              >
                                Submit Reply
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-6 space-y-2 border-l-2 border-slate-100 mt-2">
                          {comment.replies.map((reply) => (
                            <div key={reply._id} className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <CornerDownRight size={11} className="text-slate-400" />
                                <span className="font-extrabold text-slate-900 text-[11px]">{reply.author?.name}</span>
                              </div>
                              <p className="text-slate-600 font-normal pl-4">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4 font-medium">No comments yet. Be the first to share your thoughts!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {post && (
        <PostCardModal
          isOpen={isPostCardOpen}
          onClose={() => setIsPostCardOpen(false)}
          post={{
            id: post._id,
            title: post.title,
            content: post.content,
            picture: post.picture,
            likes: post.likes,
            color: post.color,
            createdAt: post.createdAt,
            author: {
              name: post.author?.name || "Writer",
              username: post.author?.username || "writer",
              profilePicture: post.author?.profilePicture,
              isVerified: post.author?.isVerified,
            },
          }}
        />
      )}

      {/* Interactions Breakdown Modal */}
      {post && (
        <PostInteractionsModal
          isOpen={interactionsModal.isOpen}
          onClose={() =>
            setInteractionsModal((prev) => ({ ...prev, isOpen: false }))
          }
          postId={post._id}
          postTitle={post.title}
          initialTab={interactionsModal.initialTab}
        />
      )}

      <Navigation />
      <Footer />
    </div>
  );
}
