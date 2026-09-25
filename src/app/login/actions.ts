"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getSiteUrl(host: string | null, protocol: string | null) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    try { return new URL(configured).origin; } catch { /* use validated fallbacks */ }
  }

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercel && /^[a-z0-9.-]+$/i.test(vercel)) return `https://${vercel.replace(/\/$/, "")}`;

  if (host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host)) return `${protocol === "http" ? "http" : "https"}://${host}`;
  return "http://localhost:3000";
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (/[\u0000-\u001F\u007F]/.test(email) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128) redirect("/login?error=invalid");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=invalid");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (/[\u0000-\u001F\u007F]/.test(email) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128) redirect("/login?error=signup");
  const requestHeaders = await headers();
  const siteUrl = getSiteUrl(
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-proto")
  );

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`
    }
  });

  if (error) {
    const code = "code" in error ? String(error.code ?? "") : "";
    if (code === "over_email_send_rate_limit") redirect("/login?error=rate_limit");
    redirect("/login?error=signup");
  }
  redirect("/login?created=1");
}
