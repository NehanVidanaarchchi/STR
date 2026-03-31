// import nodemailer from "nodemailer";

// export const mailer = nodemailer.createTransport({
//   host: process.env.BREVO_SMTP_HOST,
//   port: Number(process.env.BREVO_SMTP_PORT),
//   secure: false,
//   auth: {
//     user: process.env.BREVO_SMTP_USER,
//     pass: process.env.BREVO_SMTP_PASS,
//   },
// });

// export async function sendEmail({
//   to,
//   subject,
//   html,
// }: {
//   to: string | string[];
//   subject: string;
//   html: string;
// }) {
//   await mailer.sendMail({
//     from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
//     to,
//     subject: 'Verify Your Email Address - STR Marketplace',
//     html,
//   });
// }

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

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      html,
    });

    console.log("Email sent successfully:", info);
    return info;
  } catch (error) {
    console.error("sendEmail failed:", error);
    throw error;
  }
}