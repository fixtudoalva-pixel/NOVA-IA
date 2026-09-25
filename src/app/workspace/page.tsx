"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase/browser";
import { propose } from "@/lib/operator/simulator";
import { OperatorDecisionSchema } from "@/lib/operator/contracts";

type Org = { id: string; name: string };
type Contact = { id: string; display_name: string | null };
type Conversation = { id: string; contact_id: string | null; created_at: string; status: string };
type Message = { id: string; conversation_id: string; actor: string; direction: string; body: string; created_at: string };
type Knowledge = { id: string; title: string; content: string; is_approved: boolean };
type Action = { id: string; conversation_id: string | null; action_type: string; status: string; risk: string; rationale: string | null; created_at: string };
type Approval = { id: string; action_id: string; decision: string | null };
type Run = { source_message_id: string | null };
type Outcome = { id: string; action_id: string | null; kind: string; revenue_minor: number | null };
const client = getBrowserClient();

export default function WorkspacePage() {
  const router = useRouter();
  const [org, setOrg] = useState<Org | null>(null);
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [inbound, setInbound] = useState("");
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeContent, setKnowledgeContent] = useState("");
  const [saleAmount, setSaleAmount] = useState<Record<string, string>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async (orgId: string) => {
    if (!client) return;
    const [conv, people, msgs, facts, acts, approvalsResult, runsResult, results] = await Promise.all([
      client.from("conversations").select("id,contact_id,created_at,status").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(50),
      client.from("contacts").select("id,display_name").eq("organization_id", orgId).limit(50),
      client.from("messages").select("id,conversation_id,actor,direction,body,created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(500),
      client.from("knowledge_items").select("id,title,content,is_approved").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(100),
      client.from("actions").select("id,conversation_id,action_type,status,risk,rationale,created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(100),
      client.from("approvals").select("id,action_id,decision").eq("organization_id", orgId).limit(100),
      client.from("agent_runs").select("source_message_id").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(500),
      client.from("outcomes").select("id,action_id,kind,revenue_minor").eq("organization_id", orgId).limit(100)
    ]);
    const error = [conv, people, msgs, facts, acts, approvalsResult, runsResult, results].find((item) => item.error)?.error;
    if (error) throw error;
    setConversations((conv.data ?? []) as Conversation[]);
    setContacts((people.data ?? []) as Contact[]);
    setMessages(((msgs.data ?? []) as Message[]).reverse());
    setKnowledge((facts.data ?? []) as Knowledge[]);
    setActions((acts.data ?? []) as Action[]);
    setApprovals((approvalsResult.data ?? []) as Approval[]);
    setRuns((runsResult.data ?? []) as Run[]);
    setOutcomes((results.data ?? []) as Outcome[]);
    setSelected((current) => current && conv.data?.some((item) => item.id === current) ? current : conv.data?.[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    let active = true;
    async function start() {
      try {
        const confirmationError = new URLSearchParams(window.location.search).get("error_code") || new URLSearchParams(window.location.hash.slice(1)).get("error_code");
        if (confirmationError === "otp_expired") { router.replace("/login?confirmation=expired"); return; }
        const { data: { user }, error } = await client!.auth.getUser();
        if (error || !user) { router.replace("/login"); return; }
        const memberships = await client!.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1);
        if (memberships.error) throw memberships.error;
        const orgId = memberships.data?.[0]?.organization_id;
        if (orgId) {
          const result = await client!.from("organizations").select("id,name").eq("id", orgId).single();
          if (result.error) throw result.error;
          if (active) { setOrg(result.data); await refresh(orgId); }
        }
      } catch (error) { if (active) setNotice(error instanceof Error ? error.message : "Não foi possível carregar o espaço."); }
      finally { if (active) setLoading(false); }
    }
    void start();
    return () => { active = false; };
  }, [refresh, router]);

  async function task(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setNotice("");
    try { await operation(); if (org) await refresh(org.id); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Ocorreu um erro."); }
    finally { setBusy(false); }
  }

  async function createOrg(event: React.FormEvent) {
    event.preventDefault();
    await task(async () => {
      const { data, error } = await client!.rpc("create_organization", { organization_name: orgName.trim(), organization_locale: "pt-PT", organization_currency: "EUR" });
      if (error) throw error;
      setOrg({ id: data, name: orgName.trim() });
      await refresh(data);
    });
  }

  async function addKnowledge(event: React.FormEvent) {
    event.preventDefault();
    if (!org) return;
    await task(async () => {
      const { error } = await client!.from("knowledge_items").insert({ organization_id: org.id, title: knowledgeTitle.trim(), content: knowledgeContent.trim(), is_approved: false });
      if (error) throw error;
      setKnowledgeTitle(""); setKnowledgeContent("");
    });
  }

  async function receive(event: React.FormEvent) {
    event.preventDefault();
    await task(async () => {
      const { data, error } = await client!.rpc("simulate_inbound", { p_name: contactName.trim(), p_body: inbound.trim() });
      if (error) throw error;
      setSelected(data); setContactName(""); setInbound("");
    });
  }

  async function draft() {
    if (!selected) return;
    const source = [...messages].reverse().find((item) => item.conversation_id === selected && item.actor === "customer");
    if (!source || runs.some((item) => item.source_message_id === source.id)) return;
    const approved = knowledge.filter((item) => item.is_approved).map((item) => item.content).join(" ").slice(0, 1200);
    const proposal = propose(source.body, approved);
    const decision = OperatorDecisionSchema.parse({
      intent: proposal.intent, summary: proposal.reason, confidence: 1, reply: proposal.text, needsHuman: true,
      proposedActions: [{ type: "reply_to_customer", risk: proposal.risk, rationale: proposal.reason, payload: { body: proposal.text, channel: "simulator" } }]
    });
    await task(async () => {
      const { error } = await client!.rpc("commit_operator_decision", {
        p_conversation_id: selected, p_source_message_id: source.id,
        p_decision: decision, p_actions: decision.proposedActions
      });
      if (error) throw error;
    });
  }

  async function approval(action: Action, accept: boolean) {
    const pending = approvals.find((item) => item.action_id === action.id && !item.decision);
    if (!pending) return;
    await task(async () => {
      const { error } = await client!.rpc("decide_approval", { p_approval_id: pending.id, p_action_id: action.id, p_decision: accept ? "approved" : "rejected" });
      if (error) throw error;
    });
  }

  async function execute(action: Action) {
    await task(async () => {
      const { error } = await client!.rpc("execute_approved_action", { p_action_id: action.id });
      if (error) throw error;
    });
  }

  async function recordSale(action: Action) {
    const parsed = Number(saleAmount[action.id]?.replace(",", "."));
    const minor = Math.round(parsed * 100);
    if (!Number.isFinite(parsed) || minor <= 0 || minor > 10000000000) {
      setNotice("Indica um valor de venda válido, superior a zero.");
      return;
    }
    await task(async () => {
      const { error } = await client!.rpc("record_sale_outcome", { p_action_id: action.id, p_revenue_minor: minor });
      if (error) throw error;
      setSaleAmount((current) => ({ ...current, [action.id]: "" }));
    });
  }

  const selectedMessages = messages.filter((item) => item.conversation_id === selected);
  const selectedActions = actions.filter((item) => item.conversation_id === selected);
  const latestInbound = [...selectedMessages].reverse().find((item) => item.actor === "customer");
  const draftExists = !!latestInbound && runs.some((item) => item.source_message_id === latestInbound.id);
  const completed = actions.filter((item) => item.status === "completed").length;
  const revenue = outcomes.filter((item) => item.kind === "sale").reduce((sum, item) => sum + (item.revenue_minor ?? 0), 0);

  if (!client) return <main><header><Link className="brand" href="/">NOVA IA</Link></header><div className="card">Este espaço precisa das variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</div></main>;
  return <main>
    <header><Link className="brand" href="/">NOVA IA</Link><button className="secondary" onClick={async () => { await client.auth.signOut(); router.replace("/login"); }}>Sair</button></header>
    <section className="hero"><h1>{org?.name ?? "Espaço de trabalho"}</h1><p>Laboratório autenticado. Todas as conversas e execuções são simuladas; nenhuma mensagem é entregue a clientes.</p></section>
    {notice && <p role="alert" className="notice">{notice}</p>}
    {loading ? <p>A carregar…</p> : !org ? <form className="card sim-form auth-form" onSubmit={createOrg}><h2>Criar a empresa</h2><label htmlFor="org-name">Nome</label><input id="org-name" required minLength={2} maxLength={120} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="FixTudo" /><button disabled={busy}>Criar espaço</button></form> : <>
      <div className="sim-summary"><span>Conversas: {conversations.length}</span><span>Ações concluídas: {completed}</span><span>Receita confirmada: {(revenue / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</span></div>
      <section className="workspace-grid">
        <div className="card sim-form">
          <h2>Conhecimento da empresa</h2>
          <form onSubmit={addKnowledge}>
            <label htmlFor="fact-title">Título</label><input id="fact-title" required maxLength={120} value={knowledgeTitle} onChange={(e) => setKnowledgeTitle(e.target.value)} />
            <label htmlFor="fact-body">Informação</label><textarea id="fact-body" required rows={3} maxLength={2000} value={knowledgeContent} onChange={(e) => setKnowledgeContent(e.target.value)} />
            <button disabled={busy}>Guardar rascunho</button>
          </form>
          {knowledge.map((item) => <article className="sim-entry" key={item.id}><strong>{item.title}</strong><p>{item.content}</p><small>{item.is_approved ? "Aprovado" : "Por aprovar"}</small>{!item.is_approved && <div><button disabled={busy} onClick={() => void task(async () => { const { error } = await client.from("knowledge_items").update({ is_approved: true }).eq("id", item.id).eq("organization_id", org.id); if (error) throw error; })}>Aprovar informação</button></div>}</article>)}
        </div>
        <div className="card sim-form">
          <h2>Receber pedido fictício</h2>
          <form onSubmit={receive}>
            <label htmlFor="contact-name">Nome do cliente fictício</label><input id="contact-name" maxLength={120} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Cliente teste" />
            <label htmlFor="inbound">Mensagem</label><textarea id="inbound" required minLength={2} maxLength={4000} rows={3} value={inbound} onChange={(e) => setInbound(e.target.value)} placeholder="Quanto custa trocar o ecrã?" />
            <button disabled={busy}>Criar conversa</button>
          </form>
          <h2 className="section-title">Conversas</h2>
          {conversations.map((item) => <button className={selected === item.id ? "conversation active" : "conversation"} key={item.id} onClick={() => setSelected(item.id)}>{contacts.find((person) => person.id === item.contact_id)?.display_name || "Cliente sem nome"} · {new Date(item.created_at).toLocaleDateString("pt-PT")}</button>)}
        </div>
      </section>
      {selected && <section className="card ledger">
        <h2>Conversa e registo de ações</h2>
        {selectedMessages.map((item) => <article className="sim-entry" key={item.id}><span>{item.actor === "customer" ? "Cliente fictício" : "Proposta do operador · não enviada"}</span><p>{item.body}</p></article>)}
        {latestInbound && !draftExists && <button disabled={busy} onClick={() => void draft()}>Gerar proposta e pedir aprovação</button>}
        {selectedActions.map((item) => <article className="sim-entry" key={item.id}><span>Ação: {item.action_type} · {item.status} · risco {item.risk}</span><p>{item.rationale}</p>
          {item.status === "awaiting_approval" && <div className="sim-actions"><button disabled={busy} onClick={() => void approval(item, true)}>Aprovar</button><button className="secondary" disabled={busy} onClick={() => void approval(item, false)}>Rejeitar</button></div>}
          {item.status === "approved" && <button disabled={busy} onClick={() => void execute(item)}>Executar na simulação</button>}
          {item.status === "completed" && <div><small>Ação concluída apenas no simulador. Regista uma venda apenas se foi confirmada por uma pessoa.</small>
            {outcomes.find((outcome) => outcome.action_id === item.id && outcome.kind === "sale") ? <p className="good">Venda confirmada no registo: {((outcomes.find((outcome) => outcome.action_id === item.id && outcome.kind === "sale")?.revenue_minor ?? 0) / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}.</p> :
              <div className="sale-form"><label htmlFor={`sale-${item.id}`}>Venda confirmada (€)</label><input id={`sale-${item.id}`} inputMode="decimal" type="number" step="0.01" min="0.01" value={saleAmount[item.id] ?? ""} onChange={(event) => setSaleAmount((current) => ({ ...current, [item.id]: event.target.value }))} /><button disabled={busy || !saleAmount[item.id]} onClick={() => void recordSale(item)}>Registar venda</button></div>}
          </div>}
        </article>)}
      </section>}
    </>}
  </main>;
}
