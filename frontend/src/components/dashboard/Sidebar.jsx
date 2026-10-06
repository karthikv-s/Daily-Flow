import React from 'react';
import { NAV_ITEMS } from './dashboardConstants';
import styles from '../../pages/Dashboard.module.css';

export default function Sidebar({ activeNav, onSelectNav, onOpenChat, onOpenUpgrade }) {
  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>📅</div>
        <div>
          <div className={styles.brandName}>Daily Planner AI</div>
          <div className={styles.brandSub}>Plan Smarter. Achieve More.</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={
              styles.navItem + (activeNav === item.id ? ' ' + styles.navActive : '')
            }
            onClick={() => {
              if (item.id === 'ai') {
                onOpenChat();
              } else {
                onSelectNav(item.id);
              }
            }}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Upgrade to Pro Card */}
      <div className={styles.upgradeCard}>
        <div className={styles.upgradeTitle}>Upgrade to Pro ✨</div>
        <div className={styles.upgradeText}>
          Unlock advanced AI planning, custom themes, and unlimited habits.
        </div>
        <button
          className={styles.upgradeBtn}
          onClick={onOpenUpgrade}
        >
          Upgrade Now
        </button>
      </div>
    </aside>
  );
}
