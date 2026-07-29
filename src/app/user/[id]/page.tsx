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
  Grid,
  Camera,
  QrCode,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseToken } from "@/utils";
import FriendsModal from "@/components/user/FriendsModal";
import ProfileCardModal from "@/components/user/ProfileCardModal";

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
  const [activeTab, setActiveTab] = useState<"posts" | "pinned">("posts");
  const [isSocialsModalOpen, setIsSocialsModalOpen] = useState(false);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);
  const [friendsModalState, setFriendsModalState] = useState<{
    isOpen: boolean;
    tab: "followers" | "following";
  }>({ isOpen: false, tab: "followers" });
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

  const handleCopyPostLink = (id: string) => {
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
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl animate-pulse space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 bg-slate-200 rounded-full" />
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="w-44 h-6 bg-slate-200 rounded-md mx-auto sm:mx-0" />
                <div className="w-28 h-4 bg-slate-100 rounded-md mx-auto sm:mx-0" />
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
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs"
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-slate-900 selection:text-white font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24 w-full flex-1">
        {/* Instagram + Pinterest Inspired Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-slate-200/80 pb-8 mb-8">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-slate-200 shadow-md">
              {userData.profilePicture ? (
                <Image
                  src={userData.profilePicture}
                  alt={userData.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-4xl font-extrabold text-white">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {userData.isVerified && (
              <div className="absolute bottom-1 right-1 bg-emerald-600 text-white p-1.5 rounded-full ring-2 ring-white" title="Verified Writer">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
          </div>

          {/* User Info & Instagram Style Inline Metrics */}
          <div className="flex-1 text-center md:text-left space-y-4 w-full">
            {/* Username + Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  @{userData.username}
                </h1>
                {userData.isVerified && (
                  <span className="p-1 bg-emerald-600 text-white rounded-full" title="Verified Account">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-end gap-3 flex-wrap">
                {!isOwnProfile && firebaseUser && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={`flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-extrabold rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer ${
                      isFollowing
                        ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    <span>{isFollowLoading ? "Updating..." : isFollowing ? "Following" : "Follow"}</span>
                  </button>
                )}

                {isOwnProfile && (
                  <button
                    onClick={() => router.push("/account")}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-md cursor-pointer"
                  >
                    Manage Account
                  </button>
                )}

                <button
                  onClick={() => setIsProfileCardOpen(true)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs sm:text-sm font-extrabold border border-slate-200/80 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <QrCode size={16} />
                  <span>Share profile</span>
                </button>
              </div>
            </div>

            {/* Instagram Style Inline Metric Counters */}
            <div className="flex items-center justify-center md:justify-start gap-6 text-sm sm:text-base font-semibold text-slate-900 pt-1">
              <div>
                <span className="font-extrabold">{userData.posts?.length || 0}</span>{" "}
                <span className="text-slate-500 font-normal">posts</span>
              </div>
              <button
                onClick={() => setFriendsModalState({ isOpen: true, tab: "followers" })}
                className="hover:underline cursor-pointer"
              >
                <span className="font-extrabold">{userData.followers?.length || 0}</span>{" "}
                <span className="text-slate-500 font-normal">followers</span>
              </button>
              <button
                onClick={() => setFriendsModalState({ isOpen: true, tab: "following" })}
                className="hover:underline cursor-pointer"
              >
                <span className="font-extrabold">{userData.following?.length || 0}</span>{" "}
                <span className="text-slate-500 font-normal">following</span>
              </button>
            </div>

            {/* Bio & Details */}
            <div className="text-xs sm:text-sm text-slate-700 space-y-1 font-medium max-w-xl mx-auto md:mx-0">
              <p className="font-extrabold text-slate-900">
                {userData.name} {userData.penName && <span className="font-semibold text-slate-500">• ✒️ {userData.penName}</span>}
              </p>
              {userData.bio && <p className="text-slate-600 leading-relaxed font-normal">{userData.bio}</p>}
              {userData.literaryQuote && (
                <p className="italic text-slate-800 font-serif text-xs pt-0.5">&quot;{userData.literaryQuote}&quot;</p>
              )}
              {userData.location && (
                <p className="text-xs text-slate-400 font-normal pt-1">
                  📍 {userData.location} {userData.favoriteGenre && `• Genre: ${userData.favoriteGenre}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Story Highlights & Filter Bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar border-b border-slate-100">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-2.5 rounded-full text-xs font-extrabold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "posts"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Grid size={14} />
            <span>Posts ({userData.posts?.length || 0})</span>
          </button>

          {pinnedPostsList.length > 0 && (
            <button
              onClick={() => setActiveTab("pinned")}
              className={`px-6 py-2.5 rounded-full text-xs font-extrabold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "pinned"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Pin size={14} />
              <span>Pinned ({pinnedPostsList.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsSocialsModalOpen(true)}
            className="px-6 py-2.5 rounded-full text-xs font-extrabold tracking-wide bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-2"
          >
            <Globe size={14} />
            <span>Social Links</span>
          </button>
        </div>

        {/* Pinterest-Style Posts Grid - Expanded Card Sizes */}
        {activeTab === "posts" && (
          <div>
            {userData.posts && userData.posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
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
                      className={`relative rounded-3xl p-7 sm:p-8 shadow-md hover:shadow-2xl transition-all border ${
                        isPinned ? "border-slate-900 ring-2 ring-slate-900/20" : "border-slate-200/80"
                      } flex flex-col justify-between group cursor-pointer overflow-hidden`}
                      onClick={() => router.push(`/post/${post._id}`)}
                    >
                      {isPinned && (
                        <div className="absolute top-4 right-6 bg-slate-900 text-white px-3.5 py-1 rounded-full font-extrabold text-[10px] flex items-center gap-1 shadow-xs">
                          <Pin size={10} />
                          <span>Pinned</span>
                        </div>
                      )}

                      <div className="mb-5">
                        <h3 className="text-xl sm:text-2xl font-extrabold hover:underline mb-2 leading-snug">
                          {post.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs opacity-80 mb-4 font-bold">
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            {readingTime} min read
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Heart size={13} className="text-rose-500 fill-rose-500" />
                            {post.likes} Likes
                          </span>
                        </div>

                        {post.picture && (
                          <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-4 border border-black/10">
                            <Image src={post.picture} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}

                        <div
                          className="text-sm line-clamp-3 opacity-90 leading-relaxed font-normal"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-black/10 text-xs font-extrabold">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/post/${post._id}`);
                          }}
                          className="px-4 py-2 rounded-xl bg-black/10 hover:bg-black/20 transition-colors flex items-center gap-1.5"
                        >
                          <Eye size={15} />
                          <span>Read Post</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPostLink(post._id);
                          }}
                          className="px-4 py-2 rounded-xl bg-black/10 hover:bg-black/20 transition-colors flex items-center gap-1.5"
                        >
                          <Share2 size={15} />
                          <span>{copiedPostId === post._id ? "Copied" : "Share"}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-slate-900 flex items-center justify-center mb-5 text-slate-900">
                  <Pencil size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No Published Posts</h3>
                <p className="text-slate-500 text-sm max-w-sm font-medium">This writer has not published any posts yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Pinned Tab */}
        {activeTab === "pinned" && (
          <div>
            {pinnedPostsList.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                {pinnedPostsList.map((post) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      backgroundColor: post.color || "#ffffff",
                      color: getTextColor(post.color || "#ffffff"),
                    }}
                    className="relative rounded-3xl p-7 sm:p-8 shadow-xl border-2 border-slate-900 flex flex-col justify-between cursor-pointer"
                    onClick={() => router.push(`/post/${post._id}`)}
                  >
                    <div className="absolute -top-3 right-6 bg-slate-900 text-white px-3.5 py-1 rounded-full font-extrabold text-xs flex items-center gap-1 shadow-md">
                      <Pin size={11} />
                      <span>Featured Post</span>
                    </div>

                    <div className="mb-4 pt-2">
                      <h3 className="text-xl sm:text-2xl font-extrabold hover:underline mb-2">
                        {post.title}
                      </h3>

                      {post.picture && (
                        <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-4 border border-black/10">
                          <Image src={post.picture} alt={post.title} fill className="object-cover" />
                        </div>
                      )}

                      <div
                        className="text-sm line-clamp-4 leading-relaxed font-normal"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-black/10 text-xs font-extrabold">
                      <span className="flex items-center gap-1">
                        <Heart size={15} className="text-rose-500 fill-rose-500" />
                        {post.likes} Likes
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPostLink(post._id);
                        }}
                        className="px-4 py-2 bg-black/10 rounded-xl flex items-center gap-1.5"
                      >
                        <Share2 size={14} />
                        <span>{copiedPostId === post._id ? "Copied" : "Share"}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Spotify-style Visual Profile Card Modal */}
      <ProfileCardModal
        isOpen={isProfileCardOpen}
        onClose={() => setIsProfileCardOpen(false)}
        user={{
          name: userData.name,
          username: userData.username,
          profilePicture: userData.profilePicture,
          penName: userData.penName,
          bio: userData.bio,
          isVerified: userData.isVerified,
        }}
      />

      {/* Social Links Modal */}
      <AnimatePresence>
        {isSocialsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <Globe className="text-slate-900" size={20} />
                  <h3 className="font-extrabold text-slate-900 text-lg">Social Links</h3>
                </div>
                <button
                  onClick={() => setIsSocialsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                {userData.instagram && (
                  <a
                    href={`https://instagram.com/${userData.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all group font-semibold text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 text-white rounded-xl">
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
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all group font-semibold text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 text-white rounded-xl">
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

                {!userData.instagram && !userData.twitter && !userData.youtube && !userData.linkedin && !userData.website && (
                  <div className="text-center py-8 text-slate-400">
                    <Globe size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-slate-600">No social links added yet.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsSocialsModalOpen(false)}
                  className="px-5 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Friends Modal */}
      <FriendsModal
        isOpen={friendsModalState.isOpen}
        onClose={() => setFriendsModalState({ ...friendsModalState, isOpen: false })}
        targetEmail={userData.email}
        targetUsername={userData.username}
        currentFirebaseUser={firebaseUser}
        initialTab={friendsModalState.tab}
      />

      <Navigation />
      <Footer />
    </div>
  );
}
