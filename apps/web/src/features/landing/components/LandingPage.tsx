"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  Eye,
  MapPin,
  Menu,
  MessageCircleMore,
  Music2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { LandingThemeToggle } from "@/features/landing/components/LandingThemeToggle";
import { LandingMapPin } from "@/features/landing/components/LandingMapPin";

const features = [
  {
    icon: MessageCircleMore,
    title: "Anonymous by design",
    copy: "No profiles or public identity. Just the thought and the place.",
  },
  {
    icon: MapPin,
    title: "Pin memories to places",
    copy: "Leave a confession, memory, or feeling exactly where it happened.",
  },
  {
    icon: Camera,
    title: "Add photos and songs",
    copy: "Give a thought more context with an image or a song.",
  },
  {
    icon: Eye,
    title: "Explore nearby thoughts",
    copy: "Find what people left around a city, campus, or neighborhood.",
  },
  {
    icon: ArrowRight,
    title: "Share public moments",
    copy: "Each approved post can become a link worth passing on.",
  },
  {
    icon: ShieldCheck,
    title: "A safer public space",
    copy: "Review, reporting, and moderation are part of the experience.",
  },
];

const steps = [
  ["01", "Choose a place", "Search or tap the map where the thought belongs."],
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

const navItems = [
  ["How it works", "#how-it-works"],
  ["Features", "#features"],
  ["Safety", "#safety"],
  ["Explore", "/map"],
] as const;

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-serif text-3xl tracking-[-0.04em] ${className}`}>
      Sonder<span className="text-[#a8ba63]">.</span>
    </span>
  );
}

function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-black/10 bg-[#f5f1e8]/80 px-5 py-3 text-[#101713] shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-[#050706]/75 dark:text-[#f5f1e8]">
        <Link href="/" aria-label="Sonder home">
          <Wordmark />
        </Link>
        <div className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#607064] dark:text-[#c3c9c2] md:flex">
          {navItems.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="transition hover:text-[#101713] dark:hover:text-[#f5f1e8]"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <LandingThemeToggle />
          <Link
            href="/map"
            className="flex items-center gap-2 rounded-full bg-[#2f4439] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#3b5446] dark:bg-[#a8ba63] dark:text-[#101713] dark:hover:bg-[#bdcc7b]"
          >
            Open map <ArrowRight className="size-4" />
          </Link>
        </div>
        <button
          type="button"
          className="rounded-full p-2 text-[#101713] dark:text-[#f5f1e8] md:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="mx-auto mt-2 flex max-w-7xl flex-col rounded-3xl border border-black/10 bg-[#f5f1e8] p-5 text-[#101713] shadow-2xl dark:border-white/10 dark:bg-[#101713] dark:text-[#f5f1e8] md:hidden">
          {navItems.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="border-b border-black/10 py-3 text-sm dark:border-white/10"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="mt-4">
            <LandingThemeToggle />
          </div>
          <Link
            href="/map"
            className="mt-4 rounded-full bg-[#a8ba63] px-5 py-3 text-center font-bold text-[#101713]"
          >
            Open map
          </Link>
        </div>
      )}
    </header>
  );
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="overflow-hidden bg-[#f5f1e8] text-[#101713] transition-colors dark:bg-[#080b09] dark:text-[#f5f1e8]">
      <LandingNavbar />

      <section className="relative min-h-screen overflow-hidden bg-[#eef0e5] px-5 pb-20 pt-36 text-[#101713] transition-colors dark:bg-[#050706] dark:text-[#f5f1e8] sm:px-8 lg:pt-40">
        <div className="pointer-events-none absolute -right-36 top-20 size-[500px] rounded-full bg-[#a8ba63]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a8ba63]">
              <span className="size-2 rounded-full bg-[#a8ba63]" />
              Anonymous memories, tied to real places
            </div>
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
            <div className="absolute inset-0 rotate-3 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#101713]">
              <Image
                src="/brand/sonder-wordmark.png"
                alt="Sonder"
                fill
                priority
                className="object-contain p-8 opacity-80"
              />
            </div>
            <div className="absolute -bottom-2 left-2 max-w-[270px] -rotate-3 rounded-3xl border border-white/10 bg-[#f5f1e8] p-5 text-[#101713] shadow-2xl sm:left-[-2rem]">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#607064]">
                <MapPin className="size-4 text-[#2f4439]" /> Escolta, Manila
              </div>
              <p className="font-serif text-2xl leading-tight">
                I still take the long way home because it passes here.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-[#657067]">
                <Music2 className="size-4" /> Leaves · Ben&Ben
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="grid gap-8 lg:grid-cols-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#607064]">
              What Sonder is
            </p>
            <h2 className="font-serif text-4xl leading-[1.08] tracking-[-0.035em] sm:text-6xl">
              Places become quiet confession walls.
            </h2>
          </ScrollReveal>
          <ScrollReveal className="mt-16" delay={0.1}>
            <LandingMapPin />
          </ScrollReveal>
          <div className="mt-20 grid gap-px overflow-hidden rounded-[2rem] border border-[#d7d4c9] bg-[#d7d4c9] md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <ScrollReveal
                key={feature.title}
                delay={index * 0.06}
                className="bg-[#f8f5ed]"
              >
                <article className="group min-h-64 p-7 transition duration-300 hover:bg-[#eef0e5] sm:p-9">
                  <feature.icon className="size-6 text-[#2f4439] transition group-hover:scale-110" />
                  <h3 className="mt-12 font-serif text-3xl">{feature.title}</h3>
                  <p className="mt-4 max-w-xs text-sm leading-7 text-[#687168]">
                    {feature.copy}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-[#2f4439] px-5 py-24 text-[#f5f1e8] sm:px-8 sm:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a8ba63]">
              How it works
            </p>
            <h2 className="mt-5 font-serif text-5xl leading-none tracking-[-0.04em] sm:text-7xl">
              Start with a place.
            </h2>
          </ScrollReveal>
          <div className="mt-16 grid gap-4 lg:grid-cols-3">
            {steps.map(([number, title, copy], index) => (
              <ScrollReveal key={number} delay={index * 0.1}>
                <article className="min-h-72 rounded-[2rem] border border-white/15 bg-white/[0.04] p-8">
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

      <section className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2">
          <ScrollReveal
            direction="left"
            className="rounded-[2.5rem] bg-[#e6eadc] p-8 sm:p-12"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-[#2f4439] text-white">
              <Music2 />
            </div>
            <h2 className="mt-16 max-w-lg font-serif text-5xl leading-[1.04] tracking-[-0.04em] sm:text-6xl">
              Add a song when words are not enough.
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
              Posts can be reviewed, reported, and hidden. Sonder reminds
              everyone not to share names, contact details, or identifying
              information.
            </p>
            <ul className="mt-10 space-y-4 text-sm text-[#d8ddd7]">
              {[
                "No personal profiles",
                "Moderation-ready post states",
                "Public and anonymous reminders",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="size-4 text-[#a8ba63]" /> {item}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-[#a8ba63] px-5 py-28 text-[#101713] sm:px-8 sm:py-40">
        <ScrollReveal className="mx-auto max-w-6xl text-center">
          <Sparkles className="mx-auto size-7" />
          <blockquote className="mt-10 font-serif text-[clamp(3.4rem,8vw,8rem)] leading-[0.95] tracking-[-0.055em]">
            Every place has a version of someone that stayed behind.
          </blockquote>
        </ScrollReveal>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#607064] dark:text-[#a8ba63]">
              Before you pin
            </p>
            <h2 className="mt-5 max-w-4xl font-serif text-5xl leading-[1.02] tracking-[-0.04em] sm:text-7xl">
              Public, anonymous, and still accountable.
            </h2>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-[#657067] dark:text-[#b8c0b8]">
              Sonder explains what data may be processed, what cannot be posted,
              how moderation works, and how to request removal or report harm.
            </p>
          </ScrollReveal>
          <div className="mt-12 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(
              [
                [
                  "Privacy Policy",
                  "How location, content, and technical data are handled.",
                  "/privacy",
                ],
                [
                  "Terms of Use",
                  "The rules and responsibilities for using Sonder.",
                  "/terms",
                ],
                [
                  "Community Guidelines",
                  "What belongs on the map and what does not.",
                  "/community-guidelines",
                ],
                [
                  "Safety & Reporting",
                  "Protect yourself, report content, and request review.",
                  "/safety",
                ],
              ] as const
            ).map(([title, copy, href], index) => (
              <ScrollReveal key={title} delay={index * 0.06} className="h-full">
                <Link
                  href={href}
                  className="group flex h-full min-h-72 flex-col rounded-[2rem] border border-black/10 bg-[#f8f5ed] p-7 transition hover:-translate-y-1 hover:bg-[#eef0e5] dark:border-white/10 dark:bg-[#101713] dark:hover:bg-[#162019]"
                >
                  <ShieldCheck className="size-5 text-[#2f4439] dark:text-[#a8ba63]" />
                  <h3 className="mt-12 min-h-[4.5rem] font-serif text-3xl leading-tight">
                    {title}
                  </h3>
                  <p className="mt-3 text-xs leading-6 text-[#657067] dark:text-[#b8c0b8]">
                    {copy}
                  </p>
                  <ArrowRight className="mt-auto size-4 pt-6 box-content transition group-hover:translate-x-1" />
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e6eadc] px-5 py-24 text-[#101713] transition-colors dark:bg-[#050706] dark:text-[#f5f1e8] sm:px-8 sm:py-32">
        <ScrollReveal className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 rounded-[2.5rem] border border-black/10 bg-[#f5f1e8] p-8 dark:border-white/10 dark:bg-[#101713] sm:p-14 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a8ba63]">
              Ready when you are
            </p>
            <h2 className="mt-5 max-w-3xl font-serif text-5xl leading-[1] tracking-[-0.04em] sm:text-7xl">
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
            <Link href="/map">Explore</Link>
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
