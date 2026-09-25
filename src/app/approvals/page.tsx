import { AppNav } from "@/components/app-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approve, reject } from "./actions";

type ApprovalsPageProps = { searchParams: Promise<{ error?: string; approved?: string; rejected?: string }> };

export default async function ApprovalsPage({ searchParams }: ApprovalsPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
  if (membershipError) throw new Error("Não foi possível carregar a organização.");
  if (!membership) redirect("/onboarding");
  const params = await searchParams;
  const message = params.approved === "1" ? "Ação aprovada. Já pode avançar para execução."
    : params.rejected === "1" ? "Ação rejeitada. Não será executada."
    : params.error === "decision" ? "Não foi possível registar a decisão." : null;
  const { data: approvals } = await supabase.from("approvals")
    .select("id,decision,created_at,actions(id,action_type,risk,rationale,status)")
    .eq("organization_id", membership.organization_id).is("decision", null).order("created_at", { ascending: false });

  return <main>
    <AppNav />
    <header><div className="brand">NOVA IA</div><div className="badge">Human control</div></header>
    <section className="hero"><h1>Aprovações</h1><p>Ações fora da autonomia permitida ficam bloqueadas até decisão humana.</p></section>
    <section className="card ledger">
      <h2>Pendentes</h2>
      {message ? <p role="status">{message}</p> : null}
      {!approvals?.length && <p className="empty-state">Sem aprovações pendentes. O Operator continuará a pedir autorização quando a política exigir.</p>}
      {approvals?.map(a => {
        const action = Array.isArray(a.actions) ? a.actions[0] : a.actions;
        return <div className="row" key={a.id}>
          <div><strong>{action?.action_type}</strong><br/><span>{action?.rationale}</span></div>
          <div>Risco declarado: {action?.risk}</div><div>{action?.status}</div>
          <div className="auth-actions"><form><input type="hidden" name="approval_id" value={a.id}/><input type="hidden" name="action_id" value={action?.id}/><button formAction={approve}>Aprovar</button><button className="secondary" formAction={reject}>Rejeitar</button></form></div>
        </div>;
      })}
    </section>
  </main>;
}
