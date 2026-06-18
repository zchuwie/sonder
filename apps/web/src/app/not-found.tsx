import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

function LostPlaceIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-[610px]"
    >
      <div className="absolute inset-[5%] rounded-full border border-[#a8ba63]/20 bg-[#101b14] shadow-[0_50px_120px_rgba(0,0,0,.38)] dark:bg-[#101b14]">
        <svg
          viewBox="0 0 600 600"
          className="size-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="lost-place-circle">
              <circle cx="300" cy="300" r="270" />
            </clipPath>
            <linearGradient id="lost-place-hill" x1="300" y1="310" x2="300" y2="590">
              <stop stopColor="#b9c7ad" />
              <stop offset="1" stopColor="#839a7c" />
            </linearGradient>
          </defs>

          <g clipPath="url(#lost-place-circle)">
            <circle cx="300" cy="300" r="270" fill="#122018" />
            <path
              d="M-40 105C61 40 132 139 220 91C329 31 388 119 478 79C550 47 611 84 676 46M-42 171C60 109 151 211 251 153C351 96 420 186 513 143C585 109 635 137 681 116M-40 247C83 177 159 281 267 223C374 166 445 257 540 216C607 187 653 215 686 201M-34 330C68 277 161 356 265 309C372 261 447 340 553 301C612 279 652 291 684 282"
              stroke="#879b82"
              strokeOpacity=".2"
              strokeWidth="2"
            />
            <path
              d="M-50 500C48 403 129 449 220 396C310 344 379 372 455 410C529 447 592 404 663 364V650H-50V500Z"
              fill="#c4cfb8"
            />
            <path
              d="M-50 551C46 469 132 509 232 464C334 418 409 470 495 489C566 505 620 458 674 431V650H-50V551Z"
              fill="url(#lost-place-hill)"
            />
            <path
              d="M307 655C303 565 250 538 276 474C299 419 361 410 341 350C329 314 294 293 310 245"
              stroke="#f5f1e8"
              strokeWidth="50"
              strokeLinecap="round"
            />
            <path
              d="M307 655C303 565 250 538 276 474C299 419 361 410 341 350C329 314 294 293 310 245"
              stroke="#aabca2"
              strokeOpacity=".55"
              strokeWidth="2"
              strokeDasharray="7 12"
              strokeLinecap="round"
            />

            {[
              [105, 360, 1],
              [158, 408, 0.62],
              [458, 352, 0.88],
              [508, 409, 0.58],
            ].map(([x, y, scale]) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${scale})`}>
                <path d="M35 0L4 85H66L35 0Z" fill="#314a3c" />
                <path d="M35 38L0 126H70L35 38Z" fill="#3e5d49" />
                <path d="M35 108V149" stroke="#6f6047" strokeWidth="7" />
              </g>
            ))}
          </g>

          <circle
            cx="300"
            cy="300"
            r="270"
            stroke="#a8ba63"
            strokeOpacity=".16"
            strokeWidth="2"
          />

          <g transform="translate(330 153) rotate(8)">
            <path
              d="M50 0C21 0 0 22 0 49C0 88 50 134 50 134C50 134 100 88 100 49C100 22 79 0 50 0Z"
              fill="#a8ba63"
              stroke="#2f4439"
              strokeWidth="6"
            />
            <circle cx="50" cy="49" r="16" fill="#f5f1e8" />
          </g>

          <g transform="translate(93 128) rotate(-7)">
            <path d="M42 85V151" stroke="#897653" strokeWidth="8" />
            <path
              d="M0 0H139V82H0Z"
              fill="#f5f1e8"
              stroke="#2f4439"
              strokeWidth="3"
            />
            <text
              x="69.5"
              y="27"
              fill="#657067"
              fontSize="10"
              fontWeight="700"
              letterSpacing="2"
              textAnchor="middle"
            >
              NOT FOUND
            </text>
            <text
              x="69.5"
              y="64"
              fill="#2f4439"
              fontFamily="serif"
              fontSize="38"
              textAnchor="middle"
            >
              404
            </text>
          </g>
        </svg>
      </div>

      <div className="absolute bottom-[8%] right-[1%] max-w-[190px] rotate-3 rounded-2xl border border-black/10 bg-[#f5f1e8] p-4 text-[#101713] shadow-2xl sm:right-[2%] sm:p-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#687168]">
          A note from nowhere
        </p>
        <p className="mt-3 font-serif text-xl leading-tight sm:text-2xl">
          Keep going. The map remembers another way.
        </p>
      </div>

      <span className="absolute left-[2%] top-[25%] size-3 rotate-45 rounded-[80%_0] bg-[#a8ba63] motion-safe:animate-pulse" />
      <span className="absolute right-[6%] top-[18%] size-4 -rotate-12 rounded-[80%_0] bg-[#758d68] motion-safe:animate-pulse" />
    </div>
  );
}

export default function NotFound() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f5f1e8] text-[#101713] transition-colors dark:bg-[#050706] dark:text-[#f5f1e8]">
      <div className="pointer-events-none absolute -left-48 top-20 size-[32rem] rounded-full bg-[#a8ba63]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 size-[34rem] rounded-full bg-[#607c69]/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-14">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Sonder home"
            className="font-serif text-3xl tracking-[-0.04em] sm:text-4xl"
          >
            Sonder<span className="text-[#a8ba63]">.</span>
          </Link>
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-[#687168] dark:text-[#aeb7af] sm:block">
            Somewhere between here and there
          </p>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[.86fr_1.14fr] lg:gap-10 lg:py-4">
          <div className="order-2 max-w-[640px] lg:order-1">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#607064] dark:text-[#a8ba63]">
              <MapPin className="size-4" />
              Location unavailable
            </div>
            <p className="mt-6 font-serif text-6xl leading-none tracking-[-0.06em] text-[#a8ba63] sm:text-7xl">
              404
            </p>
            <h1 className="mt-5 font-serif text-[clamp(3.4rem,5.6vw,6rem)] leading-[0.94] tracking-[-0.052em]">
              This place is not on the map.
            </h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-[#657067] dark:text-[#b8c0b8] sm:text-base sm:leading-8">
              It may have moved, faded, or never been pinned. There are still
              other quiet places waiting nearby.
            </p>
            <div className="mt-9 grid gap-3 sm:flex">
              
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-black/15 bg-transparent px-7 dark:border-white/15 dark:bg-transparent"
              >
                <Link href="/">
                  <ArrowLeft /> Go home
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-[#a8ba63] px-7 font-bold text-[#101713] hover:bg-[#bdcc7b]"
              >
                <Link href="/map">
                  Open map <ArrowRight />
                </Link>
              </Button>
              
            </div>
            <p className="mt-8 text-xs italic text-[#7a857c] dark:text-[#8f9990]">
              Every lost place can still lead somewhere.
            </p>
          </div>

          <div className="order-1 mx-auto w-full max-w-[620px] lg:order-2">
            <LostPlaceIllustration />
          </div>
        </section>
      </div>
    </main>
  );
}
