"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function simulateInbound(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (String(formData.get("name") ?? "").trim() || "Cliente teste").slice(0, 120);
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 2 || body.length > 4000) redirect("/inbox?error=message");

  const { error } = await supabase.rpc("simulate_inbound", { p_name: name, p_body: body });
  if (error) redirect("/inbox?error=simulate");

  revalidatePath("/inbox");
  revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect("/inbox?created=1");
}
