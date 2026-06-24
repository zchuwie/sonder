"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Music2,
  ShieldCheck,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { LandingThemeToggle } from "@/features/landing/components/LandingThemeToggle";
import { HeroMapCarousel } from "@/features/landing/components/HeroMapCarousel";

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
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-black/10 bg-[#f5f1e8]/80 px-5 py-3 text-[#101713] shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-[#050706]/75 dark:text-[#f5f1e8]">
        <Link href="/" aria-label="Sonder home">
          <Wordmark />
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          <LandingThemeToggle />
          <Link
            href="/map"
            className="flex items-center gap-2 rounded-full bg-[#2f4439] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#3b5446] dark:bg-[#a8ba63] dark:text-[#101713] dark:hover:bg-[#bdcc7b]"
          >
            Open map <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="md:hidden">
          <LandingThemeToggle />
        </div>
      </nav>
    </header>
  );
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="overflow-hidden bg-[#f5f1e8] text-[#101713] transition-colors dark:bg-[#080b09] dark:text-[#f5f1e8]">
      <LandingNavbar />

      <section className="relative min-h-screen overflow-hidden bg-[#eef0e5] px-5 pb-14 pt-28 text-[#101713] transition-colors dark:bg-[#050706] dark:text-[#f5f1e8] sm:px-8 sm:pb-20 sm:pt-36 lg:pt-40">
        <div className="pointer-events-none absolute -right-36 top-20 size-[500px] rounded-full bg-[#a8ba63]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-16 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="max-w-3xl font-serif text-[clamp(4rem,9vw,8.5rem)] leading-[0.88] tracking-[-0.055em]">
              Leave a thought where it happened.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-[#607064] dark:text-[#aeb7af] sm:text-lg">
              Sonder is an anonymous place-based wall for thoughts, photos, and
              songs, pinned to the locations that made them matter.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/map"
                className="flex items-center gap-2 rounded-full bg-[#a8ba63] px-6 py-3.5 text-sm font-bold text-[#101713] transition hover:bg-[#bdcc7b]"
              >
                Explore the map <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-full border border-black/20 px-6 py-3.5 text-sm font-bold transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                How it works
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="relative min-h-[440px] lg:min-h-[580px]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroMapCarousel />
          </motion.div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-[#2f4439] px-5 py-16 text-[#f5f1e8] sm:px-8 sm:py-24 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="max-w-3xl">
            <h2 className="mt-5 font-serif text-5xl leading-none tracking-[-0.04em] sm:text-7xl">
              Start with a place.
            </h2>
          </ScrollReveal>
          <div className="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3">
            {steps.map(([number, title, copy], index) => (
              <ScrollReveal key={number} delay={index * 0.1}>
                <article className="min-h-56 rounded-[2rem] border border-white/15 bg-white/[0.04] p-5 sm:min-h-72 sm:p-8">
                  <span className="font-serif text-5xl text-[#a8ba63]">
                    {number}
                  </span>
                  <h3 className="mt-16 font-serif text-3xl">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#c3cbc3]">
                    {copy}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2">
          <ScrollReveal
            direction="left"
            className="rounded-[2.5rem] bg-[#e6eadc] p-8 text-[#101713] sm:p-12"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-[#2f4439] text-white">
              <Music2 />
            </div>
            <h2 className="mt-16 max-w-lg font-serif text-5xl leading-[1.04] tracking-[-0.04em] sm:text-6xl">
              Add a song, or even photos when words are not enough.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#657067]">
              Search for a track, attach it to a thought, and let the place
              carry the feeling.
            </p>
            <div className="mt-10 flex items-center gap-4 rounded-2xl bg-[#f8f5ed] p-4 shadow-sm">
              <div className="flex size-14 items-center justify-center rounded-xl bg-[#a8ba63] text-[#101713]">
                <Music2 />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">Leaves</p>
                <p className="text-xs text-[#687168]">Ben&Ben</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#687168]">
                Spotify
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal
            id="safety"
            direction="right"
            className="rounded-[2.5rem] bg-[#101713] p-8 text-[#f5f1e8] sm:p-12"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-[#a8ba63] text-[#101713]">
              <ShieldCheck />
            </div>
            <h2 className="mt-16 max-w-lg font-serif text-5xl leading-[1.04] tracking-[-0.04em] sm:text-6xl">
              Anonymous does not mean careless.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#b8c0b8]">
              Posts can be reviewed, reported, and archived. Sonder reminds
              everyone not to share names, contact details, or identifying
              information.
            </p>
            <ul className="mt-10 space-y-4 text-sm text-[#d8ddd7]">
              {[
                "No personal profiles",
                "Moderation-ready post states",
                "Publicly anonymous safety reminders",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="size-4 text-[#a8ba63]" /> {item}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-[#e6eadc] px-5 py-16 text-[#101713] transition-colors dark:bg-[#050706] dark:text-[#f5f1e8] sm:px-8 sm:py-24 lg:py-32">
        <ScrollReveal className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 rounded-[2.5rem] border border-black/10 bg-[#f5f1e8] p-8 dark:border-white/10 dark:bg-[#101713] sm:p-14 lg:flex-row lg:items-end">
          <div>
            <h2 className="mt-5 max-w-3xl font-serif text-5xl leading-none tracking-[-0.04em] sm:text-7xl">
              Leave what words could not hold.
            </h2>
          </div>
          <Link
            href="/map"
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#a8ba63] px-7 py-4 text-sm font-bold text-[#101713] transition hover:bg-[#bdcc7b]"
          >
            Open the map <ArrowRight className="size-4" />
          </Link>
        </ScrollReveal>
      </section>

      <footer className="border-t border-black/10 bg-[#f5f1e8] px-5 py-10 text-[#101713] transition-colors dark:border-white/10 dark:bg-[#050706] dark:text-[#f5f1e8] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Wordmark className="text-5xl" />
            <p className="mt-3 text-xs text-[#657067] dark:text-[#8f9990]">
              A map for what people never said out loud.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-[#657067] dark:text-[#aeb7af]">
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
