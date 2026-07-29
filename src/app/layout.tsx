import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

import PageTransitionWrapper from "@/components/PageTransitionWrapper";
import { UserProvider } from "@/context/UserContext";
import QueryProvider from "@/components/providers/QueryProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Kavyalok",
  description: "A creative home for writers, poets, and storytellers to express freely.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased bg-white text-gray-900">
        <QueryProvider>
          <UserProvider>
            <PageTransitionWrapper>
              {children}
              <Analytics />
              <SpeedInsights />
            </PageTransitionWrapper>
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
