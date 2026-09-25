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
