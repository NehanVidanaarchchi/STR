// lib/brevo/webhookTriggers.ts
interface WebhookTriggerOptions {
  type: 'company' | 'user';
  event: string;
  data: Record<string, any>;
}

export async function triggerBrevoWebhook(options: WebhookTriggerOptions) {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/brevo`;
  
  try {
    const payload = {
      type: options.type,
      event: options.event,
      ...options.data,
      timestamp: new Date().toISOString(),
    };

    console.log(`Triggering Brevo webhook: ${options.type}.${options.event}`, payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webhook failed (${response.status}):`, errorText);
      return false;
    } else {
      console.log(`Webhook triggered successfully for ${options.type}.${options.event}`);
      return true;
    }
  } catch (error) {
    console.error(`Error triggering webhook for ${options.type}.${options.event}:`, error);
    return false;
  }
}

// Specific triggers for common events
export async function triggerCompanyStatusUpdate(
  companyId: string,
  companyName: string,
  status: string,
  event: 'unclaimed' | 'free' | 'core' | 'premium' | 'churned'
) {
  return await triggerBrevoWebhook({
    type: 'company',
    event,
    data: {
      company_id: companyId,
      company_name: companyName,
      status,
    },
  });
}

export async function triggerUserSignup(
  email: string,
  firstName: string,
  lastName: string,
  role: string,
  companyId?: string
) {
  return await triggerBrevoWebhook({
    type: 'user',
    event: 'signup',
    data: {
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      company_id: companyId,
    },
  });
}

export async function triggerUserChurned(
  email: string,
  firstName: string,
  lastName: string,
  role: string,
  companyId?: string
) {
  return await triggerBrevoWebhook({
    type: 'user',
    event: 'churned',
    data: {
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      company_id: companyId,
    },
  });
}