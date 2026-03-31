import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type SessionInfo = {
  providerId: string;
  role: "Admin" | "Editor" | "Viewer";
  userType: "provider" | "team_member";
  userId: string;
};

function getSession(cookieStore: Awaited<ReturnType<typeof cookies>>): SessionInfo | null {
  const providerSessionRaw = cookieStore.get("provider_session")?.value;
  const teamSessionRaw = cookieStore.get("team_member_session")?.value;

  // If both exist, clear and force re-login (prevents weird conflicts)
  if (providerSessionRaw && teamSessionRaw) return null;

  if (providerSessionRaw) {
    const s = JSON.parse(providerSessionRaw);
    if (!s?.id) return null;

    return {
      providerId: s.id,
      role: "Admin",
      userType: "provider",
      userId: s.id,
    };
  }

  if (teamSessionRaw) {
    const s = JSON.parse(teamSessionRaw);
    if (!s?.id || !s?.provider_id) return null;

    return {
      providerId: s.provider_id,
      role: (s.role || "Viewer") as SessionInfo["role"],
      userType: "team_member",
      userId: s.id,
    };
  }

  return null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = getSession(cookieStore);

    if (!session) {
      // optionally clear cookies if you want
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("company_providers")
      .select(
        `
        company_id,
        companies (
          id,
          name,
          website_url,
          linkedin_url,
          generic_email,
          email,
          country,
          countries,
          city,
          founded_year,
          employee_count,
          primary_type,
          product_summary_short,
          product_summary_long,
          logo_url,
          icon_url,
          enabled_segments,
          created_at,
          updated_at
        )
      `
      )
      .eq("provider_id", session.providerId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.companies) {
      return NextResponse.json({ error: "No company linked" }, { status: 404 });
    }

    const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      company: {
        ...company,
        city: company.city || null,
        founded_year: company.founded_year || null,
        employee_count: company.employee_count || null,
        country: company.country || null,
        countries: company.countries || [],
      },
      session: {
        role: session.role,
        userType: session.userType,
      },
    });
  } catch (err) {
    console.error("Company profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = getSession(cookieStore);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Block Viewers from editing
    if (session.role === "Viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    const body = await req.json();

    const {
      headline, // not used currently in updateData; keep if you plan to store it
      description,
      website,
      linkedin,
      city,
      foundedYear,
      employeeCount,
      countries,
      enabledSegments,
      country,
    } = body;

    // Get company for this provider (IMPORTANT: use session.providerId)
    const { data: providerLink, error: linkError } = await supabase
      .from("company_providers")
      .select("company_id")
      .eq("provider_id", session.providerId)
      .single();

    if (linkError) {
      console.error("Company link error:", linkError);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    if (!providerLink?.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const updateData: any = {
      product_summary_long: description,
      website_url: website,
      linkedin_url: linkedin,
      enabled_segments: enabledSegments,
      updated_at: new Date().toISOString(),
    };

    if (city !== undefined) updateData.city = city;
    if (foundedYear !== undefined) updateData.founded_year = foundedYear;
    if (employeeCount !== undefined) updateData.employee_count = employeeCount;

    if (Array.isArray(countries)) {
      updateData.countries = countries;
    } else if (country) {
      updateData.country = country;
    }

    const { error: updateError } = await supabase
      .from("companies")
      .update(updateData)
      .eq("id", providerLink.company_id);

    if (updateError) {
      console.error("Update company error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update company error:", err);
    return NextResponse.json({ error: "Failed to save company" }, { status: 500 });
  }
}
