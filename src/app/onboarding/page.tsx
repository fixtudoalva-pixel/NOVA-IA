import { createOrganization } from "./actions";

export default function OnboardingPage() {
  return <main>
    <header><div className="brand">NOVA IA</div><div className="badge">Onboarding</div></header>
    <section className="hero"><h1>Primeira empresa</h1><p>Cria o tenant isolado onde o operador vai trabalhar.</p></section>
    <form className="card auth-form">
      <label>Nome da empresa<input name="name" required minLength={2} placeholder="Empresa de teste" /></label>
      <button formAction={createOrganization}>Criar organização</button>
    </form>
  </main>;
}
