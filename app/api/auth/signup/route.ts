// import { NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase/server'

// export async function POST(request: Request) {
//   try {
//     const supabase = await createClient()
//     const { email, password, full_name, role = 'operator' } = await request.json()

//     // Validate input
//     if (!email || !password) {
//       return NextResponse.json(
//         { error: 'Email and password are required' },
//         { status: 400 }
//       )
//     }

//     // Create auth user
//     const { data: authData, error: authError } = await supabase.auth.signUp({
//       email,
//       password,
//     })

//     if (authError) {
//       return NextResponse.json(
//         { error: authError.message },
//         { status: 400 }
//       )
//     }

//     if (!authData.user) {
//       return NextResponse.json(
//         { error: 'User creation failed' },
//         { status: 500 }
//       )
//     }

//     // Create profile in users table
//     const { error: profileError } = await supabase
//       .from('users')
//       .insert({
//         id: authData.user.id,
//         email,
//         full_name,
//         role,
//       })

//     if (profileError) {
//       // Rollback auth user if profile creation fails
//       await supabase.auth.admin.deleteUser(authData.user.id)
//       return NextResponse.json(
//         { error: 'Profile creation failed' },
//         { status: 500 }
//       )
//     }

//     return NextResponse.json({
//       success: true,
//       user: {
//         id: authData.user.id,
//         email: authData.user.email,
//         full_name,
//         role,
//       },
//       message: 'User created successfully. Please check your email for verification.'
//     })
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const serviceRoleClient = createServiceRoleClient()
    
    const { email, password, full_name, role = 'operator' } = await request.json()

    console.log('Signup attempt for:', { email, role })

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['operator', 'provider', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be operator, provider, or admin' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { 
          error: authError.message,
          details: 'Failed to create authentication user'
        },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error('No user returned from signup')
      return NextResponse.json(
        { error: 'User creation failed - no user object returned' },
        { status: 500 }
      )
    }

    console.log('Auth user created:', authData.user.id)

    // Create profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name: full_name || email.split('@')[0],
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // Try to get more details about the error
      if (profileError.code === '23505') {
        return NextResponse.json(
          { error: 'User already exists with this email' },
          { status: 400 }
        )
      }
      
      if (profileError.code === '42501') {
        return NextResponse.json(
          { error: 'Permission denied. Check RLS policies.' },
          { status: 403 }
        )
      }

      // Attempt to delete auth user using service role
      try {
        await serviceRoleClient.auth.admin.deleteUser(authData.user.id)
        console.log('Rolled back auth user due to profile creation failure')
      } catch (deleteError) {
        console.error('Failed to rollback auth user:', deleteError)
      }

      return NextResponse.json(
        { 
          error: 'Profile creation failed',
          details: profileError.message,
          hint: profileError.hint,
          code: profileError.code
        },
        { status: 500 }
      )
    }

    console.log('User profile created successfully')

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: full_name || email.split('@')[0],
        role,
      },
      message: 'User created successfully. Please check your email for verification.'
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Unexpected error in signup:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}