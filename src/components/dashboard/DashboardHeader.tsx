import React, { useCallback, useState } from "react";
import { LogOut, Search, UserIcon, Menu, X, Bell, Trophy, PanelLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GradientText from "@/components/GradientText";
import { User } from "@/hooks/useDashboard";
import { getFirebaseToken } from "@/utils";

interface HeaderProps {
  userData: User | null;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
  onLogout: () => void;
  isMobile: boolean;
}

export default function DashboardHeader({
  userData,
  onSidebarToggle,
  isSidebarOpen,
  onLogout,
  isMobile,
}: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim() === "") return;
    router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  const renderSearch = () => (
    <>
      <Search color="#6b7280" size={18} className="shrink-0" />
      <input
        className="mx-2.5 h-full w-full focus:outline-none bg-transparent text-sm text-gray-800 placeholder-gray-400 font-medium"
        placeholder="Search stories, authors, or topics..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
    </>
  );

  const [hasNotification, setHasNotification] = useState(false);

  const fetchNotifications = useCallback(async (email: string) => {
    const CACHE_KEY = `notifications_${email}`;
    const FIVE_MIN = 5 * 60 * 1000;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.expiresAt > Date.now()) {
          setHasNotification((parsed.data.notifications || []).length > 0);
          return;
        }
      }

      const token = await getFirebaseToken();
      const res = await fetch(
        `/api/notifications?email=${encodeURIComponent(email)}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await res.json();

      setHasNotification((data.notifications || []).length > 0);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          expiresAt: Date.now() + FIVE_MIN,
        })
      );
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="flex items-center justify-between px-4 md:px-7 h-16 max-w-full">
        {/* Left Section: Sidebar Toggle Button & Brand Title */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center"
            onClick={onSidebarToggle}
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {isMobile ? (
              isSidebarOpen ? <X size={22} /> : <Menu size={22} />
            ) : (
              <PanelLeft size={21} className={!isSidebarOpen ? "text-yellow-600" : ""} />
            )}
          </button>

          {/* Show brand title if sidebar is collapsed or on mobile */}
          {(!isSidebarOpen || isMobile) && (
            <span className="custom-class text-[35px] md:text-[45px]">
              <GradientText
                colors={[
                  "#9a6f0bff",
                  "#bd9864ff",
                  "#dbb56aff",
                  "#7f7464ff",
                  "#e9e99dff",
                ]}
                animationSpeed={5}
                showBorder={false}
              >
                <Link href="/dashboard">Kavyalok</Link>
              </GradientText>
            </span>
          )}
        </div>

        {/* Right Section: Search & Actions */}
        <div className="flex items-center gap-3 md:gap-4 ml-auto">
          {isMobile ? (
            <>
              <button
                className="cursor-pointer hover:bg-gray-100 p-2 rounded-xl text-gray-700 transition active:scale-95"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                title="Search"
              >
                <Search size={20} />
              </button>
              {isMobileSearchOpen && (
                <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 p-3 shadow-md animate-fadeIn">
                  <div className="flex items-center bg-gray-100/80 border border-gray-300/80 px-3 rounded-2xl h-[42px]">
                    {renderSearch()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center bg-gray-100/80 border border-gray-300/80 px-3.5 rounded-2xl h-[42px] w-[360px] lg:w-[480px] focus-within:ring-2 focus-within:ring-yellow-500/20 focus-within:border-yellow-600/40 transition-all">
              {renderSearch()}
            </div>
          )}

          <div className="relative flex items-center gap-2">
            {userData ? (
              <>
                <button
                  onClick={() => router.push("/account/notifications")}
                  className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-700 cursor-pointer transition active:scale-95"
                  title="Notifications"
                >
                  <Bell size={21} strokeWidth={1.8} />

                  {hasNotification && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-yellow-500 ring-2 ring-white"></span>
                  )}
                </button>

                <div className="relative">
                  <button
                    className="p-1 rounded-full hover:ring-2 hover:ring-yellow-500/30 cursor-pointer transition active:scale-95 overflow-hidden flex items-center justify-center"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    title="User profile"
                  >
                    {userData.profilePicture ? (
                      <img
                        src={userData.profilePicture}
                        alt={userData.name}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                        {userData.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 animate-fadeIn">
                        <div className="px-3.5 py-2.5 border-b border-gray-100">
                          <p className="font-extrabold text-sm text-gray-900 truncate">{userData.name}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {userData.email}
                          </p>
                        </div>

                        <div className="py-1">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              router.push("/account");
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
                          >
                            <UserIcon size={16} /> Account
                          </button>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              router.push("/account/events");
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
                          >
                            <Trophy size={16} /> Your Events
                          </button>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-colors cursor-pointer mt-0.5"
                          >
                            <LogOut size={16} /> Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

