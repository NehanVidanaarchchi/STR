import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>
}

function getProviderIdFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const providerRaw = cookieStore.get("provider_session")?.value;
  const teamRaw = cookieStore.get("team_member_session")?.value;

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

export async function DELETE(
  req: Request,
  { params }: RouteParams
) {
  try {
    const cookieStore = await cookies();
    const session = getProviderIdFromCookies(cookieStore);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params

    const supabase = await createClient();
    const referenceId = id;


    // First, verify that this reference belongs to the user's company
    const { data: provider } = await supabase
      .from("company_providers")
      .select("company_id")
      .eq("provider_id", session.providerId)
      .single();

    if (!provider?.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify the reference belongs to this company
    const { data: reference, error: fetchError } = await supabase
      .from("company_references")
      .select("company_id")
      .eq("id", referenceId)
      .single();

      console.log(referenceId,session.providerId,'dddddddddddddddddd');
    if (fetchError || !reference) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 });
    }

    if (reference.company_id !== provider.company_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the reference
    const { error: deleteError } = await supabase
      .from("company_references")
      .delete()
      .eq("id", referenceId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete reference" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete reference error:", err);
    return NextResponse.json({ error: "Failed to delete reference" }, { status: 500 });
  }
}