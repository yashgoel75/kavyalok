"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";
import GradientText from "@/components/GradientText";
import {
  Briefcase,
  Clock,
  MapPin,
  Mail,
  Users,
  HeartHandshake,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronUp,
  Globe,
  Laptop,
  Award,
  Send,
  Compass,
  BellRing,
  CheckCircle2,
} from "lucide-react";

interface Role {
  id: string;
  title: string;
  category: "engineering" | "design" | "content" | "growth";
  location: string;
  type: string;
  status: "Coming Soon";
  description: string;
  tags: string[];
}

const UPCOMING_ROLES: Role[] = [
  {
    id: "eng-1",
    title: "Senior Full-Stack Engineer",
    category: "engineering",
    location: "Remote (India / Global)",
    type: "Full-time",
    status: "Coming Soon",
    description:
      "Build high-performance, real-time features for storytellers using Next.js, TypeScript, and modern web architecture.",
    tags: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
  },
  {
    id: "des-1",
    title: "Lead UI/UX Designer",
    category: "design",
    location: "Remote",
    type: "Full-time",
    status: "Coming Soon",
    description:
      "Craft distraction-free, elegant writing and reading experiences that inspire literary creativity.",
    tags: ["Figma", "Design Systems", "Prototyping", "User Research"],
  },
  {
    id: "cnt-1",
    title: "Editorial & Literature Lead",
    category: "content",
    location: "New Delhi / Remote",
    type: "Full-time",
    status: "Coming Soon",
    description:
      "Curate featured poetry and stories, lead writing competitions, and foster authentic literary talent.",
    tags: ["Hindi Literature", "Poetry", "Content Curation", "Editing"],
  },
  {
    id: "grw-1",
    title: "Community & Growth Manager",
    category: "growth",
    location: "Remote",
    type: "Full-time",
    status: "Coming Soon",
    description:
      "Empower our writer community, organize virtual workshops, and expand Kavyalok's presence across platforms.",
    tags: ["Community", "Social Media", "Events", "Creator Ops"],
  },
  {
    id: "eng-2",
    title: "AI & Natural Language Curator",
    category: "engineering",
    location: "Remote",
    type: "Full-time",
    status: "Coming Soon",
    description:
      "Integrate intelligent recommendations, plagiarism prevention, and generative prompts to support writers.",
    tags: ["Python", "NLP", "Machine Learning", "API Design"],
  },
  {
    id: "cnt-2",
    title: "Content & Storytelling Intern",
    category: "content",
    location: "Remote",
    type: "Internship",
    status: "Coming Soon",
    description:
      "Collaborate with writers, host weekly prompts, and review competition submissions.",
    tags: ["Writing", "Social Media", "Proofreading"],
  },
];

const CULTURE_VALUES = [
  {
    icon: BookOpen,
    title: "Writer-First Ethos",
    description:
      "Everything we design and build keeps creators at the center. We prioritize focus, expression, and respect for words.",
  },
  {
    icon: Globe,
    title: "Remote & Flexible",
    description:
      "Work from wherever you feel inspired. We value output, thoughtful execution, and clear communication over hours logged.",
  },
  {
    icon: HeartHandshake,
    title: "Creative Freedom",
    description:
      "We encourage bold ideas and experimentation. No micro-management or algorithm-driven clutter — just pure innovation.",
  },
  {
    icon: Zap,
    title: "High Impact & Autonomy",
    description:
      "As an early core team member, your code, designs, and decisions will directly impact thousands of writers daily.",
  },
];

const PERKS = [
  {
    icon: Laptop,
    title: "Modern Tech Setup",
    desc: "Top-tier hardware and software tools tailored to your workflow.",
  },
  {
    icon: BookOpen,
    title: "Learning & Reading Stipend",
    desc: "Annual allowance for books, courses, literature events, and conferences.",
  },
  {
    icon: Clock,
    title: "Flexible Time Off",
    desc: "Generous leave policy so you can rest, travel, and nurture your own creative projects.",
  },
  {
    icon: Award,
    title: "Growth & Equity",
    desc: "Be an integral early contributor with direct ownership in Kavyalok's vision.",
  },
];

const FAQS = [
  {
    question: "When will job applications officially open?",
    answer:
      "We are currently scaling our infrastructure and core platform. Positions are scheduled to open progressively throughout 2026.",
  },
  {
    question: "Can I submit a proactive resume or portfolio?",
    answer:
      "Yes! We love meeting passionate people early. If you're a developer, designer, writer, or community builder, send your resume or portfolio directly to support@kavyalok.in.",
  },
  {
    question: "Are positions remote or in-office?",
    answer:
      "Most of our positions are remote-first across India and beyond, with occasional team meetups and literary gatherings in New Delhi.",
  },
  {
    question: "Does Kavyalok offer internships?",
    answer:
      "Yes, we periodically open seasonal internships for content curation, community moderation, and software engineering. Keep an eye on our preview listings!",
  },
];

export default function CareersPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Career Waitlist Subscriber",
          email: email.trim(),
          subject: "Career Waitlist & Hiring Portal Notification",
          body: `Subscriber (${email.trim()}) requested to be notified when job openings launch on Kavyalok Careers.`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to subscribe");
      }

      setIsSubscribed(true);
    } catch (err) {
      setErrorMessage("Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRoles =
    selectedCategory === "all"
      ? UPCOMING_ROLES
      : UPCOMING_ROLES.filter((r) => r.category === selectedCategory);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white text-neutral-900 font-sans pb-24">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-16 px-5 max-w-5xl mx-auto text-center">
          {/* Main Title with Samarkan / Gradient Brand Accent */}
          <div className="mb-4">
            <GradientText
              colors={[
                "#9a6f0bff",
                "#bd9864ff",
                "#dbb56aff",
                "#7f7464ff",
                "#e9e99dff",
              ]}
              animationSpeed={5}
              showBorder={false}
              className="custom-class text-[42px] sm:text-[60px] md:text-[75px] leading-tight block mb-2"
            >
              Kavyalok
            </GradientText>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mt-2">
              Shape the Future of Storytelling
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed mt-4">
            We are building a serene, inspiring home for writers, poets, and readers across the globe. Our dedicated hiring portal is currently under construction.
          </p>

          {/* COMING SOON HERO BANNER WITH WORKING CONTACT WAITLIST API */}
          <div className="mt-10 max-w-2xl mx-auto bg-gradient-to-b from-neutral-50 to-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#9a6f0b] font-semibold text-xs uppercase tracking-wider mb-3">
              <Clock size={15} />
              <span>Hiring Portal Coming Soon</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
              Get Notified When Openings Launch
            </h2>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed max-w-lg mx-auto">
              Enter your email to join our early career waitlist. You'll receive a notification as soon as applications open.
            </p>

            {isSubscribed ? (
              <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium animate-fadeIn">
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                <span>You're on the list! A confirmation email has been sent to your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative mb-4">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#bd9864]/50 focus:border-[#bd9864] transition"
                  />
                  {errorMessage && (
                    <p className="text-xs text-red-500 mt-1 text-left absolute left-1 -bottom-5">
                      {errorMessage}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-[#9a6f0b] via-[#bd9864] to-[#dbb56a] text-white text-sm font-semibold rounded-xl hover:opacity-95 active:scale-98 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <BellRing size={16} />
                      <span>Notify Me</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-amber-700" /> Direct Confirmation Email
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-amber-700" /> Early Candidate Invites
              </span>
            </div>
          </div>
        </section>

        <hr className="max-w-5xl mx-auto border-neutral-200" />

        {/* UPCOMING ROLES SNEAK PEEK */}
        <section className="py-14 px-5 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#9a6f0b] uppercase mb-1">
                <Briefcase size={15} />
                <span>Sneak Peek</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                Upcoming Openings
              </h2>
              <p className="text-neutral-600 text-sm mt-1">
                Preview the roles we will be recruiting for in our next phase of growth.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Roles" },
                { id: "engineering", label: "Engineering" },
                { id: "design", label: "Design" },
                { id: "content", label: "Content & Editorial" },
                { id: "growth", label: "Community" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                    selectedCategory === tab.id
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                className="group relative bg-white border border-neutral-200 rounded-2xl p-6 hover:border-[#bd9864] hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-amber-50 text-[#9a6f0b] border border-amber-200 text-xs font-medium uppercase tracking-wide">
                      {role.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      {role.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 group-hover:text-[#9a6f0b] transition">
                    {role.title}
                  </h3>

                  <p className="text-sm text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-neutral-400" /> {role.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-neutral-400" /> {role.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {role.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[11px] rounded-md font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHY JOIN / CULTURE & VALUES */}
        <section className="py-14 px-5 bg-neutral-50/70 border-y border-neutral-200">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9a6f0b] uppercase tracking-wider mb-2">
                <Users size={15} />
                <span>Our Culture</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                Why Work With Kavyalok?
              </h2>
              <p className="text-neutral-600 text-sm mt-2">
                We believe exceptional products come from teams that care deeply about art, design, craftsmanship, and human connection.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CULTURE_VALUES.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs hover:shadow-sm transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#9a6f0b] mb-4">
                    <item.icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PERKS & BENEFITS */}
        <section className="py-14 px-5 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              Perks Designed for Peace & Performance
            </h2>
            <p className="text-neutral-600 text-sm mt-2">
              We take care of our team so you can focus on building meaningful experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERKS.map((perk, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition"
              >
                <perk.icon size={22} className="text-[#9a6f0b] mb-3" />
                <h3 className="font-semibold text-sm text-neutral-900 mb-1">
                  {perk.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="py-14 px-5 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              Frequently Asked Questions
            </h2>
            <p className="text-neutral-600 text-sm mt-2">
              Everything you need to know about joining Kavyalok.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="border border-neutral-200 rounded-xl overflow-hidden bg-white transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-neutral-900 hover:bg-neutral-50 transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-neutral-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-neutral-500 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 pt-0 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 bg-neutral-50/40 animate-fadeIn">
                      <p className="mt-3">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SPONTANEOUS APPLICATION / CONTACT CARD */}
        <section className="mt-6 px-5 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-[#4a3910] text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-medium mb-4 backdrop-blur-xs">
                <Send size={13} />
                <span>Open Communication</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Don't See Your Ideal Role?
              </h2>
              
              <p className="text-neutral-300 text-sm leading-relaxed mb-8">
                We are always eager to talk to exceptionally talented software engineers, designers, literature enthusiasts, and community builders. Drop us your resume or portfolio.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@kavyalok.in?subject=Proactive%20Application%20-%20Kavyalok"
                  className="px-6 py-3 bg-[#bd9864] hover:bg-[#9a6f0b] text-white text-sm font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Mail size={16} />
                  <span>Send Proactive Application</span>
                </a>
                
                <Link
                  href="/about"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-semibold rounded-xl transition backdrop-blur-xs flex items-center justify-center gap-2"
                >
                  <Compass size={16} />
                  <span>Explore Our Mission</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Navigation />
      <Footer />
    </>
  );
}
