import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Navbar />
      <main className="flex-1 md:ml-64 flex flex-col items-center justify-center p-6 text-center">
        <div className="border-4 border-ink bg-surface-container p-10 shadow-[12px_12px_0px_#111] max-w-lg w-full">
          <span className="material-symbols-outlined text-6xl text-primary mb-4 block animate-bounce">
            construction
          </span>
          <h1 className="font-grotesk font-black text-4xl text-on-surface uppercase mb-3">
            Top Devs
          </h1>
          <h2 className="font-mono font-bold text-xl text-on-surface-variant mb-6 uppercase">
            Coming Soon
          </h2>
          <p className="text-on-surface mb-8 leading-relaxed">
            We're building a definitive leaderboard for India's best student developers. Keep shipping projects and improving your credibility score — you might just be #1 when we launch!
          </p>
          <Link to="/feed" className="btn-primary py-3 px-8 text-sm inline-flex">
            <span className="material-symbols-outlined text-base">rocket_launch</span>
            Explore Feed
          </Link>
        </div>
      </main>
    </div>
  );
}
