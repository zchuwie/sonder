"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

export function AdminLogoutButton() {
  return (
    <Button
      variant="ghost"
      className="rounded-xl"
      onClick={async () => {
        await createClient()?.auth.signOut();
        window.location.assign("/");
      }}
    >
      <LogOut /> Sign out
    </Button>
  );
}
