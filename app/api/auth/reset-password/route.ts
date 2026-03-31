import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { token, type, password } = await request.json();

    console.log(token,type,password,'passwordpasswordpassword');
    if (!token || !type || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Hash the token to compare with stored hash
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const now = new Date().toISOString();

    if (type === 'provider') {
      // Find valid token for provider
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('provider_id, expires_at')
        .eq('token_hash', tokenHash)
        .gt('expires_at', now)
        .single();

      if (tokenError || !tokenData) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 400 }
        );
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Update provider password
      const { error: updateError } = await supabase
        .from('providers')
        .update({ 
          password_hash: passwordHash,
          salt: salt 
        })
        .eq('id', tokenData.provider_id);

      if (updateError) {
        console.error('Error updating password:', updateError);
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        );
      }

      // Delete used token
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token_hash', tokenHash);

    } else if (type === 'team') {
      // Find valid token for team member
      const { data: tokenData, error: tokenError } = await supabase
        .from('team_member_reset_tokens')
        .select('team_member_id, expires_at')
        .eq('token_hash', tokenHash)
        .gt('expires_at', now)
        .single();

      if (tokenError || !tokenData) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 400 }
        );
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Update team member password
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ 
          password_hash: passwordHash,
          salt: salt 
        })
        .eq('id', tokenData.team_member_id);

      if (updateError) {
        console.error('Error updating password:', updateError);
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        );
      }

      // Delete used token
      await supabase
        .from('team_member_reset_tokens')
        .delete()
        .eq('token_hash', tokenHash);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}