import { login, signup } from "./actions";

export default function LoginPage() {
  return (
    <main>
      <header><div className="brand">NOVA IA</div><div className="badge">Secure access</div></header>
      <section className="hero"><h1>Entrar</h1><p>Acesso ao operador empresarial e respetivo Action Ledger.</p></section>
      <form className="card auth-form">
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required minLength={8} autoComplete="current-password" /></label>
        <div className="auth-actions">
          <button formAction={login}>Entrar</button>
          <button className="secondary" formAction={signup}>Criar conta</button>
        </div>
      </form>
    </main>
  );
}
