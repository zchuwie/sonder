"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PhotoAttachmentPicker({
  value,
  onChange,
  onFileChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
  onFileChange?: (file?: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return value ? (
    <div className="relative h-24 w-full overflow-hidden rounded-2xl border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={value}
        alt="Selected attachment"
        className="size-full object-cover"
      />
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        className="absolute right-2 top-2 rounded-full"
        onClick={() => {
          onChange(undefined);
          onFileChange?.(undefined);
        }}
        aria-label="Remove photo"
      >
        <X />
      </Button>
    </div>
  ) : (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex h-20 w-full items-center gap-3 rounded-2xl border border-dashed bg-muted/35 p-3 text-left transition hover:border-primary/50 hover:bg-muted/60"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <ImagePlus className="size-5" />
        </span>
        <span>
          <span className="block text-sm font-medium">Add photo</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Optional, shown in a fixed preview
          </span>
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileChange?.(file);
            onChange(URL.createObjectURL(file));
          }
        }}
      />
    </>
  );
}
