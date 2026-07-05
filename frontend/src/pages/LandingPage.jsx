import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { feedApi } from "../api";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "upload",
    title: "Upload Your Project",
    desc: "Add your project title, description, tech stack, GitHub link, and a screenshot. Takes 2 minutes.",
  },
  {
    step: "02",
    icon: "auto_awesome",
    title: "Get AI Feedback",
    desc: "Gemini AI reviews your project and gives you a score out of 10 with strengths, improvements, and next steps.",
  },
  {
    step: "03",
    icon: "share",
    title: "Share Your Portfolio",
    desc: "Your unique portfolio URL is ready to share. Drop it in your resume, LinkedIn, or DM it to recruiters.",
  },
];

export default function LandingPage() {
  const [stats, setStats] = useState([
    { value: "0", label: "Student Portfolios" },
    { value: "0", label: "Projects Uploaded" },
    { value: "98%", label: "AI Accuracy" },
    { value: "0", label: "Colleges" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await feedApi.stats();
        const data = res.data.data;
        setStats([
          { value: data.students.toLocaleString(), label: "Student Portfolios" },
          { value: data.projects.toLocaleString(), label: "Projects Uploaded" },
          { value: "98%", label: "AI Accuracy" },
          { value: data.colleges.toLocaleString(), label: "Colleges" },
        ]);
      } catch (err) {
        // Fallback or leave as zeroes
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* ─── Navbar ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b-2 border-ink flex items-center justify-between px-6 md:px-12 h-16">
        <div className="font-mono font-black text-xl uppercase tracking-tight text-on-surface">
          ShowUp
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="btn-secondary py-2 px-4 text-xs">
            Sign In
          </Link>
          <Link to="/auth" className="btn-primary py-2 px-4 text-xs">
            Get Started
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="pt-16 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-20 text-center max-w-5xl mx-auto w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border-2 border-ink px-3 py-1.5 mb-8 bg-tertiary-fixed" style={{ boxShadow: "2px 2px 0 #2A2A2A" }}>
            <span className="material-symbols-outlined text-sm text-on-tertiary-fixed">rocket_launch</span>
            <span className="font-mono text-xs font-bold uppercase text-on-tertiary-fixed">For Indian Students → No Experience, Full Credibility</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-5xl md:text-7xl text-on-surface leading-none mb-6 text-balance">
            Your Work
            <br />
            <span className="text-primary relative inline-block">
              Speaks First.
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-tertiary-container" />
            </span>
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            ShowUp is the portfolio platform for Indian college students. Upload your projects, get
            AI-powered feedback, and share a public link that proves you can build — not just study.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" className="btn-primary text-base py-4 px-8">
              <span className="material-symbols-outlined">person_add</span>
              Create Your Portfolio
            </Link>
            <Link to="/feed" className="btn-secondary text-base py-4 px-8">
              <span className="material-symbols-outlined">explore</span>
              Explore Projects
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t-2 border-b-2 border-ink grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`py-6 px-8 text-center ${i < 3 ? "border-r-2 border-ink" : ""}`}
            >
              <p className="font-mono font-black text-3xl text-on-surface">{stat.value}</p>
              <p className="font-mono text-xs uppercase text-on-surface-variant mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <p className="label-mono mb-2">The Process</p>
          <h2 className="font-grotesk font-bold text-3xl md:text-4xl text-on-surface">
            Three steps to credibility
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-0 border-2 border-ink">
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={i}
              className={`p-8 ${i < 2 ? "md:border-r-2 border-b-2 md:border-b-0 border-ink" : ""}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="font-mono font-black text-4xl text-outline-variant">{item.step}</span>
                <span className="material-symbols-outlined text-primary text-2xl mt-2">{item.icon}</span>
              </div>
              <h3 className="font-grotesk font-bold text-lg text-on-surface mb-2">{item.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="border-t-2 border-b-2 border-ink bg-ink text-surface py-16 px-6 text-center">
        <h2 className="font-serif text-3xl md:text-5xl mb-4">
          Stop waiting for experience.
        </h2>
        <p className="font-mono text-sm text-surface-variant mb-8 max-w-lg mx-auto">
          Every senior developer started with a portfolio. Start yours today and let your projects do the talking.
        </p>
        <Link to="/auth" className="inline-flex items-center gap-2 bg-surface text-ink border-2 border-surface px-8 py-4 font-mono font-bold uppercase text-sm" style={{ boxShadow: "4px 4px 0 #4f378a" }}>
          <span className="material-symbols-outlined">star</span>
          Join for Free — No Experience Needed
        </Link>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 text-center border-t-2 border-ink">
        <p className="font-mono text-xs text-on-surface-variant uppercase">
          ShowUp © 2025 — Built for Indian Students 🇮🇳
        </p>
      </footer>
    </div>
  );
}
