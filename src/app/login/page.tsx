"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const supabase = getBrowserClient();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/workspace" } });
      if (result.error) throw result.error;
      if (result.data.session) router.replace("/workspace");
      else setNotice("Confirma o endereço no email e volta a iniciar sessão.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível concluir o acesso.");
    } finally { setBusy(false); }
  }

  async function resendConfirmation() {
    if (!supabase || busy) return;
    if (!email.trim()) { setNotice("Indica primeiro o teu email para reenviar a confirmação."); return; }
    setBusy(true);
    setNotice("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + "/workspace" }
      });
      if (error) throw error;
      setNotice("Se o endereço tiver uma confirmação pendente, vais receber um novo email. Verifica também o spam.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível reenviar a confirmação.");
    } finally { setBusy(false); }
  }

  return <main>
    <header><a className="brand" href="/">NOVA IA</a><span className="badge">Acesso à empresa</span></header>
    <section className="hero"><h1>{mode === "login" ? "Entrar" : "Criar conta"}</h1><p>O espaço de trabalho utiliza autenticação e proteção de dados por empresa.</p></section>
    {!supabase ? <div className="card">Falta configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no alojamento.</div> :
      <form className="card sim-form auth-form" onSubmit={submit}>
        <label htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Palavra-passe</label><input id="password" type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy}>{busy ? "Aguarda…" : mode === "login" ? "Entrar" : "Criar conta"}</button>
        <button className="secondary" type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setNotice(""); }}>{mode === "login" ? "Criar uma conta" : "Já tenho conta"}</button>
        {mode === "login" && <button className="secondary" type="button" disabled={busy} onClick={() => void resendConfirmation()}>Reenviar email de confirmação</button>}
        {notice && <p role="status">{notice}</p>}
      </form>}
  </main>;
}
