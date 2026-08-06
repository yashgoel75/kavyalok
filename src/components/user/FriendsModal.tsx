"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Search, Users, UserCheck, UserPlus, Loader2 } from "lucide-react";
import { getFirebaseToken } from "@/utils";
import { User as FirebaseUser } from "firebase/auth";
import { useInfiniteQuery } from "@tanstack/react-query";

interface Friend {
  name: string;
  username: string;
  profilePicture?: string;
  email: string;
  isVerified?: boolean;
}

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEmail: string;
  targetUsername?: string;
  currentFirebaseUser: FirebaseUser | null;
  initialTab?: "followers" | "following";
}

const PAGE_SIZE = 9;

export default function FriendsModal({
  isOpen,
  onClose,
  targetEmail,
  targetUsername,
  currentFirebaseUser,
  initialTab = "followers",
}: FriendsModalProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery("");
    }
  }, [isOpen, initialTab]);

  // Fetch Current User's following list (for follow/unfollow toggle status)
  const fetchCurrentUserFollowing = useCallback(async () => {
    if (!currentFirebaseUser?.email) return;
    try {
      const res = await fetch(`/api/getuserfriends?email=${encodeURIComponent(currentFirebaseUser.email)}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUserFollowing(data.user.following || []);
      }
    } catch (err) {
      console.error("Failed to fetch current user following:", err);
    }
  }, [currentFirebaseUser?.email]);

  useEffect(() => {
    if (isOpen) {
      fetchCurrentUserFollowing();
    }
  }, [isOpen, fetchCurrentUserFollowing]);

  // React Query Infinite Followers Query
  const {
    data: followersData,
    fetchNextPage: fetchNextFollowers,
    hasNextPage: hasNextFollowers,
    isFetchingNextPage: isFetchingNextFollowers,
    isLoading: isLoadingFollowers,
  } = useInfiniteQuery({
    queryKey: ["user-followers", targetEmail],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/user/followers?email=${encodeURIComponent(targetEmail)}&page=${pageParam}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load followers");
      return data;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isOpen && !!targetEmail && activeTab === "followers",
  });

  // React Query Infinite Following Query
  const {
    data: followingData,
    fetchNextPage: fetchNextFollowing,
    hasNextPage: hasNextFollowing,
    isFetchingNextPage: isFetchingNextFollowing,
    isLoading: isLoadingFollowing,
  } = useInfiniteQuery({
    queryKey: ["user-following", targetEmail],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/user/following?email=${encodeURIComponent(targetEmail)}&page=${pageParam}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load following");
      return data;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isOpen && !!targetEmail && activeTab === "following",
  });

  const followersList = useMemo(() => {
    return followersData?.pages.flatMap((page) => page.users || []) || [];
  }, [followersData]);

  const followingList = useMemo(() => {
    return followingData?.pages.flatMap((page) => page.users || []) || [];
  }, [followingData]);

  const totalFollowers = followersData?.pages[0]?.total || 0;
  const totalFollowing = followingData?.pages[0]?.total || 0;

  // Automatic Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "followers" && hasNextFollowers && !isFetchingNextFollowers) {
            fetchNextFollowers();
          } else if (activeTab === "following" && hasNextFollowing && !isFetchingNextFollowing) {
            fetchNextFollowing();
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [
    isOpen,
    activeTab,
    hasNextFollowers,
    isFetchingNextFollowers,
    fetchNextFollowers,
    hasNextFollowing,
    isFetchingNextFollowing,
    fetchNextFollowing,
  ]);

  const handleFollowToggle = async (friendEmail: string) => {
    if (!currentFirebaseUser) {
      router.push("/auth/login");
      return;
    }

    const isCurrentlyFollowing = currentUserFollowing.includes(friendEmail);
    const action = isCurrentlyFollowing ? "unfollow" : "follow";

    setActionLoading((prev) => ({ ...prev, [friendEmail]: true }));

    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/user/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentUserEmail: currentFirebaseUser.email,
          targetEmail: friendEmail,
          action,
        }),
      });

      if (res.ok) {
        setCurrentUserFollowing((prev) =>
          action === "follow"
            ? [...prev, friendEmail]
            : prev.filter((e) => e !== friendEmail)
        );
      } else {
        alert("Failed to update follow status.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [friendEmail]: false }));
    }
  };

  const currentList = activeTab === "followers" ? followersList : followingList;
  const isLoadingCurrent = activeTab === "followers" ? isLoadingFollowers : isLoadingFollowing;
  const isFetchingNext = activeTab === "followers" ? isFetchingNextFollowers : isFetchingNextFollowing;
  const hasMoreCurrent = activeTab === "followers" ? hasNextFollowers : hasNextFollowing;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  // Global ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <Users size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Connections & Friends</h3>
                <p className="text-xs text-slate-500 font-medium">@{targetUsername || "user"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100">
            <button
              onClick={() => setActiveTab("followers")}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                activeTab === "followers"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              Followers ({totalFollowers})
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                activeTab === "following"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              Following ({totalFollowing})
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 pt-4">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-slate-100/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Friends List Body */}
          <div className="p-6 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
            {isLoadingCurrent && currentList.length === 0 ? (
              <div className="space-y-3 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="w-28 h-3.5 bg-slate-200 rounded-md" />
                        <div className="w-16 h-3 bg-slate-100 rounded-md" />
                      </div>
                    </div>
                    <div className="w-20 h-8 bg-slate-200 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredList.length > 0 ? (
              <>
                {filteredList.map((friend) => {
                  const isSelf = currentFirebaseUser?.email === friend.email;
                  const isFollowing = currentUserFollowing.includes(friend.email);
                  const isLoadingAction = !!actionLoading[friend.email];

                  return (
                    <div
                      key={friend.email}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/80 transition-all group"
                    >
                      <div
                        onClick={() => {
                          onClose();
                          router.push(`/user/${friend.username}`);
                        }}
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          {friend.profilePicture ? (
                            <Image
                              src={friend.profilePicture}
                              alt={friend.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-700 bg-slate-200">
                              {friend.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-amber-800 transition-colors">
                            {friend.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium truncate">@{friend.username}</p>
                        </div>
                      </div>

                      {!isSelf && (
                        <button
                          onClick={() => handleFollowToggle(friend.email)}
                          disabled={isLoadingAction}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ml-3 flex-shrink-0 ${
                            isFollowing
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                          }`}
                        >
                          {isLoadingAction ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : isFollowing ? (
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
                  );
                })}

                {/* Automatic Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="h-6 flex items-center justify-center py-2">
                  {isFetchingNext && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Loader2 size={14} className="animate-spin text-yellow-600" />
                      <span>Loading more...</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-600">No {activeTab} found</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {searchQuery ? "Try searching for a different name." : `This user doesn't have any ${activeTab} yet.`}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
