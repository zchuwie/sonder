"use client";

import { useMemo } from "react";
import qrcode from "qrcode-generator";

export function ShareCardQR({ url, size = 100 }: { url: string; size?: number }) {
  const svg = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    const modules = qr.getModuleCount();
    const cellSize = size / modules;
    let path = "";
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (qr.isDark(row, col)) {
          path += `M${col * cellSize},${row * cellSize}h${cellSize}v${cellSize}h-${cellSize}z`;
        }
      }
    }
    return path;
  }, [url, size]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg bg-[#f5f1e8] p-1.5">
      <path d={svg} fill="#0f1c14" />
    </svg>
  );
}
