import { describe, expect, it } from "vitest";

import { evaluateSignals, type SignalFacts } from "./evaluate-signals";

const base: SignalFacts = {
  now: new Date("2026-09-24T12:00:00Z"),
  localToday: "2026-09-24",
  customerSince: "2026-01-01",
  health: null,
  baseline30: null,
  lastMeaningfulInteractionAt: new Date("2026-09-01T12:00:00Z"),
  risks: [],
  tasks: [],
  goals: [],
};

describe("signal engine", () => {
  it("detects canonical health thresholds and distinct risk facts", () => {
    const signals = evaluateSignals({
      ...base,
      health: {
        id: "health",
        overallScore: 39,
        supportScore: 40,
        usageScore: 40,
        isSimulated: false,
      },
      baseline30: { overallScore: 55, usageScore: 65 },
      risks: [
        {
          id: "risk",
          severity: "HIGH",
          status: "OPEN",
          targetResolutionDate: null,
          hasMitigation: false,
        },
      ],
    });
    expect(signals.map((signal) => signal.ruleKey)).toEqual([
      "HEALTH_DECLINE",
      "HEALTH_LOW",
      "LOW_ENGAGEMENT",
      "RISK_UNRESOLVED",
      "SUPPORT_ESCALATION",
      "UNMANAGED_RISK",
      "USAGE_DECLINE",
    ]);
    expect(
      signals.find((signal) => signal.ruleKey === "HEALTH_LOW")?.severity,
    ).toBe("CRITICAL");
  });

  it("does not fabricate engagement age without a start or interaction", () => {
    expect(
      evaluateSignals({
        ...base,
        customerSince: null,
        lastMeaningfulInteractionAt: null,
      }),
    ).toEqual([]);
  });
});
