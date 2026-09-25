"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import { runDeterministicOperator } from "@/lib/operator/engine";
import { evaluateActionPolicy } from "@/lib/domain";

export async function runOperator(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const conversationId = String(formData.get("conversation_id") ?? "");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!membership) redirect("/onboarding");
  const orgId = membership.organization_id;
  const { data: conversation } = await supabase.from("conversations").select("id,messages(id,body,actor,created_at)").eq("id",conversationId).eq("organization_id",orgId).single();
  if (!conversation) return;
  const latestCustomer=[...(conversation.messages??[])].filter(m=>m.actor==="customer").sort((a,b)=>b.created_at.localeCompare(a.created_at))[0];
  if (!latestCustomer) return;
  const { data: knowledge }=await supabase.from("knowledge_items").select("kind,title,content").eq("organization_id",orgId).eq("is_approved",true);
  const decision=runDeterministicOperator({message:latestCustomer.body,knowledge:knowledge??[],autonomy:2});
  const actions=decision.proposedActions.map(proposed=>({
    ...proposed,
    requiresApproval:evaluateActionPolicy({autonomy:2,risk:proposed.risk,hasExternalSideEffect:true}).requiresApproval
  }));
  await supabase.rpc("commit_operator_decision",{
    p_conversation_id:conversationId,
    p_source_message_id:latestCustomer.id,
    p_decision:JSON.parse(JSON.stringify(decision)) as Json,
    p_actions:JSON.parse(JSON.stringify(actions)) as Json
  });
  revalidatePath("/inbox"); revalidatePath("/approvals"); revalidatePath("/actions"); revalidatePath("/dashboard");
}
