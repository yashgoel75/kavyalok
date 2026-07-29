"use client";
import React, { useState } from "react";
import { Check, MessageCircle, Send, Repeat2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getCommentColor } from "@/lib/utils";
import { User } from "@/context/UserContext";

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
  repostedBy?: string[];
  isRepost?: boolean;
  originalPost?: string;
  repostedByAuthor?: User;
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
  getTextColor,
  getIconColor,
  getInitials,
  router,
}: PostCardProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const readingTime = Math.ceil(post.content.split(" ").length / 200);

  const activeColor =
    defaultPostColor && defaultPostColor !== "null"
      ? defaultPostColor
      : post.color || "#ffffff";

  const [copied, setCopied] = useState(false);

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

  const isRepostedByUser = !!repostedPosts[post._id];

  return (
    <div
      key={post._id}
      style={{
        backgroundColor: activeColor,
        color: getTextColor(activeColor),
      }}
      onClick={() => {
        showShareOptions ? setShowShareOptions(false) : null;
      }}
      className="bg-white relative p-5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col"
    >
      {/* Repost Header Indicator */}
      {post.isRepost && (
        <div className="flex items-center gap-1.5 text-xs font-extrabold opacity-75 mb-3 border-b border-black/10 pb-2">
          <Repeat2 size={13} className="text-emerald-600" />
          <span>Reposted by @{post.repostedByAuthor?.username || "writer"}</span>
        </div>
      )}

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
                className={`rounded-full object-cover w-11 h-11 ${
                  String(post.author.isVerified) == "true"
                    ? "border-2 border-green-700"
                    : ""
                }`}
              />

              {post.author.isVerified && (
                <div
                  title="Verified"
                  className="absolute bottom-0 -right-1 bg-green-700 rounded-full p-1 flex items-center justify-center"
                >
                  <Check color="white" size={12} />
                </div>
              )}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-sm">
              {getInitials(post.author.name)}
            </div>
          )}
          <span className="font-medium">{post.author.name}</span>
        </div>
      </div>

      <div
        className="flex-grow cursor-pointer"
        onClick={() => {
          showShareOptions
            ? setShowShareOptions(false)
            : router.push(`/post/${post._id}`);
        }}
      >
        <h4 className="text-xl font-semibold mb-2">{post.title}</h4>
        <span className="text-xs mb-2 block">{readingTime} min read</span>
        <p
          className="text-sm mb-3 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html:
              post.content?.length > 120
                ? post.content.slice(0, 120) + "..."
                : post.content,
          }}
        ></p>

        {post.picture && (
          <div className="relative w-full h-48 mb-3 rounded-md overflow-hidden">
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

      <div
        className="flex items-center justify-between w-full mt-4 pt-3 border-t text-sm"
        style={{
          borderColor: getTextColor(activeColor) + "20",
        }}
      >
        <div className="flex gap-3 items-center">
          {/* Like Button */}
          <button
            onClick={() => handleLike(post._id)}
            disabled={!firebaseUser}
            className="flex items-center gap-1.5 transition-transform hover:scale-110 disabled:cursor-not-allowed cursor-pointer"
            style={{
              color: getIconColor(activeColor, likedPosts[post._id]),
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill={
                likedPosts[post._id]
                  ? getIconColor(activeColor, true)
                  : "none"
              }
              stroke={getIconColor(activeColor, likedPosts[post._id])}
              strokeWidth="1.5"
              className="h-5 w-5 transition-all duration-200"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-bold">{post.likes}</span>
          </button>

          {/* Comment Count */}
          <div className="flex items-center gap-1">
            <MessageCircle
              color={getCommentColor(activeColor)}
              size={17}
              strokeWidth="1.5"
            />
            <span
              style={{ color: getCommentColor(activeColor) }}
              className="text-xs font-bold"
            >
              {post.comments?.length || 0}
            </span>
          </div>

          {/* Repost Button */}
          {handleRepost && (
            <button
              onClick={() => handleRepost(post._id)}
              disabled={!firebaseUser}
              className={`flex items-center gap-1 transition-transform hover:scale-110 disabled:cursor-not-allowed cursor-pointer ${
                isRepostedByUser ? "text-emerald-600 font-extrabold" : ""
              }`}
              title={isRepostedByUser ? "Undo Repost" : "Repost"}
            >
              <Repeat2
                size={17}
                strokeWidth={isRepostedByUser ? 2.5 : 1.5}
                className={isRepostedByUser ? "text-emerald-600" : ""}
              />
              <span className="text-xs font-bold">{post.repostCount || 0}</span>
            </button>
          )}

          {/* Bookmark Button */}
          <button
            onClick={() => handleBookmark(post._id)}
            disabled={!firebaseUser}
            className={`flex items-center hover:scale-110 transition-transform disabled:cursor-not-allowed cursor-pointer ${
              bookmarkedPosts[post._id] ? "text-yellow-500" : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill={bookmarkedPosts[post._id] ? "currentColor" : "none"}
              stroke={
                bookmarkedPosts[post._id]
                  ? "currentColor"
                  : getCommentColor(activeColor)
              }
              strokeWidth="1.5"
            >
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center relative">
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="hover:scale-110 transition-transform cursor-pointer"
          >
            <Send className="h-5 w-5" />
          </button>

          {showShareOptions && (
            <div
              className="absolute bottom-10 right-0 w-36 rounded-xl shadow-xl p-1 flex flex-col gap-2 text-sm animate-fadeIn z-50"
              style={{
                backgroundColor: getTextColor(activeColor),
                color: getBackgroundColor(
                  getTextColor(activeColor)
                ),
              }}
            >
              <button
                className="py-1 px-2 rounded-md hover:bg-black/10 transition"
                onClick={() => handleShare("whatsapp")}
              >
                WhatsApp
              </button>

              <button
                className="py-1 px-2 rounded-md hover:bg-black/10 transition"
                onClick={() => handleShare("copy")}
              >
                Copy Link
              </button>
            </div>
          )}
          {copied && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-3 rounded-full shadow-lg animate-fadeIn z-50">
              Copied!
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
