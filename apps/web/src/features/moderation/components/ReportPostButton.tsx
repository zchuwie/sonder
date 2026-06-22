"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { reportRemotePost } from "@/features/moderation/client/report-post";
import { getFunctionErrorMessage } from "@/lib/supabase/function-error";

const REPORT_REASONS = [
  ["harassment_bullying", "Harassment or bullying"],
  ["private_information", "Private information / doxxing"],
  ["threats_violence", "Threats or violence"],
  ["hate_discrimination", "Hate or discrimination"],
  ["sexual_exploitation", "Sexual or exploitative content"],
  ["spam_scam", "Spam or scam"],
  ["other_safety", "Other safety concern"],
] as const;

export function ReportPostButton({
  postId,
  className,
  iconOnly = false,
}: {
  postId: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "reported">(() => {
    if (typeof window === "undefined") return "idle";
    const reported = JSON.parse(localStorage.getItem("sonder:reported-posts") ?? "[]") as string[];
    return reported.includes(postId) ? "reported" : "idle";
  });
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  const report = async () => {
    if (!reason) return;
    setState("loading");
    setError("");
    try {
      await reportRemotePost(postId, reason, details.trim() || undefined);
      setState("reported");
      // ponytail: persist reported state in localStorage
      const reported = JSON.parse(localStorage.getItem("sonder:reported-posts") ?? "[]") as string[];
      if (!reported.includes(postId)) { reported.push(postId); localStorage.setItem("sonder:reported-posts", JSON.stringify(reported)); }
      setOpen(false);
    } catch (cause) {
      const message = await getFunctionErrorMessage(
        cause,
        "Unable to report post.",
      );
      if (message === "You have already reported this post.") {
        setState("reported");
        const reported = JSON.parse(localStorage.getItem("sonder:reported-posts") ?? "[]") as string[];
        if (!reported.includes(postId)) { reported.push(postId); localStorage.setItem("sonder:reported-posts", JSON.stringify(reported)); }
        setOpen(false);
      } else {
        setState("idle");
      }
      setError(message);
    }
  };

  return (
    <div className={className}>
      <Button
        variant="outline"
        size={iconOnly ? "icon" : "default"}
        className={iconOnly
          ? "size-9 rounded-full border-red-200 text-red-500 transition-all duration-200 hover:scale-110 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          : "w-full rounded-xl border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
        }
        onClick={() => setOpen(true)}
        disabled={state !== "idle"}
        aria-label="Report post"
      >
        <Flag className={iconOnly ? "size-4" : ""} />
        {!iconOnly && (state === "reported" ? "Reported" : "Report post")}
      </Button>
      {error && !open && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-lg sm:rounded-3xl">
          <DialogHeader className="border-b p-5 pr-12 text-left">
            <DialogTitle>Report this post</DialogTitle>
            <DialogDescription>
              Reports help keep Sonder safe. Abuse of reporting may be limited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-5">
            <div className="grid gap-2">
              {REPORT_REASONS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReason(value)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    reason === value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "bg-muted/25 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div>
              <label
                htmlFor={`report-details-${postId}`}
                className="text-sm font-medium"
              >
                Details{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Textarea
                id={`report-details-${postId}`}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={1000}
                placeholder="Briefly explain the safety concern. Do not add unnecessary private information."
                className="mt-2 min-h-24 rounded-xl"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="border-t p-4 sm:p-5">
            <Button
              variant="ghost"
              className="rounded-xl"
              onClick={() => setOpen(false)}
              disabled={state === "loading"}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => void report()}
              disabled={!reason || state === "loading"}
            >
              {state === "loading" ? "Sending report..." : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
