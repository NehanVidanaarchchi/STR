import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: process.env.BREVO_SMTP_HOST,
//   port: Number(process.env.BREVO_SMTP_PORT),
//   secure: false,
//   auth: {
//     user: process.env.BREVO_SMTP_USER,
//     pass: process.env.BREVO_SMTP_PASS,
//   },
// });


const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  // Add debug option
  debug: true, // show debug output
  logger: true // log information
});

export async function sendReferenceEmail({
  to,
  customerName,
  companyName,
  token,
}: {
  to: string;
  customerName: string;
  companyName: string;
  token: string;
}) {
  try {
    console.log('📧 Preparing to send email to:', to);
    console.log('🔑 Using token:', token);
    
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm-reference?token=${token}`;
    console.log('🔗 Confirmation URL:', confirmUrl);
    
    // Verify connection configuration
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: "Reference confirmation request",
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
            <div style="background-color: #2b6cb0; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Reference Confirmation Request</h1>
              <p style="margin: 8px 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">Action requested from ${customerName}</p>
            </div>

            <!-- Content -->
            <div style="padding: 32px;">
              <!-- Greeting -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 16px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                  Hi ${customerName},
                </p>
                <p style="margin: 0 0 24px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                  <strong style="color: #2b6cb0;">${companyName}</strong> has listed you as a customer reference.
                </p>
                <p style="margin: 0 0 24px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                  Please confirm this by clicking the button below:
                </p>
                
                <!-- Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${confirmUrl}"
                     style="display: inline-block; background-color: #2b6cb0; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(43, 108, 176, 0.2);">
                    Confirm Reference
                  </a>
                </div>

                <!-- Note -->
                <div style="background-color: #ebf8ff; border: 1px solid #bee3f8; border-radius: 6px; padding: 16px; margin-top: 24px;">
                  <p style="margin: 0; color: #2c5282; font-size: 14px; line-height: 1.5;">
                    If you did not expect this email, you can ignore it.
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0 0 8px; color: #718096; font-size: 13px;">
                  ${process.env.BREVO_FROM_NAME}
                </p>
                <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                  This is an automated notification. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log('📤 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('📬 Response:', info.response);
    
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error; // Re-throw to be caught in the API route
  }
}