"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

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
  if (!isUuid(actionId)) redirect("/actions?error=execute");
  const { data: action, error: readError } = await supabase.from("actions").select("id").eq("id", actionId).eq("organization_id", orgId).eq("status", "approved").maybeSingle();
  if (readError || !action) redirect("/actions?error=execute");
  const { error } = await supabase.rpc("execute_approved_action", { p_action_id: actionId });
  if (error) redirect("/actions?error=execute");
  revalidatePath("/actions"); revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect("/actions?executed=1");
}

export async function recordSaleOutcome(formData: FormData) {
  const { supabase, orgId } = await context();
  const actionId = String(formData.get("action_id") ?? "").trim();
  const rawAmount = String(formData.get("amount") ?? "").trim().replace(",", ".");
  if (rawAmount.length > 12) redirect("/actions?error=sale");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(rawAmount)) redirect("/actions?error=sale");
  if (!isUuid(actionId) || Number(rawAmount) <= 0 || Number(rawAmount) > 100000000) redirect("/actions?error=sale");
  const { data: action, error: readError } = await supabase.from("actions").select("id").eq("id", actionId).eq("organization_id", orgId).eq("status", "completed").maybeSingle();
  if (readError || !action) redirect("/actions?error=sale");
  const [whole, fraction = ""] = rawAmount.split(".");
  const revenueMinor = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isSafeInteger(revenueMinor) || revenueMinor <= 0 || revenueMinor > 10000000000) redirect("/actions?error=sale");
  const { error } = await supabase.rpc("record_sale_outcome", {
    p_action_id: actionId,
    p_revenue_minor: revenueMinor
  });
  if (error) redirect("/actions?error=sale");
  revalidatePath("/actions"); revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect("/actions?sale=1");
}
