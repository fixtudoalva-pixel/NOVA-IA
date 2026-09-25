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
        : params.error === "rate_limit"
          ? "O serviço de email atingiu temporariamente o limite de envios. Não repitas o pedido agora; tenta novamente mais tarde."
          : params.error === "signup"
          ? "Não foi possível criar a conta. Confirma os dados ou tenta outro email."
          : params.error === "confirmation"
            ? "O link de confirmação é inválido, expirou ou já foi utilizado. Tenta novamente mais tarde ou usa o email de confirmação mais recente."
            : null;

  return (
    <main>
      <header><div className="brand">NOVA IA</div><div className="badge">Secure access</div></header>
      <section className="hero"><h1>Entrar</h1><p>Acesso ao operador empresarial e respetivo Action Ledger.</p></section>
      <form className="card auth-form" aria-labelledby="login-form-heading"><h2 id="login-form-heading">Credenciais</h2>
        <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label>Password<input name="password" type="password" required minLength={8} maxLength={128} autoComplete="current-password" aria-describedby="password-help" /></label>
        <p id="password-help">Mínimo de 8 caracteres. Para produção, evita passwords reutilizadas noutros serviços.</p>
        {message ? <p role="status">{message}</p> : null}
        <div className="auth-actions">
          <button formAction={login}>Entrar</button>
          <button className="secondary" formAction={signup}>Criar conta</button>
        </div>
      </form>
    </main>
  );
}
