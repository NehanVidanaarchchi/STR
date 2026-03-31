import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendReferenceEmail } from '@/lib/email/sendReferenceEmail';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const { data: references, error } = await supabase
      .from('company_references')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ references });
  } catch (error) {
    console.error('Error fetching references:', error);
    return NextResponse.json(
      { error: 'Failed to fetch references' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, segment, customerName, companyName, email, website } = body;

    if (!companyId || !segment || !customerName || !companyName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Insert reference
    const { data: reference, error } = await supabase
      .from('company_references')
      .insert({
        company_id: companyId,
        segment,
        customer_name: customerName,
        company_name: companyName,
        email,
        website: website || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Send verification email
    try {
      await sendReferenceEmail({
        to: email,
        customerName,
        companyName,
        token: reference.confirmation_token,
      });
      console.log('✅ Verification email sent');
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't throw - we still want to return the reference
    }

    return NextResponse.json({ reference });
  } catch (error) {
    console.error('Error creating reference:', error);
    return NextResponse.json(
      { error: 'Failed to create reference' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Reference ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const { error } = await supabase
      .from('company_references')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reference:', error);
    return NextResponse.json(
      { error: 'Failed to delete reference' },
      { status: 500 }
    );
  }
}