"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { getFirebaseToken } from "@/utils";
import { useUser } from "@/context/UserContext";

interface UserData {
  name: string;
  username: string;
  profilePicture?: string;
  followers: string[];
  following: string[];
}

interface Friend {
  name: string;
  username: string;
  profilePicture?: string;
  email: string;
}

export default function FriendsPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [followersDetails, setFollowersDetails] = useState<Friend[]>([]);
  const [followingDetails, setFollowingDetails] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace("/");
    } else if (firebaseUser?.email) {
      fetchUserData(firebaseUser.email);
    }
  }, [authLoading, firebaseUser, router]);

  const fetchUserData = async (email: string) => {
    try {
      const res = await fetch(
        `/api/getuserfriends?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load user data");

      const user = {
        name: data.user.name,
        username: data.user.username,
        profilePicture: data.user.profilePicture,
        followers: data.user.followers || [],
        following: data.user.following || [],
      };

      setUserData(user);

      await Promise.all([
        fetchFriends(user.followers, setFollowersDetails),
        fetchFriends(user.following, setFollowingDetails),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async (
    emails: string[],
    setState: (friends: Friend[]) => void
  ) => {
    if (emails.length === 0) {
      setState([]);
      return;
    }

    try {
      const token = await getFirebaseToken();

      const res = await fetch("/api/getbatchfriends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emails }),
      });

      const data = await res.json();

      if (res.ok) {
        setState(data.users);
      } else {
        console.error("Failed batch fetch:", data.error);
        setState([]);
      }
    } catch (err) {
      console.error("Batch fetch error:", err);
      setState([]);
    }
  };

  const handleFollowBack = async (friendEmail: string) => {
    if (!firebaseUser) return;
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/user/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentUserEmail: firebaseUser.email,
          targetEmail: friendEmail,
          action: "follow",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (firebaseUser?.email) {
          fetchUserData(firebaseUser.email);
        }
      } else {
        alert(data.error || "Failed to follow back");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || authLoading) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-10 min-h-[80vh]">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Friends</h2>

          <div className="space-y-3 mt-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white shadow-xs rounded-lg animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-300"></div>

                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-300 rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>

                <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center h-[70vh]">
          <p className="text-gray-600">User not found.</p>
        </main>
        <Footer />
      </>
    );
  }

  const FriendCard = ({
    friend,
    isFollower,
  }: {
    friend: Friend;
    isFollower?: boolean;
  }) => {
    const isFollowing = userData.following.includes(friend.email);
    return (
      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push(`/user/${friend.username}`)}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-white font-medium">
            {friend.profilePicture ? (
              <Image
                src={friend.profilePicture}
                alt={friend.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              friend.name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-gray-700 font-medium">{friend.name}</span>
        </div>
        {isFollower && (
          <button
            className={`px-3 py-1 rounded-md text-sm ${
              isFollowing
                ? "bg-gray-200 text-gray-700 cursor-default"
                : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            }`}
            disabled={isFollowing}
            onClick={() => !isFollowing && handleFollowBack(friend.email)}
          >
            {isFollowing ? "Following" : "Follow Back"}
          </button>
        )}
      </div>
    );
  };

  const displayedFriends =
    activeTab === "followers" ? followersDetails : followingDetails;

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10 min-h-[90vh]">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Friends</h2>

        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-md font-medium cursor-pointer ${
              activeTab === "followers"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveTab("followers")}
          >
            Followers ({followersDetails.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium cursor-pointer ${
              activeTab === "following"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveTab("following")}
          >
            Following ({followingDetails.length})
          </button>
        </div>

        {displayedFriends.length === 0 ? (
          <p className="text-gray-500">
            {activeTab === "followers"
              ? "No followers yet."
              : "Not following anyone yet."}
          </p>
        ) : (
          <div className="space-y-2">
            {displayedFriends.map((friend) => (
              <FriendCard
                key={friend.email}
                friend={friend}
                isFollower={activeTab === "followers"}
              />
            ))}
          </div>
        )}
      </main>
      <Navigation />
      <Footer />
    </>
  );
}
