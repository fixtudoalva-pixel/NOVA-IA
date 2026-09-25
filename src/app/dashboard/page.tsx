import { AppNav } from "@/components/app-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("role, organizations(id,name,locale,currency)")
    .limit(1);

  if (membershipError) throw new Error("Não foi possível carregar a organização.");
  const membership = memberships?.[0];
  if (!membership) redirect("/onboarding");

  const org = membership.organizations;
  const orgId = Array.isArray(org) ? org[0]?.id : org?.id;
  if (!orgId) redirect("/onboarding");
  // MVP reporting weeks use UTC Monday boundaries; tenant time zones are not modeled yet.
  const weekStart = new Date();
  const day = weekStart.getUTCDay();
  weekStart.setUTCDate(weekStart.getUTCDate() - ((day + 6) % 7));
  weekStart.setUTCHours(0, 0, 0, 0);
  const [{ count: actions, error: actionsError }, { count: conversations, error: conversationsError }, { count: approvals, error: approvalsError }, { data: outcomes, error: outcomesError }, { data: weeklyOutcomes, error: weeklyOutcomesError }, { count: knowledge, error: knowledgeError }] = await Promise.all([
    supabase.from("actions").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("approvals").select("*", { count: "exact", head: true }).eq("organization_id", orgId).is("decision", null),
    supabase.from("outcomes").select("revenue_minor").eq("organization_id", orgId).eq("kind", "sale").eq("attribution", "assisted"),
    supabase.from("outcomes").select("revenue_minor").eq("organization_id", orgId).eq("kind", "sale").eq("attribution", "assisted").gte("created_at", weekStart.toISOString()),
    supabase.from("knowledge_items").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("is_approved", true)
  ]);
  const assisted = outcomes?.reduce((sum, x) => sum + (x.revenue_minor ?? 0), 0) ?? 0;
  const weeklyAssisted = weeklyOutcomes?.reduce((sum, x) => sum + (x.revenue_minor ?? 0), 0) ?? 0;
  const orgSettings = Array.isArray(org) ? org[0] : org;
  const assistedFormatted = new Intl.NumberFormat(orgSettings?.locale ?? "pt-PT", { style: "currency", currency: orgSettings?.currency ?? "EUR" }).format(assisted / 100);
  const weeklyAssistedFormatted = new Intl.NumberFormat(orgSettings?.locale ?? "pt-PT", { style: "currency", currency: orgSettings?.currency ?? "EUR" }).format(weeklyAssisted / 100);
  const hasMetricReadFailure = Boolean(actionsError || conversationsError || approvalsError || outcomesError || weeklyOutcomesError || knowledgeError);
  const nextStep = hasMetricReadFailure
    ? null
    : (approvals ?? 0) > 0
    ? { href: "/approvals", label: "Rever aprovações pendentes" }
    : (knowledge ?? 0) === 0
      ? { href: "/knowledge", label: "Adicionar conhecimento aprovado" }
      : (conversations ?? 0) === 0
        ? { href: "/inbox", label: "Criar a primeira conversa" }
        : { href: "/inbox", label: "Continuar no Inbox" };

  return <main>
    <AppNav />
    <header><div className="brand">NOVA IA</div><div className="badge">{membership.role}</div></header>
    <section className="hero"><h1>{Array.isArray(org) ? org[0]?.name : org?.name}</h1><p>Dados reais da organização autenticada.</p></section>
    {hasMetricReadFailure && <p role="alert">Algumas métricas não puderam ser carregadas. Atualiza a página antes de tomar decisões com estes números.</p>}
    <section className="grid" aria-label="Métricas da organização">
      <article className="card"><span>Receita assistida</span><strong>{hasMetricReadFailure ? "—" : assistedFormatted}</strong><p>Somatório apenas de vendas registadas como receita assistida.</p></article>
      <article className="card"><span>Receita esta semana</span><strong>{hasMetricReadFailure ? "—" : weeklyAssistedFormatted}</strong><p>Vendas assistidas registadas desde segunda-feira.</p></article>
      <article className="card"><span>Ações</span><strong>{hasMetricReadFailure ? "—" : actions ?? 0}</strong><p>Ações visíveis apenas nesta organização.</p></article>
      <article className="card"><span>Conversas</span><strong>{hasMetricReadFailure ? "—" : conversations ?? 0}</strong><p>Inbox persistida e isolada por tenant.</p></article>
      <article className="card"><span>Aprovações pendentes</span><strong>{hasMetricReadFailure ? "—" : approvals ?? 0}</strong><p>Decisões que continuam sob controlo humano.</p></article>
      <article className="card"><span>Knowledge aprovado</span><strong>{hasMetricReadFailure ? "—" : knowledge ?? 0}</strong><p>Factos empresariais disponíveis para respostas do Operator.</p></article>
    </section>
    <section className="card" aria-labelledby="next-step-heading">
      <h2 id="next-step-heading">Começar a trabalhar</h2>
      <p>Configura conhecimento aprovado, simula uma conversa e acompanha as decisões e resultados do Operator.</p>
      {nextStep ? <p><a href={nextStep.href}>{nextStep.label} →</a></p> : <p>O próximo passo fica suspenso até as métricas carregarem corretamente.</p>}
      <div className="auth-actions">
        <a href="/ask">Pergunta à empresa</a>
        <a href="/knowledge">Knowledge</a>
        <a href="/inbox">Inbox</a>
        <a href="/approvals">Aprovações</a>
        <a href="/actions">Action Ledger</a>
      </div>
    </section>
  </main>;
}
