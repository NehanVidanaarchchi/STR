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

    // Fetch provider by email
    const { data: provider, error } = await supabase
      .from('providers')
      .select(`
        id,
        full_name,
        work_email,
        password_hash,
        is_active,
        claim_status
      `)
      .eq('work_email', email)
      .single()

    if (error || !provider) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!provider.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      provider.password_hash
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Store session (simple cookie-based session)
    (await
      // Store session (simple cookie-based session)
      cookies()).set(
      'provider_session',
      JSON.stringify({
        id: provider.id,
        email: provider.work_email,
        name: provider.full_name,
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
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
