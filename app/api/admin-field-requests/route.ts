import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // First, get all field requests
    const { data: requests, error } = await supabase
      .from('form_field_requests')
      .select(`
        *,
        feature_category:feature_category_id (
          id,
          name,
          kind
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Then, fetch provider data for requests that have provider_id
    const requestsWithProviders = await Promise.all(
      (requests || []).map(async (request) => {
        if (!request.provider_id) {
          return { ...request, provider: null };
        }

        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id, full_name, work_email, company_name')
          .eq('id', request.provider_id)
          .single();

        if (providerError) {
          console.error('Error fetching provider:', providerError);
          return { ...request, provider: null };
        }

        return {
          ...request,
          provider
        };
      })
    );

    return NextResponse.json({ requests: requestsWithProviders });
  } catch (error) {
    console.error('Error fetching field requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch field requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const { provider_id, field_name, field_description, contact_email, feature_category_id } = body;

    if (!field_name || !field_description || !contact_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: request_data, error } = await supabase
      .from('form_field_requests')
      .insert({
        provider_id,
        field_name,
        field_description,
        contact_email,
        feature_category_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ request: request_data });
  } catch (error) {
    console.error('Error creating field request:', error);
    return NextResponse.json(
      { error: 'Failed to create field request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('form_field_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ request: data });
  } catch (error) {
    console.error('Error updating field request:', error);
    return NextResponse.json(
      { error: 'Failed to update field request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('form_field_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting field request:', error);
    return NextResponse.json(
      { error: 'Failed to delete field request' },
      { status: 500 }
    );
  }
}