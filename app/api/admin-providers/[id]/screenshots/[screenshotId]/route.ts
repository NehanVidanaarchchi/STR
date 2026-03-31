import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

type AdminSession = {
  id: string;
  role: string;
};

function getAdminSession(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): AdminSession | null {
  const adminSessionRaw = cookieStore.get("admin_session")?.value;

  if (!adminSessionRaw) return null;

  try {
    const s = JSON.parse(adminSessionRaw);
    if (!s?.id) return null;

    return {
      id: s.id,
      role: s.role || "Admin",
    };
  } catch {
    return null;
  }
}

interface RouteParams {
  params: Promise<{ id: string; screenshotId: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const cookieStore = await cookies();
  const adminSession = getAdminSession(cookieStore);

  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: providerId, screenshotId } = await params;

  const { data: screenshot, error: fetchError } = await supabaseAdmin
    .from("product_screenshots")
    .select("*")
    .eq("id", screenshotId)
    .eq("user_id", providerId)
    .single();

  if (fetchError || !screenshot) {
    return NextResponse.json(
      { error: "Screenshot not found" },
      { status: 404 }
    );
  }

  const { error: storageError } = await supabaseAdmin.storage
    .from("product-screenshots")
    .remove([screenshot.file_path]);

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from("product_screenshots")
    .delete()
    .eq("id", screenshotId)
    .eq("user_id", providerId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}