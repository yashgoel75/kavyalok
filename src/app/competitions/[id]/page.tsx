"use client";

import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getFirebaseToken } from "@/utils";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
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
  participants: string[];
}

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = typeof params.id === "string" ? params.id : "";
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [patched, setPatched] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (paymentStatus === "success") {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);

  useEffect(() => {
    async function fetchCompetition() {
      try {
        const res = await fetch("/api/competitions");
        const data = await res.json();
        const comp = Array.isArray(data)
          ? data.find((c: Competition) => c._id === competitionId)
          : data?.data?.find((c: Competition) => c._id === competitionId);
        setCompetition(comp || null);
      } catch (err) {
        console.error("Failed to fetch competition:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompetition();
  }, [competitionId]);

  function TimerPill({ dateEnd }: { dateEnd: string }) {
    const deadline = new Date(dateEnd).getTime();
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
      const update = () => {
        const now = Date.now();
        const diff = deadline - now;
        if (diff <= 0) {
          setTimeLeft("Registration Closed");
          return;
        }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m`);
      };
      update();
      const x = setInterval(update, 30000);
      return () => clearInterval(x);
    }, [deadline]);

    return (
      <span className="px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300 text-sm">
        {timeLeft}
      </span>
    );
  }
  const [isNowRegistered, setIsNowRegistered] = useState(false);

  const handleRegisterNow = async () => {
    try {
      const res = await fetch(`/api/competitions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: competitionId,
          email: firebaseUser?.email,
        }),
      });
      const data = await res.json();
      console.log(data);
      if (data.success) {
        alert("Thank you for registering with Kavyalok!");
        setIsNowRegistered(true);
      }
    } catch (patchErr) {
      console.error("Failed to update participant:", patchErr);
    }
  };

  const handlePayNow = async () => {
    if (!competition) return;
    if (!firebaseUser) {
      router.push("/auth/login");
      return;
    }

    try {
      const token = await getFirebaseToken();
      const paymentData = {
        amount: competition.fee.toFixed(2),
        firstname: firebaseUser.displayName || firebaseUser.email,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || "",
        productinfo: competition._id,
      };

      const res = await fetch("/api/payu/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await res.json();
      if (!data.fields) {
        alert("Failed to get payment fields from API");
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.url;

      Object.entries(data.fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value ?? "");
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error(err);
      alert("Something went wrong during payment initiation.");
    }
  };

  if (loading)
    return <p className="text-center mt-12">Loading competition...</p>;
  if (!competition)
    return <p className="text-center mt-12">Competition not found.</p>;

  const {
    coverPhoto,
    name,
    about,
    participantLimit,
    mode,
    dateStart,
    dateEnd,
    timeStart,
    timeEnd,
    category,
    fee,
    judgingCriteria,
    prizePool,
    participants,
  } = competition;

  const isRegistered =
    firebaseUser?.email && participants?.includes(firebaseUser.email);

  return (
    <>
      <Header />
      {showSuccess && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-5 py-3 rounded-md shadow-lg animate-slide-in">
          Payment Successful 🎉 You are registered!
        </div>
      )}
      <main className="max-w-6xl mx-auto px-4 py-12 min-h-[80vh]">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-bold">{name} ✍️</h1>
          <TimerPill dateEnd={dateEnd} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-6">
            {coverPhoto !== "" ? (
              <img
                src={coverPhoto}
                alt={name}
                className="rounded-lg shadow-md w-full h-auto"
              />
            ) : null}
            <section>
              <h2 className="text-2xl font-semibold mb-3">
                About the Competition
              </h2>
              <p className="text-gray-700 leading-relaxed">{about}</p>
            </section>
            {judgingCriteria?.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-2">
                  What You Will Be Judged On
                </h2>
                <ul className="list-disc ml-6 text-gray-700 space-y-1">
                  {judgingCriteria.map((crit, i) => (
                    <li key={i}>{crit}</li>
                  ))}
                </ul>
              </section>
            )}
            Winner will get featured on KavyaRang's annual magazine and will get
            to participate in 3 MUNs with us.
            <div className="mt-6">
              {isRegistered || isNowRegistered ? (
                <button className="px-6 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed">
                  Already Registered
                </button>
              ) : fee !== 0 ? (
                <button
                  onClick={handlePayNow}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition cursor-pointer"
                >
                  Pay Now
                </button>
              ) : (
                <button
                  onClick={handleRegisterNow}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition cursor-pointer"
                >
                  Register Now
                </button>
              )}
            </div>
          </div>
          <aside className="space-y-4 p-5 border rounded-lg bg-gray-50 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Event Details</h3>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Mode:</strong> {mode}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(dateStart).toLocaleDateString()} –{" "}
                {new Date(dateEnd).toLocaleDateString()}
              </p>
              <p>
                <strong>Time:</strong> {timeStart} – {timeEnd}
              </p>
              <p>
                <strong>Participant Limit:</strong> {participantLimit}
              </p>
              <p>
                <strong>Category:</strong> {category}
              </p>
              <p>
                <strong>Registration Fee:</strong> ₹{fee}
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Navigation />
      <Footer />
    </>
  );
}
