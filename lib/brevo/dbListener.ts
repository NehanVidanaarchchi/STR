// lib/brevo/dbListener.ts (simplified)
import { createClient } from '@/lib/supabase/server';
import { triggerBrevoWebhook } from './webhookTriggers';

let listener: any = null;

export async function startDatabaseListener() {
  if (listener) return;

  const supabase = await createClient();
  
  // Listen for plan changes (these might happen via Stripe webhooks)
  const planChangeChannel = supabase
    .channel('plan-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'providers',
        filter: 'plan_id=neq.old_plan_id',
      },
      async (payload) => {
        console.log('Plan change detected via DB listener:', payload);
        
        // Only trigger if this wasn't already handled by the API
        if (payload.new.linked_company_id) {
          await triggerCompanyWebhook(payload.new.linked_company_id, supabase);
        }
      }
    )
    .subscribe();

  // Listen for claim status changes (these might happen via admin approval)
  const claimStatusChannel = supabase
    .channel('claim-status-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'providers',
        filter: 'claim_status=neq.old_claim_status',
      },
      async (payload) => {
        console.log('Claim status change detected via DB listener:', payload);
        
        if (payload.new.claim_status === 'approved' && payload.new.linked_company_id) {
          await triggerCompanyWebhook(payload.new.linked_company_id, supabase);
        }
      }
    )
    .subscribe();

  listener = { planChangeChannel, claimStatusChannel };
  console.log('Database listeners started for Brevo webhooks');
}

async function triggerCompanyWebhook(companyId: string, supabase: any) {
  try {
    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    
    if (!company) return;
    
    // Get all active providers for this company
    const { data: providers } = await supabase
      .from('providers')
      .select('claim_status, plan_id, plan_status, is_active')
      .eq('linked_company_id', companyId)
      .eq('is_active', true);
    
    let status = 'churned';
    let event = 'churned';
    
    if (providers && providers.length > 0) {
      const hasApproved = providers.some((p: { claim_status: string; }) => p.claim_status === 'approved');
      const hasPremium = providers.some((p: { plan_id: string; plan_status: string; }) => p.plan_id === 'premium' && p.plan_status === 'active');
      const hasCore = providers.some((p: { plan_id: string; plan_status: string; }) => p.plan_id === 'core' && p.plan_status === 'active');
      
      if (hasPremium) {
        status = 'premium';
        event = 'premium';
      } else if (hasCore) {
        status = 'core';
        event = 'core';
      } else if (hasApproved) {
        status = 'free';
        event = 'free';
      } else {
        status = 'unclaimed';
        event = 'unclaimed';
      }
    }
    
    await triggerBrevoWebhook({
      type: 'company',
      event,
      data: {
        company_id: company.id,
        company_name: company.name,
        status,
      },
    });
  } catch (error) {
    console.error(`Error triggering company webhook for ${companyId}:`, error);
  }
}

export async function stopDatabaseListener() {
  if (listener) {
    if (listener.planChangeChannel) await listener.planChangeChannel.unsubscribe();
    if (listener.claimStatusChannel) await listener.claimStatusChannel.unsubscribe();
    listener = null;
    console.log('Database listeners stopped');
  }
}