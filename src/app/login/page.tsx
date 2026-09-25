import { login, signup } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; created?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message =
    params.created === "1"
      ? "Conta criada. Se a confirmação por email estiver ativa, confirma o email antes de entrares."
      : params.error === "invalid"
        ? "Não foi possível entrar. Confirma o email e a password."
        : params.error === "signup"
          ? "Não foi possível criar a conta. Confirma os dados ou tenta outro email."
          : null;

  return (
    <main>
      <header><div className="brand">NOVA IA</div><div className="badge">Secure access</div></header>
      <section className="hero"><h1>Entrar</h1><p>Acesso ao operador empresarial e respetivo Action Ledger.</p></section>
      <form className="card auth-form">
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required minLength={8} autoComplete="current-password" /></label>
        {message ? <p role="status">{message}</p> : null}
        <div className="auth-actions">
          <button formAction={login}>Entrar</button>
          <button className="secondary" formAction={signup}>Criar conta</button>
        </div>
      </form>
    </main>
  );
}
