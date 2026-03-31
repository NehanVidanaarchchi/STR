import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { joinSTRMarketMapTemplate } from "@/lib/email/joinSTRMarketMapTemplate";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, email, generic_email")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const recipient = company.generic_email || company.email;

    if (!recipient) {
      return NextResponse.json(
        { error: "This company does not have an email address" },
        { status: 400 }
      );
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/provider-signup?companyId=${company.id}`;

    await sendEmail({
      to: recipient,
      subject: `Join STR Market Map`,
      html: joinSTRMarketMapTemplate({
        companyName: company.name,
        inviteLink,
      }),
    });

    await supabase
      .from("companies")
      .update({
        invite_sent_at: new Date().toISOString(),
        invite_status: "sent",
        last_invited_email: recipient,
        updated_at: new Date().toISOString(),
      })
      .eq("id", company.id);

    return NextResponse.json({
      success: true,
      message: "Invite email sent successfully",
    });
  } catch (error) {
    console.error("Failed to send company invite:", error);
    return NextResponse.json(
      { error: "Failed to send invite email" },
      { status: 500 }
    );
  }
}