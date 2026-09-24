import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" ? null : value);

export const activityInputSchema = z.object({
  customerId: z.uuid(),
  type: z.enum(["MEETING", "CALL", "EMAIL", "NOTE"]),
  title: z.string().trim().min(1).max(200),
  description: z.preprocess(
    emptyToNull,
    z.string().trim().max(10000).nullable(),
  ),
  contactId: z.preprocess(emptyToNull, z.uuid().nullable()),
  occurredAt: z.coerce.date(),
  isMeaningful: z.preprocess(
    (value) => value === "on" || value === "true",
    z.boolean(),
  ),
  operationKey: z.uuid(),
});

export type ActivityInput = z.infer<typeof activityInputSchema>;
