"use client";

import { forwardRef } from "react";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { ShareCardQR } from "./ShareCardQR";

/**
 * Share card: 1080×1350 portrait
 *
 * Layer order (bottom to top):
 *  1. Full-bleed map image
 *  2. Dark scrim over entire canvas (~72% opacity) so map reads as texture
 *  3. CORNER decorative quote marks — bleed off-crop (OUTSIDE content area)
 *  4. "Sonder." brand — top-right
 *  5. Rounded glass content panel (semi-transparent, ~55% opacity)
 *     — location header
 *     — title (Gilda, large)
 *     — body (Manrope)
 *     — song card (if present)
 *  6. Map pin — centered on canvas, sits ON TOP of the glass panel at ~mid-card
 *  7. Footer row: bottom-left (nothing/empty space under closing quote) | bottom-right QR
 */

export type CardTheme = {
  label: string;
  scrim: string;
  panel: string;
  panelBorder: string;
  text: string;
  textMuted: string;
  quoteColor: string;
  accent: string;
  accentText: string;
  pinColor: string;
};

export const CARD_THEMES: Record<string, CardTheme> = {
  forest: {
    label: "Forest",
    scrim: "rgba(8,20,10,0.72)",
    panel: "rgba(12,26,14,0.58)",
    panelBorder: "rgba(255,255,255,0.10)",
    text: "#f0ede4",
    textMuted: "rgba(240,237,228,0.60)",
    quoteColor: "#a8ba63",
    accent: "#a8ba63",
    accentText: "#0f1c14",
    pinColor: "#a8ba63",
  },
  sand: {
    label: "Sand",
    scrim: "rgba(20,12,2,0.74)",
    panel: "rgba(26,16,4,0.58)",
    panelBorder: "rgba(255,255,255,0.09)",
    text: "#f5f0e4",
    textMuted: "rgba(245,240,228,0.58)",
    quoteColor: "#c9a84c",
    accent: "#c9a84c",
    accentText: "#1a1000",
    pinColor: "#c9a84c",
  },
  noir: {
    label: "Noir",
    scrim: "rgba(0,0,0,0.76)",
    panel: "rgba(8,8,8,0.60)",
    panelBorder: "rgba(255,255,255,0.09)",
    text: "#f2f2f2",
    textMuted: "rgba(242,242,242,0.55)",
    quoteColor: "#d0d0d0",
    accent: "#d0d0d0",
    accentText: "#111",
    pinColor: "#e0e0e0",
  },
  wine: {
    label: "Wine",
    scrim: "rgba(16,4,6,0.76)",
    panel: "rgba(22,6,8,0.60)",
    panelBorder: "rgba(255,255,255,0.09)",
    text: "#f5edee",
    textMuted: "rgba(245,237,238,0.58)",
    quoteColor: "#c06070",
    accent: "#c06070",
    accentText: "#fff",
    pinColor: "#c06070",
  },
  slate: {
    label: "Slate",
    scrim: "rgba(8,10,22,0.76)",
    panel: "rgba(12,14,30,0.60)",
    panelBorder: "rgba(255,255,255,0.09)",
    text: "#ebebf5",
    textMuted: "rgba(235,235,245,0.55)",
    quoteColor: "#7a9cd8",
    accent: "#7a9cd8",
    accentText: "#fff",
    pinColor: "#7a9cd8",
  },
};

// Scale body font for readability at all lengths, keeping social-share legibility
function bodyFontSize(len: number): number {
  if (len <= 60)  return 38;
  if (len <= 120) return 34;
  if (len <= 220) return 30;
  if (len <= 340) return 26;
  if (len <= 460) return 24;
  return 22;
}

const OPEN_PATH  = "M0 52V32.5C0 14.55 11.2 3.47 28 0l2.8 8.4C18.2 12.6 14 20.8 14 28h14v24H0Zm36 0V32.5C36 14.55 47.2 3.47 64 0l2.8 8.4C54.2 12.6 50 20.8 50 28h14v24H36Z";
const CLOSE_PATH = "M64 0v19.5C64 37.45 52.8 48.53 36 52l-2.8-8.4C45.8 39.4 50 31.2 50 24H36V0h28Zm-36 0v19.5C28 37.45 16.8 48.53 0 52l-2.8-8.4C9.8 39.4 14 31.2 14 24H0V0h28Z";

// Quote mark rendered size — large, matching inspo scale
const QW = 190, QH = 154;

type Props = { post: AnonymousPost; mapSnapshot?: string; themeKey?: string };

export const ShareCard = forwardRef<HTMLDivElement, Props>(
  function ShareCard({ post, mapSnapshot, themeKey = "forest" }, ref) {
    const theme = (CARD_THEMES[themeKey] ?? CARD_THEMES.forest)!;
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${post.id}`;
    const hasBody  = !!post.text?.trim();
    const hasSong  = !!post.music;
    const body     = hasBody ? post.text.trim() : "";

    return (
      <div
        ref={ref}
        style={{
          width: 1080, height: 1350,
          position: "relative",
          borderRadius: 40, overflow: "hidden",
          fontFamily: "var(--font-manrope), system-ui, sans-serif",
          background: "#0a1a0c",
        }}
      >
        {/* ── LAYER 1: Full-bleed map ── */}
        {mapSnapshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mapSnapshot} alt="" aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}

        {/* ── LAYER 2: Full-canvas dark scrim ── */}
        <div style={{ position: "absolute", inset: 0, background: theme.scrim }} />

        {/* ── LAYER 3: Corner quote marks — OUTSIDE glass panel, bleeding off canvas ── */}
        {/* Top-left opening quote — bleeds off top-left */}
        <svg
          aria-hidden="true"
          width={QW} height={QH}
          viewBox="0 0 64 52" fill="none"
          style={{
            position: "absolute",
            top: -24, left: -18,
            opacity: 0.90,
            pointerEvents: "none",
          }}
        >
          <path d={OPEN_PATH} fill={theme.quoteColor} />
        </svg>

        {/* Bottom-right closing quote — bleeds off bottom-right */}
        <svg
          aria-hidden="true"
          width={QW} height={QH}
          viewBox="0 0 64 52" fill="none"
          style={{
            position: "absolute",
            bottom: -24, right: -18,
            opacity: 0.90,
            pointerEvents: "none",
          }}
        >
          <path d={CLOSE_PATH} fill={theme.quoteColor} />
        </svg>

        {/* ── LAYER 4: "Sonder." brand top-right ── */}
        <div style={{
          position: "absolute", top: 56, right: 64,
          fontFamily: "var(--font-gilda), serif",
          fontSize: 30, letterSpacing: "-0.02em",
          color: theme.text, opacity: 0.80,
        }}>
          Sonder<span style={{ color: theme.accent }}>.</span>
        </div>

        {/* ── LAYER 5: Map pin — centered on canvas, above scrim ── */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          pointerEvents: "none",
          filter: `drop-shadow(0 0 20px ${theme.pinColor}cc)`,
        }}>
          <svg width="56" height="70" viewBox="0 0 56 70" fill="none">
            {/* Pulse ring */}
            <circle cx="28" cy="28" r="26" stroke={theme.pinColor} strokeWidth="2" opacity="0.30" />
            {/* Pin body */}
            <path d="M28 0C12.54 0 0 12.54 0 28c0 21 28 42 28 42S56 49 56 28C56 12.54 43.46 0 28 0z" fill={theme.pinColor}/>
            {/* Inner dot */}
            <circle cx="28" cy="28" r="10" fill={theme.accentText} opacity="0.92"/>
          </svg>
        </div>

        {/* ── LAYER 6: Glass content panel ── */}
        <div style={{
          position: "absolute",
          top: 112, left: 60, right: 60, bottom: 112,
          background: theme.panel,
          border: `1.5px solid ${theme.panelBorder}`,
          borderRadius: 28,
          display: "flex", flexDirection: "column",
          padding: "48px 60px",
          gap: 0,
          overflow: "hidden",
        }}>

          {/* Location */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.accent} style={{ flexShrink: 0 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
              </svg>
              <span style={{ fontSize: 26, fontWeight: 600, color: theme.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {post.placeName ?? "Unknown location"}
              </span>
            </div>
            <p style={{ fontFamily: "monospace", fontSize: 18, color: theme.textMuted, margin: "8px 0 0", letterSpacing: "0.06em" }}>
              {post.lat.toFixed(5)}, {post.lng.toFixed(5)}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "20px 0 28px" }} />

          {/* Title */}
          <h1 style={{
            fontFamily: "var(--font-gilda), serif",
            fontSize: 80, lineHeight: 1.06, letterSpacing: "-0.03em",
            color: theme.text, margin: "0 0 32px",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
            flexShrink: 0,
          }}>
            {post.title}
          </h1>

          {/* Body */}
          {hasBody && (
            <p style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: bodyFontSize(body.length), lineHeight: 1.68,
              color: theme.text, margin: "0 0 32px",
              display: "-webkit-box", WebkitLineClamp: 7, WebkitBoxOrient: "vertical", overflow: "hidden",
              flexShrink: 0,
            }}>
              {body}
            </p>
          )}

          {/* Song card */}
          {hasSong && post.music && (
            <div style={{
              display: "flex", alignItems: "center", gap: 20,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.11)",
              borderRadius: 18, padding: "18px 22px",
              flexShrink: 0,
            }}>
              {post.music.coverUrl ? (
                <div style={{ width: 70, height: 70, flexShrink: 0, borderRadius: 10, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.music.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ width: 70, height: 70, flexShrink: 0, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill={theme.textMuted}><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 26, fontWeight: 700, color: theme.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.music.title}</p>
                <p style={{ fontSize: 20, color: theme.textMuted, margin: "6px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.music.artist}</p>
              </div>
              <div style={{ width: 54, height: 54, flexShrink: 0, borderRadius: "50%", background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${theme.accent}66` }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={theme.accentText}><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />
        </div>

        {/* ── LAYER 7: QR — bottom-right, outside glass ── */}
        <div style={{
          position: "absolute", bottom: 52, right: 64,
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10,
          zIndex: 5,
        }}>
          <div style={{ background: "#ffffff", borderRadius: 12, padding: 12 }}>
            <ShareCardQR url={shareUrl} size={96} />
          </div>
          <p style={{ fontFamily: "var(--font-manrope), sans-serif", fontSize: 14, color: "rgba(255,255,255,0.50)", margin: 0, letterSpacing: "0.04em" }}>
            Scan to open confession
          </p>
        </div>
      </div>
    );
  },
);
