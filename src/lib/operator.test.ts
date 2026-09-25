import { describe, expect, it } from "vitest";
import { evaluateActionPolicy } from "./domain";
import { runDeterministicOperator } from "./operator/engine";

describe("action policy", () => {
  it("blocks critical actions", () => {
    expect(evaluateActionPolicy({ autonomy: 4, risk: "critical", hasExternalSideEffect: true })).toMatchObject({ allowed: false, requiresApproval: true });
  });
  it("allows internal reads without approval", () => {
    expect(evaluateActionPolicy({ autonomy: 0, risk: "low", hasExternalSideEffect: false })).toMatchObject({ allowed: true, requiresApproval: false });
  });
  it("fails closed for an invalid autonomy value", () => {
    expect(evaluateActionPolicy({ autonomy: 9 as never, risk: "low", hasExternalSideEffect: true })).toMatchObject({ allowed: false, requiresApproval: true });
  });
  it("requires approval for external actions at level 2", () => {
    expect(evaluateActionPolicy({ autonomy: 2, risk: "medium", hasExternalSideEffect: true }).requiresApproval).toBe(true);
  });
});

describe("deterministic operator", () => {
  it("never invents a missing price", () => {
    const result = runDeterministicOperator({ message: "Quanto custa trocar o ecrã?", knowledge: [], autonomy: 2 });
    expect(result.intent).toBe("price_enquiry");
    expect(result.reply.toLowerCase()).toContain("não tenho um preço aprovado");
  });
  it("uses approved knowledge supplied to it", () => {
    const result = runDeterministicOperator({
      message: "Quanto custa trocar o ecrã do modelo X?",
      knowledge: [{ kind: "price", title: "Ecrã modelo X", content: "Preço aprovado: 100 €." }],
      autonomy: 2
    });
    expect(result.reply).toContain("100 €");
  });
  it("routes booking intent through human approval at level 2", () => {
    const result = runDeterministicOperator({ message: "Podemos marcar para amanhã?", knowledge: [], autonomy: 2 });
    expect(result.proposedActions[0]?.type).toBe("propose_booking");
    expect(result.needsHuman).toBe(true);
  });
});


describe("operator escalation consistency", () => {
  it("does not invent a human reason when no action requires approval", () => {
    const decision = runDeterministicOperator({ message: "Olá, preciso de ajuda", knowledge: [], autonomy: 4 });
    expect(decision.needsHuman).toBe(false);
    expect(decision.humanReason).toBeNull();
  });

  it("keeps the human reason aligned with policy for booking", () => {
    const decision = runDeterministicOperator({ message: "Quero marcar amanhã", knowledge: [], autonomy: 2 });
    expect(decision.needsHuman).toBe(true);
    expect(decision.humanReason).toContain("aprovação");
  });
});

describe("operator safety edge cases", () => {
  it("does not turn an unknown request into an external action", () => {
    const decision = runDeterministicOperator({ message: "Podes ajudar-me com uma dúvida?", knowledge: [], autonomy: 2 });
    expect(decision.proposedActions).toHaveLength(0);
  });

  it("keeps missing company facts explicit instead of fabricating them", () => {
    const decision = runDeterministicOperator({ message: "Qual é o preço?", knowledge: [], autonomy: 2 });
    expect(decision.reply.toLowerCase()).toContain("não tenho um preço aprovado");
    expect(decision.proposedActions).toHaveLength(0);
  });
});
