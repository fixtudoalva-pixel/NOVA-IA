import { AppNav } from "@/components/app-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { executeApprovedAction, recordSaleOutcome } from "./actions";

type ActionsPageProps = { searchParams: Promise<{ error?: string; executed?: string; sale?: string }> };

export default async function ActionsPage({ searchParams }: ActionsPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members").select("organization_id, organizations(locale,currency)").limit(1).maybeSingle();
  if (membershipError) throw new Error("Não foi possível carregar a organização.");
  if (!membership) redirect("/onboarding");
  const org = membership.organizations;
  const orgSettings = Array.isArray(org) ? org[0] : org;
  const formatMoney = (minor: number) => new Intl.NumberFormat(orgSettings?.locale ?? "pt-PT", { style: "currency", currency: orgSettings?.currency ?? "EUR" }).format(minor / 100);
  const params = await searchParams;
  const message = params.executed === "1" ? "Ação executada e registada no ledger."
    : params.sale === "1" ? "Venda registada como receita assistida."
    : params.error === "execute" ? "Não foi possível executar esta ação."
    : params.error === "sale" ? "Não foi possível registar esta venda." : null;
  const { data: actions, error: actionsError } = await supabase.from("actions").select("id,action_type,status,risk,rationale,created_at,outcomes(kind,revenue_minor,attribution)").eq("organization_id", membership.organization_id).order("created_at", { ascending: false }).limit(100);
  if (actionsError) throw new Error("Não foi possível carregar o Action Ledger.");
  return <main>
    <AppNav />
    <header><div className="brand">NOVA IA</div><div className="badge">Action Ledger</div></header>
    <section className="hero"><h1>Ações e resultados</h1><p>Cada ação mantém estado, evidência e resultado comercial separado da decisão da IA.</p></section>
    <section className="card ledger"><h2>Ledger</h2>
      {message ? <p role="status">{message}</p> : null}
      {!actions?.length && <p className="empty-state">Ainda não existem ações. As decisões do Operator aparecerão aqui quando propuser trabalho executável.</p>}
      {actions?.map(a => {
        const saleOutcome=(a.outcomes ?? []).find(o=>o.kind==="sale");
        const revenue=saleOutcome?.revenue_minor ?? 0;
        return <div className="row" key={a.id}>
          <div><strong>{a.action_type}</strong><br/><span>{a.rationale ? (a.rationale.length > 300 ? a.rationale.slice(0, 300) + "…" : a.rationale) : "Sem justificação"}</span></div>
          <div>{a.status} · {a.risk}</div><div>{revenue ? `${formatMoney(revenue)} assistidos · confirmação humana` : "Sem receita confirmada"}</div>
          <div>{a.status==="approved" && <form><input type="hidden" name="action_id" value={a.id}/><button formAction={executeApprovedAction} aria-label={`Executar ${a.action_type}`}>Executar</button></form>}
          {a.status==="completed" && <form className="inline-form"><input type="hidden" name="action_id" value={a.id}/><input name="amount" aria-label="Valor da venda" type="number" min="0.01" max="100000000" step="0.01" inputMode="decimal" placeholder={orgSettings?.currency ?? "EUR"} defaultValue={revenue ? (revenue/100).toFixed(2) : undefined}/><button formAction={recordSaleOutcome} aria-label={`${revenue ? "Atualizar" : "Registar"} venda para ${a.action_type}`}>{revenue ? "Atualizar venda" : "Registar venda"}</button></form>}</div>
        </div>;
      })}
    </section>
  </main>;
}