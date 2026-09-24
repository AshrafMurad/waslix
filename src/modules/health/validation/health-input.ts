import { z } from "zod";

export const healthInputSchema = z.object({
  customerId: z.uuid("INVALID"),
  dimension: z.enum(["USAGE", "ENGAGEMENT", "SUPPORT", "GOALS"]),
  value: z.coerce.number().int("INVALID").min(0, "INVALID").max(100, "INVALID"),
  observedAt: z.iso
    .date("INVALID")
    .transform((value) => new Date(`${value}T12:00:00.000Z`)),
  isSimulated: z.preprocess(
    (value) => value === "on" || value === "true",
    z.boolean(),
  ),
  operationKey: z.uuid("INVALID"),
});

export const useSystemHealthInputSchema = z.object({
  customerId: z.uuid("INVALID"),
  dimension: z.enum(["ENGAGEMENT", "GOALS"]),
  operationKey: z.uuid("INVALID"),
});

export type HealthInputCommand = z.infer<typeof healthInputSchema>;
