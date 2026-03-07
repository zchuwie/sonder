"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useUser } from "../../contexts/UserContext";

type Props = {
  onClose: () => void;
  onOpenAccount: () => void;
};

export default function SettingsModal({ onClose, onOpenAccount }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const { logout } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-95 rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.38)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--border)",
            }}
          />
        </div>
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 38,
                height: 38,
                background: "var(--surface)",
                color: "var(--card-foreground)",
                border: "1px solid var(--border)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a6.97 6.97 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--card-foreground)" }}
            >
              Settings
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-colors"
            style={{ width: 28, height: 28, color: "var(--muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Appearance */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2.5"
              style={{ color: "var(--muted)" }}
            >
              Appearance
            </p>
            <div className="flex gap-2">
              {(
                [
                  {
                    value: "light",
                    label: "Liberty",
                    sub: "Light",
                    icon: "☀️",
                  },
                  { value: "dark", label: "Fiord", sub: "Dark", icon: "🌙" },
                ] as const
              ).map(({ value, label, sub, icon }) => {
                const active = mounted && resolvedTheme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className="flex-1 flex flex-col items-center gap-1 py-3.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: active ? "var(--primary)" : "var(--surface)",
                      color: active
                        ? "var(--primary-foreground)"
                        : "var(--card-foreground)",
                      border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                    }}
                  >
                    <span className="text-xl leading-none">{icon}</span>
                    <span className="font-semibold">{label}</span>
                    <span style={{ opacity: 0.65 }}>{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account */}
          <div
            className="pt-1"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2.5"
              style={{ color: "var(--muted)" }}
            >
              Account
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAccount();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: "var(--surface)",
                  color: "var(--card-foreground)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--border)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--surface)")
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="currentColor"
                >
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: "var(--surface)",
                  color: "var(--destructive, #ef4444)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--border)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--surface)")
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="currentColor"
                >
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
