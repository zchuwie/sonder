"use client";

import { useRef, useState } from "react";
import { FiImage, FiMapPin, FiMusic, FiX } from "react-icons/fi";
import type { MarkerData, PostDraft, SpotifySong } from "./PostPopup";
import { useUser } from "../../contexts/UserContext";

const MOCK_SONGS: SpotifySong[] = [
  {
    id: "s1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    albumArt: "https://picsum.photos/seed/weeknd/40/40",
    duration: "3:22",
  },
  {
    id: "s2",
    title: "Shape of You",
    artist: "Ed Sheeran",
    albumArt: "https://picsum.photos/seed/edsheeran/40/40",
    duration: "3:54",
  },
  {
    id: "s3",
    title: "Levitating",
    artist: "Dua Lipa",
    albumArt: "https://picsum.photos/seed/dualipa/40/40",
    duration: "3:23",
  },
  {
    id: "s4",
    title: "Stay",
    artist: "The Kid Laroi & Justin Bieber",
    albumArt: "https://picsum.photos/seed/kidlaroi/40/40",
    duration: "2:21",
  },
  {
    id: "s5",
    title: "Peaches",
    artist: "Justin Bieber",
    albumArt: "https://picsum.photos/seed/bieber/40/40",
    duration: "3:18",
  },
  {
    id: "s6",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    albumArt: "https://picsum.photos/seed/olivia/40/40",
    duration: "2:58",
  },
  {
    id: "s7",
    title: "Montero (Call Me By Your Name)",
    artist: "Lil Nas X",
    albumArt: "https://picsum.photos/seed/lilnasx/40/40",
    duration: "2:17",
  },
  {
    id: "s8",
    title: "Save Your Tears",
    artist: "The Weeknd & Ariana Grande",
    albumArt: "https://picsum.photos/seed/saveyourtears/40/40",
    duration: "3:35",
  },
  {
    id: "s9",
    title: "Heat Waves",
    artist: "Glass Animals",
    albumArt: "https://picsum.photos/seed/glassanimals/40/40",
    duration: "3:59",
  },
  {
    id: "s10",
    title: "As It Was",
    artist: "Harry Styles",
    albumArt: "https://picsum.photos/seed/harrystyles/40/40",
    duration: "2:37",
  },
];

type Props = {
  marker: MarkerData;
  onClose: () => void;
  onSubmit: (draft: PostDraft) => void;
};

export default function CreatePostModal({ marker, onClose, onSubmit }: Props) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<SpotifySong | null>(null);
  const [songSearch, setSongSearch] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const anonId = useRef(`Anonymous#${Math.floor(1000 + Math.random() * 9000)}`);

  const filteredSongs = MOCK_SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
      s.artist.toLowerCase().includes(songSearch.toLowerCase()),
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  };

  const canSubmit = !!content.trim() || !!imagePreview || !!selectedSong;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      content: content.trim(),
      imageUrl: imagePreview ?? undefined,
      song: selectedSong ?? undefined,
      author: isAnonymous ? anonId.current : (user?.name ?? "Guest"),
      isAnonymous,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-205 flex flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl"
        style={{
          height: "88vh",
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.3)",
        }}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--border)",
            }}
          />
        </div>
        {/* ── Header ──────────────────────────────────────────── */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <p
              className="text-base font-semibold"
              style={{ color: "var(--card-foreground)" }}
            >
              New Post
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              <span className="inline-flex items-center gap-1">
                <FiMapPin size={11} /> {marker.lat.toFixed(5)},{" "}
                {marker.lng.toFixed(5)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 32, height: 32, color: "var(--muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── Two-column body ─────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — map preview */}
          <div
            className="hidden sm:block relative shrink-0 overflow-hidden"
            style={{
              width: 280,
              borderRight: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <iframe
              title="Location map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${marker.lng - 0.005},${marker.lat - 0.005},${marker.lng + 0.005},${marker.lat + 0.005}&layer=mapnik&marker=${marker.lat},${marker.lng}`}
              className="w-full h-full"
              style={{ border: "none" }}
            />
            <div
              className="absolute top-3 left-3 px-2 py-1 rounded-md text-[11px] font-medium"
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                backdropFilter: "blur(6px)",
              }}
            >
              Drag and scroll to inspect location
            </div>
            {/* Coords overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 px-4 py-3"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
              }}
            >
              <p className="text-white text-xs font-medium leading-snug">
                <span className="inline-flex items-center gap-1">
                  <FiMapPin size={11} /> {marker.lat.toFixed(5)}
                </span>
                <br />
                {marker.lng.toFixed(5)}
              </p>
            </div>
          </div>

          {/* Right — scrollable form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Anonymous toggle bar */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{
                background: "var(--surface)",
                border: `1.5px solid ${
                  isAnonymous ? "var(--primary)" : "var(--border)"
                }`,
              }}
            >
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--card-foreground)" }}
                >
                  Post anonymously
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {isAnonymous
                    ? `Shown as ${anonId.current}`
                    : `Shown as ${user?.name ?? "Guest"}`}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous((v) => !v)}
                className="relative shrink-0 transition-colors"
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: isAnonymous
                    ? "var(--primary)"
                    : "var(--input-border)",
                }}
              >
                <span
                  className="absolute top-0.5 transition-transform"
                  style={{
                    left: 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,.25)",
                    transform: isAnonymous
                      ? "translateX(20px)"
                      : "translateX(0)",
                  }}
                />
              </button>
            </div>

            {/* Description */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What’s happening at this location?"
              rows={4}
              className="w-full text-sm rounded-xl p-3 resize-none focus:outline-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--ring)")}
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--input-border)")
              }
            />

            {/* Image (optional) */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--muted)" }}
              >
                Photo
                <span
                  className="ml-1 normal-case font-normal"
                  style={{ opacity: 0.6 }}
                >
                  (optional)
                </span>
              </p>
              {imagePreview ? (
                <div
                  className="relative rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: "var(--surface)", maxHeight: 220 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 220,
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 flex items-center justify-center rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                    }}
                    aria-label="Remove photo"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-5 transition-colors"
                  style={{
                    border: "1.5px dashed var(--border)",
                    color: "var(--muted)",
                    background: "var(--surface)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--primary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <FiImage size={22} />
                  <span className="text-xs">Click to upload a photo</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Song (optional) */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--muted)" }}
              >
                <span className="inline-flex items-center gap-1">
                  <FiMusic size={12} /> Song
                </span>
                <span
                  className="ml-1 normal-case font-normal"
                  style={{ opacity: 0.6 }}
                >
                  (optional)
                </span>
              </p>

              {/* Selected song chip */}
              {selectedSong && (
                <div
                  className="flex items-center gap-3 rounded-xl p-3 mb-2"
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedSong.albumArt}
                    alt={selectedSong.title}
                    width={36}
                    height={36}
                    className="rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {selectedSong.title}
                    </p>
                    <p className="text-xs truncate" style={{ opacity: 0.8 }}>
                      {selectedSong.artist}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSong(null)}
                    style={{ opacity: 0.8 }}
                    aria-label="Remove song"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              )}

              <input
                type="text"
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                placeholder="Search songs…"
                className="w-full text-sm rounded-xl px-3 py-2 mb-2 focus:outline-none"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--ring)")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--input-border)")
                }
              />

              <div
                className="rounded-xl overflow-hidden"
                style={{
                  border: "1px solid var(--border)",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {filteredSongs.length === 0 ? (
                  <p
                    className="text-xs text-center py-4"
                    style={{ color: "var(--muted)" }}
                  >
                    No songs found
                  </p>
                ) : (
                  filteredSongs.map((song, i) => (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() =>
                        setSelectedSong(
                          selectedSong?.id === song.id ? null : song,
                        )
                      }
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                      style={{
                        background:
                          selectedSong?.id === song.id
                            ? "var(--primary)"
                            : "transparent",
                        color:
                          selectedSong?.id === song.id
                            ? "var(--primary-foreground)"
                            : "var(--card-foreground)",
                        borderBottom:
                          i < filteredSongs.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedSong?.id !== song.id)
                          e.currentTarget.style.background = "var(--surface)";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedSong?.id !== song.id)
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={song.albumArt}
                        alt={song.title}
                        width={32}
                        height={32}
                        className="rounded object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {song.title}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ opacity: 0.7 }}
                        >
                          {song.artist}
                        </p>
                      </div>
                      <span
                        className="text-xs shrink-0"
                        style={{ opacity: 0.6 }}
                      >
                        {song.duration}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div
          className="px-5 py-3.5 shrink-0 flex items-center gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Post button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
