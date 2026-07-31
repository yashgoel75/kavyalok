import React, { memo } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import GradientText from "@/components/GradientText";
import { User } from "@/hooks/useDashboard";

interface SidebarProps {
  userData: User | null;
  loading: boolean;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onLogout: () => void;
  onToggle?: () => void;
}

const SidebarProfile = memo(
  ({
    userData,
    loading,
    isOpen,
    isMobile,
    onClose,
    onLogout,
  }: SidebarProps) => {
    return (
      <>
        {/* Mobile Backdrop Overlay */}
        {isMobile && isOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity duration-300"
            onClick={onClose}
          />
        )}

        {/* Sidebar Main Container */}
        <aside
          className={`
            bg-white border-r border-gray-200 shadow-xs
            transition-all duration-300 ease-in-out z-40 flex flex-col
            ${
              isMobile
                ? `fixed inset-y-0 left-0 z-50 w-[310px] sm:w-[340px] shadow-2xl h-full ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                  }`
                : `sticky top-0 h-screen overflow-y-auto ${
                    isOpen
                      ? "w-80 opacity-100 shrink-0"
                      : "w-0 opacity-0 pointer-events-none border-none p-0 overflow-hidden shrink-0"
                  }`
            }
          `}
        >
          {/* Sidebar Top Branding Header */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2 border-gray-100">
            <span className="custom-class text-[45px] text-center w-full relative">
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

              {isMobile && (
                <button
                  onClick={onClose}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                  title="Close drawer"
                >
                  <X size={22} />
                </button>
              )}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center px-6 mt-10 animate-pulse w-full">
              <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto"></div>
              <div className="h-5 w-32 bg-gray-300 rounded mt-6"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mt-3"></div>
              <div className="h-4 w-40 bg-gray-200 rounded mt-4"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mt-2"></div>

              <div className="grid grid-cols-3 gap-4 w-full mt-10">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : userData ? (
            <div className="flex flex-col flex-1 justify-between bg-white overflow-y-auto">
              <div>
                {/* Profile Header Card */}
                <div className="pt-6 px-6 pb-5 text-center border-b border-gray-100 flex flex-col items-center">
                  <div className="relative mb-4">
                    <img
                      src={
                        userData.profilePicture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
                      }
                      alt={userData.name}
                      className={`w-32 h-32 rounded-full shadow-lg object-cover bg-white ${
                        userData.isVerified
                          ? "border-4 border-emerald-700"
                          : "border-4 border-white"
                      }`}
                    />
                    {userData.isVerified && (
                      <div
                        title="Verified"
                        className="absolute bottom-1 right-1 bg-emerald-700 text-white rounded-full p-1 shadow-md flex items-center justify-center"
                      >
                        <Check size={18} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800">
                    {userData.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    @{userData.username}
                  </p>
                  {userData.bio && (
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                      {userData.bio}
                    </p>
                  )}
                </div>

                {/* Profile Stats Grid */}
                <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {userData.posts?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Posts</div>
                  </div>

                  <Link
                    href="/account"
                    onClick={isMobile ? onClose : undefined}
                    className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="text-2xl font-bold text-gray-800">
                      {userData.followers?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Followers</div>
                  </Link>

                  <Link
                    href="/account"
                    onClick={isMobile ? onClose : undefined}
                    className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="text-2xl font-bold text-gray-800">
                      {userData.following?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Following</div>
                  </Link>
                </div>
              </div>

              {/* Sidebar Integrated Footer Navigation */}
              <div className="mt-auto border-t border-gray-100 bg-gray-50/70 p-5 space-y-4 text-xs text-gray-600">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wider text-[10px]">
                    Platform
                  </h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    <Link href="/about" className="hover:text-gray-900 transition-colors">About Us</Link>
                    <span className="text-gray-300">•</span>
                    <Link href="/team" className="hover:text-gray-900 transition-colors">Our Team</Link>
                    <span className="text-gray-300">•</span>
                    <Link href="/careers" className="hover:text-gray-900 transition-colors">Careers</Link>
                    <span className="text-gray-300">•</span>
                    <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wider text-[10px]">
                    Legal
                  </h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                    <span className="text-gray-300">•</span>
                    <Link href="/terms-and-conditions" className="hover:text-gray-900 transition-colors">Terms</Link>
                    <span className="text-gray-300">•</span>
                    <Link href="/refund-policy" className="hover:text-gray-900 transition-colors">Refund</Link>
                    <span className="text-gray-300">•</span>
                    <Link href="/shipping-policy" className="hover:text-gray-900 transition-colors">Shipping</Link>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wider text-[10px]">
                    Connect
                  </h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    <a href="mailto:support@kavyalok.in" className="hover:text-gray-900 transition-colors">support@kavyalok.in</a>
                    <span className="text-gray-300">•</span>
                    <a href="https://linkedin.com/company/kavyalok-in" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors">LinkedIn</a>
                    <span className="text-gray-300">•</span>
                    <a href="https://instagram.com/kavyalok.in" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors">Instagram</a>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200/60 text-[11px] text-gray-400 text-center">
                  © {new Date().getFullYear()} Kavyalok. All rights reserved.
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </>
    );
  }
);

SidebarProfile.displayName = "SidebarProfile";
export default SidebarProfile;


