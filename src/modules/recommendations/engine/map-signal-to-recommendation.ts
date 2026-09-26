import type { RecommendationType, SignalRuleKey } from "@prisma/client";

export type RecommendationTargetKind = "TASK" | "PLAYBOOK" | "EXISTING_TASK";

export type RecommendationMapping = {
  type: RecommendationType;
  targetKind: RecommendationTargetKind;
  templateKey?: "at-risk-recovery" | "renewal-preparation" | "onboarding-recovery";
  taskTitle?: string;
  dueOffsetDays?: number;
};

export function mapSignalToRecommendation(
  ruleKey: SignalRuleKey,
): RecommendationMapping {
  switch (ruleKey) {
    case "HEALTH_LOW":
      return {
        type: "REVIEW_HEALTH",
        targetKind: "PLAYBOOK",
        templateKey: "at-risk-recovery",
      };
    case "HEALTH_DECLINE":
      return {
        type: "REVIEW_HEALTH",
        targetKind: "TASK",
        taskTitle: "Review health drivers",
        dueOffsetDays: 3,
      };
    case "LOW_ENGAGEMENT":
      return {
        type: "SCHEDULE_CHECK_IN",
        targetKind: "TASK",
        taskTitle: "Schedule customer check-in",
        dueOffsetDays: 3,
      };
    case "RENEWAL_PREPARATION":
    case "RENEWAL_RISK":
      return {
        type: "START_PLAYBOOK",
        targetKind: "PLAYBOOK",
        templateKey: "renewal-preparation",
      };
    case "RENEWAL_DUE":
      return {
        type: "FOLLOW_UP",
        targetKind: "TASK",
        taskTitle: "Confirm renewal next steps",
        dueOffsetDays: 1,
      };
    case "ONBOARDING_DELAY":
      return {
        type: "START_PLAYBOOK",
        targetKind: "PLAYBOOK",
        templateKey: "onboarding-recovery",
      };
    case "UNMANAGED_RISK":
      return {
        type: "CREATE_MITIGATION",
        targetKind: "TASK",
        taskTitle: "Create mitigation plan",
        dueOffsetDays: 3,
      };
    case "RISK_UNRESOLVED":
      return {
        type: "START_PLAYBOOK",
        targetKind: "PLAYBOOK",
        templateKey: "at-risk-recovery",
      };
    case "TASK_OVERDUE":
      return { type: "COMPLETE_TASK", targetKind: "EXISTING_TASK" };
    case "SUPPORT_ESCALATION":
      return {
        type: "REVIEW_SUPPORT",
        targetKind: "TASK",
        taskTitle: "Review unresolved issues",
        dueOffsetDays: 2,
      };
    case "USAGE_DECLINE":
      return {
        type: "REVIEW_HEALTH",
        targetKind: "PLAYBOOK",
        templateKey: "at-risk-recovery",
      };
    case "GOAL_STALLED":
      return {
        type: "REVIEW_GOALS",
        targetKind: "TASK",
        taskTitle: "Review success plan",
        dueOffsetDays: 5,
      };
  }
}
