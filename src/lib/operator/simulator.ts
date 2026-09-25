export function propose(message: string, knowledge: string) {
  const lower = message.toLocaleLowerCase("pt-PT");
  if (/desconto|mais barato|baixar o preço|redução/.test(lower))
    return { intent: "discount", text: "Posso verificar se é possível fazer uma condição especial. Qual é o modelo do equipamento e que serviço precisa?", risk: "high" as const, reason: "Pedido de desconto: qualquer compromisso comercial exige aprovação." };
  if (/marcar|amanhã|horário|disponib/.test(lower))
    return { intent: "booking", text: "Posso ajudar com a marcação. Qual é o equipamento, o problema e o horário que prefere? Confirmo a disponibilidade antes de fechar.", risk: "medium" as const, reason: "Disponibilidade não confirmada; sem promessa de vaga." };
  if (/preço|custa|orçamento|valor/.test(lower))
    return { intent: "pricing", text: knowledge.trim() ? `A informação aprovada que tenho é: ${knowledge.trim()} Para confirmar o orçamento, qual é o modelo exato e o problema?` : "Para lhe dar um orçamento correto, qual é o modelo exato do equipamento e o problema?", risk: "low" as const, reason: knowledge.trim() ? "Resposta baseada no conhecimento aprovado." : "Sem tabela de preços aprovada: pedir os dados necessários." };
  return { intent: "qualification", text: "Obrigado pela mensagem. Pode indicar o modelo do equipamento e descrever o problema para o podermos ajudar?", risk: "low" as const, reason: "Resposta genérica de qualificação." };
}
