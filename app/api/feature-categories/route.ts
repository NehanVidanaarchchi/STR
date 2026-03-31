import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("feature_categories")
      .select("id, name")
      .eq("kind", "catalogue")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error("feature categories error:", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}