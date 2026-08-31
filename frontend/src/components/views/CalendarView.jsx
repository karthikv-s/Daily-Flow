import { useState, useMemo } from 'react';
import styles from './Views.module.css';

export default function CalendarView({ tasks, onOpenAddTask, onToggleComplete }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function handleToday() {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  }

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayIndex; i++) {
      arr.push({ type: 'empty', key: `empty-${i}` });
    }
    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toDateString();

      const dayTasks = tasks.filter((t) => {
        const td = new Date(t.dueAt);
        return td.toDateString() === dateStr;
      });

      arr.push({
        type: 'day',
        day,
        dateObj,
        tasks: dayTasks,
        key: `day-${day}`,
      });
    }
    return arr;
  }, [year, month, firstDayIndex, totalDays, tasks]);

  // Tasks for selected date
  const selectedDateTasks = useMemo(() => {
    const selStr = selectedDate.toDateString();
    return tasks.filter((t) => new Date(t.dueAt).toDateString() === selStr);
  }, [tasks, selectedDate]);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.viewContainer}>
      {/* Calendar Header */}
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <h2 className={styles.viewHeading}>🗓️ Interactive Calendar</h2>
          <p className={styles.viewSub}>Schedule and visualize your tasks across the month.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleToday}>
            Today
          </button>
          <button className="btn btn-primary btn-sm" onClick={onOpenAddTask}>
            + Add Task
          </button>
        </div>
      </div>

      <div className={styles.calendarLayoutGrid}>
        {/* Calendar Grid Box */}
        <div className={styles.sectionCard} style={{ flex: 1.5 }}>
          {/* Month Bar */}
          <div className={styles.calendarNav}>
            <button className="btn btn-ghost btn-sm" onClick={handlePrevMonth}>◀</button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{monthName}</h3>
            <button className="btn btn-ghost btn-sm" onClick={handleNextMonth}>▶</button>
          </div>

          {/* Weekday headers */}
          <div className={styles.weekdaysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className={styles.weekdayHeader}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className={styles.daysGrid}>
            {daysArray.map((cell) => {
              if (cell.type === 'empty') {
                return <div key={cell.key} className={styles.emptyDayCell} />;
              }

              const isSelected = cell.dateObj.toDateString() === selectedDate.toDateString();
              const isToday = cell.dateObj.toDateString() === new Date().toDateString();

              return (
                <div
                  key={cell.key}
                  className={
                    styles.dayCell +
                    (isSelected ? ' ' + styles.dayCellSelected : '') +
                    (isToday ? ' ' + styles.dayCellToday : '')
                  }
                  onClick={() => setSelectedDate(cell.dateObj)}
                >
                  <span className={styles.dayCellNumber}>{cell.day}</span>
                  {cell.tasks.length > 0 && (
                    <div className={styles.dayTasksIndicator}>
                      {cell.tasks.slice(0, 3).map((t, idx) => (
                        <div
                          key={idx}
                          className={styles.dayTaskDot}
                          style={{
                            background: t.status === 'done' ? 'var(--green)' : t.priority === 'high' ? 'var(--red)' : 'var(--accent)',
                          }}
                          title={t.title}
                        />
                      ))}
                      {cell.tasks.length > 3 && (
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>+{cell.tasks.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Drawer */}
        <div className={styles.sectionCard} style={{ flex: 1 }}>
          <h3 className={styles.sectionTitle}>
            <span>📅</span>
            <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </h3>

          {selectedDateTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No tasks scheduled for this day.</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={onOpenAddTask}
              >
                + Schedule Task
              </button>
            </div>
          ) : (
            <div className={styles.itemList}>
              {selectedDateTasks.map((t) => (
                <div key={t.id} className={styles.taskRow}>
                  <button
                    className={styles.checkboxBtn + (t.status === 'done' ? ' ' + styles.checkboxDone : '')}
                    onClick={() => onToggleComplete(t)}
                  >
                    {t.status === 'done' ? '✓' : ''}
                  </button>
                  <div className={styles.taskInfo}>
                    <div className={styles.taskTitle} style={t.status === 'done' ? { textDecoration: 'line-through' } : {}}>
                      {t.title}
                    </div>
                    <div className={styles.taskMeta}>
                      <span>⏰ {new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className={`badge ${t.priority === 'high' ? 'badge-red' : t.priority === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                        {t.priority}
                      </span>
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
