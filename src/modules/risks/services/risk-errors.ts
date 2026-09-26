export class RiskDomainError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "RiskDomainError";
  }
}
