"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Download,
  Loader2,
  Heart,
  Clock,
  Smartphone,
  Square,
  RectangleVertical,
  CreditCard,
  Palette,
  Share2,
  QrCode,
  Sparkles,
  Layers,
  Eye,
} from "lucide-react";
import { getTextColor } from "@/lib/utils";
import {
  ExportOrientation,
  ORIENTATION_OPTIONS,
  CANVAS_BG_PRESETS,
  CanvasBgPreset,
  CARD_THEME_PRESETS,
  CardThemePreset,
  imageUrlToDataUrl,
  downloadElementAsHdPng,
  shareElementAsHdImage,
} from "@/lib/shareCardUtils";

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

function getCleanExcerpt(htmlContent: string, maxLength = 220): string {
  if (!htmlContent) return "";
  let text = htmlContent
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  text = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

function getReadingTime(htmlContent: string): number {
  const plainText =
    htmlContent
      ?.replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, " ")
      .replace(/<[^>]*>?/gm, " ") || "";
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function getCanvasTextColor(preset: CanvasBgPreset, customColor: string): string {
  if (preset.type === "custom") {
    return getTextColor(customColor);
  }
  if (preset.type === "solid") {
    return getTextColor(preset.value);
  }
  if (preset.id === "clean_light" || preset.id === "solid_white") {
    return "#0f172a";
  }
  return "#ffffff";
}

export default function PostCardModal({
  isOpen,
  onClose,
  post,
}: PostCardModalProps) {
  const exportRef = useRef<HTMLDivElement | null>(null);

  // States for format & orientation
  const [orientation, setOrientation] = useState<ExportOrientation>("story");
  const [activeTab, setActiveTab] = useState<"format" | "canvas" | "theme">("format");

  // States for canvas background styling
  const [canvasBgPreset, setCanvasBgPreset] = useState<CanvasBgPreset>(CANVAS_BG_PRESETS[0]);
  const [customCanvasColor, setCustomCanvasColor] = useState("#0f172a");

  // States for card theme styling
  const [selectedTheme, setSelectedTheme] = useState<CardThemePreset>(CARD_THEME_PRESETS[0]);

  // Options toggles
  const [showQrCode, setShowQrCode] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [showIgGuide, setShowIgGuide] = useState(true); // Preview-only Instagram Story UI overlay

  // Action states
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Base64 Images for export
  const [dataUrlAvatar, setDataUrlAvatar] = useState<string | null>(null);
  const [dataUrlPostPic, setDataUrlPostPic] = useState<string | null>(null);

  // ESC Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Initial Post color sync if provided
  useEffect(() => {
    if (post.color) {
      const match = CARD_THEME_PRESETS.find(
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

  // Load images into Base64 data URLs to prevent CORS export glitches
  useEffect(() => {
    let mounted = true;
    async function loadImages() {
      if (!isOpen) return;

      if (post.author?.profilePicture) {
        const dataUrl = await imageUrlToDataUrl(post.author.profilePicture);
        if (mounted) setDataUrlAvatar(dataUrl);
      } else {
        setDataUrlAvatar(null);
      }

      if (post.picture) {
        const dataUrl = await imageUrlToDataUrl(post.picture);
        if (mounted) setDataUrlPostPic(dataUrl);
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

  const cardTextColor = selectedTheme.isGlass
    ? "#ffffff"
    : getTextColor(selectedTheme.value);
  const isDarkText = cardTextColor === "#000000";

  // Dynamic canvas text color for logo & outer watermarks
  const canvasTextColor = getCanvasTextColor(canvasBgPreset, customCanvasColor);
  const isCanvasDarkText = canvasTextColor === "#0f172a" || canvasTextColor === "#000000";

  const postUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${post.id}`
      : `https://kavyalok.in/post/${post.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    postUrl
  )}&color=000000&bgcolor=ffffff`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!exportRef.current) return;
    setIsDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const filename = `kavyalok-${orientation}-${post.title
        .substring(0, 20)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.png`;
      await downloadElementAsHdPng(exportRef.current, filename, 3);
    } catch (err) {
      console.error("Failed to export post card:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareNative = async () => {
    if (!exportRef.current) return;
    setIsSharing(true);
    try {
      const shared = await shareElementAsHdImage(
        exportRef.current,
        post.title,
        `Read "${post.title}" by ${post.author.name} on Kavyalok!`
      );
      if (!shared) {
        handleCopyLink();
      }
    } catch (err) {
      console.error("Error sharing:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const cleanExcerpt = getCleanExcerpt(post.content);
  const readingTime = getReadingTime(post.content);

  // Orientation Boolean Helpers for Dynamic Responsive Layout Scaling
  const isSquare = orientation === "post_square";
  const isPortrait = orientation === "post_portrait";
  const isStory = orientation === "story";
  const isAuto = orientation === "card_auto";

  // Compute CSS for outer Canvas background
  const getCanvasStyle = (): React.CSSProperties => {
    if (canvasBgPreset.type === "custom") {
      return { backgroundColor: customCanvasColor };
    }
    if (canvasBgPreset.type === "solid") {
      return { backgroundColor: canvasBgPreset.value };
    }
    if (canvasBgPreset.type === "gradient") {
      return { background: canvasBgPreset.value };
    }
    if (canvasBgPreset.type === "blur") {
      return {
        backgroundColor: "#09090b",
      };
    }
    return { background: CANVAS_BG_PRESETS[0].value };
  };

  // Exact Aspect-Ratio Container Sizing
  const getOrientationFrameClass = () => {
    switch (orientation) {
      case "story":
        return "w-[290px] xs:w-[310px] sm:w-[340px] aspect-[9/16]";
      case "post_square":
        return "w-[290px] xs:w-[310px] sm:w-[360px] aspect-square";
      case "post_portrait":
        return "w-[290px] xs:w-[310px] sm:w-[350px] aspect-[4/5]";
      case "card_auto":
      default:
        return "w-full max-w-md aspect-auto";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[96vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                  Card Studio & Share
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body: Split View (Left: Live Studio Preview | Right: Customization Controls) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto custom-scrollbar bg-slate-100/70 dark:bg-slate-950/70">
            {/* LEFT / VIEWPORT: Live Interactive Render Preview */}
            <div className="lg:col-span-7 p-3 sm:p-6 flex flex-col items-center justify-center min-h-[360px] sm:min-h-[460px] lg:min-h-[500px] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800/80 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />

              {/* Viewport Scale Wrapper - Scales down gracefully on mobile so full card is always 100% visible */}
              <div className="w-full flex items-center justify-center py-1 sm:py-2 relative z-10 scale-[0.78] xs:scale-[0.88] sm:scale-100 origin-center transition-transform">
                {/* --- THIS CONTAINER IS CAPTURED AS HD PNG --- */}
                <div
                  ref={exportRef}
                  style={getCanvasStyle()}
                  className={`relative ${getOrientationFrameClass()} transition-all duration-300 shadow-2xl overflow-hidden flex flex-col justify-between border border-white/10 ${
                    isDownloading ? "rounded-none" : "rounded-3xl"
                  } ${
                    isStory
                      ? "pt-11 sm:pt-14 pb-11 sm:pb-14 px-4 sm:px-5"
                      : isSquare
                      ? "p-3 sm:p-3.5"
                      : isPortrait
                      ? "p-3.5 sm:p-4"
                      : "p-4 sm:p-5"
                  }`}
                >
                  {/* Blurred Backdrop Image Mode */}
                  {canvasBgPreset.type === "blur" && (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      {dataUrlPostPic || post.picture || dataUrlAvatar || post.author.profilePicture ? (
                        <img
                          src={dataUrlPostPic || post.picture || dataUrlAvatar || post.author.profilePicture}
                          alt="Backdrop blur"
                          className="w-full h-full object-cover blur-2xl scale-125 opacity-60"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950" />
                      )}
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
                    </div>
                  )}

                  {/* REALISTIC INSTAGRAM STORY UI OVERLAY GUIDE (Preview Only - Excluded in HD PNG Download via no-export) */}
                  {isStory && showIgGuide && !isDownloading && (
                    <div className="no-export pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-3 select-none">
                      {/* Top Instagram Header Mockup */}
                      <div className="space-y-2 pt-0.5">
                        <div className="w-full flex gap-1 h-0.5">
                          <div className="h-full flex-1 bg-white/70 rounded-full" />
                          <div className="h-full flex-1 bg-white/30 rounded-full" />
                          <div className="h-full flex-1 bg-white/30 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between text-white drop-shadow-md px-0.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[1.5px]">
                              <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-[9px] font-bold text-white">
                                {post.author?.name ? post.author.name.charAt(0).toUpperCase() : "U"}
                              </div>
                            </div>
                            <div className="leading-none">
                              <span className="text-[11px] font-semibold text-white tracking-tight">
                                {post.author?.username || "your_username"}
                              </span>
                              <span className="opacity-60 text-[9px] ml-1.5">2h</span>
                            </div>
                          </div>
                          <div className="text-white/80 text-[10px] tracking-widest font-bold">•••</div>
                        </div>
                      </div>

                      {/* Bottom Instagram Interactive Bar Mockup */}
                      <div className="flex items-center gap-2 pb-0.5 text-white">
                        <div className="flex-1 bg-slate-950/40 backdrop-blur-md border border-white/25 rounded-full px-3 py-1.5 text-[10px] text-white/70 font-medium">
                          Send message...
                        </div>
                        <div className="p-1.5 bg-slate-950/40 backdrop-blur-md rounded-full border border-white/20 text-white">
                          <Heart size={13} className="fill-white/20" />
                        </div>
                        <div className="p-1.5 bg-slate-950/40 backdrop-blur-md rounded-full border border-white/20 text-white">
                          <Share2 size={13} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Branding Header (Positioned cleanly inside Story Safe Area) */}
                  {showWatermark && !isAuto && (
                    <div
                      className={`flex-shrink-0 relative z-10 flex items-center justify-between border-b ${
                        isSquare ? "pb-1" : "pb-1.5"
                      } ${isCanvasDarkText ? "border-black/15" : "border-white/15"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`custom-class font-normal tracking-wide drop-shadow-sm ${
                            isSquare ? "text-base" : isStory ? "text-lg" : "text-xl"
                          }`}
                          style={{ color: canvasTextColor }}
                        >
                          Kavyalok
                        </span>
                      </div>
                    </div>
                  )}

                  {/* --- MIDDLE CONTAINER: Centers Inner Card in Story Safe Zone --- */}
                  <div className="flex-1 min-h-0 py-1.5 flex items-center justify-center relative z-10 w-full">
                    {/* --- INNER FLOATING POST CARD --- */}
                    <div
                      style={{
                        backgroundColor: selectedTheme.value,
                        color: cardTextColor,
                      }}
                      className={`w-full max-h-full rounded-2xl shadow-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                        isSquare
                          ? "p-2.5 sm:p-3 space-y-1.5"
                          : isPortrait
                          ? "p-3 sm:p-3.5 space-y-2"
                          : "p-3.5 sm:p-4 space-y-2.5 max-w-[275px] sm:max-w-[295px] mx-auto"
                      } ${
                        selectedTheme.isGlass
                          ? "backdrop-blur-xl bg-slate-900/75 border-white/20 shadow-2xl"
                          : isDarkText
                          ? "border-black/10 shadow-black/10"
                          : "border-white/10 shadow-black/30"
                      }`}
                    >
                      {/* Brand header if card_auto and watermark enabled */}
                      {showWatermark && isAuto && (
                        <div
                          className={`flex-shrink-0 flex items-center justify-between border-b pb-1.5 ${
                            isDarkText ? "border-black/10" : "border-white/10"
                          }`}
                        >
                          <span
                            className="custom-class text-lg font-normal tracking-wide"
                            style={{ color: cardTextColor }}
                          >
                            Kavyalok
                          </span>
                        </div>
                      )}

                      {/* Author Row */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <div
                          className={`relative rounded-full overflow-hidden border shadow-md flex-shrink-0 ${
                            isSquare ? "w-7 h-7" : isPortrait ? "w-8 h-8" : "w-8 sm:w-9 h-8 sm:h-9"
                          } ${
                            isDarkText
                              ? "border-black/20 bg-black/5"
                              : "border-white/30 bg-white/10"
                          }`}
                        >
                          {dataUrlAvatar || post.author?.profilePicture ? (
                            <img
                              src={dataUrlAvatar || post.author.profilePicture}
                              alt={post.author.name}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex items-center justify-center font-extrabold ${
                                isSquare ? "text-[10px]" : "text-xs"
                              }`}
                              style={{ color: cardTextColor }}
                            >
                              {post.author?.name
                                ? post.author.name.charAt(0).toUpperCase()
                                : "K"}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <h5
                              className={`font-extrabold truncate leading-tight ${
                                isSquare ? "text-[11px]" : "text-xs sm:text-sm"
                              }`}
                              style={{ color: cardTextColor }}
                            >
                              {post.author?.name}
                            </h5>
                            {post.author?.isVerified && (
                              <span
                                className="p-0.5 bg-emerald-500 text-white rounded-full text-[7px]"
                                title="Verified"
                              >
                                <Check size={7} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <p
                            className={`font-medium opacity-75 ${
                              isSquare ? "text-[9px]" : "text-[10px]"
                            }`}
                            style={{ color: cardTextColor }}
                          >
                            @{post.author?.username}
                          </p>
                        </div>
                      </div>

                      {/* Post Content Excerpt & Picture */}
                      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-center space-y-1">
                        <h4
                          className={`font-extrabold leading-snug tracking-tight ${
                            isSquare
                              ? "text-xs line-clamp-1"
                              : isPortrait
                              ? "text-xs sm:text-sm line-clamp-2"
                              : "text-xs sm:text-sm line-clamp-2"
                          }`}
                          style={{ color: cardTextColor }}
                        >
                          {post.title}
                        </h4>

                        {/* Optional Post Picture Preview */}
                        {(dataUrlPostPic || post.picture) && (
                          <div
                            className={`w-full rounded-xl overflow-hidden border flex-shrink-0 ${
                              isSquare
                                ? "max-h-20 my-0.5"
                                : isPortrait
                                ? "max-h-28 my-1"
                                : "max-h-28 sm:max-h-32 my-1"
                            } ${
                              isDarkText ? "border-black/15" : "border-white/15"
                            }`}
                          >
                            <img
                              src={dataUrlPostPic || post.picture}
                              alt={post.title}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <p
                          className={`font-normal leading-relaxed opacity-90 whitespace-pre-line ${
                            isSquare
                              ? "text-[9px] sm:text-[10px] line-clamp-2"
                              : isPortrait
                              ? "text-[11px] line-clamp-3"
                              : "text-[11px] sm:text-xs line-clamp-4"
                          }`}
                          style={{ color: cardTextColor }}
                        >
                          &ldquo;{cleanExcerpt}&rdquo;
                        </p>
                      </div>

                      {/* Card Metrics & Optional QR Code */}
                      <div
                        className={`flex-shrink-0 flex items-center justify-between border-t ${
                          isSquare ? "pt-1" : "pt-1.5"
                        } ${
                          isDarkText ? "border-black/10" : "border-white/10"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div
                            className={`flex items-center gap-1.5 font-bold ${
                              isSquare ? "text-[9px]" : "text-[10px]"
                            }`}
                            style={{ color: cardTextColor }}
                          >
                            <span className="flex items-center gap-1">
                              <Heart
                                size={isSquare ? 10 : 11}
                                className={
                                  isDarkText
                                    ? "fill-rose-600 text-rose-600"
                                    : "fill-rose-400 text-rose-400"
                                }
                              />
                              <span>{post.likes || 0} Likes</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 opacity-90">
                              <Clock size={isSquare ? 10 : 11} />
                              {readingTime} min read
                            </span>
                          </div>
                          <p
                            className={`font-semibold opacity-75 ${
                              isSquare ? "text-[7px]" : "text-[8px]"
                            }`}
                            style={{ color: cardTextColor }}
                          >
                            Scan QR or visit kavyalok.in
                          </p>
                        </div>

                        {showQrCode && (
                          <div
                            className={`bg-white rounded-xl shadow-md border flex-shrink-0 ${
                              isSquare ? "p-0.5" : "p-1"
                            } ${
                              isDarkText ? "border-slate-200" : "border-white/20"
                            }`}
                          >
                            <img
                              src={qrCodeUrl}
                              alt="Post QR Code"
                              className={`rounded ${
                                isSquare
                                  ? "w-7 h-7 p-0.5"
                                  : isPortrait
                                  ? "w-8 h-8 p-0.5"
                                  : "w-8 h-8 sm:w-9 sm:h-9 p-0.5"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer Tag (Positioned safely above IG Story bottom controls) */}
                  {showWatermark && !isAuto && (
                    <div
                      className={`flex-shrink-0 relative z-10 flex flex-col items-start justify-between border-t font-medium ${
                        isSquare ? "pt-1 text-[8px]" : "pt-1.5 text-[9px] sm:text-[10px]"
                      } ${isCanvasDarkText ? "border-black/15" : "border-white/15"}`}
                      style={{
                        color: isCanvasDarkText
                          ? "rgba(15, 23, 42, 0.85)"
                          : "rgba(255, 255, 255, 0.85)",
                      }}
                    >
                      <div>kavyalok.in/post/{post.id}</div>
                      <div className="font-semibold">Scan to read full</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT / CONTROLS PANEL: Customization Tabs & Options */}
            <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900">
              {/* Tabs header */}
              <div className="space-y-5">
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveTab("format")}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "format"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>Format</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("canvas")}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "canvas"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Palette size={14} />
                    <span>Canvas</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("theme")}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "theme"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Layers size={14} />
                    <span>Card Theme</span>
                  </button>
                </div>

                {/* TAB 1: FORMAT & ORIENTATION */}
                {activeTab === "format" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Export Orientation
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Choose output layout ratio optimized for your favorite social platform
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {ORIENTATION_OPTIONS.map((opt) => {
                        const isSelected = orientation === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setOrientation(opt.id)}
                            className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                              isSelected
                                ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20"
                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-xl text-slate-700 dark:text-slate-200 ${
                                isSelected
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-100 dark:bg-slate-800"
                              }`}
                            >
                              {opt.id === "story" && <Smartphone size={18} />}
                              {opt.id === "post_square" && <Square size={18} />}
                              {opt.id === "post_portrait" && (
                                <RectangleVertical size={18} />
                              )}
                              {opt.id === "card_auto" && <CreditCard size={18} />}
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {opt.label}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {opt.sublabel}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Toggles */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Visual Elements
                      </label>

                      {isStory && (
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20">
                          <div className="flex items-center gap-2">
                            <Eye size={16} className="text-amber-600 dark:text-amber-400" />
                            <div>
                              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                                IG Story UI Mockup
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Preview guide only (not in download)
                              </span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={showIgGuide}
                            onChange={(e) => setShowIgGuide(e.target.checked)}
                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2">
                          <QrCode size={16} className="text-slate-500" />
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            Show QR Code
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={showQrCode}
                          onChange={(e) => setShowQrCode(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-slate-500" />
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            Show Kavyalok Watermark
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={showWatermark}
                          onChange={(e) => setShowWatermark(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CANVAS BACKGROUND */}
                {activeTab === "canvas" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Canvas Backdrop Color
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Choose background theme, gradient, or blurred artwork for Story/Post export
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {CANVAS_BG_PRESETS.map((preset) => {
                        const isSelected = canvasBgPreset.id === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => setCanvasBgPreset(preset)}
                            style={{ background: preset.previewCss }}
                            className={`h-14 rounded-2xl p-2 border transition-all flex flex-col justify-end text-left cursor-pointer relative overflow-hidden shadow-sm ${
                              isSelected
                                ? "ring-2 ring-amber-500 ring-offset-2 scale-[1.02] border-white"
                                : "border-black/10 hover:opacity-95"
                            }`}
                          >
                            <span className="text-[10px] font-extrabold text-white drop-shadow-md truncate">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 p-0.5 bg-amber-500 text-white rounded-full">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Hex Color Option */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Custom Canvas Hex Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customCanvasColor}
                          onChange={(e) => {
                            setCustomCanvasColor(e.target.value);
                            setCanvasBgPreset({
                              id: "custom",
                              name: "Custom Hex",
                              type: "custom",
                              value: e.target.value,
                              previewCss: e.target.value,
                            });
                          }}
                          className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={customCanvasColor}
                          onChange={(e) => {
                            setCustomCanvasColor(e.target.value);
                            setCanvasBgPreset({
                              id: "custom",
                              name: "Custom Hex",
                              type: "custom",
                              value: e.target.value,
                              previewCss: e.target.value,
                            });
                          }}
                          placeholder="#0f172a"
                          className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: INNER CARD THEME */}
                {activeTab === "theme" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Inner Card Styling
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Choose color palette and contrast style for the quote card itself
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {CARD_THEME_PRESETS.map((theme) => {
                        const isSelected = selectedTheme.name === theme.name;
                        return (
                          <button
                            key={theme.name}
                            onClick={() => setSelectedTheme(theme)}
                            style={{ backgroundColor: theme.value }}
                            className={`p-3 rounded-2xl border text-xs font-bold text-white transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "border-amber-400 ring-2 ring-slate-900/40 scale-[1.02]"
                                : "border-white/20 opacity-90 hover:opacity-100"
                            }`}
                          >
                            <span className="truncate">{theme.name}</span>
                            {isSelected && <Check size={14} className="text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Panel */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={15} className="text-emerald-500" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShareNative}
                    disabled={isSharing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSharing ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Share2 size={15} />
                    )}
                    <span>Share App</span>
                  </button>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-extrabold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Rendering High-Res PNG...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Download Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
