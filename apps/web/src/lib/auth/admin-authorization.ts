import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_ENTRY_PATH = "/verdant-keeper-7q4m9x";

export async function getAdminUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  return adminEmail && data.user?.email?.toLowerCase() === adminEmail
    ? data.user
    : null;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect(ADMIN_ENTRY_PATH);
  return user;
}
