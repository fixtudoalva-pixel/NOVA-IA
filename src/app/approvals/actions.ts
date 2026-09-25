"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function decide(formData: FormData, decision: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const approvalId = String(formData.get("approval_id") ?? "").trim();
  const actionId = String(formData.get("action_id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(approvalId) || !/^[0-9a-f-]{36}$/i.test(actionId)) redirect("/approvals?error=decision");
  const { error } = await supabase.rpc("decide_approval", { p_approval_id: approvalId, p_action_id: actionId, p_decision: decision });
  if (error) redirect("/approvals?error=decision");
  revalidatePath("/approvals"); revalidatePath("/actions"); revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect(`/approvals?${decision === "approved" ? "approved" : "rejected"}=1`);
}
export async function approve(formData: FormData) { return decide(formData, "approved"); }
export async function reject(formData: FormData) { return decide(formData, "rejected"); }
