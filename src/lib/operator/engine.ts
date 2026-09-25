import { OperatorDecisionSchema, type OperatorDecision } from "./contracts";
import { evaluateActionPolicy } from "../domain";

type Knowledge = { kind: string; title: string; content: string };

function findRelevantKnowledge(message: string, knowledge: Knowledge[]) {
  const words = new Set(message.toLocaleLowerCase("pt-PT").split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 2));
  return knowledge.filter(k => {
    const haystack = `${k.title} ${k.content} ${k.kind}`.toLocaleLowerCase("pt-PT");
    return [...words].some(word => haystack.includes(word));
  });
}

export function runDeterministicOperator(input: {
  message: string;
  knowledge: Knowledge[];
  autonomy: 0 | 1 | 2 | 3 | 4;
}): OperatorDecision {
  const message = input.message.trim().slice(0, 4000);
  if (!message) return OperatorDecisionSchema.parse({ intent: "general_enquiry", summary: "Mensagem vazia; nenhuma ação foi proposta.", confidence: 1, reply: "Preciso de uma mensagem com conteúdo para poder ajudar.", proposedActions: [], needsHuman: false, humanReason: null });
  const safeKnowledge = input.knowledge.slice(0, 200).map(k => ({ ...k, title: k.title.trim().slice(0, 160), content: k.content.trim().slice(0, 10000) })).filter(k => k.title.length >= 2 && k.content.length >= 2);
  const relevant = findRelevantKnowledge(message, safeKnowledge);
  const lower = message.toLocaleLowerCase("pt-PT");
  const asksPrice = /preç|custa|quanto\s+(?:custa|fica|é)|orçamento/.test(lower);
  const asksBooking = /marcar|marcação|agendar|agendamento|disponib|vaga|horário|horario/.test(lower) || /(?:amanhã|hoje).*(?:marcar|agendar|hora)|(?:marcar|agendar).*(?:amanhã|hoje)/.test(lower);

  let reply: string;
  let confidence = 0.55;

  if (relevant.length) {
    reply = relevant.slice(0, 5).map(k => `${k.title}: ${k.content}`).join("\\n").slice(0, 8000);
    confidence = 0.88;
  } else if (asksPrice) {
    reply = "Ainda não tenho um preço aprovado para lhe indicar. Posso recolher os detalhes necessários e pedir confirmação?";
    confidence = 0.95;
  } else if (asksBooking) {
    reply = "Posso preparar um pedido de marcação, mas ainda não confirmei disponibilidade. Indique a preferência de dia e horário.";
    confidence = 0.9;
  } else {
    reply = "Obrigado pela mensagem. Para lhe responder corretamente, preciso de mais alguns detalhes sobre o que necessita.";
    confidence = 0.75;
  }

  const proposedActions = asksBooking ? [{
    type: "propose_booking",
    risk: "medium" as const,
    rationale: "O cliente demonstrou intenção de agendamento.",
    payload: {}
  }] : [];

  const policyDecisions = proposedActions.map(a => evaluateActionPolicy({
    autonomy: input.autonomy, risk: a.risk, hasExternalSideEffect: true
  }));
  const needsHuman = policyDecisions.some(p => p.requiresApproval);

  return OperatorDecisionSchema.parse({
    intent: asksPrice ? "price_enquiry" : asksBooking ? "booking_enquiry" : "general_enquiry",
    summary: "Mensagem recebida e analisada com base apenas no conhecimento aprovado.",
    confidence,
    reply,
    proposedActions,
    needsHuman,
    humanReason: needsHuman ? "A política atual exige aprovação para esta ação." : null
  });
}
