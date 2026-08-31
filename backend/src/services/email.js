const nodemailer = require('nodemailer');

/**
 * Creates a transporter based on environment configuration or fallback
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  let pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (pass) {
    pass = pass.replace(/\s+/g, '').trim();
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // If using standard Gmail with app password
  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return null;
}

/**
 * Sends a 6-digit OTP password reset email
 */
async function sendOtpEmail(toEmail, otp) {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@dailyflow.ai';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f111a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; color: #f1f1f5;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">📅</span>
        <h2 style="color: #7c6af7; margin: 8px 0 0 0; font-size: 24px; font-weight: 800;">DailyFlow <span style="font-size: 14px; background: rgba(124,106,247,0.2); color: #a89bfa; padding: 2px 8px; border-radius: 99px;">AI</span></h2>
      </div>
      <h3 style="font-size: 18px; color: #ffffff; margin-bottom: 12px;">Password Reset Request</h3>
      <p style="color: rgba(241,241,245,0.7); font-size: 14px; line-height: 1.6;">
        We received a request to reset your password. Use the 6-digit One-Time Password (OTP) below to complete your reset.
      </p>
      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; background: rgba(124,106,247,0.15); border: 1px solid rgba(124,106,247,0.4); border-radius: 12px; padding: 14px 28px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #a89bfa;">
          ${otp}
        </div>
      </div>
      <p style="color: #fbbf24; font-size: 13px; margin-bottom: 20px;">
        ⚠️ This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
      <p style="font-size: 12px; color: rgba(241,241,245,0.4); text-align: center; margin: 0;">
        DailyFlow AI — Your smart daily planning companion
      </p>
    </div>
  `;

  if (!transporter) {
    console.log('\n========================================');
    console.log(`🔑 [OTP SERVICE] Password reset OTP for ${toEmail}: ${otp}`);
    console.log('   (SMTP not configured in .env, logged OTP for testing)');
    console.log('========================================\n');
    return { sent: true, mode: 'console', otp };
  }

  try {
    const info = await transporter.sendMail({
      from: `"DailyFlow AI" <${fromAddress}>`,
      to: toEmail,
      subject: `Your DailyFlow AI Password Reset Code: ${otp}`,
      text: `Your password reset code is ${otp}. It will expire in 10 minutes.`,
      html: htmlContent,
    });
    console.log(`[OTP SERVICE] Reset email sent to ${toEmail}: ${info.messageId}`);
    return { sent: true, mode: 'smtp', messageId: info.messageId };
  } catch (err) {
    console.error(`[OTP SERVICE] Failed to send email via SMTP:`, err.message);
    console.log(`🔑 [OTP SERVICE] Fallback Console OTP for ${toEmail}: ${otp}`);
    return { sent: true, mode: 'fallback_console', otp };
  }
}

module.exports = { sendOtpEmail };
