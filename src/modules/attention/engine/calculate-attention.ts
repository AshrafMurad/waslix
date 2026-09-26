import { createHash } from "node:crypto";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AttentionSignalFact = {
  id: string;
  ruleKey: string;
  subjectKey: string;
  episodeKey: string;
  severity: Priority;
  deadline: string | null;
  priorityFact: string;
};

const rank: Record<Priority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function calculateAttention(signals: AttentionSignalFact[]) {
  if (!signals.length) return null;
  const ordered = [...signals].sort((a, b) =>
    `${a.ruleKey}:${a.subjectKey}:${a.episodeKey}`.localeCompare(
      `${b.ruleKey}:${b.subjectKey}:${b.episodeKey}`,
    ),
  );
  let priority = ordered.reduce<Priority>(
    (highest, signal) =>
      rank[signal.severity] > rank[highest] ? signal.severity : highest,
    "LOW",
  );
  if (
    priority === "MEDIUM" &&
    new Set(ordered.map((item) => item.ruleKey)).size >= 2
  ) {
    priority = "HIGH";
  }
  const nearestDeadline =
    ordered
      .map((signal) => signal.deadline)
      .filter((value): value is string => value != null)
      .sort()[0] ?? null;
  const signatureSource = ordered.map((signal) => [
    signal.ruleKey,
    signal.subjectKey,
    signal.episodeKey,
    signal.priorityFact,
  ]);
  return {
    priority,
    nearestDeadline,
    reasonKeys: [...new Set(ordered.map((signal) => signal.ruleKey))],
    evidenceSignature: createHash("sha256")
      .update(JSON.stringify(signatureSource))
      .digest("hex"),
  };
}
