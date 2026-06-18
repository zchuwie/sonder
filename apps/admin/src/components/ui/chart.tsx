"use client";

import type * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>;

export function ChartContainer({
  className,
  config,
  children,
  ...props
}: React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactElement }) {
  const style = Object.fromEntries(
    Object.entries(config).flatMap(([key, value]) => value.color ? [[`--color-${key}`, value.color]] : []),
  ) as React.CSSProperties;
  return (
    <div
      data-slot="chart"
      className={cn("h-full w-full rounded-2xl bg-muted/35 p-3 text-xs text-muted-foreground", className)}
      style={{ ...style, ...props.style }}
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayload = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={`${item.dataKey ?? item.name}`} className="flex min-w-28 items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <strong className="text-foreground">{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
