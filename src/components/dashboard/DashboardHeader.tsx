import React, { useCallback, useState } from "react";
import { LogOut, Search, UserIcon, Menu, X, Bell, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
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
      <Search color="gray" size={20} />
      <input
        className="mx-3 h-full w-full focus:outline-none bg-transparent"
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
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <button
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          onClick={onSidebarToggle}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="flex items-center gap-3 md:gap-4 ml-auto">
          {isMobile ? (
            <>
              <button
                className="cursor-pointer hover:bg-gray-100 p-2 rounded-md transition"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              >
                <Search size={22} />
              </button>
              {isMobileSearchOpen && (
                <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 p-4 shadow-md">
                  <div className="flex items-center bg-gray-100 border border-gray-300 px-3 rounded-xl h-[40px]">
                    {renderSearch()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center bg-gray-100 border border-gray-300 px-3 rounded-xl h-[40px] w-[500px]">
              {renderSearch()}
            </div>
          )}

          <div className="relative">
            {userData ? (
              <>
                <button
                  onClick={() => router.push("/account/notifications")}
                  className="user mr-2 icon-btn relative p-1 rounded-full hover:bg-gray-100 cursor-pointer transition active:scale-95"
                >
                  <Bell size={25} strokeWidth={1.75} />

                  {hasNotification && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500"></span>
                  )}
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <UserIcon size={25} strokeWidth={1.75} />
                </button>
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="font-semibold">{userData.name}</p>

                        <p className="text-sm text-gray-500">
                          {userData.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          router.push("/account");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon size={16} /> Account
                      </button>
                      <button
                        onClick={() => {
                          router.push("/account/events");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                      >
                        <Trophy size={16} /> Your Events
                      </button>
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="bg-yellow-600 text-white px-4 py-1 rounded"
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
