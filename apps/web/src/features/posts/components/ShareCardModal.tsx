"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { ShareCard, CARD_THEMES } from "./ShareCard";
import type { AnonymousPost } from "@/features/posts/lib/post-types";

function useTileSnapshot(lat: number, lng: number) {
  const [snap, setSnap] = useState<string | undefined>();
  useEffect(() => {
    const z = 16; // zoom 16 — street-level, shows the area clearly
    const x = Math.floor(((lng + 180) / 360) * 2 ** z);
    const latR = (lat * Math.PI) / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2 * 2 ** z);
    const canvas = document.createElement("canvas");
    canvas.width = 768; canvas.height = 768;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const subs = ["a", "b", "c"];
    let done = 0; let i = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const sub = subs[i++ % 3];
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `https://${sub}.tile.openstreetmap.org/${z}/${x + dx}/${y + dy}.png`;
        const px = (dx + 1) * 256, py = (dy + 1) * 256;
        img.onload = () => { ctx.drawImage(img, px, py, 256, 256); if (++done === 9) setSnap(canvas.toDataURL()); };
        img.onerror = () => { ctx.fillStyle = "#c8d0c0"; ctx.fillRect(px, py, 256, 256); if (++done === 9) setSnap(canvas.toDataURL()); };
      }
    }
  }, [lat, lng]);
  return snap;
}

export function ShareCardModal({ post, onClose }: { post: AnonymousPost; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [themeKey, setThemeKey] = useState("paper");
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<string | undefined>();
  const mapSnapshot = useTileSnapshot(post.lat, post.lng);

  // Re-render preview whenever theme or map changes
  useEffect(() => {
    if (!mapSnapshot || !cardRef.current) return;
    setPreview(undefined);
    const t = setTimeout(async () => {
      if (!cardRef.current) return;
      try {
        await toPng(cardRef.current, { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true });
        const url = await toPng(cardRef.current, { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true });
        setPreview(url);
      } catch { /* silently skip */ }
    }, 200);
    return () => clearTimeout(t);
  }, [mapSnapshot, themeKey]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await toPng(cardRef.current, { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true });
      const dataUrl = await toPng(cardRef.current, { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = `sonder-${post.id.slice(0, 8)}.png`;
      a.style.display = "none";
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 200);
    } catch (err) { console.error("Export failed", err); }
    finally { setExporting(false); }
  }, [post.id]);

  const modal = (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share card preview"
        style={{
          position: "fixed", zIndex: 9999,
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "min(96vw, 520px)",
          maxHeight: "95dvh",
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column", gap: 16,
          padding: 20, overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Share Card</span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ padding: 6, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}>
            <X size={16} />
          </button>
        </div>

        {/* Colour picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>Style</span>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(CARD_THEMES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                title={t.label}
                onClick={() => setThemeKey(key)}
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: t.panel.replace(/[\d.]+\)$/, "1)"),
                  border: themeKey === key ? `3px solid ${t.accent}` : `2px solid rgba(255,255,255,0.15)`,
                  cursor: "pointer", outline: "none",
                  boxShadow: themeKey === key ? `0 0 0 2px ${t.accent}66` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, overflowY: "auto", borderRadius: 12, background: "rgba(0,0,0,0.04)", minHeight: 320 }}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Share card preview" style={{ width: "100%", borderRadius: 12, display: "block" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1080/1350", gap: 10, opacity: 0.5, fontSize: 14 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              Generating…
            </div>
          )}
        </div>

        {/* Download button */}
        <Button
          onClick={() => void handleDownload()}
          disabled={exporting || !preview}
          className="h-11 w-full rounded-xl"
        >
          <Download className="mr-2 size-4" />
          {exporting ? "Exporting…" : "Download PNG"}
        </Button>
      </div>

      {/* Offscreen card */}
      <div aria-hidden style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, pointerEvents: "none" }}>
        <ShareCard ref={cardRef} post={post} mapSnapshot={mapSnapshot} themeKey={themeKey} />
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
