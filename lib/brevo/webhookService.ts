import axios from 'axios';

interface BrevoContactData {
  email: string;
  attributes?: Record<string, any>;
  listIds?: number[];
  updateEnabled?: boolean;
}

interface BrevoWebhookPayload {
  email: string;
  event: string;
  data: Record<string, any>;
}

class BrevoWebhookService {
  private apiKey: string;
  private baseUrl = 'https://api.brevo.com/v3';

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('BREVO_API_KEY not set in environment variables');
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        data,
      });
      return response.data;
    } catch (error) {
      console.error(`Brevo API error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Create or update a contact in Brevo
   */
  async updateContact(contactData: BrevoContactData) {
    if (!this.apiKey) {
      console.warn('Skipping Brevo contact update - no API key');
      return null;
    }

    try {
      const payload = {
        email: contactData.email,
        attributes: contactData.attributes || {},
        listIds: contactData.listIds || [],
        updateEnabled: true,
      };

      const result = await this.makeRequest('/contacts', 'POST', payload);
      console.log(`Brevo contact updated for ${contactData.email}:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to update Brevo contact ${contactData.email}:`, error);
      throw error;
    }
  }

  /**
   * Send a transactional email via Brevo
   */
  async sendTransactionalEmail(params: {
    to: { email: string; name?: string }[];
    templateId: number;
    params?: Record<string, any>;
    subject?: string;
    htmlContent?: string;
  }) {
    if (!this.apiKey) {
      console.warn('Skipping Brevo email send - no API key');
      return null;
    }

    try {
      const payload = {
        to: params.to,
        templateId: params.templateId,
        params: params.params || {},
        subject: params.subject,
        htmlContent: params.htmlContent,
      };

      const result = await this.makeRequest('/smtp/email', 'POST', payload);
      console.log(`Transactional email sent via Brevo:`, result);
      return result;
    } catch (error) {
      console.error('Failed to send transactional email:', error);
      throw error;
    }
  }

  /**
   * Track an event in Brevo (for automation triggers)
   */
  async trackEvent(eventName: string, email: string, eventData: Record<string, any>) {
    if (!this.apiKey) {
      console.warn('Skipping Brevo event tracking - no API key');
      return null;
    }

    try {
      const payload = {
        email,
        event: eventName,
        data: eventData,
      };

      const result = await this.makeRequest('/events', 'POST', payload);
      console.log(`Event "${eventName}" tracked for ${email}:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to track event "${eventName}" for ${email}:`, error);
      throw error;
    }
  }
}

export const brevoWebhookService = new BrevoWebhookService();