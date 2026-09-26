export class RenewalDomainError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "RenewalDomainError";
  }
}
