export const joinSTRMarketMapTemplate = ({
  companyName,
  inviteLink,
}: {
  companyName: string;
  inviteLink: string;
}) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Join STR Market Map</title>
  </head>
  <body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, sans-serif;">
    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">
      <div style="background:#2B6CB0; padding:24px 32px;">
        <h1 style="margin:0; color:#ffffff; font-size:24px;">Join STR Market Map</h1>
      </div>

      <div style="padding:32px;">
        <p style="font-size:16px; color:#0f172a; margin:0 0 16px;">
          Hello,
        </p>

        <p style="font-size:16px; color:#334155; line-height:1.6; margin:0 0 16px;">
          We would like to invite <strong>${companyName}</strong> to join <strong>STR Market Map</strong>.
        </p>

        <p style="font-size:16px; color:#334155; line-height:1.6; margin:0 0 24px;">
          Join the platform to manage your company profile, increase visibility, and connect with relevant operators.
        </p>

        <a href="${inviteLink}" style="display:inline-block; padding:14px 24px; background:#2B6CB0; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600;">
          Join STR Market Map
        </a>

        <p style="font-size:14px; color:#64748b; margin:24px 0 0;">
          If you have any questions, feel free to reply to this email.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};