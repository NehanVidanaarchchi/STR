import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const cookieStore = await cookies();

    // Clear all session cookies first
    cookieStore.delete("admin_session");
    cookieStore.delete("provider_session");
    cookieStore.delete("team_member_session");

    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, full_name, email, password_hash, is_active")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Admin login query error:", error);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, admin.password_hash);

    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    cookieStore.set(
      "admin_session",
      JSON.stringify({
        id: admin.id,
        email: admin.email,
        name: admin.full_name,
        role: "super_admin",
        type: "admin",
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );

    return NextResponse.json({
      success: true,
      user_type: "admin",
      role: "super_admin",
      redirect: "/admin",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}