"use client";

import "./page.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const router = useRouter();
  const year = new Date().getFullYear();

  return (
    <footer
      id="app-footer"
      className="bg-[#f7f7f7] px-6 py-10 pt-10 onest-normal border-t border-gray-200"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <Link href="/" className="focus:outline-none">
            <span className="custom-class text-[32px] font-semibold tracking-wide">
              Kavyalok
            </span>
          </Link>
          <p className="text-sm text-gray-500 mt-3 pr-6">
            A creative home for writers, poets, and storytellers to express
            freely and connect with a growing community of readers.
          </p>
        </div>

        {/* About */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Platform</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li
              className="hover:cursor-pointer hover:text-gray-800 transition"
              onClick={() => router.push("/about")}
            >
              About Us
            </li>
            <li
              className="hover:cursor-pointer hover:text-gray-800 transition"
              onClick={() => router.push("/team")}
            >
              Our Team
            </li>
            <li
              className="hover:cursor-pointer hover:text-gray-800 transition"
              onClick={() => router.push("/careers")}
            >
              Careers
            </li>
            <li
              className="hover:cursor-pointer hover:text-gray-800 transition"
              onClick={() => router.push("/contact")}
            >
              Contact Us
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li
              className="hover:cursor-pointer hover:text-gray-800 transition"
              onClick={() => router.push("/privacy-policy")}
            >
              Privacy Policy
            </li>
            <li
              className="hover:cursor-pointer hover:text-gray-800 transition"
              onClick={() => router.push("/terms-and-conditions")}
            >
              Terms & Conditions
            </li>
            <li
              className="hover:cursor-pointer hover:text-gray-800 transition"
              onClick={() => router.push("/refund-policy")}
            >
              Refund & Cancellation
            </li>
            <li
              className="hover:cursor-pointer hover:text-gray-800 transition"
              onClick={() => router.push("/shipping-policy")}
            >
              Shipping
            </li>
          </ul>
        </div>

        {/* Connect */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Connect</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <a
                href="mailto:support@kavyalok.in"
                className="hover:text-gray-800 transition"
              >
                support@kavyalok.in
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/company/kavyalok-in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-gray-800 transition"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/kavyalok.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-gray-800 transition"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="text-center text-sm md:text-base mt-10 pt-5 border-t border-gray-300 text-gray-600">
        © {year} Kavyalok. All rights reserved.
      </div>
    </footer>
  );
}
