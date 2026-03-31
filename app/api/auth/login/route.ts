// // import { NextResponse } from 'next/server'
// // import { createClient } from '@/lib/supabase/server'
// // import bcrypt from 'bcryptjs'
// // import { cookies } from 'next/headers'

// // export async function POST(request: Request) {
// //   try {
// //     const { email, password } = await request.json()

// //     if (!email || !password) {
// //       return NextResponse.json(
// //         { error: 'Email and password are required' },
// //         { status: 400 }
// //       )
// //     }

// //     const supabase = await createClient()

// //     // Fetch provider by email
// //     const { data: provider, error } = await supabase
// //       .from('providers')
// //       .select(`
// //         id,
// //         full_name,
// //         work_email,
// //         password_hash,
// //         is_active,
// //         claim_status
// //       `)
// //       .eq('work_email', email)
// //       .single()

// //     if (error || !provider) {
// //       return NextResponse.json(
// //         { error: 'Invalid email or password' },
// //         { status: 401 }
// //       )
// //     }

// //     if (!provider.is_active) {
// //       return NextResponse.json(
// //         { error: 'Account is inactive' },
// //         { status: 403 }
// //       )
// //     }

// //     // Verify password
// //     const isValidPassword = await bcrypt.compare(
// //       password,
// //       provider.password_hash
// //     )

// //     if (!isValidPassword) {
// //       return NextResponse.json(
// //         { error: 'Invalid email or password' },
// //         { status: 401 }
// //       )
// //     }

// //     // Store session (simple cookie-based session)
// //     (await
// //       // Store session (simple cookie-based session)
// //       cookies()).set(
// //       'provider_session',
// //       JSON.stringify({
// //         id: provider.id,
// //         email: provider.work_email,
// //         name: provider.full_name,
// //       }),
// //       {
// //         httpOnly: true,
// //         secure: process.env.NODE_ENV === 'production',
// //         sameSite: 'lax',
// //         path: '/',
// //         maxAge: 60 * 60 * 24, // 1 day
// //       }
// //     )

// //     return NextResponse.json({
// //       success: true,
// //       message: 'Login successful',
// //     })
// //   } catch (error) {
// //     console.error('Login error:', error)
// //     return NextResponse.json(
// //       { error: 'Internal server error' },
// //       { status: 500 }
// //     )
// //   }
// // }
// // /api/auth/login/route.ts
// import { NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase/server'
// import bcrypt from 'bcryptjs'
// import { cookies } from 'next/headers'

// export async function POST(request: Request) {
//   try {
//     const { email, password } = await request.json()

//     if (!email || !password) {
//       return NextResponse.json(
//         { error: 'Email and password are required' },
//         { status: 400 }
//       )
//     }

//     const supabase = await createClient()

//     // Fetch provider by email
//     const { data: provider, error } = await supabase
//       .from('providers')
//       .select(`
//         id,
//         full_name,
//         work_email,
//         password_hash,
//         is_active,
//         claim_status
//       `)
//       .eq('work_email', email)
//       .single()

//     if (error || !provider) {
//       return NextResponse.json(
//         { error: 'Invalid email or password' },
//         { status: 401 }
//       )
//     }

//     if (!provider.is_active) {
//       return NextResponse.json(
//         { error: 'Account is inactive' },
//         { status: 403 }
//       )
//     }

//     // Verify password
//     const isValidPassword = await bcrypt.compare(
//       password,
//       provider.password_hash
//     )

//     if (!isValidPassword) {
//       return NextResponse.json(
//         { error: 'Invalid email or password' },
//         { status: 401 }
//       )
//     }

//     // Store session with role included
//     const cookieStore = await cookies();
//     cookieStore.set(
//       'provider_session',
//       JSON.stringify({
//         id: provider.id,
//         email: provider.work_email,
//         name: provider.full_name,
//         role: 'Admin', // Add role here
//         type: 'provider' // Add type here
//       }),
//       {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         path: '/',
//         maxAge: 60 * 60 * 24, // 1 day
//       }
//     )

//     return NextResponse.json({
//       success: true,
//       message: 'Login successful',
//       user_type: 'provider',
//       role: 'Admin' // Also return in response
//     })
//   } catch (error) {
//     console.error('Login error:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const supabase = await createClient();
  const cookieStore = await cookies();

  // Always clear both first (prevents mixed sessions)
  cookieStore.delete("provider_session");
  cookieStore.delete("team_member_session");

  // 1) Try provider
  const { data: provider } = await supabase
    .from("providers")
    .select("id, full_name, work_email, password_hash, is_active,claim_status")
    .eq("work_email", email)
    .maybeSingle();
console.log(provider,'sssssssssssssssssssssssssssssss');

  if (provider) {
    if (!provider.is_active) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
    }
console.log(provider,'providerprovider');
        if (provider.claim_status === 'pending') {
          console.log(provider,'danwaa');

      return NextResponse.json(
        { 
          error: "Your account is pending approval. You'll receive an email once your company is verified.", 
          claim_status: 'pending' 
        }, 
        { status: 403 }
      );
    }
    const ok = await bcrypt.compare(password, provider.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    cookieStore.set(
      "provider_session",
      JSON.stringify({
        id: provider.id,
        email: provider.work_email,
        name: provider.full_name,
        role: "Admin",
        type: "provider",
      }),
      { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 }
    );

    return NextResponse.json({ success: true, user_type: "provider", role: "Admin" });
  }

  console.log('awaaaaaaaaaaaaa');
  // 2) Try team member

    const { data: member } = await supabase
    .from("team_members")
    .select("id, full_name, email, password_hash, role, is_active, provider_id")
    .eq("email", email)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Invalid email or passwords" }, { status: 401 });
  }

  if (!member.is_active) {
    return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
  }

  const ok = await bcrypt.compare(password, member.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  cookieStore.set(
    "team_member_session",
    JSON.stringify({
      id: member.id,
      email: member.email,
      name: member.full_name,
      role: member.role || "Viewer",
      provider_id: member.provider_id,
      type: "team_member",
    }),
    { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 }
  );

  return NextResponse.json({ success: true, user_type: "team_member", role: member.role || "Viewer" });
}
