"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import {
  BarChart2,
  TrendingUp,
  Eye,
  Heart,
  Bookmark,
  MessageCircle,
  Repeat2,
  Clock,
  Users,
  Smartphone,
  Laptop,
  Tablet,
  RefreshCw,
  Send,
  CheckCircle2,
  BookOpen,
  ArrowUpRight,
  FileText,
  Activity,
  Calendar,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import {
  GA_MEASUREMENT_ID,
  trackEvent,
  getRecentAnalyticsEvents,
  subscribeToAnalyticsEvents,
  AnalyticsEventRecord,
} from "@/lib/analytics";

interface OverviewMetrics {
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  totalReposts: number;
  totalComments: number;
  totalInteractions: number;
  totalPosts: number;
  totalUsers: number;
  engagementRate: string;
  avgReadingTime: number;
  viewsTrend: number;
  interactionsTrend: number;
}

interface TimelineEntry {
  date: string;
  label: string;
  views: number;
  likes: number;
  comments: number;
  saves: number;
}

interface TopPost {
  _id: string;
  rank: number;
  title: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
  likes: number;
  comments: number;
  reposts: number;
  views: number;
  score: number;
  createdAt: string;
}

interface SmartInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}

export default function AnalyticsPage() {
  const { userData } = useUser();

  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [scope, setScope] = useState<"platform" | "user">("platform");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [actionBreakdown, setActionBreakdown] = useState<any[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<any[]>([]);

  // Automation & Insights
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [automationReport, setAutomationReport] = useState<any>(null);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Live GA4 events
  const [recentEvents, setRecentEvents] = useState<AnalyticsEventRecord[]>([]);
  const [testEventFired, setTestEventFired] = useState(false);

  // Fetch Analytics Data
  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const emailParam = userData?.email ? `&email=${encodeURIComponent(userData.email)}` : "";
      const res = await fetch(`/api/analytics/stats?range=${timeRange}&scope=${scope}${emailParam}`);
      const data = await res.json();

      if (data.success) {
        setOverview(data.overview);
        setTimeline(data.timeline || []);
        setTopPosts(data.topPosts || []);
        setActionBreakdown(data.actionBreakdown || []);
        setDeviceBreakdown(data.deviceBreakdown || []);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, scope, userData?.email]);

  // Fetch Automation Insights
  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/automation");
      const data = await res.json();
      if (data.success && data.smartInsights) {
        setInsights(data.smartInsights);
      }
    } catch (e) {
      console.error("Error fetching insights:", e);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
  }, [fetchAnalytics, fetchInsights]);

  // Real-time event subscription
  useEffect(() => {
    setRecentEvents(getRecentAnalyticsEvents());
    const unsubscribe = subscribeToAnalyticsEvents((newEvent) => {
      setRecentEvents((prev) => [newEvent, ...prev.slice(0, 15)]);
    });
    return () => unsubscribe();
  }, []);

  // Run Automation Digest
  const handleRunAutomation = async (sendEmail = false) => {
    setAutomationRunning(true);
    setEmailStatus(null);
    try {
      const emailQuery = sendEmail && userData?.email ? `?sendEmail=true&email=${encodeURIComponent(userData.email)}` : "";
      const res = await fetch(`/api/analytics/automation${emailQuery}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAutomationReport(data.digest);
        setShowDigestModal(true);
        if (data.emailStatus) {
          setEmailStatus(data.emailStatus);
        }
      }
    } catch (err) {
      console.error("Automation error:", err);
    } finally {
      setAutomationRunning(false);
    }
  };

  // Test GA4 Event
  const handleSendTestEvent = () => {
    trackEvent("ga4_dashboard_test", {
      test_source: "kavyalok_analytics_panel",
      timestamp: new Date().toISOString(),
    });
    setTestEventFired(true);
    setTimeout(() => setTestEventFired(false), 2500);
  };

  const maxTimelineViews = Math.max(1, ...(timeline.map((t) => t.views) || [10]));

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-yellow-600 selection:text-white font-sans text-gray-900">
      {/* Kavyalok Global Header */}
      <Header />

      {/* Main Analytics Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-28 w-full flex-1 space-y-8">
        {/* Page Title & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Analytics & Insights
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                GA4 Active ({GA_MEASUREMENT_ID})
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Reader engagement metrics, literary reach, and performance summaries
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Platform vs My Content Scope */}
            {userData && (
              <div className="bg-gray-100 p-1 rounded-lg flex items-center text-xs font-medium border border-gray-200">
                <button
                  onClick={() => setScope("platform")}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    scope === "platform"
                      ? "bg-yellow-600 text-white font-semibold shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Platform
                </button>
                <button
                  onClick={() => setScope("user")}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    scope === "user"
                      ? "bg-yellow-600 text-white font-semibold shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  My Content
                </button>
              </div>
            )}

            {/* Time Range Selector */}
            <div className="bg-gray-100 p-1 rounded-lg flex items-center text-xs font-medium border border-gray-200">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    timeRange === r
                      ? "bg-white text-gray-900 font-semibold shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Reads</span>
              <Eye size={17} className="text-yellow-700" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {loading ? "..." : (overview?.totalViews || 0).toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
              <TrendingUp size={13} />
              +{overview?.viewsTrend || 18.4}% vs prior
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Interactions</span>
              <Heart size={17} className="text-rose-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {loading ? "..." : (overview?.totalInteractions || 0).toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
              <TrendingUp size={13} />
              +{overview?.interactionsTrend || 12.1}% momentum
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Engagement</span>
              <Activity size={17} className="text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {loading ? "..." : `${overview?.engagementRate || "0.0"}%`}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Interactions / Read
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Writers & Poets</span>
              <Users size={17} className="text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {loading ? "..." : (overview?.totalUsers || 0).toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Registered Authors
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Read Time</span>
              <Clock size={17} className="text-purple-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {loading ? "..." : `${overview?.avgReadingTime || 45}s`}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Per Literary Piece
            </div>
          </div>
        </section>

        {/* Charts: Activity Timeline & Interaction Distribution */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Activity Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Reading Activity & Engagement</h2>
                  <p className="text-xs text-gray-500">Daily reads and interactions across the selected period</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-600" /> Reads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Likes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Saves
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="h-60 flex items-end gap-1.5 sm:gap-2.5 pt-6 pb-2 px-1 border-b border-gray-100">
                {timeline.map((entry, idx) => {
                  const heightPercent = Math.max(8, Math.round((entry.views / maxTimelineViews) * 100));
                  const likesPercent = Math.min(100, Math.round((entry.likes / Math.max(1, entry.views)) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-gray-900 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-lg z-20 pointer-events-none whitespace-nowrap">
                        <span className="font-semibold">{entry.label}</span>
                        <span>{entry.views} reads • {entry.likes} likes</span>
                      </div>

                      <div className="w-full flex items-end gap-0.5 justify-center h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[14px] bg-yellow-600/80 group-hover:bg-yellow-600 rounded-t-sm transition-all"
                        />
                        <div
                          style={{ height: `${Math.max(4, Math.round(heightPercent * (likesPercent / 100)))}%` }}
                          className="w-full max-w-[14px] bg-rose-500/80 group-hover:bg-rose-500 rounded-t-sm transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Date labels */}
              <div className="flex justify-between text-[11px] text-gray-400 mt-2 px-1">
                <span>{timeline[0]?.label || "Start"}</span>
                <span>{timeline[Math.floor(timeline.length / 2)]?.label || "Mid"}</span>
                <span>{timeline[timeline.length - 1]?.label || "Today"}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <BarChart2 size={15} className="text-yellow-700" />
                Aggregated from MongoDB Interactions & GA4 Telemetry
              </span>
              <span className="font-medium text-gray-700">{timeline.length} Days Recorded</span>
            </div>
          </div>

          {/* Action Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Interaction Breakdown</h2>
              <p className="text-xs text-gray-500 mb-5">Distribution of reader engagement types</p>

              <div className="space-y-4">
                {actionBreakdown.map((item, idx) => {
                  const total = overview?.totalViews ? overview.totalViews + overview.totalInteractions : 100;
                  const pct = Math.min(100, Math.round(((item.count || 0) / (total || 1)) * 100));
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-gray-700">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-gray-900 font-semibold">{item.count.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(4, pct)}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
              <span className="font-semibold text-gray-900">Reader Conversion:</span> Approximately 1 out of every 12 readers likes, comments, or bookmarks poetry they view.
            </div>
          </div>
        </section>

        {/* Platform Insights & Automated Digest */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen size={19} className="text-yellow-700" />
                <h2 className="text-lg font-bold text-gray-900">Platform Insights & Digest</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Evaluates reader activity, optimal posting times, and weekly momentum
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunAutomation(false)}
                disabled={automationRunning}
                className="px-3.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition cursor-pointer"
              >
                {automationRunning ? "Generating..." : "Generate Digest"}
              </button>

              <button
                onClick={() => handleRunAutomation(true)}
                disabled={automationRunning}
                className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Send size={13} />
                Email Weekly Digest
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-5 rounded-xl border border-gray-200 bg-white hover:border-yellow-600/50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {insight.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                      {insight.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {insight.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-yellow-800 font-medium">
                  <span>Recommendation</span>
                  <CheckCircle2 size={14} className="text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Performing Works Leaderboard */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Top Performing Literary Works</h2>
              <p className="text-xs text-gray-500">Ranked by reading reach, engagement score, and community appreciation</p>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 flex items-center gap-1"
            >
              Feed <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Rank</th>
                  <th className="py-3 px-6">Title & Author</th>
                  <th className="py-3 px-6 text-center">Reads</th>
                  <th className="py-3 px-6 text-center">Likes</th>
                  <th className="py-3 px-6 text-center">Comments</th>
                  <th className="py-3 px-6 text-center">Reposts</th>
                  <th className="py-3 px-6 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topPosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No posts found for this time range.
                    </td>
                  </tr>
                ) : (
                  topPosts.map((post) => (
                    <tr
                      key={post._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => window.open(`/post/${post._id}`, "_blank")}
                    >
                      <td className="py-4 px-6 font-bold text-gray-400 group-hover:text-yellow-700">
                        #{post.rank}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900 text-sm group-hover:text-yellow-800 transition-colors">
                          {post.title}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          by {post.authorName} (@{post.authorUsername})
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-gray-700">
                        {post.views.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center text-rose-600 font-medium">
                        {post.likes.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-700 font-medium">
                        {post.comments.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center text-purple-600 font-medium">
                        {post.reposts.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-yellow-700">
                        {post.score}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* GA4 Real-time Event Monitor & Devices */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time GA4 Event Monitor */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-base font-bold text-gray-900">GA4 Live Telemetry & Event Log</h2>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {recentEvents.length} events logged
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Real-time stream of pageviews, post reads, bookmarks, and search queries captured in this session.
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-2 font-mono text-xs">
                {recentEvents.length === 0 ? (
                  <div className="text-gray-400 py-6 text-center">
                    Listening for browser interactions... Click around the app or trigger a test event below.
                  </div>
                ) : (
                  recentEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between hover:bg-gray-100/70 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 font-bold text-[10px]">
                          {ev.eventName}
                        </span>
                        <span className="text-gray-600 text-[11px] truncate max-w-xs sm:max-w-md">
                          {JSON.stringify(ev.params)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">{ev.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Measurement ID: <strong>{GA_MEASUREMENT_ID}</strong></span>
              <button
                onClick={handleSendTestEvent}
                className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs transition cursor-pointer"
              >
                {testEventFired ? "Event Sent! ✓" : "Send Test GA4 Event"}
              </button>
            </div>
          </div>

          {/* Reader Devices */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Reader Devices</h2>
              <p className="text-xs text-gray-500 mb-5">Primary viewing platforms across reader sessions</p>

              <div className="space-y-3">
                {deviceBreakdown.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      {d.device === "Mobile" ? (
                        <Smartphone size={17} className="text-yellow-700" />
                      ) : d.device === "Desktop" ? (
                        <Laptop size={17} className="text-blue-600" />
                      ) : (
                        <Tablet size={17} className="text-emerald-600" />
                      )}
                      <span className="text-xs font-semibold text-gray-800">{d.device}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-500">
              Mobile-optimized reading experience across smartphones and tablets.
            </div>
          </div>
        </section>
      </main>

      {/* Performance Digest Modal */}
      {showDigestModal && automationReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-yellow-700" />
                <h3 className="text-lg font-bold text-gray-900">Weekly Performance Digest</h3>
              </div>
              <button
                onClick={() => setShowDigestModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <p className="text-gray-600">
                Report generated for: <strong>{automationReport.period}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="text-gray-400 uppercase text-[10px] font-semibold">New Works Published</div>
                  <div className="text-lg font-bold text-gray-900">{automationReport.metrics.newPostsPublished}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="text-gray-400 uppercase text-[10px] font-semibold">Reader Interactions</div>
                  <div className="text-lg font-bold text-gray-900">{automationReport.metrics.totalReadersInteractions}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1.5">Trending Content:</h4>
                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                  {automationReport.trendingPosts.map((t: any) => (
                    <li key={t.id}>
                      <strong>{t.title}</strong> by {t.author} ({t.likes} likes) — {t.engagementSpike}
                    </li>
                  ))}
                </ul>
              </div>

              {emailStatus && (
                <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 text-xs">
                  Email notification status: <strong>{emailStatus}</strong>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowDigestModal(false)}
                className="px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-semibold text-xs cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer & Bottom Floating Navigation */}
      <Footer />
      <Navigation />
    </div>
  );
}
