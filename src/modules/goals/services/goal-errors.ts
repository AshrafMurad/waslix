export class GoalDomainError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "GoalDomainError";
  }
}
