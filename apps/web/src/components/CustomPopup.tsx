import { useEffect, useState } from "react";

export type Post = {
  id: string;
  content: string;
  createdAt: string;
};

export type MarkerData = {
  id: string;
  lat: number;
  lng: number;
  posts: Post[];
};

type Props = {
  marker: MarkerData | null;
  onAddPost: (markerId: string, content: string) => void;
};

export default function MarkerSidebar({ marker, onAddPost }: Props) {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (marker) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker?.id]);

  const handleSubmit = () => {
    if (!marker) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    onAddPost(marker.id, trimmed);
    setInput("");
  };

  return (
    <>
      {/* Toggle tab */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="absolute top-1/2 -translate-y-1/2 right-0 z-20 bg-white shadow-md rounded-l-xl px-1 py-4 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all cursor-pointer"
        style={{ right: open ? "320px" : "0px" }}
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
        className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl flex flex-col z-10 transition-transform duration-300 cursor-default"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        {marker ? (
          <>
            {/* Header */}
            <div className="p-4 border-b">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                Pinned Location
              </p>
              <p className="text-sm font-semibold text-gray-700 mt-1">
                {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
              </p>
            </div>

            {/* Post composer */}
            <div className="p-4 border-b bg-gray-50">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                    handleSubmit();
                }}
                placeholder="Write something about this place..."
                className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                rows={3}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-[#A8D5A2] text-white hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Post
              </button>
            </div>

            {/* Posts list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {marker.posts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-10">
                  No posts yet. Be the first!
                </p>
              ) : (
                [...marker.posts].reverse().map((post) => (
                  <div
                    key={post.id}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
            <span className="text-4xl">📍</span>
            <p className="text-sm font-semibold text-gray-600">
              No location selected
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Switch to <strong>Mark mode</strong> and double-click anywhere on
              the map to pin a location, then click the pin to see its details
              here.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
