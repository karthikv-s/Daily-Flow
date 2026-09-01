import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { updateProfile } from '../api';
import styles from './ProfileModal.module.css';

const AVATAR_PRESETS = ['🧑‍💻', '🚀', '⚡', '🐱', '🎨', '💼', '🦁', '🌟', '👑', '🎯'];

export default function ProfileModal({ onClose }) {
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('user_display_name') || (user?.email ? user.email.split('@')[0] : 'Karthik');
  });

  // avatar can be an emoji string OR a base64 image data URL
  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('user_avatar_img') || localStorage.getItem('user_avatar_emoji') || '🧑‍💻';
  });

  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  // true if avatar is an uploaded image (data URL), false if emoji
  const isImageAvatar = avatar && avatar.startsWith('data:');

  function handleImageFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast({ title: 'Invalid file', message: 'Please select an image file.', type: 'error' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast({ title: 'File too large', message: 'Please choose an image under 2MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatar(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setSaving(true);
    try {
      if (email.trim() !== user?.email) {
        await updateProfile({ email: email.trim() });
      }

      localStorage.setItem('user_display_name', displayName.trim());

      if (isImageAvatar) {
        localStorage.setItem('user_avatar_img', avatar);
        localStorage.removeItem('user_avatar_emoji');
      } else {
        localStorage.setItem('user_avatar_emoji', avatar);
        localStorage.removeItem('user_avatar_img');
      }

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
            {/* Avatar Section */}
            <div className={styles.avatarSection}>
              {/* Current Avatar Display */}
              <div
                className={styles.currentAvatar}
                style={isImageAvatar ? { padding: 0, overflow: 'hidden', background: 'transparent' } : {}}
              >
                {isImageAvatar
                  ? <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : avatar
                }
              </div>

              {/* Upload Buttons */}
              <div className={styles.uploadButtons}>
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                  title="Choose from gallery"
                >
                  🖼️ Gallery
                </button>
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => cameraInputRef.current?.click()}
                  title="Take a photo"
                >
                  📷 Camera
                </button>
                {isImageAvatar && (
                  <button
                    type="button"
                    className={styles.uploadBtnRemove}
                    onClick={() => setAvatar('🧑‍💻')}
                    title="Remove photo"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleImageFile(e.target.files?.[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                style={{ display: 'none' }}
                onChange={(e) => handleImageFile(e.target.files?.[0])}
              />

              {/* Emoji Presets */}
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>
                — or pick an emoji avatar —
              </div>
              <div className={styles.avatarPresetsGrid}>
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={styles.presetBtn + (!isImageAvatar && avatar === p ? ' ' + styles.presetActive : '')}
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
