const actions = [
  { goal: "Recuperar orçamento #184", action: "Follow-up enviado", result: "Reparação aceite", value: "€149" },
  { goal: "Converter novo lead", action: "Qualificação concluída", result: "Marcação criada", value: "€89" },
  { goal: "Evitar lead perdido", action: "Pediu aprovação", result: "A aguardar", value: "—" }
];

export default function Home() {
  return (
    <main>
      <header>
        <div className="brand">NOVA IA</div>
        <nav style={{display:"flex",gap:"12px",alignItems:"center"}}>\n          <a href="/login" className="badge">Entrar</a>\n          <div className="badge">Prototype · Operator v0</div>\n        </nav>
      </header>
      <section className="hero">
        <h1>IA que trabalha.<br/>Resultados que se medem.</h1>
        <p>
          Um operador empresarial com autonomia controlada. Recebe objetivos,
          usa conhecimento aprovado, executa ações dentro de limites e liga cada
          decisão a resultados auditáveis.
        </p>
      </section>
      <section className="grid">
        <article className="card"><span>Receita assistida hoje</span><strong>€238</strong><p>Valor demonstrativo atribuído a ações registadas.</p></article>
        <article className="card"><span>Ações concluídas</span><strong>12</strong><p>10 automáticas · 2 com aprovação humana.</p></article>
        <article className="card"><span>Custo IA</span><strong>€0,18</strong><p>Preparado para routing por custo e complexidade.</p></article>
      </section>
      <section className="card ledger">
        <h2>Action Ledger</h2>
        {actions.map((item) => (
          <div className="row" key={item.goal}>
            <div>{item.goal}</div><div>{item.action}</div>
            <div>{item.result}</div><div className="good">{item.value}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
