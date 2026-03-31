// /api/auth/set-password/route.ts - UPDATE THIS (CURRENT FILE)
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { token, password } = await req.json();
  const supabase = await createClient();

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find valid token
  const { data: record, error: tokenError } = await supabase
    .from('password_setup_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('used', false)
    .single();

  if (tokenError || !record) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
  }

  // Hash the new password
  const password_hash = await bcrypt.hash(password, 10);

  // Check if email exists in team_members table
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id, provider_id')
    .eq('email', record.email)
    .single();

  if (teamMember) {
    // This is a team member - update their password in team_members table
    const { error: teamError } = await supabase
      .from('team_members')
      .update({
        password_hash: password_hash,
        status: 'active',
      })
      .eq('id', teamMember.id);

    if (teamError) {
      console.error('Error updating team member password:', teamError);
      return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
    }

    // Mark token as used
    await supabase
      .from('password_setup_tokens')
      .update({ used: true })
      .eq('id', record.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Password set successfully. You can now login with your team member credentials.',
      user_type: 'team_member'
    });
  }

  // If not a team member, check if it's a provider
  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('work_email', record.email)
    .single();

  if (provider) {
    // This is a provider - update their password in providers table
    const { error: providerError } = await supabase
      .from('providers')
      .update({
        password_hash,
        is_active: true,
      })
      .eq('id', provider.id);

    if (providerError) {
      console.error('Error updating provider password:', providerError);
      return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
    }

    // Mark token as used
    await supabase
      .from('password_setup_tokens')
      .update({ used: true })
      .eq('id', record.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Password set successfully. You can now login with your provider credentials.',
      user_type: 'provider'
    });
  }

  // Email not found in either table
  return NextResponse.json({ error: 'User not found' }, { status: 404 });
}