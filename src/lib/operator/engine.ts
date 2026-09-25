import { OperatorDecisionSchema, type OperatorDecision } from "./contracts";
import { evaluateActionPolicy } from "@/lib/domain";

type Knowledge = { kind: string; title: string; content: string };

function findRelevantKnowledge(message: string, knowledge: Knowledge[]) {
  const words = new Set(message.toLocaleLowerCase().split(/\W+/).filter(w => w.length > 2));
  return knowledge.filter(k => {
    const haystack = `${k.title} ${k.content} ${k.kind}`.toLocaleLowerCase();
    return [...words].some(word => haystack.includes(word));
  });
}

export function runDeterministicOperator(input: {
  message: string;
  knowledge: Knowledge[];
  autonomy: 0 | 1 | 2 | 3 | 4;
}): OperatorDecision {
  const relevant = findRelevantKnowledge(input.message, input.knowledge);
  const lower = input.message.toLocaleLowerCase();
  const asksPrice = /preç|custa|quanto|orçamento/.test(lower);
  const asksBooking = /marcar|marcação|amanhã|hoje|hora|disponib/.test(lower);

  let reply: string;
  let confidence = 0.55;

  if (relevant.length) {
    reply = relevant.map(k => `${k.title}: ${k.content}`).join("\n");
    confidence = 0.88;
  } else if (asksPrice) {
    reply = "Ainda não tenho um preço aprovado para lhe indicar. Posso recolher os detalhes necessários e pedir confirmação?";
    confidence = 0.95;
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

  return OperatorDecisionSchema.parse({
    intent: asksPrice ? "price_enquiry" : asksBooking ? "booking_enquiry" : "general_enquiry",
    summary: "Mensagem recebida e analisada com base apenas no conhecimento aprovado.",
    confidence,
    reply,
    proposedActions,
    needsHuman: proposedActions.some(a => evaluateActionPolicy({
      autonomy: input.autonomy, risk: a.risk, hasExternalSideEffect: true
    }).requiresApproval),
    humanReason: proposedActions.length && input.autonomy < 3 ? "A política atual exige aprovação para esta ação." : null
  });
}
