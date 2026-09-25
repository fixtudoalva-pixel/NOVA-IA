"use client";

import { useState } from "react";
import { evaluateActionPolicy, type AutonomyLevel } from "@/lib/domain";
import { propose } from "@/lib/operator/simulator";

type Entry = { id: number; kind: "customer" | "recommendation" | "proposal" | "sent" | "rejected"; text: string; reason?: string };

export default function InboxPage() {
  const [message, setMessage] = useState("");
  const [knowledge, setKnowledge] = useState("");
  const [autonomy, setAutonomy] = useState<AutonomyLevel>(1);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [nextId, setNextId] = useState(1);

  function receive() {
    const value = message.trim();
    if (!value) return;
    const draft = propose(value, knowledge);
    const policy = evaluateActionPolicy({ autonomy, risk: draft.risk, hasExternalSideEffect: true });
    setEntries((current) => [...current,
      { id: nextId, kind: "customer", text: value },
      { id: nextId + 1, kind: !policy.allowed ? "recommendation" : policy.requiresApproval ? "proposal" : "sent", text: draft.text, reason: `${draft.reason} ${policy.reason}` }
    ]);
    setNextId(nextId + 2);
    setMessage("");
  }

  function decide(id: number, approved: boolean) {
    setEntries((current) => current.map((entry) => entry.id === id && entry.kind === "proposal" ? { ...entry, kind: approved ? "sent" : "rejected" } : entry));
  }

  const proposed = entries.filter((entry) => entry.kind === "proposal").length;
  const simulated = entries.filter((entry) => entry.kind === "sent").length;

  return (
    <main>
      <header><a className="brand" href="/">NOVA IA</a><span className="badge">Simulador local</span></header>
      <section className="hero"><h1>Inbox</h1><p>Experimente o atendimento com conhecimento aprovado e controlo humano. As mensagens ficam apenas nesta sessão do navegador; não são enviadas a clientes.</p></section>
      <div className="sim-summary"><span>Mensagens recebidas: {entries.filter((entry) => entry.kind === "customer").length}</span><span>A aguardar: {proposed}</span><span>Respostas simuladas: {simulated}</span></div>
      <section className="sim-grid">
        <div className="card sim-form">
          <h2>Configuração</h2>
          <label htmlFor="knowledge">Conhecimento aprovado da empresa</label>
          <textarea id="knowledge" value={knowledge} onChange={(event) => setKnowledge(event.target.value)} placeholder="Ex.: Fazemos diagnóstico de telemóveis. O preço é confirmado após inspeção." rows={5} />
          <label htmlFor="autonomy">Nível de autonomia</label>
          <select id="autonomy" value={autonomy} onChange={(event) => setAutonomy(Number(event.target.value) as AutonomyLevel)}>
            <option value={0}>0 · Observar</option><option value={1}>1 · Propor</option><option value={2}>2 · Aprovação para enviar</option><option value={3}>3 · Enviar dentro dos limites</option><option value={4}>4 · Autonomia ampliada</option>
          </select>
          <label htmlFor="message">Mensagem de um cliente fictício</label>
          <textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Quanto custa trocar o ecrã do meu telemóvel?" rows={3} />
          <button onClick={receive} disabled={!message.trim()}>Receber mensagem</button>
          {entries.length > 0 && <button className="secondary" onClick={() => { setEntries([]); setNextId(1); }}>Limpar simulação</button>}
        </div>
        <div className="card sim-history" aria-live="polite">
          <h2>Conversa e decisões</h2>
          {entries.length === 0 && <p>Introduza uma mensagem para começar a simulação.</p>}
          {entries.map((entry) => <article className="sim-entry" key={entry.id}>
            <span>{entry.kind === "customer" ? "Cliente" : entry.kind === "recommendation" ? "Recomendação interna · não enviada" : entry.kind === "proposal" ? "A aguardar aprovação" : entry.kind === "sent" ? "Resposta simulada" : "Proposta rejeitada"}</span>
            <p>{entry.text}</p>
            {entry.reason && <small>{entry.reason}</small>}
            {entry.kind === "proposal" && <div className="sim-actions"><button onClick={() => decide(entry.id, true)}>Aprovar na simulação</button><button className="secondary" onClick={() => decide(entry.id, false)}>Rejeitar</button></div>}
          </article>)}
        </div>
      </section>
    </main>
  );
}
