import { describe, expect, it } from "vitest";

import { buildCustomerProfiles } from "./profiles";

const now = new Date("2026-09-29T09:00:00.000Z");

describe("demo customer profiles", () => {
  it("builds a deterministic and unique 120-customer portfolio", () => {
    const first = buildCustomerProfiles(now, "waslix-demo-v2");
    expect(buildCustomerProfiles(now, "waslix-demo-v2")).toEqual(first);
    expect(first).toHaveLength(120);
    expect(new Set(first.map((profile) => profile.name)).size).toBe(120);
    expect(new Set(first.map((profile) => profile.externalKey)).size).toBe(120);
  });

  it("preserves the deliberate distributions", () => {
    const profiles = buildCustomerProfiles(now, "waslix-demo-v2");
    const count = (values: string[]) =>
      Object.fromEntries(
        [...new Set(values)].map((value) => [
          value,
          values.filter((item) => item === value).length,
        ]),
      );

    expect(count(profiles.map((profile) => profile.segment))).toEqual({
      MID_MARKET: 36,
      STRATEGIC: 12,
      STARTUP: 24,
      SMB: 48,
    });
    expect(count(profiles.map((profile) => profile.lifecycleKey))).toEqual({
      active: 52,
      renewal: 20,
      onboarding: 18,
      adoption: 16,
      churned: 6,
      new: 8,
    });
    expect(count(profiles.map((profile) => profile.health.status!))).toEqual({
      HEALTHY: 50,
      AT_RISK: 25,
      NEEDS_ATTENTION: 45,
    });
  });

  it("pins the named scenarios to their intended stories", () => {
    const profiles = buildCustomerProfiles(now, "waslix-demo-v2");
    expect(profiles[0]).toMatchObject({
      score: 98,
      scenario: "Perfect healthy customer",
    });
    expect(profiles[1]).toMatchObject({
      score: 35,
      lifecycleKey: "renewal",
      segment: "STRATEGIC",
    });
    expect(profiles[3]).toMatchObject({
      lifecycleKey: "onboarding",
      scenario: "New onboarding account",
    });
    expect(profiles[4]).toMatchObject({
      lifecycleKey: "onboarding",
      scenario: "Delayed onboarding account",
    });
    expect(profiles[10]).toMatchObject({
      lifecycleKey: "churned",
      scenario: "Churned customer",
    });
    expect(profiles[11].taskCount).toBe(10);
    expect(profiles[12].taskCount).toBe(0);
    expect(profiles[13].contactCount).toBe(8);
    expect(profiles[14]).toMatchObject({
      activityCount: 0,
      taskCount: 0,
      website: null,
    });
  });
});
