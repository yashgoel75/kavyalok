import { toPng } from "html-to-image";

export type ExportOrientation = "story" | "post_square" | "post_portrait" | "card_auto";

export interface OrientationOption {
  id: ExportOrientation;
  label: string;
  sublabel: string;
  aspectRatioClass: string;
  aspectRatioValue: string; // e.g. "9/16", "1/1", "4/5", "auto"
  icon: string;
}

export const ORIENTATION_OPTIONS: OrientationOption[] = [
  {
    id: "story",
    label: "IG Story",
    sublabel: "9:16 Portrait",
    aspectRatioClass: "aspect-[9/16]",
    aspectRatioValue: "9/16",
    icon: "Smartphone",
  },
  {
    id: "post_square",
    label: "IG Post",
    sublabel: "1:1 Square",
    aspectRatioClass: "aspect-square",
    aspectRatioValue: "1/1",
    icon: "Square",
  },
  {
    id: "post_portrait",
    label: "IG Portrait",
    sublabel: "4:5 Feed",
    aspectRatioClass: "aspect-[4/5]",
    aspectRatioValue: "4/5",
    icon: "RectangleVertical",
  },
  {
    id: "card_auto",
    label: "Compact Card",
    sublabel: "Auto Fit",
    aspectRatioClass: "aspect-auto",
    aspectRatioValue: "auto",
    icon: "CreditCard",
  },
];

export interface CanvasBgPreset {
  id: string;
  name: string;
  type: "gradient" | "solid" | "blur" | "custom";
  value: string; // CSS background value or color string
  previewCss: string;
}

export const CANVAS_BG_PRESETS: CanvasBgPreset[] = [
  {
    id: "sunset_glow",
    name: "Sunset Glow",
    type: "gradient",
    value: "linear-gradient(135deg, #ff7e5f 0%, #feb47b 50%, #ff6b6b 100%)",
    previewCss: "linear-gradient(135deg, #ff7e5f, #ff6b6b)",
  },
  {
    id: "midnight_neon",
    name: "Midnight Neon",
    type: "gradient",
    value: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)",
    previewCss: "linear-gradient(135deg, #0f172a, #311042)",
  },
  {
    id: "cosmic_violet",
    name: "Cosmic Violet",
    type: "gradient",
    value: "linear-gradient(135deg, #2e1065 0%, #7e22ce 50%, #ec4899 100%)",
    previewCss: "linear-gradient(135deg, #2e1065, #ec4899)",
  },
  {
    id: "emerald_breeze",
    name: "Emerald Breeze",
    type: "gradient",
    value: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
    previewCss: "linear-gradient(135deg, #064e3b, #10b981)",
  },
  {
    id: "aurora_borealis",
    name: "Aurora",
    type: "gradient",
    value: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    previewCss: "linear-gradient(135deg, #0f2027, #2c5364)",
  },
  {
    id: "royal_amber",
    name: "Royal Amber",
    type: "gradient",
    value: "linear-gradient(135deg, #1e1a12 0%, #854d0e 50%, #eab308 100%)",
    previewCss: "linear-gradient(135deg, #1e1a12, #eab308)",
  },
  {
    id: "rose_gold",
    name: "Rose Gold",
    type: "gradient",
    value: "linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #fb7185 100%)",
    previewCss: "linear-gradient(135deg, #4c0519, #fb7185)",
  },
  {
    id: "cyber_dark",
    name: "Cyber Dark",
    type: "gradient",
    value: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)",
    previewCss: "linear-gradient(135deg, #09090b, #27272a)",
  },
  {
    id: "clean_light",
    name: "Clean Light",
    type: "gradient",
    value: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
    previewCss: "linear-gradient(135deg, #f8fafc, #cbd5e1)",
  },
  {
    id: "solid_obsidian",
    name: "Obsidian Black",
    type: "solid",
    value: "#09090b",
    previewCss: "#09090b",
  },
  {
    id: "solid_indigo",
    name: "Deep Indigo",
    type: "solid",
    value: "#1e1b4b",
    previewCss: "#1e1b4b",
  },
  {
    id: "solid_emerald",
    name: "Forest Emerald",
    type: "solid",
    value: "#064e3b",
    previewCss: "#064e3b",
  },
  {
    id: "solid_crimson",
    name: "Crimson Flame",
    type: "solid",
    value: "#450a0a",
    previewCss: "#450a0a",
  },
  {
    id: "solid_white",
    name: "Pure White",
    type: "solid",
    value: "#ffffff",
    previewCss: "#ffffff",
  },
  {
    id: "blur_art",
    name: "Blurred Art",
    type: "blur",
    value: "blur",
    previewCss: "radial-gradient(circle, rgba(255,255,255,0.4), rgba(0,0,0,0.8))",
  },
];

export interface CardThemePreset {
  name: string;
  value: string;
  accent: string;
  isGlass?: boolean;
}

export const CARD_THEME_PRESETS: CardThemePreset[] = [
  { name: "Midnight Dark", value: "#09090b", accent: "#a1a1aa" },
  { name: "Kavyalok Gold", value: "#1e1a12", accent: "#eab308" },
  { name: "Deep Violet", value: "#2e1065", accent: "#a855f7" },
  { name: "Emerald Ink", value: "#064e3b", accent: "#10b981" },
  { name: "Crimson Red", value: "#450a0a", accent: "#f43f5e" },
  { name: "Slate Minimal", value: "#1e293b", accent: "#38bdf8" },
  { name: "Pure White", value: "#ffffff", accent: "#0f172a" },
  { name: "Frosted Glass", value: "rgba(15, 23, 42, 0.75)", accent: "#38bdf8", isGlass: true },
];

/**
 * Converts image URL to base64 Data URL so cross-origin image references
 * render completely without CORS glitches in html-to-image.
 */
export async function imageUrlToDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;

  try {
    const res = await fetch(url, {
      mode: "cors",
      cache: "no-cache",
    });
    if (!res.ok) throw new Error(`Failed to fetch image status: ${res.status}`);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Could not convert image to Data URL via fetch CORS:", err);
    return url;
  }
}

/**
 * High-definition image downloader engine
 */
export async function downloadElementAsHdPng(
  element: HTMLElement,
  filename: string,
  pixelRatio: number = 3
): Promise<void> {
  // Wait for images inside container to finish loading
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  // Generate high resolution PNG using html-to-image
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: pixelRatio,
    quality: 0.98,
    filter: (node) => {
      // Exclude non-printable elements if marked with class
      if (node instanceof HTMLElement && node.classList.contains("no-export")) {
        return false;
      }
      return true;
    },
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Web Share API Helper (for sharing directly to Instagram / mobile share sheets)
 */
export async function shareElementAsHdImage(
  element: HTMLElement,
  title: string,
  text: string
): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.share) return false;

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 3,
      quality: 0.98,
    });

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `${title.substring(0, 20).toLowerCase().replace(/\s+/g, "-")}-card.png`, {
      type: "image/png",
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    }
  } catch (err) {
    console.warn("Native file sharing not supported or cancelled:", err);
  }
  return false;
}
