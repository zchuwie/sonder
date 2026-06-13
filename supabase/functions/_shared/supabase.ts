import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function createUserClient(req: Request) {
  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
    auth: { persistSession: false },
  });
}

export function createAdminClient() {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function requireUser(req: Request) {
  const client = createUserClient(req);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Authentication required");
  return data.user;
}
