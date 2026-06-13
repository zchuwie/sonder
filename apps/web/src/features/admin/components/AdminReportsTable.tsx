import Link from "next/link";
import { Flag, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Database } from "@/lib/supabase/database.types";

type Report = Database["public"]["Tables"]["post_reports"]["Row"];

export function AdminReportsTable({ reports }: { reports: Report[] | null }) {
  return (
    <main className="min-h-dvh bg-muted/40 p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <Flag className="size-5 text-primary" /> Reports queue
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Reports are private and available only to the authorized admin.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin">Back to moderation</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {reports?.length ? (
            reports.map((report) => (
              <Card key={report.id} className="rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {report.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-4 font-semibold">{report.reason}</p>
                {report.details && (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {report.details}
                  </p>
                )}
                <p className="mt-4 font-mono text-[10px] text-muted-foreground">
                  Post: {report.post_id}
                </p>
              </Card>
            ))
          ) : (
            <div className="grid place-items-center gap-3 rounded-3xl border border-dashed bg-background/70 px-6 py-20 text-center">
              <Inbox className="size-8 text-primary" />
              <p className="text-sm font-medium">No reports are waiting.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
