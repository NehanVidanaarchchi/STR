import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendReferenceEmail } from "@/lib/email/sendReferenceEmail";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("provider_session");
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providerSession = JSON.parse(sessionCookie.value);
    const supabase = await createClient();

    const body = await req.json();
    const { segment, customerName, companyName, email, website } = body;

    // get company
    const { data: provider } = await supabase
      .from("company_providers")
      .select("company_id")
      .eq("provider_id", providerSession.id)
      .single();

    if (!provider?.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // insert reference
    const { data: reference, error } = await supabase
      .from("company_references")
      .insert({
        company_id: provider.company_id,
        segment,
        customer_name: customerName,
        company_name: companyName,
        email,
        website,
      })
      .select()
      .single();

    if (error) throw error;

    try {
      await sendReferenceEmail({
        to: email,
        customerName,
        companyName,
        token: reference.confirmation_token,
      });
      console.log('✅ Email sent successfully');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Don't throw here - we still want to return the reference even if email fails
      // But we should log it
    }

    return NextResponse.json({ reference });
  } catch (err) {
    
    console.error(err);
    return NextResponse.json({ error: "Failed to add reference" }, { status: 500 });
  }
}

function getProviderIdFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const providerRaw = cookieStore.get("provider_session")?.value;
  const teamRaw = cookieStore.get("team_member_session")?.value;

  // If both exist, treat as invalid (optional but recommended)
  if (providerRaw && teamRaw) return null;

  if (providerRaw) {
    const s = JSON.parse(providerRaw);
    return s?.id ? { providerId: s.id, role: "Admin" as const } : null;
  }

  if (teamRaw) {
    const s = JSON.parse(teamRaw);
    return s?.provider_id
      ? { providerId: s.provider_id, role: (s.role || "Viewer") as "Admin" | "Editor" | "Viewer" }
      : null;
  }

  return null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = getProviderIdFromCookies(cookieStore);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: providerLink, error: linkError } = await supabase
      .from("company_providers")
      .select("company_id")
      .eq("provider_id", session.providerId)
      .single();

    if (linkError) {
      console.error("company_providers error:", linkError);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    if (!providerLink?.company_id) {
      return NextResponse.json({ references: [] });
    }

    const { data: references, error } = await supabase
      .from("company_references")
      .select("*")
      .eq("company_id", providerLink.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("company_references error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ references });
  } catch (err) {
    console.error("Load references error:", err);
    return NextResponse.json({ error: "Failed to load references" }, { status: 500 });
  }
}

