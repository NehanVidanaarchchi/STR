import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { generateLoginToken } from "@/lib/tokens";
import { providerApprovedTemplate } from "@/lib/email/providerApprovedTemplate";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: providerId } = await params;

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID missing in URL" }, { status: 400 });
    }

    // 1) Load provider
    const { data: provider, error } = await supabaseAdmin
      .from("providers")
      .select("*")
      .eq("id", providerId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    if (provider.claim_status !== "pending") {
      return NextResponse.json({ error: "Provider already approved" }, { status: 400 });
    }

    // 2) Create company
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: provider.company_original_name,
        product_summary_long: provider.company_description,
      })
      .select()
      .single();

    if (companyError) {
      return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
    }

    // 3) Update provider
    const { error: updateError } = await supabaseAdmin
      .from("providers")
      .update({
        linked_company_id: company.id,
        claim_status: "approved",
      })
      .eq("id", providerId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
    }

    // 4) (optional) create relation in company_providers
    await supabaseAdmin.from("company_providers").insert({
      provider_id: providerId,
      company_id: company.id,
      role: "owner",
    });

    // 5) Create magic login token + save hash
    const { token, tokenHash } = generateLoginToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await supabaseAdmin.from("provider_login_tokens").insert({
      provider_id: providerId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/magic-login?token=${token}`;

    // 6) Send approval email
    await sendEmail({
      to: provider.work_email,
      subject: "✅ Your provider claim is approved",
      html: providerApprovedTemplate({
        fullName: provider.full_name,
        companyName: company.name,
        loginLink,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Provider approved successfully (email sent)",
      companyId: company.id,
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}