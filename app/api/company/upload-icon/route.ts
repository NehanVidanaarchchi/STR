import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const companyId = formData.get("companyId") as string | null;
    const type = "icon" as string | null;

    if (!file || !companyId || !type) {
      return NextResponse.json(
        { error: "Missing upload data" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop();
    const timestamp = Date.now();

    const path = `companies/${companyId}/${type}-${timestamp}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("company-icons")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false, // 🔥 important
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("companies")
      .update({ [`${type}_url`]: path })
      .eq("id", companyId);

    return NextResponse.json({ success: true, path });

  } catch (err) {
    console.error("UPLOAD FAILED", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
