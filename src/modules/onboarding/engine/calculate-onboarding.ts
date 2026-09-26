export const onboardingRuleVersion = "onboarding-v1";

export type OnboardingMilestoneFact = {
  id: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  isCritical: boolean;
  dueDate: string | null;
};

export type OnboardingProgress = {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress: number;
  completedCount: number;
  totalCount: number;
  isDelayed: boolean;
  delayedMilestoneIds: string[];
};

const dayMs = 86_400_000;

function calendarDaysAfter(today: string, date: string) {
  return Math.floor(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) /
      dayMs,
  );
}

export function calculateOnboardingProgress(input: {
  localToday: string;
  targetCompletionDate: string | null;
  milestones: OnboardingMilestoneFact[];
}): OnboardingProgress {
  const totalCount = input.milestones.length;
  const completedCount = input.milestones.filter(
    (milestone) => milestone.status === "COMPLETED",
  ).length;
  const progress = totalCount
    ? Math.floor((completedCount / totalCount) * 100 + 0.5)
    : 0;
  const status =
    totalCount > 0 && completedCount === totalCount
      ? "COMPLETED"
      : completedCount > 0
        ? "IN_PROGRESS"
        : "NOT_STARTED";
  const delayedMilestoneIds = input.milestones
    .filter(
      (milestone) =>
        milestone.status !== "COMPLETED" &&
        milestone.isCritical &&
        milestone.dueDate != null &&
        calendarDaysAfter(input.localToday, milestone.dueDate) >= 5,
    )
    .map((milestone) => milestone.id);
  const targetPassed =
    status !== "COMPLETED" &&
    input.targetCompletionDate != null &&
    input.targetCompletionDate < input.localToday;
  return {
    status,
    progress,
    completedCount,
    totalCount,
    isDelayed: targetPassed || delayedMilestoneIds.length > 0,
    delayedMilestoneIds,
  };
}
