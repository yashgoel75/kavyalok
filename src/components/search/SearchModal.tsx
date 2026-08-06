"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, User as UserIcon, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
  bio?: string;
}

interface SearchPost {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  author: {
    name: string;
    username: string;
    profilePicture?: string;
  };
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search logic
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setUsers([]);
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(searchTerm.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setUsers([]);
        setPosts([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(`/search?query=${encodeURIComponent(query.trim())}`);
  };

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Clear query on close
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setUsers([]);
      setPosts([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Top Search Header */}
          <form onSubmit={handleSubmit} className="relative flex items-center px-6 py-4 border-b border-slate-100 bg-slate-50/90">
            <Search size={22} className="text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search stories, authors, or topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full mr-2"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </form>

          {/* Results Area */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 size={20} className="animate-spin text-yellow-600" />
                <span className="text-sm font-semibold text-slate-600">Searching...</span>
              </div>
            ) : query.trim() ? (
              <>
                {/* Users Section */}
                {users.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                      Authors & Profiles ({users.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {users.slice(0, 4).map((user) => (
                        <div
                          key={user._id}
                          onClick={() => {
                            onClose();
                            router.push(`/user/${user.username}`);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 transition-all cursor-pointer group"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                            {user.profilePicture ? (
                              <Image
                                src={user.profilePicture}
                                alt={user.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-600">
                                {user.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-yellow-700 transition-colors">
                              {user.name}
                            </h5>
                            <p className="text-[11px] text-slate-500 font-medium truncate">@{user.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts Section */}
                {posts.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                      Stories & Posts ({posts.length})
                    </h4>
                    <div className="space-y-2">
                      {posts.slice(0, 4).map((post) => (
                        <div
                          key={post._id}
                          onClick={() => {
                            onClose();
                            router.push(`/post/${post._id}`);
                          }}
                          className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 transition-all cursor-pointer group flex items-center justify-between"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <h5 className="font-bold text-slate-900 text-sm truncate group-hover:text-yellow-700 transition-colors">
                              {post.title}
                            </h5>
                            <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">
                              By @{post.author?.username || "author"}
                            </p>
                          </div>
                          <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-700 transition-colors shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {users.length === 0 && posts.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Search size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-slate-600">No results found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try searching for a different keyword or author name.</p>
                  </div>
                )}

                {/* Full search jump button */}
                <div className="pt-2 text-center border-t border-slate-100">
                  <button
                    onClick={() => handleSubmit()}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span>View all results for &quot;{query}&quot;</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-yellow-50 text-yellow-700 flex items-center justify-center mx-auto shadow-xs">
                  <Search size={26} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Search Kavyalok</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 font-medium leading-relaxed">
                    Find poems, stories, authors, or literary topics across the platform.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
