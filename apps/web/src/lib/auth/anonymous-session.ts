"use client";

import { createClient } from "@/lib/supabase/browser";

// ponytail: cache the session in-memory so repeated calls don't hit auth on every action.
let cachedSession: Awaited<ReturnType<typeof ensureAnonymousSession>> = null;

export async function ensureAnonymousSession() {
  if (cachedSession) return cachedSession;/*  */

  const supabase = createClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      cachedSession = data.session;
      return data.session;
    }
    const { data: anonymous, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    cachedSession = anonymous.session;
    return anonymous.session;
  } catch {
    return null;
  }
}
