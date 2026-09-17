"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Home,
  Landmark,
  Loader2,
  MapPin,
  Search,
  Store,
  Utensils,
  X,
} from "lucide-react";
import { usePlaceSearch } from "@/features/map/client/use-place-search";
import type { LocationPlaceDTO } from "@/features/map/lib/location-types";
import type {
  PlaceSearchResult,
  SearchCenter,
} from "@/features/map/lib/place-search-types";

const PAGE_SIZE = 6;
const RECENT_KEY = "sonder:recent-searches";
const MAX_RECENT = 6;

function loadRecent(): PlaceSearchResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as PlaceSearchResult[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(place: PlaceSearchResult): void {
  try {
    const previous = loadRecent().filter((item) => item.id !== place.id);
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify([place, ...previous].slice(0, MAX_RECENT)),
    );
  } catch {
    // Recent searches are optional when browser storage is unavailable.
  }
}

function removeRecent(id: string): PlaceSearchResult[] {
  try {
    const next = loadRecent().filter((item) => item.id !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

function toLocationPlace(place: PlaceSearchResult): LocationPlaceDTO {
  return {
    id: place.id,
    name: place.name,
    category: place.category ?? "Place",
    address: place.label,
    description: place.label,
    tags: [place.type, place.category].filter(Boolean) as string[],
    lat: place.lat,
    lng: place.lng,
    provider: place.provider,
    bbox: place.bbox,
  };
}

function PlaceIcon({ category }: { category: string }) {
  const value = category.toLowerCase();
  if (/restaurant|food|cafe|bar|pub|bakery|coffee/.test(value))
    return <Utensils className="size-4" />;
  if (/hospital|clinic|doctor|medical|health/.test(value))
    return <Building2 className="size-4" />;
  if (/school|university|college|education|academic|hall/.test(value))
    return <Building2 className="size-4" />;
  if (/park|garden|nature|forest|beach|river/.test(value))
    return <Landmark className="size-4" />;
  if (/shop|mall|store|market|retail/.test(value))
    return <Store className="size-4" />;
  if (/station|airport|bus|train|transit|metro|ferry/.test(value))
    return <MapPin className="size-4" />;
  if (/hotel|hostel|motel|lodging|dorm|home|house/.test(value))
    return <Home className="size-4" />;
  return <Building2 className="size-4" />;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const index = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <span className="font-bold text-primary">
        {text.slice(index, index + query.trim().length)}
      </span>
      {text.slice(index + query.trim().length)}
    </>
  );
}

type Props = {
  onPlaceSelect: (place: LocationPlaceDTO) => void;
  center?: SearchCenter;
  initialQuery?: string;
  disableRecent?: boolean;
  onClear?: () => void;
};

export function MapSearchBar({
  onPlaceSelect,
  center,
  initialQuery,
  disableRecent,
  onClear,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<PlaceSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { results, loading, hasSearched, rateLimited } = usePlaceSearch({
    query,
    centerLat: center?.lat,
    centerLng: center?.lng,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const justSelected = useRef(false);

  useEffect(() => {
    setMounted(true);
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (document.activeElement !== inputRef.current && document.activeElement !== mobileInputRef.current) {
      setQuery(initialQuery ?? "");
      if (!initialQuery) setOpen(false);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (!disableRecent) setRecent(loadRecent());
  }, [disableRecent, open]);

  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    const isActive =
      document.activeElement === inputRef.current ||
      document.activeElement === mobileInputRef.current;
    if (!isActive) return;
    if (query.trim().length >= 2 || (isMobile && open)) setOpen(true);
    setPage(1);
    setActiveIndex(-1);
  }, [query, isMobile, open]);

  useEffect(() => {
    if (open && isMobile) {
      // Focus mobile input smoothly after opening
      const timer = setTimeout(() => mobileInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open, isMobile]);

  useEffect(() => {
    const close = (event: MouseEvent | TouchEvent) => {
      if (!isMobile && !containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close as EventListener);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close as EventListener);
    };
  }, [isMobile]);

  const showRecent = !disableRecent && !query.trim() && recent.length > 0;
  const displayList = showRecent ? recent : results;
  const visible = displayList.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < displayList.length;

  const mobileSentinelRef = useRef<HTMLDivElement>(null);
  const desktopSentinelRef = useRef<HTMLLIElement>(null);

  // IntersectionObserver for seamless endless scroll pagination
  useEffect(() => {
    if (!hasMore || !open) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "140px" },
    );

    const mTarget = mobileSentinelRef.current;
    const dTarget = desktopSentinelRef.current;
    if (mTarget) observer.observe(mTarget);
    if (dTarget) observer.observe(dTarget);

    return () => {
      if (mTarget) observer.unobserve(mTarget);
      if (dTarget) observer.unobserve(dTarget);
    };
  }, [hasMore, visible.length, isMobile, open]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 120 && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const selectPlace = (place: PlaceSearchResult) => {
    onPlaceSelect(toLocationPlace(place));
    saveRecent(place);
    setRecent(loadRecent());
    setQuery(place.name);
    setOpen(false);
    justSelected.current = true;
    inputRef.current?.blur();
  };

  const handleDeleteRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = removeRecent(id);
    setRecent(next);
  };

  const handleClearAllRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
    setRecent([]);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, visible.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = visible[activeIndex >= 0 ? activeIndex : 0];
      if (target) selectPlace(target);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Standard Bar (shown on map and desktop) */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <Search className="size-4 text-muted-foreground" />
          )}
        </span>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-label="Search locations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (justSelected.current) return;
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          placeholder="Search places, landmarks, or thoughts..."
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-full rounded-full border border-black/10 bg-background/95 py-2.5 pl-10 pr-9 text-sm shadow-md shadow-black/5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 backdrop-blur-md dark:border-white/10"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery("");
              onClear?.();
              inputRef.current?.focus();
            }}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* MOBILE FULL-SCREEN SEARCH OVERLAY (Matches Mobile Map UI) */}
      {mounted && isMobile && open &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex flex-col bg-background pointer-events-auto">
            {/* Top Search Bar Row */}
            <div className="flex items-center gap-2.5 border-b border-border/50 px-3 py-3 shadow-xs">
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setOpen(false)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground/80 transition-transform hover:bg-muted active:scale-90"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="relative flex-1">
                <input
                  ref={mobileInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search places, landmarks, or thoughts..."
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full rounded-full border-2 border-primary bg-background px-4 pr-10 text-sm font-medium outline-none transition focus:ring-2 focus:ring-primary/20"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label="Clear query"
                    onClick={() => {
                      setQuery("");
                      onClear?.();
                      mobileInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : loading ? (
                  <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
                ) : null}
              </div>
            </div>

            {/* Content List Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4" onScroll={handleScroll}>
              {/* RECENT SEARCHES */}
              {showRecent && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    <span>Recent searches</span>
                    <button
                      type="button"
                      onClick={handleClearAllRecent}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="divide-y divide-border/40">
                    {recent.map((place) => (
                      <div
                        key={place.id}
                        className="flex items-center justify-between py-3 transition active:bg-muted/40"
                      >
                        <button
                          type="button"
                          onClick={() => selectPlace(place)}
                          className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
                        >
                          <span className="text-muted-foreground shrink-0">
                            <PlaceIcon category={place.category ?? "Place"} />
                          </span>
                          <span className="truncate text-sm font-medium text-foreground">
                            {place.name}
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${place.name}`}
                          onClick={(e) => handleDeleteRecent(place.id, e)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEARCH RESULTS */}
              {!showRecent && (
                <div>
                  {hasSearched && !loading && results.length === 0 && (
                    <div className="px-4 py-12 text-center text-muted-foreground">
                      {rateLimited ? (
                        <>
                          <p className="text-sm font-semibold text-foreground">Too many requests</p>
                          <p className="mt-1 text-xs">Try again in a moment.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-foreground">No places found</p>
                          <p className="mt-1 text-xs">Try searching for a different landmark, street, or area.</p>
                        </>
                      )}
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="space-y-1">
                      <div className="pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        {results.length} place{results.length === 1 ? "" : "s"} found
                      </div>
                      <div className="divide-y divide-border/40">
                        {visible.map((place) => (
                          <button
                            key={place.id}
                            type="button"
                            onClick={() => selectPlace(place)}
                            className="flex w-full items-center gap-3.5 py-3 text-left transition active:bg-muted/40"
                          >
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                              <PlaceIcon category={place.category ?? "Place"} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">
                                <HighlightText text={place.name} query={query} />
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {place.label || "Location details unavailable"}
                              </span>
                            </span>
                            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              {place.category ?? "Place"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasMore && (
                    <div
                      ref={mobileSentinelRef}
                      className="flex items-center justify-center py-4 text-muted-foreground"
                    >
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span className="ml-2 text-xs font-medium">Loading more places...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}

      {/* DESKTOP FLOATING DROPDOWN (md+) */}
      {!isMobile && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.985 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
              className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(70dvh,28rem)] overflow-hidden rounded-2xl border border-black/10 bg-background/95 shadow-2xl shadow-black/15 backdrop-blur-xl dark:border-white/10"
            >
              {(showRecent || results.length > 0) && (
                <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Search size={13} />
                    {showRecent
                      ? "Recent searches"
                      : `${results.length} place${results.length === 1 ? "" : "s"} found`}
                  </span>
                  {showRecent && (
                    <button
                      type="button"
                      onClick={handleClearAllRecent}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
              {!showRecent && hasSearched && !loading && results.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  {rateLimited ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">Too many requests</p>
                      <p className="mt-1 text-xs">Try again in a moment.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground">No places found</p>
                      <p className="mt-1 text-xs">Try another name or pin anywhere on the map.</p>
                    </>
                  )}
                </div>
              )}
              <ul
                role="listbox"
                className="max-h-[min(56dvh,18rem)] overflow-y-auto"
                onScroll={handleScroll}
              >
                {visible.map((place, index) => (
                  <li key={place.id} role="option" aria-selected={index === activeIndex}>
                    <div
                      className={`flex w-full items-center justify-between border-b border-border/30 px-4 py-3 transition ${
                        index === activeIndex ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectPlace(place);
                        }}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <PlaceIcon category={place.category ?? "Place"} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {showRecent ? place.name : <HighlightText text={place.name} query={query} />}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {place.label || "Location details unavailable"}
                          </span>
                        </span>
                      </button>
                      {showRecent ? (
                        <button
                          type="button"
                          aria-label={`Remove ${place.name}`}
                          onClick={(e) => handleDeleteRecent(place.id, e)}
                          className="ml-2 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : (
                        <span className="ml-2 max-w-28 shrink-0 truncate rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {place.category ?? "Place"}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
                {hasMore && (
                  <li
                    ref={desktopSentinelRef}
                    className="flex items-center justify-center py-3 text-muted-foreground"
                  >
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span className="ml-2 text-xs font-medium">Loading more...</span>
                  </li>
                )}
              </ul>
              <div className="border-t px-4 py-2 text-[11px] text-muted-foreground">
                Search uses Photon, OpenStreetMap data, and local aliases.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
