"use client";

import { Home, Search, Compass, GraduationCap, PlusSquare } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import CreatePostModal from "../post/CreatePostModal";
import SearchModal from "../search/SearchModal";

export default function Navigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { firebaseUser, requireAuth } = useUser();
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

  const navItems = [
    { icon: Home, url: "/dashboard", title: "Home" },
    { icon: Search, url: "#search", title: "Search", isSearchModal: true },
    { icon: PlusSquare, url: "#create-post", title: "New Post", isModal: true },
    { icon: Compass, url: "/explore", title: "Explore" },
    { icon: GraduationCap, url: "/competitions", title: "Competitions" },
  ];

  return (
    <>
      <div
        className={`fixed bottom-6 left-0 w-full flex justify-center transition-all duration-300 z-50 ${
          isFooterVisible
            ? "opacity-0 pointer-events-none translate-y-5"
            : "opacity-100 translate-y-0"
        }`}
      >
        <div className="flex py-3 gap-7 bg-white border border-gray-300 shadow-lg rounded-full px-7 items-center">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            if (item.isSearchModal) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  title={item.title}
                  className="relative cursor-pointer focus:outline-none text-slate-700 hover:text-slate-900"
                >
                  <Icon
                    size={isMobile ? 30 : 35}
                    className="hover:scale-125 transition pb-1"
                  />
                </button>
              );
            }

            if (item.isModal) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    requireAuth(
                      () => setIsCreatePostOpen(true),
                      "Log In to Create Posts",
                      "Share your poetry, stories, and thoughts with the community."
                    )
                  }
                  title={item.title}
                  className="relative cursor-pointer focus:outline-none"
                >
                  <Icon
                    size={isMobile ? 30 : 35}
                    className="hover:scale-125 transition"
                  />
                </button>
              );
            }

            return (
              <Link key={i} href={item.url} title={item.title} className="relative">
                <Icon
                  size={isMobile ? 30 : 35}
                  className="hover:scale-125 cursor-pointer transition pb-1"
                />
              </Link>
            );
          })}
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        firebaseUser={firebaseUser}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
