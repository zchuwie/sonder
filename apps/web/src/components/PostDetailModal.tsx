"use client";

import { useState } from "react";
import type { Post, MarkerData } from "./PostPopup";

type Props = {
  post: Post;
  marker: MarkerData;
  onClose: () => void;
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

function buildShareUrl(post: Post, marker: MarkerData): string {
  const payload = {
    content: post.content,
    imageUrl: post.imageUrl,
    song: post.song,
    createdAt: post.createdAt,
    lat: marker.lat,
    lng: marker.lng,
    author: post.author,
    isAnonymous: post.isAnonymous,
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/share?d=${encoded}`;
}

export default function PostDetailModal({ post, marker, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = buildShareUrl(post, marker);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${marker.lng - 0.006},${marker.lat - 0.006},${marker.lng + 0.006},${marker.lat + 0.006}&layer=mapnik&marker=${marker.lat},${marker.lng}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: 460,
          maxHeight: "88vh",
          background: "var(--card)",
          color: "var(--card-foreground)",
          boxShadow: "0 24px 64px rgba(0,0,0,.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Map banner ─────────────────────────────────────── */}
        <div className="relative shrink-0" style={{ height: 140 }}>
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
                "linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 55%)",
            }}
          />
          {/* Coordinates badge */}
          <div
            className="absolute bottom-2.5 left-3.5 flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: "rgba(0,0,0,.45)",
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
              {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
            </span>
          </div>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 flex items-center justify-center rounded-full transition-opacity hover:opacity-75"
            style={{
              width: 30,
              height: 30,
              background: "rgba(0,0,0,.45)",
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* Post image */}
          {post.imageUrl && (
            <div
              className="w-full flex items-center justify-center"
              style={{
                background: "var(--surface)",
                maxHeight: 380,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt="Post"
                style={{
                  maxWidth: "100%",
                  maxHeight: 380,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Song card */}
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
                  width={50}
                  height={50}
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
                {/* Spotify logo */}
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
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
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>
                {post.isAnonymous ? "🎭" : "👤"}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--card-foreground)" }}
              >
                {post.author ?? "Unknown"}
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
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div
          className="px-5 py-3.5 shrink-0 flex gap-2.5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: copied ? "var(--primary)" : "var(--surface)",
              color: copied
                ? "var(--primary-foreground)"
                : "var(--card-foreground)",
              border: `1px solid ${copied ? "var(--primary)" : "var(--border)"}`,
            }}
          >
            {copied ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Link copied!
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share Post
              </>
            )}
          </button>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: "var(--surface)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--border)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--surface)")
            }
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
