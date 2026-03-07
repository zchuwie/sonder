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

  // Tight bbox → proper street-level zoom
  const bbox = 0.002;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${marker.lng - bbox},${marker.lat - bbox},${marker.lng + bbox},${marker.lat + bbox}&layer=mapnik&marker=${marker.lat},${marker.lng}`;
  const authorInitial = post.author ? post.author[0]!.toUpperCase() : "?";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full flex flex-col sm:flex-row overflow-hidden rounded-t-3xl sm:rounded-2xl"
        style={{
          maxWidth: 920,
          height: "min(88vh, 580px)",
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 40px 100px rgba(0,0,0,.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden shrink-0 flex justify-center pt-3 pb-1">
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--border)",
            }}
          />
        </div>
        {/* ── Left: full-height map with image pinned over it ─── */}
        <div
          className="hidden sm:block relative shrink-0 overflow-hidden"
          style={{ width: 400, borderRight: "1px solid var(--border)" }}
        >
          {/* Map — fills entire left panel */}
          <iframe
            title="Location map"
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            style={{ border: "none", pointerEvents: "none" }}
          />

          {/* Top scrim — holds the coords badge */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: 80,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
            }}
          />
          <div className="absolute top-3.5 left-4 flex items-center gap-1.5">
            <svg
              viewBox="0 0 24 24"
              width="10"
              height="10"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="10" r="3" />
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
            <span
              className="font-mono"
              style={{
                fontSize: 10.5,
                color: "rgba(255,255,255,0.8)",
                letterSpacing: "0.02em",
              }}
            >
              {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
            </span>
          </div>

          {/* Post image — polaroid pinned to the map */}
          {post.imageUrl && (
            <div
              className="absolute overflow-hidden"
              style={{
                bottom: 20,
                right: 16,
                width: 148,
                background: "#fff",
                padding: "5px 5px 18px 5px",
                borderRadius: 3,
                boxShadow:
                  "0 8px 28px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)",
                transform: "rotate(2.5deg)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt="Post"
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  display: "block",
                  borderRadius: 1,
                }}
              />
            </div>
          )}
        </div>

        {/* ── Right: content panel ────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 flex items-center justify-center rounded-full z-10 transition-opacity hover:opacity-60"
            style={{
              width: 28,
              height: 28,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-8 pt-7 pb-4 space-y-5 pr-12">
            {/* Author */}
            <div className="flex items-start gap-3">
              <div
                className="shrink-0 flex items-center justify-center rounded-full text-sm font-bold mt-0.5"
                style={{
                  width: 38,
                  height: 38,
                  background: post.isAnonymous
                    ? "var(--surface)"
                    : "var(--primary)",
                  color: post.isAnonymous
                    ? "var(--muted)"
                    : "var(--primary-foreground)",
                  border: "1.5px solid var(--border)",
                  fontFamily: "monospace",
                }}
              >
                {post.isAnonymous ? "?" : authorInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: "0.92rem",
                      color: "var(--card-foreground)",
                    }}
                  >
                    {post.author ?? "Unknown"}
                  </span>
                  {post.isAnonymous && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: "var(--muted)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      anon
                    </span>
                  )}
                </div>
                <p
                  className="font-mono"
                  style={{
                    fontSize: 10.5,
                    color: "var(--muted)",
                    marginTop: 3,
                  }}
                >
                  {relativeTime(post.createdAt)}
                  <span style={{ opacity: 0.35, margin: "0 5px" }}>·</span>
                  {new Date(post.createdAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{ height: 1, background: "var(--border)", opacity: 0.6 }}
            />

            {/* Post text */}
            {post.content && (
              <p
                className="leading-relaxed whitespace-pre-wrap"
                style={{
                  color: "var(--card-foreground)",
                  fontSize: "0.975rem",
                  lineHeight: 1.7,
                }}
              >
                {post.content}
              </p>
            )}

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
                  width={44}
                  height={44}
                  className="rounded-lg object-cover shrink-0"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}
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
                </div>
                <span
                  className="font-mono shrink-0"
                  style={{ fontSize: 11, color: "var(--muted)" }}
                >
                  {post.song.duration}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="#1DB954"
                  className="shrink-0"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="shrink-0 px-8 py-4 flex items-center gap-2"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: copied ? "var(--primary)" : "transparent",
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
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
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
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
