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
  organization: string;
  participantLimit: number;
  mode: string;
  venue: string;
  dateStart: string;
  dateEnd: string;
  timeStart: string;
  timeEnd: string;
  registrationDeadline: Date;
  category: string;
  fee: number;
  judgingCriteria: string[];
  prizePool: string[];
  participants: string[];
  customQuestions: {
    _id: string;
    question: string;
    type: "text" | "number" | "mcq";
    options?: string[];
    required?: boolean;
  }[];
}

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = typeof params.id === "string" ? params.id : "";
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const [user, setUser] = useState<User | null>(null);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [patched, setPatched] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const requiredAnswered =
    competition?.customQuestions
      ?.filter((q) => q.required)
      .every((q) => {
        const v = answers[q._id];
        return v !== undefined && v !== null && v !== "";
      }) ?? true;

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

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
        if (comp.participants.length == comp.participantLimit) {
          setIsLimitFull(true);
        }
      } catch (err) {
        console.error("Failed to fetch competition:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompetition();
  }, [competitionId]);

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

  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  function TimerPill({ registrationDeadline }: { registrationDeadline: Date }) {
    const deadline = new Date(registrationDeadline).getTime();
    setIsDeadlinePassed(new Date(registrationDeadline).getTime() <= Date.now());
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
  const [isLimitFull, setIsLimitFull] = useState(false);

  const handleApply = async () => {
    if (!requiredAnswered) return;
    if (!firebaseUser) {
      router.push("/auth/login");
      return;
    }
    if (participants.length == participantLimit) {
      return;
    }

    setSubmitting(true);

    try {
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const res = await fetch(`/api/competitions/${competitionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: firebaseUser.email,
          responses,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Failed to apply");
        return;
      }

      alert("Application submitted successfully!");
      setIsNowRegistered(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayNow = async () => {
    if (!requiredAnswered) return;
    if (!competition) return;
    if (!firebaseUser) {
      router.push("/auth/login");
      return;
    }
    if (participants.length == participantLimit) {
      return;
    }

    try {
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      const token = await getFirebaseToken();
      const paymentData = {
        amount: competition.fee.toFixed(2),
        firstname: firebaseUser.displayName || firebaseUser.email,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || "",
        productinfo: competition._id,
        responses: responses,
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
    venue,
    organization,
    dateStart,
    dateEnd,
    timeStart,
    timeEnd,
    registrationDeadline,
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
          <h1 className="text-4xl font-bold">{name}</h1>
          <TimerPill registrationDeadline={registrationDeadline} />
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
              <p
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: about }}
              ></p>
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

            {competition.customQuestions?.length > 0 && !isRegistered && (
              <section className="mt-8 space-y-5">
                <h2 className="text-2xl font-semibold">
                  Application Questions
                </h2>

                {competition.customQuestions.map((q) => (
                  <div key={q._id} className="space-y-2">
                    <label className="block font-medium">
                      {q.question}
                      {q.required && <span className="text-red-500"> *</span>}
                    </label>

                    {q.type === "text" && (
                      <textarea
                        className="w-full border rounded-md p-2"
                        rows={3}
                        onChange={(e) =>
                          handleAnswerChange(q._id, e.target.value)
                        }
                      />
                    )}

                    {q.type === "number" && (
                      <input
                        type="number"
                        className="w-full border rounded-md p-2"
                        onChange={(e) =>
                          handleAnswerChange(q._id, Number(e.target.value))
                        }
                      />
                    )}

                    {q.type === "mcq" && (
                      <select
                        className="w-full border rounded-md p-2"
                        defaultValue=""
                        onChange={(e) =>
                          handleAnswerChange(q._id, e.target.value)
                        }
                      >
                        <option value="" disabled>
                          Select an option
                        </option>
                        {q.options?.map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </section>
            )}

            <div className="mt-6">
              {isRegistered ||
              isNowRegistered ||
              isLimitFull ||
              isDeadlinePassed ? (
                <button
                  disabled
                  className="px-6 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed"
                >
                  {isLimitFull
                    ? "Registrations Full"
                    : isDeadlinePassed
                      ? "Registration Closed"
                      : "Already Registered"}
                </button>
              ) : fee !== 0 ? (
                <button
                  onClick={handlePayNow}
                  disabled={!requiredAnswered}
                  className={`px-6 py-2 ${
                    requiredAnswered
                      ? "bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed"
                  } text-white rounded-md transition`}
                >
                  Pay Now
                </button>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={!requiredAnswered}
                  className={`px-6 py-2 ${
                    requiredAnswered
                      ? "bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed"
                  } text-white rounded-md transition`}
                >
                  Register Now
                </button>
              )}
            </div>
          </div>
          <aside className="space-y-4 p-5 max-h-screen border rounded-lg bg-gray-50 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Event Details</h3>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Organization:</strong> {organization}
              </p>
              <p>
                <strong>Mode:</strong> {mode}
              </p>
              <p>
                <strong>Venue:</strong> {venue}
              </p>
              <p>
                <strong>Registration Deadline:</strong>{" "}
                {new Date(registrationDeadline).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(dateStart).toLocaleDateString()} {dateEnd ? "–" : ""}{" "}
                {dateEnd ? new Date(dateEnd).toLocaleDateString() : ""}
              </p>
              <p>
                <strong>Time:</strong> {timeStart}{" "}
                {timeEnd ? "- " + timeEnd : ""}
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
              <p>
                <strong>Registrations: </strong>
                {participants.length} registered
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
