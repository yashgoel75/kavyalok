"use client";

import GradientText from "../GradientText";
import { Search, LogOut, Bell, User as UserIcon, Trophy } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFirebaseToken } from "@/utils";
import { useUser } from "@/context/UserContext";

export default function Header() {
  const router = useRouter();
  const { firebaseUser, userData, logout } = useUser();

  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
            Authorization: `Bearer ${token}`,
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

  useEffect(() => {
    if (firebaseUser?.email) {
      fetchNotifications(firebaseUser.email);
    }
  }, [firebaseUser, fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 768);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: MouseEvent) => {
      const menu = document.querySelector(".menu-dropdown");
      const btns = document.querySelectorAll(".user-icon-btn");

      if (
        menu &&
        !menu.contains(e.target as Node) &&
        ![...btns].some((b) => b.contains(e.target as Node))
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

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

  const displayName = userData?.name || firebaseUser?.displayName || "User";

  return (
    <>
      <div className="top-0 w-full flex justify-between items-center px-5 mt-2 md:mt-0 z-20 bg-white">
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
          className="custom-class text-[35px] md:text-[65px] ml-1"
        >
          <Link href="/dashboard">Kavyalok</Link>
        </GradientText>

        <div className="flex items-center gap-3 md:gap-4">
          {isMobile ? (
            <button
              className="cursor-pointer hover:bg-gray-100 p-1 rounded-md transition active:scale-95"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={22} />
            </button>
          ) : (
            <div className="flex items-center bg-gray-100 border border-gray-300 px-3 rounded-xl h-[40px] w-[500px]">
              {renderSearch()}
            </div>
          )}

          <div className="relative flex items-center gap-1">
            {firebaseUser && (
              <button
                onClick={() => router.push("/account/notifications")}
                className="user-icon-btn relative p-1 rounded-full hover:bg-gray-100 cursor-pointer transition active:scale-95"
              >
                <Bell size={25} strokeWidth={1.75} />

                {hasNotification && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500"></span>
                )}
              </button>
            )}

            {firebaseUser ? (
              <>
                <button
                  className="user-icon-btn p-1 rounded-full hover:bg-gray-100 cursor-pointer transition active:scale-95 flex items-center justify-center overflow-hidden"
                  onClick={() => setIsOpen((p) => !p)}
                >
                  {userData?.profilePicture ? (
                    <img
                      src={userData.profilePicture}
                      alt={displayName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon size={25} strokeWidth={1.75} />
                  )}
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-55 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg z-50 menu-dropdown">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-semibold">{displayName}</p>
                      <p className="text-sm text-gray-500">{firebaseUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/account");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon size={16} /> Account
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/account/events");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    >
                      <Trophy size={16} /> Your Events
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-2 h-[40px]">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="flex items-center rounded-lg bg-gradient-to-br from-[#9a6f0bff] to-[#dbb56aff] text-white px-4 text-sm py-1 cursor-pointer"
                >
                  Login
                </button>

                <button
                  onClick={() => router.push("/auth/register")}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobile && isSearchOpen && (
        <div className="flex items-center bg-gray-100 border md:hidden my-2 border-gray-300 px-3 rounded-md h-[35px] mx-5">
          {renderSearch()}
        </div>
      )}

      <div className="border-1 border-gray-200 mt-2"></div>
    </>
  );
}
