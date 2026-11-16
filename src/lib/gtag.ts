// Google Analytics 4 (GA4) Configuration & Core Methods

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
  "G-2YPJVTE47C";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Log page view in Google Analytics
 */
export const pageview = (url: string, title?: string) => {
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) {
    return;
  }

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title || (typeof document !== "undefined" ? document.title : undefined),
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
  });
};

/**
 * Log specific event in Google Analytics
 */
export const event = (
  action: string,
  params?: Record<string, any>
) => {
  if (typeof window === "undefined" || !window.gtag) {
    // If running in development, optionally log to console
    if (process.env.NODE_ENV === "development") {
      console.log(`[GA4 Event (mock)] ${action}:`, params);
    }
    return;
  }

  window.gtag("event", action, params);
};

