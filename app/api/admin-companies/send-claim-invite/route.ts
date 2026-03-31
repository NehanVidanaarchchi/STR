import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendClaimInviteEmail } from '@/lib/email/sendClaimInviteEmail';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, email } = body;

    if (!companyId || !email) {
      return NextResponse.json(
        { error: 'Company ID and email are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, website_url, primary_type')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Company fetch error:', companyError);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check if company already has a provider (claimed)
    const { data: existingProviders, error: providerCheckError } = await supabase
      .from('company_providers')
      .select('provider_id')
      .eq('company_id', companyId);

    if (providerCheckError) {
      console.error('Error checking existing providers:', providerCheckError);
    }

    if (existingProviders && existingProviders.length > 0) {
      return NextResponse.json(
        { error: 'This company already has a provider and cannot be invited' },
        { status: 400 }
      );
    }

    // Generate a simple invite link (you can create a proper claim page later)
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/provider/signup?company=${companyId}&email=${encodeURIComponent(email)}`;

    try {
      // Send the email
      await sendClaimInviteEmail({
        to: email,
        companyName: company.name,
        claimLink: inviteLink, // This now goes to signup page with company pre-filled
      });
      
      console.log(`✅ Claim invite email sent to ${email} for company ${company.name}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      return NextResponse.json({ 
        success: true, 
        message: 'Invite status updated but email failed to send',
        warning: 'Email delivery failed',
        ...(process.env.NODE_ENV === 'development' && { inviteLink })
      });
    }

    // Update company invite status
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        invite_status: 'invited',
        last_invited_email: email,
        invite_sent_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error updating company invite status:', updateError);
      // Don't return error since email was sent
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invite sent successfully',
      ...(process.env.NODE_ENV === 'development' && { inviteLink })
    });

  } catch (error) {
    console.error('Error sending claim invite:', error);
    return NextResponse.json(
      { error: 'Failed to send claim invite' },
      { status: 500 }
    );
  }
}