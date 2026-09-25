export type BusinessSnapshot = {
  conversations: number;
  waitingHuman: number;
  pendingApprovals: number;
  openActions: number;
  assistedRevenueMinor: number;
  approvedKnowledge: number;
};

export type BusinessAnswer = { text: string; href?: string; label?: string };

export function answerBusinessQuestion(question: string, data: BusinessSnapshot): BusinessAnswer {
  const q = question.trim().toLowerCase();
  if (!q) return { text: "Escreve uma pergunta sobre a operação da empresa." };
  if (/receita|vendi|vendas|faturei/.test(q)) return { text: "Receita assistida registada: EUR " + (data.assistedRevenueMinor / 100).toFixed(2) + ". Este valor é atribuição assistida, não prova causalidade.", href: "/actions", label: "Ver Ledger" };
  if (/conhecimento|knowledge|factos|preços/.test(q)) return { text: "Itens de conhecimento aprovados: " + data.approvedKnowledge + ".", href: "/knowledge", label: "Ver Knowledge" };
  if (/aprova|autoriza/.test(q)) return { text: "Aprovações pendentes: " + data.pendingApprovals + ".", href: "/approvals", label: "Ver aprovações" };
  if (/espera|responder|resposta|cliente/.test(q)) return { text: "Conversas à espera de intervenção humana: " + data.waitingHuman + ".", href: "/inbox", label: "Abrir Inbox" };
  if (/ação|acoes|ações|pendente|fazer hoje|taref/.test(q)) return { text: "Ações ainda não concluídas: " + data.openActions + ". Aprovações pendentes: " + data.pendingApprovals + ".", href: data.pendingApprovals ? "/approvals" : "/actions", label: "Ver trabalho" };
  if (/conversa|lead|contact/.test(q)) return { text: "Conversas registadas: " + data.conversations + ".", href: "/inbox", label: "Ver conversas" };
  return { text: "Ainda não consigo responder com segurança a essa pergunta usando apenas os dados disponíveis." };
}
