"use client";

import Link from "next/link";
import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/40 text-gray-900 font-sans antialiased">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <p className="text-3xl md:text-5xl font-semibold text-[#bd9864] tracking-wide uppercase">
          404
        </p>
        <h1 className="mt-2 text-4xl sm:text-6xl font-bold tracking-tight text-gray-900">
          Page not found
        </h1>
        <p className="mt-4 text-base text-gray-600 max-w-md mx-auto leading-relaxed">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been removed, renamed, or doesn&apos;t exist.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#bd9864] hover:bg-[#a68250] text-white font-medium text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>

      <Navigation />
      <Footer />
    </div>
  );
}