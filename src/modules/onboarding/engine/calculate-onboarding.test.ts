import { describe, expect, it } from "vitest";

import { calculateOnboardingProgress } from "./calculate-onboarding";

describe("calculateOnboardingProgress", () => {
  it("rounds milestone progress half up and does not complete zero milestones", () => {
    expect(
      calculateOnboardingProgress({
        localToday: "2026-09-26",
        targetCompletionDate: null,
        milestones: [
          { id: "1", status: "COMPLETED", isCritical: true, dueDate: null },
          { id: "2", status: "COMPLETED", isCritical: true, dueDate: null },
          { id: "3", status: "COMPLETED", isCritical: true, dueDate: null },
          { id: "4", status: "COMPLETED", isCritical: true, dueDate: null },
          { id: "5", status: "IN_PROGRESS", isCritical: true, dueDate: null },
          { id: "6", status: "NOT_STARTED", isCritical: false, dueDate: null },
        ],
      }).progress,
    ).toBe(67);

    expect(
      calculateOnboardingProgress({
        localToday: "2026-09-26",
        targetCompletionDate: null,
        milestones: [],
      }),
    ).toMatchObject({ progress: 0, status: "NOT_STARTED" });
  });

  it("marks delay at the five-day critical milestone boundary or passed target", () => {
    expect(
      calculateOnboardingProgress({
        localToday: "2026-09-26",
        targetCompletionDate: null,
        milestones: [
          {
            id: "critical",
            status: "IN_PROGRESS",
            isCritical: true,
            dueDate: "2026-09-21",
          },
        ],
      }),
    ).toMatchObject({ isDelayed: true, delayedMilestoneIds: ["critical"] });

    expect(
      calculateOnboardingProgress({
        localToday: "2026-09-26",
        targetCompletionDate: "2026-09-25",
        milestones: [
          {
            id: "normal",
            status: "IN_PROGRESS",
            isCritical: false,
            dueDate: "2026-09-20",
          },
        ],
      }).isDelayed,
    ).toBe(true);
  });
});
