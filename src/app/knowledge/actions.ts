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
  if (title.length < 2 || content.length < 2) return;
  await supabase.from("knowledge_items").insert({ organization_id: organizationId, title, content, kind, source: "owner", is_approved: false });
  revalidatePath("/knowledge");
}

export async function approveKnowledge(formData: FormData) {
  const { supabase, organizationId } = await currentOrg();
  const id = String(formData.get("id") ?? "");
  await supabase.from("knowledge_items").update({ is_approved: true, updated_at: new Date().toISOString() }).eq("id", id).eq("organization_id", organizationId);
  revalidatePath("/knowledge");
}
