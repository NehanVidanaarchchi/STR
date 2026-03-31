import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';
import {
  adminNewProviderTemplate,
  providerMagicLoginTemplate,
} from '@/lib/emailTemplates';
import { generateLoginToken } from '@/lib/tokens';
import { adminNewCompanyTemplate } from '@/lib/email/adminNewCompany';
import { existingCompanyNewClaimTemplate } from '@/lib/email/existingCompanyNewClaimTemplate';
import { triggerBrevoWebhook } from '@/lib/brevo/webhookTriggers';

const { token, tokenHash } = generateLoginToken();
const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/magic-login?token=${token}`;

// =====================
// GET - List providers
// =====================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    let query = supabase
      .from('providers')
      .select(`
        id,
        full_name,
        work_email,
        company_name,
        phone_number,
        tell_us_about_company,
        is_active,
        claim_status,
        created_at,
        plan_id
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const search = searchParams.get('search');
    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,full_name.ilike.%${search}%`
      );
    }

    const { data, error } = await supabase
      .from('provider_full_details')
      .select('*')
      .order('created_at', { ascending: false });


    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================
// POST - Provider Signup
// =====================
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      full_name,
      work_email,
      company_id,
      company_name,
      phone_number,
      password,
      tell_us_about_company,
      is_new_company,
    } = body;

    // -------- Validation --------
    if (!full_name || !work_email || !phone_number || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(work_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // -------- Check existing provider --------
    const { data: existing } = await supabase
      .from('providers')
      .select('id')
      .eq('work_email', work_email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Provider with this email already exists' },
        { status: 409 }
      );
    }

    // -------- Hash password --------
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const isNewCompany = is_new_company || !company_id;

    const claimStatus = isNewCompany ? 'pending' : 'approved';

    let companyPrimaryType = '';
    let companyFullName = company_name; // Start with form company_name
    let companyDescription = '';

    if (company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('primary_type, name, product_summary_long, product_summary_short')
        .eq('id', company_id)
        .single();

      if (companyData) {
        companyPrimaryType = companyData.primary_type || '';
        companyFullName = companyData.name || company_name;
        companyDescription = companyData.product_summary_long || companyData.product_summary_short || '';
      }
    }

    // -------- Insert provider --------
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .insert({
        full_name,
        work_email,
        company_name: companyFullName,
        phone_number,
        password_hash,
        salt,
        tell_us_about_company: tell_us_about_company || '',
        is_active: true,
        claim_status: claimStatus,

        linked_company_id: isNewCompany ? null : company_id,

        // NEW COMPANY DATA (IMPORTANT)
        company_original_name: isNewCompany ? company_name : null,
        company_description: isNewCompany ? tell_us_about_company : null,
      })
      .select()
      .single();

    if (providerError) {
      console.error('PROVIDER INSERT ERROR:', providerError);
      return NextResponse.json(
        {
          error: 'Failed to create provider',
          details: providerError.message,
          code: providerError.code,
        },
        { status: 500 }
      );
    }

    // -------- Assign existing company --------
    try {
      const { error: linkError } = await supabase
        .from('company_providers')
        .insert({
          provider_id: provider.id,
          company_id,
          role: 'owner',
        });

      // if (linkError) {
      //   console.warn('Failed to link provider to company:', linkError);
      // }
    } catch (err) {
      console.warn('Unexpected error linking provider to company:', err);
    }

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await supabase.from('provider_login_tokens').insert({
      provider_id: provider.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });
    const { data: admins, error: adminsErr } = await supabase
      .from("admins")
      .select("email")
      .eq("is_active", true);

    if (adminsErr) console.warn("Failed to load admins:", adminsErr);

    const adminEmails = (admins || []).map((a) => a.email).filter(Boolean);
    if (isNewCompany && adminEmails.length > 0) {
      await sendEmail({
        to: adminEmails,
        subject: 'New Company Request (Provider Claim)',
        html: adminNewCompanyTemplate({
          fullName: provider.full_name,
          email: provider.work_email,
          phoneNumber: provider.phone_number,
          companyOriginalName: provider.company_original_name,
          companyDescription: provider.company_description,
          providerId: provider.id,
        }), // or create a new template for new company request
      });
    }

    console.log(isNewCompany, 'isNewCompanyisNewCompany');
    console.log(company_id, 'company_icompany_idd');
    console.log(companyFullName, 'companyFullNamecompanyFullName');

if (!isNewCompany) {
  try {
    // Fetch complete company details
    const { data: companyDetails } = await supabase
      .from('companies')
      .select(`
        name,
        website_url,
        linkedin_url,
        generic_email,
        country,
        founder,
        primary_type,
        product_summary_short,
        city,
        founded_year,
        employee_count
      `)
      .eq('id', company_id)
      .single();

    const { data: existingProviders, error: exErr } = await supabase
      .from("providers")
      .select("work_email")
      .neq("id", provider.id)
      .eq("is_active", true);

    if (exErr) {
      console.warn("Failed to load existing providers:", exErr);
    }

    const emails = (existingProviders || [])
      .map((p: any) => p.work_email)
      .filter(Boolean);
       if (emails.length > 0) {
      const emailResult = await sendEmail({
        to: emails.join(','),
        subject: `New User Attempting to Join ${companyFullName}`,
        html: existingCompanyNewClaimTemplate({
          companyName: companyFullName,
          fullName: full_name,
          email: work_email,
          companyDetails: companyDetails ? {
            website: companyDetails.website_url,
            linkedin: companyDetails.linkedin_url,
            genericEmail: companyDetails.generic_email,
            country: companyDetails.country,
            founder: companyDetails.founder,
            primaryType: companyDetails.primary_type,
            productSummary: companyDetails.product_summary_short,
            city: companyDetails.city,
            foundedYear: companyDetails.founded_year,
            employeeCount: companyDetails.employee_count,
          } : undefined,
        }),
      });
      console.log("Email sent to existing providers with company details");
    }
  } catch (err) {
    console.warn("Failed to notify existing company providers:", err);
  }
    }
    // -------- Send Emails (non-blocking) --------
    try {
      const { data: admins } = await supabase
        .from('users')
        .select('email')
        .eq('role', 'admin');

      if (admins?.length) {
        await sendEmail({
          to: admins.map(a => a.email),
          subject: 'New Provider Signup',
          html: adminNewProviderTemplate(provider),
        });
      }

      await sendEmail({
        to: provider.work_email,
        subject: 'Log in to your STR Marketplace account',
        html: providerMagicLoginTemplate({
          fullName: provider.full_name,
          loginLink,
        }),
      });
    } catch (emailErr) {
      console.warn('Email sending failed:', emailErr);
    }

await triggerBrevoWebhook({
  type: 'user',
  event: 'signup',
  data: {
    email: provider.work_email,
    first_name: provider.full_name.split(' ')[0],
    last_name: provider.full_name.split(' ').slice(1).join(' ') || '',
    role: 'provider',
    company_id: provider.linked_company_id,
  }
});

// If this is a new company, trigger company unclaimed event
if (isNewCompany) {
  await triggerBrevoWebhook({
    type: 'company',
    event: 'unclaimed',
    data: {
      company_id: provider.id,
      company_name: provider.company_name,
      status: 'unclaimed',
    }
  });
}

    return NextResponse.json(
      {
        success: true,
        message:
          'Provider claim submitted successfully. Please check your email.',
        data: {
          provider_id: provider.id,
          company_id,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
