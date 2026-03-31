import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendFieldRequestConfirmationEmail } from "@/lib/email/sendFieldRequestConfirmationEmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const { featureCategoryId,fieldName, fieldDescription, contactEmail } = body;

    if (!featureCategoryId || !fieldName || !fieldDescription || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Optional provider context
    let providerId: string | null = null;
    const providerCookie = (await cookies()).get("provider_session");
    if (providerCookie) {
      const provider = JSON.parse(providerCookie.value);
      providerId = provider.id;
    }

        const { data: category, error: categoryError } = await supabase
      .from("feature_categories")
      .select("name")
      .eq("id", featureCategoryId)
      .single();

    if (categoryError) throw categoryError;

    // 1️⃣ Save request
    const { error } = await supabase
      .from("form_field_requests")
      .insert({
        provider_id: providerId,
        feature_category_id: featureCategoryId,
        field_name: fieldName,
        field_description: fieldDescription,
        contact_email: contactEmail,
      });

    if (error) throw error;

    // 2️⃣ Send confirmation email
    await sendFieldRequestConfirmationEmail(contactEmail, fieldName,category.name);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Field request error:", err);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
