"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function decide(formData: FormData, decision: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!membership) redirect("/onboarding");
  const orgId = membership.organization_id;
  const approvalId = String(formData.get("approval_id") ?? "");
  const actionId = String(formData.get("action_id") ?? "");

  const { data: approval } = await supabase.from("approvals")
    .select("id,decision,action_id").eq("id", approvalId).eq("organization_id", orgId).single();
  if (!approval || approval.decision || approval.action_id !== actionId) return;

  await supabase.from("approvals").update({
    decision, decided_by: user.id, decided_at: new Date().toISOString()
  }).eq("id", approvalId).eq("organization_id", orgId).is("decision", null);

  await supabase.from("actions").update({
    status: decision === "approved" ? "approved" : "cancelled"
  }).eq("id", actionId).eq("organization_id", orgId).eq("status", "awaiting_approval");

  revalidatePath("/approvals");
  revalidatePath("/actions");
  revalidatePath("/dashboard");
}
export async function approve(formData: FormData) { return decide(formData, "approved"); }
export async function reject(formData: FormData) { return decide(formData, "rejected"); }
