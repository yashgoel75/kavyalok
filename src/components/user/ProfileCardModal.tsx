"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

interface ProfileCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    username: string;
    profilePicture?: string;
    penName?: string;
    bio?: string;
    isVerified?: boolean;
  };
}

const COLOR_PRESETS = [
  { name: "Midnight Dark", value: "#09090b", text: "#ffffff" },
  { name: "Kavyalok Gold", value: "#1e1a12", text: "#ffffff", accent: "#eab308" },
  { name: "Deep Violet", value: "#2e1065", text: "#ffffff", accent: "#a855f7" },
  { name: "Emerald Ink", value: "#064e3b", text: "#ffffff", accent: "#10b981" },
  { name: "Crimson Red", value: "#450a0a", text: "#ffffff", accent: "#f43f5e" },
  { name: "Slate Minimal", value: "#1e293b", text: "#ffffff", accent: "#38bdf8" },
];

export default function ProfileCardModal({
  isOpen,
  onClose,
  user,
}: ProfileCardModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(COLOR_PRESETS[0]);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dataUrlAvatar, setDataUrlAvatar] = useState<string | null>(null);

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

  // Convert profile avatar to base64 Data URL so html-to-image includes it 100% cleanly in PNG download
  useEffect(() => {
  let mounted = true;

  async function loadAvatar() {
    if (!user.profilePicture || !isOpen) {
      setDataUrlAvatar(null);
      return;
    }

    try {
      const res = await fetch(user.profilePicture, {
        mode: "cors",
        cache: "no-cache",
      });
      console.log(user.profilePicture);
      const blob = await res.blob();

      const reader = new FileReader();

      reader.onloadend = () => {
        if (mounted) {
          setDataUrlAvatar(reader.result as string);
        }
      };

      reader.readAsDataURL(blob);
    } catch {
      if (mounted) {
        // fallback
        setDataUrlAvatar(user.profilePicture);
      }
    }
  }

  loadAvatar();

  return () => {
    mounted = false;
  };
}, [user.profilePicture, isOpen]);

  if (!isOpen) return null;

  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/user/${user.username}` : "";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}&color=000000&bgcolor=ffffff`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
  if (!cardRef.current) return;

  setIsDownloading(true);

  try {
    // Wait for all images inside the card
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
    link.download = `${user.username}-kavyalok-card.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error(err);
  } finally {
    setIsDownloading(false);
  }
};

  const cardBg = selectedTheme.value;

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
              <h3 className="font-extrabold text-slate-900 text-lg">Profile Card</h3>
              <p className="text-xs text-slate-500 font-medium">Share your Kavyalok profile with friends</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Downloadable Visual Profile Card */}
            <div
              ref={cardRef}
              style={{ backgroundColor: cardBg }}
              className="relative rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-white/10 overflow-hidden space-y-6 transition-colors duration-300"
            >
              {/* Brand Logo in Kavyalok Custom Font */}
              <div className="flex items-center justify-start">
                <span className="custom-class text-3xl font-normal tracking-wide text-white">
                  Kavyalok
                </span>
              </div>

              {/* User Info & Avatar */}
              <div className="flex items-center gap-4 pt-2">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0 bg-white/10">
                  {dataUrlAvatar || user.profilePicture ? (
                    <img
                      src={dataUrlAvatar || user.profilePicture}
                      alt={user.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/20 text-2xl font-extrabold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-extrabold text-lg sm:text-xl truncate leading-tight">{user.name}</h4>
                    {user.isVerified && (
                      <span className="p-0.5 bg-emerald-500 text-white rounded-full text-[10px]" title="Verified">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-75 font-semibold mt-0.5">@{user.username}</p>
                  {user.penName && (
                    <p className="text-[11px] opacity-90 font-serif italic mt-1">✒️ {user.penName}</p>
                  )}
                </div>
              </div>

              {/* Bio Excerpt */}
              {user.bio && (
                <p className="text-xs opacity-85 line-clamp-2 font-normal leading-relaxed border-t border-white/10 pt-3 whitespace-pre-line">
                  {user.bio}
                </p>
              )}

              {/* QR Code Container with Extra Padding */}
              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <div>
                  <p className="text-[10px] uppercase font-extrabold tracking-wider opacity-70">Scan Profile</p>
                  <p className="text-xs font-bold mt-0.5">kavyalok.in/user/{user.username}</p>
                </div>
                <div className="p-2 m-2 sm:p-2 bg-white rounded-2xl shadow-md border border-white/20 flex-shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="Profile QR Code"
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded p-1"
                  />
                </div>
              </div>
            </div>

            {/* Theme Picker - Centered Buttons */}
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
