export class OnboardingDomainError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "OnboardingDomainError";
  }
}
