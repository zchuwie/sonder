"use client";

import { useState } from "react";
import { FiUser, FiX } from "react-icons/fi";
import { useUser } from "../../contexts/UserContext";

type Props = { onClose: () => void };

export default function AccountModal({ onClose }: Props) {
  const { user, login, updateName } = useUser();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (user) updateName(trimmed);
    else login(trimmed);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

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
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {user ? (
                <span className="text-base font-bold leading-none">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <FiUser size={18} />
              )}
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--card-foreground)" }}
              >
                {user ? "My Account" : "Join Sonder"}
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {user
                  ? "Edit your display name"
                  : "Set a name to start posting"}
              </p>
            </div>
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
        <div className="p-5 space-y-4">
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
              style={{ color: "var(--muted)" }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="e.g. Alex, Wanderer, Explorer…"
              maxLength={32}
              autoFocus
              className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
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
          </div>
          {!user && (
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              Your name is stored on this device only. You can always post
              anonymously even after signing in.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: saved ? "#22c55e" : "var(--primary)",
              color: "#fff",
            }}
          >
            {saved ? "✓ Saved!" : user ? "Save Changes" : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}
