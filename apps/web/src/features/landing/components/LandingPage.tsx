"use client";

import Link from "next/link";
import { ArrowRight, Music2, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { HeroMapCarousel } from "@/features/landing/components/HeroMapCarousel";
import { ThoughtCarousel, type LandingPostPreview } from "@/features/landing/components/ThoughtCarousel";

const steps = [
  [
    "01", 
    "Choose a place", 
    "Search or tap the map where the thought belongs."
  ],
  [
    "02",
    "Leave something behind",
    "Write a thought, add a photo, or choose a song.",
  ],
  [
    "03",
    "Let others find it",
    "Once reviewed, it appears anonymously as a public pin.",
  ],
];

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-serif text-3xl tracking-[-0.04em] ${className}`}>
      Sonder<span className="text-[#a8ba63]">.</span>
    </span>
  );
}

function LandingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-black/10 bg-[#f5f1e8]/90 px-5 py-3 text-[#101713] shadow-2xl shadow-black/10 backdrop-blur-xl">
        <Link href="/" aria-label="Sonder home">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/map"
            className="flex items-center gap-2 rounded-full bg-[#2f4439] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#3b5446]"
          >
            Open map <ArrowRight className="size-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function LandingPage({
  postPreviews,
  postsUnavailable,
}: {
  postPreviews: LandingPostPreview[];
  postsUnavailable: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="overflow-hidden bg-[#f5f1e8] text-[#101713]">
      <LandingNavbar />

      <section className="relative overflow-hidden bg-[#eef0e5] px-5 pb-20 pt-28 text-[#101713] sm:px-8 sm:pb-20 sm:pt-32 lg:pt-36">
        {/* Minimal Animated Ambient Gradient Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="animate-ambient-a absolute -right-32 -top-24 size-[600px] rounded-full bg-gradient-to-br from-[#a8ba63]/25 via-[#92a856]/15 to-transparent blur-3xl sm:size-[720px]" />
          <div className="animate-ambient-b absolute -bottom-36 -left-32 size-[550px] rounded-full bg-gradient-to-tr from-[#2f4439]/15 via-[#a8ba63]/20 to-transparent blur-3xl sm:size-[680px]" />
          <div className="animate-ambient-a absolute left-1/2 top-1/3 size-[420px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#a8ba63]/15 to-transparent blur-2xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-8 sm:gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="max-w-3xl font-serif text-[clamp(3.25rem,9vw,8.5rem)] leading-[0.92] tracking-[-0.055em]">
              Leave a thought where it happened.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#526256] sm:mt-8 sm:text-lg sm:leading-8">
              Leave thoughts, photos, and songs on the places that made them matter. No profile needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
              <Link
                href="/map"
                className="flex items-center gap-2 rounded-full bg-[#a8ba63] px-6 py-3.5 text-sm font-bold text-[#101713] transition hover:bg-[#bdcc7b]"
              >
                Explore the map <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-full border border-black/20 px-6 py-3.5 text-sm font-bold transition hover:bg-black/5"
              >
                How it works
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="relative min-h-[340px] sm:min-h-[460px] lg:min-h-[540px]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroMapCarousel posts={postPreviews} />
          </motion.div>
        </div>
      </section>

      <ThoughtCarousel posts={postPreviews} unavailable={postsUnavailable} />

      <section
        id="how-it-works"
        className="bg-[#2f4439] px-5 py-12 text-[#f5f1e8] sm:px-8 sm:py-16"
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="font-serif text-[clamp(2.75rem,5vw,4.5rem)] leading-none tracking-[-0.04em]">
            Start with a place.
          </h2>
          <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-3 sm:gap-5">
            {steps.map(([number, title, copy]) => (
              <div key={number} className="border-t border-[#f5f1e8]/35 pt-4 sm:pt-5">
                <span className="font-serif text-3xl text-[#a8ba63]">{number}</span>
                <h3 className="mt-3 font-serif text-[clamp(1.5rem,2.5vw,2rem)] leading-tight">{title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#d8ddd7]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          <div className="rounded-[1.75rem] bg-[#e6eadc] p-6 text-[#101713] sm:p-8">
            <Music2 aria-hidden="true" className="size-6 text-[#2f4439]" />
            <h2 className="mt-5 max-w-lg font-serif text-[clamp(2rem,3.5vw,3rem)] leading-tight tracking-[-0.04em]">
              Some places have a soundtrack.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#526256]">
              Add a song or photo to a thought when words are not enough.
            </p>
          </div>
          <div id="safety" className="rounded-[1.75rem] border border-[#2f4439]/20 bg-[#f8f5ed] p-6 text-[#101713] sm:p-8">
            <ShieldCheck aria-hidden="true" className="size-6 text-[#2f4439]" />
            <h2 className="mt-5 max-w-lg font-serif text-[clamp(2rem,3.5vw,3rem)] leading-tight tracking-[-0.04em]">
              Anonymous, with care.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#526256]">
              Posts can be reviewed and reported. Please leave out names, contact details, and other identifying information.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-[#f5f1e8] px-5 py-10 text-[#101713] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Wordmark className="text-5xl" />
            <p className="mt-3 text-xs text-[#657067]">
              A map for what people never said out loud.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-[#657067]">
            <Link href="/safety">Safety</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/community-guidelines">Guidelines</Link>
            <span>© 2026 Sonder</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
