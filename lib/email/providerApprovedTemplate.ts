export const providerApprovedTemplate = ({
  fullName,
  loginLink,
  companyName,
}: {
  fullName: string;
  loginLink: string;
  companyName?: string;
}) => {
  const safeName = fullName || "there";

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
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">✅ Provider Claim Approved</h1>
        <p style="margin: 8px 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">Your profile has been verified</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px;">
        <!-- Success Banner -->
        <div style="background-color: #e3fbe3; border-left: 4px solid #2b6cb0; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="margin: 0; color: #1a202c; font-weight: 500;">
            Your provider profile has been approved${companyName ? ` for <strong>${companyName}</strong>` : ""}.
          </p>
        </div>

        <!-- Message -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <p style="margin: 0 0 16px; color: #1a202c; font-size: 16px; line-height: 1.6;">
            Hi ${safeName},
          </p>
          <p style="margin: 0 0 24px; color: #1a202c; font-size: 16px; line-height: 1.6;">
            You can now log in and continue setting up your profile.
          </p>
          
          <!-- Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginLink}"
               style="display: inline-block; background-color: #2b6cb0; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(43, 108, 176, 0.2);">
              Log in to STR Marketplace
            </a>
          </div>

          <!-- Fallback Link -->
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-top: 24px;">
            <p style="margin: 0 0 8px; color: #4a5568; font-size: 14px; font-weight: 500;">
              Button not working? Copy and paste this link:
            </p>
            <p style="margin: 0; color: #2b6cb0; font-size: 14px; word-break: break-all;">
              ${loginLink}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 8px; color: #718096; font-size: 13px;">
            STR Marketplace Team
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