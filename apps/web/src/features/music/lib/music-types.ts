export type MusicSearchResult = {
  provider: "deezer";
  providerId: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  previewUrl?: string;
  deezerUrl?: string;
  duration?: number;
};

export type PostMusic = MusicSearchResult;
