import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import "./globals.css";

import PageTransitionWrapper from "@/components/PageTransitionWrapper";
import { UserProvider } from "@/context/UserContext";

export const metadata: Metadata = {
  title: "Kavyalok",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <PageTransitionWrapper>
            {children}
            <Analytics />
            <SpeedInsights />
          </PageTransitionWrapper>
        </UserProvider>
      </body>
    </html>
  );
}
