import { OperatorDecisionSchema, type OperatorDecision } from "./contracts";
import { evaluateActionPolicy } from "../domain";

type Knowledge = { kind: string; title: string; content: string };

function findRelevantKnowledge(message: string, knowledge: Knowledge[]) {
  const stopWords = new Set(["para","com","uma","uns","das","dos","que","qual","quero","preciso","tenho","tem","têm","quanto","custa","preço","preco","orçamento","orcamento","aprovado","aprovada"]);
  const words = new Set(message.toLocaleLowerCase("pt-PT").split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 2 && !stopWords.has(w)));
  if (!words.size) return [];
  return knowledge.filter(k => {
    const haystack = `${k.title} ${k.content} ${k.kind}`.toLocaleLowerCase("pt-PT");
    return [...words].some(word => {
      const tokens = haystack.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
      return tokens.includes(word);
    });
  });
}

export function runDeterministicOperator(input: {
  message: string;
  knowledge: Knowledge[];
  autonomy: 0 | 1 | 2 | 3 | 4;
}): OperatorDecision {
  const message = input.message.trim().replace(/\s+/g, " ").slice(0, 4000);
  if (!message) return OperatorDecisionSchema.parse({ intent: "general_enquiry", summary: "Mensagem vazia; nenhuma ação foi proposta.", confidence: 1, reply: "Preciso de uma mensagem com conteúdo para poder ajudar.", proposedActions: [], needsHuman: false, humanReason: null });
  const safeKnowledge = input.knowledge.slice(0, 200).map(k => ({ ...k, title: k.title.trim().slice(0, 160), content: k.content.trim().slice(0, 10000), kind: k.kind.trim().toLowerCase().slice(0, 40) })).filter(k => k.title.length >= 2 && k.content.length >= 2 && ["service","price","policy","fact"].includes(k.kind));
  const relevant = findRelevantKnowledge(message, safeKnowledge);
  const priceKnowledge = relevant.filter(k => k.kind === "price");
  const bookingKnowledge = relevant.filter(k => k.kind === "policy" || k.kind === "service");
  const lower = message.toLocaleLowerCase("pt-PT");
  const hasControlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message);
  if (hasControlChars) return OperatorDecisionSchema.parse({ intent: "general_enquiry", summary: "Mensagem rejeitada por conter caracteres de controlo.", confidence: 1, reply: "Não consegui processar esta mensagem com segurança.", proposedActions: [], needsHuman: false, humanReason: null });
  const asksPrice = /preç|custa|quanto\s+(?:custa|fica|é)|orçamento|orcamento/.test(lower);
  const asksBooking = /marcar|marcação|agendar|agendamento|disponib|vaga|horário|horario/.test(lower) || /(?:amanhã|hoje).*(?:marcar|agendar|hora)|(?:marcar|agendar).*(?:amanhã|hoje)/.test(lower);

  let reply: string;
  let confidence = 0.55;

  if (asksPrice && priceKnowledge.length) {
    reply = priceKnowledge.slice(0, 5).map(k => `${k.title}: ${k.content}`).join("\n").slice(0, 8000);
    confidence = 0.9;
  } else if (asksBooking && bookingKnowledge.length) {
    reply = bookingKnowledge.slice(0, 3).map(k => `${k.title}: ${k.content}`).join("\n").slice(0, 6000) + "\nPosso preparar um pedido de marcação, mas a disponibilidade concreta continua por confirmar.";
    confidence = 0.88;
  } else if (relevant.length && !asksPrice && !asksBooking) {
    reply = relevant.slice(0, 5).map(k => `${k.title}: ${k.content}`).join("\n").slice(0, 8000);
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
