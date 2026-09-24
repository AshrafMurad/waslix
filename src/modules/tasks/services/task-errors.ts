export type TaskErrorCode =
  | "TASK_NOT_FOUND"
  | "TASK_FORBIDDEN"
  | "TASK_CUSTOMER_ARCHIVED"
  | "TASK_OWNER_INVALID"
  | "TASK_TRANSITION_INVALID";

export class TaskDomainError extends Error {
  constructor(readonly code: TaskErrorCode) {
    super(code);
  }
}
