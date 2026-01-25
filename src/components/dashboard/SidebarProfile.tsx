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

                {(userData.instagram || userData.snapchat) && (
                  <div className="px-6 py-4 space-y-3">
                    {userData.instagram && (
                      <a
                        href={`https://instagram.com/${userData.instagram}`}
                        target="_blank"
                        className="flex items-center gap-3 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        <Image
                          loading="lazy"
                          src={instagramImg}
                          width={25}
                          height={25}
                          alt="Instagram"
                        />
                        <span className="font-medium truncate">
                          {userData.instagram}
                        </span>
                      </a>
                    )}

                    {userData.snapchat && (
                      <a
                        href={`https://snapchat.com/add/${userData.snapchat}`}
                        target="_blank"
                        className="flex items-center gap-3 px-5 py-2 rounded-xl bg-[#f5ec00] text-black shadow-md hover:shadow-lg transition-all"
                      >
                        <Image
                          src={snapchatImg}
                          width={25}
                          height={25}
                          alt="Snapchat"
                        />
                        <span className="font-medium truncate">
                          {userData.snapchat}
                        </span>
                      </a>
                    )}
                  </div>
                )}

                {/* <div className="px-6 mt-auto mb-6">
                  <button
                    onClick={onLogout}
                    className="cursor-pointer w-full px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all font-medium"
                  >
                    Logout
                  </button>
                </div> */}
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
