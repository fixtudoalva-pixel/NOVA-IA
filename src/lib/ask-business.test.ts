import { describe, expect, it } from "vitest";
import { answerBusinessQuestion } from "./ask-business";

const data = { conversations: 4, waitingHuman: 2, pendingApprovals: 1, openActions: 3, assistedRevenueMinor: 12345, approvedKnowledge: 5 };

describe("Ask Your Business", () => {
  it("answers revenue from supplied data", () => expect(answerBusinessQuestion("Quanto vendi?", data).text).toContain("123.45"));
  it("answers approvals from supplied data", () => expect(answerBusinessQuestion("Tenho aprovações?", data).text).toContain("1"));
  it("routes pending work to approvals", () => expect(answerBusinessQuestion("O que tenho para fazer hoje?", data).href).toBe("/approvals"));
  it("answers approved knowledge count", () => expect(answerBusinessQuestion("Quanto conhecimento aprovado tenho?", data).text).toContain("5"));
  it("does not confuse approved knowledge with pending approvals", () => expect(answerBusinessQuestion("Tenho conhecimento aprovado?", data).href).toBe("/knowledge"));
  it("routes customer waiting questions to inbox", () => expect(answerBusinessQuestion("Tenho clientes à espera?", data).href).toBe("/inbox"));
  it("refuses unsupported questions", () => expect(answerBusinessQuestion("Qual é o melhor produto?", data).text).toContain("não consigo responder"));
  it("handles empty questions", () => expect(answerBusinessQuestion("", data).text).toContain("Escreve"));
});
