"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function currentOrg() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!data) redirect("/onboarding");
  return { supabase, organizationId: data.organization_id };
}

export async function addKnowledge(formData: FormData) {
  const { supabase, organizationId } = await currentOrg();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const kind = String(formData.get("kind") ?? "fact");
  const allowedKinds = new Set(["service", "price", "policy", "fact"]);

  if (title.length < 2 || content.length < 2 || !allowedKinds.has(kind)) {
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
  redirect("/knowledge?created=1");
}

export async function approveKnowledge(formData: FormData) {
  const { supabase, organizationId } = await currentOrg();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/knowledge?error=approval");

  const { error } = await supabase
    .from("knowledge_items")
    .update({ is_approved: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) redirect("/knowledge?error=approval");
  revalidatePath("/knowledge"); revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect("/knowledge?approved=1");
}
