"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Download, Loader2, Heart, Clock } from "lucide-react";
import { toPng } from "html-to-image";
import { getTextColor } from "@/lib/utils";

interface PostCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    content: string;
    picture?: string;
    likes?: number;
    color?: string;
    createdAt?: string | Date;
    author: {
      name: string;
      username: string;
      profilePicture?: string;
      isVerified?: boolean;
      penName?: string;
    };
  };
}

const COLOR_PRESETS = [
  { name: "Midnight Dark", value: "#09090b", accent: "#a1a1aa" },
  { name: "Kavyalok Gold", value: "#1e1a12", accent: "#eab308" },
  { name: "Deep Violet", value: "#2e1065", accent: "#a855f7" },
  { name: "Emerald Ink", value: "#064e3b", accent: "#10b981" },
  { name: "Crimson Red", value: "#450a0a", accent: "#f43f5e" },
  { name: "Slate Minimal", value: "#1e293b", accent: "#38bdf8" },
];

function getCleanExcerpt(htmlContent: string, maxLength = 180): string {
  if (!htmlContent) return "";
  const plainText = htmlContent.replace(/<[^>]*>?/gm, "").trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + "...";
}

function getReadingTime(htmlContent: string): number {
  const plainText = htmlContent?.replace(/<[^>]*>?/gm, "") || "";
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function PostCardModal({
  isOpen,
  onClose,
  post,
}: PostCardModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(COLOR_PRESETS[0]);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [dataUrlAvatar, setDataUrlAvatar] = useState<string | null>(null);
  const [dataUrlPostPic, setDataUrlPostPic] = useState<string | null>(null);

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

  // If post has a custom color, update initial selection if matching or set custom
  useEffect(() => {
    if (post.color) {
      const match = COLOR_PRESETS.find(
        (p) => p.value.toLowerCase() === post.color?.toLowerCase()
      );
      if (match) {
        setSelectedTheme(match);
      } else {
        setSelectedTheme({
          name: "Post Color",
          value: post.color,
          accent: "#eab308",
        });
      }
    }
  }, [post.color]);

  // Convert author profile picture and post image to Base64 for seamless PNG export
  useEffect(() => {
    let mounted = true;

    async function loadImages() {
      if (!isOpen) return;

      // 1. Load Avatar
      if (post.author?.profilePicture) {
        try {
          const res = await fetch(post.author.profilePicture, {
            mode: "cors",
            cache: "no-cache",
          });
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (mounted) setDataUrlAvatar(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch {
          if (mounted) setDataUrlAvatar(post.author.profilePicture);
        }
      } else {
        setDataUrlAvatar(null);
      }

      // 2. Load Post Picture
      if (post.picture) {
        try {
          const res = await fetch(post.picture, {
            mode: "cors",
            cache: "no-cache",
          });
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (mounted) setDataUrlPostPic(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch {
          if (mounted) setDataUrlPostPic(post.picture);
        }
      } else {
        setDataUrlPostPic(null);
      }
    }

    loadImages();

    return () => {
      mounted = false;
    };
  }, [post.author?.profilePicture, post.picture, isOpen]);

  if (!isOpen) return null;

  const cardTextColor = getTextColor(selectedTheme.value);
  const isDarkText = cardTextColor === "#000000";

  const postUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${post.id}`
      : "";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    postUrl
  )}&color=000000&bgcolor=ffffff`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);

    try {
      // Wait for all images inside the card to load
      const images = Array.from(cardRef.current.querySelectorAll("img"));

      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });

      const link = document.createElement("a");
      link.download = `kavyalok-${post.title.substring(0, 20).toLowerCase().replace(/\s+/g, "-")}-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download post card:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const cleanExcerpt = getCleanExcerpt(post.content);
  const readingTime = getReadingTime(post.content);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Share Post Card</h3>
              <p className="text-xs text-slate-500 font-medium">Download or share a visual card of this post</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* --- VISUAL POST CARD REF FOR PNG EXPORT --- */}
            <div
              ref={cardRef}
              style={{ backgroundColor: selectedTheme.value, color: cardTextColor }}
              className={`relative rounded-3xl p-6 sm:p-7 shadow-2xl border overflow-hidden space-y-5 transition-colors duration-300 ${
                isDarkText ? "border-black/10" : "border-white/10"
              }`}
            >
              {/* Top Bar: Kavyalok Logo */}
              <div className={`flex items-center justify-between border-b pb-3 ${
                isDarkText ? "border-black/10" : "border-white/10"
              }`}>
                <span
                  className="custom-class text-2xl font-normal tracking-wide"
                  style={{ color: cardTextColor }}
                >
                  Kavyalok
                </span>
              </div>

              {/* Author Row */}
              <div className="flex items-center gap-3">
                <div className={`relative w-11 h-11 rounded-full overflow-hidden border shadow-md flex-shrink-0 ${
                  isDarkText ? "border-black/20 bg-black/5" : "border-white/30 bg-white/10"
                }`}>
                  {dataUrlAvatar || post.author?.profilePicture ? (
                    <img
                      src={dataUrlAvatar || post.author.profilePicture}
                      alt={post.author.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-sm font-extrabold"
                      style={{ color: cardTextColor }}
                    >
                      {post.author?.name ? post.author.name.charAt(0).toUpperCase() : "K"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <h5
                      className="font-extrabold text-sm truncate leading-tight"
                      style={{ color: cardTextColor }}
                    >
                      {post.author?.name}
                    </h5>
                    {post.author?.isVerified && (
                      <span className="p-0.5 bg-emerald-500 text-white rounded-full text-[9px]" title="Verified">
                        <Check size={9} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium opacity-75" style={{ color: cardTextColor }}>
                    @{post.author?.username}
                  </p>
                </div>
              </div>

              {/* Post Title & Content Excerpt */}
              <div className="space-y-2">
                <h3
                  className="font-extrabold text-lg sm:text-xl leading-snug tracking-tight"
                  style={{ color: cardTextColor }}
                >
                  {post.title}
                </h3>

                {/* Optional Post Picture Preview */}
                {(dataUrlPostPic || post.picture) && (
                  <div className={`w-full h-40 rounded-2xl overflow-hidden my-3 border ${
                    isDarkText ? "border-black/15" : "border-white/15"
                  }`}>
                    <img
                      src={dataUrlPostPic || post.picture}
                      alt={post.title}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Clean Excerpt */}
                <p
                  className="text-xs sm:text-sm line-clamp-4 font-normal leading-relaxed opacity-90"
                  style={{ color: cardTextColor }}
                >
                  &ldquo;{cleanExcerpt}&rdquo;
                </p>
              </div>

              {/* Post Footer: Metrics & QR Code */}
              <div className={`pt-3 flex items-center justify-between border-t ${
                isDarkText ? "border-black/10" : "border-white/10"
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 text-xs font-bold" style={{ color: cardTextColor }}>
                    <span className="flex items-center gap-1 text-rose-500">
                      <Heart size={13} className="fill-rose-500" />
                      {post.likes || 0} Likes
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 opacity-80" style={{ color: cardTextColor }}>
                      <Clock size={13} />
                      {readingTime} min read
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold opacity-65" style={{ color: cardTextColor }}>
                    Scan to read full piece
                  </p>
                </div>

                <div className={`p-1.5 bg-white rounded-xl shadow-md border flex-shrink-0 ${
                  isDarkText ? "border-slate-200" : "border-white/20"
                }`}>
                  <img
                    src={qrCodeUrl}
                    alt="Post QR Code"
                    className="w-14 h-14 rounded p-0.5"
                  />
                </div>
              </div>
            </div>
            {/* --- END VISUAL POST CARD --- */}

            {/* Theme Color Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                Card Theme Colors
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setSelectedTheme(preset)}
                    style={{ backgroundColor: preset.value }}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-bold text-white border transition-all flex items-center justify-center text-center gap-1.5 cursor-pointer ${
                      selectedTheme.name === preset.name
                        ? "border-white ring-2 ring-slate-900/40 scale-[1.02]"
                        : "border-transparent opacity-90 hover:opacity-100"
                    }`}
                  >
                    <span className="truncate text-center">{preset.name.split(" ")[0]}</span>
                    {selectedTheme.name === preset.name && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={15} />
                  <span>Copied Link</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-extrabold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download Card</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
