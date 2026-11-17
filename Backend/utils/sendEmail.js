const nodemailer = require('nodemailer');
const SystemSetting = require('../models/SystemSetting');

const sendEmail = async ({ to, subject, html }) => {
  let emailUser = process.env.EMAIL_USER;
  let emailPass = process.env.EMAIL_PASS;
  let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  let smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  let senderName = process.env.EMAIL_SENDER_NAME || 'HRMS Portal';

  // 1. Try to read dynamic configuration saved by Admin in DB
  try {
    const settings = await SystemSetting.findOne();
    if (settings?.emailSettings) {
      if (settings.emailSettings.emailUser) {
        emailUser = settings.emailSettings.emailUser;
      }
      if (settings.emailSettings.emailPass) {
        emailPass = settings.emailSettings.emailPass;
      }
      if (settings.emailSettings.smtpHost) {
        smtpHost = settings.emailSettings.smtpHost;
      }
      if (settings.emailSettings.smtpPort) {
        smtpPort = Number(settings.emailSettings.smtpPort);
      }
      if (settings.emailSettings.senderName) {
        senderName = settings.emailSettings.senderName;
      }
    }
  } catch (dbErr) {
    console.warn('[Email Utility] Failed to load DB settings, falling back to .env:', dbErr.message);
  }

  // 2. Validate credentials
  if (!emailUser || !emailPass) {
    console.log('[Email Utility] SMTP credentials not set in DB or .env');
    console.log(`[Email Utility] To: ${to}`);
    console.log(`[Email Utility] Subject: ${subject}`);
    console.log(`[Email Utility] Content:\n${html}`);
    return;
  }

  try {
    // Strip accidental whitespace from Google app password
    const cleanPass = emailPass.replace(/\s+/g, '');
    const isSecure = smtpPort === 465;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: emailUser,
        pass: cleanPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"${senderName}" <${emailUser}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email Utility] Email successfully dispatched via ${emailUser} to ${to}`);
  } catch (error) {
    console.error(`[Email Utility] Failed to send email to ${to}:`, error.message);
    console.log('[Email Utility] Fallback email content:\n', html);
  }
};

module.exports = sendEmail;
