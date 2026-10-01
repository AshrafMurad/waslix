import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusBadgeTone =
  "neutral" | "healthy" | "attention" | "risk" | "information";

const dotToneClass: Record<StatusBadgeTone, string> = {
  neutral: "bg-muted-foreground",
  healthy: "bg-healthy",
  attention: "bg-attention",
  risk: "bg-risk",
  information: "bg-information",
};

const borderToneClass: Record<StatusBadgeTone, string> = {
  neutral: "border-border text-muted-foreground",
  healthy: "border-healthy/45 text-foreground",
  attention: "border-attention/45 text-foreground",
  risk: "border-risk/45 text-foreground",
  information: "border-information/45 text-foreground",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
}) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "bg-surface/85 inline-flex h-7 max-w-full items-center gap-2 rounded-full border px-2.5 text-xs leading-none font-semibold tracking-[-0.01em] whitespace-nowrap tabular-nums",
        borderToneClass[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", dotToneClass[tone])}
      />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
