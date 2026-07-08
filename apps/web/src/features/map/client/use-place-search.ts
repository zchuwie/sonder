"use client";

import { useEffect, useState } from "react";
import { searchLocalPlaces, searchPlaces } from "../lib/place-search";
import { RateLimitedError } from "../lib/search-providers/nominatim";
import type {
  PlaceSearchResult,
} from "../lib/place-search-types";

const DEBOUNCE_MS = 300;

type UsePlaceSearchOptions = {
  query: string;
  centerLat?: number | null;
  centerLng?: number | null;
};

export function usePlaceSearch({
  query,
  centerLat = null,
  centerLng = null,
}: UsePlaceSearchOptions) {
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    const center =
      typeof centerLat === "number" && typeof centerLng === "number"
        ? { lat: centerLat, lng: centerLng }
        : undefined;

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      setRateLimited(false);
      return;
    }

    setRateLimited(false);
    setLoading(true);
    setResults([]);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void searchPlaces(trimmed, center, controller.signal)
        .then(setResults)
        .catch((err) => {
          if (err instanceof RateLimitedError) setRateLimited(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
            setHasSearched(true);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, centerLat, centerLng]);

  return { results, loading, hasSearched, rateLimited };
}
