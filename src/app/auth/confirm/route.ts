import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash")?.trim() ?? null;
  const rawType = searchParams.get("type");
  const allowedTypes = new Set<EmailOtpType>(["signup","invite","magiclink","recovery","email_change","email"]);
  const type = rawType && allowedTypes.has(rawType as EmailOtpType) ? rawType as EmailOtpType : null;
  const next = searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

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
