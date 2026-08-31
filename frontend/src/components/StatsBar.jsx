import styles from './StatsBar.module.css';

const BADGE_LABELS = {
  first_task:   '🌟 First Task',
  on_fire:      '🔥 On Fire',
  century:      '🏆 Century',
  speed_demon:  '⚡ Speed Demon',
  week_warrior: '📅 Week Warrior',
};

export default function StatsBar({ user, pendingCount, doneCount }) {
  if (!user) return null;

  return (
    <div className={styles.statsBar}>
      {/* Points + Streak */}
      <div className={styles.row}>
        <div className={styles.stat}>
          <span className={styles.statValue}>⚡ {user.pointsTotal}</span>
          <span className={styles.statLabel}>Points</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>🔥 {user.streakDays}</span>
          <span className={styles.statLabel}>Day Streak</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>✅ {doneCount}</span>
          <span className={styles.statLabel}>Done</span>
        </div>
      </div>

      {/* Progress bar */}
      {(pendingCount + doneCount) > 0 && (
        <div className={styles.progress}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.round((doneCount / (pendingCount + doneCount)) * 100)}%` }}
          />
        </div>
      )}

      {/* Badges */}
      {user.badges && user.badges.length > 0 && (
        <div className={styles.badges}>
          {user.badges.map((id) => (
            <span key={id} className={styles.badgePill} title={BADGE_LABELS[id]}>
              {BADGE_LABELS[id]?.split(' ')[0]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
