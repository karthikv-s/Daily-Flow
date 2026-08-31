const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({ data: { email, passwordHash } });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.status(201).json({ token, user: { id: user.id, email: user.email, pointsTotal: 0, streakDays: 0, badges: [] } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, user: { id: user.id, email: user.email, pointsTotal: user.pointsTotal, streakDays: user.streakDays, badges: user.badges } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

const { sendOtpEmail } = require('../services/email');

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Return 404 so user knows account does not exist
        return res.status(404).json({ error: 'No account found with this email address' });
      }

      // Invalidate previous unused OTPs for this email
      await prisma.passwordResetOtp.updateMany({
        where: { email, used: false },
        data: { used: true },
      });

      // Generate a 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await prisma.passwordResetOtp.create({
        data: {
          email,
          otp,
          expiresAt,
        },
      });

      // Send OTP email (or console fallback if SMTP not configured)
      const emailResult = await sendOtpEmail(email, otp);

      res.json({
        success: true,
        message: 'A 6-digit verification code has been sent to your email.',
      });
    } catch (err) {
      console.error('[Forgot Password Error]:', err);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, otp } = req.body;
    try {
      const otpRecord = await prisma.passwordResetOtp.findFirst({
        where: {
          email,
          otp,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      res.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
      console.error('[Verify OTP Error]:', err);
      res.status(500).json({ error: 'Server error during OTP verification' });
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, otp, newPassword } = req.body;
    try {
      const otpRecord = await prisma.passwordResetOtp.findFirst({
        where: {
          email,
          otp,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User account not found' });
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password & mark OTP as used atomically
      await prisma.$transaction([
        prisma.user.update({
          where: { email },
          data: { passwordHash },
        }),
        prisma.passwordResetOtp.update({
          where: { id: otpRecord.id },
          data: { used: true },
        }),
      ]);

      res.json({ success: true, message: 'Password has been reset successfully! You can now sign in.' });
    } catch (err) {
      console.error('[Reset Password Error]:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  const { email, name } = req.body;
  try {
    const updateData = {};
    if (email) {
      // Check if email is taken by another user
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.userId) {
        return res.status(400).json({ error: 'This email is already in use by another account' });
      }
      updateData.email = email;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        pointsTotal: true,
        streakDays: true,
        badges: true,
        createdAt: true,
      },
    });

    res.json({ success: true, user: updatedUser, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('[Update Profile Error]:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;


