import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import styles from './Auth.module.css';

export default function Register() {
  const { register }    = useAuth();
  const { addToast }    = useToast();
  const navigate        = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      addToast({ title: 'Passwords do not match', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      addToast({ title: 'Account created!', message: 'Welcome to DailyFlow AI 🎉', type: 'success' });
      navigate('/dashboard');
    } catch (err) {
      addToast({ title: 'Registration failed', message: err.response?.data?.error || 'Please try again', type: 'error' });
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
          <span className={styles.logoIcon}>📅</span>
          <h1 className={styles.logoText}>DailyFlow<span className={styles.aiTag}>AI</span></h1>
        </div>
        <p className={styles.subtitle}>Start planning smarter today</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button id="register-submit" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
