import Link from "next/link";
import { MapPin, Music2 } from "lucide-react";

export type LandingPostPreview = {
  id: string;
  title: string;
  body: string;
  place_name: string | null;
  lat: number;
  lng: number;
  music: { title: string; artist: string | null } | null;
};

export function ThoughtCarousel({
  posts,
  unavailable,
}: {
  posts: LandingPostPreview[];
  unavailable: boolean;
}) {
  return (
    <section className="border-y border-black/10 bg-[#f5f1e8] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-serif text-[clamp(2.75rem,5vw,4.5rem)] leading-none tracking-[-0.04em]">
          Thoughts left on the map.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[#607064] sm:text-base">
          Real, anonymous posts from places people chose.
        </p>
      </div>
      {posts.length > 0 ? (
        <div className="sonder-thoughts -mx-5 mt-6 overflow-hidden py-2 sm:-mx-8 sm:mt-8">
          <div className="sonder-thoughts-track flex w-max">
            {[false, true].map((duplicate) => (
              <div
                key={String(duplicate)}
                aria-hidden={duplicate}
                className={`flex shrink-0 gap-4 pr-4 ${duplicate ? "sonder-thoughts-copy" : ""}`}
              >
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/p/${post.id}`}
                    tabIndex={duplicate ? -1 : undefined}
                    className="sonder-thought-card flex h-[248px] w-[min(86vw,380px)] shrink-0 flex-col rounded-[1.75rem] border border-[#2f4439]/15 bg-[#e6eadc] p-6 text-[#101713] transition-colors hover:bg-[#dce5cf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f4439] sm:h-[260px] sm:w-[420px] sm:p-7"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2f4439]">
                      <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                      {post.place_name || "Somewhere on the map"}
                    </span>
                    <h3 className="mt-4 line-clamp-2 font-serif text-2xl leading-tight sm:text-3xl">
                      {post.title}
                    </h3>
                    {post.body && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#526256]">
                        {post.body}
                      </p>
                    )}
                    {post.music && (
                      <span className="mt-auto flex min-w-0 items-center gap-2 pt-4 text-sm text-[#2f4439]">
                        <Music2 aria-hidden="true" className="size-4 shrink-0" />
                        <span className="truncate">
                          {post.music.title}{post.music.artist ? ` · ${post.music.artist}` : ""}
                        </span>
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mx-auto mt-10 max-w-7xl text-sm text-[#607064]">
          {unavailable
            ? "Thoughts are unavailable right now. Try the map in a moment."
            : "No public thoughts yet. You can leave the first one on the map."}
        </p>
      )}
    </section>
  );
}
