"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./page.css";
import Link from "next/link";
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import Header from "../header/page";
import Footer from "../footer/page";
import { auth } from "@/lib/firebase";
import { Check } from "lucide-react";
import { trackUserAuth } from "@/lib/analytics";

interface Post {
  _id: string;
  title: string;
  content: string;
  likes: number;
  color: string;
}

export default function Login() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "member",
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [falseEmailFormat, setFalseEmailFormat] = useState(false);
  const [falsePasswordFormat, setFalsePasswordFormat] = useState(false);

  const [isEmailEmpty, setIsEmailEmpty] = useState(false);
  const [isPasswordEmpty, setIsPasswordEmpty] = useState(false);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);

  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      if (user.emailVerified) {
        router.replace("/dashboard");
        return;
      }
      setUser(user);
      setEmailNotVerified(true);

      await auth.signOut();
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/getPosts`);
        const data = await res.json();
        setPosts(data.posts);
      } catch (error: unknown) {
        console.log(error);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const marquees = document.querySelectorAll<HTMLElement>(".marquee");

    marquees.forEach((el) => {
      el.style.animation = "none";
    });

    requestAnimationFrame(() => {
      marquees.forEach((el) => {
        void el.offsetWidth;
        el.style.animation = "";
        el.style.animationPlayState = "running";
      });
    });
  }, [posts]);

  useEffect(() => {
    const { email, password } = formData;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setFalseEmailFormat(email ? !emailRegex.test(email) : false);

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    setFalsePasswordFormat(password ? !passwordRegex.test(password) : false);
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(false);
    setResetError("");

    if (name === "email") {
      setIsEmailEmpty(false);
    }
    if (name === "password") {
      setIsPasswordEmpty(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (formData.email === "" || formData.password === "") {
      setIsEmailEmpty(formData.email === "");
      setIsPasswordEmpty(formData.password === "");
      return;
    }

    setIsSubmitting(true);
    setError(false);
    setSuccess(false);

    try {
      const userCred = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      if (!userCred.user.emailVerified) {
        setEmailNotVerified(true);
        await auth.signOut();
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      trackUserAuth({ method: "email", type: "login", email: formData.email });
      setTimeout(() => router.replace("/dashboard"), 1500);
    } catch (err) {
      setError(true);
      console.error(err);
    }
  };

  const sendVerification = async () => {
    setVerificationError("");
    setVerificationSent(false);

    try {
      if (user) {
        await sendEmailVerification(user);
        setVerificationSent(true);
      }
    } catch (err) {
      setVerificationError("Failed to send verification email.");
    }
  };

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.email === "") {
      setIsEmailEmpty(true);
      return;
    }

    setIsSubmitting(true);
    setResetError("");
    setResetSuccess(false);

    try {
      await sendPasswordResetEmail(auth, formData.email);
      setResetSuccess(true);
    } catch (err: unknown) {
      setResetError("Failed to send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="border-1 border-gray-200 mt-2"></div>
      <div className="flex-1 md:flex w-[95%] lg:w-full mx-auto">
        <div className="w-[65%] flex items-center hidden md:flex border-gray-200 overflow-hidden py-6">
          <div className="space-y-10 marquee-wrapper">
            <div className="marquee marquee-left">
              {[...posts, ...posts]?.map((post, index) => (
                <div key={`${post._id}-${index}`} className="post-card">
                  <h3>{post.title}</h3>
                  <p
                    dangerouslySetInnerHTML={{
                      __html:
                        post.content?.length > 120
                          ? post.content.slice(0, 120) + "..."
                          : post.content,
                    }}
                  ></p>
                </div>
              ))}
            </div>

            <div className="marquee marquee-right">
              {[...posts, ...posts]?.map((post, index) => (
                <div key={`${post._id}-rev-${index}`} className="post-card">
                  <h3>{post.title}</h3>
                  <p
                    dangerouslySetInnerHTML={{
                      __html:
                        post.content?.length > 120
                          ? post.content.slice(0, 120) + "..."
                          : post.content,
                    }}
                  ></p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="md:w-[35%] m-5 pt-10 onest-normal min-h-[75vh]">
          {isResetMode ? (
            <>
              <div className="border md:text-lg border-gray-300 p-6 rounded-xl shadow-md bg-white mb-8">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                  Reset Password
                </h1>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block mb-1 text-gray-700 font-medium">
                      Email
                    </label>
                    <div className="flex items-center">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="flex-1 px-2 py-2 border-b-1 border-gray-300 focus:outline-none"
                      />
                    </div>

                    {isEmailEmpty && (
                      <div className="text-sm flex text-[#8C1A10] mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="18px"
                          width="18px"
                          fill="#8C1A10"
                          viewBox="0 -960 960 960"
                        >
                          <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
                        </svg>
                        &nbsp; Please enter your email
                      </div>
                    )}
                    {falseEmailFormat && (
                      <div className="flex text-sm justify-center items-center bg-red-300 text-red-800 rounded px-3 text-center py-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="20px"
                          width="20px"
                          fill="#992B15"
                          viewBox="0 -960 960 960"
                        >
                          <path d="m40-120 440-760 440 760H40Z" />
                        </svg>
                        &nbsp; Please enter a valid email address
                      </div>
                    )}
                  </div>

                  {resetSuccess && (
                    <div className="text-sm">
                      If an account is associated with this email address, you
                      will receive a password reset link shortly.
                    </div>
                  )}

                  {resetError && (
                    <div className="text-center bg-red-300 text-red-800 rounded px-3 py-1">
                      {resetError}
                    </div>
                  )}

                  <div className="text-center mt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full bg-gradient-to-br from-[#9a6f0bff] to-[#dbb56aff] text-white px-6 py-2 rounded-md font-semibold transition-all cursor-pointer ${
                        isSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:from-[#b8870b] hover:to-[#f0c96c]"
                      }`}
                    >
                      {isSubmitting ? "Sending..." : "Send Reset Email"}
                    </button>
                  </div>

                  <div className="text-center mt-3 text-base">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                        setResetError("");
                        setResetSuccess(false);
                        setIsEmailEmpty(false);
                      }}
                      className="cursor-pointer"
                    >
                      <u>Back to Login</u>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="border md:text-lg border-gray-300 p-6 rounded-xl shadow-md bg-white mb-8">
              <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                Welcome Back!
              </h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex-1">
                  <div>
                    <div>
                      <label className="block mb-1 text-gray-700 font-medium">
                        Email
                      </label>
                      <div className="flex items-center">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="flex-1 px-2 py-2 border-b-1 border-gray-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  {isEmailEmpty && (
                    <div className="text-sm flex text-[#8C1A10] mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="18px"
                        viewBox="0 -960 960 960"
                        width="18px"
                        fill="#8C1A10"
                      >
                        <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                      </svg>
                      &nbsp; Please enter your email
                    </div>
                  )}
                </div>
                {falseEmailFormat && (
                  <div className="flex text-sm md:text-base justify-center md:items-center bg-red-300 text-red-800 rounded px-3 text-center py-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height={isMobile ? "20px" : "24px"}
                      viewBox="0 -960 960 960"
                      width={isMobile ? "20px" : "24px"}
                      fill="#992B15"
                    >
                      <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                    </svg>
                    &nbsp; Please enter a valid email address
                  </div>
                )}
                <div>
                  <div className="flex items-center">
                    <label className="block mb-1 text-gray-700 font-medium">
                      Password&nbsp;
                    </label>
                    <svg
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#000000"
                      className="cursor-pointer"
                    >
                      <path
                        d={
                          isPasswordVisible
                            ? "M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"
                            : "m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"
                        }
                      />
                    </svg>
                  </div>
                  <div className="flex items-center">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={
                        isPasswordVisible ? "superstrongpassword" : "••••••"
                      }
                      className="flex-1 px-2 py-2 border-b-1 border-gray-300 focus:outline-none"
                    />
                  </div>

                  <div className="text-sm flex text-[#8C1A10] mt-2">
                    <button
                      type="button"
                      className="cursor-pointer"
                      onClick={() => {
                        setIsResetMode(true);
                        setResetSuccess(false);
                        setResetError("");
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {isPasswordEmpty && (
                    <div className="text-sm flex text-[#8C1A10] mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="18px"
                        viewBox="0 -960 960 960"
                        width="18px"
                        fill="#8C1A10"
                      >
                        <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                      </svg>
                      &nbsp; Please enter password
                    </div>
                  )}
                </div>
                {falsePasswordFormat && (
                  <div className="flex text-sm md:text-base justify-center md:items-center bg-red-300 text-red-800 rounded px-3 text-center py-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height={isMobile ? "20px" : "24px"}
                      viewBox="0 -960 960 960"
                      width={isMobile ? "20px" : "24px"}
                      fill="#992B15"
                    >
                      <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                    </svg>
                      &nbsp; Please enter a valid password format
                      
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={isSubmitting || success}
                    className={`w-full bg-gradient-to-br from-[#9a6f0bff] to-[#dbb56aff] text-white px-6 py-2 rounded-md font-semibold 
            transition-all duration-300 
            hover:from-[#b8870b] hover:to-[#f0c96c] hover:shadow-md
            ${
              isSubmitting || success
                ? "opacity-50 cursor-not-allowed"
                : "hover:cursor-pointer"
            }`}
                  >
                    {isSubmitting
                      ? "Logging in..."
                      : success
                      ? "Redirecting... Please Wait"
                      : "Login"}
                  </button>
                </div>
              </form>
              {emailNotVerified && (
                <div className="flex mt-2 bg-red-300 text-red-800 rounded px-3 py-2 text-sm md:text-base items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height={isMobile ? "20px" : "24px"}
                    width={isMobile ? "20px" : "24px"}
                    viewBox="0 -960 960 960"
                    fill="#992B15"
                    className="flex items-start"
                  >
                    <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                  </svg>

                  <div className="flex flex-wrap gap-1">
                    <span>Your email is not verified.</span>
                    <button
                      onClick={sendVerification}
                      className="underline cursor-pointer"
                    >
                      Send Verification Email
                    </button>
                  </div>
                </div>
              )}
              {verificationSent && (
                <div className="flex items-center text-green-700 mt-1 text-sm">
                  Verification email sent!
                </div>
              )}

              {verificationError && (
                <div className="text-red-800 mt-1">{verificationError}</div>
              )}
            </div>
          )}
          <div className="text-center">
            Don&apos;t have an account?&nbsp;
            <Link href={"/auth/register"}>
              <u>Create one now.</u>
            </Link>
          </div>
        </div>
      </div>
      <div className="fixed w-full bottom-0 mt-5"></div>
      <Footer />
    </>
  );
}
