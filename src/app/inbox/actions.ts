"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function simulateInbound(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim() || "Cliente teste";
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 2) redirect("/inbox?error=message");

  const { error } = await supabase.rpc("simulate_inbound", { p_name: name, p_body: body });
  if (error) redirect("/inbox?error=simulate");

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  redirect("/inbox?created=1");
}
