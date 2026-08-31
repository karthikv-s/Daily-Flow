import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { updateProfile } from '../api';
import styles from './ProfileModal.module.css';

const AVATAR_PRESETS = ['🧑‍💻', '🚀', '⚡', '🐱', '🎨', '💼', '🦁', '🌟', '👑', '🎯'];

export default function ProfileModal({ onClose }) {
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('user_display_name') || (user?.email ? user.email.split('@')[0] : 'Karthik');
  });

  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('user_avatar_emoji') || '🧑‍💻';
  });

  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setSaving(true);
    try {
      if (email.trim() !== user?.email) {
        await updateProfile({ email: email.trim() });
      }

      localStorage.setItem('user_display_name', displayName.trim());
      localStorage.setItem('user_avatar_emoji', avatar);

      addToast({
        title: 'Profile Updated! ✨',
        message: 'Your profile settings have been saved.',
        type: 'success',
      });

      if (refreshUser) refreshUser();
      onClose();
    } catch (err) {
      addToast({
        title: 'Update Failed',
        message: err.response?.data?.error || 'Could not update profile',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal + ' animate-scale'}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            <span>👤</span>
            <span>Profile & Settings</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className={styles.body}>
            {/* Avatar Selector */}
            <div className={styles.avatarSection}>
              <div className={styles.currentAvatar}>
                {avatar}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Choose Your Avatar:
              </div>
              <div className={styles.avatarPresetsGrid}>
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={styles.presetBtn + (avatar === p ? ' ' + styles.presetActive : '')}
                    onClick={() => setAvatar(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* User Details Fields */}
            <div className="form-group">
              <label className="form-label">Display Name / Username</label>
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>

            {/* Performance Summary */}
            <div className={styles.statsSummary}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Points</span>
                <span className={styles.statNum}>⚡ {user?.pointsTotal || 0} pts</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Current Streak</span>
                <span className={styles.statNum}>🔥 {user?.streakDays || 0} days</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={() => {
                onClose();
                logout();
              }}
            >
              🚪 Sign Out
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
