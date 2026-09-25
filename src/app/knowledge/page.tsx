import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addKnowledge, approveKnowledge } from "./actions";

export default async function KnowledgePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!membership) redirect("/onboarding");
  const { data: items } = await supabase.from("knowledge_items").select("*").eq("organization_id", membership.organization_id).order("created_at", { ascending: false });

  return <main>
    <header><div className="brand">NOVA IA</div><div className="badge">Knowledge</div></header>
    <section className="hero"><h1>Conhecimento aprovado</h1><p>O operador só deve tratar factos específicos da empresa como verdade depois de aprovação humana.</p></section>
    <form className="card auth-form">
      <label>Tipo<select name="kind"><option value="service">Serviço</option><option value="price">Preço</option><option value="policy">Política</option><option value="fact">Facto</option></select></label>
      <label>Título<input name="title" required /></label>
      <label>Conteúdo<textarea name="content" required rows={4} /></label>
      <button formAction={addKnowledge}>Adicionar rascunho</button>
    </form>
    <section className="card ledger">
      <h2>Base de conhecimento</h2>
      {items?.map(item => <div className="row" key={item.id}>
        <div><strong>{item.title}</strong><br/><span>{item.kind}</span></div>
        <div>{item.content}</div>
        <div>{item.is_approved ? "Aprovado" : "Rascunho"}</div>
        <div>{!item.is_approved && <form><input type="hidden" name="id" value={item.id}/><button formAction={approveKnowledge}>Aprovar</button></form>}</div>
      </div>)}
    </section>
  </main>;
}
