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

  await supabase.from("approvals").update({ decision, decided_by: user.id, decided_at: new Date().toISOString() })
    .eq("id", approvalId).eq("organization_id", orgId);
  await supabase.from("actions").update({ status: decision === "approved" ? "approved" : "cancelled" })
    .eq("id", actionId).eq("organization_id", orgId);
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
}
export async function approve(formData: FormData) { return decide(formData, "approved"); }
export async function reject(formData: FormData) { return decide(formData, "rejected"); }
