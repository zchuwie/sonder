import { Wrench } from "lucide-react";

function MaintenanceIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-[540px]"
    >
      <div className="absolute inset-[5%] rounded-full border border-[#a8ba63]/20 bg-[#101b14] shadow-[0_50px_120px_rgba(0,0,0,.38)]">
        <svg
          viewBox="0 0 600 600"
          className="size-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="maint-circle">
              <circle cx="300" cy="300" r="270" />
            </clipPath>
          </defs>
          <g clipPath="url(#maint-circle)">
            <circle cx="300" cy="300" r="270" fill="#122018" />
            <path
              d="M-40 400C80 340 200 380 320 350C440 320 560 360 680 310V650H-40Z"
              fill="#c4cfb8"
            />
            <path
              d="M-40 460C90 400 220 440 350 410C460 385 570 420 680 380V650H-40Z"
              fill="#839a7c"
            />
            {/* Wrench icon */}
            <g transform="translate(240 180) rotate(-20)">
              <rect x="25" y="60" width="16" height="160" rx="8" fill="#a8ba63" />
              <circle cx="33" cy="50" r="40" stroke="#a8ba63" strokeWidth="14" fill="none" />
              <rect x="17" y="10" width="32" height="30" rx="4" fill="#122018" />
            </g>
            {/* Gear */}
            <g transform="translate(350 240)">
              <circle cx="40" cy="40" r="22" stroke="#f5f1e8" strokeWidth="8" fill="none" />
              <circle cx="40" cy="40" r="8" fill="#f5f1e8" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <rect
                  key={angle}
                  x="36"
                  y="-4"
                  width="8"
                  height="18"
                  rx="3"
                  fill="#f5f1e8"
                  transform={`rotate(${angle} 40 40)`}
                />
              ))}
            </g>
          </g>
          <circle
            cx="300"
            cy="300"
            r="270"
            stroke="#a8ba63"
            strokeOpacity=".16"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="absolute bottom-[10%] right-[3%] max-w-[190px] rotate-2 rounded-2xl border border-black/10 bg-[#f5f1e8] p-4 text-[#101713] shadow-2xl sm:p-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#687168]">
          A note from the team
        </p>
        <p className="mt-3 font-serif text-xl leading-tight sm:text-2xl">
          We&apos;ll be back before the next thought fades.
        </p>
      </div>

      <span className="absolute left-[4%] top-[30%] size-3 rotate-45 rounded-[80%_0] bg-[#a8ba63] motion-safe:animate-pulse" />
      <span className="absolute right-[8%] top-[20%] size-4 -rotate-12 rounded-[80%_0] bg-[#758d68] motion-safe:animate-pulse" />
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f5f1e8] text-[#101713] transition-colors dark:bg-[#050706] dark:text-[#f5f1e8]">
      <div className="pointer-events-none absolute -left-48 top-20 size-[32rem] rounded-full bg-[#a8ba63]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 size-[34rem] rounded-full bg-[#607c69]/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-14">
        <header className="flex items-center justify-between">
          <span className="font-serif text-3xl tracking-[-0.04em] sm:text-4xl">
            Sonder<span className="text-[#a8ba63]">.</span>
          </span>
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-[#687168] dark:text-[#aeb7af] sm:block">
            We&apos;ll be right back
          </p>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[.86fr_1.14fr] lg:gap-10 lg:py-4">
          <div className="order-2 max-w-[640px] lg:order-1">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#607064] dark:text-[#a8ba63]">
              <Wrench className="size-4" />
              Under Maintenance
            </div>
            <h1 className="mt-5 font-serif text-[clamp(3rem,5vw,5.5rem)] leading-[0.94] tracking-[-0.052em]">
              We&apos;re making things better.
            </h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-[#657067] dark:text-[#b8c0b8] sm:text-base sm:leading-8">
              Sonder is temporarily offline for maintenance. All your thoughts, pins, and memories are safe. Check back shortly.
            </p>
            <p className="mt-8 text-xs italic text-[#7a857c] dark:text-[#8f9990]">
              Some places need a quiet moment to grow.
            </p>
          </div>

          <div className="order-1 mx-auto w-full max-w-[560px] lg:order-2">
            <MaintenanceIllustration />
          </div>
        </section>
      </div>
    </main>
  );
}
