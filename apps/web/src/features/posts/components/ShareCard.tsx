"use client";

import { forwardRef } from "react";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { ShareCardQR } from "./ShareCardQR";

// ponytail: clamp body to fit card. 500 chars can span ~8 lines at 24px.
// We show first 180 chars + ellipsis if over limit — enough for context without overflow.
const BODY_LIMIT = 180;
function clampBody(text: string): string {
  if (!text || text.length <= BODY_LIMIT) return text;
  return text.slice(0, BODY_LIMIT).trimEnd() + "…";
}

export const ShareCard = forwardRef<HTMLDivElement, { post: AnonymousPost; mapSnapshot?: string }>(
  function ShareCard({ post, mapSnapshot }, ref) {
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${post.id}`;
    const hasImage = !!post.imageUrl;
    const hasSong = !!post.music;
    const hasBody = !!post.text?.trim();
    const bodyText = hasBody ? clampBody(post.text) : "";
    const mapHeight = hasSong ? 340 : hasBody ? 380 : 520;

    return (
      <div
        ref={ref}
        style={{ width: 1080, height: 1350, fontSize: 16, borderRadius: 40, overflow: "hidden" }}
        className="relative flex flex-col bg-[#0f1c14] text-[#f5f1e8]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-[60px] pt-[52px]">
          <svg width="56" height="46" viewBox="0 0 64 52" fill="none">
            <path d="M0 52V32.5C0 14.55 11.2 3.47 28 0l2.8 8.4C18.2 12.6 14 20.8 14 28h14v24H0Zm36 0V32.5C36 14.55 47.2 3.47 64 0l2.8 8.4C54.2 12.6 50 20.8 50 28h14v24H36Z" fill="#a8ba63" />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/sonder-logo.png" alt="Sonder" style={{ width: 68, height: 68 }} />
        </div>

        {/* Title */}
        <div className="px-[60px] pt-[36px]">
          <h1
            style={{ fontFamily: "var(--font-gilda), serif", fontSize: 52, lineHeight: 1.15, letterSpacing: "-0.02em", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {post.title}
          </h1>
        </div>

        {/* Location + coordinates */}
        <div className="px-[60px] pt-[18px]">
          <div className="flex items-center gap-[10px]" style={{ fontSize: 22 }}>
            {/* Pin icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#a8ba63" style={{ flexShrink: 0 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
            </svg>
            <span style={{ color: "#a8ba63", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {post.placeName ?? "Unknown location"}
            </span>
          </div>
          <p style={{ fontSize: 16, color: "#4a6050", marginTop: 6, fontFamily: "monospace" }}>
            {post.lat.toFixed(5)}, {post.lng.toFixed(5)}
          </p>
        </div>

        {/* Map */}
        <div
          style={{ margin: "28px 60px 0", height: mapHeight, borderRadius: 28, overflow: "hidden", border: "2px solid rgba(168,186,99,0.2)", position: "relative" }}
        >
          {mapSnapshot ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mapSnapshot} alt="Map" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

              {/* Centre pin on map */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -100%)", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))" }}>
                <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
                  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#137818"/>
                  <circle cx="18" cy="18" r="7" fill="white"/>
                </svg>
              </div>

              {/* Photo overlay bottom-right on map */}
              {hasImage && post.imageUrl && (
                <div style={{ position: "absolute", bottom: 16, right: 16, width: 170, height: 170, borderRadius: 20, overflow: "hidden", border: "3px solid rgba(255,255,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              {/* CD overlay when song but no image */}
              {hasSong && !hasImage && post.music?.coverUrl && (
                <div style={{ position: "absolute", bottom: 16, right: 16, width: 130, height: 130, borderRadius: "50%", overflow: "hidden", border: "4px solid rgba(168,186,99,0.5)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", transform: "rotate(-8deg)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.music.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0f1c14", border: "4px solid rgba(168,186,99,0.6)" }} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", background: "#122018", color: "#657067", fontSize: 18 }}>
              Loading map…
            </div>
          )}
        </div>

        {/* Body (clamped to 180 chars) */}
        {hasBody && (
          <div style={{ padding: "24px 60px 0" }}>
            <p style={{ fontSize: 23, lineHeight: 1.65, color: "#c8cfc4" }}>
              {bodyText}
            </p>
          </div>
        )}

        {/* Song card */}
        {hasSong && post.music && (
          <div style={{ margin: "24px 60px 0", display: "flex", alignItems: "center", gap: 20, borderRadius: 22, background: "#1a2e20", padding: 22 }}>
            {post.music.coverUrl && (
              <div style={{ width: 76, height: 76, flexShrink: 0, borderRadius: 14, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.music.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 21, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.music.title}</p>
              <p style={{ fontSize: 17, color: "#8a9a82", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 4 }}>{post.music.artist}</p>
              {/* Progress bar */}
              <div style={{ marginTop: 12, height: 4, width: "100%", borderRadius: 9999, background: "#2a3e2e", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "35%", borderRadius: 9999, background: "#a8ba63" }} />
              </div>
            </div>
            {/* Play button */}
            <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: "50%", background: "#a8ba63", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(168,186,99,0.4)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#0f1c14">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 60px 52px" }}>
          <div>
            <p style={{ fontFamily: "var(--font-gilda), serif", fontSize: 30, letterSpacing: "-0.02em" }}>
              Sonder<span style={{ color: "#a8ba63" }}>.</span>
            </p>
            <p style={{ fontSize: 14, color: "#657067", marginTop: 4 }}>Anonymous thoughts pinned to places</p>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
            <svg width="44" height="36" viewBox="0 0 64 52" fill="none" style={{ opacity: 0.5 }}>
              <path d="M64 0v19.5C64 37.45 52.8 48.53 36 52l-2.8-8.4C45.8 39.4 50 31.2 50 24H36V0h28Zm-36 0v19.5C28 37.45 16.8 48.53 0 52l-2.8-8.4C9.8 39.4 14 31.2 14 24H0V0h28Z" fill="#a8ba63" />
            </svg>
            <ShareCardQR url={shareUrl} size={96} />
          </div>
        </div>
      </div>
    );
  },
);
