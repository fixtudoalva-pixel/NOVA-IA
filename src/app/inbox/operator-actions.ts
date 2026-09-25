"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import { runDeterministicOperator } from "@/lib/operator/engine";

export async function runOperator(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) redirect("/inbox?error=operator");

  const { data: membership, error: membershipError } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
  if (membershipError) redirect("/inbox?error=operator");
  if (!membership) redirect("/onboarding");

  const orgId = membership.organization_id;
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id,messages(id,body,actor,created_at)")
    .eq("id", conversationId)
    .eq("organization_id", orgId)
    .single();

  if (conversationError || !conversation) redirect("/inbox?error=operator");

  const latestCustomer = [...(conversation.messages ?? [])]
    .filter(m => m.actor === "customer")
    .sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
  if (!latestCustomer) redirect("/inbox?error=no_customer_message");

  const { data: knowledge, error: knowledgeError } = await supabase
    .from("knowledge_items")
    .select("kind,title,content")
    .eq("organization_id", orgId)
    .eq("is_approved", true)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (knowledgeError) redirect("/inbox?error=operator");
  const approvedKnowledge = (knowledge ?? []).filter(item => item.title.trim().length >= 2 && item.content.trim().length >= 2);

  const decision = runDeterministicOperator({
    message: latestCustomer.body,
    knowledge: approvedKnowledge,
    autonomy: 2
  });

  // The database independently enforces approval for every MVP Operator side effect.
  const actions = decision.proposedActions.map(proposed => ({ ...proposed, requiresApproval: true }));

  const { error } = await supabase.rpc("commit_operator_decision", {
    p_conversation_id: conversationId,
    p_source_message_id: latestCustomer.id,
    p_decision: JSON.parse(JSON.stringify(decision)) as Json,
    p_actions: JSON.parse(JSON.stringify(actions)) as Json
  });
  if (error) redirect("/inbox?error=operator");

  revalidatePath("/inbox");
  revalidatePath("/approvals");
  revalidatePath("/actions");
  revalidatePath("/dashboard");
  revalidatePath("/ask");
  redirect("/inbox?operator=1");
}
