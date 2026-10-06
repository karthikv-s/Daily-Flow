import React from 'react';
import styles from '../../pages/Dashboard.module.css';

export default function TopHeader({
  greeting,
  userName,
  dateString,
  searchQuery,
  onSearchChange,
  theme,
  setTheme,
  isDark,
  userAvatarEmoji,
  onOpenReminders,
  onOpenProfile,
}) {
  return (
    <header className={styles.topHeader}>
      <div>
        <h1 className={styles.greetingTitle}>
          {greeting}, <span className={styles.greetingName}>{userName}</span>! 👋
        </h1>
        <p className={styles.greetingSub}>Let&apos;s make today productive and amazing.</p>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.datePill}>
          <span>📅</span>
          <span>{dateString}</span>
        </div>

        <div className={styles.searchBox}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search tasks..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Top-Right Theme Selector */}
        <div className={styles.themeHeaderSelector}>
          <span>{isDark ? '🌙' : '☀️'}</span>
          <select
            className={styles.themeHeaderSelect}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            id="top-right-theme-select"
            aria-label="Color Theme"
          >
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>

        <button
          className={styles.iconBtn}
          onClick={onOpenReminders}
          title="Notifications & Reminders"
        >
          🔔
          <span className={styles.notifBadge}>3</span>
        </button>

        <div
          className={styles.userAvatar}
          onClick={onOpenProfile}
          title="My Profile & Settings"
          style={
            userAvatarEmoji.startsWith('data:')
              ? { padding: 0, overflow: 'hidden', background: 'transparent', border: '2px solid var(--accent)' }
              : {}
          }
        >
          {userAvatarEmoji.startsWith('data:') ? (
            <img
              src={userAvatarEmoji}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            userAvatarEmoji
          )}
        </div>
      </div>
    </header>
  );
}
