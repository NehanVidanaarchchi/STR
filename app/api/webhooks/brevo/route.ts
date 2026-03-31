// app/api/webhooks/brevo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { brevoWebhookService } from '@/lib/brevo/webhookService';

// Simple in-memory cache to prevent duplicate syncs (for production, use Redis)
const processedEvents = new Map<string, number>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of processedEvents.entries()) {
    if (now - timestamp > 3600000) { // 1 hour
      processedEvents.delete(key);
    }
  }
}, 3600000);

interface CompanyWebhookPayload {
  type: 'company';
  event: 'unclaimed' | 'free' | 'core' | 'premium' | 'churned';
  company_id: string;
  company_name: string;
  status: string;
}

interface UserWebhookPayload {
  type: 'user';
  event: 'signup' | 'churned';
  company_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

type WebhookPayload = CompanyWebhookPayload | UserWebhookPayload;

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();
    const supabase = await createClient();

    // Generate a unique key for deduplication
    const dedupKey = `${payload.type}_${payload.event}_${payload.type === 'company' ? payload.company_id : payload.email}_${Date.now()}`;
    
    // Check for duplicates within the last minute
    const recentEvents = Array.from(processedEvents.entries()).filter(
      ([, timestamp]) => Date.now() - timestamp < 60000
    );
    
    const isDuplicate = recentEvents.some(([key]) => key === dedupKey);
    
    if (isDuplicate) {
      console.log(`Duplicate webhook event detected: ${dedupKey}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Duplicate event ignored' 
      });
    }
    
    // Store the event
    processedEvents.set(dedupKey, Date.now());

    // Log the incoming webhook
    console.log('Brevo webhook received:', JSON.stringify(payload, null, 2));

    // Process based on type
    if (payload.type === 'company') {
      await handleCompanyEvent(payload, supabase);
    } else if (payload.type === 'user') {
      await handleUserEvent(payload, supabase);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
  } catch (error) {
    console.error('Error processing Brevo webhook:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleCompanyEvent(
  payload: CompanyWebhookPayload, 
  supabase: any
) {
  const { event, company_id, company_name, status } = payload;
  
  // Get complete company details
  const { data: company } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      website_url,
      linkedin_url,
      email,
      generic_email,
      country,
      founder,
      primary_type,
      product_summary_short,
      product_summary_long,
      logo_url,
      city,
      founded_year,
      employee_count,
      created_at
    `)
    .eq('id', company_id)
    .single();
  
  if (!company) {
    console.error('Company not found:', company_id);
    return;
  }
  
  // Get all active providers for this company
  const { data: providers, error: providersError } = await supabase
    .from('providers')
    .select(`
      id,
      work_email,
      full_name,
      phone_number,
      claim_status,
      plan_id,
      plan_status,
      role
    `)
    .eq('linked_company_id', company_id)
    .eq('is_active', true);

  if (providersError) {
    console.error('Error fetching company providers:', providersError);
    return;
  }

  // If no providers found, try to get from company_providers table
  let allProviders = providers || [];
  if (allProviders.length === 0) {
    const { data: companyProviders } = await supabase
      .from('company_providers')
      .select(`
        provider_id,
        role,
        providers (
          id,
          work_email,
          full_name,
          phone_number,
          claim_status,
          plan_id,
          plan_status
        )
      `)
      .eq('company_id', company_id);
    
    if (companyProviders) {
      allProviders = companyProviders
        .map((cp: { providers: any; role: string }) => ({
          ...cp.providers,
          role: cp.role
        }))
        .filter((p: { is_active: any; }) => p && p.is_active);
    }
  }

  // Prepare company attributes for Brevo
  const companyAttributes = {
    COMPANY_ID: company.id,
    COMPANY_NAME: company.name,
    COMPANY_STATUS: status,
    COMPANY_TIER: event,
    COMPANY_WEBSITE: company.website_url || '',
    COMPANY_LINKEDIN: company.linkedin_url || '',
    COMPANY_EMAIL: company.email || '',
    COMPANY_GENERIC_EMAIL: company.generic_email || '',
    COMPANY_COUNTRY: company.country || '',
    COMPANY_FOUNDER: company.founder || '',
    COMPANY_TYPE: company.primary_type || '',
    COMPANY_CITY: company.city || '',
    COMPANY_FOUNDED_YEAR: company.founded_year || '',
    COMPANY_EMPLOYEES: company.employee_count || '',
    COMPANY_PRODUCT_SHORT: company.product_summary_short || '',
    COMPANY_PRODUCT_LONG: company.product_summary_long || '',
    COMPANY_CREATED_AT: company.created_at || '',
    COMPANY_PROVIDERS_COUNT: allProviders.length,
    COMPANY_ACTIVE_PROVIDERS: allProviders.filter((p: any) => p.is_active !== false).length,
    LAST_COMPANY_EVENT: event,
    LAST_EVENT_DATE: new Date().toISOString(),
  };

  // For each provider in the company, update their contact in Brevo
  for (const provider of allProviders) {
    try {
      // Merge provider attributes with company attributes
      const userAttributes = {
        FIRSTNAME: provider.full_name?.split(' ')[0] || '',
        LASTNAME: provider.full_name?.split(' ').slice(1).join(' ') || '',
        ROLE: provider.role || 'provider',
        PROVIDER_ID: provider.id,
        PROVIDER_PHONE: provider.phone_number || '',
        PROVIDER_CLAIM_STATUS: provider.claim_status || '',
        PROVIDER_PLAN_ID: provider.plan_id || '',
        PROVIDER_PLAN_STATUS: provider.plan_status || '',
        ...companyAttributes,
      };

      await brevoWebhookService.updateContact({
        email: provider.work_email,
        attributes: userAttributes,
      });

      // Track the company event for automation triggers
      await brevoWebhookService.trackEvent(
        `company_${event}`,
        provider.work_email,
        {
          event_type: event,
          company: {
            id: company.id,
            name: company.name,
            website: company.website_url,
            type: company.primary_type,
            country: company.country,
            status: status,
          },
          provider: {
            id: provider.id,
            name: provider.full_name,
            email: provider.work_email,
            role: provider.role,
          },
          timestamp: new Date().toISOString(),
        }
      );

      console.log(`Company event "${event}" synced for provider ${provider.work_email}`);
    } catch (error) {
      console.error(`Failed to sync company event for provider ${provider.work_email}:`, error);
    }
  }
}

async function handleUserEvent(
  payload: UserWebhookPayload, 
  supabase: any
) {
  const { event, email, first_name, last_name, role, company_id } = payload;

  try {
    // Get complete provider details
    const { data: provider } = await supabase
      .from('providers')
      .select(`
        id,
        full_name,
        work_email,
        phone_number,
        claim_status,
        plan_id,
        plan_status,
        created_at,
        tell_us_about_company,
        company_original_name,
        company_description,
        is_active
      `)
      .eq('work_email', email)
      .single();
    
    // Get company details if company_id is provided
    let companyInfo = null;
    let companyStatus = '';
    let companyDetails = null;
    
    if (company_id) {
      // Get complete company details
      const { data: company } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          website_url,
          linkedin_url,
          email,
          generic_email,
          country,
          founder,
          primary_type,
          product_summary_short,
          product_summary_long,
          logo_url,
          city,
          founded_year,
          employee_count,
          created_at
        `)
        .eq('id', company_id)
        .single();
      
      if (company) {
        companyInfo = company;
        companyDetails = company;
        
        // Calculate company status based on providers
        const { data: providers } = await supabase
          .from('providers')
          .select('claim_status, plan_id, plan_status, is_active')
          .eq('linked_company_id', company_id)
          .eq('is_active', true);
        
        if (providers && providers.length > 0) {
          const hasPremium = providers.some((p: { plan_id: string; plan_status: string; }) => p.plan_id === 'premium' && p.plan_status === 'active');
          const hasCore = providers.some((p: { plan_id: string; plan_status: string; }) => p.plan_id === 'core' && p.plan_status === 'active');
          const hasApproved = providers.some((p: { claim_status: string; }) => p.claim_status === 'approved');
          
          if (hasPremium) companyStatus = 'premium';
          else if (hasCore) companyStatus = 'core';
          else if (hasApproved) companyStatus = 'free';
          else companyStatus = 'unclaimed';
        } else {
          companyStatus = 'churned';
        }
      }
    }

    // Prepare comprehensive user attributes for Brevo
    const userAttributes: Record<string, any> = {
      // Basic user info
      FIRSTNAME: first_name,
      LASTNAME: last_name,
      EMAIL: email,
      
      // Provider details
      PROVIDER_ID: provider?.id || '',
      PROVIDER_FULL_NAME: provider?.full_name || '',
      PROVIDER_PHONE: provider?.phone_number || '',
      PROVIDER_CLAIM_STATUS: provider?.claim_status || '',
      PROVIDER_PLAN_ID: provider?.plan_id || '',
      PROVIDER_PLAN_STATUS: provider?.plan_status || '',
      PROVIDER_CREATED_AT: provider?.created_at || '',
      PROVIDER_ACTIVE: provider?.is_active ? 'Yes' : 'No',
      
      // Role and event
      ROLE: role,
      USER_EVENT: event,
      USER_EVENT_DATE: new Date().toISOString(),
    };

    // Add provider's company description if available
    if (provider?.tell_us_about_company) {
      userAttributes.PROVIDER_COMPANY_DESC = provider.tell_us_about_company;
    }
    
    if (provider?.company_original_name) {
      userAttributes.PROVIDER_ORIGINAL_COMPANY = provider.company_original_name;
    }

    // Add company details if available
    if (companyDetails) {
      userAttributes.COMPANY_ID = companyDetails.id;
      userAttributes.COMPANY_NAME = companyDetails.name;
      userAttributes.COMPANY_STATUS = companyStatus;
      userAttributes.COMPANY_WEBSITE = companyDetails.website_url || '';
      userAttributes.COMPANY_LINKEDIN = companyDetails.linkedin_url || '';
      userAttributes.COMPANY_EMAIL = companyDetails.email || '';
      userAttributes.COMPANY_GENERIC_EMAIL = companyDetails.generic_email || '';
      userAttributes.COMPANY_COUNTRY = companyDetails.country || '';
      userAttributes.COMPANY_FOUNDER = companyDetails.founder || '';
      userAttributes.COMPANY_TYPE = companyDetails.primary_type || '';
      userAttributes.COMPANY_CITY = companyDetails.city || '';
      userAttributes.COMPANY_FOUNDED_YEAR = companyDetails.founded_year || '';
      userAttributes.COMPANY_EMPLOYEES = companyDetails.employee_count || '';
      userAttributes.COMPANY_PRODUCT_SHORT = companyDetails.product_summary_short || '';
      userAttributes.COMPANY_PRODUCT_LONG = companyDetails.product_summary_long || '';
      userAttributes.COMPANY_CREATED_AT = companyDetails.created_at || '';
    }

    // Update contact in Brevo with all details
    await brevoWebhookService.updateContact({
      email,
      attributes: userAttributes,
      listIds: [], // Add list IDs if you have them
    });

    // Track user event with complete data
    await brevoWebhookService.trackEvent(
      `user_${event}`,
      email,
      {
        event_type: event,
        user: {
          id: provider?.id,
          email: email,
          name: `${first_name} ${last_name}`,
          role: role,
          plan_id: provider?.plan_id,
          claim_status: provider?.claim_status,
        },
        company: companyDetails ? {
          id: companyDetails.id,
          name: companyDetails.name,
          website: companyDetails.website_url,
          type: companyDetails.primary_type,
          country: companyDetails.country,
          city: companyDetails.city,
          status: companyStatus,
        } : null,
        timestamp: new Date().toISOString(),
      }
    );

    console.log(`User event "${event}" synced for ${email} with company details`);
  } catch (error) {
    console.error(`Failed to sync user event for ${email}:`, error);
    throw error;
  }
}

function getListIdsForUser(event: string, role: string): number[] {
  // Map events to Brevo list IDs
  // You'll need to create these lists in Brevo first and replace with actual IDs
  const listMap: Record<string, number> = {
    signup: 1,      // Replace with your actual list ID for new signups
    churned: 2,     // Replace with your actual list ID for churned users
    admin: 3,       // Replace with your actual list ID for admins
    provider: 4,    // Replace with your actual list ID for providers
  };

  const lists: number[] = [];

  if (event === 'signup') {
    lists.push(listMap.signup);
  }

  if (role === 'admin') {
    lists.push(listMap.admin);
  } else if (role === 'provider') {
    lists.push(listMap.provider);
  }

  return lists;
}