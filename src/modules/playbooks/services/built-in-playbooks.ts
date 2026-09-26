export type BuiltInPlaybookKey =
  | "at-risk-recovery"
  | "renewal-preparation"
  | "onboarding-recovery"
  | "low-engagement";

export const builtInPlaybooks: Record<
  BuiltInPlaybookKey,
  {
    name: string;
    description: string;
    triggerType:
      | "AT_RISK_RECOVERY"
      | "RENEWAL_PREPARATION"
      | "ONBOARDING_RECOVERY"
      | "LOW_ENGAGEMENT";
    steps: Array<{
      title: string;
      description: string;
      dueOffsetDays: number;
    }>;
  }
> = {
  "at-risk-recovery": {
    name: "At-Risk Customer",
    description: "Coordinate diagnosis, executive alignment and recovery work.",
    triggerType: "AT_RISK_RECOVERY",
    steps: [
      {
        title: "Review risk and health evidence",
        description:
          "Confirm the signals, recent changes and open commitments.",
        dueOffsetDays: 1,
      },
      {
        title: "Align internally on recovery owner",
        description:
          "Set the plan owner and success criteria before customer outreach.",
        dueOffsetDays: 2,
      },
      {
        title: "Schedule recovery conversation",
        description:
          "Book a customer conversation with the right stakeholders.",
        dueOffsetDays: 3,
      },
    ],
  },
  "renewal-preparation": {
    name: "Renewal Preparation",
    description:
      "Prepare evidence, risks and next steps for an upcoming renewal.",
    triggerType: "RENEWAL_PREPARATION",
    steps: [
      {
        title: "Review renewal readiness",
        description: "Check readiness reasons, health and unresolved risks.",
        dueOffsetDays: 1,
      },
      {
        title: "Confirm stakeholder plan",
        description:
          "Identify sponsor, blockers and the next renewal conversation.",
        dueOffsetDays: 3,
      },
      {
        title: "Document renewal next steps",
        description:
          "Record the agreed plan and update the renewal stage if needed.",
        dueOffsetDays: 5,
      },
    ],
  },
  "onboarding-recovery": {
    name: "Onboarding Recovery",
    description: "Recover delayed onboarding milestones and reset commitments.",
    triggerType: "ONBOARDING_RECOVERY",
    steps: [
      {
        title: "Inspect delayed milestones",
        description: "Review critical overdue work and owners.",
        dueOffsetDays: 1,
      },
      {
        title: "Replan onboarding dates",
        description: "Agree revised milestone dates with the owner.",
        dueOffsetDays: 2,
      },
      {
        title: "Schedule onboarding recovery check-in",
        description: "Create a customer touchpoint to unblock progress.",
        dueOffsetDays: 3,
      },
    ],
  },
  "low-engagement": {
    name: "Low Engagement",
    description: "Restart meaningful contact with a quiet customer.",
    triggerType: "LOW_ENGAGEMENT",
    steps: [
      {
        title: "Review last meaningful interaction",
        description: "Check the latest meeting, call or email context.",
        dueOffsetDays: 1,
      },
      {
        title: "Schedule customer check-in",
        description: "Book the next conversation with a clear agenda.",
        dueOffsetDays: 3,
      },
    ],
  },
};
