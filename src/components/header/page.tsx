"use client";

import GradientText from "../GradientText";
import { Search, LogOut, Bell, User as UserIcon, Trophy } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFirebaseToken } from "@/utils";

export default function Header() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
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
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u?.email) {
        fetchUserName(u.email);
        fetchNotifications(u.email);
      }
    });

    return () => unsubscribe();
  }, [fetchNotifications]);

  const fetchUserName = async (email: string) => {
    try {
      const cachedData = localStorage.getItem("userData");
      const cachedAt = localStorage.getItem("userDataCachedAt");
      const oneHour = 60 * 60 * 1000;

      const isCacheValid =
        cachedData && cachedAt && Date.now() - Number(cachedAt) < oneHour;

      if (isCacheValid) {
        const parsed = JSON.parse(cachedData);
        if (parsed?.name) {
          setDisplayName(parsed.name);
          return;
        }
      }

      const token = await getFirebaseToken();
      const response = await fetch(
        `/api/user?email=${encodeURIComponent(email)}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch user");

      if (data?.name) {
        setDisplayName(data.name);
        localStorage.setItem("userData", JSON.stringify({ name: data.name }));
        localStorage.setItem("userDataCachedAt", Date.now().toString());
      }
    } catch (err) {
      console.error("Header: Username fetch error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      setUser(null);
      localStorage.removeItem("userData");
      localStorage.removeItem("userDataCachedAt");
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
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
            {user && (
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

            {user ? (
              <>
                <button
                  className="user-icon-btn p-1 rounded-full hover:bg-gray-100 cursor-pointer transition active:scale-95"
                  onClick={() => setIsOpen((p) => !p)}
                >
                  <UserIcon size={25} strokeWidth={1.75} />
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-55 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg z-50 menu-dropdown">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-semibold">{displayName || "User"}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {router.push("/account")}}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon size={16} /> Account
                    </button>
                    <button
                      onClick={() => {router.push("/account/events")}}
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
