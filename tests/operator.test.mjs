import test from "node:test";
import assert from "node:assert/strict";
import { evaluateActionPolicy } from "../src/lib/domain.ts";
import { propose } from "../src/lib/operator/simulator.ts";
import { OperatorDecisionSchema } from "../src/lib/operator/contracts.ts";

test("observe and recommend cannot produce external actions", () => {
  for (const autonomy of [0, 1]) {
    const result = evaluateActionPolicy({ autonomy, risk: "low", hasExternalSideEffect: true });
    assert.equal(result.allowed, false);
  }
});

test("approval boundary remains in place for high and critical risk", () => {
  assert.equal(evaluateActionPolicy({ autonomy: 2, risk: "low", hasExternalSideEffect: true }).requiresApproval, true);
  assert.equal(evaluateActionPolicy({ autonomy: 3, risk: "low", hasExternalSideEffect: true }).requiresApproval, false);
  assert.equal(evaluateActionPolicy({ autonomy: 4, risk: "high", hasExternalSideEffect: true }).requiresApproval, true);
  assert.equal(evaluateActionPolicy({ autonomy: 4, risk: "critical", hasExternalSideEffect: true }).allowed, false);
});

test("unknown pricing asks a question instead of inventing a price", () => {
  const result = propose("Quanto custa trocar o ecrã?", "");
  assert.equal(result.intent, "pricing");
  assert.doesNotMatch(result.text, /€|euros/i);
  assert.match(result.text, /modelo/i);
});

test("discount requests escalate without offering a discount", () => {
  const result = propose("Fazem desconto?", "Troca de ecrã €100");
  assert.equal(result.risk, "high");
  assert.doesNotMatch(result.text, /€100/);
});

test("simulator proposal can satisfy the operator contract", () => {
  const proposal = propose("Quero marcar amanhã", "");
  const decision = OperatorDecisionSchema.parse({
    intent: proposal.intent, summary: proposal.reason, confidence: 1, reply: proposal.text,
    needsHuman: true,
    proposedActions: [{ type: "reply_to_customer", risk: proposal.risk, rationale: proposal.reason, payload: { body: proposal.text } }]
  });
  assert.equal(decision.proposedActions[0].risk, "medium");
  assert.match(decision.reply, /confirmo a disponibilidade/i);
});
