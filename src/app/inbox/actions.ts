"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function simulateInbound(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rawName = String(formData.get("name") ?? "").trim();
  const name = rawName || "Cliente teste";
  const body = String(formData.get("body") ?? "").trim();
  if (name.length < 1 || name.length > 120 || body.length < 2 || body.length > 4000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(body)) redirect("/inbox?error=message");

  const { error } = await supabase.rpc("simulate_inbound", { p_name: name, p_body: body });
  if (error) redirect("/inbox?error=simulate");

  revalidatePath("/inbox");
  revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect("/inbox?created=1");
}
