import { describe, expect, it } from "vitest";

import { calculateAttention } from "./calculate-attention";

describe("attention priority", () => {
  it("groups rule families and raises two medium concerns to high", () => {
    expect(
      calculateAttention([
        {
          id: "1",
          ruleKey: "LOW_ENGAGEMENT",
          subjectKey: "customer",
          episodeKey: "a",
          severity: "MEDIUM",
          deadline: null,
          priorityFact: "21",
        },
        {
          id: "2",
          ruleKey: "GOAL_STALLED",
          subjectKey: "goal:1",
          episodeKey: "b",
          severity: "MEDIUM",
          deadline: "2026-10-01",
          priorityFact: "30",
        },
      ]),
    ).toMatchObject({ priority: "HIGH", nearestDeadline: "2026-10-01" });
  });

  it("produces a stable signature independent of input order", () => {
    const signals = [
      {
        id: "1",
        ruleKey: "HEALTH_LOW",
        subjectKey: "customer",
        episodeKey: "a",
        severity: "HIGH" as const,
        deadline: null,
        priorityFact: "50",
      },
      {
        id: "2",
        ruleKey: "TASK_OVERDUE",
        subjectKey: "task:1",
        episodeKey: "b",
        severity: "HIGH" as const,
        deadline: "2026-09-01",
        priorityFact: "HIGH",
      },
    ];
    expect(calculateAttention(signals)?.evidenceSignature).toBe(
      calculateAttention(signals.reverse())?.evidenceSignature,
    );
  });
});
