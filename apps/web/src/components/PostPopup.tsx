import { useEffect, useState } from "react";
import PostDetailModal from "./PostDetailModal";
import AccountModal from "./AccountModal";
import SettingsModal from "./SettingsModal";
import { useUser } from "../contexts/UserContext";

export type SpotifySong = {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: string;
};

export type PostDraft = {
  content: string;
  imageUrl?: string;
  song?: SpotifySong;
  author: string;
  isAnonymous: boolean;
};

export type Post = {
  id: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  song?: SpotifySong;
  author: string;
  isAnonymous: boolean;
};

export type MarkerData = {
  id: string;
  lat: number;
  lng: number;
  posts: Post[];
  source?: "search" | "manual";
};

type Props = {
  marker: MarkerData | null;
  onOpenChange?: (open: boolean) => void;
};

export default function MarkerSidebar({ marker, onOpenChange }: Props) {
  const [open, setOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, logout } = useUser();

  const toggleOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (marker) {
      setOpen(true);
      onOpenChange?.(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker?.id]);

  return (
    <>
      {/* Toggle tab */}
      <button
        onClick={() => toggleOpen(!open)}
        className="absolute top-1/2 -translate-y-1/2 right-0 z-20 shadow-md rounded-l-xl px-1 py-4 flex items-center justify-center transition-all cursor-pointer"
        style={{
          right: open ? "320px" : "0px",
          background: "var(--card)",
          color: "var(--muted)",
          border: "1px solid var(--border)",
          borderRight: "none",
        }}
        aria-label={open ? "Close sidebar" : "Open sidebar"}
      >
        <span
          className="text-xs font-bold transition-transform"
          style={{
            transform: open ? "rotate(0deg)" : "rotate(180deg)",
            display: "inline-block",
          }}
        >
          ›
        </span>
      </button>

      {/* Sidebar panel */}
      <div
        className="absolute top-0 right-0 h-full w-80 shadow-2xl flex flex-col z-10 transition-transform duration-300 cursor-default"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          pointerEvents: open ? "auto" : "none",
          background: "var(--card)",
          color: "var(--card-foreground)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {marker ? (
          <>
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--card-foreground)" }}
              >
                {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
              </p>

              {/* User avatar + dropdown */}
              <div className="relative ml-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="User menu"
                  className="flex items-center justify-center rounded-full transition-colors cursor-pointer"
                  style={{
                    width: 34,
                    height: 34,
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    border: "2px solid var(--border)",
                  }}
                >
                  {user ? (
                    <span className="text-sm font-bold leading-none">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  )}
                </button>

                {userMenuOpen && (
                  <>
                    {/* backdrop */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    {/* menu */}
                    <div
                      className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-40"
                      style={{
                        minWidth: 168,
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 8px 24px rgba(0,0,0,.14)",
                      }}
                    >
                      {[
                        {
                          label: "Account",
                          icon: (
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="currentColor"
                            >
                              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                          ),
                          onClick: () => {
                            setUserMenuOpen(false);
                            setAccountOpen(true);
                          },
                        },
                        {
                          label: "My Settings",
                          icon: (
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="currentColor"
                            >
                              <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a6.97 6.97 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                            </svg>
                          ),
                          onClick: () => {
                            setUserMenuOpen(false);
                            setSettingsOpen(true);
                          },
                        },
                        {
                          label: "Logout",
                          icon: (
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="currentColor"
                            >
                              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                            </svg>
                          ),
                          danger: true,
                          onClick: () => {
                            logout();
                            setUserMenuOpen(false);
                          },
                        },
                      ].map(({ label, icon, danger, onClick }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={onClick}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-100"
                          style={{
                            color: danger
                              ? "var(--destructive, #ef4444)"
                              : "var(--card-foreground)",
                            background: "transparent",
                            borderBottom:
                              label !== "Logout"
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--surface)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          {icon}
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Posts list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {marker.posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-16 gap-3 text-center px-4">
                  <svg
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{ color: "var(--muted)", opacity: 0.4 }}
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--card-foreground)" }}
                  >
                    No posts yet
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Tap + to share something about this place
                  </p>
                </div>
              ) : (
                [...marker.posts].reverse().map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    onClick={() => setSelectedPost(post)}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {/* Image */}
                    {post.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full object-cover"
                        style={{ maxHeight: 160 }}
                      />
                    )}

                    <div className="p-3 space-y-2">
                      {/* Song */}
                      {post.song && (
                        <div
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2"
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.song.albumArt}
                            alt={post.song.title}
                            width={28}
                            height={28}
                            className="rounded shrink-0 object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-semibold truncate"
                              style={{ color: "var(--card-foreground)" }}
                            >
                              {post.song.title}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--muted)" }}
                            >
                              {post.song.artist}
                            </p>
                          </div>
                          {/* Spotify logo */}
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="#1DB954"
                            className="shrink-0"
                          >
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                          </svg>
                        </div>
                      )}

                      {/* Text */}
                      {post.content && (
                        <p
                          className="text-sm whitespace-pre-wrap leading-relaxed"
                          style={{ color: "var(--card-foreground)" }}
                        >
                          {post.content}
                        </p>
                      )}

                      {/* Author + Timestamp */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-xs truncate"
                          style={{ color: "var(--muted)" }}
                        >
                          {post.isAnonymous ? "🎭" : "👤"}{" "}
                          {post.author ?? "Unknown"}
                        </span>
                        <span
                          className="text-xs shrink-0"
                          style={{ color: "var(--muted)", opacity: 0.7 }}
                        >
                          {new Date(post.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
            <span className="text-4xl">📍</span>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--card-foreground)" }}
            >
              No location selected
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              Switch to <strong>Mark mode</strong> and double-click anywhere on
              the map to pin a location, then click the pin to see its details
              here.
            </p>
          </div>
        )}
      </div>

      {/* Post detail modal */}
      {selectedPost && marker && (
        <PostDetailModal
          post={selectedPost}
          marker={marker}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* Account modal */}
      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}

      {/* Settings modal */}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onOpenAccount={() => setAccountOpen(true)}
        />
      )}
    </>
  );
}
