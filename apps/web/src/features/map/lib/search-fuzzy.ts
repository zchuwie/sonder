import type {
  PlaceSearchResult,
  SearchCenter,
} from "./place-search-types";

export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0]!;
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = previous[j]!;
      previous[j] = Math.min(
        previous[j]! + 1,
        previous[j - 1]! + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = old;
    }
  }
  return previous[b.length]!;
}

function textScore(query: string, candidate: string): number {
  const q = normalizeSearchText(query);
  const value = normalizeSearchText(candidate);
  if (!q || !value) return 0;
  if (value === q) return 100;
  if (value.startsWith(q)) return 88;
  if (value.includes(q)) return 76;

  const words = value.split(" ");
  const bestDistance = Math.min(
    levenshteinDistance(q, value),
    ...words.map((word) => levenshteinDistance(q, word)),
  );
  const denominator = Math.max(q.length, Math.min(value.length, q.length + 3));
  return Math.max(0, 65 * (1 - bestDistance / denominator));
}

function distanceKm(a: SearchCenter, b: SearchCenter): number {
  const radians = (value: number) => (value * Math.PI) / 180;
  const lat = radians(b.lat - a.lat);
  const lng = radians(b.lng - a.lng);
  const value =
    Math.sin(lat / 2) ** 2 +
    Math.cos(radians(a.lat)) *
      Math.cos(radians(b.lat)) *
      Math.sin(lng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function scoreSearchResult(
  result: PlaceSearchResult,
  query: string,
  center?: SearchCenter,
): number {
  const aliasScore = Math.max(
    0,
    ...(result.aliases ?? []).map((alias) => textScore(query, alias)),
  );
  const relevance = Math.max(
    textScore(query, result.name),
    textScore(query, result.label) * 0.72,
    textScore(query, result.category ?? "") * 0.55,
    aliasScore + (aliasScore ? 8 : 0),
  );
  const nearbyBonus = center
    ? Math.max(0, 12 - Math.log10(distanceKm(center, result) + 1) * 5)
    : 0;
  const providerBonus = result.provider === "local" ? 4 : 0;
  return relevance + nearbyBonus + providerBonus + (result.importance ?? 0) * 5;
}

export function rankSearchResults(
  results: PlaceSearchResult[],
  query: string,
  center?: SearchCenter,
): PlaceSearchResult[] {
  const unique = new Map<string, PlaceSearchResult>();
  for (const result of results) {
    const key = `${normalizeSearchText(result.name)}:${result.lat.toFixed(4)}:${result.lng.toFixed(4)}`;
    if (!unique.has(key)) unique.set(key, result);
  }
  return [...unique.values()]
    .map((result) => ({ result, score: scoreSearchResult(result, query, center) }))
    .filter(({ score }) => score >= 30)
    .sort((a, b) => b.score - a.score)
    .map(({ result }) => result);
}
