import { usePostDraftStore } from "./use-post-draft-store";
import type { MarkerData } from "@/features/posts/lib/post-types";

const marker: MarkerData = {
  id: "rizal-park",
  lat: 14.5826,
  lng: 120.9787,
  placeName: "Rizal Park",
  posts: [],
};

describe("post draft store", () => {
  beforeEach(() => usePostDraftStore.getState().reset());

  it("preserves a draft when reopening the same location", () => {
    const store = usePostDraftStore.getState();
    store.prepareForLocation(marker);
    store.setTitle("  A quiet afternoon  ");
    store.setText("  I remember this place.  ");
    store.prepareForLocation({ ...marker, id: "same-coordinates" });

    expect(usePostDraftStore.getState().title).toBe("  A quiet afternoon  ");
    expect(usePostDraftStore.getState().getDraft()).toMatchObject({
      title: "A quiet afternoon",
      text: "I remember this place.",
    });
  });

  it("clears a draft when selecting another location", () => {
    const store = usePostDraftStore.getState();
    store.prepareForLocation(marker);
    store.setTitle("Old location");
    store.prepareForLocation({
      ...marker,
      id: "intramuros",
      lat: 14.5896,
      lng: 120.9747,
      placeName: "Intramuros",
    });

    expect(usePostDraftStore.getState().title).toBe("");
    expect(usePostDraftStore.getState().location?.placeName).toBe("Intramuros");
  });

  it("resets all draft fields", () => {
    const store = usePostDraftStore.getState();
    store.prepareForLocation(marker);
    store.setTitle("Title");
    store.setText("Thought");
    store.setMusic({ title: "Leaves", artist: "Ben&Ben" });
    store.reset();

    expect(usePostDraftStore.getState()).toMatchObject({
      location: null,
      title: "",
      text: "",
      music: undefined,
    });
  });
});
