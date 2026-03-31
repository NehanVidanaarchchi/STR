import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('onboarding_steps')
      .select('*')
      .eq('provider_id', providerId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create new record
      const { data: newData, error: insertError } = await supabase
        .from('onboarding_steps')
        .insert([{ provider_id: providerId }])
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        steps: {
          company_profile_completed: newData.company_profile_completed,
          product_info_completed: newData.product_info_completed,
          integrations_completed: newData.integrations_completed,
          commercial_info_completed: newData.commercial_info_completed
        }
      });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      steps: {
        company_profile_completed: data.company_profile_completed,
        product_info_completed: data.product_info_completed,
        integrations_completed: data.integrations_completed,
        commercial_info_completed: data.commercial_info_completed
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { providerId, stepKey, completed } = await request.json();

    if (!providerId || !stepKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    const updateData = {
      [stepKey]: completed,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('onboarding_steps')
      .update(updateData)
      .eq('provider_id', providerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}