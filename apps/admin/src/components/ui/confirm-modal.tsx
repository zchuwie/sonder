"use client";

import { AdminModal } from "./admin-modal";
import { primaryButtonClass, secondaryButtonClass, dangerButtonClass } from "@/lib/admin-list-utils";

type Variant = "danger" | "primary";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "primary",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <AdminModal onClose={onCancel}>
      <section
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className={secondaryButtonClass}>Cancel</button>
          <button onClick={onConfirm} className={variant === "danger" ? dangerButtonClass : primaryButtonClass}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </AdminModal>
  );
}
