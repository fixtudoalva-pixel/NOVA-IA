export default function Home() {
  return (
    <main>
      <header><div className="brand">NOVA IA</div><div className="badge">Protótipo · Operator v0</div></header>
      <section className="hero">
        <h1>IA que trabalha.<br/>Decisões que se explicam.</h1>
        <p>Experimente como um operador pode analisar pedidos de clientes, usar informação aprovada e pedir autorização antes de agir.</p>
        <a className="primary-link" href="/inbox">Abrir simulador de inbox →</a>
        <a className="workspace-link" href="/workspace">Entrar no espaço de trabalho →</a>
      </section>
      <section className="grid">
        <article className="card"><span>1 · Conhecimento</span><strong>Informação aprovada</strong><p>Introduza os factos que podem fundamentar uma resposta. Sem preços inventados.</p></article>
        <article className="card"><span>2 · Decisão</span><strong>Autonomia controlada</strong><p>Escolha entre observar, recomendar, pedir aprovação e executar na simulação.</p></article>
        <article className="card"><span>3 · Rastreio</span><strong>Histórico visível</strong><p>Consulte a mensagem, a proposta, a justificação e a decisão humana.</p></article>
      </section>
      <section className="card ledger">
        <h2>Estado deste protótipo</h2>
        <p>O simulador funciona no navegador e não contacta clientes. Autenticação, persistência, modelos de IA e integrações externas ainda não estão ligados.</p>
      </section>
    </main>
  );
}
