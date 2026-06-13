import { create } from "zustand";
import type { MarkerData, Music, PostDraft } from "@/features/posts/lib/post-types";
import { getLocationGroupKey } from "@/features/posts/lib/post-utils";

type DraftLocation = Pick<MarkerData, "id" | "lat" | "lng" | "placeName">;

type PostDraftStore = {
  location: DraftLocation | null;
  title: string;
  text: string;
  imageUrl?: string;
  imageFile?: File;
  music?: Music;
  prepareForLocation: (marker: MarkerData) => void;
  setTitle: (title: string) => void;
  setText: (text: string) => void;
  setImageUrl: (imageUrl?: string) => void;
  setImageFile: (imageFile?: File) => void;
  setMusic: (music?: Music) => void;
  getDraft: () => PostDraft;
  reset: () => void;
};

function locationKey(location: Pick<MarkerData, "lat" | "lng">): string {
  return getLocationGroupKey(location.lat, location.lng);
}

function releasePreview(imageUrl?: string) {
  if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL?.(imageUrl);
}

const emptyDraft = {
  location: null,
  title: "",
  text: "",
  imageUrl: undefined,
  imageFile: undefined,
  music: undefined,
};

export const usePostDraftStore = create<PostDraftStore>((set, get) => ({
  ...emptyDraft,
  prepareForLocation: (marker) =>
    set((state) => {
      if (
        state.location &&
        locationKey(state.location) === locationKey(marker)
      ) {
        return state;
      }
      releasePreview(state.imageUrl);
      return {
        ...emptyDraft,
        location: {
          id: marker.id,
          lat: marker.lat,
          lng: marker.lng,
          placeName: marker.placeName,
        },
      };
    }),
  setTitle: (title) => set({ title }),
  setText: (text) => set({ text }),
  setImageUrl: (imageUrl) =>
    set((state) => {
      if (state.imageUrl !== imageUrl) releasePreview(state.imageUrl);
      return {
        imageUrl,
        imageFile: imageUrl ? state.imageFile : undefined,
      };
    }),
  setImageFile: (imageFile) => set({ imageFile }),
  setMusic: (music) => set({ music }),
  getDraft: () => {
    const state = get();
    return {
      title: state.title.trim(),
      text: state.text.trim(),
      imageUrl: state.imageUrl,
      imageFile: state.imageFile,
      music: state.music,
    };
  },
  reset: () => {
    releasePreview(get().imageUrl);
    set(emptyDraft);
  },
}));
