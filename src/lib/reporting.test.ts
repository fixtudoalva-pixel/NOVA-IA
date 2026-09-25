import { describe, expect, it } from "vitest";
import { formatMoneyMinor, startOfUtcReportingWeek, sumRevenueMinor } from "./reporting";

describe("reporting helpers", () => {
  it("starts a Monday week at Monday midnight UTC", () => expect(startOfUtcReportingWeek(new Date("2026-09-21T18:00:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z"));
  it("maps Sunday back to the preceding Monday", () => expect(startOfUtcReportingWeek(new Date("2026-09-27T23:59:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z"));
  it("maps Tuesday back to Monday", () => expect(startOfUtcReportingWeek(new Date("2026-09-22T01:00:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z"));
  it("does not mutate the supplied date", () => { const d=new Date("2026-09-25T12:00:00Z"); startOfUtcReportingWeek(d); expect(d.toISOString()).toBe("2026-09-25T12:00:00.000Z"); });
  it("sums nullable assisted revenue safely", () => expect(sumRevenueMinor([{revenue_minor:100},{revenue_minor:null},{revenue_minor:250}])).toBe(350));
  it("formats tenant currency", () => expect(formatMoneyMinor(12345, "en-US", "USD")).toContain("$123.45"));
  it("falls back safely for invalid currency configuration", () => expect(formatMoneyMinor(12345, "bad-locale", "NOPE")).toContain("€"));
  it("returns zero for missing revenue rows", () => expect(sumRevenueMinor(undefined)).toBe(0));
});
