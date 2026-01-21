"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";
import Link from "next/link";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Competition {
  _id: string;
  coverPhoto: string;
  name: string;
  about: string;
  participantLimit: number;
  mode: string;
  dateStart: string;
  dateEnd: string;
  timeStart: string;
  timeEnd: string;
  category: string;
  fee: number;
  judgingCriteria: string[];
  prizePool: string[];
}

export default function CompetitionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) {
        return;
      } else {
        const timer = setTimeout(() => {
          router.replace("/auth/login");
        }, 1500);
      }
    });
    return () => unsubscribe();
  }, []);

  // Timer component for each competition
  function TimerPill({ dateStart }: { dateStart: string }) {
    const deadline = new Date(dateStart).getTime();
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
      function updateTimer() {
        const now = Date.now();
        const diff = deadline - now;

        if (diff <= 0) {
          setTimeLeft("Registration Closed");
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);

        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      }

      updateTimer();
      const timer = setInterval(updateTimer, 1000 * 30);
      return () => clearInterval(timer);
    }, [deadline]);

    return (
      <div className="inline-block px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-gray-100 inter-normal">
        {timeLeft}
      </div>
    );
  }

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const res = await fetch("/api/competitions");
        const data = await res.json();
        if (data.success) {
          setCompetitions(data.data);
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error("Failed to fetch competitions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompetitions();
  }, []);

  if (loading)
    return <p className="text-center mt-12">Loading competitions...</p>;
  if (competitions.length === 0)
    return <p className="text-center mt-12">No competitions available.</p>;

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12 min-h-[85vh]">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold mb-2">
            Embrace the Challenge ✍️
          </h1>
          <p className="text-lg text-gray-600">
            Seize every literary chance to write, compete, and shine.
          </p>
        </div>

        <section>
          <div className="text-xl font-bold my-2">Upcoming Events</div>

          <div className="space-y-6">
            {[...competitions].reverse().map((comp) => (
              <div
                key={comp._id}
                className="rounded-md space-y-3 p-4 w-full border border-gray-200 gap-6"
              >
                {comp.coverPhoto && (
                  <img
                    src={comp.coverPhoto}
                    alt={comp.name}
                    className="rounded-md shadow-md"
                  />
                )}

                <div className="flex flex-col justify-between w-full">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl md:text-2xl font-semibold">
                        {comp.name}
                      </h2>
                      <TimerPill dateStart={comp.dateStart} />
                    </div>

                    <p
                      className="text-gray-600 mt-2 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html:
                          comp.about?.slice(0, 120) +
                          (comp.about?.length > 120 ? "..." : ""),
                      }}
                    ></p>

                    <div className="mt-4 text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Participants Limit:</strong>{" "}
                        {comp.participantLimit}
                      </p>
                      <p>
                        <strong>Mode:</strong> {comp.mode}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(comp.dateStart).toLocaleDateString()} –{" "}
                        {new Date(comp.dateEnd).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Time:</strong> {comp.timeStart} – {comp.timeEnd}
                      </p>
                      <p>
                        <strong>Category:</strong> {comp.category}
                      </p>
                      <p>
                        <strong>Fee:</strong>{" "}
                        {comp.fee ? `₹${comp.fee}` : "Free"}
                      </p>
                    </div>
                  </div>

                  <button className="mt-6 px-6 w-fit py-2 bg-gradient-to-tr from-yellow-400 to-yellow-800 text-white rounded-md font-medium border border-gray-300 transition cursor-pointer">
                    <Link href={`/competitions/${comp._id}`}>Register Now</Link>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Navigation />
      <Footer />
    </>
  );
}
