import type { AnonymousPost, MarkerData, ModerationStatus, PostDraft, PostType } from "./post-types";

export const PUBLIC_POST_STATUSES = ["approved", "flagged"] as const;

export function isSoftDeletedPost(post: { deletedAt?: string | null }) {
  return post.deletedAt != null;
}

export function isPublicPost(post: { moderationStatus: ModerationStatus; deletedAt?: string | null }) {
  return PUBLIC_POST_STATUSES.includes(
    post.moderationStatus as (typeof PUBLIC_POST_STATUSES)[number],
  ) && !isSoftDeletedPost(post);
}

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
    id: crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
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
    .filter(isPublicPost);
}

type Coordinates = { lat: number; lng: number };
type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

function distanceInKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDistance = toRadians(to.lat - from.lat);
  const lngDistance = toRadians(to.lng - from.lng);
  const a =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(lngDistance / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isInsideBounds(post: AnonymousPost, bounds: MapBounds): boolean {
  const insideLongitude =
    bounds.west <= bounds.east
      ? post.lng >= bounds.west && post.lng <= bounds.east
      : post.lng >= bounds.west || post.lng <= bounds.east;

  return (
    post.lat >= bounds.south &&
    post.lat <= bounds.north &&
    insideLongitude
  );
}

export function getNearbyVisiblePosts(
  markers: MarkerData[],
  center: Coordinates,
  bounds: MapBounds,
): AnonymousPost[] {
  return getVisiblePosts(markers)
    .filter((post) => isInsideBounds(post, bounds))
    .map((post) => {
      const distance = distanceInKm(center, post);
      return {
        ...post,
        distanceLabel:
          distance < 1
            ? `${Math.max(1, Math.round(distance * 1000))} m away`
            : `${distance.toFixed(1)} km away`,
      };
    })
    .sort(
      (a, b) =>
        distanceInKm(center, a) - distanceInKm(center, b),
    );
}

export function getPublicMarkers(markers: MarkerData[]): MarkerData[] {
  return markers
    .map((marker) => ({
      ...marker,
      posts: marker.posts.filter(isPublicPost),
    }))
    .filter((marker) => marker.posts.length > 0);
}

export function removeEmptyMarkers(markers: MarkerData[]): MarkerData[] {
  return markers.filter((marker) => marker.posts.length > 0);
}
