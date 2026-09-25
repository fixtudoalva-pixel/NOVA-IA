"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasUnsafeControlChars, normalizeSingleLine } from "@/lib/validation";

export async function simulateInbound(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rawName = normalizeSingleLine(formData.get("name"), 120);
  const name = rawName || "Cliente teste";
  const body = String(formData.get("body") ?? "").trim().replace(/\r\n/g, "\n");
  if (name.length < 1 || name.length > 120 || body.length < 2 || body.length > 4000 || hasUnsafeControlChars(name) || hasUnsafeControlChars(body)) redirect("/inbox?error=message");

  const { error } = await supabase.rpc("simulate_inbound", { p_name: name, p_body: body });
  if (error) redirect("/inbox?error=simulate");

  revalidatePath("/inbox");
  revalidatePath("/dashboard"); revalidatePath("/ask");
  redirect("/inbox?created=1");
}
