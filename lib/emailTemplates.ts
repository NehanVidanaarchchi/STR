export const emailVerificationTemplate = ({ verificationLink }: any) => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - STR Marketplace</title>
    <style>
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                margin: 0 !important;
            }

            .content {
                padding: 20px !important;
            }

            .button {
                width: 100% !important;
                text-align: center;
            }

            h1 {
                font-size: 28px !important;
            }

            h2 {
                font-size: 20px !important;
            }
        }

        .gradient-bg {
            background: linear-gradient(135deg, #2B6CB0 0%, #4299e1 100%);
        }
    </style>
</head>

<body
    style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100vh;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 100%;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" class="container" cellpadding="0" cellspacing="0" border="0"
                    style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);">

                    <!-- Gradient Header -->
                    <tr>
                        <td align="center" class="gradient-bg" style="padding: 50px 40px 40px;">
                            <h1
                                style="color: #ffffff; font-size: 36px; margin: 0 0 10px; font-weight: 700; letter-spacing: -0.5px;">
                                STR Marketplace
                            </h1>
                            <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; font-weight: 300;">
                                Welcome to our community
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td align="center" class="content" style="padding: 50px 20px;">
                            <!-- Title Icon -->
                            <div style="margin-bottom: 25px;">
                                <div
                                    style="width: 60px; height: 60px; background: #EBF8FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                            stroke="#2B6CB0" stroke-width="2" stroke-linecap="round"
                                            stroke-linejoin="round" />
                                    </svg>
                                </div>
                            </div>

                            <h2 style="color: #2B6CB0; font-size: 28px; margin: 0 0 20px; font-weight: 600;">
                                Email Verification Required
                            </h2>

                            <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 35px; padding: 0 15px;">
                                We're excited to have you join <strong style="color: #2B6CB0;">STR Marketplace</strong>.
                                To ensure the security of your account and complete your registration, please verify
                                your email address.
                            </p>

                            <a href="${verificationLink}" class="button"
                                style="background: linear-gradient(135deg, #2B6CB0 0%, #4299e1 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(43, 108, 176, 0.3); transition: all 0.3s ease;">
                                Verify Email Address
                            </a>
                            
                            <!-- Additional Information -->
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
                                <p style="color: #718096; font-size: 14px; margin: 20px 0 10px;">
                                    This verification link will expire in 24 hours.
                                </p>
                                <p style="color: #A0AEC0; font-size: 13px; margin: 0;">
                                    If you didn't create an account with STR Marketplace, please ignore this email.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background: #2D3748; padding: 30px 40px;">
                            <!-- Brand -->
                            <p style="color: #ffffff; font-size: 18px; margin: 0 0 15px; font-weight: 600;">
                                STR Marketplace
                            </p>
                            <p style="color: #A0AEC0; font-size: 12px; margin: 0 0 10px;">
                                © 2025 STR Marketplace. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>

</html>
`;

export const adminNewProviderTemplate = ({
    fullName,
    email,
    phone,
    company,
}: any) => `
  <h2>New Provider Signup</h2>
  <p>A new provider has signed up.</p>

  <ul>
    <li><strong>Name:</strong> ${fullName}</li>
    <li><strong>Email:</strong> ${email}</li>
    <li><strong>Phone:</strong> ${phone}</li>
    <li><strong>Company:</strong> ${company}</li>
  </ul>

  <p>Please review and approve if necessary.</p>
`;

export const providerMagicLoginTemplate = ({ fullName, loginLink }: any) => `
<h2>Welcome to STR Marketplace 🎉</h2>

<p>Hi ${fullName},</p>

<p>Your provider profile has been created successfully.</p>

<p>
Click the button below to securely log in to your account:
</p>

<p>
<a href="${loginLink}" style="
  padding: 12px 24px;
  background: #2B6CB0;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  display: inline-block;
">
  Log in to STR Marketplace
</a>
</p>

<p>This link will expire in 24 hours.</p>

<p>If you didn’t request this, you can safely ignore this email.</p>

<p>— STR Marketplace Team</p>
`;

export const inviteTeamMemberTemplate = ({
  fullName,
  role,
  setupLink,
}: {
  fullName: string;
  role: string;
  setupLink: string;
}) => `
  <h2>Hello ${fullName},</h2>
  <p>You have been invited to STR Marketplace as <b>${role}</b>.</p>
  <p>Click below to activate your account and set your password:</p>
  <a href="${setupLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">
    Activate Account
  </a>
  <p>After setting your password, you can login at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login">${process.env.NEXT_PUBLIC_APP_URL}/auth/login</a></p>
  <p>This link expires in 24 hours.</p>
  <p>If you didn't request this invitation, please ignore this email.</p>
`;
