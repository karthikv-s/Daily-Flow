import React from 'react';
import styles from '../../pages/Dashboard.module.css';

const MOBILE_PRIMARY_NAV = [
  { id: 'dashboard', icon: '🏠', label: 'Home' },
  { id: 'tasks',     icon: '☑️', label: 'Tasks' },
  { id: 'my_day',   icon: '🌤️', label: 'My Day' },
  { id: 'ai',       icon: '🤖', label: 'AI' },
  { id: 'notes',    icon: '📝', label: 'Notes' },
];

const MORE_VIEWS = ['calendar', 'goals', 'habits', 'analytics', 'reminders'];

export default function MobileBottomNav({ activeNav, onSelectNav }) {
  function handleMoreClick() {
    const cur = MORE_VIEWS.indexOf(activeNav);
    onSelectNav(MORE_VIEWS[(cur + 1) % MORE_VIEWS.length]);
  }

  return (
    <nav className={styles.mobileBottomNav}>
      {MOBILE_PRIMARY_NAV.map((item) => (
        <button
          key={item.id}
          className={
            styles.mobileNavItem +
            (activeNav === item.id ? ' ' + styles.mobileNavItemActive : '')
          }
          onClick={() => onSelectNav(item.id)}
        >
          <span className={styles.mobileNavIcon}>{item.icon}</span>
          <span className={styles.mobileNavLabel}>{item.label}</span>
        </button>
      ))}

      {/* More button cycles through remaining views */}
      <button
        className={
          styles.mobileNavItem +
          (MORE_VIEWS.includes(activeNav) ? ' ' + styles.mobileNavItemActive : '')
        }
        onClick={handleMoreClick}
      >
        <span className={styles.mobileNavIcon}>⋯</span>
        <span className={styles.mobileNavLabel}>More</span>
      </button>
    </nav>
  );
}
