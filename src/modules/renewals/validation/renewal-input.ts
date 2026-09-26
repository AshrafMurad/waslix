import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(""))
  .transform((value) => (value ? value : null));
const requiredDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.coerce.number().min(0).max(9999999999999999);

export const renewalInputSchema = z.object({
  renewalId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  ownerId: z.string().uuid(),
  contractValue: money,
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  startAt: optionalDate,
  renewalAt: requiredDate,
  expectedOutcome: z
    .enum(["UNKNOWN", "RENEW", "EXPAND", "CONTRACT", "CHURN"])
    .optional(),
  operationKey: z.string().uuid(),
});

export const renewalStageInputSchema = z.object({
  renewalId: z.string().uuid(),
  customerId: z.string().uuid(),
  stage: z.enum([
    "UPCOMING",
    "PREPARING",
    "DISCUSSION",
    "NEGOTIATION",
    "COMMITTED",
  ]),
  note: z.string().trim().max(10000).optional().default(""),
  operationKey: z.string().uuid(),
});

export const renewedInputSchema = z.object({
  renewalId: z.string().uuid(),
  customerId: z.string().uuid(),
  outcome: z.enum(["RENEWED", "EXPANDED", "CONTRACTED"]),
  nextRenewalAt: requiredDate,
  nextContractValue: money,
  nextCurrency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  operationKey: z.string().uuid(),
});

export const churnedInputSchema = z.object({
  renewalId: z.string().uuid(),
  customerId: z.string().uuid(),
  churnReason: z.string().trim().min(1).max(10000),
  operationKey: z.string().uuid(),
});

export type RenewalInput = z.infer<typeof renewalInputSchema>;
export type RenewalStageInput = z.infer<typeof renewalStageInputSchema>;
export type RenewedInput = z.infer<typeof renewedInputSchema>;
export type ChurnedInput = z.infer<typeof churnedInputSchema>;
