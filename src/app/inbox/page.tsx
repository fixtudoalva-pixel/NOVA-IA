const threads = [
  { name: "Cliente teste", message: "Quanto custa trocar o ecrã do meu telemóvel?", status: "Novo" },
  { name: "Lead #002", message: "Conseguem ver isto amanhã?", status: "Aguardar IA" },
  { name: "Lead #003", message: "Obrigado, fica combinado.", status: "Concluído" }
];

export default function InboxPage() {
  return (
    <main>
      <header><div className="brand">NOVA IA</div><div className="badge">Inbox Simulator</div></header>
      <section className="hero">
        <h1>Inbox</h1>
        <p>Laboratório sem custos para testar atendimento, decisões, aprovações e resultados antes de ligar canais externos.</p>
      </section>
      <section className="card">
        {threads.map((thread) => (
          <div className="row" key={thread.name}>
            <strong>{thread.name}</strong>
            <div>{thread.message}</div>
            <div>{thread.status}</div>
            <div>simulator</div>
          </div>
        ))}
      </section>
    </main>
  );
}
