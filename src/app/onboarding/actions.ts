"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasUnsafeControlChars, normalizeSingleLine } from "@/lib/validation";

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = normalizeSingleLine(formData.get("name"), 120);
  if (name.length < 2 || name.length > 120 || hasUnsafeControlChars(name)) redirect("/onboarding?error=name");

  const { data: existing, error: membershipError } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
  if (membershipError) redirect("/onboarding?error=create");
  if (existing) redirect("/dashboard");

  const { error } = await supabase.rpc("create_organization", {
    organization_name: name,
    organization_locale: "pt-PT",
    organization_currency: "EUR"
  });
  if (error) redirect("/onboarding?error=create");
  redirect("/dashboard");
}
