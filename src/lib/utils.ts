import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTextColor(bgColor: string): string {
  if (!bgColor || bgColor === "null") return "#000000";
  const hex = bgColor.replace("#", "");
  if (hex.length < 6) return "#000000";
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 150 ? "#000000" : "#ffffff";
}

/**
 * Uniform icon color helper ensuring high contrast and identical shades
 * for both light (#000000 text) and dark/vivid (#ffffff text) post cards.
 */
export function getIconColor(bgColor: string, isLiked: boolean = false): string {
  const isWhiteText = getTextColor(bgColor) === "#ffffff";

  if (isLiked) {
    // On white/light cards, use vibrant rose red.
    // On colorful/dark cards (like orange, red, black), use solid white so it is 100% visible!
    return isWhiteText ? "#ffffff" : "#e11d48";
  }

  return isWhiteText ? "rgba(255, 255, 255, 0.85)" : "rgba(30, 41, 59, 0.85)";
}

export function getCommentColor(bgColor: string): string {
  return getIconColor(bgColor, false);
}

export function getRepostColor(bgColor: string, isReposted: boolean): string {
  const isWhiteText = getTextColor(bgColor) === "#ffffff";
  if (isReposted) {
    return isWhiteText ? "#ffffff" : "#10b981";
  }
  return getIconColor(bgColor, false);
}

export function getBookmarkColor(bgColor: string, isBookmarked: boolean): string {
  const isWhiteText = getTextColor(bgColor) === "#ffffff";
  if (isBookmarked) {
    return isWhiteText ? "#fef08a" : "#f59e0b";
  }
  return getIconColor(bgColor, false);
}