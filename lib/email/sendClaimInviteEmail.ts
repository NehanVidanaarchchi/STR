import nodemailer from "nodemailer";

// Reuse the same transporter from your existing email
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  debug: true,
  logger: true
});

export async function sendClaimInviteEmail({
  to,
  companyName,
  claimLink,
}: {
  to: string;
  companyName: string;
  claimLink: string;
}) {
  try {
    console.log('📧 Preparing to send claim invite email to:', to);
    console.log('🔗 Claim URL:', claimLink);
    
    // Verify connection configuration
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `Claim ${companyName} on STR Market Map`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            
            <!-- Header -->
            <div style="background-color: #2b6cb0; padding: 32px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Claim Your Company Profile</h1>
              <p style="margin: 8px 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">Join STR Market Map today</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
              <!-- Greeting -->
              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 16px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                  Hello,
                </p>
                <p style="margin: 0 0 16px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                  We've created a profile for <strong style="color: #2b6cb0;">${companyName}</strong> on STR Market Map, 
                  the leading marketplace for hospitality technology solutions.
                </p>
                <p style="margin: 0 0 24px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                  To claim this profile and manage your company's presence, please click the button below:
                </p>
              </div>

              <!-- Benefits Section -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px; color: #2b6cb0; font-size: 18px; font-weight: 600;">By claiming your profile, you'll be able to:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 12px; color: #1a202c;">✅ Update your company information and products</li>
                  <li style="margin-bottom: 12px; color: #1a202c;">✅ Add customer references and case studies</li>
                  <li style="margin-bottom: 12px; color: #1a202c;">✅ Respond to leads and inquiries</li>
                  <li style="margin-bottom: 12px; color: #1a202c;">✅ Access analytics and visibility tools</li>
                  <li style="margin-bottom: 0; color: #1a202c;">✅ Choose from Free, Core, or Premium plans</li>
                </ul>
              </div>
              
              <!-- Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${claimLink}"
                   style="display: inline-block; background-color: #2b6cb0; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(43, 108, 176, 0.2);">
                  Claim Your Company
                </a>
              </div>

              <!-- Expiry Note -->
              <div style="background-color: #ebf8ff; border: 1px solid #bee3f8; border-radius: 6px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #2c5282; font-size: 14px; line-height: 1.5;">
                  <strong>⏰ This link will expire in 7 days</strong> for security reasons.
                </p>
              </div>

              <!-- Why Claim Section -->
              <div style="background-color: #f0f9ff; border-radius: 6px; padding: 20px; margin-top: 24px;">
                <p style="margin: 0; color: #1a202c; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #2b6cb0;">Why claim your profile?</strong><br>
                  STR Market Map helps hospitality operators discover and compare solutions like yours. 
                  Claiming your profile ensures your information is accurate and you can engage with potential customers.
                </p>
              </div>

              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0 0 8px; color: #718096; font-size: 13px;">
                  ${process.env.BREVO_FROM_NAME}
                </p>
                <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                  This is an automated notification. Please do not reply to this email.
                </p>
                <p style="margin: 8px 0 0; color: #a0aec0; font-size: 11px;">
                  &copy; ${new Date().getFullYear()} STR Market Map. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log('📤 Sending claim invite email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Claim invite email sent successfully:', info.messageId);
    console.log('📬 Response:', info.response);
    
    return info;
  } catch (error) {
    console.error('❌ Error sending claim invite email:', error);
    throw error;
  }
}