"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import { X, Feather, Upload, Loader2, Sparkles, Image as ImageIcon, Tag, Palette } from "lucide-react";
import { getFirebaseToken } from "@/utils";
import { User as FirebaseUser } from "firebase/auth";

const QuillEditor = dynamic(() => import("@/components/TestEditor"), {
  ssr: false,
});

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: FirebaseUser | null;
  onPostCreated?: () => void;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  firebaseUser,
  onPostCreated,
}: CreatePostModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [allTags, setAllTags] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState("#ffffff");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (allTags) {
      const extractedTags = allTags
        .split(" ")
        .map((tag) => tag.replace("#", "").trim())
        .filter((tag) => tag.length > 0);
      setTags(extractedTags);
    } else {
      setTags([]);
    }
  }, [allTags]);

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

  const validateAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height;
        URL.revokeObjectURL(img.src);
        resolve(Math.abs(ratio - 16 / 9) <= 0.2);
      };
      img.onerror = () => resolve(false);
    });
  };

  const uploadCoverImage = async (file: File) => {
    setIsUploading(true);
    try {
      const token = await getFirebaseToken();
      const signRes = await fetch("/api/signPostCovers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folder: "postCovers" }),
      });

      const { timestamp, signature, apiKey, folder } = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await uploadRes.json();
      if (data.secure_url) {
        setCoverImage(data.secure_url);
      } else {
        throw new Error("Invalid response from Cloudinary");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload cover image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValid = await validateAspectRatio(file);
    if (!isValid) {
      alert("Please upload an image with a 16:9 aspect ratio for optimal display.");
    }

    await uploadCoverImage(file);
  };

  const getTextColor = (bgColor: string): string => {
    if (!bgColor) return "#0f172a";
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 150 ? "#0f172a" : "#ffffff";
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please provide both a title and content for your post.");
      return;
    }

    if (!firebaseUser?.email) {
      alert("You must be logged in to create a post.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getFirebaseToken();
      const res = await fetch("/api/createPost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          picture: coverImage,
          email: firebaseUser.email,
          tags,
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");

      // Reset Form & Close
      setTitle("");
      setContent("");
      setCoverImage(null);
      setAllTags("");
      setColor("#ffffff");

      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const textColor = getTextColor(color);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-800">
                <Feather size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Compose New Post</h3>
                <p className="text-xs text-slate-500 font-medium">Share your literary creations with Kavyalok</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Post Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your piece a powerful title..."
                className="w-full text-lg font-bold px-4 py-3 rounded-2xl border border-slate-200 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 focus:outline-none transition-all placeholder:text-slate-400 text-slate-900 bg-slate-50/50"
              />
            </div>

            {/* Cover Image Upload (16:9) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span>Cover Image (16:9 ratio)</span>
                {coverImage && (
                  <button
                    onClick={() => setCoverImage(null)}
                    className="text-xs text-rose-600 hover:underline font-semibold capitalize"
                  >
                    Remove Image
                  </button>
                )}
              </label>

              {coverImage ? (
                <div className="relative w-full h-52 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                  <Image src={coverImage} alt="Cover Preview" fill className="object-cover" />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-amber-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/20 transition-all duration-200 group text-center"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center text-slate-500">
                      <Loader2 size={24} className="animate-spin text-amber-700 mb-2" />
                      <p className="text-xs font-semibold">Uploading cover image...</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-full bg-slate-100 group-hover:bg-amber-100 text-slate-500 group-hover:text-amber-800 transition-colors mb-2">
                        <ImageIcon size={22} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-amber-800">
                        Click to upload cover image
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WEBP (16:9 recommended)</p>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Post Content */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Post Content
              </label>
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 shadow-xs">
                <QuillEditor
                  key="post-modal-editor"
                  value={content}
                  onChange={(html) => setContent(html)}
                />
              </div>
            </div>

            {/* Tags & Mood Color Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Tag size={13} />
                  <span>Tags</span>
                </label>
                <input
                  type="text"
                  value={allTags}
                  onChange={(e) => setAllTags(e.target.value)}
                  placeholder="e.g. #poetry #story #life"
                  className="w-full text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 focus:outline-none transition-all text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Palette size={13} />
                  <span>Post Mood Color</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 shadow-xs"
                  />
                  <div
                    style={{ backgroundColor: color, color: textColor }}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-between"
                  >
                    <span>Preview Card Tone</span>
                    <Sparkles size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Feather size={16} />
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
