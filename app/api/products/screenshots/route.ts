import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

export async function GET(req: Request) {
    const cookieStore = await cookies();
    const session = getSession(cookieStore);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  // 1️⃣ Fetch screenshots
  const { data, error } = await supabaseAdmin
    .from("product_screenshots")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", session.providerId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // 2️⃣ Create signed URLs
  const images = await Promise.all(
    data.map(async (img) => {
      const { data: signed } = await supabaseAdmin.storage
        .from("product-screenshots")
        .createSignedUrl(img.file_path, 60 * 60);

      return {
        ...img,
        url: signed?.signedUrl,
      };
    })
  );

  return NextResponse.json(images);
}
