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
  const [pinOffset, setPinOffset] = useState<{ x: number; y: number } | undefined>();

  useEffect(() => {
    const z = 16;
    const scale = 2 ** z;
    const cx = Math.floor(((lng + 180) / 360) * scale);
    const latR = (lat * Math.PI) / 180;
    const cy = Math.floor(((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * scale);

    // Exact pixel of (lat,lng) within the 768×768 canvas (top-left tile = cx-1,cy-1)
    const exactX = ((lng + 180) / 360) * scale;
    const exactY = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * scale;
    setPinOffset({ x: (exactX - (cx - 1)) * 256, y: (exactY - (cy - 1)) * 256 });

    const canvas = document.createElement("canvas");
    canvas.width = 768; canvas.height = 768;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const subs = ["a", "b", "c"];
    let done = 0, i = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const sub = subs[i++ % 3];
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `https://${sub}.tile.openstreetmap.org/${z}/${cx + dx}/${cy + dy}.png`;
        const px = (dx + 1) * 256, py = (dy + 1) * 256;
        img.onload = () => { ctx.drawImage(img, px, py, 256, 256); if (++done === 9) setSnap(canvas.toDataURL()); };
        img.onerror = () => { ctx.fillStyle = "#c8d0c0"; ctx.fillRect(px, py, 256, 256); if (++done === 9) setSnap(canvas.toDataURL()); };
      }
    }
  }, [lat, lng]);
  return { snap, pinOffset };
}

export function ShareCardModal({ post, onClose }: { post: AnonymousPost; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [themeKey, setThemeKey] = useState("paper");
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<string | undefined>();
  const [fullPlaceName, setFullPlaceName] = useState<string | undefined>();
  const { snap: mapSnapshot, pinOffset } = useTileSnapshot(post.lat, post.lng);

  // Reverse geocode for full location label
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${post.lat}&lon=${post.lng}&format=json&zoom=16&addressdetails=1`,
      { signal: ctrl.signal, headers: { "Accept-Language": "en" } },
    )
      .then((r) => r.json())
      .then((data) => {
        const a = data?.address;
        if (!a) return;
        const parts = [
          a.road || a.pedestrian || a.neighbourhood || post.placeName,
          a.city || a.town || a.village || a.municipality || a.county,
          a.country,
        ].filter(Boolean);
        if (parts.length > 0) setFullPlaceName(parts.join(", "));
      })
      .catch(() => { /* ignore */ });
    return () => ctrl.abort();
  }, [post.lat, post.lng, post.placeName]);

  // Render preview — dynamic height from actual card element
  useEffect(() => {
    if (!mapSnapshot || !pinOffset || !cardRef.current) return;
    setPreview(undefined);
    const t = setTimeout(async () => {
      if (!cardRef.current) return;
      const w = 1080;
      const h = cardRef.current.offsetHeight || 1350;
      try {
        // Double render for font loading
        await toPng(cardRef.current, { width: w, height: h, pixelRatio: 1, cacheBust: true });
        const url = await toPng(cardRef.current, { width: w, height: h, pixelRatio: 1, cacheBust: true });
        setPreview(url);
      } catch { /* silently skip */ }
    }, 300);
    return () => clearTimeout(t);
  }, [mapSnapshot, pinOffset, themeKey, fullPlaceName]);

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
      const w = 1080;
      const h = cardRef.current.offsetHeight || 1350;
      await toPng(cardRef.current, { width: w, height: h, pixelRatio: 1, cacheBust: true });
      const dataUrl = await toPng(cardRef.current, { width: w, height: h, pixelRatio: 1, cacheBust: true });
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
        <div style={{ flex: 1, overflowY: "auto", borderRadius: 12, background: "rgba(0,0,0,0.04)", minHeight: 280 }}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Share card preview" style={{ width: "100%", borderRadius: 12, display: "block" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 10, opacity: 0.5, fontSize: 14 }}>
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

      {/* Offscreen card — full size for measurement */}
      <div aria-hidden style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, pointerEvents: "none" }}>
        <ShareCard ref={cardRef} post={post} mapSnapshot={mapSnapshot} pinOffset={pinOffset} themeKey={themeKey} fullPlaceName={fullPlaceName} />
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
