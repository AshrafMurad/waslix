import { describe, expect, it } from "vitest";

import { riskInputSchema, riskStatusInputSchema } from "./risk-input";

describe("risk input validation", () => {
  it("associates required create fields with their field names", () => {
    const result = riskInputSchema.safeParse({
      customerId: "",
      title: "",
      description: "",
      type: "OTHER",
      severity: "MEDIUM",
      ownerId: "",
      targetResolutionDate: "",
      operationKey: "create-risk",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["customerId", "title", "ownerId"]),
      );
    }
  });

  it("requires a nonblank resolution note only when resolving", () => {
    const base = {
      riskId: "51000000-0000-4000-8000-000000000001",
      operationKey: "resolve-risk",
    };
    const invalid = riskStatusInputSchema.safeParse({
      ...base,
      status: "RESOLVED",
      resolutionNote: "   ",
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0]).toMatchObject({
        path: ["resolutionNote"],
        message: "REQUIRED",
      });
    }
    expect(
      riskStatusInputSchema.safeParse({
        ...base,
        status: "MONITORING",
        resolutionNote: "",
      }).success,
    ).toBe(true);
  });
});
