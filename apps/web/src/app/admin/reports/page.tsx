import Link from "next/link";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return <main className="grid min-h-dvh place-items-center bg-muted/40 p-6 text-center"><div className="space-y-4"><Flag className="mx-auto size-8 text-primary" /><h1 className="text-xl font-semibold">Reports queue</h1><p className="text-sm text-muted-foreground">Report persistence will be connected with Supabase.</p><Button asChild className="rounded-xl"><Link href="/admin">Back to moderation</Link></Button></div></main>;
}
