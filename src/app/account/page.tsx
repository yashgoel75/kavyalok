"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Shield,
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseToken } from "@/utils";

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
}

export default function Account() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Tabs
  const [activeTab, setActiveTab] = useState<"works" | "pinned" | "settings">("works");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSocialsModalOpen, setIsSocialsModalOpen] = useState(false);

  // Operation States
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pinningPostId, setPinningPostId] = useState<string | null>(null);

  // Username validation
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [usernameAlreadyTaken, setUsernameAlreadyTaken] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Card Menus & Copy
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setFirebaseUser(user);

        const cached = localStorage.getItem("userData");
        const cachedAt = localStorage.getItem("userDataCachedAt");
        const oneHour = 60 * 60 * 1000;

        const isCacheValid = cached && cachedAt && Date.now() - Number(cachedAt) < oneHour;

        if (isCacheValid) {
          try {
            const parsed = JSON.parse(cached);
            setUserData(parsed);
            setFormData(parsed);
            setLoading(false);
          } catch (error) {
            console.error("Cache parse error:", error);
            fetchUserData(user.email).finally(() => setLoading(false));
          }
        } else {
          fetchUserData(user.email).finally(() => setLoading(false));
        }
      } else {
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserData = async (email: string): Promise<User | null> => {
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
      localStorage.setItem("userData", JSON.stringify(data.user));
      localStorage.setItem("userDataCachedAt", Date.now().toString());
      return data.user;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleUpdate = async () => {
    if (!firebaseUser || !formData) return;

    if (formData.username !== userData?.username) {
      if (!usernameAvailable || usernameAlreadyTaken) {
        alert("Please choose an available username.");
        return;
      }
    }

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
      localStorage.setItem("userData", JSON.stringify(data.user));
      localStorage.setItem("userDataCachedAt", Date.now().toString());
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

  const handleTogglePrivacy = (key: keyof PrivacySettings) => {
    setFormData((prev) => {
      if (!prev) return null;
      const current = prev.privacySettings || {
        isPrivate: false,
        showEmail: false,
        allowMessages: true,
        showActivity: true,
      };
      return {
        ...prev,
        privacySettings: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  const savePrivacySettings = async () => {
    if (!firebaseUser || !formData?.privacySettings) return;
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
            privacySettings: formData.privacySettings,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUserData((prev) => (prev ? { ...prev, privacySettings: data.user.privacySettings } : prev));
      alert("Privacy settings updated successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!file) return;
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

    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", apiKey);
    fd.append("timestamp", timestamp.toString());
    fd.append("signature", signature);
    fd.append("folder", folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: fd }
    );

    const data = await uploadRes.json();
    return data.secure_url;
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadProfilePicture(file);
      const token = await getFirebaseToken();

      const res = await fetch(`/api/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          updates: { profilePicture: imageUrl },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUserData((prev) => ({ ...data.user, posts: prev?.posts || [] }));
      setFormData((prev) => ({ ...data.user, posts: prev?.posts || [] }));
    } catch (err) {
      console.error("Failed to upload profile picture.", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const isUsernameAvailable = async (username: string) => {
    if (!username || username === userData?.username) {
      setUsernameAvailable(true);
      setUsernameAlreadyTaken(false);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const res = await fetch(`/api/register/member?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.usernameExists) {
        setUsernameAvailable(false);
        setUsernameAlreadyTaken(true);
      } else {
        setUsernameAlreadyTaken(false);
        setUsernameAvailable(true);
      }
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  useEffect(() => {
    const newUsername = formData?.username;
    if (!newUsername || newUsername === userData?.username) return;

    const delay = setTimeout(() => {
      isUsernameAvailable(newUsername);
    }, 600);

    return () => clearTimeout(delay);
  }, [formData?.username, userData?.username]);

  const handleDeletePost = async (postId: string) => {
    if (!firebaseUser) return;
    const sure = window.confirm("Are you sure you want to delete this work?");
    if (!sure) return;

    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/user/posts`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          postId: postId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUserData((prev) => (prev ? { ...prev, posts: prev.posts?.filter((p) => p._id !== postId) } : prev));
    } catch (err) {
      console.error("Failed to delete post", err);
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
            <p className="text-slate-500 text-sm mb-6">Unable to retrieve account details.</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-[#bd9864] text-white rounded-xl font-semibold"
            >
              Go to Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const pinnedPostIds = userData.pinnedPosts || [];
  const pinnedPostsList = userData.posts?.filter((p) => pinnedPostIds.includes(p._id)) || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-amber-500/20">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 w-full flex-1">
        {/* Profile Hero Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl p-6 sm:p-8 mb-8 overflow-hidden"
        >
          {/* Subtle Ambient Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#bd9864] via-amber-600 to-yellow-600" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 pt-2">
            {/* Avatar with Upload */}
            <div className="relative group flex-shrink-0">
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
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-1 right-1 bg-[#bd9864] text-white p-2 rounded-full shadow-lg hover:bg-[#a68250] hover:scale-110 active:scale-95 transition-all cursor-pointer ring-2 ring-white"
                title="Update Profile Picture"
              >
                <Edit3 size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </div>

            {/* Profile Information & Literary Metadata */}
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

                {/* Primary Action Buttons */}
                <div className="flex items-center justify-center md:justify-end gap-2.5 pt-2 md:pt-0">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#bd9864] hover:bg-[#a68250] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => setIsSocialsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 transition-all active:scale-95 cursor-pointer"
                  >
                    <Globe size={15} className="text-amber-700" />
                    <span>Connect & Socials</span>
                  </button>
                </div>
              </div>

              {/* Location & Literary Quote */}
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

              {/* Bio & Literary Quote Box */}
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

              {/* Stats Counters Bar */}
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
                <Link href="/account/friends" className="text-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors">
                  <div className="text-lg font-extrabold text-slate-900">{userData.followers?.length || 0}</div>
                  <div className="text-[11px] font-medium text-slate-500">Followers</div>
                </Link>
                <Link href="/account/friends" className="text-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors">
                  <div className="text-lg font-extrabold text-slate-900">{userData.following?.length || 0}</div>
                  <div className="text-[11px] font-medium text-slate-500">Following</div>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("works")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "works"
                  ? "bg-[#bd9864] text-white shadow-md shadow-amber-900/10"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <BookOpen size={16} />
              <span>My Works ({userData.posts?.length || 0})</span>
            </button>

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

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#bd9864] text-white shadow-md shadow-amber-900/10"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Shield size={16} />
              <span>Account & Privacy</span>
            </button>
          </div>

          <button
            onClick={() => router.push("/account/createPost")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Plus size={16} />
            <span>New Work</span>
          </button>
        </div>

        {/* Tab 1: All Works */}
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
                      } flex flex-col justify-between group`}
                    >
                      {/* Pinned Badge */}
                      {isPinned && (
                        <div className="absolute top-4 right-14 bg-amber-500 text-white px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1 shadow-sm">
                          <Pin size={11} />
                          <span>Pinned</span>
                        </div>
                      )}

                      {/* Card Content Header */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3
                            onClick={() => router.push(`/post/${post._id}`)}
                            className="text-lg sm:text-xl font-bold hover:underline cursor-pointer leading-snug"
                          >
                            {post.title}
                          </h3>

                          {/* Quick Pin Toggle Button */}
                          <button
                            onClick={() => handleTogglePin(post._id)}
                            disabled={pinningPostId === post._id}
                            className="p-1.5 rounded-xl bg-black/10 hover:bg-black/20 dark:bg-white/10 transition-colors"
                            title={isPinned ? "Unpin Post" : "Pin to Profile"}
                          >
                            {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                          </button>
                        </div>

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
                          <div
                            onClick={() => router.push(`/post/${post._id}`)}
                            className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 cursor-pointer"
                          >
                            <Image src={post.picture} alt={post.title} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}

                        <div
                          className="text-xs sm:text-sm line-clamp-3 opacity-90 leading-relaxed font-normal cursor-pointer"
                          onClick={() => router.push(`/post/${post._id}`)}
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                      </div>

                      {/* Card Action Bar */}
                      <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/post/${post._id}`)}
                            className="px-3 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 font-semibold transition-colors flex items-center gap-1"
                          >
                            <Eye size={14} />
                            <span>Read</span>
                          </button>
                          <button
                            onClick={() => handleCopyLink(post._id)}
                            className="px-3 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 font-semibold transition-colors flex items-center gap-1"
                          >
                            {copiedPostId === post._id ? <Check size={14} /> : <Share2 size={14} />}
                            <span>{copiedPostId === post._id ? "Copied" : "Share"}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Work"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                <BookOpen size={36} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Works Published Yet</h3>
                <p className="text-slate-500 text-sm mb-4">Share your writings, ghazals, essays, and stories with the community.</p>
                <button
                  onClick={() => router.push("/account/createPost")}
                  className="px-6 py-2 bg-[#bd9864] text-white font-semibold rounded-xl"
                >
                  Publish New Work
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pinned Collection */}
        {activeTab === "pinned" && (
          <div>
            {pinnedPostsList.length > 0 ? (
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
                    className="relative rounded-3xl p-6 shadow-xl border-2 border-amber-500 flex flex-col justify-between"
                  >
                    <div className="absolute -top-3 right-6 bg-amber-500 text-white px-3 py-1 rounded-full font-extrabold text-xs flex items-center gap-1 shadow-md">
                      <Pin size={12} />
                      <span>Featured Work</span>
                    </div>

                    <div className="mb-4 pt-2">
                      <h3
                        onClick={() => router.push(`/post/${post._id}`)}
                        className="text-xl font-extrabold hover:underline cursor-pointer mb-2"
                      >
                        {post.title}
                      </h3>

                      {post.picture && (
                        <div
                          onClick={() => router.push(`/post/${post._id}`)}
                          className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 cursor-pointer"
                        >
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
                      <button
                        onClick={() => handleTogglePin(post._id)}
                        className="px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-xl flex items-center gap-1"
                      >
                        <PinOff size={13} />
                        <span>Unpin</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                <Pin size={36} className="mx-auto text-amber-500/60 mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Pinned Works</h3>
                <p className="text-slate-500 text-sm mb-4">Pin up to 3 of your favorite literary works to showcase them on your profile.</p>
                <button
                  onClick={() => setActiveTab("works")}
                  className="px-6 py-2 bg-[#bd9864] text-white font-semibold rounded-xl"
                >
                  Browse Published Works
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Account & Privacy Settings */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-10 space-y-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="text-amber-700" size={22} />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Privacy & Profile Visibility</h2>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm">Manage who can see your activity, contact details, and published works.</p>
            </div>

            <div className="space-y-4">
              {/* Privacy Toggle 1 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Private Account</h4>
                  <p className="text-slate-500 text-xs">Only approved followers can view your works and profile details.</p>
                </div>
                <button
                  onClick={() => handleTogglePrivacy("isPrivate")}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formData?.privacySettings?.isPrivate ? "bg-amber-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formData?.privacySettings?.isPrivate ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Privacy Toggle 2 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Display Email on Public Profile</h4>
                  <p className="text-slate-500 text-xs">Allow visitors to see your contact email on your profile card.</p>
                </div>
                <button
                  onClick={() => handleTogglePrivacy("showEmail")}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formData?.privacySettings?.showEmail ? "bg-amber-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formData?.privacySettings?.showEmail ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Privacy Toggle 3 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Allow Direct Messages</h4>
                  <p className="text-slate-500 text-xs">Enable other writers and readers to message you directly.</p>
                </div>
                <button
                  onClick={() => handleTogglePrivacy("allowMessages")}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formData?.privacySettings?.allowMessages ? "bg-amber-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formData?.privacySettings?.allowMessages ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Privacy Toggle 4 */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Show Activity Status</h4>
                  <p className="text-slate-500 text-xs">Show when you were last active on Kavyalok.</p>
                </div>
                <button
                  onClick={() => handleTogglePrivacy("showActivity")}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    formData?.privacySettings?.showActivity ? "bg-amber-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formData?.privacySettings?.showActivity ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={savePrivacySettings}
                disabled={isUpdating}
                className="px-6 py-2.5 bg-[#bd9864] hover:bg-[#a68250] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                {isUpdating ? "Saving..." : "Save Privacy Settings"}
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Social Links Pop-up Drawer Modal */}
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
                  <h3 className="font-bold text-slate-900 text-lg">Social Profiles & Connect</h3>
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
                    <p className="text-sm font-medium">No social profiles configured yet.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => {
                    setIsSocialsModalOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
                >
                  <Edit3 size={13} />
                  <span>Update Social Links</span>
                </button>
                <button
                  onClick={() => setIsSocialsModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Full Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Edit3 className="text-amber-700" size={20} />
                  <h3 className="font-bold text-slate-900 text-lg">Edit Profile & Details</h3>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-base border-b pb-1 flex items-center gap-1.5">
                    <Feather size={16} className="text-amber-700" />
                    Personal & Literary Identity
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={formData?.name || ""}
                        onChange={(e) => setFormData((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pen Name (Pseudonym)</label>
                      <input
                        type="text"
                        placeholder="e.g. Ghalib, Meer, Nirala"
                        value={formData?.penName || ""}
                        onChange={(e) => setFormData((prev) => (prev ? { ...prev, penName: e.target.value } : null))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={formData?.username || ""}
                        onChange={(e) => setFormData((prev) => (prev ? { ...prev, username: e.target.value } : null))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                      />
                      {isCheckingUsername && <p className="text-[11px] text-slate-400 mt-1">Checking username...</p>}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Location / Region</label>
                      <input
                        type="text"
                        placeholder="e.g. New Delhi, India"
                        value={formData?.location || ""}
                        onChange={(e) => setFormData((prev) => (prev ? { ...prev, location: e.target.value } : null))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Favorite Literary Genre</label>
                    <input
                      type="text"
                      placeholder="e.g. Ghazal, Free Verse, Essays, Fiction, Philosophy"
                      value={formData?.favoriteGenre || ""}
                      onChange={(e) => setFormData((prev) => (prev ? { ...prev, favoriteGenre: e.target.value } : null))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bio</label>
                    <textarea
                      value={formData?.bio || ""}
                      onChange={(e) => setFormData((prev) => (prev ? { ...prev, bio: e.target.value } : null))}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Favorite Literary Quote or Excerpt</label>
                    <input
                      type="text"
                      placeholder="e.g. 'Hazaron khwahishen aisi ki har khwahish pe dam nikle'"
                      value={formData?.literaryQuote || ""}
                      onChange={(e) => setFormData((prev) => (prev ? { ...prev, literaryQuote: e.target.value } : null))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Social Profiles */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                    <Globe size={16} className="text-amber-700" />
                    Social Profiles
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Instagram</label>
                      <input
                        type="text"
                        placeholder="username"
                        value={formData?.instagram || ""}
                        onChange={(e) => setFormData((prev) => (prev ? { ...prev, instagram: e.target.value } : null))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">X (Twitter)</label>
                      <input
                        type="text"
                        placeholder="username"
                        value={formData?.twitter || ""}
                        onChange={(e) => setFormData((prev) => (prev ? { ...prev, twitter: e.target.value } : null))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-slate-600 mb-1">YouTube</label>
                      <input
                        type="text"
                        placeholder="channel / link"
                        value={formData?.youtube || ""}
                        onChange={(e) => setFormData((prev) => (prev ? { ...prev, youtube: e.target.value } : null))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">LinkedIn</label>
                      <input
                        type="text"
                        placeholder="username"
                        value={formData?.linkedin || ""}
                        onChange={(e) => setFormData((prev) => (prev ? { ...prev, linkedin: e.target.value } : null))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Personal Website / Blog</label>
                    <input
                      type="text"
                      placeholder="https://yourwebsite.com"
                      value={formData?.website || ""}
                      onChange={(e) => setFormData((prev) => (prev ? { ...prev, website: e.target.value } : null))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-6 py-2 bg-[#bd9864] hover:bg-[#a68250] text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isUpdating ? "Saving Changes..." : "Save Profile"}
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
