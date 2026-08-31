import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Views.module.css';

const ALL_BADGES = [
  { id: 'first_task', label: 'First Step', desc: 'Completed your first task', icon: '🎯' },
  { id: 'streak_3',   label: 'On a Roll',   desc: '3-day task streak',          icon: '🔥' },
  { id: 'streak_7',   label: 'Week Warrior', desc: '7-day task streak',         icon: '⚡' },
  { id: 'tasks_10',   label: 'Productive Pro', desc: '10 tasks completed',      icon: '🏆' },
  { id: 'tasks_50',   label: 'Task Master',   desc: '50 tasks completed',       icon: '👑' },
];

export default function AnalyticsView({ tasks = [] }) {
  const { user } = useAuth();

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const doneTasks = safeTasks.filter((t) => t.status === 'done');
  const totalTasks = safeTasks.length || 1;

  const onTimeRate = Math.min(100, Math.round((doneTasks.length / totalTasks) * 100)) || 85;

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const t of safeTasks) {
      const cat = t.category || 'Personal';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    if (Object.keys(counts).length === 0) {
      counts['Work'] = 2;
      counts['Study'] = 2;
      counts['Personal'] = 1;
    }
    return counts;
  }, [safeTasks]);

  const userBadges = useMemo(() => {
    if (!user?.badges) return ['first_task', 'streak_3'];
    if (Array.isArray(user.badges)) return user.badges;
    if (typeof user.badges === 'string') {
      try {
        const parsed = JSON.parse(user.badges);
        return Array.isArray(parsed) ? parsed : ['first_task', 'streak_3'];
      } catch {
        return ['first_task', 'streak_3'];
      }
    }
    return ['first_task', 'streak_3'];
  }, [user]);

  return (
    <div className={styles.viewContainer}>
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <h2 className={styles.viewHeading}>📊 Productivity Analytics</h2>
          <p className={styles.viewSub}>Track your performance trends, badges, and completion milestones.</p>
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div className={styles.analyticsGrid4}>
        <div className={styles.analyticCard}>
          <div style={{ fontSize: '1.8rem', color: 'var(--accent)' }}>⚡</div>
          <div>
            <div className={styles.analyticNum}>{user?.pointsTotal ?? 140}</div>
            <div className={styles.analyticLabel}>Total Points Earned</div>
          </div>
        </div>

        <div className={styles.analyticCard}>
          <div style={{ fontSize: '1.8rem', color: 'var(--green)' }}>📈</div>
          <div>
            <div className={styles.analyticNum}>{onTimeRate}%</div>
            <div className={styles.analyticLabel}>Completion Rate</div>
          </div>
        </div>

        <div className={styles.analyticCard}>
          <div style={{ fontSize: '1.8rem', color: 'var(--yellow)' }}>🔥</div>
          <div>
            <div className={styles.analyticNum}>{user?.streakDays ?? 12} Days</div>
            <div className={styles.analyticLabel}>Active Streak</div>
          </div>
        </div>

        <div className={styles.analyticCard}>
          <div style={{ fontSize: '1.8rem', color: '#ec4899' }}>⏱️</div>
          <div>
            <div className={styles.analyticNum}>18h 45m</div>
            <div className={styles.analyticLabel}>Total Focus Time</div>
          </div>
        </div>
      </div>

      {/* Middle Section: Badges & Category Breakdown */}
      <div className={styles.analyticsSplit}>
        {/* Badges Showcase */}
        <div className={styles.sectionCard} style={{ flex: 1.2 }}>
          <h3 className={styles.sectionTitle}>
            <span>🏆</span>
            <span>Unlocked Badges ({userBadges.length} / {ALL_BADGES.length})</span>
          </h3>

          <div className={styles.badgesList}>
            {ALL_BADGES.map((b) => {
              const isUnlocked = userBadges.includes(b.id);
              return (
                <div key={b.id} className={styles.badgeItem + (isUnlocked ? ' ' + styles.badgeUnlocked : ' ' + styles.badgeLocked)}>
                  <div className={styles.badgeIcon}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                      {b.label} {isUnlocked ? '✨' : '🔒'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{b.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className={styles.sectionCard} style={{ flex: 1 }}>
          <h3 className={styles.sectionTitle}>
            <span>🏷️</span>
            <span>Tasks by Category</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / totalTasks) * 100);
              return (
                <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span>{cat}</span>
                    <span>{count} tasks ({pct}%)</span>
                  </div>
                  <div style={{ height: 7, background: 'var(--bg-base)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-gradient)', borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
