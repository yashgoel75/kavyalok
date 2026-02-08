"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";
import Link from "next/link";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Event {
  _id: string;
  organization: string;
  name: string;
  coverPhoto: string;
  about: string;
  dateStart: string;
  dateEnd: string;
  isSuperEvent?: boolean;
  competitions?: string[];
}

export default function Events() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [superEvents, setSuperEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) {
        getEvents(user.email);
        getSuperEvents(user.email);
        return;
      } else {
        const timer = setTimeout(() => {
          router.replace("/auth/login");
        }, 1500);
      }
    });
    return () => unsubscribe();
  }, []);

  async function getEvents(owner: string) {
    try {
      const data = await axios.get(
        `/api/competitions/byOwner?owner=${encodeURIComponent(owner)}`,
      );

      console.log(data.data.data);
      setEvents(data.data.data || []);
    } catch (error: unknown) {
      console.log("No Events Found");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function getSuperEvents(owner: string) {
    try {
      const data = await axios.get(
        `/api/supercompetitions/byOwner?owner=${encodeURIComponent(owner)}`,
      );

      console.log(data.data.data);
      setSuperEvents(data.data.data || []);
    } catch (error: unknown) {
      console.log("No Super Events Found");
      setSuperEvents([]);
    }
  }

  const allEvents = [...superEvents, ...events].sort((a, b) => {
    return new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime();
  });

  console.log(allEvents);
  
  if (loading) return <p className="text-center mt-12">Loading events...</p>;
  if (allEvents.length === 0)
    return <p className="text-center mt-12">No events available.</p>;

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-12 min-h-[85vh]">
        <div className="mb-6 md:mb-12">
          <h1 className="text-3xl font-semibold mb-2">Your Hosted Events</h1>
          <p className="text-lg text-gray-600">
            Manage and track your literary competitions.
          </p>
        </div>

        <section>
          <div className="text-xl font-bold my-2">All Events</div>

          <div className="space-y-6">
            {allEvents.map((event) => (
              <div
                key={event._id}
                className="rounded-md space-y-3 p-4 w-full border border-gray-200 gap-6"
              >
                {event.coverPhoto && (
                  <img
                    src={event.coverPhoto}
                    alt={event.name}
                    className="rounded-md shadow-md"
                  />
                )}

                <div className="flex flex-col justify-between w-full">
                  <div>
                    {event.isSuperEvent && (
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-2">
                        Super Competition
                      </span>
                    )}
                    <h2 className="text-xl md:text-2xl font-semibold">
                      {event.name}
                    </h2>

                    <p
                      className="text-gray-600 mt-2 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html:
                          event.about?.slice(0, 120) +
                          (event.about?.length > 120 ? "..." : ""),
                      }}
                    ></p>

                    <div className="mt-4 text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Organization:</strong> {event.organization}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(event.dateStart).toLocaleDateString()} –{" "}
                        {new Date(event.dateEnd).toLocaleDateString()}
                      </p>
                      {event.isSuperEvent && event.competitions && (
                        <p>
                          <strong>Sub-Events:</strong> {event.competitions.length}
                        </p>
                      )}
                    </div>
                  </div>

                  <button className="mt-6 px-6 w-fit py-2 bg-gradient-to-tr from-yellow-400 to-yellow-800 text-white rounded-md font-medium border border-gray-300 transition cursor-pointer">
                    <Link href={`/account/events/${event.isSuperEvent ? 'super' : 'regular'}/${event._id}`}>
                      View Details
                    </Link>
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