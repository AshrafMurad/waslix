import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" ? null : value);

export const taskInputSchema = z
  .object({
    taskId: z.preprocess(emptyToNull, z.uuid().nullable()).optional(),
    customerId: z.preprocess(emptyToNull, z.uuid().nullable()),
    title: z.string().trim().min(1).max(200),
    description: z.preprocess(
      emptyToNull,
      z.string().trim().max(10000).nullable(),
    ),
    ownerId: z.uuid(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    dueDate: z.preprocess(
      emptyToNull,
      z.iso.date().nullable(),
    ),
    dueAt: z.preprocess(
      emptyToNull,
      z.iso.datetime({ offset: true }).nullable(),
    ),
    operationKey: z.uuid(),
  })
  .refine((value) => !(value.dueDate && value.dueAt), {
    path: ["dueDate"],
    message: "TASK_DUE_EXCLUSIVE",
  });

export const taskStatusInputSchema = z.object({
  taskId: z.uuid(),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  operationKey: z.uuid(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskStatusInput = z.infer<typeof taskStatusInputSchema>;
