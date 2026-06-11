export type ModerationStatus = "visible" | "pending" | "flagged" | "hidden";

export type PostType = "text" | "photo" | "song" | "mixed";

export type Music = {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  platform?: "spotify" | "manual";
  url?: string;
  coverUrl?: string;
  duration?: string;
};

export type AnonymousPost = {
  id: string;
  title: string;
  type: PostType;
  text: string;
  imageUrl?: string;
  music?: Music;
  lat: number;
  lng: number;
  placeName?: string;
  createdAt: string;
  distanceLabel?: string;
  moderationStatus: ModerationStatus;
};

export type PostDraft = {
  title: string;
  text: string;
  imageUrl?: string;
  music?: Music;
};

export type MarkerData = {
  id: string;
  lat: number;
  lng: number;
  placeName?: string;
  posts: AnonymousPost[];
  source?: "search" | "manual";
};

export type PostLocationGroup = MarkerData;
