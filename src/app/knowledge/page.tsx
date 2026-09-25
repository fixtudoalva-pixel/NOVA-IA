import { AppNav } from "@/components/app-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addKnowledge, approveKnowledge } from "./actions";

type KnowledgePageProps = { searchParams: Promise<{ error?: string; created?: string; approved?: string }> };

export default async function KnowledgePage({ searchParams }: KnowledgePageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
  if (membershipError) throw new Error("Não foi possível carregar a organização.");
  if (!membership) redirect("/onboarding");
  const { data: items, error: itemsError } = await supabase.from("knowledge_items").select("*").eq("organization_id", membership.organization_id).order("created_at", { ascending: false }).limit(100);
  if (itemsError) throw new Error("Não foi possível carregar o Knowledge.");
  const params = await searchParams;
  const message = params.created === "1"
    ? "Rascunho guardado. Revê-o antes de aprovar."
    : params.approved === "1"
      ? "Conhecimento aprovado e disponível para o Operator."
      : params.error === "validation"
        ? "Preenche um título e conteúdo válidos."
        : params.error === "create"
          ? "Não foi possível guardar o conhecimento."
          : params.error === "approval"
            ? "Não foi possível aprovar este conhecimento."
            : null;

  return <main>
    <AppNav />
    <header><div className="brand">NOVA IA</div><div className="badge">Knowledge</div></header>
    <section className="hero"><h1>Conhecimento aprovado</h1><p>O operador só deve tratar factos específicos da empresa como verdade depois de aprovação humana.</p></section>
    <form className="card auth-form" aria-labelledby="knowledge-form-heading"><h2 id="knowledge-form-heading">Novo conhecimento</h2>
      <label>Tipo<select name="kind" required><option value="service">Serviço</option><option value="price">Preço</option><option value="policy">Política</option><option value="fact">Facto</option></select></label>
      <label>Título<input name="title" required minLength={2} maxLength={160} /></label>
      <label>Conteúdo<textarea name="content" required rows={4} minLength={2} maxLength={10000} /></label>
      {message ? <p role="status">{message}</p> : null}
      <button formAction={addKnowledge} type="submit">Adicionar rascunho</button>
    </form>
    <section className="card ledger" aria-labelledby="knowledge-list-heading">
      <h2 id="knowledge-list-heading">Base de conhecimento</h2>
      {!items?.length && <p className="empty-state">Ainda não existe conhecimento. Adiciona um rascunho e aprova-o antes de o Operator o usar.</p>}
      {items?.map(item => <div className="row" key={item.id}>
        <div><strong>{item.title}</strong><br/><span>{item.kind}</span></div>
        <div>{item.content.length > 500 ? item.content.slice(0, 500) + "…" : item.content}</div>
        <div>{item.is_approved ? "Aprovado · utilizável pelo Operator" : "Rascunho · ainda não utilizável"}</div>
        <div>{!item.is_approved && <form><input type="hidden" name="id" value={item.id}/><button formAction={approveKnowledge} type="submit" aria-label={`Aprovar conhecimento: ${item.title}`}>Aprovar</button></form>}</div>
      </div>)}
    </section>
  </main>;
}
