import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=invalid_token", url)
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("provider_login_tokens")
      .select("id, expires_at, used")
      .eq("token_hash", tokenHash)
      .single();

    if (
      error ||
      !data ||
      data.used ||
      new Date(data.expires_at) < new Date()
    ) {
      return NextResponse.redirect(
        new URL("/auth/login?error=expired", url)
      );
    }

    // mark token as used
    await supabase
      .from("provider_login_tokens")
      .update({ used: true })
      .eq("id", data.id);

    // ✅ SUCCESS → go to login page
    return NextResponse.redirect(
      new URL("/auth/login?magic=success", url)
    );
  } catch (err) {
    console.error("Magic login error:", err);

    return NextResponse.redirect(
      new URL("/auth/login?error=server", request.url)
    );
  }
}
