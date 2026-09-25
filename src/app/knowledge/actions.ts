"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasUnsafeControlChars, isUuid, normalizeSingleLine } from "@/lib/validation";

async function currentOrg() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
  if (error) throw new Error("Não foi possível carregar a organização.");
  if (!data) redirect("/onboarding");
  return { supabase, organizationId: data.organization_id };
}

export async function addKnowledge(formData: FormData) {
  const { supabase, organizationId } = await currentOrg();
  const title = normalizeSingleLine(formData.get("title"), 160);
  const content = String(formData.get("content") ?? "").trim().replace(/\r\n/g, "\n");
  const kind = String(formData.get("kind") ?? "fact").trim().toLowerCase();
  const allowedKinds = new Set(["service", "price", "policy", "fact"]);

  if (title.length < 2 || title.length > 160 || content.length < 2 || content.length > 10000 || hasUnsafeControlChars(title) || hasUnsafeControlChars(content) || !allowedKinds.has(kind)) {
    redirect("/knowledge?error=validation");
  }

  const { error } = await supabase.from("knowledge_items").insert({
    organization_id: organizationId,
    title,
    content,
    kind,
    source: "owner",
    is_approved: false
  });

  if (error) redirect("/knowledge?error=create");
  revalidatePath("/knowledge");
  revalidatePath("/dashboard");
  revalidatePath("/ask");
  redirect("/knowledge?created=1");
}

export async function approveKnowledge(formData: FormData) {
  const { supabase, organizationId } = await currentOrg();
  const id = String(formData.get("id") ?? "").trim();
  if (!isUuid(id)) redirect("/knowledge?error=approval");

  const { data: existing, error: readError } = await supabase.from("knowledge_items").select("id,is_approved").eq("id", id).eq("organization_id", organizationId).maybeSingle();
  if (readError || !existing || existing.is_approved) redirect("/knowledge?error=approval");

  const { error } = await supabase
    .from("knowledge_items")
    .update({ is_approved: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) redirect("/knowledge?error=approval");
  revalidatePath("/knowledge"); revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect("/knowledge?approved=1");
}
