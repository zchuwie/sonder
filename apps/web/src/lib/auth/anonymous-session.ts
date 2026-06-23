"use client";

import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";

let cachedSession: Session | null = null;

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
