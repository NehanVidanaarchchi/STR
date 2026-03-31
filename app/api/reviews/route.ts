import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      company_id,
      overall_rating,
      usability_rating,
      pros,
      cons,
      comments
    } = data;

    // Validation
    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }
    if (typeof overall_rating !== 'number' || overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json({ error: 'overall_rating must be between 1 and 5' }, { status: 400 });
    }
    if (typeof usability_rating !== 'number' || usability_rating < 1 || usability_rating > 5) {
      return NextResponse.json({ error: 'usability_rating must be between 1 and 5' }, { status: 400 });
    }

    // Prepare data
    const reviewData = {
      company_id,
      overall_rating,
      usability_rating,
      pros: Array.isArray(pros) ? pros : [],
      cons: Array.isArray(cons) ? cons : [],
      comments: comments ? String(comments) : null
    };

    const { data: insertedReview, error } = await supabaseAdmin
      .from('reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error inserting review:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: insertedReview }, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/reviews:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const company_id = searchParams.get('company_id');

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }

    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: reviews });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/reviews:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
