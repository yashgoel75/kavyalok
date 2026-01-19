"use client";

import { Home, Bookmark, User, Compass, Settings, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { PlusSquare } from "lucide-react";

export default function Navigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const footer = document.getElementById("app-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      (entries) => setIsFooterVisible(entries[0].isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setFirebaseUser(user));
    return () => unsub();
  }, []);

  const navItems = [
    { icon: Home, url: "/dashboard", title: "Home" },
    { icon: Bookmark, url: "/bookmark", title: "Bookmarks" },
    { icon: PlusSquare, url: "/account/createPost", title: "New Post" },
    { icon: Compass, url: "/explore", title: "Explore" },
    { icon: GraduationCap, url: "/competitions", title: "Competitions" },
    // {
    //   icon: GraduationCap,

    //   url: "/competitions",
    //   title: "Competitions",
    // },
    // { icon: Settings, url: "/settings", title: "Settings" },

  ];

  const isActive = (url: string) => pathname.startsWith(url);

  return (
    <div
      className={`fixed bottom-6 left-0 w-full flex justify-center transition-all duration-300 z-50 ${
        isFooterVisible
          ? "opacity-0 pointer-events-none translate-y-5"
          : "opacity-100 translate-y-0"
      }`}
    >
      <div className="flex py-3 gap-7 bg-white border border-gray-300 shadow-lg rounded-full px-7">
        {navItems.map((item, i) => (
          <Link key={i} href={item.url} title={item.title} className="relative">
            <item.icon
              size={isMobile ? 30 : 35}
              className={`hover:scale-125 cursor-pointer transition border-b-2 pb-1 ${
                isActive(item.url) ? "border-yellow-700" : "border-white"
              }`}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
