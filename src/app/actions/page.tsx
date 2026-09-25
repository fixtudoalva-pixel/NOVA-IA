import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { executeApprovedAction, recordSaleOutcome } from "./actions";

export default async function ActionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!membership) redirect("/onboarding");
  const { data: actions } = await supabase.from("actions").select("id,action_type,status,risk,rationale,created_at,outcomes(kind,revenue_minor,attribution)").eq("organization_id", membership.organization_id).order("created_at", { ascending: false });
  return <main>
    <header><div className="brand">NOVA IA</div><div className="badge">Action Ledger</div></header>
    <section className="hero"><h1>Ações e resultados</h1><p>Cada ação mantém estado, evidência e resultado comercial separado da decisão da IA.</p></section>
    <section className="card ledger"><h2>Ledger</h2>
      {!actions?.length && <p>Ainda não existem ações.</p>}
      {actions?.map(a => {
        const revenue=(a.outcomes ?? []).reduce((s,o)=>s+(o.revenue_minor ?? 0),0);
        return <div className="row" key={a.id}>
          <div><strong>{a.action_type}</strong><br/><span>{a.rationale}</span></div>
          <div>{a.status} · {a.risk}</div><div>{revenue ? `€${(revenue/100).toFixed(2)} assistidos` : "Sem receita confirmada"}</div>
          <div>{a.status==="approved" && <form><input type="hidden" name="action_id" value={a.id}/><button formAction={executeApprovedAction}>Executar</button></form>}
          {a.status==="completed" && <form className="inline-form"><input type="hidden" name="action_id" value={a.id}/><input name="euros" type="number" min="0.01" step="0.01" placeholder="€"/><button formAction={recordSaleOutcome}>Registar venda</button></form>}</div>
        </div>;
      })}
    </section>
  </main>;
}