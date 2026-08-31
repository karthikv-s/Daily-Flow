import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api';
import { useToast } from '../contexts/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Steps: 1 = Enter Email, 2 = Verify OTP & New Password, 3 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request OTP
  async function handleRequestOtp(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      addToast({
        title: 'Verification Code Sent!',
        message: res.data.message || 'Check your Gmail inbox for your 6-digit code',
        type: 'info',
        duration: 7000,
      });
      setOtp(''); // Clear input so user enters real code from Gmail
      setStep(2);
      setResendCooldown(60); // 60s cooldown
    } catch (err) {
      addToast({
        title: 'Request Failed',
        message: err.response?.data?.error || 'Could not send verification code. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      addToast({
        title: 'New Code Sent!',
        message: res.data.message || 'Check your email for the new code',
        type: 'info',
      });
      setResendCooldown(60);
    } catch (err) {
      addToast({
        title: 'Resend Failed',
        message: err.response?.data?.error || 'Could not resend code',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP & Reset Password
  async function handleResetPassword(e) {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      addToast({ title: 'Invalid Code', message: 'Please enter the 6-digit OTP code', type: 'warning' });
      return;
    }
    if (newPassword.length < 6) {
      addToast({ title: 'Password too short', message: 'Password must be at least 6 characters', type: 'warning' });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ title: 'Passwords do not match', message: 'Please ensure both passwords match', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email.trim(), otp.trim(), newPassword);
      addToast({
        title: 'Success! 🎉',
        message: res.data.message || 'Password reset successfully',
        type: 'success',
        duration: 5000,
      });
      setStep(3);
    } catch (err) {
      addToast({
        title: 'Reset Failed',
        message: err.response?.data?.error || 'Verification code is invalid or has expired',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className="floating-theme-toggle">
        <ThemeToggle />
      </div>
      <div className={styles.authCard + ' glass-card animate-scale'}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🔐</span>
          <h1 className={styles.logoText}>DailyFlow<span className={styles.aiTag}>AI</span></h1>
        </div>

        {/* Step Indicators */}
        <div className={styles.stepIndicator}>
          <div className={styles.stepDot + (step >= 1 ? ' ' + styles.stepDotActive : '')}>1</div>
          <div className={styles.stepLine} />
          <div className={styles.stepDot + (step >= 2 ? ' ' + styles.stepDotActive : '')}>2</div>
          <div className={styles.stepLine} />
          <div className={styles.stepDot + (step >= 3 ? ' ' + styles.stepDotActive : '')}>✓</div>
        </div>

        {/* ── STEP 1: Enter Email ─────────────────────────────────── */}
        {step === 1 && (
          <>
            <p className={styles.subtitle}>Enter your registered email to receive a 6-digit password reset code.</p>
            <form onSubmit={handleRequestOtp} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Account Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                id="send-otp-btn"
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Send Verification Code'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: Enter OTP & New Password ───────────────────── */}
        {step === 2 && (
          <>
            <div className={styles.infoBox} style={{ marginBottom: 20 }}>
              <span>📩</span>
              <div>
                We sent a 6-digit verification code to <strong>{email}</strong>. Please check your inbox (or spam folder).
              </div>
            </div>

            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="otp-code">6-Digit Verification Code</label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className={'form-input ' + styles.otpInput}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                id="confirm-reset-btn"
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <span className="spinner" /> : 'Reset Password & Continue'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStep(1)}
                >
                  ← Change Email
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3: Success Confirmation ───────────────────────── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Password Reset Complete!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
              Your account password has been updated. You can now log in with your new password.
            </p>
            <button
              id="goto-login-btn"
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => navigate('/login')}
            >
              Sign In Now →
            </button>
          </div>
        )}

        <p className={styles.switchText}>
          Remember your password?{' '}
          <Link to="/login" className={styles.switchLink}>Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
