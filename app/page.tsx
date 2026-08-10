"use client";

import Link from "next/link";
import ScrollyCanvas from "@/app/components/ScrollyCanvas";
import Projects from "@/app/components/Projects";
import About from "./components/About";
import Experience from "./components/Experience";
import Contact from "./components/Contact";
import { usePortfolioData } from "./context/PortfolioContext";

export default function Home() {
  const { data } = usePortfolioData();

  return (
    <main className="relative bg-[#121212] min-h-screen text-white">
      {/* 
        Container for the entire scroll experience. 
        ScrollyCanvas handles the scroll height (500vh) internally.
      */}
      <ScrollyCanvas />

      <About />
      <Experience />

      {/* 
        Projects section appears after the scroll sequence.
      */}
      <Projects />
      <Contact />

      {/* Footer */}
      <footer className="w-full py-12 flex flex-col items-center justify-center gap-3 text-gray-500 text-sm border-t border-white/5 bg-[#0e0e0e]">
        <p>{data.footer.copyright}</p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-purple-400 transition-colors px-3 py-1 rounded-full border border-transparent hover:border-purple-500/20 hover:bg-purple-500/5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Admin Portal
        </Link>
      </footer>
    </main>
  );
}

