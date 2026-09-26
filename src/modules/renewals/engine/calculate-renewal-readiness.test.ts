import { describe, expect, it } from "vitest";

import {
  calculateRenewalReadiness,
  daysUntilRenewal,
} from "./calculate-renewal-readiness";

describe("calculateRenewalReadiness", () => {
  it("uses inclusive renewal day boundaries", () => {
    expect(daysUntilRenewal("2026-09-26", "2026-12-25")).toBe(90);
    expect(daysUntilRenewal("2026-09-26", "2026-11-25")).toBe(60);
    expect(daysUntilRenewal("2026-09-26", "2026-10-26")).toBe(30);
    expect(daysUntilRenewal("2026-09-26", "2026-10-10")).toBe(14);
    expect(daysUntilRenewal("2026-09-26", "2026-10-03")).toBe(7);
  });

  it("does not assess outside the sixty-day window", () => {
    expect(
      calculateRenewalReadiness({
        localToday: "2026-09-26",
        renewalAt: "2026-11-26",
        healthScore: 100,
        supportScore: 100,
        lastMeaningfulInteractionAt: "2026-09-25",
        unresolvedRisks: [],
        goals: [{ progress: 100, status: "ACHIEVED" }],
        onboardingDelayed: false,
      }),
    ).toMatchObject({ status: null, pending: false, reasons: [] });
  });

  it("classifies at-risk and needs-attention reasons deterministically", () => {
    expect(
      calculateRenewalReadiness({
        localToday: "2026-09-26",
        renewalAt: "2026-11-25",
        healthScore: 59,
        supportScore: 41,
        lastMeaningfulInteractionAt: "2026-09-25",
        unresolvedRisks: [],
        goals: [{ progress: 80, status: "IN_PROGRESS" }],
        onboardingDelayed: false,
      }).status,
    ).toBe("AT_RISK");

    expect(
      calculateRenewalReadiness({
        localToday: "2026-09-26",
        renewalAt: "2026-11-25",
        healthScore: 79,
        supportScore: 100,
        lastMeaningfulInteractionAt: "2026-09-01",
        unresolvedRisks: [],
        goals: [],
        onboardingDelayed: true,
      }),
    ).toMatchObject({
      status: "NEEDS_ATTENTION",
      reasons: [
        "HEALTH_NEEDS_ATTENTION",
        "ENGAGEMENT_STALE",
        "GOALS_MISSING",
        "ONBOARDING_DELAYED",
      ],
    });
  });
});
