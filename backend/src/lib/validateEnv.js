/**
 * Validates critical environment variables at startup.
 * Fails fast with clear diagnostics if essential secrets are missing.
 */
function validateEnv() {
  const required = [
    { key: 'DATABASE_URL', desc: 'PostgreSQL connection string' },
    { key: 'JWT_SECRET', desc: 'Secret key for signing user authentication tokens' },
  ];

  const missing = required.filter(({ key }) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n❌ CRITICAL: Missing required environment variables:');
    missing.forEach(({ key, desc }) => {
      console.error(`   - ${key}: ${desc}`);
    });
    console.error('Please configure these in your .env file before starting the server.\n');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // Warnings for optional integrations
  const warnings = [];
  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    warnings.push('Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY is set. AI assistant will run in local rule-based fallback mode.');
  }
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    warnings.push('Web Push VAPID keys not configured. Push notifications will be disabled.');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    warnings.push('Email SMTP credentials not configured. Password reset OTPs will be printed to console.');
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.log('ℹ️  Environment configuration notices:');
    warnings.forEach((w) => console.log(`   - ${w}`));
  }
}

module.exports = { validateEnv };
