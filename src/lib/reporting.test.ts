import { describe, expect, it } from "vitest";
import { startOfUtcReportingWeek, sumRevenueMinor } from "./reporting";

describe("reporting helpers", () => {
  it("starts a Monday week at Monday midnight UTC", () => expect(startOfUtcReportingWeek(new Date("2026-09-21T18:00:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z"));
  it("maps Sunday back to the preceding Monday", () => expect(startOfUtcReportingWeek(new Date("2026-09-27T23:59:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z"));
  it("maps Tuesday back to Monday", () => expect(startOfUtcReportingWeek(new Date("2026-09-22T01:00:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z"));
  it("does not mutate the supplied date", () => { const d=new Date("2026-09-25T12:00:00Z"); startOfUtcReportingWeek(d); expect(d.toISOString()).toBe("2026-09-25T12:00:00.000Z"); });
  it("sums nullable assisted revenue safely", () => expect(sumRevenueMinor([{revenue_minor:100},{revenue_minor:null},{revenue_minor:250}])).toBe(350));
  it("returns zero for missing revenue rows", () => expect(sumRevenueMinor(undefined)).toBe(0));
});
