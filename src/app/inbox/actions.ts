"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function simulateInbound(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!membership) redirect("/onboarding");
  const organizationId = membership.organization_id;
  const name = String(formData.get("name") ?? "Cliente teste").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const { data: contact } = await supabase.from("contacts").insert({ organization_id: organizationId, display_name: name }).select("id").single();
  if (!contact) return;
  const { data: conversation } = await supabase.from("conversations").insert({ organization_id: organizationId, contact_id: contact.id, channel: "simulator" }).select("id").single();
  if (!conversation) return;
  await supabase.from("messages").insert({ organization_id: organizationId, conversation_id: conversation.id, direction: "inbound", actor: "customer", body });
  revalidatePath("/inbox");
}
