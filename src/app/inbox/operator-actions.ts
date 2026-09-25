"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { data: conversation } = await supabase.from("conversations")
    .select("id,messages(body,actor,created_at)")
    .eq("id", conversationId).eq("organization_id", orgId).single();
  if (!conversation) return;

  const latestCustomer = [...(conversation.messages ?? [])]
    .filter(m => m.actor === "customer")
    .sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
  if (!latestCustomer) return;

  const { data: knowledge } = await supabase.from("knowledge_items")
    .select("kind,title,content").eq("organization_id", orgId).eq("is_approved", true);

  const decision = runDeterministicOperator({
    message: latestCustomer.body,
    knowledge: knowledge ?? [],
    autonomy: 2
  });

  const { data: run } = await supabase.from("agent_runs").insert({
    organization_id: orgId, conversation_id: conversationId,
    model_provider: "deterministic", model_name: "operator-v0",
    status: "completed", input: { message_id: latestCustomer.created_at },
    output: decision, started_at: new Date().toISOString(), completed_at: new Date().toISOString()
  }).select("id").single();

  for (const proposed of decision.proposedActions) {
    const policy = evaluateActionPolicy({ autonomy: 2, risk: proposed.risk, hasExternalSideEffect: true });
    const status = policy.requiresApproval ? "awaiting_approval" : "approved";
    const { data: action } = await supabase.from("actions").insert({
      organization_id: orgId, action_type: proposed.type, status,
      risk: proposed.risk, rationale: proposed.rationale,
      input: { ...proposed.payload, agent_run_id: run?.id ?? null }
    }).select("id").single();
    if (action && policy.requiresApproval) {
      await supabase.from("approvals").insert({ organization_id: orgId, action_id: action.id, requested_by: "agent" });
    }
  }

  await supabase.from("messages").insert({
    organization_id: orgId, conversation_id: conversationId,
    direction: "outbound", actor: "agent", body: decision.reply,
    metadata: { confidence: decision.confidence, intent: decision.intent, agent_run_id: run?.id ?? null }
  });
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}
