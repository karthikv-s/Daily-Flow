import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import styles from './Views.module.css';

const INITIAL_GOALS = [
  { id: 1, title: 'Launch Daily Planner AI', category: 'Project', progress: 75, targetDate: 'Sept 2026', color: 'var(--accent)' },
  { id: 2, title: 'Read 12 books this year', category: 'Personal', progress: 50, targetDate: 'Dec 2026', color: 'var(--green)' },
  { id: 3, title: 'Workout 4x a week', category: 'Health', progress: 60, targetDate: 'Ongoing', color: 'var(--yellow)' },
  { id: 4, title: 'Solve 150 LeetCode Problems', category: 'Career', progress: 40, targetDate: 'Oct 2026', color: '#ec4899' },
];

export default function GoalsView() {
  const { addToast } = useToast();
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('user_goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Career');
  const [newTargetDate, setNewTargetDate] = useState('');

  function saveGoals(updated) {
    setGoals(updated);
    localStorage.setItem('user_goals', JSON.stringify(updated));
  }

  function handleAdjustProgress(id, delta) {
    const updated = goals.map((g) => {
      if (g.id === id) {
        const next = Math.max(0, Math.min(100, g.progress + delta));
        if (next === 100 && g.progress < 100) {
          addToast({ title: 'Goal Achieved! 🏆🎉', message: `You completed "${g.title}"!`, type: 'badge', duration: 6000 });
        }
        return { ...g, progress: next };
      }
      return g;
    });
    saveGoals(updated);
  }

  function handleCreateGoal(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal = {
      id: Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      progress: 0,
      targetDate: newTargetDate.trim() || '2026',
      color: 'var(--accent)',
    };

    saveGoals([...goals, newGoal]);
    setShowAddModal(false);
    setNewTitle('');
    setNewTargetDate('');
    addToast({ title: 'Goal Added! 🎯', message: `Tracking "${newGoal.title}"`, type: 'success' });
  }

  function handleDeleteGoal(id) {
    saveGoals(goals.filter((g) => g.id !== id));
    addToast({ title: 'Goal removed', type: 'info' });
  }

  return (
    <div className={styles.viewContainer}>
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <h2 className={styles.viewHeading}>🎯 Goals & Milestones</h2>
          <p className={styles.viewSub}>Set ambitious targets, monitor your progress, and celebrate achievements.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add New Goal
        </button>
      </div>

      {/* Goals Grid */}
      <div className={styles.goalsGrid}>
        {goals.map((g) => (
          <div key={g.id} className={styles.goalCard}>
            <div className={styles.goalTopRow}>
              <span className="badge badge-purple">{g.category}</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Target: {g.targetDate}</span>
            </div>

            <h3 className={styles.goalTitle}>{g.title}</h3>

            <div className={styles.goalProgressInfo}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Progress</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: g.progress === 100 ? 'var(--green)' : 'var(--text-primary)' }}>
                {g.progress}% {g.progress === 100 ? '🏆' : ''}
              </span>
            </div>

            <div className={styles.goalProgressBarOuter}>
              <div
                className={styles.goalProgressBarInner}
                style={{ width: `${g.progress}%`, background: g.progress === 100 ? 'var(--green)' : g.color }}
              />
            </div>

            {/* Quick Adjust Buttons */}
            <div className={styles.goalControls}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleAdjustProgress(g.id, -10)}
                  disabled={g.progress <= 0}
                >
                  -10%
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleAdjustProgress(g.id, 10)}
                  disabled={g.progress >= 100}
                >
                  +10%
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAdjustProgress(g.id, 100 - g.progress)}
                  disabled={g.progress >= 100}
                >
                  Complete
                </button>
              </div>

              <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteGoal(g.id)} title="Delete Goal">
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard + ' glass-card animate-scale'} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>🎯 Add New Goal</h3>
            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master React & Node.js"
                  className="form-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  <option value="Career">💼 Career & Study</option>
                  <option value="Health">💪 Fitness & Health</option>
                  <option value="Personal">🎯 Personal Growth</option>
                  <option value="Finance">💰 Financial</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Completion Date</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 2026 or Dec 31"
                  className="form-input"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newTitle.trim()}>
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
