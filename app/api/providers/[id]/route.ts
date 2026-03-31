import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single provider
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: provider, error } = await supabase
      .from('providers')
      .select(`
        *,
        categories:provider_categories(
          category:categories(*)
        ),
        features:provider_features(
          feature:features(*)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: provider
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update provider
export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session = await requireAuth()
    const supabase = await createClient()
    const body = await request.json()

    // Check if user can update this provider
    const { data: existingProvider } = await supabase
      .from('providers')
      .select('claimed_by, claim_status')
      .eq('id', id)
      .single()

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Only allow updates if:
    // 1. User is admin
    // 2. User is the one who claimed this provider
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAdmin = user?.role === 'admin'
    const isOwner = existingProvider.claimed_by === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized to update this provider' },
        { status: 403 }
      )
    }

    const { data: provider, error } = await supabase
      .from('providers')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: provider,
      message: 'Provider updated successfully'
    })
  } catch (error: any) {
    if (error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Allow only these fields to be updated
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.full_name !== undefined) updateData.full_name = String(body.full_name).trim();
    if (body.work_email !== undefined) updateData.work_email = String(body.work_email).trim();
    if (body.phone_number !== undefined) updateData.phone_number = String(body.phone_number).trim();
    if (body.company_name !== undefined) updateData.company_name = String(body.company_name).trim();
    if (body.tell_us_about_company !== undefined)
      updateData.tell_us_about_company = String(body.tell_us_about_company).trim() || null;

    if (body.claim_status !== undefined) updateData.claim_status = String(body.claim_status).trim();
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);

    // (Optional) if you want to allow linking to existing company
    if (body.linked_company_id !== undefined) updateData.linked_company_id = body.linked_company_id || null;

    // Basic validation
    if (updateData.work_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.work_email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("providers")
      .update(updateData)
      .eq("id", id)
      .select(
        "id, full_name, work_email, phone_number, company_name, claim_status, created_at, tell_us_about_company, is_active"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("PATCH /providers/[id] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // First, check if provider exists
    const { data: provider, error: fetchError } = await supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Start a transaction by deleting related records first
    // Delete provider login tokens
    const { error: tokensError } = await supabase
      .from('provider_login_tokens')
      .delete()
      .eq('provider_id', id);

    if (tokensError) {
      console.error('Error deleting provider tokens:', tokensError);
    }


    // Finally, delete the provider
    const { error: deleteError } = await supabase
      .from('providers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Provider deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}