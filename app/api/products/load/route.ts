import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

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
    const supabase = await createClient();
    const cookieStore = await cookies();
    const session = getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get provider with company info
    const { data: providerWithCompany } = await supabase
      .from('providers')
      .select(`
        company_primary_type,
        linked_company_id,
        company_name
      `)
      .eq('id', session.providerId)
      .single();

    // Get company details if linked
    let companyData = null;
    if (providerWithCompany?.linked_company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select(`
          name,
          product_summary_long,
          product_summary_short
        `)
        .eq('id', providerWithCompany.linked_company_id)
        .single();

      companyData = company;
    }

    // Get existing product
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("provider_id", session.providerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!product) {
      // Return default product with company's data
      return NextResponse.json({
        product: {
          id: null,
          // Use company name if available, otherwise empty
          name: companyData?.name || "",
          // Use company description if available, otherwise empty
          description: companyData?.product_summary_long || companyData?.product_summary_short || "",
          pricing_model: "",
          free_trial: true,
          pricing_info: "",
          // Set primary_type from company if available
          primary_type: providerWithCompany?.company_primary_type || "",
          provider_id: session.providerId
        },
        features: []
      });
    }

    // Get feature selections for existing product
    const { data: featureSelections } = await supabase
      .from("product_feature_selections")
      .select("feature_id")
      .eq("product_id", product.id);

    const { data: featureTags } = await supabase
      .from("product_feature_tags")
      .select("tag")
      .eq("product_id", product.id);


    return NextResponse.json({
      product,
      features: (featureSelections ?? []).map(f => f.feature_id),
      featureTags: (featureTags ?? []).map(t => t.tag)
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}
