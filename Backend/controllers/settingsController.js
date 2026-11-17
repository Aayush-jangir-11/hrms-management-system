const nodemailer = require('nodemailer');
const SystemSetting = require('../models/SystemSetting');

const MASKED_PASSWORD = '••••••••••••••••';

// Helper to sanitize settings before returning to client
const sanitizeSettings = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj.emailSettings) {
    const hasPass = Boolean(obj.emailSettings.emailPass);
    obj.emailSettings.isPasswordSet = hasPass;
    obj.emailSettings.emailPass = hasPass ? MASKED_PASSWORD : '';
  }
  return obj;
};

// GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();

    if (!settings) {
      // Seed initial document with defaults and .env fallbacks
      settings = await SystemSetting.create({
        companySettings: {
          companyName: 'Fuel It Online Pvt. Ltd.',
          companyEmail: 'admin@fuelit.online',
          companyPhone: '+91 11 4567 8900',
          companyAddress: 'Tech Park, Tower B, Sector 62, Noida, India',
          taxId: '07AAACF1234F1Z8',
          timezone: 'Asia/Kolkata (IST +5:30)',
          currency: 'INR (₹)',
          website: 'https://fuelit.online',
        },
        securityPolicies: {
          sessionTimeout: '60',
          passwordExpiry: '90',
          twoFactorEnforced: false,
          maxLoginAttempts: '5',
          requireSpecialChar: true,
        },
        emailSettings: {
          smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
          smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
          emailUser: process.env.EMAIL_USER || '',
          emailPass: process.env.EMAIL_PASS || '',
          senderName: process.env.EMAIL_SENDER_NAME || 'Fuel It Online HRMS',
          encryption: process.env.EMAIL_ENCRYPTION || 'TLS',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeSettings(settings),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system settings: ' + error.message,
    });
  }
};

// PUT /api/admin/settings
const updateSettings = async (req, res) => {
  try {
    const { companySettings, securityPolicies, emailSettings } = req.body;

    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }

    if (companySettings) {
      settings.companySettings = {
        ...settings.companySettings.toObject(),
        ...companySettings,
      };
    }

    if (securityPolicies) {
      settings.securityPolicies = {
        ...settings.securityPolicies.toObject(),
        ...securityPolicies,
      };
    }

    if (emailSettings) {
      const existingEmail = settings.emailSettings.toObject();
      const updatedEmail = { ...existingEmail };

      if (emailSettings.smtpHost !== undefined) updatedEmail.smtpHost = emailSettings.smtpHost.trim();
      if (emailSettings.smtpPort !== undefined) updatedEmail.smtpPort = Number(emailSettings.smtpPort);
      if (emailSettings.emailUser !== undefined) updatedEmail.emailUser = emailSettings.emailUser.trim();
      if (emailSettings.senderName !== undefined) updatedEmail.senderName = emailSettings.senderName.trim();
      if (emailSettings.encryption !== undefined) updatedEmail.encryption = emailSettings.encryption;

      // Only update password if a new password is provided and it's not the masked string
      if (
        emailSettings.emailPass &&
        emailSettings.emailPass !== MASKED_PASSWORD &&
        emailSettings.emailPass.trim() !== ''
      ) {
        // Strip out accidental spaces (common when copying 16-char Google app passwords)
        updatedEmail.emailPass = emailSettings.emailPass.replace(/\s+/g, '');
      }

      settings.emailSettings = updatedEmail;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: sanitizeSettings(settings),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings: ' + error.message,
    });
  }
};

// POST /api/admin/settings/test-email
const testEmailConnection = async (req, res) => {
  try {
    const {
      testRecipient,
      emailUser: inputUser,
      emailPass: inputPass,
      smtpHost: inputHost,
      smtpPort: inputPort,
      senderName: inputName,
      encryption: inputEncryption,
    } = req.body;

    // Fetch existing settings from DB to use as base
    const saved = await SystemSetting.findOne();

    const emailUser =
      (inputUser && inputUser.trim()) ||
      saved?.emailSettings?.emailUser ||
      process.env.EMAIL_USER;

    let emailPass = saved?.emailSettings?.emailPass || process.env.EMAIL_PASS || '';

    // If caller provided a new unmasked password for testing, use it
    if (inputPass && inputPass !== MASKED_PASSWORD && inputPass.trim() !== '') {
      emailPass = inputPass.replace(/\s+/g, '');
    }

    const smtpHost =
      (inputHost && inputHost.trim()) ||
      saved?.emailSettings?.smtpHost ||
      'smtp.gmail.com';

    const smtpPort = inputPort
      ? Number(inputPort)
      : saved?.emailSettings?.smtpPort || 587;

    const senderName =
      (inputName && inputName.trim()) ||
      saved?.emailSettings?.senderName ||
      'Fuel It Online HRMS';

    const recipient =
      (testRecipient && testRecipient.trim()) ||
      emailUser ||
      req.user?.email;

    if (!emailUser || !emailPass) {
      return res.status(400).json({
        success: false,
        message:
          'Email sender address and App Password / Token are required to test the connection.',
      });
    }

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid recipient email address to send test email to.',
      });
    }

    const isSecure = smtpPort === 465;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // 1. Verify connection and credentials
    await transporter.verify();

    // 2. Dispatch actual test email
    const mailOptions = {
      from: `"${senderName}" <${emailUser}>`,
      to: recipient,
      subject: '✅ HRMS Outgoing Mail Gateway Test Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 20px; border-radius: 8px; color: white; text-align: center;">
            <h2 style="margin: 0; font-size: 22px;">HRMS Email Integration Verified</h2>
            <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Fuel It Online - Super Admin Settings</p>
          </div>
          <div style="padding: 24px 8px; color: #334155; line-height: 1.6;">
            <p>Hello Admin,</p>
            <p>Your outgoing email gateway configuration was tested and is working properly with the following credentials:</p>
            <ul style="background: #f8fafc; padding: 16px 32px; border-radius: 8px; border: 1px solid #f1f5f9; list-style-type: square;">
              <li><strong>SMTP Host:</strong> ${smtpHost}</li>
              <li><strong>Port:</strong> ${smtpPort} (Secure: ${isSecure ? 'Yes (SSL)' : 'TLS/STARTTLS'})</li>
              <li><strong>Sender Email:</strong> ${emailUser}</li>
              <li><strong>Sender Name:</strong> ${senderName}</li>
              <li><strong>Test Dispatched At:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</li>
            </ul>
            <p style="color: #16a34a; font-weight: bold;">
              All system notifications, onboarding credentials, password reset links, and digital payslips will now be routed through this email account.
            </p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
            Automated test message generated by Fuel It Online HRMS Portal.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: `Test email successfully dispatched to ${recipient}!`,
    });
  } catch (error) {
    let friendlyMessage = error.message;

    if (error.code === 'EAUTH' || error.responseCode === 535) {
      friendlyMessage =
        'Google/SMTP Authentication Failed (535): Invalid Email or App Password. If using Gmail, make sure 2-Step Verification is ON and you are using a generated 16-character App Password, NOT your regular Google password.';
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      friendlyMessage = `Connection Timeout connecting to ${req.body.smtpHost || 'SMTP host'}. Please verify host and port.`;
    }

    res.status(400).json({
      success: false,
      message: friendlyMessage,
      errorDetails: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  testEmailConnection,
};
