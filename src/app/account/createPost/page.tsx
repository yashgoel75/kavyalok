"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import dynamic from "next/dynamic";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFirebaseToken } from "@/utils";

const QuillEditor = dynamic(() => import("@/components/TestEditor"), {
  ssr: false,
});

interface User {
  name: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  posts?: Post[];
}

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  likes: number;
  tags: [string];
  color: string;
}

export default function CreatePost() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState("#ffffff");
  const [allTags, setAllTags] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [postColor, setPostColor] = useState("#ffffff");

    const [textColor, setTextColor] = useState("#000000");

  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setFirebaseUser(user);
        fetchUserData(user.email);
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (email: string) => {
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`/api/user?email=${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Bearer ${ token }`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load user data");
      setUserData(data.user);
      setFormData(data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadCoverImage = async (file: File) => {
    setIsUploading(true);
    try {
      const token = await getFirebaseToken();
      const signRes = await fetch("/api/signPostCovers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
         },
        body: JSON.stringify({ folder: "postCovers" }),
      });

      const { timestamp, signature, apiKey, folder } = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await uploadRes.json();
      if (data.secure_url) {
        setCoverImage(data.secure_url);
      } else {
        throw new Error("Invalid Cloudinary response");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const validateAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height;
        URL.revokeObjectURL(img.src);
        resolve(Math.abs(ratio - 16 / 9) <= 0.2);
      };
      img.onerror = () => resolve(false);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValid = await validateAspectRatio(file);
    if (!isValid) {
      alert(
        "Please upload an image with a 16:9 aspect ratio for best results."
      );
    }

    await uploadCoverImage(file);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please provide both a title and content for your post.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getFirebaseToken();
      const res = await fetch("/api/createPost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
         },
        body: JSON.stringify({
          title,
          content,
          picture: coverImage,
          email: firebaseUser?.email,
          tags: tags,
          color: color,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");

      alert("Post created successfully!");
      router.push("/account");
    } catch (err) {
      console.error(err);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  function getTextColor(bgColor: string): string {
  if (!bgColor) return "#000000";
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 150 ? "#000000" : "#ffffff";
  }
  
  useEffect(() => {
    if (allTags) {
      const extractedTags = allTags
        .split(" ")
        .map((tag) => tag.replace("#", "").trim())
        .filter((tag) => tag.length > 0);

      setTags(extractedTags);
    } else {
      setTags([]);
    }
  }, [allTags]);

  return (
    <>
      <Header />
      <main className="relative max-w-4xl mx-auto px-4 py-10 min-h-[85vh]">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-1">
            Create a Post
          </h2>
        </div>

        <div style={{ backgroundColor: postColor, color: textColor }} className={`shadow-sm rounded-lg p-4 md:p-8 border border-gray-100 space-y-6`}>
          <div>
            <label className="block text-sm font-medium  mb-1">
              Post Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your post title"
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-[#bd9864ff] focus:border-[#bd9864ff] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-1">
              Cover Image (16:9)
            </label>

            {coverImage ? (
              <div className="relative w-full h-56 rounded-md overflow-hidden mb-3">
                <Image
                  src={coverImage}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setCoverImage(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 text-xs rounded-md hover:bg-black/70"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#bd9864ff] transition-all"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 border-2 border-gray-400 border-t-[#bd9864ff] rounded-full animate-spin mb-2"></div>
                    <p className="text-gray-500 text-sm">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke={textColor}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01.88-7.906A5.001 5.001 0 0117 9a4 4 0 010 8H7z"
                      />
                    </svg>
                    <p className="text-sm">
                      Click to upload cover image
                    </p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-1">
              Content
            </label>
            <div className="bg-white rounded-xl p-2 shadow-sm">
              <QuillEditor
                key="new-post"
                value={content}
                onChange={(html) => setContent(html)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-1">
              Tags
            </label>
            <input
              type="text"
              value={allTags}
              onChange={(e) => {
                setAllTags(e.target.value);
                console.log(allTags);
              }}
              placeholder="Start with #"
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-[#bd9864ff] focus:border-[#bd9864ff] focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium  mb-1">
              Color representing your mood the best
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setPostColor(e.target.value);
                setTextColor(getTextColor(e.target.value));
                console.log(color);
              }}
              className="border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-[#bd9864ff] focus:border-[#bd9864ff] focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#bd9864ff] text-white font-medium py-2 rounded-md hover:bg-[#9a6f0bff] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </main>
      <Navigation />
      <Footer />
    </>
  );
}
