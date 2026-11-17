const rateLimit = require("express-rate-limit");
const SystemSetting = require("../models/SystemSetting");

// Dedicated Rate Limiter for Authentication & Sensitive Operations
// Blocks brute-force attacks and credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes window
  max: async () => {
    try {
      const setting = await SystemSetting.findOne();
      return Number(setting?.securityPolicies?.maxLoginAttempts) || 5;
    } catch {
      return 5;
    }
  },
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: {
    success: false,
    message: "Too many login attempts from this IP address. Please try again after 15 minutes.",
  },
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json(options.message);
  },
});

module.exports = {
  authLimiter,
};

