"use client";

import { useState, useEffect, useCallback } from "react";
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
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { getFirebaseToken } from "@/utils";

interface Author {
  _id: string;
  name: string;
  username: string;
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
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setFirebaseUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (postId) fetchPost(postId);
  }, [postId]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        checkUserInteractions(id, firebaseUser.email);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkUserInteractions = async (postId: string, email: string) => {
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async () => {
    if (!firebaseUser || !post) return;

    // Optimistic update
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
      // Revert on error
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          url: window.location.href,
        });
      } catch (err) {
        copyLink();
      }
    } else {
      copyLink();
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

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const getTextColor = (hex: string) => {
    if (!hex) return "#000000";
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#0f172a" : "#ffffff";
  };

  const renderComment = useCallback(
    (comment: Comment, level = 0) => (
      <motion.div
        key={comment._id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`${
          level > 0 ? "ml-4 sm:ml-8 mt-3 border-l-2 border-amber-200/60 pl-3 sm:pl-4" : "mt-6"
        }`}
      >
        <div className="flex items-start gap-3 group">
          <div
            className="flex-shrink-0 cursor-pointer relative"
            onClick={() => router.push(`/user/${comment.author.username}`)}
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 ring-amber-500/20 group-hover:ring-amber-500/50 transition-all">
              {comment.author.profilePicture ? (
                <Image
                  src={comment.author.profilePicture}
                  alt={comment.author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#bd9864] to-[#dbb56a] text-xs sm:text-sm font-semibold text-white">
                  {getInitials(comment.author.name)}
                </div>
              )}
            </div>
            {comment.author.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-amber-600 rounded-full p-[2px] ring-2 ring-white">
                <Check size={8} className="text-white stroke-[3]" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 bg-slate-50/80 hover:bg-slate-100/80 transition-colors p-3.5 rounded-2xl border border-slate-200/60">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="font-semibold text-slate-900 text-sm cursor-pointer hover:underline"
                  onClick={() => router.push(`/user/${comment.author._id}`)}
                >
                  {comment.author.name}
                </span>
                <span className="text-slate-500 text-xs font-medium">
                  @{comment.author.username}
                </span>
              </div>
              <span className="text-slate-400 text-[11px]">
                {new Date(comment.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {comment.content}
            </p>

            <div className="flex items-center gap-4 mt-2.5 pt-1">
              <button
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-700 font-medium transition-colors"
                onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
              >
                <CornerDownRight size={13} />
                <span>{replyTo === comment._id ? "Cancel" : "Reply"}</span>
              </button>
            </div>

            {replyTo === comment._id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-slate-200/80"
              >
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to @${comment.author.username}...`}
                  className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none transition-all resize-none"
                  rows={2}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setReplyTo(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitReply(comment._id)}
                    disabled={!replyText.trim() || isSubmittingComment}
                    className="px-4 py-1.5 bg-[#bd9864] hover:bg-[#a68250] active:scale-95 text-white font-medium text-xs rounded-lg disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    <Send size={12} />
                    <span>{isSubmittingComment ? "Replying..." : "Reply"}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {comment.replies?.map((reply) => renderComment(reply, level + 1))}
          </div>
        </div>
      </motion.div>
    ),
    [replyTo, replyText, isSubmittingComment, firebaseUser, router]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12 w-full flex-1">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-200 rounded-full" />
              <div className="space-y-2">
                <div className="w-36 h-5 bg-slate-200 rounded-md" />
                <div className="w-24 h-4 bg-slate-100 rounded-md" />
              </div>
            </div>
            <div className="w-3/4 h-10 bg-slate-200 rounded-lg" />
            <div className="w-full h-80 bg-slate-200 rounded-2xl" />
            <div className="space-y-3">
              <div className="w-full h-4 bg-slate-200 rounded" />
              <div className="w-5/6 h-4 bg-slate-200 rounded" />
              <div className="w-2/3 h-4 bg-slate-100 rounded" />
            </div>
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
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Post Not Found</h2>
            <p className="text-slate-500 text-sm mb-6">
              The post you are looking for might have been deleted or does not exist.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 bg-[#bd9864] text-white rounded-xl font-semibold hover:bg-[#a58150] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const textColor = getTextColor(post.color || "#ffffff");
  const readingTime = Math.max(
    1,
    Math.ceil((post.content?.replace(/<[^>]*>?/gm, "").split(/\s+/).length || 0) / 200)
  );

  const cardBgStyle = post.color
    ? { backgroundColor: post.color, color: textColor }
    : { backgroundColor: "#ffffff", color: "#0f172a" };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-amber-500/30">
      {/* Top Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 z-50 origin-left"
        style={{ scaleX: scrollProgress / 100 }}
      />

      <Header />

      {/* Hero Ambient Backdrop */}
      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 flex-1">
        {/* Soft background aura using post color */}
        <div
          className="absolute inset-0 top-12 blur-3xl opacity-20 pointer-events-none rounded-full"
          style={{
            background: post.color
              ? `radial-gradient(circle, ${post.color} 0%, transparent 70%)`
              : "radial-gradient(circle, #bd9864 0%, transparent 70%)",
          }}
        />

        {/* Top Floating Control Bar */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/80 rounded-2xl text-slate-700 font-medium text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/80 rounded-2xl text-slate-700 font-medium text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Article Container */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={cardBgStyle}
          className="relative z-10 rounded-3xl shadow-2xl border border-slate-200/60 p-6 sm:p-10 mb-8 overflow-hidden backdrop-blur-xl"
        >
          {/* Header Metadata */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-black/10 dark:border-white/10 mb-8">
            <div
              className="flex items-center gap-3.5 cursor-pointer group"
              onClick={() => router.push(`/user/${post.author.username}`)}
            >
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden ring-4 ring-black/5 dark:ring-white/10 group-hover:ring-amber-500 transition-all">
                {post.author.profilePicture ? (
                  <Image
                    src={post.author.profilePicture}
                    fill
                    alt={post.author.name}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#bd9864] to-[#dbb56a] text-white text-lg font-bold">
                    {getInitials(post.author.name)}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base sm:text-lg group-hover:underline">
                    {post.author.name}
                  </h3>
                  {post.author.isVerified && (
                    <div className="bg-emerald-500 text-white p-0.5 rounded-full">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm opacity-70 font-medium">
                  @{post.author.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium opacity-75 bg-black/5 dark:bg-white/10 px-3.5 py-1.5 rounded-full">
              <span>{new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {readingTime} min read
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Hero Image */}
          {post.picture && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="relative w-full h-[320px] sm:h-[450px] rounded-2xl overflow-hidden mb-8 shadow-lg ring-1 ring-black/10"
            >
              <Image
                src={post.picture}
                alt={post.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                priority
              />
            </motion.div>
          )}

          {/* Content Body */}
          <div
            className="prose prose-slate max-w-none mb-8 text-base sm:text-lg leading-relaxed font-normal"
            style={{ color: textColor }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-8 pt-4 border-t border-black/10 dark:border-white/10">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3.5 py-1.5 rounded-full bg-black/10 dark:bg-white/15 text-xs sm:text-sm font-semibold tracking-wide hover:bg-black/20 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Aceternity Style Floating Action Bar Inside Article */}
          <div className="flex items-center justify-between pt-6 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all font-semibold text-sm ${
                  isLiked
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105"
                    : "bg-black/5 dark:bg-white/10 hover:bg-black/10"
                } active:scale-95`}
              >
                <Heart
                  size={18}
                  className={`${isLiked ? "fill-white" : "fill-none"}`}
                />
                <span>{post.likes}</span>
              </button>

              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all font-semibold text-sm ${
                  isBookmarked
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105"
                    : "bg-black/5 dark:bg-white/10 hover:bg-black/10"
                } active:scale-95`}
              >
                <Bookmark
                  size={18}
                  className={`${isBookmarked ? "fill-white" : "fill-none"}`}
                />
                <span>{isBookmarked ? "Saved" : "Save"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold opacity-80 px-4 py-2 rounded-2xl bg-black/5 dark:bg-white/10">
              <MessageCircle size={18} />
              <span>{post.comments?.length || 0} Comments</span>
            </div>
          </div>
        </motion.article>

        {/* Comment Section Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="relative z-10 bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10"
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Discussion
              </h2>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                {post.comments?.length || 0}
              </span>
            </div>
          </div>

          {/* New Comment Input Drawer */}
          {firebaseUser ? (
            <div className="mb-10 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#bd9864] to-[#dbb56a] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {getInitials(firebaseUser.displayName || firebaseUser.email || "Me")}
                </div>
                <div className="flex-1 space-y-3">
                  <textarea
                    className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all resize-none"
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts on this poem/post..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="px-5 py-2 bg-[#bd9864] hover:bg-[#a68250] active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      <Send size={14} />
                      <span>{isSubmittingComment ? "Posting..." : "Post Comment"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-slate-50 rounded-2xl text-center border border-slate-200/80">
              <p className="text-slate-600 text-sm font-medium">
                Log in to join the discussion and leave a comment.
              </p>
            </div>
          )}

          {/* Render Comment Tree */}
          {organizedComments.length > 0 ? (
            <div className="space-y-4">
              {organizedComments.map((c) => renderComment(c))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <MessageCircle size={32} className="mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-medium">No comments yet. Be the first to start the conversation!</p>
            </div>
          )}
        </motion.div>
      </div>

      <Navigation />
      <Footer />
    </div>
  );
}
