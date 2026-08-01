"use client";

import React, { useState } from "react";
import { Check, MessageCircle, Send, Repeat2, Bookmark } from "lucide-react";
import Image from "next/image";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { User } from "@/context/UserContext";
import { getTextColor, getIconColor, getCommentColor, getRepostColor, getBookmarkColor } from "@/lib/utils";

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  author: User;
  likes: number;
  comments: [string];
  color: string;
  repostCount?: number;
  repostedBy?: any[];
  isRepost?: boolean;
  originalPost?: string;
  repostedByAuthor?: User;
  repostedByAuthors?: User[];
}

interface PostCardProps {
  post: Post;
  firebaseUser: object | null;
  userData: User | null;
  likedPosts: Record<string, boolean>;
  bookmarkedPosts: Record<string, boolean>;
  repostedPosts?: Record<string, boolean>;
  defaultPostColor: string;
  handleLike: (id: string) => void;
  handleBookmark: (id: string) => void;
  handleRepost?: (id: string) => void;
  getTextColor: (color: string) => string;
  getIconColor: (color: string, isLiked: boolean) => string;
  getCommentColor: (color: string) => string;
  getInitials: (name: string) => string;
  router: AppRouterInstance;
  onOpenInteractions?: (tab: "likes" | "reposts" | "comments", postId: string, title: string) => void;
}

export default React.memo(function PostCard({
  post,
  firebaseUser,
  userData,
  likedPosts,
  bookmarkedPosts,
  repostedPosts = {},
  defaultPostColor,
  handleLike,
  handleBookmark,
  handleRepost,
  getInitials,
  router,
  onOpenInteractions,
}: PostCardProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const readingTime = Math.ceil((post.content || "").split(" ").length / 200);

  const activeColor =
    defaultPostColor && defaultPostColor !== "null"
      ? defaultPostColor
      : post.color || "#ffffff";

  const [copied, setCopied] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const isLiked = !!likedPosts[post._id];
  const isBookmarked = !!bookmarkedPosts[post._id];
  const isRepostedByUser = !!repostedPosts[post._id];

  const getBackgroundColor = (textColor: string) =>
    textColor === "#000000" ? "#ffffff" : "#000000";

  const handleShare = (platform: string) => {
    const postUrl = `${window.location.origin}/post/${post._id}`;

    if (platform === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(postUrl)}`,
        "_blank"
      );
    } else if (platform === "copy") {
      navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    setShowShareOptions(false);
  };

  const triggerLikeWithAnim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firebaseUser) return;
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 300);
    handleLike(post._id);
  };

  const hasReposts =
    (post.repostedBy && post.repostedBy.length > 0) ||
    (post.repostedByAuthors && post.repostedByAuthors.length > 0) ||
    post.repostedByAuthor;

  const topReposterName =
    post.repostedByAuthor?.username ||
    post.repostedByAuthors?.[0]?.username ||
    (typeof post.repostedBy?.[0] === "object" ? (post.repostedBy[0] as any).username : null) ||
    "writer";

  const totalReposters = post.repostCount || post.repostedByAuthors?.length || (hasReposts ? 1 : 0);

  const textColor = getTextColor(activeColor);
  const isWhiteText = textColor === "#ffffff";

  const heartColor = getIconColor(activeColor, isLiked);
  const commentColor = getCommentColor(activeColor);
  const repostColor = getRepostColor(activeColor, isRepostedByUser);
  const bookmarkColor = getBookmarkColor(activeColor, isBookmarked);

  const reposterUsername =
    (post.repostedBy && post.repostedBy.length > 0 && post.repostedBy[post.repostedBy.length - 1]?.username) ||
    topReposterName;

  const reposterExtraCount =
    post.repostedBy && post.repostedBy.length > 1 ? post.repostedBy.length - 1 : 0;

  return (
    <div
      key={post._id}
      style={{
        backgroundColor: activeColor,
        color: textColor,
      }}
      onClick={() => {
        if (showShareOptions) setShowShareOptions(false);
      }}
      className="bg-white relative p-5 sm:p-6 rounded-3xl shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col justify-between border border-black/5 hover:-translate-y-0.5"
    >
      <div>
        {/* Adaptive High Contrast Repost Header Badge */}
        {hasReposts && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenInteractions?.("reposts", post._id, post.title);
            }}
            className={`flex items-center gap-2 text-xs font-bold mb-3.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isWhiteText
                ? "bg-white/20 text-white border-white/30 hover:bg-white/30"
                : "bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100/80"
            }`}
            title="View who reposted this"
          >
            <div
              className={`p-1 rounded-full flex items-center justify-center ${
                isWhiteText ? "bg-white/30 text-white" : "bg-emerald-600 text-white"
              }`}
            >
              <Repeat2 size={12} className="stroke-[2.5]" />
            </div>
            <span className="truncate">
              Reposted by <span className="font-extrabold">@{reposterUsername}</span>
              {reposterExtraCount > 0 ? ` and ${reposterExtraCount} others` : ""}
            </span>
          </div>
        )}

        {/* Author Header */}
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              showShareOptions
                ? setShowShareOptions(false)
                : router.push(`/user/${post.author.username}`);
            }}
          >
            {post.author.profilePicture ? (
              <div className="relative">
                <Image
                  loading="lazy"
                  src={post.author.profilePicture}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className={`rounded-full object-cover w-10 h-10 ${
                    String(post.author.isVerified) === "true"
                      ? isWhiteText
                        ? "border-2 border-white"
                        : "border-2 border-emerald-600"
                      : ""
                  }`}
                />

                {post.author.isVerified && (
                  <div
                    title="Verified"
                    className={`absolute -bottom-0.5 -right-1 rounded-full p-0.5 flex items-center justify-center ${
                      isWhiteText ? "bg-white text-black" : "bg-emerald-600 text-white"
                    }`}
                  >
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-sm">
                {getInitials(post.author.name)}
              </div>
            )}
            <div>
              <span className="font-extrabold text-sm block leading-tight">{post.author.name}</span>
              <span className="text-[11px] opacity-75 block font-medium">@{post.author.username}</span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div
          className="flex-grow cursor-pointer"
          onClick={() => {
            showShareOptions
              ? setShowShareOptions(false)
              : router.push(`/post/${post._id}`);
          }}
        >
          <h4 className="text-xl font-bold mb-1.5 leading-snug">{post.title}</h4>
          <span className="text-[11px] mb-2 block font-medium opacity-75">{readingTime} min read</span>
          <p
            className="text-sm mb-3 leading-relaxed font-normal opacity-90"
            dangerouslySetInnerHTML={{
              __html:
                post.content?.length > 120
                  ? post.content.slice(0, 120) + "..."
                  : post.content,
            }}
          ></p>

          {post.picture && (
            <div className="relative w-full h-48 mb-3 rounded-xl overflow-hidden shadow-xs border border-black/5">
              <Image
                loading="lazy"
                src={post.picture}
                alt="Post image"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* High Quality Action Bar with High Contrast Matching */}
      <div
        className="flex items-center justify-between w-full mt-4 pt-3 border-t text-sm"
        style={{
          borderColor: isWhiteText ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Left Action Buttons */}
        <div className="flex items-center gap-5 sm:gap-5">
          {/* 1. Like Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={triggerLikeWithAnim}
              disabled={!firebaseUser}
              className={`transition-all duration-200 active:scale-75 disabled:cursor-not-allowed cursor-pointer ${
                heartAnim ? "scale-125" : "hover:scale-110"
              }`}
              title={isLiked ? "Unlike" : "Like"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isLiked ? heartColor : "none"}
                stroke={heartColor}
                strokeWidth="1.8"
                className="h-5 w-5 transition-colors duration-200"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>

            {/* <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInteractions?.("likes", post._id, post.title);
              }}
              className="text-xs font-bold hover:underline cursor-pointer"
              style={{ color: textColor }}
              title="See who liked"
            >
              {post.likes || 0}
            </button> */}
          </div>

          {/* 2. Comment Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInteractions?.("comments", post._id, post.title);
              }}
              className="hover:scale-110 transition-transform active:scale-90 cursor-pointer"
              title="Comments"
            >
              <MessageCircle
                color={commentColor}
                size={19}
                strokeWidth="1.8"
              />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInteractions?.("comments", post._id, post.title);
              }}
              className="text-xs font-bold hover:underline cursor-pointer"
              style={{ color: textColor }}
              title="See comments"
            >
              {post.comments?.length || 0}
            </button>
          </div>

          {/* 3. Repost Button */}
          {handleRepost && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRepost(post._id);
                }}
                disabled={!firebaseUser}
                className="hover:scale-110 transition-transform active:scale-90 disabled:cursor-not-allowed cursor-pointer"
                title={isRepostedByUser ? "Undo Repost" : "Repost"}
              >
                <Repeat2
                  size={19}
                  strokeWidth={isRepostedByUser ? 2.5 : 1.8}
                  color={repostColor}
                />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInteractions?.("reposts", post._id, post.title);
                }}
                className={`text-xs font-bold hover:underline cursor-pointer ${
                  isRepostedByUser ? "font-extrabold" : ""
                }`}
                style={{ color: isRepostedByUser ? repostColor : textColor }}
                title="See who reposted"
              >
                {post.repostCount || 0}
              </button>
            </div>
          )}
        </div>

        {/* Right Action Buttons: Bookmark & Share */}
        <div className="flex items-center gap-4">
          {/* 4. Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark(post._id);
            }}
            disabled={!firebaseUser}
            className="hover:scale-110 transition-transform active:scale-90 disabled:cursor-not-allowed cursor-pointer"
            title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
          >
            <Bookmark
              size={18}
              strokeWidth="1.8"
              fill={isBookmarked ? bookmarkColor : "none"}
              color={bookmarkColor}
            />
          </button>

          {/* 5. Share Button */}
          <div className="relative flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareOptions(!showShareOptions);
              }}
              className="hover:scale-110 transition-transform active:scale-90 cursor-pointer"
              title="Share"
            >
              <Send
                size={18}
                strokeWidth="1.8"
                color={commentColor}
              />
            </button>

            {showShareOptions && (
              <div
                className="absolute bottom-9 right-0 w-36 rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 text-xs font-bold animate-fadeIn z-50 border border-black/10"
                style={{
                  backgroundColor: textColor,
                  color: getBackgroundColor(textColor),
                }}
              >
                <button
                  className="py-1.5 px-2.5 rounded-xl hover:bg-black/10 transition text-left cursor-pointer"
                  onClick={() => handleShare("whatsapp")}
                >
                  WhatsApp
                </button>

                <button
                  className="py-1.5 px-2.5 rounded-xl hover:bg-black/10 transition text-left cursor-pointer"
                  onClick={() => handleShare("copy")}
                >
                  Copy Link
                </button>
              </div>
            )}
            {copied && (
              <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-black text-white text-[11px] font-bold py-1 px-3 rounded-full shadow-lg animate-fadeIn z-50 whitespace-nowrap">
                Copied!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
