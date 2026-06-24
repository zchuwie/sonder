"use client";

import { useMemo } from "react";
import qrcode from "qrcode-generator";

export function ShareCardQR({ url, size = 90 }: { url: string; size?: number }) {
  const path = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount();
    const cell = size / n;
    let d = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) {
          d += `M${c * cell},${r * cell}h${cell}v${cell}h-${cell}z`;
        }
      }
    }
    return d;
  }, [url, size]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={path} fill="#111" />
    </svg>
  );
}
