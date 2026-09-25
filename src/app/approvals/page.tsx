import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approve, reject } from "./actions";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!membership) redirect("/onboarding");
  const { data: approvals } = await supabase.from("approvals")
    .select("id,decision,created_at,actions(id,action_type,risk,rationale,status)")
    .eq("organization_id", membership.organization_id).is("decision", null).order("created_at", { ascending: false });

  return <main>
    <header><div className="brand">NOVA IA</div><div className="badge">Human control</div></header>
    <section className="hero"><h1>Aprovações</h1><p>Ações fora da autonomia permitida ficam bloqueadas até decisão humana.</p></section>
    <section className="card ledger">
      <h2>Pendentes</h2>
      {!approvals?.length && <p>Sem aprovações pendentes.</p>}
      {approvals?.map(a => {
        const action = Array.isArray(a.actions) ? a.actions[0] : a.actions;
        return <div className="row" key={a.id}>
          <div><strong>{action?.action_type}</strong><br/><span>{action?.rationale}</span></div>
          <div>Risco: {action?.risk}</div><div>{action?.status}</div>
          <div className="auth-actions"><form><input type="hidden" name="approval_id" value={a.id}/><input type="hidden" name="action_id" value={action?.id}/><button formAction={approve}>Aprovar</button><button className="secondary" formAction={reject}>Rejeitar</button></form></div>
        </div>;
      })}
    </section>
  </main>;
}
