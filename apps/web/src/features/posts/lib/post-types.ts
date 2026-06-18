export type ModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "flagged"
  | "archived";

export type PostType = "text" | "photo" | "song" | "mixed";

export type Music = {
  id?: string;
  provider?: "deezer";
  providerId?: string;
  title: string;
  artist: string;
  album?: string;
  platform?: "deezer" | "spotify" | "manual";
  url?: string;
  deezerUrl?: string;
  previewUrl?: string;
  coverUrl?: string;
  duration?: string | number;
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
  deletedAt?: string | null;
  distanceLabel?: string;
  moderationStatus: ModerationStatus;
};

export type PostDraft = {
  title: string;
  text: string;
  imageUrl?: string;
  imageFile?: File;
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
