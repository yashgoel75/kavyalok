"use client";

import { useEffect, useRef } from "react";
import { trackPostView } from "@/lib/analytics";

interface PostImpressionTrackerProps {
  postId: string;
  title?: string;
  authorName?: string;
  userEmail?: string;
}

// Global session set to prevent duplicate impression counts in the same page session
const recordedImpressions = new Set<string>();

export default function PostImpressionTracker({
  postId,
  title,
  authorName,
  userEmail,
}: PostImpressionTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const entryTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!postId || recordedImpressions.has(postId)) return;

    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          entryTimeRef.current = Date.now();

          // Wait 1.5 seconds in viewport to count as a genuine read impression
          timer = setTimeout(() => {
            if (!recordedImpressions.has(postId)) {
              recordedImpressions.add(postId);

              // 1. Fire GA4 Event
              trackPostView({
                postId,
                title,
                author: authorName,
              });

              // 2. Automated server telemetry beacon
              try {
                fetch("/api/analytics/track", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    postId,
                    action: "view",
                    durationViewed: 2,
                    email: userEmail,
                  }),
                }).catch(() => {});
              } catch (_) {}
            }
          }, 1500);
        } else {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [postId, title, authorName, userEmail]);

  return <div ref={containerRef} className="w-full h-0 pointer-events-none" aria-hidden="true" />;
}

