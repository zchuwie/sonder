"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FaCity,
  FaHistory,
  FaHospital,
  FaHotel,
  FaMapMarkerAlt,
  FaSchool,
  FaSpinner,
  FaStore,
  FaTrain,
  FaTree,
  FaUtensils,
} from "react-icons/fa";
import { FiSearch, FiX } from "react-icons/fi";
import { usePlaceSearch } from "@/features/map/client/use-place-search";
import type { LocationPlaceDTO } from "@/features/map/lib/location-types";
import type {
  PlaceSearchResult,
  SearchCenter,
} from "@/features/map/lib/place-search-types";

const PAGE_SIZE = 5;
const RECENT_KEY = "sonder:recent-searches";
const MAX_RECENT = 5;

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

function CategoryIcon({ category }: { category: string }) {
  const value = category.toLowerCase();
  if (/restaurant|food|cafe|bar|pub|bakery/.test(value))
    return <FaUtensils size={14} />;
  if (/hospital|clinic|doctor|medical|health/.test(value))
    return <FaHospital size={14} />;
  if (/school|university|college|education/.test(value))
    return <FaSchool size={14} />;
  if (/park|garden|nature|forest|beach|river/.test(value))
    return <FaTree size={14} />;
  if (/shop|mall|store|market|retail/.test(value))
    return <FaStore size={14} />;
  if (/station|airport|bus|train|transit|metro|ferry/.test(value))
    return <FaTrain size={14} />;
  if (/hotel|hostel|motel|lodging/.test(value)) return <FaHotel size={14} />;
  if (/city|town|village|administrative|state|country/.test(value))
    return <FaCity size={14} />;
  return <FaMapMarkerAlt size={14} />;
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
};

export function MapSearchBar({ onPlaceSelect, center }: Props) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<PlaceSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [page, setPage] = useState(1);
  const { results, loading, hasSearched } = usePlaceSearch({
    query,
    centerLat: center?.lat,
    centerLng: center?.lng,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setRecent(loadRecent()), []);
  useEffect(() => {
    if (query.trim().length >= 2) setOpen(true);
    setPage(1);
    setActiveIndex(-1);
  }, [query]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const showRecent = !query.trim() && recent.length > 0;
  const displayList = showRecent ? recent : results;
  const visible = displayList.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < displayList.length;

  const selectPlace = (place: PlaceSearchResult) => {
    onPlaceSelect(toLocationPlace(place));
    saveRecent(place);
    setRecent(loadRecent());
    setQuery(place.name);
    setOpen(false);
    inputRef.current?.blur();
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
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          {loading ? (
            <FaSpinner className="animate-spin text-primary" size={15} />
          ) : (
            <FiSearch className="text-muted-foreground" size={15} />
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
            if (displayList.length || query.trim().length >= 2) setOpen(true);
          }}
          placeholder="Search barangays, landmarks, or cities..."
          autoComplete="off"
          spellCheck={false}
          className="h-10 w-full rounded-xl border border-input bg-background/95 py-2.5 pl-9 pr-9 text-sm shadow-lg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-auto sm:rounded-2xl sm:py-3"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute inset-y-0 right-2 flex items-center px-1 text-muted-foreground"
            onClick={() => {
              setQuery("");
              setOpen(recent.length > 0);
              inputRef.current?.focus();
            }}
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.985 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(70dvh,28rem)] overflow-hidden rounded-xl border border-black/10 bg-background/95 shadow-xl backdrop-blur-md sm:rounded-2xl"
          >
            {(showRecent || results.length > 0) && (
              <div className="flex items-center gap-2 border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {showRecent ? <FaHistory size={12} /> : <FiSearch size={12} />}
                {showRecent
                  ? "Recent searches"
                  : `${results.length} place${results.length === 1 ? "" : "s"} found`}
              </div>
            )}
            {!showRecent && hasSearched && !loading && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium">No places found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try another name or pin anywhere on the map.
                </p>
              </div>
            )}
            <ul role="listbox" className="max-h-[min(56dvh,18rem)] overflow-y-auto">
              {visible.map((place, index) => (
                <li key={place.id} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition hover:bg-primary/5"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectPlace(place);
                    }}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border bg-primary/5 text-primary">
                      <CategoryIcon category={place.category ?? "Place"} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {showRecent ? place.name : <HighlightText text={place.name} query={query} />}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {place.label || "Location details unavailable"}
                      </span>
                    </span>
                    <span className="max-w-28 shrink-0 truncate rounded-full border bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                      {place.category ?? "Place"}
                    </span>
                  </button>
                </li>
              ))}
              {hasMore && (
                <li>
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-center text-xs font-semibold text-primary hover:bg-primary/5"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setPage((current) => current + 1);
                    }}
                  >
                    Load more places
                  </button>
                </li>
              )}
            </ul>
            <div className="border-t px-4 py-2 text-xs text-muted-foreground">
              Search uses Photon, OpenStreetMap data, and local aliases.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
