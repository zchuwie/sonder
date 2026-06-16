"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      setError("Access could not be verified.");
      setLoading(false);
      return;
    }
    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", result.data.user.id)
      .maybeSingle();
    if (!admin) {
      await supabase.auth.signOut();
      window.location.assign("/unauthorized");
      return;
    }
    window.location.assign("/");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-border bg-surface p-7 text-foreground shadow-xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">Sonder admin</p>
      <h1 className="mt-3 text-3xl font-semibold">Moderation access</h1>
      <p className="mt-2 text-sm text-gray-500">Authorized administrators only.</p>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <label className="mt-6 block text-sm font-medium">
        Email
        <input className="mt-2 h-11 w-full rounded-xl border px-3" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Password
        <input className="mt-2 h-11 w-full rounded-xl border px-3" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      <button className="mt-6 h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60" disabled={loading}>
        {loading ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}
