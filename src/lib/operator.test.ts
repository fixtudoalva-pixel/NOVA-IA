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
  it("fails closed for an invalid risk value", () => {
    expect(evaluateActionPolicy({ autonomy: 4, risk: "unknown" as never, hasExternalSideEffect: true })).toMatchObject({ allowed: false, requiresApproval: true });
  });
  it("fails closed for an invalid autonomy value", () => {
    expect(evaluateActionPolicy({ autonomy: 9 as never, risk: "low", hasExternalSideEffect: true })).toMatchObject({ allowed: false, requiresApproval: true });
  });
  it("requires approval for external actions at level 2", () => {
    expect(evaluateActionPolicy({ autonomy: 2, risk: "medium", hasExternalSideEffect: true }).requiresApproval).toBe(true);
  });
});

describe("deterministic operator", () => {
  it("does not classify every quanto question as price", () => {
    expect(runDeterministicOperator({ message: "Quanto tempo demora?", knowledge: [], autonomy: 2 }).intent).toBe("general_enquiry");
  });
  it("never invents a missing price", () => {
    const result = runDeterministicOperator({ message: "Quanto custa trocar o ecrã?", knowledge: [], autonomy: 2 });
    expect(result.intent).toBe("price_enquiry");
    expect(result.reply.toLowerCase()).toContain("não tenho um preço aprovado");
  });
  it("matches accented Portuguese knowledge words", () => {
    const result = runDeterministicOperator({ message: "Qual é a reparação disponível?", knowledge: [{ kind: "service", title: "Reparação", content: "Reparação disponível." }], autonomy: 2 });
    expect(result.reply).toContain("Reparação disponível");
  });
  it("uses approved knowledge supplied to it", () => {
    const result = runDeterministicOperator({
      message: "Quanto custa trocar o ecrã do modelo X?",
      knowledge: [{ kind: "price", title: "Ecrã modelo X", content: "Preço aprovado: 100 €." }],
      autonomy: 2
    });
    expect(result.reply).toContain("100 €");
  });
  it("does not treat a generic hoje statement as booking", () => {
    expect(runDeterministicOperator({ message: "Hoje estou com um problema.", knowledge: [], autonomy: 2 }).proposedActions).toHaveLength(0);
  });
  it("recognizes horario without accent", () => expect(runDeterministicOperator({ message: "Qual o horario disponível?", knowledge: [], autonomy: 2 }).proposedActions[0]?.type).toBe("propose_booking"));
  it("recognizes horário availability as booking intent", () => expect(runDeterministicOperator({ message: "Que horário têm disponível?", knowledge: [], autonomy: 2 }).proposedActions[0]?.type).toBe("propose_booking"));
  it("recognizes agendar as booking intent", () => {
    expect(runDeterministicOperator({ message: "Quero agendar uma visita.", knowledge: [], autonomy: 2 }).proposedActions[0]?.type).toBe("propose_booking");
  });
  it("blocks critical proposed actions at policy level", () => expect(evaluateActionPolicy({ autonomy: 4, risk: "critical", hasExternalSideEffect: true }).allowed).toBe(false));
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
  it("bounds the number of knowledge items echoed in a reply", () => {
    const knowledge = Array.from({ length: 10 }, (_, i) => ({ kind: "fact", title: "Ajuda " + i, content: "ajuda detalhe " + i }));
    const decision = runDeterministicOperator({ message: "Preciso de ajuda", knowledge, autonomy: 2 });
    expect(decision.reply).toContain("Ajuda 0");
    expect(decision.reply).not.toContain("Ajuda 9");
  });
  it("ignores knowledge beyond the bounded context window", () => {
    const knowledge = Array.from({ length: 201 }, (_, i) => ({ kind: "fact", title: `Item ${i}`, content: i === 200 ? "segredoespecial" : "irrelevante" }));
    const decision = runDeterministicOperator({ message: "segredoespecial", knowledge, autonomy: 2 });
    expect(decision.reply).not.toContain("segredoespecial");
  });
  it("ignores malformed blank knowledge", () => {
    const decision = runDeterministicOperator({ message: "Quanto custa?", knowledge: [{ kind: "price", title: "  ", content: "  " }], autonomy: 2 });
    expect(decision.reply.toLowerCase()).toContain("preço");
    expect(decision.reply).not.toContain("  ");
  });
  it("handles whitespace-only input without creating an action", () => {
    const decision = runDeterministicOperator({ message: "   ", knowledge: [], autonomy: 2 });
    expect(decision.proposedActions).toHaveLength(0);
    expect(decision.reply).toContain("mensagem com conteúdo");
  });
  it("does not create booking action from the word hora alone", () => expect(runDeterministicOperator({ message: "Que hora é?", knowledge: [], autonomy: 2 }).proposedActions).toHaveLength(0));
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
