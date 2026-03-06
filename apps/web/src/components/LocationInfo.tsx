"use client";

import { LocationPlaceDTO } from "../types/location.dto";

type Props = {
  place: LocationPlaceDTO | null;
  isOpen: boolean;
  onToggle: () => void;
  onFlyTo: (place: LocationPlaceDTO) => void;
  onClose: () => void;
};

const TOP_CLEARANCE = 76;
const PANEL_WIDTH = "min(340px, 88vw)";

export default function LocationInfo({
  place,
  isOpen,
  onToggle,
  onFlyTo,
  onClose,
}: Props) {
  const hasPlace = place !== null;

  return (
    <div
      className="absolute left-0 top-0 z-20 transition-transform duration-300 ease-in-out"
      style={{
        width: PANEL_WIDTH,
        height: "100%",
        overflow: "visible",
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        pointerEvents: "none",
      }}
    >
      <button
        onClick={onToggle}
        aria-label={isOpen ? "Close location info" : "Open location info"}
        className="absolute flex items-center justify-center"
        style={{
          right: "-20px",
          top: `calc(50% + ${TOP_CLEARANCE / 2}px)`,
          transform: "translateY(-50%)",
          width: "20px",
          height: "52px",
          background: "var(--card)",
          color: "var(--muted)",
          border: "1px solid var(--border)",
          borderLeft: "none",
          borderRadius: "0 10px 10px 0",
          boxShadow: "3px 0 8px rgba(0,0,0,.12)",
          cursor: "pointer",
          pointerEvents: "auto",
          zIndex: 1,
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontSize: "14px",
            fontWeight: "bold",
            lineHeight: 1,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        >
          ›
        </span>
      </button>

      <aside
        aria-label="Location details"
        className="flex flex-col w-full h-full"
        style={{
          paddingTop: 0,
          background: "var(--card)",
          color: "var(--card-foreground)",
          borderRight: "1px solid var(--border)",
          boxShadow: "4px 0 24px rgba(0,0,0,.15)",
          overflow: "hidden",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {!hasPlace && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--primary)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "var(--foreground)" }}
              >
                Search a location
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                Use the search bar above to find a place and see its details
                here.
              </p>
            </div>
          </div>
        )}

        {hasPlace && (
          <div
            className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="min-w-0 flex-1">
              {place.category && (
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2"
                  style={{
                    background: "var(--surface)",
                    color: "var(--primary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {place.category}
                </span>
              )}
              <h2
                className="text-base font-bold leading-snug"
                style={{ color: "var(--foreground)", wordBreak: "break-word" }}
                title={place.name}
              >
                {place.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close location info"
              className="shrink-0 rounded-lg p-1.5"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {hasPlace && (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            {place.address && (
              <div className="flex items-start gap-2.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--primary)" }}
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
                </svg>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {place.address}
                </p>
              </div>
            )}

            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
              style={{
                background: "var(--surface)",
                color: "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--primary)", flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {place.lat.toFixed(5)},&nbsp;{place.lng.toFixed(5)}
            </div>

            {place.description && place.description !== place.address && (
              <>
                <hr style={{ borderColor: "var(--border)", margin: 0 }} />
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--card-foreground)" }}
                >
                  {place.description}
                </p>
              </>
            )}

            {place.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {place.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-0.5 rounded-full"
                    style={{
                      background: "var(--surface)",
                      color: "var(--muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {hasPlace && (
          <div
            className="px-5 py-4 shrink-0"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              onClick={() => onFlyTo(place)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--primary-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--primary)")
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              Fly to location
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
