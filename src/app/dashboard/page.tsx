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
    likedPosts,
    bookmarkedPosts,
    handleLogout,
    toggleLike,
    toggleBookmark,
    setPage,
  } = useDashboard();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex flex-1 relative">
        <SidebarProfile
          userData={userData}
          loading={loading}
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          onLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto md:ml-0 pb-20 relative">
          <DashboardHeader
            userData={userData}
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={() => setSidebarOpen(!isSidebarOpen)}
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
              onLike={toggleLike}
              onBookmark={toggleBookmark}
              hasMore={hasMore}
              loadingPosts={loadingPosts}
              onLoadMore={() => setPage((prev) => prev + 1)}
            />
          )}
        </main>
      </div>
      <Navigation />
    </div>
  );
}
