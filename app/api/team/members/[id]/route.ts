import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

type SessionInfo = {
  providerId: string;
  role: "Admin" | "Editor" | "Viewer";
  userType: "provider" | "team_member";
  userId: string;
};

function getSession(cookieStore: Awaited<ReturnType<typeof cookies>>): SessionInfo | null {
  const providerSessionRaw = cookieStore.get("provider_session")?.value;
  const teamSessionRaw = cookieStore.get("team_member_session")?.value;

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

// ✅ Next.js 16 expects params as Promise in the context
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return NextResponse.json({ id });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createClient();
  const { role, status } = await req.json();

  const { error } = await supabase
    .from("team_members")
    .update({ role, status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createClient();
  const cookieStore = await cookies();
  const session = getSession(cookieStore);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Member ID missing from URL" }, { status: 400 });
  }

  const { name, role } = await req.json();
  if (!name || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("team_members")
    .update({ full_name: name, role })
    .eq("id", id)
    .eq("provider_id", session.providerId) // ✅ security
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
