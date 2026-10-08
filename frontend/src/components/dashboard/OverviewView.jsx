import React, { useState, useMemo } from 'react';
import { CATEGORY_DOT_COLORS } from './dashboardConstants';
import styles from '../../pages/Dashboard.module.css';

export default function OverviewView({
  tasks,
  loading,
  user,
  searchQuery,
  onToggleComplete,
  onDeleteTask,
  onOpenAddTask,
  onOpenChat,
  onNavigate,
}) {
  const [activeTab, setActiveTab] = useState('all'); // all | pending | done

  // Date filtering for Today's tasks
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const todaysTasks = useMemo(() => {
    return tasks.filter((t) => {
      const d = new Date(t.dueAt);
      return d >= startOfDay && d <= endOfDay;
    });
  }, [tasks, startOfDay, endOfDay]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const todayTaskCount = todaysTasks.length || tasks.length || 0;
  const completedTodayCount = todaysTasks.filter((t) => t.status === 'done').length || doneCount;

  // Task list display filter
  const displayedTasks = useMemo(() => {
    let filtered = tasks;

    if (activeTab === 'pending') {
      filtered = filtered.filter((t) => t.status === 'pending');
    } else if (activeTab === 'done') {
      filtered = filtered.filter((t) => t.status === 'done');
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [tasks, activeTab, searchQuery]);

  // Dynamic Progress percentage
  const totalRelevant = tasks.length || 1;
  const progressPercent = Math.min(100, Math.round((doneCount / totalRelevant) * 100)) || 0;

  // Editable Focus Time (persisted in localStorage)
  const [focusTime, setFocusTime] = useState(() => {
    return localStorage.getItem('dailyflow_focus_time') || '2h 30m';
  });
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [tempFocusInput, setTempFocusInput] = useState(focusTime);

  function handleSaveFocus(e) {
    if (e) e.preventDefault();
    const clean = tempFocusInput.trim() || '2h 30m';
    setFocusTime(clean);
    localStorage.setItem('dailyflow_focus_time', clean);
    setIsEditingFocus(false);
  }

  return (
    <>
      {/* 4 Metric Stats Cards */}
      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}>
            📑
          </div>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>{todayTaskCount}</div>
            <div className={styles.metricLabel}>Tasks Today</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
            ✅
          </div>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>{completedTodayCount}</div>
            <div className={styles.metricLabel}>Completed</div>
          </div>
        </div>

        <div
          className={styles.metricCard + (!isEditingFocus ? ' ' + styles.metricCardInteractive : '')}
          onClick={() => {
            if (!isEditingFocus) {
              setTempFocusInput(focusTime);
              setIsEditingFocus(true);
            }
          }}
          title={!isEditingFocus ? 'Click to edit Focus Time' : undefined}
        >
          <div className={styles.metricIconWrapper} style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>
            ⏱️
          </div>
          <div className={styles.metricInfo} style={{ flex: 1 }}>
            {isEditingFocus ? (
              <form onSubmit={handleSaveFocus} className={styles.focusEditForm} onClick={(e) => e.stopPropagation()}>
                <div className={styles.focusInputRow}>
                  <input
                    type="text"
                    className={styles.focusInput}
                    value={tempFocusInput}
                    onChange={(e) => setTempFocusInput(e.target.value)}
                    placeholder="e.g. 3h 15m"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsEditingFocus(false);
                    }}
                  />
                  <button type="submit" className={styles.focusSaveBtn}>Save</button>
                  <button type="button" className={styles.focusCancelBtn} onClick={() => setIsEditingFocus(false)}>✕</button>
                </div>
                <div className={styles.focusChipsRow}>
                  <button type="button" className={styles.focusChip} onClick={() => setTempFocusInput('1h')}>1h</button>
                  <button type="button" className={styles.focusChip} onClick={() => setTempFocusInput('2h 30m')}>2h 30m</button>
                  <button type="button" className={styles.focusChip} onClick={() => setTempFocusInput('4h')}>4h</button>
                  <button type="button" className={styles.focusChip} onClick={() => setTempFocusInput('6h')}>6h</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={styles.metricValue}>{focusTime}</span>
                  <span className={styles.editPencilIcon} title="Edit focus time">✏️</span>
                </div>
                <div className={styles.metricLabel}>Focus Time (Click to edit)</div>
              </>
            )}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrapper} style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
            🔥
          </div>
          <div className={styles.metricInfo}>
            <div className={styles.metricValue}>{user?.streakDays ?? 0}</div>
            <div className={styles.metricLabel}>Day Streak</div>
          </div>
        </div>
      </section>

      {/* 3-Column Middle Section */}
      <section className={styles.contentGrid}>
        {/* Column 1: Today's Schedule (Real Tasks Timeline) */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <span>🗓️</span>
              <span>Today&apos;s Schedule</span>
            </h2>
          </div>

          <div className={styles.timelineList}>
            {(() => {
              const today = new Date();
              const todayTasks = tasks
                .filter((t) => {
                  const d = new Date(t.dueAt);
                  return (
                    d.getFullYear() === today.getFullYear() &&
                    d.getMonth() === today.getMonth() &&
                    d.getDate() === today.getDate()
                  );
                })
                .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

              if (todayTasks.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>📋</div>
                    <div>No tasks scheduled for today.</div>
                    <div style={{ marginTop: 6 }}>Click <strong>+ Add Task</strong> to plan your day!</div>
                  </div>
                );
              }

              return todayTasks.map((t) => {
                const cat = (t.category || 'default').toLowerCase();
                const colors = CATEGORY_DOT_COLORS[cat] || CATEGORY_DOT_COLORS.default;
                const dueTime = new Date(t.dueAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={t.id} className={styles.timelineItem}>
                    <div className={styles.timelineTime}>
                      <span className={styles.timelineStart}>{dueTime}</span>
                      <span className={styles.timelineEnd}>{t.status === 'done' ? '✓' : '·'}</span>
                    </div>
                    <div className={styles.timelineDot} style={{ background: colors.dot }} />
                    <div className={styles.timelineCard} style={{ background: colors.bg }}>
                      <div
                        className={styles.timelineTitle}
                        style={{
                          textDecoration: t.status === 'done' ? 'line-through' : 'none',
                          opacity: t.status === 'done' ? 0.6 : 1,
                        }}
                      >
                        {t.title}
                      </div>
                      <div className={styles.timelineMeta}>
                        <span>🏷️</span>
                        <span>{t.category || 'General'}</span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Column 2: My Tasks */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <span>☑️</span>
              <span>My Tasks</span>
            </h2>
            <button
              id="dashboard-add-task-btn"
              className="btn btn-primary btn-sm"
              onClick={onOpenAddTask}
            >
              + Add Task
            </button>
          </div>

          <div className={styles.taskTabs}>
            <button
              className={styles.taskTab + (activeTab === 'all' ? ' ' + styles.taskTabActive : '')}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={styles.taskTab + (activeTab === 'pending' ? ' ' + styles.taskTabActive : '')}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={styles.taskTab + (activeTab === 'done' ? ' ' + styles.taskTabActive : '')}
              onClick={() => setActiveTab('done')}
            >
              Completed
            </button>
          </div>

          <div className={styles.taskList}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <span className="spinner" />
              </div>
            ) : displayedTasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 0', fontSize: '0.85rem' }}>
                ✨ No tasks found in this view. Click <strong>+ Add Task</strong> above!
              </div>
            ) : (
              displayedTasks.map((t) => {
                const isDone = t.status === 'done';
                const dueTime = new Date(t.dueAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={t.id} className={styles.taskItem}>
                    <div className={styles.taskLeft}>
                      <button
                        className={styles.checkboxBtn + (isDone ? ' ' + styles.checkboxBtnDone : '')}
                        onClick={() => onToggleComplete(t)}
                        title={isDone ? 'Mark Pending' : 'Mark Complete'}
                      >
                        {isDone ? '✓' : ''}
                      </button>
                      <span className={styles.taskTitleText + (isDone ? ' ' + styles.taskTitleDone : '')}>
                        {t.title}
                      </span>
                    </div>

                    <div className={styles.taskRight}>
                      {t.category && (
                        <span
                          className={`badge ${
                            t.category.toLowerCase().includes('work')
                              ? 'badge-purple'
                              : t.category.toLowerCase().includes('health')
                              ? 'badge-yellow'
                              : 'badge-green'
                          }`}
                        >
                          {t.category}
                        </span>
                      )}
                      <span className={styles.taskTimeLabel}>{dueTime}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '3px 6px', fontSize: '0.75rem' }}
                        onClick={() => onDeleteTask(t.id)}
                        title="Delete task"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            className={styles.viewAllLink}
            onClick={() => onNavigate('tasks')}
          >
            View All Tasks →
          </button>
        </div>

        {/* Column 3: Right Panel (AI & Widgets) */}
        <div className={styles.rightWidgets}>
          {/* AI Suggestions */}
          <div className={styles.aiWidget}>
            <div className={styles.aiHeader}>
              <div className={styles.aiTitle}>
                <span>✨</span>
                <span>AI Suggestions</span>
              </div>
              <div className={styles.aiRobotAvatar}>🤖</div>
            </div>

            {tasks.length === 0 ? (
              <div className={styles.aiBubble}>
                <div className={styles.aiBubbleText}>
                  👋 Welcome! Add your first task to get personalized AI planning suggestions and schedule recommendations.
                </div>
                <div className={styles.aiActions}>
                  <button
                    className={styles.aiPrimaryBtn}
                    onClick={onOpenAddTask}
                  >
                    + Add First Task
                  </button>
                  <button
                    className={styles.aiSecondaryBtn}
                    onClick={onOpenChat}
                  >
                    Ask Gemini
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.aiBubble}>
                  <div className={styles.aiBubbleText}>
                    {pendingCount > 0
                      ? `You have ${pendingCount} pending task${pendingCount > 1 ? 's' : ''}. Want me to help prioritize?`
                      : `Great job! All your tasks are done. Want to plan tomorrow?`}
                  </div>
                  <div className={styles.aiActions}>
                    <button
                      className={styles.aiPrimaryBtn}
                      onClick={onOpenChat}
                    >
                      Plan with Gemini
                    </button>
                    <button
                      className={styles.aiSecondaryBtn}
                      onClick={onOpenAddTask}
                    >
                      + Add Task
                    </button>
                  </div>
                </div>

                <div className={styles.aiTipsList}>
                  {tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length > 0 && (
                    <div className={styles.aiTipItem} onClick={onOpenChat}>
                      <span>🔴 You have high priority tasks pending</span>
                      <span>›</span>
                    </div>
                  )}
                  <div className={styles.aiTipItem} onClick={onOpenChat}>
                    <span>🎯 Ask Gemini to optimize your schedule</span>
                    <span>›</span>
                  </div>
                  <div className={styles.aiTipItem} onClick={() => onNavigate('analytics')}>
                    <span>📊 View your productivity analytics</span>
                    <span>›</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Goals Widget */}
          <div className={styles.goalsWidget}>
            <div className={styles.panelHeader}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🎯</span>
                <span>Goals</span>
              </div>
              <span
                style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => onNavigate('goals')}
              >
                View All
              </span>
            </div>

            {(() => {
              let goals = [];
              try {
                goals = JSON.parse(localStorage.getItem('user_goals') || '[]');
              } catch {}

              if (goals.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <div>No goals yet.</div>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onNavigate('goals')}>
                      Set a Goal →
                    </button>
                  </div>
                );
              }
              return goals.slice(0, 2).map((g, i) => (
                <div key={g.id || i} className={styles.goalItem}>
                  <div className={styles.goalHeader}>
                    <span>{g.title}</span>
                    <span className={styles.goalPercent}>{g.progress || 0}%</span>
                  </div>
                  <div className={styles.goalProgressBar}>
                    <div className={styles.goalProgressFill} style={{ width: `${g.progress || 0}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Daily Progress Widget */}
          <div className={styles.progressWidget}>
            <div className={styles.panelHeader}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📊</span>
                <span>Daily Progress</span>
              </div>
              <span
                style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => onNavigate('analytics')}
              >
                View Analytics
              </span>
            </div>

            <div className={styles.progressBody}>
              <div
                className={styles.progressRing}
                style={{ '--progress-deg': `${progressPercent}%` }}
              >
                <div className={styles.progressRingInner}>
                  {progressPercent}%
                </div>
              </div>

              <div>
                <div className={styles.progressTextHeading}>Great Progress!</div>
                <div className={styles.progressTextSub}>
                  You&apos;re on track to achieve your daily targets.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Banner */}
      <section className={styles.focusBanner}>
        <div className={styles.focusLeft}>
          <div className={styles.focusTitle}>
            <span>🎯</span>
            <span>Today&apos;s Focus</span>
          </div>
          <div className={styles.focusQuote}>
            &ldquo;Discipline is choosing between what you want now and what you want most.&rdquo;
          </div>

          {/* Real today's task completion progress */}
          {(() => {
            const today = new Date();
            const todayTasks = tasks.filter((t) => {
              const d = new Date(t.dueAt);
              return (
                d.getFullYear() === today.getFullYear() &&
                d.getMonth() === today.getMonth() &&
                d.getDate() === today.getDate()
              );
            });
            const totalToday = todayTasks.length;
            const doneToday = todayTasks.filter((t) => t.status === 'done').length;
            const pct = totalToday === 0 ? 0 : Math.round((doneToday / totalToday) * 100);

            return (
              <div className={styles.focusGoalBox}>
                <div className={styles.focusGoalHeader}>
                  <span>Today&apos;s Tasks</span>
                  <span>{doneToday} / {totalToday} completed</span>
                </div>
                <div className={styles.focusGoalProgress}>
                  <div className={styles.focusGoalFill} style={{ width: `${pct}%` }} />
                </div>
                {totalToday === 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Add tasks to track your daily progress
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className={styles.focusArt}>
          💻🚀
        </div>
      </section>
    </>
  );
}
