import { describe, expect, it } from "vitest";
import { hasUnsafeControlChars, isUuid, normalizeSingleLine } from "./validation";

describe("input validation", () => {
  it("accepts a standard v4 UUID", () => expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true));
  it("rejects arbitrary 36-character identifiers", () => expect(isUuid("zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz")).toBe(false));
  it("rejects missing UUID separators", () => expect(isUuid("550e8400e29b41d4a716446655440000")).toBe(false));
  it("normalizes repeated whitespace", () => expect(normalizeSingleLine("  Nova   Empresa  ", 120)).toBe("Nova Empresa"));
  it("bounds normalized single-line values", () => expect(normalizeSingleLine("abcdef", 3)).toBe("abc"));
  it("detects unsafe control characters", () => expect(hasUnsafeControlChars("ok\u0000bad")).toBe(true));
  it("allows ordinary line breaks", () => expect(hasUnsafeControlChars("linha 1\nlinha 2")).toBe(false));
});
