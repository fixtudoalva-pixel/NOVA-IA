"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function simulateInbound(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const name = String(formData.get("name") ?? "Cliente teste").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await supabase.rpc("simulate_inbound", { p_name: name, p_body: body });
  revalidatePath("/inbox");
}
