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
  const { data: membership, error: membershipError } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
  if (membershipError) throw new Error("Não foi possível carregar a organização.");
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

  const { data: conversations, error: conversationsError } = await supabase.from("conversations")
    .select("id,status,channel,created_at,updated_at,contacts(display_name),messages(body,actor,created_at)")
    .eq("organization_id", membership.organization_id).order("updated_at", { ascending: false }).limit(100);
  if (conversationsError) throw new Error("Não foi possível carregar o Inbox.");

  return <main>
    <AppNav />
    <header><div className="brand">NOVA IA</div><div className="badge">Live simulator</div></header>
    <section className="hero"><h1>Inbox</h1><p>Cria leads fictícios, mas guarda conversas reais no tenant. Nenhum canal pago é necessário.</p></section>
    <form className="card auth-form" aria-labelledby="simulate-heading">
      <h2 id="simulate-heading">Simular lead</h2><label>Cliente<input name="name" placeholder="Cliente teste" maxLength={120} autoComplete="name" /></label>
      <label>Mensagem<textarea aria-describedby="message-help" name="body" required rows={3} minLength={2} maxLength={4000} placeholder="Quanto custa o serviço?" /></label><p id="message-help">Entre 2 e 4000 caracteres. Este simulador não envia nada para canais externos.</p>
      {message ? <p role="status">{message}</p> : null}
      <button formAction={simulateInbound} type="submit">Simular mensagem recebida</button>
    </form>
    <section className="card ledger" aria-labelledby="conversations-heading">
      <h2 id="conversations-heading">Conversas persistidas</h2>
      {!conversations?.length && <p className="empty-state">Ainda não existem conversas. Usa o simulador acima para criar a primeira.</p>}
      {conversations?.map(c => {
        const msgs = [...(c.messages ?? [])].sort((a,b)=>a.created_at.localeCompare(b.created_at)).slice(-100);
        const last = msgs.at(-1);
        const contact = Array.isArray(c.contacts) ? c.contacts[0] : c.contacts;
        return <div className="row" key={c.id}>
          <div><strong>{contact?.display_name ?? "Sem nome"}</strong><br/><span>{c.channel}</span></div><div><span>{last?.actor ?? "—"}</span><br/>{last?.body ? (last.body.length > 240 ? last.body.slice(0, 240) + "…" : last.body) : "—"}</div><div><span>Estado</span><br/>{c.status}</div><div><form><input type="hidden" name="conversation_id" value={c.id}/><button formAction={runOperator} type="submit" aria-label={`Executar Operator para ${contact?.display_name ?? "conversa"}`}>Executar Operator</button></form></div>
        </div>;
      })}
    </section>
  </main>;
}
