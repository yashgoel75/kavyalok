"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";
import { useState, useEffect } from "react";
import Image from "next/image";
import instagram from "@/assets/Instagram.png";
import linkedin from "@/assets/LinkedIn.png";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Contact() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  const [user, setUser] = useState<User | null>(null);

  const [displayName, setDisplayName] = useState("");

  const [isNameEmpty, setIsNameEmpty] = useState(false);
  const [isEmailEmpty, setIsEmailEmpty] = useState(false);
  const [isSubjectEmpty, setIsSubjectEmpty] = useState(false);
  const [isBodyEmpty, setIsBodyEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    body: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);

    if (name === "name") setIsNameEmpty(false);
    if (name === "email") setIsEmailEmpty(false);
    if (name === "subject") setIsSubjectEmpty(false);
    if (name === "body") setIsBodyEmpty(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nameEmpty = formData.name.trim() === "";
    const emailEmpty = formData.email.trim() === "";
    const subjectEmpty = formData.subject.trim() === "";
    const bodyEmpty = formData.body.trim() === "";

    setIsNameEmpty(nameEmpty);
    setIsEmailEmpty(emailEmpty);
    setIsSubjectEmpty(subjectEmpty);
    setIsBodyEmpty(bodyEmpty);

    if (nameEmpty || emailEmpty || subjectEmpty || bodyEmpty) return;

    try {
      setLoading(true);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Something went wrong");

      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", body: "" });
    } catch (error) {
      alert("Failed to send your message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="w-full min-h-screen bg-gray-50 flex items-center py-10 md:py-20 px-4">
        <div className="max-w-5xl w-full mx-auto grid md:grid-cols-2 gap-12">
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Talk to our team
            </h2>
            <p className="md:text-lg text-gray-500">
              Having an issue, feedback, or want to reach out? Fill the form and
              our team will get back to you shortly.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-4 md:p-8">
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="md:text-lg font-medium text-gray-700 mb-1 block">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3"
                />
                {isNameEmpty && (
                  <p className="text-sm text-[#8C1A10] mt-2">
                    Please enter your name
                  </p>
                )}
              </div>

              <div>
                <label className="md:text-lg font-medium text-gray-700 mb-1 block">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3"
                />
                {isEmailEmpty && (
                  <p className="text-sm text-[#8C1A10] mt-2">
                    Please enter your email
                  </p>
                )}
              </div>

              <div>
                <label className="md:text-lg font-medium text-gray-700 mb-1 block">
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Subject"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3"
                />
                {isSubjectEmpty && (
                  <p className="text-sm text-[#8C1A10] mt-2">
                    Please enter the subject
                  </p>
                )}
              </div>

              <div>
                <label className="md:text-lg font-medium text-gray-700 mb-1 block">
                  Message
                </label>
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={4}
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="Your message..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 resize-none"
                />
                {isBodyEmpty && (
                  <p className="text-sm text-[#8C1A10] mt-2">
                    Please enter the message
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                  loading || success
                    ? "bg-yellow-600 opacity-50 cursor-not-allowed"
                    : "bg-yellow-600 hover:bg-yellow-700 active:scale-95 cursor-pointer"
                }`}
              >
                {loading ? "Sending..." : success ? "Message Sent" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </main>
     
      <Navigation />
      <Footer />
    </>
  );
}
