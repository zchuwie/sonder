"use client";

import { useState } from "react";
import { LockKeyhole, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/browser";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured for this deployment.");
      setLoading(false);
      return;
    }
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setError("Incorrect credentials or this user is not authorized.");
        setLoading(false);
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError(
        "Cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and your network connection.",
      );
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm space-y-5 rounded-[2rem] border bg-background/95 p-7 shadow-2xl backdrop-blur"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LockKeyhole className="size-5" />
      </div>
      <div>
        <h1 className="font-serif text-3xl">Private access</h1>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Authorized moderation access only.
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <label htmlFor="admin-email" className="text-xs font-semibold">
          Email
        </label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="admin-password" className="text-xs font-semibold">
          Password
        </label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full rounded-xl" disabled={loading}>
        {loading && <LoaderCircle className="animate-spin" />} Continue
      </Button>
    </form>
  );
}
