type AdminNewCompanyTemplateArgs = {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  companyOriginalName?: string | null;
  companyDescription?: string | null;
  providerId?: string | null;
};

export const adminNewCompanyTemplate = ({
  fullName,
  email,
  phoneNumber,
  companyOriginalName,
  companyDescription,
  providerId,
}: AdminNewCompanyTemplateArgs) => {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/providers`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="background-color: #2b6cb0; padding: 24px 32px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Company Claim Request</h1>
        <p style="margin: 8px 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">Action required: Review provider submission</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px;">
        <!-- Alert Banner -->
        <div style="background-color: #e3fbe3; border-left: 4px solid #2b6cb0; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="margin: 0; color: #1a202c; font-weight: 500;">
            A provider has submitted a new company claim request and is waiting for your approval.
          </p>
        </div>

        <!-- Provider Details -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px; color: #2b6cb0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
            Provider Information
          </h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; width: 140px; font-weight: 500;">Full Name:</td>
              <td style="padding: 8px 0; color: #1a202c;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Email:</td>
              <td style="padding: 8px 0; color: #1a202c;">
                <a href="mailto:${email}" style="color: #2b6cb0; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Phone:</td>
              <td style="padding: 8px 0; color: #1a202c;">${phoneNumber || '<span style="color: #a0aec0;">Not provided</span>'}</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #e2e8f0;">
            <h3 style="margin: 0 0 12px; color: #2b6cb0; font-size: 16px; font-weight: 600;">Company Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #4a5568; width: 140px; font-weight: 500;">Company Name:</td>
                <td style="padding: 8px 0; color: #1a202c; font-weight: 500;">${companyOriginalName || '<span style="color: #a0aec0;">Not provided</span>'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #4a5568; font-weight: 500; vertical-align: top;">Description:</td>
                <td style="padding: 8px 0; color: #1a202c;">${companyDescription ? companyDescription.replace(/\n/g, '<br>') : '<span style="color: #a0aec0;">Not provided</span>'}</td>
              </tr>
            </table>
          </div>

          ${providerId ? `
          <div style="margin-top: 16px; background-color: #ebf8ff; border-radius: 6px; padding: 12px;">
            <p style="margin: 0; color: #2b6cb0; font-size: 14px;">
              <strong style="font-weight: 600;">Provider ID:</strong> ${providerId}
            </p>
          </div>
          ` : ''}
        </div>


        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 8px; color: #718096; font-size: 13px;">
            STR Marketplace Admin Notification
          </p>
          <p style="margin: 0; color: #a0aec0; font-size: 12px;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};