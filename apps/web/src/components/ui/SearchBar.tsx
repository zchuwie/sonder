"use client";

import { useEffect, useRef, useState } from "react";
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
import { LocationPlaceDTO } from "../../types/location.dto";

/* ── Nominatim response shape (subset) ───────────────────────── */
type NominatimResult = {
  place_id: number;
  osm_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address: {
    country?: string;
    country_code?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    road?: string;
    postcode?: string;
  };
};

function toLocationPlace(r: NominatimResult): LocationPlaceDTO {
  /* Best human-readable name */
  const name =
    r.name ||
    r.address.suburb ||
    r.address.road ||
    r.display_name.split(",")[0] ||
    "Unknown";

  /* Short address: up to 3 meaningful comma-parts of display_name, skipping
     the first part (which is the name itself) */
  const parts = r.display_name.split(",").map((s) => s.trim());
  const address = parts.slice(1, 4).join(", ");

  /* Category from OSM class/type */
  const rawCategory = r.type !== "yes" ? r.type : r.class;
  const category =
    rawCategory.charAt(0).toUpperCase() +
    rawCategory.slice(1).replace(/_/g, " ");

  /* Build a readable description from address components */
  const addrParts = [
    r.address.road,
    r.address.suburb,
    r.address.city || r.address.town || r.address.village,
    r.address.state,
    r.address.country,
  ].filter(Boolean);
  const description =
    addrParts.length > 1
      ? `${category} located in ${addrParts.slice(1).join(", ")}.`
      : r.display_name;

  return {
    id: `osm-${r.osm_id}`,
    name,
    category,
    address,
    description,
    tags: [...new Set([r.type, r.class].filter(Boolean))],
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  };
}

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return 0;

  if (t === q) return 10000;
  if (t.startsWith(q)) return 9000 - t.length;
  if (t.includes(q)) return 8000 - t.indexOf(q);

  const qWords = q.split(/\s+/);
  const tWords = t.split(/[\s,]+/);
  let wordScore = 0;
  for (const qw of qWords) {
    let best = 0;
    for (const tw of tWords) {
      if (tw.startsWith(qw)) best = Math.max(best, 700);
      else if (tw.includes(qw)) best = Math.max(best, 600);
    }
    wordScore += best;
  }
  if (wordScore > 0) return wordScore;

  let qi = 0;
  let score = 0;
  let streak = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak++;
      score += streak * 5;
      qi++;
    } else {
      streak = 0;
    }
  }
  return qi < q.length ? -1 : score;
}

function scorePlaceAgainstQuery(
  place: LocationPlaceDTO,
  query: string,
): number {
  return Math.max(
    fuzzyScore(query, place.name),
    fuzzyScore(query, place.address) * 0.8,
    fuzzyScore(query, place.category) * 0.5,
  );
}

async function fetchPlaces(query: string): Promise<LocationPlaceDTO[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "50",
    addressdetails: "1",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { "Accept-Language": "en" } },
  );
  if (!res.ok) return [];
  const data: NominatimResult[] = await res.json();
  const places = data.map(toLocationPlace);

  // Re-rank by fuzzy score; filter out results with no character match
  const scored = places
    .map((p) => ({ p, score: scorePlaceAgainstQuery(p, query) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ p }) => p);
}

const PAGE_SIZE = 5;
const DEBOUNCE_MS = 250;
const MIN_QUERY_LEN = 2;
const RECENT_KEY = "sonder:recent-searches";
const MAX_RECENT = 5;

function loadRecent(): LocationPlaceDTO[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as LocationPlaceDTO[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(place: LocationPlaceDTO): void {
  try {
    const prev = loadRecent().filter((p) => p.id !== place.id);
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify([place, ...prev].slice(0, MAX_RECENT)),
    );
  } catch {
    /* quota exceeded or private browsing — ignore */
  }
}

function CategoryIcon({ category }: { category: string }) {
  const cat = category.toLowerCase();

  if (/restaurant|food|cafe|bar|pub|fast_food|bakery|eat/.test(cat))
    return <FaUtensils size={14} />;

  if (/hospital|clinic|doctor|medical|pharmacy|dentist|health/.test(cat))
    return <FaHospital size={14} />;

  if (/school|university|college|education|library/.test(cat))
    return <FaSchool size={14} />;

  if (/park|garden|nature|forest|beach|lake|river/.test(cat))
    return <FaTree size={14} />;

  if (/shop|mall|store|market|supermarket|retail/.test(cat))
    return <FaStore size={14} />;

  if (/station|airport|bus|train|transit|subway|metro|ferry/.test(cat))
    return <FaTrain size={14} />;

  if (/hotel|hostel|motel|accommodation|lodging/.test(cat))
    return <FaHotel size={14} />;

  if (/city|town|village|administrative|county|state|country/.test(cat))
    return <FaCity size={14} />;

  /* default — location pin */
  return <FaMapMarkerAlt size={14} />;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const q = query.toLowerCase().trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: "var(--primary)", fontWeight: 700 }}>
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </>
  );
}

type Props = {
  onPlaceSelect: (place: LocationPlaceDTO) => void;
};

export function SearchBar({ onPlaceSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationPlaceDTO[]>([]);
  const [recent, setRecent] = useState<LocationPlaceDTO[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* Load persisted recent searches once on mount */
  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  /* Debounced search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      setOpen(false);
      return;
    }
    if (trimmed.length < MIN_QUERY_LEN) {
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const found = await fetchPlaces(trimmed);
        setResults(found);
        setPage(1);
        setHasSearched(true);
        setOpen(true);
      } catch {
        /* aborted or network error — silently ignore */
      } finally {
        setLoading(false);
      }
      setActiveIdx(-1);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectPlace = (place: LocationPlaceDTO) => {
    onPlaceSelect(place);
    setQuery(place.name);
    setOpen(false);
    setPage(1);
    saveRecent(place);
    setRecent(loadRecent());
    inputRef.current?.blur();
  };

  /* Which list is active */
  const showRecent = !query.trim() && recent.length > 0;
  const displayList = showRecent ? recent : results;
  const visible = displayList.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < displayList.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIdx >= 0 ? displayList[activeIdx] : displayList[0];
      if (target) selectPlace(target);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {loading ? (
              <FaSpinner
                size={15}
                className="animate-spin"
                style={{ color: "var(--primary)" }}
              />
            ) : (
              <FiSearch size={15} style={{ color: "var(--muted)" }} />
            )}
          </span>

          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-label="Search locations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim() && (results.length > 0 || hasSearched))
                setOpen(true);
              else if (!query.trim() && recent.length > 0) setOpen(true);
            }}
            placeholder="Search places, addresses, cities…"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl pl-9 pr-8 py-2.5 text-sm outline-none transition-all duration-200"
            style={{
              background: "var(--input-bg)",
              color: "var(--foreground)",
              border: "1px solid var(--input-border)",
              boxShadow: "0 2px 8px rgba(0,0,0,.08)",
            }}
            onFocusCapture={(e) =>
              (e.currentTarget.style.borderColor = "var(--ring)")
            }
            onBlurCapture={(e) =>
              (e.currentTarget.style.borderColor = "var(--input-border)")
            }
          />

          {query && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                setQuery("");
                setResults([]);
                setHasSearched(false);
                setPage(1);
                setOpen(recent.length > 0);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute inset-y-0 right-2 flex items-center px-0.5"
              style={{ color: "var(--muted)" }}
            >
              <FiX size={13} />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl z-50 overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,.14)",
          }}
        >
          {(showRecent || results.length > 0) && (
            <div
              className="px-4 py-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
              style={{
                color: "var(--muted)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {showRecent ? (
                <>
                  <FaHistory size={12} />
                  Recent searches
                </>
              ) : (
                <>
                  <FiSearch size={12} />
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </>
              )}
            </div>
          )}

          {!showRecent && hasSearched && results.length === 0 && (
            <div
              className="px-4 py-8 flex flex-col items-center gap-3"
              style={{ color: "var(--muted)" }}
            >
              <FiSearch size={32} style={{ opacity: 0.4 }} />
              <div className="text-center">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  No results found
                </p>
                <p className="text-xs mt-0.5">Try a different search term</p>
              </div>
            </div>
          )}

          <ul
            role="listbox"
            aria-label="Search results"
            style={{ maxHeight: "288px", overflowY: "auto" }}
          >
            {visible.map((place, idx) => (
              <li
                key={place.id}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(-1)}
              >
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-100"
                  style={{
                    background:
                      idx === activeIdx ? "var(--surface)" : "transparent",
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectPlace(place);
                  }}
                >
                  <span
                    className="shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: 32,
                      height: 32,
                      background: "var(--surface)",
                      color: "var(--primary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <CategoryIcon category={place.category} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {showRecent ? (
                        place.name
                      ) : (
                        <HighlightText text={place.name} query={query} />
                      )}
                    </p>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: "var(--muted)" }}
                    >
                      {place.address || place.category}
                    </p>
                  </div>

                  <span
                    className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      background: "var(--surface)",
                      color: "var(--primary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {place.category}
                  </span>
                </button>
              </li>
            ))}

            {hasMore && (
              <li>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-xs font-semibold text-center transition-colors duration-100"
                  style={{
                    color: "var(--primary)",
                    borderTop: "1px solid var(--border)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setPage((p) => p + 1);
                  }}
                >
                  Load 5 more ({displayList.length - visible.length} remaining)
                </button>
              </li>
            )}
          </ul>

          <div
            className="px-4 py-1.5 text-right"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              © OpenStreetMap contributors
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
