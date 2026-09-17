"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Navigation, Plus, Minus, ZoomOut } from "lucide-react";
import type { MapActions } from "./MapCanvas";

export function MapFloatingControls({
  mapActions,
  nearbyCount,
  onNearbyClick,
  onResetZoom,
  showZoomOut = false,
}: {
  mapActions: MapActions | null;
  nearbyCount?: number;
  onNearbyClick?: () => void;
  onResetZoom?: () => void;
  showZoomOut?: boolean;
}) {
  const [is3D, setIs3D] = useState(true);

  const handleToggle3D = () => {
    if (!mapActions) return;
    const active = mapActions.toggle3D();
    setIs3D(active);
  };

  const handleResetNorth = () => {
    mapActions?.resetNorth();
  };

  return (
    <div className="flex flex-col items-center gap-2 pointer-events-auto">

      {/* Nearby Explore Button */}
      {onNearbyClick && (
        <button
          type="button"
          aria-label="Explore nearby thoughts"
          onClick={onNearbyClick}
          className="relative flex size-11 items-center justify-center rounded-full border border-black/10 bg-background/95 text-foreground/80 shadow-lg backdrop-blur-md transition-all duration-200 hover:text-foreground active:scale-95 dark:border-white/10"
        >
          <Compass className="size-5" />
          {nearbyCount !== undefined && nearbyCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-xs">
              {nearbyCount}
            </span>
          )}
        </button>
      )}

      {/* 3D Mode Toggle */}
      <button
        type="button"
        aria-label="Toggle 3D View"
        onClick={handleToggle3D}
        className={`flex size-11 items-center justify-center rounded-full border text-xs font-bold shadow-lg backdrop-blur-md transition-all duration-200 active:scale-95 ${
          is3D
            ? "border-primary/40 bg-primary/15 text-primary ring-2 ring-primary/30"
            : "border-black/10 bg-background/95 text-foreground/80 hover:text-foreground dark:border-white/10"
        }`}
      >
        3D
      </button>

      {/* Compass / Reset North Button */}
      <button
        type="button"
        aria-label="Reset North"
        onClick={handleResetNorth}
        className="flex size-11 items-center justify-center rounded-full border border-black/10 bg-background/95 text-foreground/80 shadow-lg backdrop-blur-md transition-all duration-200 hover:text-foreground active:scale-95 dark:border-white/10"
      >
        <Navigation className="size-4.5" />
      </button>

      {/* Bottom controls: Zoom capsule in the toolbar + dynamic bouncing zoom-out button in the green theme */}
      <div className="relative flex items-end justify-end">
        {/* Dynamic Zoom Out Bouncing Button (equal in bottom, green theme, comfortable gap from - +) */}
        <AnimatePresence>
          {showZoomOut && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.3, x: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: [0, -10, 0, -4, 0, 0],
              }}
              exit={{ opacity: 0, scale: 0.3, x: 20 }}
              transition={{
                y: {
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                },
                default: {
                  type: "spring",
                  stiffness: 420,
                  damping: 22,
                },
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Zoom out to overview"
              title="Zoom out to overview"
              onClick={() => {
                if (onResetZoom) {
                  onResetZoom();
                } else {
                  mapActions?.zoomToOverview?.();
                }
              }}
              className="absolute bottom-0 right-20 hidden sm:flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl ring-4 ring-primary/25 transition-colors hover:bg-primary-hover active:scale-95"
            >
              <ZoomOut className="size-5.5 stroke-[2.2]" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Zoom In & Out Capsule */}
        <div className="flex flex-col items-center overflow-hidden rounded-2xl border border-black/10 bg-background/95 shadow-lg backdrop-blur-md">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => mapActions?.zoomIn()}
            className="flex size-11 items-center justify-center text-foreground/80 transition-colors hover:bg-muted/50 hover:text-foreground active:scale-95"
          >
            <Plus className="size-5" />
          </button>
          <div className="h-px w-6 bg-black/10" />
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => mapActions?.zoomOut()}
            className="flex size-11 items-center justify-center text-foreground/80 transition-colors hover:bg-muted/50 hover:text-foreground active:scale-95"
          >
            <Minus className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
