import { useEffect, useRef, useState } from "react";
import { FaSpotify } from "react-icons/fa";
import {
  FiChevronRight,
  FiLogOut,
  FiMapPin,
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiSettings,
  FiUser,
  FiX,
} from "react-icons/fi";
import PostDetailModal from "./PostDetailModal";
import AccountModal from "../modals/AccountModal";
import SettingsModal from "../modals/SettingsModal";
import { useUser } from "../../contexts/UserContext";

export type SpotifySong = {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: string;
};

export type Post = {
  id: string;
  content: string;
  imageUrl?: string;
  song?: SpotifySong;
  author: string;
  isAnonymous: boolean;
  createdAt: string;
};

export type MarkerData = {
  id: string;
  lat: number;
  lng: number;
  posts: Post[];
  source?: "search" | "manual";
};

export type PostDraft = {
  content: string;
  imageUrl?: string;
  song?: SpotifySong;
  author: string;
  isAnonymous: boolean;
};

type Props = {
  marker: MarkerData | null;
  onOpenChange?: (open: boolean) => void;
  onNewPost?: () => void;
};

export default function MarkerSidebar({
  marker,
  onOpenChange,
  onNewPost,
}: Props) {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "photo" | "song" | "anon">(
    "all",
  );
  const { user, logout } = useUser();

  const toggleOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  // Detect mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    // On mobile with no marker, start closed so slide-up animation works
    if (mq.matches && !marker) setOpen(false);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches && !marker) setOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (marker) {
      setOpen(true);
      onOpenChange?.(true);
    } else if (isMobile) {
      // On mobile, hide the sheet when pin is deselected
      setOpen(false);
    }
    setSearch("");
    setFilter("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker?.id]);

  const filteredPosts = [...(marker?.posts ?? [])].reverse().filter((p) => {
    if (filter === "photo" && !p.imageUrl) return false;
    if (filter === "song" && !p.song) return false;
    if (filter === "anon" && !p.isAnonymous) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <>
      {/* Toggle tab — desktop only */}
      <button
        onClick={() => toggleOpen(!open)}
        className="absolute top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center justify-center transition-all cursor-pointer"
        style={{
          right: open ? "340px" : "0px",
          width: 20,
          // hidden on mobile via Tailwind — keep inline position for desktop
          height: 56,
          background: "var(--card)",
          color: "var(--muted)",
          border: "1px solid var(--border)",
          borderRight: "none",
          borderRadius: "10px 0 0 10px",
          boxShadow: "-2px 0 8px rgba(0,0,0,.08)",
        }}
        aria-label={open ? "Close sidebar" : "Open sidebar"}
      >
        <FiChevronRight
          size={12}
          style={{
            transform: open ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.25s",
          }}
        />
      </button>

      {/* Mobile backdrop */}
      {isMobile && open && marker && (
        <div
          className="fixed inset-0 z-9"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => toggleOpen(false)}
        />
      )}

      {/* Sidebar / Bottom-sheet panel */}
      <div
        ref={sheetRef}
        className="absolute flex flex-col z-10 transition-transform duration-300 cursor-default"
        style={{
          // Mobile: bottom sheet
          ...(isMobile
            ? {
                bottom: 0,
                left: 0,
                right: 0,
                top: "auto",
                maxHeight: "82vh",
                borderRadius: "20px 20px 0 0",
                transform: open ? "translateY(0)" : "translateY(100%)",
              }
            : {
                // Desktop: right sidebar
                top: 0,
                right: 0,
                height: "100%",
                width: 340,
                transform: open ? "translateX(0)" : "translateX(100%)",
              }),
          pointerEvents: open ? "auto" : "none",
          background: "var(--card)",
          color: "var(--card-foreground)",
          borderLeft: isMobile ? "none" : "1px solid var(--border)",
          borderTop: isMobile ? "1px solid var(--border)" : "none",
          boxShadow: isMobile
            ? "0 -8px 40px rgba(0,0,0,.18)"
            : "-4px 0 32px rgba(0,0,0,.12)",
        }}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center pt-2.5 pb-1 shrink-0">
            <div
              className="rounded-full"
              style={{ width: 36, height: 4, background: "var(--border)" }}
            />
          </div>
        )}
        {marker ? (
          <>
            {/* ── Header ── */}
            <div
              className="px-4 pt-4 pb-3 shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {/* Top row: location + avatar */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                    style={{ color: "var(--primary)" }}
                  >
                    Location
                  </p>
                  <p
                    className="text-sm font-semibold leading-tight truncate"
                    style={{ color: "var(--card-foreground)" }}
                  >
                    {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: "var(--primary)",
                        color: "#fff",
                      }}
                    >
                      <FiMessageSquare size={8} />
                      {marker.posts.length}{" "}
                      {marker.posts.length === 1 ? "post" : "posts"}
                    </span>
                  </div>
                </div>

                {/* User avatar + mobile close */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Close button — mobile only */}
                  <button
                    type="button"
                    onClick={() => toggleOpen(false)}
                    className="sm:hidden flex items-center justify-center rounded-full cursor-pointer transition-opacity hover:opacity-80"
                    aria-label="Close sidebar"
                    style={{
                      width: 32,
                      height: 32,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--muted)",
                    }}
                  >
                    <FiX size={14} />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      aria-label="User menu"
                      className="flex items-center justify-center rounded-full cursor-pointer transition-opacity hover:opacity-90"
                      style={{
                        width: 36,
                        height: 36,
                        background: user ? "var(--primary)" : "var(--surface)",
                        color: user ? "#fff" : "var(--muted)",
                        border: "2px solid var(--border)",
                      }}
                    >
                      {user ? (
                        <span className="text-sm font-bold leading-none">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <FiUser size={16} />
                      )}
                    </button>

                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setUserMenuOpen(false)}
                        />
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
                              icon: <FiUser size={14} />,
                              onClick: () => {
                                setUserMenuOpen(false);
                                setAccountOpen(true);
                              },
                            },
                            {
                              label: "My Settings",
                              icon: <FiSettings size={14} />,
                              onClick: () => {
                                setUserMenuOpen(false);
                                setSettingsOpen(true);
                              },
                            },
                            {
                              label: "Logout",
                              icon: <FiLogOut size={14} />,
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
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-100 cursor-pointer"
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
                                (e.currentTarget.style.background =
                                  "transparent")
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
              </div>

              {/* Search */}
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 mb-2"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <FiSearch
                  size={13}
                  className="shrink-0"
                  style={{ color: "var(--muted)" }}
                />
                <input
                  type="text"
                  placeholder="Search posts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-xs bg-transparent outline-none"
                  style={{ color: "var(--card-foreground)" }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="shrink-0 text-xs cursor-pointer"
                    style={{ color: "var(--muted)" }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="flex gap-1.5">
                {(["all", "photo", "song", "anon"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className="flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                    style={{
                      background:
                        filter === key ? "var(--primary)" : "var(--surface)",
                      color: filter === key ? "#fff" : "var(--muted)",
                      border: `1px solid ${filter === key ? "var(--primary)" : "var(--border)"}`,
                    }}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Posts list ── */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2.5">
              {filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-16 gap-4 text-center px-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <FiMapPin
                      size={24}
                      style={{ color: "var(--muted)", opacity: 0.5 }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: "var(--card-foreground)" }}
                    >
                      {marker.posts.length === 0
                        ? "Nothing here yet"
                        : "No results"}
                    </p>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--muted)" }}
                    >
                      {marker.posts.length === 0
                        ? "Be the first to leave a mark at this location."
                        : "Try a different keyword or filter."}
                    </p>
                  </div>
                </div>
              ) : (
                filteredPosts.map((post) => {
                  const initials = post.isAnonymous
                    ? "?"
                    : (post.author ?? "?").charAt(0).toUpperCase();
                  const relTime = (() => {
                    const diff =
                      Date.now() - new Date(post.createdAt).getTime();
                    const m = Math.floor(diff / 60000);
                    const h = Math.floor(diff / 3600000);
                    if (m < 1) return "just now";
                    if (h < 1) return `${m}m ago`;
                    if (h < 24) return `${h}h ago`;
                    return new Date(post.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    });
                  })();

                  return (
                    <div
                      key={post.id}
                      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedPost(post)}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform =
                          "translateY(-1px)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 6px 20px rgba(0,0,0,.12)";
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "var(--primary)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform =
                          "";
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 1px 4px rgba(0,0,0,.06)";
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "var(--border)";
                      }}
                    >
                      {/* Image hero */}
                      {post.imageUrl && (
                        <div
                          className="relative w-full overflow-hidden"
                          style={{ height: 110 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.imageUrl}
                            alt="Post"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)",
                            }}
                          />
                          {/* song chip over image */}
                          {post.song && (
                            <div
                              className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full px-2 py-1"
                              style={{
                                background: "rgba(0,0,0,0.55)",
                                backdropFilter: "blur(6px)",
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={post.song.albumArt}
                                alt=""
                                width={14}
                                height={14}
                                className="rounded-sm shrink-0"
                              />
                              <span
                                className="text-[10px] text-white truncate"
                                style={{ maxWidth: 100 }}
                              >
                                {post.song.title}
                              </span>
                              <FaSpotify
                                size={10}
                                className="shrink-0"
                                color="#1DB954"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Body */}
                      <div className="px-3 pt-2.5 pb-2.5">
                        {/* song row (no image) */}
                        {!post.imageUrl && post.song && (
                          <div
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 mb-2"
                            style={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={post.song.albumArt}
                              alt=""
                              width={20}
                              height={20}
                              className="rounded shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[11px] font-semibold truncate"
                                style={{ color: "var(--card-foreground)" }}
                              >
                                {post.song.title}
                              </p>
                              <p
                                className="text-[10px] truncate"
                                style={{ color: "var(--muted)" }}
                              >
                                {post.song.artist}
                              </p>
                            </div>
                            <FaSpotify
                              size={12}
                              className="shrink-0"
                              color="#1DB954"
                            />
                          </div>
                        )}

                        {/* Caption */}
                        {post.content ? (
                          <p
                            className="text-[13px] leading-snug line-clamp-2 mb-2.5"
                            style={{ color: "var(--card-foreground)" }}
                          >
                            {post.content}
                          </p>
                        ) : (
                          <p
                            className="text-[12px] italic mb-2.5"
                            style={{ color: "var(--muted)", opacity: 0.6 }}
                          >
                            No caption
                          </p>
                        )}

                        {/* Footer row */}
                        <div className="flex items-center gap-2">
                          {/* Avatar */}
                          <div
                            className="shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold"
                            style={{
                              width: 22,
                              height: 22,
                              background: post.isAnonymous
                                ? "var(--border)"
                                : "var(--primary)",
                              color: post.isAnonymous ? "var(--muted)" : "#fff",
                            }}
                          >
                            {initials}
                          </div>
                          <span
                            className="text-[11px] truncate flex-1 font-medium"
                            style={{ color: "var(--muted)" }}
                          >
                            {post.isAnonymous ? "Anonymous" : post.author}
                          </span>
                          <span
                            className="text-[10px] shrink-0"
                            style={{ color: "var(--muted)", opacity: 0.6 }}
                          >
                            {relTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Footer: New Post ── */}
            <div
              className="px-3 pb-3 pt-2 shrink-0"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setAccountOpen(true);
                  } else {
                    onNewPost?.();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer"
                style={{
                  background: user ? "var(--primary)" : "var(--surface)",
                  color: user ? "#fff" : "var(--muted)",
                  border: user ? "none" : "1px solid var(--border)",
                  boxShadow: user ? "0 2px 12px rgba(84,90,167,.35)" : "none",
                }}
              >
                <FiPlus size={15} />
                {!user ? "Sign in to post" : "New Post"}
              </button>
            </div>
          </>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <FiMapPin
                size={28}
                style={{ color: "var(--primary)", opacity: 0.7 }}
              />
            </div>
            <div>
              <p
                className="text-sm font-semibold mb-1.5"
                style={{ color: "var(--card-foreground)" }}
              >
                No pin selected
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                Double-click anywhere on the map to drop a pin, then tap it to
                see posts here.
              </p>
            </div>
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
