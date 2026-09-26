import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" ? null : value);

export const riskInputSchema = z.object({
  riskId: z.preprocess(emptyToNull, z.uuid().nullable()).optional(),
  customerId: z.uuid(),
  title: z.string().trim().min(1, "REQUIRED").max(200),
  description: z.preprocess(
    emptyToNull,
    z.string().trim().max(10000).nullable(),
  ),
  type: z.enum([
    "USAGE",
    "ENGAGEMENT",
    "SUPPORT",
    "STAKEHOLDER",
    "ONBOARDING",
    "RENEWAL",
    "COMMERCIAL",
    "OTHER",
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  ownerId: z.uuid(),
  targetResolutionDate: z.preprocess(emptyToNull, z.iso.date().nullable()),
  operationKey: z.string().trim().min(1).max(200),
});

export const riskStatusInputSchema = z.object({
  riskId: z.uuid(),
  customerId: z.uuid().optional(),
  status: z.enum(["OPEN", "MONITORING", "RESOLVED"]),
  resolutionNote: z.preprocess(
    emptyToNull,
    z.string().trim().max(10000).nullable(),
  ),
  operationKey: z.string().trim().min(1).max(200),
});

export const riskMitigationInputSchema = z.object({
  riskId: z.uuid(),
  customerId: z.uuid().optional(),
  operationKey: z.string().trim().min(1).max(200),
});

export type RiskInput = z.infer<typeof riskInputSchema>;
export type RiskStatusInput = z.infer<typeof riskStatusInputSchema>;
