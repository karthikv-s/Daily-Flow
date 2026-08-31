import { useState } from 'react';
import styles from './Views.module.css';

export default function MyDayView({ tasks, onToggleComplete, onDeleteTask, onAddTask, onOpenChat }) {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Personal');

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay   = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const todaysTasks = tasks.filter((t) => {
    const d = new Date(t.dueAt);
    return d >= startOfDay && d <= endOfDay;
  });

  const pending = todaysTasks.filter((t) => t.status === 'pending');
  const completed = todaysTasks.filter((t) => t.status === 'done');

  async function handleQuickAdd(e) {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const due = new Date();
    due.setHours(due.getHours() + 2, 0, 0, 0);

    await onAddTask({
      title: quickTitle.trim(),
      category: quickCategory,
      priority: 'medium',
      dueAt: due.toISOString(),
    });

    setQuickTitle('');
  }

  return (
    <div className={styles.viewContainer}>
      {/* Header Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <h2 className={styles.viewHeading}>🌤️ My Day</h2>
          <p className={styles.viewSub}>
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • Stay focused and conquer your day!
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statPill}>
            <span className={styles.statPillNum}>{pending.length}</span>
            <span className={styles.statPillLabel}>Pending</span>
          </div>
          <div className={styles.statPill} style={{ background: 'var(--green-bg)', borderColor: 'var(--green-dim)' }}>
            <span className={styles.statPillNum} style={{ color: 'var(--green)' }}>{completed.length}</span>
            <span className={styles.statPillLabel}>Completed</span>
          </div>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className={styles.quickAddForm}>
        <span style={{ fontSize: '1.2rem' }}>➕</span>
        <input
          type="text"
          placeholder="Add a task to My Day..."
          className={styles.quickAddInput}
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
        />
        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
          value={quickCategory}
          onChange={(e) => setQuickCategory(e.target.value)}
        >
          <option value="Work">💼 Work</option>
          <option value="Personal">🎯 Personal</option>
          <option value="Study">📚 Study</option>
          <option value="Health">💪 Health</option>
          <option value="Shopping">🛒 Shopping</option>
        </select>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!quickTitle.trim()}>
          Add
        </button>
      </form>

      {/* Main Task List for Today */}
      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>
          <span>🎯</span>
          <span>Today&apos;s Focus Tasks ({pending.length})</span>
        </h3>

        {pending.length === 0 ? (
          <div className={styles.emptyState}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>✨</div>
            <h4>You&apos;re all caught up for today!</h4>
            <p>Add a task above or ask the AI Planning Assistant to organize your day.</p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={onOpenChat}>
              🤖 Ask AI to Suggest Tasks
            </button>
          </div>
        ) : (
          <div className={styles.itemList}>
            {pending.map((t) => (
              <div key={t.id} className={styles.taskRow}>
                <button
                  className={styles.checkboxBtn}
                  onClick={() => onToggleComplete(t)}
                  title="Mark Complete"
                />
                <div className={styles.taskInfo}>
                  <div className={styles.taskTitle}>{t.title}</div>
                  <div className={styles.taskMeta}>
                    <span>⏰ {new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className={`badge ${t.priority === 'high' ? 'badge-red' : t.priority === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                      {t.priority}
                    </span>
                    <span>•</span>
                    <span>{t.category || 'General'}</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onDeleteTask(t.id)}>
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Today Section */}
      {completed.length > 0 && (
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <span>✅</span>
            <span>Completed Today ({completed.length})</span>
          </h3>
          <div className={styles.itemList}>
            {completed.map((t) => (
              <div key={t.id} className={styles.taskRow} style={{ opacity: 0.75 }}>
                <button
                  className={styles.checkboxBtn + ' ' + styles.checkboxDone}
                  onClick={() => onToggleComplete(t)}
                >
                  ✓
                </button>
                <div className={styles.taskInfo}>
                  <div className={styles.taskTitle} style={{ textDecoration: 'line-through' }}>{t.title}</div>
                  <div className={styles.taskMeta}>
                    <span>Completed</span>
                    <span>•</span>
                    <span>+10 pts</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onDeleteTask(t.id)}>
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
