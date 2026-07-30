"use client";

import React, { useEffect, useState } from "react";
import { X, Heart, Repeat2, MessageCircle, Loader2, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface UserItem {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
  isVerified?: boolean;
  bio?: string;
}

interface CommentItem {
  _id: string;
  content: string;
  createdAt: string;
  author: UserItem;
}

interface PostInteractionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  initialTab?: "likes" | "reposts" | "comments";
  postTitle?: string;
}

export default function PostInteractionsModal({
  isOpen,
  onClose,
  postId,
  initialTab = "reposts",
  postTitle,
}: PostInteractionsModalProps) {
  const [activeTab, setActiveTab] = useState<"likes" | "reposts" | "comments">(initialTab);
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState<UserItem[]>([]);
  const [reposts, setReposts] = useState<UserItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchInteractions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/post/interactions-list?postId=${encodeURIComponent(postId)}`);
        const data = await res.json();
        if (res.ok) {
          setLikes(data.likes || []);
          setReposts(data.reposts || []);
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error("Failed to load post interactions list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [isOpen, postId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="font-extrabold text-lg text-gray-900 tracking-tight">Post Activity</h3>
            {postTitle && (
              <p className="text-xs text-gray-500 truncate max-w-xs font-medium">"{postTitle}"</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200/80 transition-colors text-gray-500 hover:text-gray-900 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
          <button
            onClick={() => setActiveTab("reposts")}
            className={`flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "reposts"
                ? "border-emerald-600 text-emerald-600 bg-emerald-50/30"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Repeat2 size={15} />
            <span>Reposts ({reposts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("likes")}
            className={`flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "likes"
                ? "border-rose-600 text-rose-600 bg-rose-50/30"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Heart size={15} />
            <span>Likes ({likes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "comments"
                ? "border-blue-600 text-blue-600 bg-blue-50/30"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <MessageCircle size={15} />
            <span>Comments ({comments.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar min-h-[250px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 size={24} className="animate-spin text-gray-900" />
              <span className="text-xs font-medium">Loading interactions...</span>
            </div>
          ) : activeTab === "reposts" ? (
            reposts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {reposts.map((user) => (
                  <Link
                    key={user._id}
                    href={`/user/${user.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 py-3 px-2 hover:bg-gray-50 rounded-2xl transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {user.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt={user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-sm text-gray-900 truncate">
                          {user.name}
                        </span>
                        {user.isVerified && (
                          <Check size={13} className="text-emerald-500 stroke-[3] flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-medium truncate block">
                        @{user.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <Repeat2 size={12} />
                      <span>Reposted</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
                <Repeat2 size={32} className="mb-2 opacity-30 text-gray-400" />
                <p className="text-sm font-bold text-gray-700">No reposts yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Be the first to share this piece with your followers!</p>
              </div>
            )
          ) : activeTab === "likes" ? (
            likes.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {likes.map((user) => (
                  <Link
                    key={user._id}
                    href={`/user/${user.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 py-3 px-2 hover:bg-gray-50 rounded-2xl transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {user.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt={user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-sm text-gray-900 truncate">
                          {user.name}
                        </span>
                        {user.isVerified && (
                          <Check size={13} className="text-emerald-500 stroke-[3] flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-medium truncate block">
                        @{user.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                      <Heart size={12} className="fill-rose-600" />
                      <span>Liked</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
                <Heart size={32} className="mb-2 opacity-30 text-gray-400" />
                <p className="text-sm font-bold text-gray-700">No likes yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Show some love to the author!</p>
              </div>
            )
          ) : comments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {comments.map((item) => (
                <div key={item._id} className="py-3 px-2 flex items-start gap-3">
                  <Link
                    href={`/user/${item.author?.username}`}
                    onClick={onClose}
                    className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mt-0.5"
                  >
                    {item.author?.profilePicture ? (
                      <Image
                        src={item.author.profilePicture}
                        alt={item.author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 text-xs">
                        {item.author?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/user/${item.author?.username}`}
                        onClick={onClose}
                        className="font-extrabold text-xs text-gray-900 hover:underline truncate"
                      >
                        {item.author?.name}
                      </Link>
                      <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 font-normal leading-relaxed mt-1 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
              <MessageCircle size={32} className="mb-2 opacity-30 text-gray-400" />
              <p className="text-sm font-bold text-gray-700">No comments yet</p>
              <p className="text-xs text-gray-400 mt-0.5">Start the conversation on this post!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
