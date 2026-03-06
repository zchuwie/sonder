"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SpotifySong } from "../../components/PostPopup";

type SharedPost = {
  content: string;
  imageUrl?: string;
  song?: SpotifySong;
  createdAt: string;
  lat: number;
  lng: number;
  author?: string;
  isAnonymous?: boolean;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function decode(raw: string): SharedPost | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    return null;
  }
}

function ErrorCard({
  emoji,
  title,
  message,
}: {
  emoji: string;
  title: string;
  message: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <span className="text-5xl" role="img" aria-label="">
        {emoji}
      </span>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {message}
      </p>
      <Link
        href="/"
        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        Open Sonder
      </Link>
    </div>
  );
}

function ShareContent() {
  const params = useSearchParams();
  const raw = params.get("d");

  if (!raw) {
    return (
      <ErrorCard
        emoji="🗺️"
        title="Invalid share link"
        message="This link is missing or malformed."
      />
    );
  }

  const post = decode(raw);
  if (!post) {
    return (
      <ErrorCard
        emoji="⚠️"
        title="Couldn't load post"
        message="The share data may be corrupted."
      />
    );
  }

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${post.lng - 0.006},${post.lat - 0.006},${post.lng + 0.006},${post.lat + 0.006}&layer=mapnik&marker=${post.lat},${post.lng}`;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--primary)">
            <circle cx="12" cy="10" r="3" />
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          <span
            className="text-base font-bold"
            style={{ color: "var(--primary)" }}
          >
            Sonder
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "var(--surface)",
              color: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            shared post
          </span>
        </div>
        <Link
          href="/"
          className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          Open App
        </Link>
      </div>

      {/* ── Post card ───────────────────────────────────────── */}
      <div className="flex justify-center px-4 py-8">
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            maxWidth: 520,
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 40px rgba(0,0,0,.12)",
          }}
        >
          {/* Map banner */}
          <div className="relative" style={{ height: 180 }}>
            <iframe
              title="Location map"
              src={embedUrl}
              className="w-full h-full"
              style={{ border: "none", pointerEvents: "none" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 55%)",
              }}
            />
            <div
              className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                background: "rgba(0,0,0,.4)",
                backdropFilter: "blur(4px)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="11"
                height="11"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="10" r="3" />
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
              <span
                className="text-xs font-mono font-medium"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                {post.lat.toFixed(5)}, {post.lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Post image */}
          {post.imageUrl && (
            <div
              className="w-full flex items-center justify-center"
              style={{
                background: "var(--surface)",
                maxHeight: 400,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt="Post"
                style={{
                  maxWidth: "100%",
                  maxHeight: 400,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Song */}
            {post.song && (
              <div
                className="flex items-center gap-3 rounded-xl p-3"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.song.albumArt}
                  alt={post.song.title}
                  width={54}
                  height={54}
                  className="rounded-lg object-cover shrink-0"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,.18)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {post.song.title}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "var(--muted)" }}
                  >
                    {post.song.artist}
                  </p>
                  <p
                    className="text-xs font-mono mt-0.5"
                    style={{ color: "var(--muted)", opacity: 0.7 }}
                  >
                    {post.song.duration}
                  </p>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  width="26"
                  height="26"
                  fill="#1DB954"
                  className="shrink-0"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>
            )}

            {/* Content */}
            {post.content && (
              <p
                className="text-base leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--card-foreground)" }}
              >
                {post.content}
              </p>
            )}

            {/* Author */}
            {post.author && (
              <div className="flex items-center gap-2">
                <span className="text-sm" aria-hidden>
                  {post.isAnonymous ? "🎭" : "👤"}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--card-foreground)" }}
                >
                  {post.author}
                </span>
                {post.isAnonymous && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "var(--surface)",
                      color: "var(--muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    anonymous
                  </span>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div
              className="flex items-center gap-1.5"
              style={{ color: "var(--muted)" }}
            >
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs font-medium">
                {relativeTime(post.createdAt)}
              </span>
              <span className="text-xs opacity-50 mx-0.5">·</span>
              <span className="text-xs opacity-60">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer CTA */}
          <div
            className="px-5 py-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="10" r="3" />
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
              Explore more on Sonder
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ background: "var(--background)" }}
        >
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            Loading…
          </div>
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
