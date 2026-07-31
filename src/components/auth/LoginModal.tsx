"use client";

import React, { useState } from "react";
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";
import GradientText from "@/components/GradientText";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Join the Conversation",
  subtitle = "Log in to like, repost, comment, and connect with the community.",
}: LoginModalProps) {
  const { refreshUserData } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setEmailNotVerified(false);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);

      if (!userCred.user.emailVerified) {
        setEmailNotVerified(true);
        await auth.signOut();
        setIsSubmitting(false);
        return;
      }

      await refreshUserData();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Login modal error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setErrorMessage("Invalid email or password. Please try again.");
      } else {
        setErrorMessage(err.message || "Failed to log in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setResetSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-900 cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6 pt-2">
          <span className="custom-class text-[45px] block text-center mb-1">
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
              Kavyalok
            </GradientText>
          </span>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
          <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed max-w-xs mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Form Body */}
        {isResetMode ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-gray-900 focus-within:bg-white transition-all">
                <Mail size={18} className="text-gray-400 mr-2.5 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm focus:outline-none text-gray-900 font-medium placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl text-center">
                Password reset link sent! Check your inbox.
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl text-center">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending Reset Email...</span>
                </>
              ) : (
                <span>Send Reset Email</span>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setErrorMessage("");
                  setResetSuccess(false);
                }}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 underline cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-gray-900 focus-within:bg-white transition-all">
                <Mail size={18} className="text-gray-400 mr-2.5 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm focus:outline-none text-gray-900 font-medium placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-xs font-bold text-yellow-700 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="flex items-center px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-gray-900 focus-within:bg-white transition-all">
                <Lock size={18} className="text-gray-400 mr-2.5 shrink-0" />
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm focus:outline-none text-gray-900 font-medium placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer ml-2"
                >
                  {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl text-center">
                {errorMessage}
              </div>
            )}

            {emailNotVerified && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl text-center space-y-1">
                <p>Your email is not verified yet.</p>
                {verificationSent ? (
                  <p className="text-emerald-700">Verification email sent! Check your inbox.</p>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (auth.currentUser) {
                        await sendEmailVerification(auth.currentUser);
                        setVerificationSent(true);
                      }
                    }}
                    className="underline cursor-pointer hover:text-rose-950"
                  >
                    Resend Verification Email
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>

            <div className="text-center pt-3 border-t border-gray-100 text-xs font-semibold text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                onClick={onClose}
                className="font-extrabold text-gray-900 hover:underline"
              >
                Create one now
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
