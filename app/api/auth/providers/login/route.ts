// /api/auth/providers/login/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch team member (provider) by email
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .select(`
        id,
        full_name,
        email,
        role,
        password_hash,
        status,
        provider_id
      `)
      .eq('email', email)
      .eq('role', 'Admin') // Assuming providers are Admins
      .single()

    if (error || !teamMember) {
      console.error('Login error - team member not found:', error);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (teamMember.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active. Please check your email for activation.' },
        { status: 403 }
      )
    }

    // Verify password
    if (!teamMember.password_hash) {
      return NextResponse.json(
        { error: 'Password not set. Please use the setup link sent to your email.' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(
      password,
      teamMember.password_hash
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Store session
    const cookieStore = await cookies();
    cookieStore.set(
      'provider_session',
      JSON.stringify({
        id: teamMember.id, // Using team_member.id as provider ID
        email: teamMember.email,
        name: teamMember.full_name,
        role: teamMember.role,
        provider_id: teamMember.provider_id,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: teamMember.id,
        email: teamMember.email,
        name: teamMember.full_name,
        role: teamMember.role,
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}