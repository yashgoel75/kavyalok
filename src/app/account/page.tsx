"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import {
  Pin,
  PinOff,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  MapPin,
  Feather,
  BookOpen,
  Edit3,
  Share2,
  Trash2,
  Plus,
  X,
  ExternalLink,
  Check,
  Heart,
  Eye,
  Clock,
  Camera,
  Grid,
  Loader2,
  QrCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseToken } from "@/utils";
import CreatePostModal from "@/components/post/CreatePostModal";
import FriendsModal from "@/components/user/FriendsModal";
import ProfileCardModal from "@/components/user/ProfileCardModal";

interface PrivacySettings {
  isPrivate: boolean;
  showEmail: boolean;
  allowMessages: boolean;
  showActivity: boolean;
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
  instagram?: string;
  snapchat?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
  followers?: string[];
  following?: string[];
  privacySettings?: PrivacySettings;
  isVerified?: boolean;
}

export default function Account() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { firebaseUser, userData: globalUserData, loading: globalLoading, refreshUserData } = useUser();
  const [userData, setUserData] = useState<User | null>(globalUserData as User | null);
  const [formData, setFormData] = useState<User | null>(globalUserData as User | null);
  const [loading, setLoading] = useState(globalLoading);

  // Modals & Tabs
  const [activeTab, setActiveTab] = useState<"posts" | "pinned">("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSocialsModalOpen, setIsSocialsModalOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);
  const [friendsModalState, setFriendsModalState] = useState<{
    isOpen: boolean;
    tab: "followers" | "following";
  }>({ isOpen: false, tab: "followers" });

  // Delete modal state
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Operation States
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pinningPostId, setPinningPostId] = useState<string | null>(null);

  // Copy indicators
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!globalLoading && !firebaseUser) {
      router.replace("/");
    }
  }, [globalLoading, firebaseUser, router]);

  useEffect(() => {
    if (firebaseUser?.email) {
      fetchUserPosts(firebaseUser.email);
    }
  }, [firebaseUser]);

  const fetchUserPosts = async (email: string) => {
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/user/posts?email=${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load user data");

      setUserData(data.user);
      setFormData(data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!firebaseUser || !formData) return;
    setIsUpdating(true);

    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          updates: {
            name: formData.name,
            username: formData.username,
            bio: formData.bio,
            penName: formData.penName,
            favoriteGenre: formData.favoriteGenre,
            literaryQuote: formData.literaryQuote,
            location: formData.location,
            instagram: formData.instagram,
            snapchat: formData.snapchat,
            twitter: formData.twitter,
            youtube: formData.youtube,
            linkedin: formData.linkedin,
            website: formData.website,
            privacySettings: formData.privacySettings,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setUserData((prev) => ({
        ...data.user,
        posts: prev?.posts || [],
      }));

      setIsEditModalOpen(false);
      await refreshUserData();
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePin = async (postId: string) => {
    if (!firebaseUser) return;
    setPinningPostId(postId);

    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/user/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          postId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle pin");

      setUserData((prev) => (prev ? { ...prev, pinnedPosts: data.pinnedPosts } : prev));
      setFormData((prev) => (prev ? { ...prev, pinnedPosts: data.pinnedPosts } : prev));
    } catch (err: any) {
      alert(err.message || "Failed to update pinned status");
    } finally {
      setPinningPostId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!firebaseUser) return;
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/post?id=${postId}&email=${encodeURIComponent(firebaseUser.email || "")}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete post");

      setUserData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: prev.posts?.filter((p) => p._id !== postId),
          pinnedPosts: prev.pinnedPosts?.filter((id) => id !== postId),
        };
      });
      setDeletingPostId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete post.");
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!firebaseUser) return;
    setIsUploadingImage(true);

    try {
      const token = await getFirebaseToken();
      const signRes = await fetch("/api/signprofilepicture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folder: "profilePictures" }),
      });

      const { timestamp, signature, apiKey, folder } = await signRes.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("timestamp", timestamp.toString());
      uploadData.append("signature", signature);
      uploadData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: uploadData }
      );

      const data = await uploadRes.json();
      if (data.secure_url) {
        const updateRes = await fetch(`/api/user`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: firebaseUser.email,
            updates: { profilePicture: data.secure_url },
          }),
        });

        if (updateRes.ok) {
          setUserData((prev) => (prev ? { ...prev, profilePicture: data.secure_url } : prev));
          setFormData((prev) => (prev ? { ...prev, profilePicture: data.secure_url } : prev));
          await refreshUserData();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload avatar.");
    } finally {
      setIsUploadingImage(false);
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

  if (loading || globalLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-12 w-full flex-1">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl animate-pulse space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-slate-200 rounded-full" />
              <div className="space-y-3 flex-1">
                <div className="w-48 h-6 bg-slate-200 rounded-md" />
                <div className="w-32 h-4 bg-slate-100 rounded-md" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!userData) return null;

  const pinnedPostIds = userData.pinnedPosts || [];
  const pinnedPostsList = userData.posts?.filter((p) => pinnedPostIds.includes(p._id)) || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-slate-900 selection:text-white font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24 w-full flex-1">
        {/* Instagram + Pinterest Inspired Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-slate-200/80 pb-8 mb-8">
          {/* Circular Avatar */}
          <div
            onClick={() => avatarInputRef.current?.click()}
            className="relative flex-shrink-0 group cursor-pointer"
          >
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

              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold">
                {isUploadingImage ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Camera size={20} className="mb-1" />
                    <span>Change</span>
                  </>
                )}
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAvatarUpload(f);
              }}
              className="hidden"
            />
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

              {/* Instagram & Pinterest Style Larger Action Buttons */}
              <div className="flex items-center justify-center md:justify-end gap-3 flex-wrap">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold border border-slate-200/80 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <Edit3 size={15} />
                  <span>Edit profile</span>
                </button>

                {/* Spotify-style Visual Profile Card Trigger */}
                <button
                  onClick={() => setIsProfileCardOpen(true)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs sm:text-sm font-extrabold border border-slate-200/80 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <QrCode size={16} />
                  <span>Share profile</span>
                </button>

                <button
                  onClick={() => setIsCreatePostOpen(true)}
                  className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Plus size={16} />
                  <span>Create</span>
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
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-4">
                        {isPinned ? (
                          <span className="bg-slate-900 text-white px-3.5 py-1 rounded-full font-extrabold text-xs flex items-center gap-1 shadow-xs">
                            <Pin size={11} />
                            <span>Pinned</span>
                          </span>
                        ) : (
                          <span className="text-xs opacity-70 font-semibold">{readingTime} min read</span>
                        )}

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleTogglePin(post._id)}
                            disabled={pinningPostId === post._id}
                            className="p-2 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
                            title={isPinned ? "Unpin Post" : "Pin Post"}
                          >
                            {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                          </button>
                          <button
                            onClick={() => setDeletingPostId(post._id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-5">
                        <h3 className="text-xl sm:text-2xl font-extrabold hover:underline mb-2 leading-snug">
                          {post.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs opacity-80 mb-4 font-bold">
                          <span className="flex items-center gap-1">
                            <Heart size={14} className="text-rose-500 fill-rose-500" />
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

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-black/10 text-xs font-extrabold">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/post/${post._id}`);
                          }}
                          className="px-4 py-2 rounded-xl bg-black/10 hover:bg-black/20 transition-colors flex items-center gap-1.5"
                        >
                          <Eye size={15} />
                          <span>View Post</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPostLink(post._id);
                          }}
                          className="px-4 py-2 rounded-xl bg-black/10 hover:bg-black/20 transition-colors flex items-center gap-1.5"
                        >
                          <Share2 size={15} />
                          <span>{copiedPostId === post._id ? "Copied Link" : "Share"}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Instagram / Pinterest Style Empty State */
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-slate-900 flex items-center justify-center mb-5 text-slate-900">
                  <Camera size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Share Posts & Stories</h3>
                <p className="text-slate-500 text-sm max-w-sm mb-6 font-medium">
                  When you share posts and creative writing, they will appear on your profile.
                </p>
                <button
                  onClick={() => setIsCreatePostOpen(true)}
                  className="px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Share your first post</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pinned Posts Grid */}
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
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-slate-900 text-white px-3.5 py-1 rounded-full font-extrabold text-xs flex items-center gap-1">
                        <Pin size={11} />
                        <span>Pinned Post</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(post._id);
                        }}
                        className="p-2 rounded-xl bg-black/10 hover:bg-black/20"
                      >
                        <PinOff size={15} />
                      </button>
                    </div>

                    <div className="mb-4">
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && formData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-slate-900" />
                  <h3 className="font-extrabold text-slate-900 text-lg">Edit Profile Settings</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pen Name</label>
                    <input
                      type="text"
                      value={formData.penName || ""}
                      onChange={(e) => setFormData({ ...formData, penName: e.target.value })}
                      placeholder="Writer alias"
                      className="w-full text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={formData.bio || ""}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell your story..."
                    className="w-full text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      className="w-full text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Favorite Genre</label>
                    <input
                      type="text"
                      value={formData.favoriteGenre || ""}
                      onChange={(e) => setFormData({ ...formData, favoriteGenre: e.target.value })}
                      placeholder="e.g. Poetry, Fiction"
                      className="w-full text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingPostId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center"
            >
              <Trash2 size={32} className="mx-auto text-rose-600 mb-3" />
              <h4 className="font-extrabold text-slate-900 text-lg mb-1">Delete Post?</h4>
              <p className="text-xs text-slate-500 mb-6 font-medium">This action cannot be undone. Are you sure you want to delete this post?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeletingPostId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePost(deletingPostId)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-md"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        firebaseUser={firebaseUser}
        onPostCreated={() => {
          if (firebaseUser?.email) fetchUserPosts(firebaseUser.email);
        }}
      />

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
