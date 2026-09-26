import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(""))
  .transform((value) => (value ? value : null));

export const startOnboardingInputSchema = z.object({
  customerId: z.string().uuid(),
  ownerId: z.string().uuid(),
  startDate: optionalDate,
  targetCompletionDate: optionalDate,
  operationKey: z.string().uuid(),
});

export const milestoneInputSchema = z.object({
  customerId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z
    .string()
    .trim()
    .max(10000)
    .optional()
    .default("")
    .transform((v) => v || null),
  ownerId: z.string().uuid(),
  dueDate: optionalDate,
  isCritical: z
    .enum(["on", "true"])
    .optional()
    .transform((value) => Boolean(value)),
  operationKey: z.string().uuid(),
});

export const milestoneStatusInputSchema = z.object({
  customerId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  operationKey: z.string().uuid(),
});

export const adoptionInputSchema = z.object({
  customerId: z.string().uuid(),
  onboardingId: z.string().uuid(),
  operationKey: z.string().uuid(),
});

export type StartOnboardingInput = z.infer<typeof startOnboardingInputSchema>;
export type MilestoneInput = z.infer<typeof milestoneInputSchema>;
export type MilestoneStatusInput = z.infer<typeof milestoneStatusInputSchema>;
export type AdoptionInput = z.infer<typeof adoptionInputSchema>;
