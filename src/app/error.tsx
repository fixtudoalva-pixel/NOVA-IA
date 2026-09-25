"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main>
      <section className="card">
        <h1>Algo correu mal</h1>
        <p>Não foi possível concluir este pedido. Os dados não devem ser repetidos às cegas.</p><p>Se estavas a executar uma ação, confirma o Action Ledger antes de tentar novamente.</p>
        <div className="auth-actions"><button onClick={() => reset()}>Tentar novamente</button><a href="/dashboard">Voltar ao Dashboard</a></div>
      </section>
    </main>
  );
}
