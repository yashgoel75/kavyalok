import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import GradientText from "@/components/GradientText";
import snapchatImg from "../../../public/snapchat.png";
import instagramImg from "../../../public/instagram.png";
import { User } from "@/hooks/useDashboard";

interface SidebarProps {
  userData: User | null;
  loading: boolean;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onLogout: () => void;
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
        <div
          className={`absolute ${
            isMobile ? "w-full px-7" : ""
          } md:static top-16 left-0 z-40 border-r border-gray-200 h-[calc(100vh-4rem)] bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
        w-80 min-h-screen max-h-screen`}
        >
          <aside className="h-full flex flex-col">
            <span className="text-center custom-class text-[50px] mt-3">
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
            </span>

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

                <div className="h-12 w-full bg-gray-300 rounded-xl mt-10"></div>
              </div>
            ) : userData ? (
              <div className="flex flex-col h-full bg-white">
                <div className="relative">
                  <div className="h-25 bg-white"></div>
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                    <img
                      src={
                        userData.profilePicture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
                      }
                      alt={userData.name}
                      className={`w-32 h-32 rounded-full shadow-lg object-cover bg-white ${
                        userData.isVerified
                          ? "border-4 border-green-700"
                          : "border-4 border-white"
                      }`}
                    />
                    {userData.isVerified && (
                      <div
                        title="Verified"
                        className="absolute bottom-2 right-2 bg-green-700 rounded-full p-1 flex items-center justify-center"
                      >
                        <Check color="white" size={20} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-20 px-6 pb-4 text-center border-b border-gray-100">
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

                <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {userData.posts?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Posts</div>
                  </div>

                  <Link href="/account" className="text-center cursor-pointer">
                    <div className="text-2xl font-bold text-gray-800">
                      {userData.followers?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Followers</div>
                  </Link>

                  <Link href="/account" className="text-center cursor-pointer">
                    <div className="text-2xl font-bold text-gray-800">
                      {userData.following?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Following</div>
                  </Link>
                </div>

                {/* Sidebar Integrated Footer Navigation */}
                <div className="mt-auto border-t border-gray-100 bg-gray-50/70 p-5 space-y-4 text-xs text-gray-600">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wider text-[10px]">Platform</h4>
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
                    <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wider text-[10px]">Legal</h4>
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
                    <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wider text-[10px]">Connect</h4>
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
        </div>

        {isOpen && (
          <div
            className="fixed inset-0 bg-opacity-50 z-30 md:hidden"
            onClick={onClose}
          ></div>
        )}
      </>
    );
  },
);

SidebarProfile.displayName = "SidebarProfile";
export default SidebarProfile;
