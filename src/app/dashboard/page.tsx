"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/navigation/page";
import { useDashboard } from "@/hooks/useDashboard";
import SidebarProfile from "@/components/dashboard/SidebarProfile";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PostFeed from "@/components/dashboard/PostFeed";

export default function Dashboard() {
  const {
    user,
    userData,
    posts,
    loading,
    loadingPosts,
    hasMore,
    isFetchingNextPage,
    fetchNextPage,
    likedPosts,
    bookmarkedPosts,
    repostedPosts,
    handleLogout,
    toggleLike,
    toggleBookmark,
    toggleRepost,
  } = useDashboard();

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/40 text-gray-900 font-sans antialiased">
      <div className="flex flex-1 relative min-h-screen">
        <SidebarProfile
          userData={userData}
          loading={loading}
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          onLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 h-screen overflow-y-auto pb-24 relative flex flex-col min-w-0 transition-all duration-300">
          <DashboardHeader
            userData={userData}
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
            onLogout={handleLogout}
            isMobile={isMobile}
          />

          {user && (
            <PostFeed
              posts={posts}
              userData={userData}
              firebaseUser={user}
              likedPosts={likedPosts}
              bookmarkedPosts={bookmarkedPosts}
              repostedPosts={repostedPosts}
              onLike={toggleLike}
              onBookmark={toggleBookmark}
              onRepost={toggleRepost}
              hasMore={hasMore}
              loadingPosts={loadingPosts}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={fetchNextPage}
              isSidebarOpen={isSidebarOpen}
            />
          )}
        </main>
      </div>
      <Navigation />
    </div>
  );
}

