"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
  if (membershipError) throw new Error("Não foi possível carregar a organização.");
  if (!membership) redirect("/onboarding");
  return { supabase, user, orgId: membership.organization_id };
}

export async function executeApprovedAction(formData: FormData) {
  const { supabase, orgId } = await context();
  const actionId = String(formData.get("action_id") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actionId)) redirect("/actions?error=execute");
  const { data: action, error: readError } = await supabase.from("actions").select("id").eq("id", actionId).eq("organization_id", orgId).eq("status", "approved").maybeSingle();
  if (readError || !action) redirect("/actions?error=execute");
  const { error } = await supabase.rpc("execute_approved_action", { p_action_id: actionId });
  if (error) redirect("/actions?error=execute");
  revalidatePath("/actions"); revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect("/actions?executed=1");
}

export async function recordSaleOutcome(formData: FormData) {
  const { supabase } = await context();
  const actionId = String(formData.get("action_id") ?? "").trim();
  const rawAmount = String(formData.get("amount") ?? "").trim().replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(rawAmount)) redirect("/actions?error=sale");
  const amount = Number(rawAmount);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actionId) || !Number.isFinite(amount) || amount <= 0 || amount > 100000000) redirect("/actions?error=sale");
  const revenueMinor = Math.round(amount * 100);
  if (!Number.isSafeInteger(revenueMinor)) redirect("/actions?error=sale");
  const { error } = await supabase.rpc("record_sale_outcome", {
    p_action_id: actionId,
    p_revenue_minor: revenueMinor
  });
  if (error) redirect("/actions?error=sale");
  revalidatePath("/actions"); revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect("/actions?sale=1");
}
