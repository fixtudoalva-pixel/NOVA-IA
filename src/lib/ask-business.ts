export type BusinessSnapshot = {
  conversations: number;
  waitingHuman: number;
  pendingApprovals: number;
  openActions: number;
  assistedRevenueMinor: number;
};

export function answerBusinessQuestion(question: string, data: BusinessSnapshot) {
  const q = question.trim().toLowerCase();
  if (/receita|vendi|vendas|faturei/.test(q)) return "Receita assistida registada: EUR " + (data.assistedRevenueMinor / 100).toFixed(2) + ".";
  if (/aprova|autoriza/.test(q)) return "Aprovações pendentes: " + data.pendingApprovals + ".";
  if (/espera|responder|resposta|cliente/.test(q)) return "Conversas à espera de intervenção humana: " + data.waitingHuman + ".";
  if (/ação|acoes|ações|pendente|fazer hoje|taref/.test(q)) return "Ações ainda não concluídas: " + data.openActions + ". Aprovações pendentes: " + data.pendingApprovals + ".";
  if (/conversa|lead|contact/.test(q)) return "Conversas registadas: " + data.conversations + ".";
  return "Ainda não consigo responder com segurança a essa pergunta usando apenas os dados disponíveis.";
}
