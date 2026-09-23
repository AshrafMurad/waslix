import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("English and Arabic common catalogs expose matching keys", () => {
  const en = JSON.parse(readFileSync("messages/en/common.json", "utf8"));
  const ar = JSON.parse(readFileSync("messages/ar/common.json", "utf8"));

  assert.deepEqual(Object.keys(ar.home).sort(), Object.keys(en.home).sort());
});
