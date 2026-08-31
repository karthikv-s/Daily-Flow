import { useState } from 'react';
import PushToggle from '../PushToggle';
import { useToast } from '../../contexts/ToastContext';
import styles from './Views.module.css';

export default function RemindersView({ tasks }) {
  const { addToast } = useToast();
  const [remind15Min, setRemind15Min] = useState(true);
  const [remindOverdue, setRemindOverdue] = useState(true);
  const [remindMorning, setRemindMorning] = useState(true);

  function handleTestNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DailyFlow AI Reminder ⏰', {
        body: 'This is a live test notification! Your schedule alerts are working perfectly.',
        icon: '/vite.svg',
      });
      addToast({ title: 'Notification Sent! 🔔', message: 'Check your desktop/system notification area', type: 'success' });
    } else {
      addToast({ title: 'Enable Notifications First', message: 'Click "Enable Web Push" above', type: 'info' });
    }
  }

  const upcomingReminders = tasks
    .filter((t) => t.status === 'pending' && new Date(t.dueAt) > new Date())
    .slice(0, 5);

  return (
    <div className={styles.viewContainer}>
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <h2 className={styles.viewHeading}>🔔 Reminders & Notifications</h2>
          <p className={styles.viewSub}>Configure automated task alerts, morning plans, and OS push notifications.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleTestNotification}>
          🔔 Send Test Alert
        </button>
      </div>

      <div className={styles.analyticsSplit}>
        {/* Push & Alert Settings */}
        <div className={styles.sectionCard} style={{ flex: 1.2 }}>
          <h3 className={styles.sectionTitle}>
            <span>⚙️</span>
            <span>Notification Channels</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Native Push Toggle */}
            <div style={{ padding: '14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Web Push Notifications</span>
                <PushToggle />
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Receive background OS push alerts even when the browser tab is in the background.
              </p>
            </div>

            {/* Smart Cron Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>⏱️ 15-Minute Pre-Due Alert</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sends a reminder 15 minutes before a task is due</div>
                </div>
                <input
                  type="checkbox"
                  checked={remind15Min}
                  onChange={(e) => setRemind15Min(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>⚠️ Overdue Task Alert</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Alerts you immediately when a task passes its deadline</div>
                </div>
                <input
                  type="checkbox"
                  checked={remindOverdue}
                  onChange={(e) => setRemindOverdue(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>🌅 8:00 AM Morning AI Plan</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sends an AI daily summary with your high priority schedule</div>
                </div>
                <input
                  type="checkbox"
                  checked={remindMorning}
                  onChange={(e) => setRemindMorning(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Scheduled Reminders List */}
        <div className={styles.sectionCard} style={{ flex: 1 }}>
          <h3 className={styles.sectionTitle}>
            <span>⏰</span>
            <span>Upcoming Task Triggers ({upcomingReminders.length})</span>
          </h3>

          {upcomingReminders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No upcoming task deadlines scheduled.</p>
            </div>
          ) : (
            <div className={styles.itemList}>
              {upcomingReminders.map((t) => (
                <div key={t.id} className={styles.taskRow}>
                  <div className={styles.taskInfo}>
                    <div className={styles.taskTitle}>{t.title}</div>
                    <div className={styles.taskMeta}>
                      <span>Alert at: {new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{t.priority} priority</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
