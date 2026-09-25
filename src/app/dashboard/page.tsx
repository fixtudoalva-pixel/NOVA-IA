import { AppNav } from "@/components/app-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, organizations(id,name,locale,currency)")
    .limit(1);

  const membership = memberships?.[0];
  if (!membership) redirect("/onboarding");

  const org = membership.organizations;
  const orgId = Array.isArray(org) ? org[0]?.id : org?.id;
  const [{ count: actions }, { count: conversations }, { count: approvals }, { data: outcomes }] = await Promise.all([
    supabase.from("actions").select("*", { count: "exact", head: true }).eq("organization_id", orgId!),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("organization_id", orgId!),
    supabase.from("approvals").select("*", { count: "exact", head: true }).eq("organization_id", orgId!).is("decision", null),
    supabase.from("outcomes").select("revenue_minor").eq("organization_id", orgId!)
  ]);
  const assisted = outcomes?.reduce((sum, x) => sum + (x.revenue_minor ?? 0), 0) ?? 0;

  return <main>
    <AppNav />
    <header><div className="brand">NOVA IA</div><div className="badge">{membership.role}</div></header>
    <section className="hero"><h1>{Array.isArray(org) ? org[0]?.name : org?.name}</h1><p>Dados reais da organização autenticada.</p></section>
    <section className="grid">
      <article className="card"><span>Receita assistida</span><strong>€{(assisted/100).toFixed(2)}</strong><p>Somatório dos outcomes registados.</p></article>
      <article className="card"><span>Ações</span><strong>{actions ?? 0}</strong><p>Ações visíveis apenas nesta organização.</p></article>
      <article className="card"><span>Conversas</span><strong>{conversations ?? 0}</strong><p>Inbox persistida e isolada por tenant.</p></article>
      <article className="card"><span>Aprovações pendentes</span><strong>{approvals ?? 0}</strong><p>Decisões que continuam sob controlo humano.</p></article>
    </section>
    <section className="card">
      <h2>Começar a trabalhar</h2>
      <p>Configura conhecimento aprovado, simula uma conversa e acompanha as decisões e resultados do Operator.</p>
      <div className="auth-actions">
        <a href="/knowledge">Knowledge</a>
        <a href="/inbox">Inbox</a>
        <a href="/approvals">Aprovações</a>
        <a href="/actions">Action Ledger</a>
      </div>
    </section>
  </main>;
}
