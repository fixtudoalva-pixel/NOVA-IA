import { describe, expect, it } from "vitest";
import { answerBusinessQuestion } from "./ask-business";

const data = { conversations: 4, waitingHuman: 2, pendingApprovals: 1, openActions: 3, assistedRevenueMinor: 12345 };

describe("Ask Your Business", () => {
  it("answers revenue from supplied data", () => {
    expect(answerBusinessQuestion("Quanto vendi?", data)).toContain("123.45");
  });
  it("answers approvals from supplied data", () => {
    expect(answerBusinessQuestion("Tenho aprovações?", data)).toContain("1");
  });
  it("refuses unsupported questions", () => {
    expect(answerBusinessQuestion("Qual é o melhor produto?", data)).toContain("não consigo responder");
  });
});
