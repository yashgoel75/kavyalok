import { event, pageview, GA_MEASUREMENT_ID } from "./gtag";

export { GA_MEASUREMENT_ID, pageview, event };

export interface AnalyticsEventRecord {
  id: string;
  eventName: string;
  timestamp: string;
  params: Record<string, any>;
}

// In-memory ring buffer for recent client-side events (for real-time dashboard view)
const MAX_RECENT_EVENTS = 25;
const recentEvents: AnalyticsEventRecord[] = [];
const eventListeners: ((event: AnalyticsEventRecord) => void)[] = [];

export function subscribeToAnalyticsEvents(listener: (event: AnalyticsEventRecord) => void) {
  eventListeners.push(listener);
  return () => {
    const idx = eventListeners.indexOf(listener);
    if (idx !== -1) eventListeners.splice(idx, 1);
  };
}

export function getRecentAnalyticsEvents(): AnalyticsEventRecord[] {
  return [...recentEvents];
}

function recordEventLocally(eventName: string, params: Record<string, any> = {}) {
  const record: AnalyticsEventRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    eventName,
    timestamp: new Date().toLocaleTimeString(),
    params,
  };

  recentEvents.unshift(record);
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.pop();
  }

  // Notify listeners
  eventListeners.forEach((fn) => {
    try {
      fn(record);
    } catch (e) {
      console.error("Analytics listener error:", e);
    }
  });
}

/**
 * Enhanced event dispatcher that sends to GA4 and notifies local subscribers
 */
export function trackEvent(name: string, params: Record<string, any> = {}) {
  recordEventLocally(name, params);
  event(name, params);
}

// ==========================================
// Specialized Domain Tracking Functions
// ==========================================

export function trackPageView(url: string, title?: string) {
  recordEventLocally("page_view", { page_path: url, page_title: title });
  pageview(url, title);
}

export function trackUserAuth(params: {
  method: "email" | "google" | "phone" | string;
  type: "login" | "register" | "logout" | "password_reset";
  email?: string;
}) {
  const eventName =
    params.type === "login"
      ? "login"
      : params.type === "register"
      ? "sign_up"
      : params.type === "logout"
      ? "logout"
      : "password_reset_request";

  trackEvent(eventName, {
    method: params.method,
    auth_type: params.type,
  });
}

export function trackPostView(params: {
  postId: string;
  title?: string;
  author?: string;
  category?: string;
  readingDuration?: number;
}) {
  trackEvent("post_view", {
    post_id: params.postId,
    post_title: params.title,
    post_author: params.author,
    post_category: params.category,
    reading_duration_sec: params.readingDuration,
  });
}

export function trackPostLike(params: {
  postId: string;
  liked: boolean;
  author?: string;
}) {
  trackEvent(params.liked ? "post_like" : "post_unlike", {
    post_id: params.postId,
    post_author: params.author,
  });
}

export function trackPostBookmark(params: {
  postId: string;
  bookmarked: boolean;
}) {
  trackEvent(params.bookmarked ? "post_bookmark" : "post_unbookmark", {
    post_id: params.postId,
  });
}

export function trackPostRepost(params: {
  postId: string;
  author?: string;
}) {
  trackEvent("post_repost", {
    post_id: params.postId,
    post_author: params.author,
  });
}

export function trackPostComment(params: {
  postId: string;
  commentLength?: number;
}) {
  trackEvent("post_comment", {
    post_id: params.postId,
    comment_length: params.commentLength,
  });
}

export function trackPostShare(params: {
  postId: string;
  platform: "native" | "whatsapp" | "twitter" | "facebook" | "linkedin" | "copy_link";
  title?: string;
}) {
  trackEvent("share", {
    content_type: "post",
    item_id: params.postId,
    method: params.platform,
    post_title: params.title,
  });
}

export function trackPostCreate(params: {
  postId?: string;
  title: string;
  tagsCount?: number;
  hasCoverImage: boolean;
  wordCount?: number;
}) {
  trackEvent("post_create", {
    post_id: params.postId,
    title_length: params.title.length,
    tags_count: params.tagsCount || 0,
    has_cover: params.hasCoverImage,
    word_count: params.wordCount || 0,
  });
}

export function trackSearch(params: {
  query: string;
  resultsCount: number;
}) {
  trackEvent("search", {
    search_term: params.query,
    results_count: params.resultsCount,
  });
}

export function trackCompetitionView(params: {
  competitionId: string;
  name: string;
  fee?: number;
}) {
  trackEvent("competition_view", {
    competition_id: params.competitionId,
    competition_name: params.name,
    fee: params.fee,
  });
}

export function trackCompetitionRegister(params: {
  competitionId: string;
  name: string;
  amount: number;
}) {
  trackEvent("competition_register", {
    competition_id: params.competitionId,
    competition_name: params.name,
    value: params.amount,
    currency: "INR",
  });
}

