import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function OperationalCallout({
  title,
  description,
  action,
  tone = "neutral",
}: {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "risk" | "attention" | "healthy";
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-4",
        tone === "risk" && "border-risk/20 bg-risk/5",
        tone === "attention" && "border-attention/20 bg-attention/5",
        tone === "healthy" && "border-healthy/20 bg-healthy/5",
        tone === "neutral" && "bg-raised/60 border-border/70",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
