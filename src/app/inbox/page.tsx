import { AppNav } from "@/components/app-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { simulateInbound } from "./actions";
import { runOperator } from "./operator-actions";

type InboxPageProps = { searchParams: Promise<{ error?: string; created?: string; operator?: string }> };

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!membership) redirect("/onboarding");
  const params = await searchParams;
  const message = params.created === "1"
    ? "Mensagem simulada guardada."
    : params.operator === "1"
      ? "Operator executado. A resposta e eventuais ações foram registadas."
      : params.error === "message"
        ? "Escreve uma mensagem válida."
        : params.error === "simulate"
          ? "Não foi possível criar a conversa simulada."
          : params.error === "no_customer_message"
            ? "Esta conversa não tem uma mensagem de cliente para processar."
            : params.error === "operator"
              ? "Não foi possível executar o Operator."
              : null;

  const { data: conversations } = await supabase.from("conversations")
    .select("id,status,channel,created_at,contacts(display_name),messages(body,actor,created_at)")
    .eq("organization_id", membership.organization_id).order("updated_at", { ascending: false });

  return <main>
    <AppNav />
    <header><div className="brand">NOVA IA</div><div className="badge">Live simulator</div></header>
    <section className="hero"><h1>Inbox</h1><p>Cria leads fictícios, mas guarda conversas reais no tenant. Nenhum canal pago é necessário.</p></section>
    <form className="card auth-form">
      <label>Cliente<input name="name" placeholder="Cliente teste" /></label>
      <label>Mensagem<textarea name="body" required rows={3} placeholder="Quanto custa o serviço?" /></label>
      {message ? <p role="status">{message}</p> : null}
      <button formAction={simulateInbound}>Simular mensagem recebida</button>
    </form>
    <section className="card ledger">
      <h2>Conversas persistidas</h2>
      {!conversations?.length && <p className="empty-state">Ainda não existem conversas. Usa o simulador acima para criar a primeira.</p>}
      {conversations?.map(c => {
        const msgs = [...(c.messages ?? [])].sort((a,b)=>a.created_at.localeCompare(b.created_at));
        const last = msgs.at(-1);
        const contact = Array.isArray(c.contacts) ? c.contacts[0] : c.contacts;
        return <div className="row" key={c.id}>
          <div><strong>{contact?.display_name ?? "Sem nome"}</strong><br/><span>{c.channel}</span></div><div><span>{last?.actor ?? "—"}</span><br/>{last?.body ?? "—"}</div><div>{c.status}</div><div><form><input type="hidden" name="conversation_id" value={c.id}/><button formAction={runOperator}>Executar Operator</button></form></div>
        </div>;
      })}
    </section>
  </main>;
}
