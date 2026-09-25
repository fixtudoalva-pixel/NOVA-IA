import { describe, expect, it } from "vitest";
import { answerBusinessQuestion } from "./ask-business";

const data = { conversations: 4, waitingHuman: 2, pendingApprovals: 1, openActions: 3, assistedRevenueMinor: 12345, weeklyAssistedRevenueMinor: 4567, approvedKnowledge: 5 };

describe("Ask Your Business", () => {
  it("answers revenue from supplied data", () => expect(answerBusinessQuestion("Quanto vendi?", data).text).toContain("123,45"));
  it("answers approvals from supplied data", () => expect(answerBusinessQuestion("Tenho aprovações?", data).text).toContain("1"));
  it("routes pending work to approvals", () => expect(answerBusinessQuestion("O que tenho para fazer hoje?", data).href).toBe("/approvals"));
  it("answers approved knowledge count", () => expect(answerBusinessQuestion("Quanto conhecimento aprovado tenho?", data).text).toContain("5"));
  it("does not confuse approved knowledge with pending approvals", () => expect(answerBusinessQuestion("Tenho conhecimento aprovado?", data).href).toBe("/knowledge"));
  it("routes customer waiting questions to inbox", () => expect(answerBusinessQuestion("Tenho clientes à espera?", data).href).toBe("/inbox"));
  it("does not treat every customer question as waiting-human", () => expect(answerBusinessQuestion("O que aconteceu com o cliente João?", data).text).toContain("não consigo responder"));
  it("recognizes reply-needed customer wording", () => expect(answerBusinessQuestion("Que clientes tenho para responder?", data).href).toBe("/inbox"));
  it("does not map pending opportunities to generic actions", () => expect(answerBusinessQuestion("Que oportunidades tenho pendentes?", data).text).toContain("não consigo responder"));
  it("still recognizes explicit pending actions", () => expect(answerBusinessQuestion("Que ações tenho pendentes?", data).href).toBe("/approvals"));
  it("refuses unsupported questions", () => expect(answerBusinessQuestion("Qual é o melhor produto?", data).text).toContain("não consigo responder"));
  it("handles uppercase Portuguese questions", () => expect(answerBusinessQuestion("TENHO APROVAÇÕES?", data).href).toBe("/approvals"));
  it("handles empty questions", () => expect(answerBusinessQuestion("", data).text).toContain("Escreve"));
  it("rejects one-character questions", () => expect(answerBusinessQuestion("?", data).text).toContain("mais completa"));
  it("does not invent revenue for unsupported questions", () => expect(answerBusinessQuestion("Diz-me o lucro líquido", data).text).toContain("não consigo responder"));
  it("recognizes faturação as assisted revenue wording", () => expect(answerBusinessQuestion("Qual é a faturação registada?", data).href).toBe("/actions"));
  it("answers weekly revenue from weekly data", () => {
    const text = answerBusinessQuestion("Quanto tenho de receita esta semana?", data).text;
    expect(text).toContain("45,67");
    expect(text).toContain("esta semana");
  });
  it("labels assisted revenue as non-causal", () => expect(answerBusinessQuestion("Quanto vendi?", data).text).toContain("não prova causalidade"));
  it("formats revenue with tenant currency", () => expect(answerBusinessQuestion("Quanto vendi?", { ...data, locale: "en-US", currency: "USD" }).text).toContain("$123.45"));
  it("formats default revenue as Portuguese EUR", () => {
    const text = answerBusinessQuestion("Quanto vendi?", data).text;
    expect(text).toContain("123,45");
    expect(text).toContain("€");
  });
});
