import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

export async function sendFieldRequestConfirmationEmail(
  to: string,
  fieldName: string,
  categoryName: string
) {
  await transporter.sendMail({
    from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
    to,
    subject: "Your field request has been received",
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
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Field Request Received</h1>
            <p style="margin: 8px 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">Thanks for your suggestion</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <!-- Success Banner -->
            <div style="background-color: #e3fbe3; border-left: 4px solid #2b6cb0; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="margin: 0; color: #1a202c; font-weight: 500;">
                We’ve received your request for the following field:
              </p>
            </div>

            <!-- Request Details -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; color: #4a5568; width: 140px; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Feature Category:</td>
                  <td style="padding: 12px 0; color: #1a202c; font-weight: 500; border-bottom: 1px solid #e2e8f0;">${categoryName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #4a5568; width: 140px; font-weight: 500;">Field Name:</td>
                  <td style="padding: 12px 0; color: #1a202c; font-weight: 500;">${fieldName}</td>
                </tr>
              </table>
            </div>

            <!-- Next Steps -->
            <div style="background-color: #ebf8ff; border: 1px solid #bee3f8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; color: #2c5282; line-height: 1.6;">
                Our product team will review it shortly. If we need more information,
                we’ll contact you at this email address.
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
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}