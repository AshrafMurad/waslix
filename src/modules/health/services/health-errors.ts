export class HealthDomainError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "HealthDomainError";
  }
}
