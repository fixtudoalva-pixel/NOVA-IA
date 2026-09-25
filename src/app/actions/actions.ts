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
  const { supabase } = await context();
  const actionId = String(formData.get("action_id") ?? "");
  const euros = Number(formData.get("euros") ?? 0);
  if (!actionId || !Number.isFinite(euros) || euros <= 0) redirect("/actions?error=sale");
  const revenueMinor = Math.round(euros * 100);
  const { error } = await supabase.rpc("record_sale_outcome", {
    p_action_id: actionId,
    p_revenue_minor: revenueMinor
  });
  if (error) redirect("/actions?error=sale");
  revalidatePath("/actions"); revalidatePath("/dashboard");
  redirect("/actions?sale=1");
}
