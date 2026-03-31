import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("provider_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providerId = JSON.parse(sessionCookie).id;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("productId") as string;

    if (!file || !productId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${providerId}/${productId}/${fileName}`;

    // 🔥 STORAGE UPLOAD (BYPASSES RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from("product-screenshots")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 🔥 DB INSERT (BYPASSES RLS)
    const { data, error } = await supabaseAdmin
      .from("product_screenshots")
      .insert({
        user_id: providerId,
        product_id: productId,
        file_path: filePath,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}
