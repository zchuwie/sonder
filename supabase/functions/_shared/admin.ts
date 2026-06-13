import { requireUser } from "./supabase.ts";

export async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  const adminEmail = Deno.env.get("ADMIN_EMAIL")?.toLowerCase();
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
    throw new Error("Admin access required");
  }
  return user;
}
