import type { AnonymousPost, MarkerData, PostDraft, PostType } from "./post-types";

export function relativeTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getPostType(draft: PostDraft): PostType {
  if (draft.imageUrl && draft.music) return "mixed";
  if (draft.imageUrl) return "photo";
  if (draft.music) return "song";
  return "text";
}

export function createPost(marker: MarkerData, draft: PostDraft): AnonymousPost {
  return {
    id: crypto.randomUUID(),
    title: draft.title,
    type: getPostType(draft),
    text: draft.text,
    imageUrl: draft.imageUrl,
    music: draft.music,
    lat: marker.lat,
    lng: marker.lng,
    placeName: marker.placeName,
    createdAt: new Date().toISOString(),
    distanceLabel: "Pinned here",
    moderationStatus: "pending",
  };
}

export function getLocationGroupKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function groupMarkersByLocation(markers: MarkerData[]): MarkerData[] {
  const groups = new Map<string, MarkerData>();
  for (const marker of markers) {
    const key = getLocationGroupKey(marker.lat, marker.lng);
    const existing = groups.get(key);
    if (existing) {
      existing.posts.push(...marker.posts);
      if (!existing.placeName && marker.placeName) existing.placeName = marker.placeName;
      continue;
    }
    groups.set(key, { ...marker, posts: [...marker.posts] });
  }
  return [...groups.values()];
}

export function getVisiblePosts(markers: MarkerData[]): AnonymousPost[] {
  return markers
    .flatMap((marker) => marker.posts)
    .filter((post) => post.moderationStatus === "visible");
}

export function getPublicMarkers(markers: MarkerData[]): MarkerData[] {
  return markers
    .map((marker) => ({
      ...marker,
      posts: marker.posts.filter((post) => post.moderationStatus === "visible"),
    }))
    .filter((marker) => marker.posts.length > 0);
}

export function removeEmptyMarkers(markers: MarkerData[]): MarkerData[] {
  return markers.filter((marker) => marker.posts.length > 0);
}
