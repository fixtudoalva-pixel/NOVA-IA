"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function decide(formData: FormData, decision: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const approvalId = String(formData.get("approval_id") ?? "");
  const actionId = String(formData.get("action_id") ?? "");
  if (!approvalId || !actionId) return;
  await supabase.rpc("decide_approval", { p_approval_id: approvalId, p_action_id: actionId, p_decision: decision });
  revalidatePath("/approvals"); revalidatePath("/actions"); revalidatePath("/dashboard");
}
export async function approve(formData: FormData) { return decide(formData, "approved"); }
export async function reject(formData: FormData) { return decide(formData, "rejected"); }
