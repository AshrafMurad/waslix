export type CustomerErrorCode =
  | "CUSTOMER_NOT_FOUND"
  | "CUSTOMER_FORBIDDEN"
  | "CUSTOMER_ARCHIVED"
  | "CUSTOMER_OWNER_INVALID"
  | "CUSTOMER_STAGE_INVALID"
  | "CONTACT_PRIMARY_CONFLICT";

export class CustomerDomainError extends Error {
  constructor(public readonly code: CustomerErrorCode) {
    super(code);
    this.name = "CustomerDomainError";
  }
}
