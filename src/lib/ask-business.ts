export type BusinessSnapshot = {
  locale?: string;
  currency?: string;
  conversations: number;
  waitingHuman: number;
  pendingApprovals: number;
  openActions: number;
  assistedRevenueMinor: number;
  weeklyAssistedRevenueMinor?: number;
  approvedKnowledge: number;
};

export type BusinessAnswer = { text: string; href?: string; label?: string };

export function answerBusinessQuestion(question: string, data: BusinessSnapshot): BusinessAnswer {
  const q = question.trim().toLocaleLowerCase("pt-PT");
  if (q.length > 500) return { text: "A pergunta excede o limite de 500 caracteres." };
  if (!q) return { text: "Escreve uma pergunta sobre a operação da empresa." };
  if (q.length < 2) return { text: "Escreve uma pergunta mais completa sobre a operação da empresa." };
  if (/receita|vendi|vendas|faturei|faturação|faturacao/.test(q)) {
    const weekly = /semana|esta semana/.test(q);
    const minor = weekly ? (data.weeklyAssistedRevenueMinor ?? 0) : data.assistedRevenueMinor;
    const amount = new Intl.NumberFormat(data.locale ?? "pt-PT", { style: "currency", currency: data.currency ?? "EUR" }).format(minor / 100);
    return { text: (weekly ? "Receita assistida registada esta semana: " : "Receita assistida registada: ") + amount + ". Este valor é atribuição assistida, não prova causalidade.", href: "/actions", label: "Ver Ledger" };
  }
  if (/conhecimento|knowledge|factos|preços/.test(q)) return { text: "Itens de conhecimento aprovados: " + data.approvedKnowledge + ".", href: "/knowledge", label: "Ver Knowledge" };
  if (/aprova|autoriza/.test(q)) return { text: "Aprovações pendentes: " + data.pendingApprovals + ".", href: "/approvals", label: "Ver aprovações" };
  if (/(cliente|clientes|conversa|conversas).*(espera|responder|resposta)|(espera|responder|resposta).*(cliente|clientes|conversa|conversas)/.test(q)) return { text: "Conversas à espera de intervenção humana: " + data.waitingHuman + ".", href: "/inbox", label: "Abrir Inbox" };
  if (/ação|acoes|ações|fazer hoje|taref|trabalho/.test(q)) return { text: "Ações ainda não concluídas: " + data.openActions + ". Aprovações pendentes: " + data.pendingApprovals + ".", href: data.pendingApprovals ? "/approvals" : "/actions", label: "Ver trabalho" };
  if (/conversa|lead|contact/.test(q)) return { text: "Conversas registadas: " + data.conversations + ".", href: "/inbox", label: "Ver conversas" };
  return { text: "Ainda não consigo responder com segurança a essa pergunta usando apenas os dados disponíveis." };
}
