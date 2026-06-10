"use client";

import { Suspense, type ReactNode } from "react";
import { FaSpotify } from "react-icons/fa";
import { FiAlertTriangle, FiClock, FiMapPin } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SpotifySong } from "../../components/posts/PostPopup";

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
  icon,
  title,
  message,
}: {
  icon: ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <span
        className="flex items-center justify-center w-14 h-14 rounded-2xl"
        style={{
          background: "var(--surface)",
          color: "var(--primary)",
          border: "1px solid var(--border)",
        }}
      >
        {icon}
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
        icon={<FiMapPin size={24} />}
        title="Invalid share link"
        message="This link is missing or malformed."
      />
    );
  }

  const post = decode(raw);
  if (!post) {
    return (
      <ErrorCard
        icon={<FiAlertTriangle size={24} />}
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
          <FiMapPin size={20} color="var(--primary)" />
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
              <FiMapPin size={11} color="rgba(255,255,255,0.85)" />
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
                <FaSpotify size={26} className="shrink-0" color="#1DB954" />
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
              <FiClock size={13} />
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
              <FiMapPin size={16} />
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
