import { AppNav } from "@/components/app-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { answerBusinessQuestion } from "@/lib/ask-business";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AskPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!membership) redirect("/onboarding");
  const orgId = membership.organization_id;
  const params = await searchParams;
  const question = (params.q ?? "").trim().slice(0, 500);

  const [{ count: conversations }, { count: waitingHuman }, { count: approvals }, { count: openActions }, { data: outcomes }, { count: approvedKnowledge }] = await Promise.all([
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "waiting_human"),
    supabase.from("approvals").select("*", { count: "exact", head: true }).eq("organization_id", orgId).is("decision", null),
    supabase.from("actions").select("*", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["proposed","awaiting_approval","approved","executing"]),
    supabase.from("outcomes").select("revenue_minor").eq("organization_id", orgId).eq("kind", "sale"),
    supabase.from("knowledge_items").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("is_approved", true)
  ]);

  const revenue = outcomes?.reduce((sum, x) => sum + (x.revenue_minor ?? 0), 0) ?? 0;
  const dataWarning = [conversations, waitingHuman, approvals, openActions, approvedKnowledge].some(value => value === null) || outcomes === null;
  const answer = question ? answerBusinessQuestion(question, { conversations: conversations ?? 0, waitingHuman: waitingHuman ?? 0, pendingApprovals: approvals ?? 0, openActions: openActions ?? 0, assistedRevenueMinor: revenue, approvedKnowledge: approvedKnowledge ?? 0 }) : null;

  return <main>
    <AppNav />
    <header><div className="brand">NOVA IA</div><div className="badge">Ask Your Business</div></header>
    <section className="hero"><h1>Pergunta à tua empresa</h1><p>Respostas calculadas apenas a partir dos dados da organização autenticada.</p></section>
    <form className="card auth-form" method="get"><label>Pergunta<input name="q" defaultValue={question} maxLength={500} placeholder="O que tenho para fazer hoje?" required /></label><button type="submit">Perguntar</button></form>
    {dataWarning && <p role="alert">Algumas métricas não puderam ser carregadas. A resposta pode estar incompleta.</p>}
    {answer && <section className="card"><span>Resposta</span><strong>{answer.text}</strong>{answer.href && <p><a href={answer.href}>{answer.label} →</a></p>}</section>}
    <section className="card"><h2>Exemplos</h2><div className="auth-actions"><a href="/ask?q=Tenho+clientes+à+espera%3F">Clientes à espera</a><a href="/ask?q=Tenho+aprovações+pendentes%3F">Aprovações</a><a href="/ask?q=Quanto+tenho+de+receita+assistida%3F">Receita</a><a href="/ask?q=O+que+tenho+para+fazer+hoje%3F">Trabalho de hoje</a></div></section>
  </main>;
}
