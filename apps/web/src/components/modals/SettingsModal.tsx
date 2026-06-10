"use client";

import {
  FiLogOut,
  FiMoon,
  FiSettings,
  FiSun,
  FiUser,
  FiX,
} from "react-icons/fi";
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
              <FiSettings size={18} />
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
            <FiX size={14} />
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
                    icon: <FiSun size={20} />,
                  },
                  {
                    value: "dark",
                    label: "Fiord",
                    sub: "Dark",
                    icon: <FiMoon size={20} />,
                  },
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
                <FiUser size={15} />
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
                <FiLogOut size={15} />
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
