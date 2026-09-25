import { describe, expect, it } from "vitest";

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

describe("mutation identifier shape", () => {
  it("accepts a standard v4 UUID", () => expect(validUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true));
  it("rejects arbitrary 36-character identifiers", () => expect(validUuid("zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz")).toBe(false));
  it("rejects missing separators", () => expect(validUuid("550e8400e29b41d4a716446655440000")).toBe(false));
});
