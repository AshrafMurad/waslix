export type ActivityErrorCode =
  | "ACTIVITY_NOT_FOUND"
  | "ACTIVITY_FORBIDDEN"
  | "ACTIVITY_CUSTOMER_ARCHIVED"
  | "ACTIVITY_CONTACT_INVALID";

export class ActivityDomainError extends Error {
  constructor(readonly code: ActivityErrorCode) {
    super(code);
  }
}
