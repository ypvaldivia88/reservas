"use client";

import { cn } from "@/lib/utils";

export default function ScheduleAlert({ message }: { message: string }) {
  const isError = message.includes("❌");

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-medium",
        isError
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/30 bg-primary/10 text-foreground"
      )}
    >
      {message}
    </div>
  );
}
