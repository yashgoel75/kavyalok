"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../header/page";
import Footer from "../footer/page";
import { AtSign } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { trackUserAuth } from "@/lib/analytics";

export default function Member() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [falseUsernameFormat, setFalseUsernameFormat] = useState(false);
  const [falseEmailFormat, setFalseEmailFormat] = useState(false);
  const [falsePasswordFormat, setFalsePasswordFormat] = useState(false);
  const [falseConfirmPassword, setFalseConfirmPassword] = useState(false);

  const [usernameAlreadyTaken, setUsernameAlreadyTaken] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [emailAlreadyTaken, setEmailAlreadyTaken] = useState(false);

  const [isNameEmpty, setIsNameEmpty] = useState(false);
  const [isUsernameEmpty, setIsUsernameEmpty] = useState(false);
  const [isEmailEmpty, setIsEmailEmpty] = useState(false);
  const [isPasswordEmpty, setIsPasswordEmpty] = useState(false);
  const [isConfirmPasswordEmpty, setIsConfirmPasswordEmpty] = useState(false);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [creatingAccount, setCreatingAccount] = useState(false);
  const [sendingVerificationEmail, setSendingVerificationEmail] =
    useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(120); // 2 minutes
  const [isVerificationMessageVisible, setIsVerificationMessageVisible] =
    useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  useEffect(() => {
    if (sendingVerificationEmail) {
      const timer = setInterval(() => {
        setVerificationCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sendingVerificationEmail]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name == "name") {
      setIsNameEmpty(false);
    }
    if (name === "username") {
      setIsUsernameEmpty(false);
      setUsernameAvailable(false);
      setUsernameAlreadyTaken(false);
    }
    if (name === "email") {
      setIsEmailEmpty(false);
      setEmailAlreadyTaken(false);
    }
    if (name == "password") {
      setIsPasswordEmpty(false);
    }
    if (name == "confirmPassword") {
      setIsConfirmPasswordEmpty(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      formData.name == "" ||
      formData.username == "" ||
      formData.email == "" ||
      formData.password == "" ||
      formData.confirmPassword == ""
    ) {
      setIsNameEmpty(formData.name == "");
      setIsUsernameEmpty(formData.username == "");
      setIsEmailEmpty(formData.email == "");
      setIsPasswordEmpty(formData.password == "");
      setIsConfirmPasswordEmpty(formData.confirmPassword == "");
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      setCreatingAccount(true);
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      setCreatingAccount(false);
      setSendingVerificationEmail(true);

      await sendEmailVerification(userCredentials.user);
      setSendingVerificationEmail(false);
      setVerificationEmailSent(true);
      setCreatingUser(true);
      const res = await axios.post("/api/register/member", formData);
      if (res.status === 200) {
        setSuccess(true);
        trackUserAuth({ method: "email", type: "register", email: formData.email });
        setTimeout(() => router.push("/auth/login"), 1500);
      }
      setCreatingUser(false);
      setSuccess(true);
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  async function isUsernameAvailable() {
    try {
      const res = await fetch(
        `/api/register/member?username=${formData.username}`
      );
      const data = await res.json();

      if (data.usernameExists) {
        setUsernameAvailable(false);
        setUsernameAlreadyTaken(true);
      } else {
        setUsernameAlreadyTaken(false);
        setUsernameAvailable(true);
      }
    } catch (error) {
      console.error("Error checking username:", error);
    }
  }

  useEffect(() => {
    const { username, email, password, confirmPassword } = formData;

    const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
    setFalseUsernameFormat(username ? !usernameRegex.test(username) : false);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setFalseEmailFormat(email ? !emailRegex.test(email) : false);

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    setFalsePasswordFormat(password ? !passwordRegex.test(password) : false);

    setFalseConfirmPassword(
      !!confirmPassword && !!password && confirmPassword !== password
    );
  }, [formData]);

  const [remainingTime, setRemainingTime] = useState(120);

  return (
    <>
      <Header />
      <div className="border-1 border-gray-200 mt-2"></div>

      <div className="w-[95%] lg:w-full max-w-4xl mx-auto pt-10 onest-normal">
        <div className="border md:text-lg border-gray-300 p-4 md:p-6 rounded-xl shadow-md bg-white mb-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Sign Up
          </h1>

          {error && <p className="text-red-600 text-center mb-4">{error}</p>}
          {success && (
            <p className="text-green-600 text-center mb-4">{success}</p>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-1 md:space-y-2 lg:space-y-4"
          >
            <div className="flex-1">
              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full border-b-1 border-gray-300 px-2 py-2 focus:outline-none"
                />
              </div>
              {isNameEmpty ? (
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
                  &nbsp; Please enter your name
                </div>
              ) : null}
            </div>

            <div>
              <div className="flex items-center">
                <div>
                  <label className="block mb-1 text-gray-700 font-medium mr-1">
                    Username
                  </label>
                </div>
              </div>
              <div className="flex items-center border-b-1 border-gray-300">
                <span className="px-2 text-gray-600">
                  <AtSign />
                </span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="yourusername"
                  className="flex-1 py-2 outline-none w-[70%] lg:w-[80%]"
                />
                <button
                  type="button"
                  onClick={() => {
                    isUsernameAvailable();
                  }}
                  disabled={falseUsernameFormat}
                  className={`bg-gradient-to-br from-[#9a6f0bff] to-[#dbb56aff] w-[30%] text-center lg:w-[20%] outline-none text-white px-1 md:px-2 lg:px-4 py-2 rounded-md mb-1 hover:from-[#b8870b] hover:to-[#f0c96c] ${
                    falseUsernameFormat
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:cursor-pointer"
                  }`}
                >
                  Check
                </button>
              </div>
              {isUsernameEmpty ? (
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
                  &nbsp; Please enter your username
                </div>
              ) : null}
            </div>
            {formData.username && usernameAlreadyTaken ? (
              <div className="flex text-sm md:text-base justify-center items-center bg-red-300 text-red-800 rounded px-3 text-center py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height={isMobile ? "20px" : "24px"}
                  viewBox="0 -960 960 960"
                  width={isMobile ? "20px" : "24px"}
                  fill="#992B15"
                >
                  <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                </svg>
                &nbsp; Username already taken
              </div>
            ) : null}
            {formData.username && usernameAvailable ? (
              <div className="flex text-sm md:text-base justify-center items-center bg-green-500 text-[#264d0fff] rounded px-3 text-center py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height={isMobile ? "20px" : "24px"}
                  viewBox="0 -960 960 960"
                  width={isMobile ? "20px" : "24px"}
                  fill="#264d0fff"
                >
                  <path d="m344-60-76-128-144-32 14-148-98-112 98-112-14-148 144-32 76-128 136 58 136-58 76 128 144 32-14 148 98 112-98 112 14 148-144 32-76 128-136-58-136 58Zm34-102 102-44 104 44 56-96 110-26-10-112 74-84-74-86 10-112-110-24-58-96-102 44-104-44-56 96-110 24 10 112-74 86 74 84-10 114 110 24 58 96Zm102-318Zm-42 142 226-226-56-58-170 170-86-84-56 56 142 142Z" />
                </svg>
                &nbsp; Username available
              </div>
            ) : null}
            {falseUsernameFormat ? (
              <div className="flex text-sm md:text-base justify-center items-center bg-red-300 text-red-800 rounded px-3 text-center py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height={isMobile ? "20px" : "24px"}
                  viewBox="0 -960 960 960"
                  width={isMobile ? "20px" : "24px"}
                  fill="#992B15"
                >
                  <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                </svg>
                &nbsp; Please enter a valid username
              </div>
            ) : null}
            <div>
              <label className="block mb-1 text-gray-700 font-medium">
                Email
              </label>
              <div className="flex items-center border-b-1 border-gray-300">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="flex-1 px-2 py-2 outline-none w-[70%] lg:w-[80%]"
                />
              </div>

              {isEmailEmpty ? (
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
              ) : null}
            </div>
            {emailAlreadyTaken ? (
              <div className="flex text-sm md:text-base justify-center items-center bg-red-300 text-red-800 rounded px-3 text-center py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height={isMobile ? "20px" : "24px"}
                  viewBox="0 -960 960 960"
                  width={isMobile ? "20px" : "24px"}
                  fill="#992B15"
                >
                  <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                </svg>
                &nbsp; Email ID already in use
              </div>
            ) : null}
            {falseEmailFormat ? (
              <div className="flex text-sm md:text-base justify-center items-center bg-red-300 text-red-800 rounded px-3 text-center py-1">
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
            ) : null}

            <div className="flex-1 space-y-1 md:flex gap-4">
              <div className="flex-1">
                <div>
                  <div className="flex items-center">
                    <div className="mr-1">
                      <label className="block mb-1 text-gray-700 font-medium">
                        Password
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••"
                      className="w-full px-2 py-2 border-b-1 border-gray-300 focus:outline-none"
                    />
                  </div>
                </div>
                {isPasswordEmpty ? (
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
                ) : null}
              </div>
              <div className="flex-1">
                <div>
                  <div className="flex items-center">
                    <label className="block mb-1 text-gray-700 font-medium">
                      Confirm Password&nbsp;
                    </label>
                    <svg
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#000000"
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
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="superstrongpassword"
                    className="w-full border-b-1 border-gray-300 px-2 py-2 focus:outline-none"
                  />
                </div>
                {isConfirmPasswordEmpty ? (
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
                    &nbsp; Please enter confirm password
                  </div>
                ) : null}
              </div>
            </div>
            {falsePasswordFormat ? (
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
            ) : null}
            {falseConfirmPassword ? (
              <div className="flex justify-center items-center bg-red-300 text-red-800 rounded px-3 text-center py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height={isMobile ? "20px" : "24px"}
                  viewBox="0 -960 960 960"
                  width={isMobile ? "20px" : "24px"}
                  fill="#992B15"
                >
                  <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                </svg>
                &nbsp; Passwords do not match.
              </div>
            ) : null}
            <div className="text-sm bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
              <p className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                Password requirements:
              </p>
              <ul className="space-y-1 text-yellow-900">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-500" />
                  Must be at least 8 characters long
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-500" />
                  Include at least one uppercase letter
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-500" />
                  Include at least one lowercase letter
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-500" />
                  Include at least one special character
                </li>
              </ul>
            </div>
            <div className="flex items-center mt-4">
              <input type="checkbox" id="terms" className="mr-2" required />
              <label htmlFor="terms" className="text-gray-700 text-sm">
                I agree to the{" "}
                <Link
                  href="/terms-and-conditions"
                  className="text-yellow-600 underline"
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy-policy"
                  className="text-yellow-600 underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div className="text-center mt-3">
              <button
                type="submit"
                disabled={isSubmitting || success}
                className={`w-full bg-gradient-to-br from-[#9a6f0bff] to-[#dbb56aff] text-white px-6 py-2 rounded-md font-semibold transition hover:from-[#b8870b] hover:to-[#f0c96c] ${
                  isSubmitting || success
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:cursor-pointer"
                }`}
              >
                {creatingAccount
                  ? "Creating Account..."
                  : sendingVerificationEmail
                  ? "Sending Verification Email..."
                  : isSubmitting
                  ? "Submitting..."
                  : success
                  ? "Redirecting... Please Wait"
                  : "Register Member"}
              </button>
            </div>
          </form>
          {verificationEmailSent && !success && (
            <div className="mt-6 px-4 py-2 bg-green-50 text-green-800 border border-green-200 rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Verification Email Sent!</span>
              </div>
              <p className="mt-2 text-sm">
                We have sent a verification email to{" "}
                <strong>{formData.email}</strong>. Please check your inbox (and
                spam folder) and verify your email address.
              </p>
              <p className="mt-2 text-sm">
                You must verify your email within{" "}
                <strong>
                  {Math.floor(verificationCountdown / 60)}:
                  {(verificationCountdown % 60).toString().padStart(2, "0")}
                </strong>{" "}
                minutes, or else your account will be deleted.
              </p>
            </div>
          )}
        </div>
        <div className="text-center mb-8">
          Already have an account?&nbsp;
          <Link href={"/auth/login"}>
            <u>Login now.</u>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
