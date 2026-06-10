"use client";

import {
  FiChevronRight,
  FiGlobe,
  FiMapPin,
  FiNavigation2,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { LocationPlaceDTO } from "../../types/location.dto";

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
        <FiChevronRight
          size={14}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        />
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
              <FiSearch size={28} style={{ color: "var(--primary)" }} />
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
              <FiX size={16} />
            </button>
          </div>
        )}

        {hasPlace && (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            {place.address && (
              <div className="flex items-start gap-2.5">
                <FiMapPin
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--primary)" }}
                />
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
              <FiGlobe
                size={11}
                style={{ color: "var(--primary)", flexShrink: 0 }}
              />
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
              <FiNavigation2 size={14} />
              Fly to location
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
