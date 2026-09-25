import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOrganization } from "./actions";

type OnboardingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .maybeSingle();
  if (membership) redirect("/dashboard");

  const params = await searchParams;
  const message =
    params.error === "name"
      ? "Indica um nome de empresa com pelo menos 2 caracteres."
      : params.error === "create"
        ? "Não foi possível criar a empresa. Tenta novamente."
        : null;

  return <main>
    <header><div className="brand">NOVA IA</div><div className="badge">Onboarding</div></header>
    <section className="hero"><h1>Primeira empresa</h1><p>Cria o tenant isolado onde o operador vai trabalhar.</p></section>
    <form className="card auth-form">
      <label>Nome da empresa<input name="name" required minLength={2} maxLength={120} placeholder="Empresa de teste" /></label>
      {message ? <p role="alert">{message}</p> : null}
      <button formAction={createOrganization}>Criar organização</button>
    </form>
  </main>;
}
