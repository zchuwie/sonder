import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import type { LegalDocument } from "@/features/legal/lib/legal-content";
import { LEGAL_EFFECTIVE_DATE } from "@/features/legal/lib/legal-content";

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#101713] dark:bg-[#050706] dark:text-[#f5f1e8]">
      <header className="border-b border-black/10 px-5 py-5 dark:border-white/10 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-serif text-3xl tracking-[-0.04em]">
            Sonder<span className="text-[#a8ba63]">.</span>
          </Link>
          <Link
            href="/map"
            className="flex items-center gap-2 rounded-full bg-[#2f4439] px-4 py-2 text-xs font-bold text-white dark:bg-[#a8ba63] dark:text-[#101713]"
          >
            Open map <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <Link
          href="/"
          className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#607064] dark:text-[#a8ba63]"
        >
          <ArrowLeft className="size-4" /> Back to page
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#607064] dark:text-[#a8ba63]">
          {document.eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl font-serif text-6xl leading-none tracking-[-0.045em] sm:text-8xl">
          {document.title}
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-8 text-[#657067] dark:text-[#b8c0b8]">
          {document.summary}
        </p>
        <p className="mt-5 text-xs text-[#7b847c] dark:text-[#929c93]">
          Effective {LEGAL_EFFECTIVE_DATE}
        </p>

        {document.notice && (
          <aside className="mt-12 flex gap-4 rounded-3xl border border-[#cbd3bd] bg-[#e6eadc] p-6 text-sm leading-7 dark:border-white/10 dark:bg-[#101713]">
            <ShieldCheck className="mt-1 size-5 shrink-0 text-[#2f4439] dark:text-[#a8ba63]" />
            <p>{document.notice}</p>
          </aside>
        )}

        <div className="mt-16 space-y-16">
          {document.sections.map((section) => (
            <section
              key={section.title}
              className="border-t border-black/10 pt-8 dark:border-white/10"
            >
              <h2 className="font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-5 max-w-3xl text-sm leading-7 text-[#5f6961] dark:text-[#b8c0b8]"
                >
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="mt-6 max-w-3xl space-y-4 text-sm leading-7 text-[#5f6961] dark:text-[#b8c0b8]">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#2f4439] dark:bg-[#a8ba63]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <nav
          aria-label="Legal and safety pages"
          className="mt-20 flex flex-wrap gap-x-6 gap-y-3 border-t border-black/10 pt-8 text-xs font-semibold text-[#607064] dark:border-white/10 dark:text-[#aeb7af]"
        >
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Use</Link>
          <Link href="/community-guidelines">Community Guidelines</Link>
          <Link href="/safety">Safety and Reporting</Link>
        </nav>
      </article>
    </main>
  );
}
