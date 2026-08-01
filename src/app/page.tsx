"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GradientText from "@/components/GradientText";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

import "./page.css";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) {
        const timer = setTimeout(() => {
          router.replace("/dashboard");
        }, 1500);
      } else {
        const timer = setTimeout(() => {
          router.replace("/dashboard");
        }, 1500);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <main className="main-container bg-[#2E2B26] flex flex-col items-center justify-center min-h-screen p-4">
      <span className="text-4xl dm-serif-display-regular-italic text-[#9a6f0bff]">
        Welcome to
      </span>

      <span className="kavyansh custom-class text-[65px] md:text-[100px] text-[#9a6f0bff]">
        Kavyalok
      </span>

      {loading && (
        <div className="loader mt-8">
          <div></div>
          <div></div>
          <div></div>
        </div>
      )}
    </main>
  );
}