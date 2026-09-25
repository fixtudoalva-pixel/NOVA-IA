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
  const { supabase } = await context();
  const actionId = String(formData.get("action_id") ?? "");
  if (!actionId) redirect("/actions?error=execute");
  const { error } = await supabase.rpc("execute_approved_action", { p_action_id: actionId });
  if (error) redirect("/actions?error=execute");
  revalidatePath("/actions"); revalidatePath("/dashboard");
  redirect("/actions?executed=1");
}

export async function recordSaleOutcome(formData: FormData) {
  const { supabase, user, orgId } = await context();
  const actionId = String(formData.get("action_id") ?? "");
  const euros = Number(formData.get("euros") ?? 0);
  if (!actionId || !Number.isFinite(euros) || euros <= 0) redirect("/actions?error=sale");
  const { data: action } = await supabase.from("actions").select("id,status").eq("id", actionId).eq("organization_id", orgId).single();
  if (!action || action.status !== "completed") redirect("/actions?error=sale");
  const { error } = await supabase.from("outcomes").insert({ organization_id: orgId, action_id: actionId, kind: "sale", revenue_minor: Math.round(euros * 100), attribution: "assisted", evidence: { source: "human_confirmation", confirmed_by: user.id } });
  if (error) redirect("/actions?error=sale");
  revalidatePath("/actions"); revalidatePath("/dashboard");
  redirect("/actions?sale=1");
}
