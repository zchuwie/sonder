"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../lib/cropImage";
import type { Area } from "react-easy-crop";
import { Dialog, DialogHeader, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  const [filename, setFilename] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !imgSrc) return;
    try {
      const cropped = await getCroppedImg(imgSrc, croppedAreaPixels);
      onFileChange?.(cropped.file);
      onChange(cropped.url);
      setImgSrc("");
    } catch (e) {
      console.error(e);
    }
  };

  if (imgSrc) {
    return (
      <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-black">
        <Cropper
          image={imgSrc}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setImgSrc("");
              setFilename("");
              if (input.current) input.current.value = "";
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-xl"
            onClick={() => void handleCropSave()}
          >
            <Check className="mr-1 size-4" /> Crop
          </Button>
        </div>
      </div>
    );
  }

  return value ? (
    <>
      <div className="w-full rounded-2xl border bg-muted p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="truncate text-sm font-medium text-primary hover:underline"
            onClick={() => setIsExpanded(true)}
          >
            {filename || "cropped-image.jpg"}
          </button>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="rounded-full"
            onClick={() => {
              onChange(undefined);
              onFileChange?.(undefined);
              setFilename("");
              setIsExpanded(false);
            }}
            aria-label="Remove photo"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/80 backdrop-blur-md"
          className="max-w-none sm:max-w-none w-screen h-[100dvh] border-none bg-transparent p-0 shadow-none ring-0 m-0 rounded-none sm:rounded-none flex flex-col items-center justify-center"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50 rounded-full text-white hover:bg-white/20"
            onClick={() => setIsExpanded(false)}
          >
            <X className="size-6" />
          </Button>
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-4 md:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Expanded preview"
              className="max-h-full max-w-full object-contain drop-shadow-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
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
            Use a photo you can share. Avoid faces, IDs, and addresses.
          </span>
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            setFilename(file.name);
            setImgSrc(URL.createObjectURL(file));
          }
        }}
      />
    </>
  );
}
