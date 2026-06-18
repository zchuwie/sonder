"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/browser";

type AdminRealtimeTable = "posts" | "post_reports" | "moderation_events";

export function useAdminRealtime(tables: AdminRealtimeTable[], refresh: () => void | Promise<unknown>) {
  const refreshRef = useRef(refresh);
  const tablesKey = tables.join(",");

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const refreshSoon = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void Promise.resolve(refreshRef.current()).catch(() => undefined);
      }, 200);
    };
    let channel = supabase.channel(`admin:${tablesKey}`);

    for (const table of tablesKey.split(",") as AdminRealtimeTable[]) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        refreshSoon,
      );
    }

    channel.subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [tablesKey]);
}
