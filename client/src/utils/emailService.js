/**
 * LabGuard — EmailJS Integration (fetch-based, no npm package needed)
 *
 * ═══════════════════════════════════════════════════════════════
 *  HOW TO SET UP (one-time, ~5 minutes)
 * ═══════════════════════════════════════════════════════════════
 *
 *  STEP 1 — Create free account at https://www.emailjs.com
 *
 *  STEP 2 — Connect your email service:
 *    Sidebar → Email Services → Add New Service
 *    Choose Gmail → connect your Gmail account → Save
 *    Your Service ID will look like: service_q7146uv
 *
 *  STEP 3 — Create the email template:
 *    Sidebar → Email Templates → Create New Template
 *    Fill in exactly as shown below, then click Save.
 *    Your Template ID will look like: template_abc123
 *
 *  STEP 4 — Get your Public Key:
 *    Top-right avatar → Account → General tab → Public Key
 *
 *  STEP 5 — Paste all three values in EMAILJS_CONFIG below.
 *
 * ═══════════════════════════════════════════════════════════════
 *
 *  EMAIL TEMPLATE — paste this into EmailJS Template Editor:
 *  (Settings tab: To = {{to_email}}, From Name = LabGuard HTU,
 *   Reply To = noreply@htu.edu.jo)
 *
 *  Subject:
 *    Welcome to LabGuard — Your Account Has Been Created
 *
 *  Body (switch to HTML mode in the editor):
 *  ───────────────────────────────────────────────────────────
 *
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#e9333f;padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:rgba(255,255,255,0.2);
                              border-radius:10px;padding:8px 14px;">
                    <span style="color:#fff;font-size:20px;font-weight:900;
                                 letter-spacing:1px;">LG</span>
                  </div>
                </td>
              </tr>
              <tr><td style="padding-top:16px;">
                <p style="margin:0;color:#fff;font-size:24px;font-weight:700;">
                  Welcome to LabGuard!
                </p>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                  Al Hussein Technical University — Laboratory Management System
                </p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:36px 40px 0;">
            <p style="margin:0;font-size:16px;color:#1e293b;font-weight:600;">
              Hello, {{to_name}} 👋
            </p>
            <p style="margin:12px 0 0;font-size:14px;color:#64748b;line-height:1.7;">
              Your LabGuard account has been created by the system administrator.
              Below are your login credentials. Please keep them safe and
              <strong style="color:#e9333f;">change your password</strong>
              immediately after your first login.
            </p>
          </td>
        </tr>

        <!-- Credentials box -->
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f8fafc;border:1px solid #e2e8f0;
                          border-radius:12px;overflow:hidden;">
              <tr>
                <td colspan="2"
                    style="background:#2c3e50;padding:12px 20px;">
                  <p style="margin:0;color:#fff;font-size:12px;font-weight:700;
                             letter-spacing:0.8px;text-transform:uppercase;">
                    Your Login Credentials
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;
                           color:#64748b;font-size:13px;width:40%;">
                  Email Address
                </td>
                <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;
                           color:#1e293b;font-size:13px;font-weight:600;">
                  {{user_email}}
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;
                           color:#64748b;font-size:13px;">
                  Temporary Password
                </td>
                <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                  <code style="background:#fef2f2;color:#e9333f;padding:4px 10px;
                               border-radius:6px;font-size:14px;font-weight:700;
                               font-family:monospace;letter-spacing:1px;">
                    {{temp_password}}
                  </code>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;
                           color:#64748b;font-size:13px;">
                  Role
                </td>
                <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;
                           color:#1e293b;font-size:13px;font-weight:600;
                           text-transform:capitalize;">
                  {{user_role}}
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;color:#64748b;font-size:13px;">
                  Department
                </td>
                <td style="padding:14px 20px;color:#1e293b;font-size:13px;
                           font-weight:600;">
                  {{user_department}}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:0 40px 32px;" align="center">
            <a href="{{login_url}}"
               style="display:inline-block;background:#e9333f;color:#ffffff;
                      text-decoration:none;font-size:15px;font-weight:700;
                      padding:14px 40px;border-radius:10px;
                      letter-spacing:0.3px;">
              Log In to LabGuard →
            </a>
          </td>
        </tr>

        <!-- Warning banner -->
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#fffbeb;border:1px solid #fcd34d;
                          border-radius:10px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:#92400e;">
                    ⚠️ <strong>Important:</strong> This is a temporary password.
                    You will be required to create a new password on your first login.
                    Never share your credentials with anyone.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;
                     padding:20px 40px;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
              This email was sent by the LabGuard system at
              Al Hussein Technical University.<br/>
              If you did not expect this email, please contact your administrator.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
 *
 * ═══════════════════════════════════════════════════════════════
 */

export const EMAILJS_CONFIG = {
  publicKey: "AJhBewuHl2OhJk_lO",   // Dashboard → Account → General → Public Key
  serviceId: "service_q7146uv",   // Dashboard → Email Services → your service ID
  templateId: "template_w037g2e",  // Dashboard → Email Templates → your template ID
};

export const isEmailJSConfigured = () =>
  !EMAILJS_CONFIG.publicKey.startsWith("YOUR_") &&
  !EMAILJS_CONFIG.serviceId.startsWith("YOUR_") &&
  !EMAILJS_CONFIG.templateId.startsWith("YOUR_");

/**
 * Send a registration email using EmailJS HTTP API (no npm package needed).
 */
export async function sendRegistrationEmail({ toName, toEmail, role, department, tempPassword }) {
  if (!isEmailJSConfigured()) {
    console.warn("[LabGuard EmailJS] Not configured — email simulated.");
    console.table({ to: toEmail, toName, role, department, tempPassword });
    await new Promise(r => setTimeout(r, 700));
    return { success: true, message: "Email simulated (EmailJS keys not set)" };
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId,
        template_id: EMAILJS_CONFIG.templateId,
        user_id: EMAILJS_CONFIG.publicKey,
        template_params: {
          to_name: toName,
          to_email: toEmail,
          user_email: toEmail,
          user_role: role,
          user_department: department,
          temp_password: tempPassword,
          login_url: window.location.origin + "/login",
          from_name: "LabGuard — Al Hussein Technical University",
        },
      }),
    });

    if (res.status === 200) {
      return { success: true, message: `Email sent to ${toEmail}` };
    }

    const text = await res.text().catch(() => res.statusText);
    return { success: false, message: `EmailJS error ${res.status}: ${text}` };

  } catch (err) {
    console.error("[LabGuard EmailJS] Fetch failed:", err);
    return { success: false, message: err.message || "Network error — check your connection." };
  }
}
