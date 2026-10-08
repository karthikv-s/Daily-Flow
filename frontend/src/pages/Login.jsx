import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import styles from './Auth.module.css';

export default function Login() {
  const { login }       = useAuth();
  const { addToast }    = useToast();
  const navigate        = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const isNotRegistered = err.response?.status === 404;
      let errorTitle = 'Login failed';
      let errorMsg = err.response?.data?.error;

      if (isNotRegistered) {
        errorTitle = 'User Not Registered';
      } else if (!err.response) {
        errorTitle = 'Connection Error';
        errorMsg = 'Cannot reach backend server. Make sure your PC server is running and phone is on the same Wi-Fi.';
      }

      addToast({
        title: errorTitle,
        message: errorMsg || 'Incorrect email or password',
        type: 'error'
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
          <span className={styles.logoIcon}>📅</span>
          <h1 className={styles.logoText}>DailyFlow<span className={styles.aiTag}>AI</span></h1>
        </div>
        <p className={styles.subtitle}>Welcome back — your tasks are waiting</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">Password</label>
              <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don&apos;t have an account?{' '}
          <Link to="/register" className={styles.switchLink}>Create one</Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            type="button"
            onClick={() => {
              const current = localStorage.getItem('custom_api_url') || import.meta.env.VITE_API_URL || 'http://10.182.137.165:4000';
              const input = window.prompt('Backend Server URL (e.g. http://10.182.137.165:4000 or your cloud URL):', current);
              if (input !== null && input.trim()) {
                const cleaned = input.trim().replace(/\/$/, '');
                localStorage.setItem('custom_api_url', cleaned);
                window.location.reload();
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #888)',
              fontSize: '11px',
              cursor: 'pointer',
              textDecoration: 'underline',
              opacity: 0.8
            }}
          >
            ⚙️ Server URL Setting
          </button>
        </div>
      </div>
    </div>
  );
}
