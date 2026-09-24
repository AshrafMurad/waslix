import { z } from "zod";

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(maximum, "INVALID").nullable(),
  );

export const goalInputSchema = z.object({
  goalId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.uuid("INVALID").optional(),
  ),
  customerId: z.uuid("INVALID"),
  title: z.string().trim().min(1, "REQUIRED").max(200, "INVALID"),
  description: optionalText(10000),
  ownerId: z.uuid("INVALID"),
  progress: z.coerce
    .number()
    .int("INVALID")
    .min(0, "INVALID")
    .max(100, "INVALID"),
  status: z.enum([
    "NOT_STARTED",
    "IN_PROGRESS",
    "AT_RISK",
    "ACHIEVED",
    "CANCELLED",
  ]),
  targetDate: z.preprocess(
    (value) => (value === "" ? null : value),
    z.iso.date("INVALID").nullable(),
  ),
  operationKey: z.uuid("INVALID"),
});

export type GoalInput = z.infer<typeof goalInputSchema>;
