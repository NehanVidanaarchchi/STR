// lib/email/existingCompanyNewClaimTemplate.ts

export const existingCompanyNewClaimTemplate = ({
  companyName,
  fullName,
  email,
  companyDetails, // Add this to receive full company details
}: {
  companyName: string;
  fullName: string;
  email: string;
  companyDetails?: {
    website?: string;
    linkedin?: string;
    genericEmail?: string;
    country?: string;
    founder?: string;
    primaryType?: string;
    productSummary?: string;
    city?: string;
    foundedYear?: number;
    employeeCount?: number;
  };
}) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Provider Claim - ${companyName}</title>
  </head>
  <body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="background-color: #2b6cb0; padding: 24px 32px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Provider Claim</h1>
        <p style="margin: 8px 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">Someone wants to join ${companyName}</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px;">
        
        <!-- Alert Banner -->
        <div style="background-color: #e3fbe3; border-left: 4px solid #2b6cb0; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="margin: 0; color: #1a202c; font-weight: 500;">
            🚀 New provider registration request for <strong>${companyName}</strong>
          </p>
        </div>

        <!-- Provider Details -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px; color: #2b6cb0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
            👤 Provider Information
          </h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; width: 140px; font-weight: 500;">Name:</td>
              <td style="padding: 8px 0; color: #1a202c;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Email:</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${email}" style="color: #2b6cb0; text-decoration: none;">${email}</a>
              </td>
            </tr>
          </table>
        </div>

        <!-- Company Details -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px; color: #2b6cb0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
            🏢 Company Information
          </h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; width: 140px; font-weight: 500;">Company Name:</td>
              <td style="padding: 8px 0; color: #1a202c;">${companyName}</td>
            </tr>
            ${companyDetails?.website ? `
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Website:</td>
              <td style="padding: 8px 0;">
                <a href="${companyDetails.website}" style="color: #2b6cb0; text-decoration: none;">${companyDetails.website}</a>
              </td>
            </tr>
            ` : ''}
            ${companyDetails?.linkedin ? `
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">LinkedIn:</td>
              <td style="padding: 8px 0;">
                <a href="${companyDetails.linkedin}" style="color: #2b6cb0; text-decoration: none;">${companyDetails.linkedin}</a>
              </td>
            </tr>
            ` : ''}
            ${companyDetails?.genericEmail ? `
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Generic Email:</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${companyDetails.genericEmail}" style="color: #2b6cb0; text-decoration: none;">${companyDetails.genericEmail}</a>
              </td>
            </tr>
            ` : ''}
            ${companyDetails?.country ? `
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Country:</td>
              <td style="padding: 8px 0; color: #1a202c;">${companyDetails.country}</td>
            </tr>
            ` : ''}
            ${companyDetails?.city ? `
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">City:</td>
              <td style="padding: 8px 0; color: #1a202c;">${companyDetails.city}</td>
            </tr>
            ` : ''}
            ${companyDetails?.founder ? `
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Founder:</td>
              <td style="padding: 8px 0; color: #1a202c;">${companyDetails.founder}</td>
            </tr>
            ` : ''}
            ${companyDetails?.primaryType ? `
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Company Type:</td>
              <td style="padding: 8px 0; color: #1a202c;">${companyDetails.primaryType}</td>
            </tr>
            ` : ''}
            ${companyDetails?.foundedYear ? `
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Founded Year:</td>
              <td style="padding: 8px 0; color: #1a202c;">${companyDetails.foundedYear}</td>
            </tr>
            ` : ''}
            ${companyDetails?.employeeCount ? `
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-weight: 500;">Employees:</td>
              <td style="padding: 8px 0; color: #1a202c;">${companyDetails.employeeCount}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Product Summary -->
        ${companyDetails?.productSummary ? `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px; color: #2b6cb0; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
            📦 Product Information
          </h2>
          <p style="margin: 0; color: #4a5568; line-height: 1.6;">${companyDetails.productSummary}</p>
        </div>
        ` : ''}

        <!-- Instructions -->
        <div style="background-color: #fff3e0; border-left: 4px solid #ed8936; padding: 16px; border-radius: 4px;">
          <p style="margin: 0 0 8px; color: #1a202c; font-weight: 500;">📋 Next Steps:</p>
          <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
            <li>Review the provider and company information above</li>
            <li>If everything looks correct, no action is needed</li>
            <li>If you have questions, contact support</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 8px; color: #718096; font-size: 13px;">
            STR Marketplace Team
          </p>
          <p style="margin: 0; color: #a0aec0; font-size: 12px;">
            This is an automated notification from STR Marketplace
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};