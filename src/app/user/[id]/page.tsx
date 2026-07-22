"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  MapPin,
  Feather,
  BookOpen,
  Pin,
  Share2,
  Heart,
  Eye,
  Clock,
  X,
  ExternalLink,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseToken } from "@/utils";

interface PrivacySettings {
  isPrivate?: boolean;
  showEmail?: boolean;
  allowMessages?: boolean;
  showActivity?: boolean;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  likes: number;
  color: string;
  createdAt?: string;
}

interface User {
  name: string;
  username: string;
  email: string;
  bio?: string;
  penName?: string;
  favoriteGenre?: string;
  literaryQuote?: string;
  location?: string;
  profilePicture?: string;
  posts?: Post[];
  pinnedPosts?: string[];
  isVerified?: boolean;
  instagram?: string;
  snapchat?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
  followers: string[];
  following: string[];
  privacySettings?: PrivacySettings;
}

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState<"works" | "pinned">("works");
  const [isSocialsModalOpen, setIsSocialsModalOpen] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
    }
  }, [userId, firebaseUser?.email]);

  const fetchUserData = async (username: string) => {
    try {
      const token = await getFirebaseToken();
      const userRes = await fetch(`/api/getUser?username=${encodeURIComponent(username)}`);
      const userDataRes = await userRes.json();
      if (!userRes.ok) throw new Error(userDataRes.error || "Failed to load user profile");

      const postsRes = await fetch(
        `/api/user/posts?email=${encodeURIComponent(userDataRes.user.email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const postsData = await postsRes.json();
      if (!postsRes.ok) throw new Error(postsData.error || "Failed to load user posts");

      setUserData(postsData.user);

      if (firebaseUser?.email && postsData.user.followers) {
        setIsFollowing(postsData.user.followers.includes(firebaseUser.email));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!firebaseUser || !userData) return;

    setIsFollowLoading(true);
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/user/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentUserEmail: firebaseUser.email,
          targetEmail: userData.email,
          action: isFollowing ? "unfollow" : "follow",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update follow status");

      setIsFollowing(!isFollowing);
      setUserData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          followers: isFollowing
            ? prev.followers.filter((email) => email !== firebaseUser.email)
            : [...prev.followers, firebaseUser.email!],
        };
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update follow status.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/post/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedPostId(id);
    setTimeout(() => setCopiedPostId(null), 2000);
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
        <main className="max-w-5xl mx-auto px-4 py-12 w-full flex-1">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl animate-pulse space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-28 h-28 bg-slate-200 rounded-full" />
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="w-44 h-6 bg-slate-200 rounded-md mx-auto sm:mx-0" />
                <div className="w-28 h-4 bg-slate-100 rounded-md mx-auto sm:mx-0" />
                <div className="w-full max-w-md h-12 bg-slate-100 rounded-lg mx-auto sm:mx-0" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center bg-white p-10 rounded-3xl border border-slate-200 shadow-xl max-w-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">User Not Found</h2>
            <p className="text-slate-500 text-sm mb-6">The requested user profile does not exist.</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-[#bd9864] text-white rounded-xl font-semibold"
            >
              Back to Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwnProfile = firebaseUser?.email === userData.email;
  const pinnedPostIds = userData.pinnedPosts || [];
  const pinnedPostsList = userData.posts?.filter((p) => pinnedPostIds.includes(p._id)) || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-amber-500/20">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 w-full flex-1">
        {/* Profile Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl p-6 sm:p-8 mb-8 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#bd9864] via-amber-600 to-yellow-600" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 pt-2">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-amber-500/20 shadow-md">
                {userData.profilePicture ? (
                  <Image
                    src={userData.profilePicture}
                    alt={userData.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#bd9864] to-[#dbb56a] text-3xl font-extrabold text-white">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {userData.isVerified && (
                <div className="absolute bottom-1 right-1 bg-emerald-600 text-white p-1.5 rounded-full ring-2 ring-white" title="Verified Writer">
                  <Check size={12} className="stroke-[3]" />
                </div>
              )}
            </div>

            {/* Information */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {userData.name}
                    </h1>
                    {userData.penName && (
                      <span className="px-3 py-1 bg-amber-100/80 text-amber-900 font-semibold text-xs rounded-full flex items-center gap-1 border border-amber-300/60">
                        <Feather size={12} />
                        {userData.penName}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium text-sm mt-0.5">@{userData.username}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center md:justify-end gap-2.5 pt-2 md:pt-0">
                  {!isOwnProfile && firebaseUser && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer ${
                        isFollowing
                          ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                          : "bg-[#bd9864] hover:bg-[#a68250] text-white"
                      }`}
                    >
                      {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
                      <span>{isFollowLoading ? "Updating..." : isFollowing ? "Following" : "Follow"}</span>
                    </button>
                  )}

                  {isOwnProfile && (
                    <button
                      onClick={() => router.push("/account")}
                      className="px-4 py-2 bg-[#bd9864] hover:bg-[#a68250] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md"
                    >
                      Manage Account
                    </button>
                  )}

                  <button
                    onClick={() => setIsSocialsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 transition-all active:scale-95 cursor-pointer"
                  >
                    <Globe size={15} className="text-amber-700" />
                    <span>Connect & Socials</span>
                  </button>
                </div>
              </div>

              {/* Location & Genre */}
              <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap text-xs sm:text-sm text-slate-600 font-medium pt-1">
                {userData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-amber-700" />
                    {userData.location}
                  </span>
                )}
                {userData.favoriteGenre && (
                  <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                    <BookOpen size={13} className="text-amber-700" />
                    Genre: {userData.favoriteGenre}
                  </span>
                )}
              </div>

              {/* Bio & Quote */}
              {(userData.bio || userData.literaryQuote) && (
                <div className="mt-3 p-4 bg-slate-50/90 rounded-2xl border border-slate-200/70 text-slate-700 text-xs sm:text-sm space-y-1.5 leading-relaxed">
                  {userData.bio && <p className="font-normal">{userData.bio}</p>}
                  {userData.literaryQuote && (
                    <p className="italic text-amber-900 font-serif border-l-2 border-amber-500 pl-3 py-0.5">
                      &quot;{userData.literaryQuote}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* Counters */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 max-w-lg mx-auto md:mx-0">
                <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="text-lg font-extrabold text-slate-900">{userData.posts?.length || 0}</div>
                  <div className="text-[11px] font-medium text-slate-500">Works</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-amber-50/80 border border-amber-200/60">
                  <div className="text-lg font-extrabold text-amber-900">{pinnedPostIds.length}</div>
                  <div className="text-[11px] font-semibold text-amber-800 flex items-center justify-center gap-1">
                    <Pin size={11} />
                    <span>Pinned</span>
                  </div>
                </div>
                <Link href={`/user/${userId}/friends`} className="text-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors">
                  <div className="text-lg font-extrabold text-slate-900">{userData.followers?.length || 0}</div>
                  <div className="text-[11px] font-medium text-slate-500">Followers</div>
                </Link>
                <Link href={`/user/${userId}/friends`} className="text-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors">
                  <div className="text-lg font-extrabold text-slate-900">{userData.following?.length || 0}</div>
                  <div className="text-[11px] font-medium text-slate-500">Following</div>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Header */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
          <button
            onClick={() => setActiveTab("works")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "works"
                ? "bg-[#bd9864] text-white shadow-md shadow-amber-900/10"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <BookOpen size={16} />
            <span>Published Works ({userData.posts?.length || 0})</span>
          </button>

          {pinnedPostsList.length > 0 && (
            <button
              onClick={() => setActiveTab("pinned")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "pinned"
                  ? "bg-[#bd9864] text-white shadow-md shadow-amber-900/10"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Pin size={16} />
              <span>Pinned ({pinnedPostsList.length})</span>
            </button>
          )}
        </div>

        {/* Works Tab */}
        {activeTab === "works" && (
          <div>
            {userData.posts && userData.posts.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-5">
                {userData.posts.map((post) => {
                  const isPinned = pinnedPostIds.includes(post._id);
                  const wordCount = post.content?.replace(/<[^>]*>?/gm, "").split(/\s+/).length || 0;
                  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

                  return (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        backgroundColor: post.color || "#ffffff",
                        color: getTextColor(post.color || "#ffffff"),
                      }}
                      className={`relative rounded-3xl p-6 shadow-md hover:shadow-xl transition-all border ${
                        isPinned ? "border-amber-500 ring-2 ring-amber-500/40" : "border-slate-200/80"
                      } flex flex-col justify-between group cursor-pointer`}
                      onClick={() => router.push(`/post/${post._id}`)}
                    >
                      {isPinned && (
                        <div className="absolute top-4 right-6 bg-amber-500 text-white px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1 shadow-sm">
                          <Pin size={11} />
                          <span>Pinned</span>
                        </div>
                      )}

                      <div className="mb-4">
                        <h3 className="text-lg sm:text-xl font-bold hover:underline mb-2 leading-snug">
                          {post.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs opacity-75 mb-3 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {readingTime} min read
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Heart size={12} className="text-rose-500 fill-rose-500" />
                            {post.likes} Likes
                          </span>
                        </div>

                        {post.picture && (
                          <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4">
                            <Image src={post.picture} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}

                        <div
                          className="text-xs sm:text-sm line-clamp-3 opacity-90 leading-relaxed font-normal"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/post/${post._id}`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 font-semibold transition-colors flex items-center gap-1"
                        >
                          <Eye size={14} />
                          <span>Read Work</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(post._id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 font-semibold transition-colors flex items-center gap-1"
                        >
                          <Share2 size={14} />
                          <span>{copiedPostId === post._id ? "Copied" : "Share"}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                <BookOpen size={36} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Published Works</h3>
                <p className="text-slate-500 text-sm">This writer has not published any works yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Pinned Tab */}
        {activeTab === "pinned" && (
          <div>
            {pinnedPostsList.length > 0 && (
              <div className="grid md:grid-cols-2 gap-5">
                {pinnedPostsList.map((post) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      backgroundColor: post.color || "#ffffff",
                      color: getTextColor(post.color || "#ffffff"),
                    }}
                    className="relative rounded-3xl p-6 shadow-xl border-2 border-amber-500 flex flex-col justify-between cursor-pointer"
                    onClick={() => router.push(`/post/${post._id}`)}
                  >
                    <div className="absolute -top-3 right-6 bg-amber-500 text-white px-3 py-1 rounded-full font-extrabold text-xs flex items-center gap-1 shadow-md">
                      <Pin size={12} />
                      <span>Featured Work</span>
                    </div>

                    <div className="mb-4 pt-2">
                      <h3 className="text-xl font-extrabold hover:underline mb-2">
                        {post.title}
                      </h3>

                      {post.picture && (
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4">
                          <Image src={post.picture} alt={post.title} fill className="object-cover" />
                        </div>
                      )}

                      <div
                        className="text-sm line-clamp-4 leading-relaxed font-normal"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-black/10 text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        <Heart size={14} className="text-rose-500 fill-rose-500" />
                        {post.likes} Likes
                      </span>
                      <span className="px-3 py-1 bg-black/10 rounded-xl">Featured</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Social Links Modal */}
      <AnimatePresence>
        {isSocialsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <Globe className="text-amber-700" size={20} />
                  <h3 className="font-bold text-slate-900 text-lg">Social Profiles & Links</h3>
                </div>
                <button
                  onClick={() => setIsSocialsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {userData.instagram && (
                  <a
                    href={`https://instagram.com/${userData.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 hover:from-pink-500/20 border border-pink-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-xl shadow-md">
                        <Instagram size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Instagram</h4>
                        <p className="text-xs text-slate-500">@{userData.instagram.replace("@", "")}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-700" />
                  </a>
                )}

                {userData.twitter && (
                  <a
                    href={`https://x.com/${userData.twitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 text-white rounded-xl shadow-md">
                        <Twitter size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">X (Twitter)</h4>
                        <p className="text-xs text-slate-500">@{userData.twitter.replace("@", "")}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-700" />
                  </a>
                )}

                {userData.youtube && (
                  <a
                    href={userData.youtube.startsWith("http") ? userData.youtube : `https://youtube.com/@${userData.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 text-white rounded-xl shadow-md">
                        <Youtube size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">YouTube</h4>
                        <p className="text-xs text-slate-500">{userData.youtube}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-700" />
                  </a>
                )}

                {userData.linkedin && (
                  <a
                    href={userData.linkedin.startsWith("http") ? userData.linkedin : `https://linkedin.com/in/${userData.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sky-700 text-white rounded-xl shadow-md">
                        <Linkedin size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">LinkedIn</h4>
                        <p className="text-xs text-slate-500">{userData.linkedin}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-700" />
                  </a>
                )}

                {userData.website && (
                  <a
                    href={userData.website.startsWith("http") ? userData.website : `https://${userData.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#bd9864] text-white rounded-xl shadow-md">
                        <Globe size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Personal Website</h4>
                        <p className="text-xs text-slate-500">{userData.website}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-700" />
                  </a>
                )}

                {!userData.instagram && !userData.twitter && !userData.youtube && !userData.linkedin && !userData.website && (
                  <div className="text-center py-8 text-slate-400">
                    <Globe size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No social links added yet.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsSocialsModalOpen(false)}
                  className="px-5 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Navigation />
      <Footer />
    </div>
  );
}
