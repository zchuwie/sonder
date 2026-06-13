"use client";

import { createClient } from "@/lib/supabase/browser";

export async function ensureAnonymousSession() {
  const supabase = createClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    const { data: anonymous, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    return anonymous.session;
  } catch {
    // Remote auth can be unavailable; callers preserve the local fallback.
    return null;
  }
}
