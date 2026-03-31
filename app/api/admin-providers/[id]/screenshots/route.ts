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
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const cookieStore = await cookies();
  const adminSession = getAdminSession(cookieStore);

  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: providerId } = await params;
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("product_screenshots")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", providerId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const images = await Promise.all(
    (data || []).map(async (img) => {
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

export async function POST(request: Request, { params }: RouteParams) {
  const cookieStore = await cookies();
  const adminSession = getAdminSession(cookieStore);

  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: providerId } = await params;
  const formData = await request.formData();

  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;

  if (!file || !productId) {
    return NextResponse.json(
      { error: "Missing file or productId" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "png";
  const filePath = `${providerId}/${productId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("product-screenshots")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("product_screenshots")
    .insert({
      product_id: productId,
      user_id: providerId,
      file_path: filePath,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: signed } = await supabaseAdmin.storage
    .from("product-screenshots")
    .createSignedUrl(filePath, 60 * 60);

  return NextResponse.json({
    ...inserted,
    url: signed?.signedUrl,
  });
}