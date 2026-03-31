import nodemailer from "nodemailer";

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

export async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
}: {
  to: string;
  name: string;
  resetLink: string;
}) {
  try {
    console.log('📧 Sending password reset email to:', to);
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: "Reset Your STR Market Map Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #2B6CB0 0%, #00A2AE 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">STR Market Map</h1>
              </div>

              <!-- Content -->
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
                <p style="margin: 0 0 24px; color: #1a202c; font-size: 16px;">
                  Hello ${name || 'there'},
                </p>
                
                <p style="margin: 0 0 24px; color: #1a202c; font-size: 16px;">
                  We received a request to reset the password for your STR Market Map account. Click the button below to create a new password:
                </p>

                <!-- Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetLink}" 
                     style="display: inline-block; background-color: #2B6CB0; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; font-size: 16px; box-shadow: 0 2px 4px rgba(43,108,176,0.2);">
                    Reset Password
                  </a>
                </div>

                <div style="background-color: #ebf8ff; border: 1px solid #bee3f8; border-radius: 6px; padding: 16px; margin: 24px 0;">
                  <p style="margin: 0; color: #2c5282; font-size: 14px;">
                    <strong>⏰ This link will expire in 1 hour</strong> for security reasons. If you didn't request a password reset, you can safely ignore this email.
                  </p>
                </div>

                <p style="margin: 24px 0 0; color: #718096; font-size: 14px; text-align: center;">
                  Best regards,<br>
                  The STR Market Map Team
                </p>
              </div>

              <!-- Footer -->
              <div style="margin-top: 32px; text-align: center;">
                <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} STR Market Map. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    console.log('📤 Sending password reset email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
}