"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").limit(1).single();
  if (!membership) redirect("/onboarding");
  return { supabase, user, orgId: membership.organization_id };
}

export async function executeApprovedAction(formData: FormData) {
  const { supabase, orgId } = await context();
  const actionId = String(formData.get("action_id") ?? "");
  const { data: action } = await supabase.from("actions").select("id,action_type,status").eq("id", actionId).eq("organization_id", orgId).single();
  if (!action || action.status !== "approved") return;
  const completedAt = new Date().toISOString();
  await supabase.from("actions").update({ status: "completed", completed_at: completedAt, output: { executor: "simulator", completed_at: completedAt } }).eq("id", actionId).eq("organization_id", orgId).eq("status", "approved");
  await supabase.from("outcomes").insert({ organization_id: orgId, action_id: actionId, kind: action.action_type === "propose_booking" ? "booking" : "other", attribution: "assisted", evidence: { source: "simulator" } });
  revalidatePath("/actions"); revalidatePath("/dashboard");
}

export async function recordSaleOutcome(formData: FormData) {
  const { supabase, user, orgId } = await context();
  const actionId = String(formData.get("action_id") ?? "");
  const euros = Number(formData.get("euros") ?? 0);
  if (!Number.isFinite(euros) || euros <= 0) return;
  const { data: action } = await supabase.from("actions").select("id,status").eq("id", actionId).eq("organization_id", orgId).single();
  if (!action || action.status !== "completed") return;
  await supabase.from("outcomes").insert({ organization_id: orgId, action_id: actionId, kind: "sale", revenue_minor: Math.round(euros * 100), attribution: "assisted", evidence: { source: "human_confirmation", confirmed_by: user.id } });
  revalidatePath("/actions"); revalidatePath("/dashboard");
}
