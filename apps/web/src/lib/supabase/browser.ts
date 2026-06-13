"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export function createClient() {
  const config = getPublicSupabaseConfig();
  return config ? createBrowserClient<Database>(config.url, config.key) : null;
}
