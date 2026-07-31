"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser, getAuth, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getFirebaseToken } from "@/utils";

export interface PrivacySettings {
  isPrivate: boolean;
  showEmail: boolean;
  allowMessages: boolean;
  showActivity: boolean;
}

export interface UserPost {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  likes: number;
  color: string;
  createdAt?: string;
}

export interface User {
  _id?: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  penName?: string;
  favoriteGenre?: string;
  literaryQuote?: string;
  location?: string;
  profilePicture?: string;
  posts?: UserPost[];
  pinnedPosts?: string[];
  reposts?: string[];
  instagram?: string;
  snapchat?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
  followers?: string[];
  following?: string[];
  isVerified?: boolean;
  defaultPostColor?: string;
  privacySettings?: PrivacySettings;
}

import LoginModal from "@/components/auth/LoginModal";

interface UserContextType {
  firebaseUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  refreshUserData: () => Promise<User | null>;
  setUserData: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
  isLoginModalOpen: boolean;
  openLoginModal: (title?: string, subtitle?: string) => void;
  closeLoginModal: () => void;
  requireAuth: (actionCallback?: () => void, title?: string, subtitle?: string) => boolean;
}

const UserContext = createContext<UserContextType>({
  firebaseUser: null,
  userData: null,
  loading: true,
  refreshUserData: async () => null,
  setUserData: () => {},
  logout: async () => {},
  isLoginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  requireAuth: () => false,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalOptions, setLoginModalOptions] = useState<{ title?: string; subtitle?: string }>({});
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const openLoginModal = useCallback((title?: string, subtitle?: string) => {
    setLoginModalOptions({ title, subtitle });
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setPendingAction(null);
  }, []);

  const requireAuth = useCallback(
    (actionCallback?: () => void, title?: string, subtitle?: string): boolean => {
      if (firebaseUser) {
        if (actionCallback) actionCallback();
        return true;
      }

      if (actionCallback) setPendingAction(() => actionCallback);
      openLoginModal(title, subtitle);
      return false;
    },
    [firebaseUser, openLoginModal]
  );

  const handleLoginSuccess = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const fetchUserData = useCallback(async (email: string): Promise<User | null> => {
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/user?email=${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to fetch user data");

      const fetchedUser = data.user || null;
      if (fetchedUser) {
        setUserData(fetchedUser);
        localStorage.setItem("userData", JSON.stringify(fetchedUser));
        localStorage.setItem("userDataCachedAt", Date.now().toString());
      }
      return fetchedUser;
    } catch (err) {
      console.error("UserContext fetch error:", err);
      return null;
    }
  }, []);

  const refreshUserData = useCallback(async (): Promise<User | null> => {
    if (firebaseUser?.email) {
      return await fetchUserData(firebaseUser.email);
    }
    return null;
  }, [firebaseUser, fetchUserData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);

      if (u?.email) {
        // Try local storage cache for instant load
        const cached = localStorage.getItem("userData");
        const cachedAt = localStorage.getItem("userDataCachedAt");
        const oneHour = 60 * 60 * 1000;
        const isCacheValid = cached && cachedAt && Date.now() - Number(cachedAt) < oneHour;

        if (isCacheValid) {
          try {
            const parsed = JSON.parse(cached);
            setUserData(parsed);
            setLoading(false);
            // Silently refresh in background
            fetchUserData(u.email);
            return;
          } catch (e) {
            console.error("Failed to parse cached user data", e);
          }
        }

        await fetchUserData(u.email);
        setLoading(false);
      } else {
        setUserData(null);
        localStorage.removeItem("userData");
        localStorage.removeItem("userDataCachedAt");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const logout = useCallback(async () => {
    try {
      await signOut(getAuth());
      setFirebaseUser(null);
      setUserData(null);
      localStorage.removeItem("userData");
      localStorage.removeItem("userDataCachedAt");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        firebaseUser,
        userData,
        loading,
        refreshUserData,
        setUserData,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        requireAuth,
      }}
    >
      {children}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onSuccess={handleLoginSuccess}
        title={loginModalOptions.title}
        subtitle={loginModalOptions.subtitle}
      />
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
