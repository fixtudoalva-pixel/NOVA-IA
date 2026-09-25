import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let origin = new URL(request.url).origin;
  if (configured && /^https?:\/\//i.test(configured)) {
    try { origin = new URL(configured).origin; } catch { /* fall back to request origin */ }
  }
  const tokenHash = searchParams.get("token_hash")?.trim() ?? null;
  const rawType = searchParams.get("type")?.trim() ?? null;
  const allowedTypes = new Set<EmailOtpType>(["signup","invite","magiclink","recovery","email_change","email"]);
  const type = rawType && allowedTypes.has(rawType as EmailOtpType) ? rawType as EmailOtpType : null;
  const next = searchParams.get("next")?.trim() ?? null;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\") && !/[\u0000-\u001F]/.test(next) && next.length <= 500 ? next : "/dashboard";

  if (tokenHash && tokenHash.length <= 512 && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash
    });

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirmation", origin));
}
