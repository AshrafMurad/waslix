import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

it("keeps English and Arabic common catalog keys aligned", () => {
  const en = JSON.parse(readFileSync("messages/en/common.json", "utf8"));
  const ar = JSON.parse(readFileSync("messages/ar/common.json", "utf8"));

  expect(Object.keys(ar.home).sort()).toEqual(Object.keys(en.home).sort());
});
