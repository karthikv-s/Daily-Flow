import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import styles from './Views.module.css';

const DEFAULT_HABITS = [
  { id: 1, name: '💧 Drink 3L Water', category: 'Health', streak: 8, days: [true, true, true, true, false, true, true] },
  { id: 2, name: '🏃 Morning Workout', category: 'Fitness', streak: 5, days: [true, true, true, true, true, false, false] },
  { id: 3, name: '💻 Code 1 Hour Daily', category: 'Career', streak: 14, days: [true, true, true, true, true, true, true] },
  { id: 4, name: '📖 Read 20 Pages', category: 'Growth', streak: 3, days: [false, true, true, true, false, true, false] },
  { id: 5, name: '🧘 10-min Meditation', category: 'Wellness', streak: 6, days: [true, true, true, false, true, true, true] },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Helper to get ISO Week String (e.g. "2026-W36")
function getWeekKey(d = new Date()) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${weekNum}`;
}

// Get the dates of current Mon - Sun
function getCurrentWeekDates() {
  const now = new Date();
  const currentDay = (now.getDay() + 6) % 7; // Mon = 0, Sun = 6
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDay);

  return WEEK_DAYS.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      name,
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: d.toDateString() === now.toDateString(),
    };
  });
}

export default function HabitsView() {
  const { addToast } = useToast();
  const weekKey = useMemo(() => getWeekKey(new Date()), []);
  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  const [habits, setHabits] = useState(() => {
    const savedHabits = localStorage.getItem('user_habits');
    const savedWeekKey = localStorage.getItem('user_habits_week_key');

    const parsedHabits = savedHabits ? JSON.parse(savedHabits) : DEFAULT_HABITS;

    // Automatic Weekly Refresh: If new week has started, reset all days to [false x 7]
    if (savedWeekKey && savedWeekKey !== weekKey) {
      const refreshed = parsedHabits.map((h) => ({
        ...h,
        days: [false, false, false, false, false, false, false],
      }));
      localStorage.setItem('user_habits', JSON.stringify(refreshed));
      localStorage.setItem('user_habits_week_key', weekKey);
      return refreshed;
    }

    if (!savedWeekKey) {
      localStorage.setItem('user_habits_week_key', weekKey);
    }

    return parsedHabits;
  });

  // Check on mount if week rolled over while tab was open
  useEffect(() => {
    const currentKey = getWeekKey(new Date());
    const storedKey = localStorage.getItem('user_habits_week_key');

    if (storedKey && storedKey !== currentKey) {
      setHabits((prev) => {
        const refreshed = prev.map((h) => ({
          ...h,
          days: [false, false, false, false, false, false, false],
        }));
        localStorage.setItem('user_habits', JSON.stringify(refreshed));
        localStorage.setItem('user_habits_week_key', currentKey);
        return refreshed;
      });
      addToast({
        title: 'New Week Started! 🌅',
        message: 'Your weekly habit check-in sheet has been refreshed for the new week.',
        type: 'info',
        duration: 5000,
      });
    }
  }, [addToast]);

  const [showModal, setShowModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newCategory, setNewCategory] = useState('Health');

  function saveHabits(updated) {
    setHabits(updated);
    localStorage.setItem('user_habits', JSON.stringify(updated));
    localStorage.setItem('user_habits_week_key', weekKey);
  }

  function handleToggleDay(habitId, dayIndex) {
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const newDays = [...h.days];
        const prevVal = newDays[dayIndex];
        newDays[dayIndex] = !prevVal;
        const newStreak = !prevVal ? h.streak + 1 : Math.max(0, h.streak - 1);

        if (!prevVal) {
          addToast({ title: 'Habit Logged! ⚡', message: `Checked in for ${WEEK_DAYS[dayIndex]}`, type: 'success' });
        }
        return { ...h, days: newDays, streak: newStreak };
      }
      return h;
    });
    saveHabits(updated);
  }

  function handleManualWeekReset() {
    const resetHabits = habits.map((h) => ({
      ...h,
      days: [false, false, false, false, false, false, false],
    }));
    saveHabits(resetHabits);
    addToast({ title: 'Weekly Habits Reset 🔄', message: 'Cleared check-ins for the current week', type: 'info' });
  }

  function handleAddHabit(e) {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newH = {
      id: Date.now(),
      name: newHabitName.trim(),
      category: newCategory,
      streak: 0,
      days: [false, false, false, false, false, false, false],
    };

    saveHabits([...habits, newH]);
    setShowModal(false);
    setNewHabitName('');
    addToast({ title: 'New Habit Added! 🔄', message: `Tracking "${newH.name}"`, type: 'success' });
  }

  function handleDeleteHabit(id) {
    saveHabits(habits.filter((h) => h.id !== id));
    addToast({ title: 'Habit deleted', type: 'info' });
  }

  // Week date range label
  const firstDate = weekDates[0];
  const lastDate = weekDates[6];
  const weekLabel = `${firstDate.month} ${firstDate.dayNum} – ${lastDate.month} ${lastDate.dayNum}`;

  return (
    <div className={styles.viewContainer}>
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <h2 className={styles.viewHeading}>🔄 Weekly Habit Tracker</h2>
          <p className={styles.viewSub}>
            Week of {weekLabel} • Auto-refreshes every Monday. Build consistency!
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleManualWeekReset} title="Manually reset weekly check-ins">
            ↺ Reset Week
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Habit
          </button>
        </div>
      </div>

      {/* Habits Table / List */}
      <div className={styles.sectionCard}>
        <div className={styles.habitTableHeader}>
          <div style={{ flex: 1.5, fontWeight: 800, fontSize: '0.86rem' }}>Habit & Category</div>
          <div className={styles.habitDaysRow}>
            {weekDates.map((d, i) => (
              <div
                key={i}
                className={styles.habitDayHeaderCol}
                style={d.isToday ? { color: 'var(--accent)', fontWeight: 800 } : {}}
              >
                <div>{d.name}</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>{d.dayNum}</div>
              </div>
            ))}
          </div>
          <div style={{ width: 80, textAlign: 'center', fontWeight: 800, fontSize: '0.86rem' }}>Streak</div>
          <div style={{ width: 40 }} />
        </div>

        <div className={styles.itemList}>
          {habits.map((h) => (
            <div key={h.id} className={styles.habitRow}>
              <div style={{ flex: 1.5 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{h.name}</div>
                <span className="badge badge-purple" style={{ marginTop: 4 }}>{h.category}</span>
              </div>

              {/* 7 Check-in buttons */}
              <div className={styles.habitDaysRow}>
                {h.days.map((checked, dayIdx) => (
                  <button
                    key={dayIdx}
                    type="button"
                    className={styles.habitCheckBtn + (checked ? ' ' + styles.habitCheckBtnActive : '')}
                    onClick={() => handleToggleDay(h.id, dayIdx)}
                    title={`Check in for ${WEEK_DAYS[dayIdx]}`}
                  >
                    {checked ? '✓' : ''}
                  </button>
                ))}
              </div>

              {/* Streak */}
              <div style={{ width: 80, textAlign: 'center', fontWeight: 800, color: 'var(--accent)', fontSize: '0.9rem' }}>
                🔥 {h.streak}d
              </div>

              {/* Delete */}
              <div style={{ width: 40, textAlign: 'right' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteHabit(h.id)} title="Delete Habit">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Habit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalCard + ' glass-card animate-scale'} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>🔄 Add New Habit</h3>
            <form onSubmit={handleAddHabit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g. 🧘 10 min Daily Meditation"
                  className="form-input"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  <option value="Health">💪 Fitness & Health</option>
                  <option value="Career">💻 Career & Coding</option>
                  <option value="Growth">📖 Learning & Reading</option>
                  <option value="Wellness">🧘 Mindfulness</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newHabitName.trim()}>
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
