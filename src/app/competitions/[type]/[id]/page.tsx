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
import axios from "axios";
import Link from "next/link";

interface Competition {
  _id: string;
  coverPhoto: string;
  owner?: string;
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
  competitions?: string[];
}

const Icon = {
  Calendar: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Clock: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  MapPin: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Users: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Tag: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  Rupee: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13c0 0 5 0 5-5s-5-5-5-5" />
    </svg>
  ),
  Building: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="1" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Monitor: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Timer: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const isSuperEvent = type === "super";
  const competitionId = typeof params.id === "string" ? params.id : "";
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const [user, setUser] = useState<User | null>(null);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [subEvents, setSubEvents] = useState<Competition[]>([]);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [isNowRegistered, setIsNowRegistered] = useState(false);
  const [isLimitFull, setIsLimitFull] = useState(false);

  const requiredAnswered =
    competition?.customQuestions
      ?.filter((q) => q.required)
      .every((q) => {
        const v = answers[q._id];
        return v !== undefined && v !== null && v !== "";
      }) ?? true;

  const markUserAsRegistered = (email: string) => {
    setCompetition((prev) => {
      if (!prev || prev.participants.includes(email)) {
        return prev;
      }

      return {
        ...prev,
        participants: [...prev.participants, email],
      };
    });
    setIsNowRegistered(true);
  };

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
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
      if (firebaseUser?.email) {
        markUserAsRegistered(firebaseUser.email);
      } else {
        setIsNowRegistered(true);
      }
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [firebaseUser?.email, paymentStatus]);

  useEffect(() => {
    async function fetchCompetition() {
      if (!competitionId) { setLoading(false); return; }
      try {
        if (isSuperEvent) {
          const res = await fetch(`/api/supercompetitions/${competitionId}`, { cache: "no-store" });
          const data = await res.json();
          const comp = data?.data as Competition | undefined;
          setCompetition(comp || null);
          const token = await getFirebaseToken();
          if (comp?.competitions && comp.competitions.length > 0) {
            const subEventsPromises = comp.competitions.map((compId: string) =>
              axios.get(`/api/competitions/${compId}`, { headers: { Authorization: `Bearer ${token}` } })
            );
            const subEventsResults = await Promise.all(subEventsPromises);
            setSubEvents(subEventsResults.map((r) => r.data.data));
          }
          if (comp?.participants?.length === comp?.participantLimit && comp?.participantLimit !== undefined) {
            setIsLimitFull(true);
          }
        } else {
          const res = await fetch(`/api/competitions/${competitionId}`, { cache: "no-store" });
          const data = await res.json();
          const comp = data?.data as Competition | undefined;
          setCompetition(comp || null);
          if (comp?.participants?.length === comp?.participantLimit && comp?.participantLimit !== undefined) {
            setIsLimitFull(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch competition:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompetition();
  }, [competitionId, isSuperEvent]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user?.email) {
        const timer = setTimeout(() => { router.replace("/auth/login"); }, 1500);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, [router]);

  function TimerPill({ registrationDeadline }: { registrationDeadline: Date }) {
    const deadline = new Date(registrationDeadline).getTime();
    setIsDeadlinePassed(new Date(registrationDeadline).getTime() <= Date.now());
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
      const update = () => {
        const now = Date.now();
        const diff = deadline - now;
        if (diff <= 0) { setTimeLeft("Closed"); return; }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m`);
      };
      update();
      const x = setInterval(update, 30000);
      return () => clearInterval(x);
    }, [deadline]);

    const closed = timeLeft === "Closed";
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "5px 12px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          background: closed ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.12)",
          border: `1px solid ${closed ? "rgba(239,68,68,0.3)" : "rgba(234,179,8,0.35)"}`,
          color: closed ? "#ef4444" : "#ca8a04",
        }}
      >
        <Icon.Timer />
        {closed ? "Registration Closed" : `Closes in ${timeLeft}`}
      </span>
    );
  }

  const handleApply = async () => {
    if (!requiredAnswered) return;
    if (!firebaseUser) { router.push("/auth/login"); return; }
    if (participants.length === participantLimit) return;
    setSubmitting(true);
    try {
      const responses = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const res = await fetch(`/api/competitions/${competitionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: firebaseUser.email, responses }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error || "Failed to apply"); return; }
      alert("Application submitted successfully!");
      if (firebaseUser.email) {
        markUserAsRegistered(firebaseUser.email);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayNow = async () => {
    if (!requiredAnswered || !competition || !firebaseUser) {
      if (!firebaseUser) router.push("/auth/login");
      return;
    }
    if (participants.length === participantLimit) return;
    try {
      const responses = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const token = await getFirebaseToken();
      const paymentData = {
        amount: competition.fee.toFixed(2),
        firstname: firebaseUser.displayName || firebaseUser.email,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || "",
        productinfo: competition._id,
        responses,
        type,
      };
      const res = await fetch("/api/payu/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(paymentData),
      });
      const data = await res.json();
      if (!data.fields) { alert("Failed to get payment fields from API"); return; }
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

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "#9ca3af", fontSize: 14 }}>Loading event…</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!competition) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: "#6b7280" }}>Competition not found.</p>
    </div>
  );

  const { coverPhoto, name, about, participantLimit, mode, venue, organization, dateStart, dateEnd,
    timeStart, timeEnd, registrationDeadline, category, fee, judgingCriteria, prizePool, participants } = competition;

  const isRegistered = Boolean(
    firebaseUser?.email && participants?.includes(firebaseUser.email),
  );
  const hasRegistered = isRegistered || isNowRegistered;
  const fillPct = participantLimit > 0 ? Math.min((participants.length / participantLimit) * 100, 100) : 0;

  const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: 14, color: "#1f2937", margin: 0, fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  );

  const SidebarCard = () => (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      position: "sticky",
      top: 24,
    }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>Capacity</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: fillPct >= 90 ? "#ef4444" : "#374151", fontFamily: "'DM Mono', monospace" }}>
            {participants.length} / {participantLimit}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${fillPct}%`,
            borderRadius: 999,
            background: fillPct >= 90 ? "linear-gradient(90deg,#f97316,#ef4444)" : "linear-gradient(90deg,#f59e0b,#eab308)",
            transition: "width 0.6s ease",
          }} />
        </div>
      </div>

      <div style={{ padding: "6px 20px 20px" }}>
        <DetailRow icon={<Icon.Building />} label="Organization" value={organization} />
        {!isSuperEvent && <DetailRow icon={<Icon.Monitor />} label="Mode" value={mode} />}
        {!isSuperEvent && venue && <DetailRow icon={<Icon.MapPin />} label="Venue" value={venue} />}
        <DetailRow icon={<Icon.Tag />} label="Category" value={category} />
        <DetailRow
          icon={<Icon.Calendar />}
          label="Event Date"
          value={`${new Date(dateStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}${dateEnd ? ` – ${new Date(dateEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}`}
        />
        {timeStart && (
          <DetailRow icon={<Icon.Clock />} label="Time" value={`${timeStart}${timeEnd ? ` – ${timeEnd}` : ""}`} />
        )}
        <DetailRow
          icon={<Icon.Clock />}
          label="Reg. Deadline"
          value={new Date(registrationDeadline).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        />
        {!isSuperEvent && (
          <DetailRow icon={<Icon.Rupee />} label="Entry Fee" value={fee === 0 ? "Free" : `₹${fee}`} />
        )}
      </div>

      {!isSuperEvent && (
        <div style={{ padding: "0 20px 20px" }}>
          <RegisterButton />
        </div>
      )}
    </div>
  );

  const RegisterButton = () => {
    const disabled = hasRegistered || isLimitFull || isDeadlinePassed;
    const label = isLimitFull ? "Registrations Full" : isDeadlinePassed ? "Registration Closed" : hasRegistered ? "Already Registered" : fee !== 0 ? "Pay & Register" : "Register Now";
    const action = fee !== 0 ? handlePayNow : handleApply;

    return (
      <button
        onClick={disabled ? undefined : action}
        disabled={disabled || !requiredAnswered || submitting}
        style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 10,
          border: "none",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.03em",
          cursor: disabled || !requiredAnswered ? "not-allowed" : "pointer",
          background: disabled || !requiredAnswered
            ? "#e5e7eb"
            : "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
          color: disabled || !requiredAnswered ? "#9ca3af" : "#fff",
          boxShadow: disabled || !requiredAnswered ? "none" : "0 4px 14px rgba(245,158,11,0.35)",
          transition: "all 0.2s ease",
        }}
      >
        {submitting ? "Submitting…" : label}
      </button>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap');
        * { box-sizing: border-box; }
        .comp-body { color: #111827; }
        .comp-body textarea, .comp-body input, .comp-body select {
          width: 100%;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          color: #111827;
          outline: none;
          transition: border-color 0.15s;
          background: #fafafa;
        }
        .comp-body textarea:focus, .comp-body input:focus, .comp-body select:focus {
          border-color: #f59e0b;
          background: #fff;
        }
        .subevent-card:hover { border-color: #fbbf24 !important; box-shadow: 0 4px 20px rgba(245,158,11,0.1) !important; }
        .toast-enter { animation: toastIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes toastIn { from { opacity:0; transform: translateY(-12px) scale(0.96); } to { opacity:1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .comp-grid { grid-template-columns: 1fr !important; }
          .comp-sidebar-desktop { display: none !important; }
          .comp-sidebar-mobile { display: block !important; }
          .comp-mobile-cta { display: block !important; }
        }
        @media (min-width: 769px) {
          .comp-sidebar-mobile { display: none !important; }
          .comp-mobile-cta { display: none !important; }
        }
      `}</style>

      <Header />

      {showSuccess && (
        <div className="toast-enter" style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: "linear-gradient(135deg,#10b981,#059669)",
          color: "#fff", padding: "14px 20px", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(16,185,129,0.3)",
          fontSize: 14, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Icon.Check /> Payment Successful · You're registered!
        </div>
      )}

      <main className="comp-body" style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 20px 80px" }}>

        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18, fontSize: 13, color: "#9ca3af" }}>
            <span>Competitions</span>
            <span>›</span>
            <span style={{ color: "#6b7280" }}>{isSuperEvent ? "Super Event" : category}</span>
            <span>›</span>
            <span style={{ color: "#374151", fontWeight: 500 }}>{name}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              {isSuperEvent && (
                <span style={{
                  display: "inline-block", marginBottom: 10, padding: "3px 10px",
                  background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#fff",
                  borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  Super Event
                </span>
              )}
              <h1 style={{
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#0f172a",
                margin: 0,
                lineHeight: 1.2,
              }}>
                {name}
              </h1>
            </div>
            <TimerPill registrationDeadline={registrationDeadline} />
          </div>

          <p style={{ fontSize: 14, color: "#6b7280", margin: 0, fontWeight: 500 }}>
            by <span style={{ color: "#374151" }}>{organization}</span>
          </p>
        </div>

        {coverPhoto && (
          <div style={{ marginBottom: 36, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.1)" }}>
            <img src={coverPhoto} alt={name} style={{ width: "100%", height: "auto", display: "block", maxHeight: 420, objectFit: "cover" }} />
          </div>
        )}

        <div className="comp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40, alignItems: "start" }}>

          <div>
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", marginBottom: 16, letterSpacing: "-0.01em" }}>
                About the Competition
              </h2>
              <div
                style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, letterSpacing: "0.01em" }}
                dangerouslySetInnerHTML={{ __html: about }}
              />
            </section>

            {judgingCriteria?.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", marginBottom: 16, letterSpacing: "-0.01em" }}>
                  Judging Criteria
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {judgingCriteria.map((crit, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "12px 16px",
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 10,
                      fontSize: 14,
                      color: "#374151",
                    }}>
                      <span style={{
                        flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                        background: "linear-gradient(135deg,#f59e0b,#f97316)",
                        color: "#fff", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 11, fontWeight: 700, marginTop: 1,
                      }}>{i + 1}</span>
                      {crit}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="comp-sidebar-mobile" style={{ marginBottom: 40 }}>
              <SidebarCard />
            </div>

            {isSuperEvent && subEvents.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", marginBottom: 20, letterSpacing: "-0.01em" }}>
                  Sub-Events <span style={{ fontSize: 16, fontWeight: 500, color: "#9ca3af" }}>({subEvents.length})</span>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {subEvents.map((subEvent, index) => (
                    <div key={subEvent._id} className="subevent-card" style={{
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "#fff",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}>
                      {subEvent.coverPhoto && (
                        <img src={subEvent.coverPhoto} alt={subEvent.name} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                      )}
                      <div style={{ padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 999,
                            background: "#f3f4f6", color: "#6b7280",
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                          }}>#{index + 1}</span>
                          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: 0 }}>
                            {subEvent.name}
                          </h3>
                        </div>
                        <p
                          style={{ fontSize: 14, color: "#6b7280", marginBottom: 14, lineHeight: 1.6 }}
                          dangerouslySetInnerHTML={{ __html: subEvent.about?.slice(0, 150) + (subEvent.about?.length > 150 ? "…" : "") }}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 13, color: "#374151", marginBottom: 16 }}>
                          {subEvent.mode && <span><strong>Mode:</strong> {subEvent.mode}</span>}
                          {subEvent.venue && <span><strong>Venue:</strong> {subEvent.venue}</span>}
                          <span><strong>Date:</strong> {new Date(subEvent.dateStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          {subEvent.timeStart && <span><strong>Time:</strong> {subEvent.timeStart}</span>}
                          {subEvent.fee !== undefined && <span><strong>Fee:</strong> {subEvent.fee ? `₹${subEvent.fee}` : "Free"}</span>}
                          <span><strong>Registered:</strong> {subEvent.participants?.length || 0}</span>
                        </div>
                        <Link href={`/competitions/regular/${subEvent._id}`} style={{
                          display: "inline-block",
                          padding: "8px 16px",
                          background: "#0f172a",
                          color: "#fff",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                          letterSpacing: "0.02em",
                        }}>
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {competition.customQuestions?.length > 0 && !hasRegistered && (
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.01em" }}>
                  Application Questions
                </h2>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
                  Fields marked <span style={{ color: "#ef4444" }}>*</span> are required.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {competition.customQuestions.map((q, idx) => (
                    <div key={q._id}>
                      <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                        <span style={{ color: "#9ca3af", fontFamily: "'DM Mono', monospace", fontSize: 12, marginRight: 6 }}>{String(idx + 1).padStart(2, "0")}</span>
                        {q.question}
                        {q.required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
                      </label>
                      {q.type === "text" && (
                        <textarea rows={3} onChange={(e) => handleAnswerChange(q._id, e.target.value)} />
                      )}
                      {q.type === "number" && (
                        <input type="number" onChange={(e) => handleAnswerChange(q._id, Number(e.target.value))} />
                      )}
                      {q.type === "mcq" && (
                        <select defaultValue="" onChange={(e) => handleAnswerChange(q._id, e.target.value)}>
                          <option value="" disabled>Select an option</option>
                          {q.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!isSuperEvent && (
              <div className="comp-mobile-cta" style={{ marginTop: 8 }}>
                <RegisterButton />
              </div>
            )}
          </div>

          <aside className="comp-sidebar-desktop">
            <SidebarCard />
          </aside>
        </div>
      </main>

      <Navigation />
      <Footer />
    </>
  );
}
