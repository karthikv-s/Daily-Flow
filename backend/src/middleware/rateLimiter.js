const rateLimit = require('express-rate-limit');

// Rate limiter for AI chat endpoints to protect against API quota abuse
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 chat messages per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI requests. Please slow down and try again in a few minutes.',
  },
});

// Rate limiter for authentication endpoints (prevent brute-force logins/registrations)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 auth attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

module.exports = {
  chatLimiter,
  authLimiter,
};
