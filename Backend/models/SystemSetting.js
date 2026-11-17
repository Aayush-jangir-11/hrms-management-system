const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    companySettings: {
      companyName: {
        type: String,
        default: 'Fuel It Online Pvt. Ltd.',
      },
      companyEmail: {
        type: String,
        default: 'admin@fuelit.online',
      },
      companyPhone: {
        type: String,
        default: '+91 11 4567 8900',
      },
      companyAddress: {
        type: String,
        default: 'Tech Park, Tower B, Sector 62, Noida, India',
      },
      taxId: {
        type: String,
        default: '07AAACF1234F1Z8',
      },
      timezone: {
        type: String,
        default: 'Asia/Kolkata (IST +5:30)',
      },
      currency: {
        type: String,
        default: 'INR (₹)',
      },
      website: {
        type: String,
        default: 'https://fuelit.online',
      },
    },
    securityPolicies: {
      sessionTimeout: {
        type: String,
        default: '60',
      },
      passwordExpiry: {
        type: String,
        default: '90',
      },
      twoFactorEnforced: {
        type: Boolean,
        default: false,
      },
      maxLoginAttempts: {
        type: String,
        default: '5',
      },
      requireSpecialChar: {
        type: Boolean,
        default: true,
      },
    },
    emailSettings: {
      smtpHost: {
        type: String,
        default: 'smtp.gmail.com',
      },
      smtpPort: {
        type: Number,
        default: 587,
      },
      emailUser: {
        type: String,
        default: '',
      },
      emailPass: {
        type: String,
        default: '',
      },
      senderName: {
        type: String,
        default: 'Fuel It Online HRMS',
      },
      encryption: {
        type: String,
        enum: ['TLS', 'SSL', 'None'],
        default: 'TLS',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
