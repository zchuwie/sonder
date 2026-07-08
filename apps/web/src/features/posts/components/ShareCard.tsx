"use client";

import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { ShareCardQR } from "./ShareCardQR";

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
  divider: string;
  songBg: string;
  songBorder: string;
};

export const CARD_THEMES: Record<string, CardTheme> = {
  paper: {
    label: "Paper",
    scrim: "rgba(243,237,228,0.38)",
    panel: "rgba(248,244,237,0.94)",
    panelBorder: "rgba(0,0,0,0.08)",
    text: "#2a2722",
    textMuted: "rgba(42,39,34,0.55)",
    quoteColor: "#b9c39f",
    accent: "#5f7d3f",
    accentText: "#ffffff",
    pinColor: "#5f7d3f",
    divider: "rgba(0,0,0,0.10)",
    songBg: "rgba(0,0,0,0.04)",
    songBorder: "rgba(0,0,0,0.08)",
  },
  forest: {
    label: "Forest",
    scrim: "rgba(12,28,14,0.80)",
    panel: "rgba(16,32,18,0.62)",
    panelBorder: "rgba(255,255,255,0.10)",
    text: "#eef0e6",
    textMuted: "rgba(238,240,230,0.60)",
    quoteColor: "#a8ba63",
    accent: "#a8ba63",
    accentText: "#0f1c14",
    pinColor: "#a8ba63",
    divider: "rgba(255,255,255,0.12)",
    songBg: "rgba(255,255,255,0.08)",
    songBorder: "rgba(255,255,255,0.11)",
  },
  ink: {
    label: "Ink",
    scrim: "rgba(20,22,38,0.82)",
    panel: "rgba(26,28,46,0.64)",
    panelBorder: "rgba(255,255,255,0.10)",
    text: "#e8e9f2",
    textMuted: "rgba(232,233,242,0.58)",
    quoteColor: "#8fa0d8",
    accent: "#8fa0d8",
    accentText: "#15172a",
    pinColor: "#8fa0d8",
    divider: "rgba(255,255,255,0.12)",
    songBg: "rgba(255,255,255,0.08)",
    songBorder: "rgba(255,255,255,0.11)",
  },
  blush: {
    label: "Blush",
    scrim: "rgba(247,238,240,0.38)",
    panel: "rgba(250,243,245,0.94)",
    panelBorder: "rgba(0,0,0,0.07)",
    text: "#3a2c30",
    textMuted: "rgba(58,44,48,0.55)",
    quoteColor: "#d9b9c2",
    accent: "#b06b7d",
    accentText: "#ffffff",
    pinColor: "#b06b7d",
    divider: "rgba(0,0,0,0.09)",
    songBg: "rgba(0,0,0,0.035)",
    songBorder: "rgba(0,0,0,0.07)",
  },
  sage: {
    label: "Sage",
    scrim: "rgba(233,240,233,0.38)",
    panel: "rgba(240,245,240,0.94)",
    panelBorder: "rgba(0,0,0,0.07)",
    text: "#283028",
    textMuted: "rgba(40,48,40,0.55)",
    quoteColor: "#b4cbb4",
    accent: "#5f7d3f",
    accentText: "#ffffff",
    pinColor: "#5f7d3f",
    divider: "rgba(0,0,0,0.09)",
    songBg: "rgba(0,0,0,0.035)",
    songBorder: "rgba(0,0,0,0.07)",
  },
};

function bodyFontSize(len: number): number {
  if (len <= 60) return 42;
  if (len <= 120) return 38;
  if (len <= 220) return 34;
  if (len <= 340) return 30;
  if (len <= 460) return 28;
  return 26;
}

const OPEN_PATH = "M0 52V32.5C0 14.55 11.2 3.47 28 0l2.8 8.4C18.2 12.6 14 20.8 14 28h14v24H0Zm36 0V32.5C36 14.55 47.2 3.47 64 0l2.8 8.4C54.2 12.6 50 20.8 50 28h14v24H36Z";
const CLOSE_PATH = "M64 0v19.5C64 37.45 52.8 48.53 36 52l-2.8-8.4C45.8 39.4 50 31.2 50 24H36V0h28Zm-36 0v19.5C28 37.45 16.8 48.53 0 52l-2.8-8.4C9.8 39.4 14 31.2 14 24H0V0h28Z";

const QW = 160, QH = 130;

// Native size of the captured map snapshot (square canvas).
const MAP_SOURCE_SIZE = 768;

// Fixed CSS position (in card px) where the overlay pin SVG sits — the
// snapshot must be scaled/shifted so pinOffset lands exactly here.
const PIN_TARGET_X = 540; // horizontal centre of the 1080px-wide card
const PIN_TARGET_Y = 170; // vertical centre of the 340px map strip

// Tiny multiplier applied on top of the mathematically-required scale, to
// absorb sub-pixel rounding only — NOT a substitute for correct math.
const ROUNDING_BUFFER = 1.02;

type Props = {
  post: AnonymousPost;
  mapSnapshot?: string;
  pinOffset?: { x: number; y: number };
  themeKey?: string;
  fullPlaceName?: string;
};

/**
 * Dynamic-height share card (width fixed at 1080).
 * Layout: map area (420px) → glass panel (grows with content) → footer (QR + image).
 * The card grows taller when content is long — no clipping, no cramping.
 *
 * Map background handling:
 * - Always uses longhand `backgroundImage`/`backgroundColor` (never the
 *   `background` shorthand), so React never races shorthand vs. longhand
 *   and accidentally reintroduces tiling/repeat.
 * - The scale is solved so that, simultaneously: (a) the pin pixel in the
 *   source snapshot lands exactly under the fixed overlay pin position,
 *   and (b) the scaled image fully covers the card in every direction.
 *   Because both constraints are satisfied by the scale itself, no
 *   after-the-fact offset clamping is needed — clamping was the bug last
 *   time, since it silently dragged the crop away from the real pin
 *   location whenever the card got tall.
 */
export const ShareCard = forwardRef<HTMLDivElement, Props>(
  function ShareCard({ post, mapSnapshot, pinOffset, themeKey = "paper", fullPlaceName }, ref) {
    const theme = (CARD_THEMES[themeKey] ?? CARD_THEMES.paper)!;
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${post.id}`;
    const hasBody = !!post.text?.trim();
    const hasSong = !!post.music;
    const hasImage = !!post.imageUrl;
    const body = hasBody ? post.text.trim() : "";
    const locationLabel = fullPlaceName || post.placeName || "Unknown location";

    // Track the card's own rendered height so the map background can
    // always be sized to fully cover it, however tall content makes it grow.
    const innerRef = useRef<HTMLDivElement>(null);
    const [cardHeight, setCardHeight] = useState(1080);

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const measure = () => setCardHeight(el.offsetHeight);
      measure();

      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
      // Re-measure whenever content that affects height changes.
    }, [post.text, post.title, post.imageUrl, post.music, hasBody, hasImage, hasSong]);

    // --- Solve for the scale that satisfies pin-alignment + full coverage ---
    const containerW = 1080;
    const containerH = Math.max(cardHeight, 1);

    const pinX = pinOffset?.x ?? MAP_SOURCE_SIZE / 2;
    const pinY = pinOffset?.y ?? MAP_SOURCE_SIZE / 2;

    // Avoid divide-by-zero for pins sitting exactly on a source edge.
    const EPS = 1;
    const safe = (n: number) => Math.max(n, EPS);

    // Minimum scale needed so the image reaches each edge of the card
    // while the pin still lands exactly at (PIN_TARGET_X, PIN_TARGET_Y).
    const scaleForLeft = PIN_TARGET_X / safe(pinX);
    const scaleForRight = (containerW - PIN_TARGET_X) / safe(MAP_SOURCE_SIZE - pinX);
    const scaleForTop = PIN_TARGET_Y / safe(pinY);
    const scaleForBottom = (containerH - PIN_TARGET_Y) / safe(MAP_SOURCE_SIZE - pinY);

    // Also never scale below what's needed to simply cover the container,
    // as a base floor (covers the degenerate case of missing pinOffset).
    const scaleForCoverage = Math.max(containerW, containerH) / MAP_SOURCE_SIZE;

    const mapScale =
      Math.max(scaleForLeft, scaleForRight, scaleForTop, scaleForBottom, scaleForCoverage) *
      ROUNDING_BUFFER;

    const mapBgSize = MAP_SOURCE_SIZE * mapScale;
    const offsetX = PIN_TARGET_X - pinX * mapScale;
    const offsetY = PIN_TARGET_Y - pinY * mapScale;

    return (
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        style={{
          width: 1080,
          position: "relative",
          borderRadius: 40,
          overflow: "hidden",
          fontFamily: "var(--font-manrope), system-ui, sans-serif",
          backgroundColor: "#0a1a0c",
          backgroundImage: mapSnapshot ? `url(${mapSnapshot})` : undefined,
          backgroundSize: mapSnapshot ? `${mapBgSize}px ${mapBgSize}px` : undefined,
          backgroundPosition: mapSnapshot ? `${offsetX}px ${offsetY}px` : undefined,
          backgroundRepeat: "no-repeat",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: theme.scrim }} />

        {/* Grain texture */}
        <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none" }}>
          <filter id="sc-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#sc-grain)" />
        </svg>

        {/* ── MAP AREA — visible map with pin ── */}
        <div style={{ position: "relative", width: "100%", height: 340, flexShrink: 0, zIndex: 1 }}>
          {/* Opening quote */}
          <svg aria-hidden="true" width={QW} height={QH} viewBox="0 0 64 52" fill="none"
            style={{ position: "absolute", top: -14, left: -10, opacity: 0.85, pointerEvents: "none" }}>
            <path d={OPEN_PATH} fill={theme.quoteColor} />
          </svg>

          {/* Sonder brand */}
          <div style={{
            position: "absolute", top: 44, right: 56,
            fontFamily: "var(--font-gilda), serif",
            fontSize: 48, letterSpacing: "-0.02em",
            color: theme.text, opacity: 0.85,
          }}>
            Sonder<span style={{ color: theme.accent }}>.</span>
          </div>

          {/* Map pin — centred in map area (exactly where the location is) */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
            filter: `drop-shadow(0 0 14px ${theme.pinColor}cc)`,
          }}>
            <svg width="48" height="60" viewBox="0 0 56 70" fill="none">
              <circle cx="28" cy="28" r="26" stroke={theme.pinColor} strokeWidth="2" opacity="0.30" />
              <path d="M28 0C12.54 0 0 12.54 0 28c0 21 28 42 28 42S56 49 56 28C56 12.54 43.46 0 28 0z" fill={theme.pinColor} />
              <circle cx="28" cy="28" r="10" fill={theme.accentText} opacity="0.92" />
            </svg>
          </div>
        </div>

        {/* ── GLASS CONTENT PANEL — grows naturally with content ── */}
        <div style={{
          position: "relative",
          margin: "-28px 48px 0",
          background: theme.panel,
          border: `1.5px solid ${theme.panelBorder}`,
          borderRadius: 28,
          padding: "44px 56px",
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
        }}>
          {/* Location */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.accent} style={{ flexShrink: 0 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              <span style={{ fontSize: 24, fontWeight: 600, color: theme.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {locationLabel}
              </span>
            </div>
            <p style={{ fontFamily: "monospace", fontSize: 16, color: theme.textMuted, margin: "6px 0 0", letterSpacing: "0.06em" }}>
              {post.lat.toFixed(5)}, {post.lng.toFixed(5)}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: theme.divider, margin: "18px 0 24px" }} />

          {/* Title — clamped to 3 lines for social-media-friendly size */}
          <h1 style={{
            fontFamily: "var(--font-gilda), serif",
            fontSize: 72, lineHeight: 1.1, letterSpacing: "-0.03em",
            color: theme.text, margin: "0 0 24px", wordBreak: "break-word",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {post.title}
          </h1>

          {/* Body — clamped to keep card compact */}
          {hasBody && (
            <p style={{
              fontFamily: "var(--font-manrope), sans-serif",
              fontSize: bodyFontSize(body.length), lineHeight: 1.65,
              color: theme.text, margin: "0 0 24px", wordBreak: "break-word",
              display: "-webkit-box", WebkitLineClamp: 8, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {body}
            </p>
          )}

          {/* Image — capped height */}
          {hasImage && (
            <div style={{
              marginBottom: 24,
              borderRadius: 16, overflow: "hidden",
              boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imageUrl!} alt="" style={{ width: "100%", height: "auto", maxHeight: 360, objectFit: "cover", display: "block" }} />
            </div>
          )}

          {/* Song card */}
          {hasSong && post.music && (
            <div style={{
              display: "flex", alignItems: "center", gap: 20,
              background: theme.songBg,
              border: `1px solid ${theme.songBorder}`,
              borderRadius: 18, padding: "18px 22px",
            }}>
              {post.music.coverUrl ? (
                <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 10, overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.music.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 10, background: theme.songBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill={theme.textMuted}><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: theme.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.music.title}</p>
                <p style={{ fontSize: 18, color: theme.textMuted, margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.music.artist}</p>
              </div>
              <div style={{ width: 50, height: 50, flexShrink: 0, borderRadius: "50%", background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${theme.accent}66` }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={theme.accentText}><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER — QR right-aligned, closing quote behind it ── */}
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: "32px 56px 44px",
          zIndex: 2,
        }}>
          {/* Closing quote — bottom-right, behind QR */}
          <svg aria-hidden="true" width={QW} height={QH} viewBox="0 0 64 52" fill="none"
            style={{ position: "absolute", bottom: 10, right: 24, opacity: 0.85, pointerEvents: "none" }}>
            <path d={CLOSE_PATH} fill={theme.quoteColor} />
          </svg>

          {/* QR — sits above the quote */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ background: "#ffffff", borderRadius: 12, padding: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
              <ShareCardQR url={shareUrl} size={96} />
            </div>
            <p style={{ fontFamily: "var(--font-manrope), sans-serif", fontSize: 13, color: theme.textMuted, margin: 0, letterSpacing: "0.04em" }}>
              Scan to open confession
            </p>
          </div>
        </div>
      </div>
    );
  },
);