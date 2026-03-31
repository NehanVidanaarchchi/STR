import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPasswordResetEmail } from '@/lib/email/sendPasswordResetEmail';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user exists in providers table
    const { data: provider } = await supabase
      .from('providers')
      .select('id, full_name, work_email')
      .eq('work_email', email)
      .maybeSingle();

    // Check if user exists in team_members table
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id, full_name, email')
      .eq('email', email)
      .maybeSingle();

    // If no user found, still return success (security best practice)
    if (!provider && !teamMember) {
      console.log('Password reset requested for non-existent email:', email);
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists, a reset email will be sent' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Store reset token based on user type
    if (provider) {
      // Delete any existing tokens for this provider
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('provider_id', provider.id);

      // Insert new token
      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .insert({
          provider_id: provider.id,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) {
        console.error('Error storing reset token:', tokenError);
        return NextResponse.json(
          { error: 'Failed to generate reset link' },
          { status: 500 }
        );
      }

      // Send email
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}&type=provider`;
      
      await sendPasswordResetEmail({
        to: provider.work_email,
        name: provider.full_name,
        resetLink,
      });
    }

    if (teamMember) {
      // Delete any existing tokens for this team member
      await supabase
        .from('team_member_reset_tokens')
        .delete()
        .eq('team_member_id', teamMember.id);

      // Insert new token
      const { error: tokenError } = await supabase
        .from('team_member_reset_tokens')
        .insert({
          team_member_id: teamMember.id,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) {
        console.error('Error storing reset token:', tokenError);
        return NextResponse.json(
          { error: 'Failed to generate reset link' },
          { status: 500 }
        );
      }

      // Send email
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}&type=team`;
      
      await sendPasswordResetEmail({
        to: teamMember.email,
        name: teamMember.full_name,
        resetLink,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'If an account exists, a reset email will be sent' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}