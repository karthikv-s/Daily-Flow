import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTasks, updateTask, deleteTask, createTask } from '../api';
import TaskForm from '../components/TaskForm';
import ChatPanel from '../components/ChatPanel';
import ProfileModal from '../components/ProfileModal';

// Sidebar Sub-Views
import MyDayView from '../components/views/MyDayView';
import TasksView from '../components/views/TasksView';
import CalendarView from '../components/views/CalendarView';
import GoalsView from '../components/views/GoalsView';
import HabitsView from '../components/views/HabitsView';
import AnalyticsView from '../components/views/AnalyticsView';
import RemindersView from '../components/views/RemindersView';
import NotesView from '../components/views/NotesView';

import styles from './Dashboard.module.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'my_day',    label: 'My Day',    icon: '🌤️' },
  { id: 'tasks',     label: 'Tasks',     icon: '☑️' },
  { id: 'calendar',  label: 'Calendar',  icon: '🗓️' },
  { id: 'goals',     label: 'Goals',     icon: '🎯' },
  { id: 'habits',    label: 'Habits',    icon: '🔄' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'ai',        label: 'AI Assistant', icon: '🤖' },
  { id: 'reminders', label: 'Reminders', icon: '🔔' },
  { id: 'notes',     label: 'Notes',     icon: '📝' },
];

const CATEGORY_DOT_COLORS = {
  work:     { dot: '#8b5cf6', bg: 'var(--purple-bg)' },
  study:    { dot: '#3b82f6', bg: 'var(--blue-dim)' },
  health:   { dot: '#10b981', bg: 'var(--green-bg)' },
  personal: { dot: '#f59e0b', bg: 'var(--yellow-bg)' },
  default:  { dot: '#ec4899', bg: 'var(--accent-dim)' },
};

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme, isDark } = useTheme();

  const [activeNav, setActiveNavRaw] = useState('dashboard');
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const mainRef = useRef(null);

  // Navigate to a view and always scroll to top
  function setActiveNav(id) {
    setActiveNavRaw(id);
    setTimeout(() => {
      if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]     = useState('all'); // all | pending | done
  const [showForm, setShowForm]       = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [chatOpen, setChatOpen]       = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await getTasks();
      setTasks(res.data);
    } catch {
      addToast({ title: 'Failed to load tasks', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Greeting & Date format
  const now = new Date();
  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [now]);

  const userName = useMemo(() => {
    const storedName = localStorage.getItem('user_display_name');
    if (storedName) return storedName;
    if (!user?.email) return 'Karthik';
    const namePart = user.email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }, [user]);

  const userAvatarEmoji = useMemo(() => {
    return localStorage.getItem('user_avatar_img') || localStorage.getItem('user_avatar_emoji') || '🧑‍💻';
  }, [showProfileModal]);



  const dateString = useMemo(() => {
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [now]);

  // Filtering for Today's tasks & Status
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay   = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const todaysTasks = useMemo(() => {
    return tasks.filter((t) => {
      const d = new Date(t.dueAt);
      return d >= startOfDay && d <= endOfDay;
    });
  }, [tasks, startOfDay, endOfDay]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const doneCount    = tasks.filter((t) => t.status === 'done').length;
  const todayTaskCount = todaysTasks.length || tasks.length || 6;
  const completedTodayCount = todaysTasks.filter((t) => t.status === 'done').length || doneCount;

  // Task list display filter
  const displayedTasks = useMemo(() => {
    let filtered = tasks;

    if (activeTab === 'pending') {
      filtered = filtered.filter((t) => t.status === 'pending');
    } else if (activeTab === 'done') {
      filtered = filtered.filter((t) => t.status === 'done');
    }

    if (searchQuery.trim()) {
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
  const progressPercent = Math.min(100, Math.round((doneCount / totalRelevant) * 100)) || 60;

  // Task Completion Handler
  async function handleToggleComplete(task) {
    const isDone = task.status === 'done';
    const newStatus = isDone ? 'pending' : 'done';

    // ⚡ Optimistic update: instantly flip the UI without waiting for the server
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : null } : t))
    );

    try {
      const res = await updateTask(task.id, { status: newStatus });
      const { pointsAwarded, newBadges } = res.data;

      // Sync with actual server response data
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...res.data.task } : t))
      );

      if (!isDone) {
        if (pointsAwarded > 0) {
          addToast({
            title: `+${pointsAwarded} Points! ⚡`,
            message: 'Task completed on time!',
            type: 'success',
          });
        } else {
          addToast({
            title: 'Task Completed',
            message: 'Marked done (past deadline)',
            type: 'info',
          });
        }

        if (newBadges && newBadges.length > 0) {
          for (const badge of newBadges) {
            addToast({
              title: 'Badge Unlocked! 🏆',
              message: badge.label,
              type: 'badge',
              duration: 6000,
            });
          }
        }
      }
      refreshUser();
    } catch {
      // Revert the optimistic update on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      addToast({ title: 'Could not update task status', type: 'error' });
    }
  }


  // Delete Task
  async function handleDelete(id) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      addToast({ title: 'Task deleted', type: 'info' });
    } catch {
      addToast({ title: 'Could not delete task', type: 'error' });
    }
  }

  // Direct Add Task Helper
  async function handleDirectAddTask(taskData) {
    try {
      const res = await createTask(taskData);
      setTasks((prev) => [res.data, ...prev]);
      addToast({ title: 'Task Created! ✨', message: `Added "${taskData.title}"`, type: 'success' });
    } catch {
      addToast({ title: 'Failed to create task', type: 'error' });
    }
  }

  // Quick schedule from AI suggestion
  async function handleScheduleAiSuggestion() {
    try {
      const due = new Date();
      due.setHours(14, 0, 0, 0); // 2:00 PM today
      if (due < new Date()) due.setDate(due.getDate() + 1);

      const res = await createTask({
        title: 'Project Development Session',
        description: 'Focus block suggested by DailyFlow AI',
        dueAt: due.toISOString(),
        priority: 'high',
        category: 'Work',
      });

      setTasks((prev) => [res.data, ...prev]);
      addToast({
        title: 'Task Scheduled! 🤖',
        message: 'Scheduled "Project Development" for 2:00 PM',
        type: 'success',
      });
    } catch {
      addToast({ title: 'Could not schedule task', type: 'error' });
    }
  }

  return (
    <div className={styles.layout}>
      {/* ── Left Sidebar ───────────────────────────────────── */}
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
                  setChatOpen(true);
                } else {
                  setActiveNav(item.id);
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
            onClick={() => setShowUpgradeModal(true)}
          >
            Upgrade Now
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ────────────────────────────────────── */}
      <main ref={mainRef} className={styles.main}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div>
            <h1 className={styles.greetingTitle}>
              {greeting}, <span className={styles.greetingName}>{userName}</span>! 👋
            </h1>
            <p className={styles.greetingSub}>Let&apos;s make today productive and amazing.</p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.datePill}>
              <span>📅</span>
              <span>{dateString}</span>
            </div>

            <div className={styles.searchBox}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search tasks..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Top-Right Theme Selector */}
            <div className={styles.themeHeaderSelector}>
              <span>{isDark ? '🌙' : '☀️'}</span>
              <select
                className={styles.themeHeaderSelect}
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                id="top-right-theme-select"
                aria-label="Color Theme"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>

            <button
              className={styles.iconBtn}
              onClick={() => setActiveNav('reminders')}
              title="Notifications & Reminders"
            >
              🔔
              <span className={styles.notifBadge}>3</span>
            </button>

            <div
              className={styles.userAvatar}
              onClick={() => setShowProfileModal(true)}
              title="My Profile & Settings"
              style={userAvatarEmoji.startsWith('data:') ? { padding: 0, overflow: 'hidden', background: 'transparent', border: '2px solid var(--accent)' } : {}}
            >
              {userAvatarEmoji.startsWith('data:')
                ? <img src={userAvatarEmoji} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : userAvatarEmoji
              }
            </div>
          </div>
        </header>

        {/* ── DYNAMIC VIEW SWITCHER ───────────────────────── */}
        {activeNav === 'my_day' && (
          <MyDayView
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDelete}
            onAddTask={handleDirectAddTask}
            onOpenChat={() => setChatOpen(true)}
          />
        )}

        {activeNav === 'tasks' && (
          <TasksView
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDelete}
            onOpenAddTask={() => { setEditingTask(null); setShowForm(true); }}
            onEditTask={(t) => { setEditingTask(t); setShowForm(true); }}
          />
        )}

        {activeNav === 'calendar' && (
          <CalendarView
            tasks={tasks}
            onOpenAddTask={() => { setEditingTask(null); setShowForm(true); }}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {activeNav === 'goals' && <GoalsView />}

        {activeNav === 'habits' && <HabitsView />}

        {activeNav === 'analytics' && <AnalyticsView tasks={tasks} />}

        {activeNav === 'reminders' && <RemindersView tasks={tasks} />}

        {activeNav === 'notes' && <NotesView />}

        {/* Default Dashboard Overview (activeNav === 'dashboard') */}
        {activeNav === 'dashboard' && (
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

              <div className={styles.metricCard}>
                <div className={styles.metricIconWrapper} style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>
                  ⏱️
                </div>
                <div className={styles.metricInfo}>
                  <div className={styles.metricValue}>2h 30m</div>
                  <div className={styles.metricLabel}>Focus Time</div>
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
                      .filter(t => {
                        const d = new Date(t.dueAt);
                        return d.getFullYear() === today.getFullYear() &&
                               d.getMonth() === today.getMonth() &&
                               d.getDate() === today.getDate();
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

                    return todayTasks.map((t, idx) => {
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
                            <div className={styles.timelineTitle} style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none', opacity: t.status === 'done' ? 0.6 : 1 }}>{t.title}</div>
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
                    onClick={() => { setEditingTask(null); setShowForm(true); }}
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
                              onClick={() => handleToggleComplete(t)}
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
                              <span className={`badge ${t.category.toLowerCase().includes('work') ? 'badge-purple' : t.category.toLowerCase().includes('health') ? 'badge-yellow' : 'badge-green'}`}>
                                {t.category}
                              </span>
                            )}
                            <span className={styles.taskTimeLabel}>{dueTime}</span>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '3px 6px', fontSize: '0.75rem' }}
                              onClick={() => handleDelete(t.id)}
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
                  onClick={() => setActiveNav('tasks')}
                >
                  View All Tasks →
                </button>
              </div>

              {/* Column 3: Right Panel (AI & Widgets) */}
              <div className={styles.rightWidgets}>
                {/* AI Suggestions - only shown when user has tasks */}
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
                          onClick={() => { setEditingTask(null); setShowForm(true); }}
                        >
                          + Add First Task
                        </button>
                        <button
                          className={styles.aiSecondaryBtn}
                          onClick={() => setChatOpen(true)}
                        >
                          Ask Gemini
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.aiBubble}>
                        <div className={styles.aiBubbleText}>
                          {tasks.filter(t => t.status === 'pending').length > 0
                            ? `You have ${tasks.filter(t => t.status === 'pending').length} pending task${tasks.filter(t => t.status === 'pending').length > 1 ? 's' : ''}. Want me to help prioritize?`
                            : `Great job! All your tasks are done. Want to plan tomorrow?`
                          }
                        </div>
                        <div className={styles.aiActions}>
                          <button
                            className={styles.aiPrimaryBtn}
                            onClick={() => setChatOpen(true)}
                          >
                            Plan with Gemini
                          </button>
                          <button
                            className={styles.aiSecondaryBtn}
                            onClick={() => { setEditingTask(null); setShowForm(true); }}
                          >
                            + Add Task
                          </button>
                        </div>
                      </div>

                      <div className={styles.aiTipsList}>
                        {tasks.filter(t => t.priority === 'high' && t.status !== 'done').length > 0 && (
                          <div className={styles.aiTipItem} onClick={() => setChatOpen(true)}>
                            <span>🔴 You have high priority tasks pending</span>
                            <span>›</span>
                          </div>
                        )}
                        <div className={styles.aiTipItem} onClick={() => setChatOpen(true)}>
                          <span>🎯 Ask Gemini to optimize your schedule</span>
                          <span>›</span>
                        </div>
                        <div className={styles.aiTipItem} onClick={() => setActiveNav('analytics')}>
                          <span>📊 View your productivity analytics</span>
                          <span>›</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Goals - pulled from localStorage */}
                <div className={styles.goalsWidget}>
                  <div className={styles.panelHeader}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🎯</span>
                      <span>Goals</span>
                    </div>
                    <span
                      style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setActiveNav('goals')}
                    >
                      View All
                    </span>
                  </div>

                  {(() => {
                    let goals = [];
                    try { goals = JSON.parse(localStorage.getItem('user_goals') || '[]'); } catch {}
                    if (goals.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <div>No goals yet.</div>
                          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setActiveNav('goals')}>Set a Goal →</button>
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

                {/* Daily Progress */}
                <div className={styles.progressWidget}>
                  <div className={styles.panelHeader}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📊</span>
                      <span>Daily Progress</span>
                    </div>
                    <span
                      style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setActiveNav('analytics')}
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
                  const todayTasks = tasks.filter(t => {
                    const d = new Date(t.dueAt);
                    return d.getFullYear() === today.getFullYear() &&
                           d.getMonth() === today.getMonth() &&
                           d.getDate() === today.getDate();
                  });
                  const totalToday = todayTasks.length;
                  const doneToday = todayTasks.filter(t => t.status === 'done').length;
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
        )}
      </main>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          onSaved={() => { fetchTasks(); setShowForm(false); }}
        />
      )}

      {/* AI Assistant Chat Panel */}
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} onTasksUpdated={fetchTasks} />}

      {/* Profile & Settings Modal */}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--modal-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="glass-card animate-scale"
            style={{ maxWidth: 440, padding: 32, textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>👑</div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>DailyFlow Pro</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
              Unlock limitless potential with custom recurring habits, AI smart autoplanning, unlimited device sync, and priority Claude 3.7 scheduling.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={() => {
                setShowUpgradeModal(false);
                addToast({ title: 'Pro Feature Unlocked 🎉', message: 'You have full access to all features!', type: 'success' });
              }}
            >
              Activate Pro Membership ✨
            </button>
          </div>
        </div>
      )}
      {/* ── Mobile Bottom Nav (hidden on desktop via CSS) ── */}
      <nav className={styles.mobileBottomNav}>
        {[{ id: 'dashboard', icon: '🏠', label: 'Home' },
          { id: 'tasks',     icon: '☑️', label: 'Tasks' },
          { id: 'my_day',   icon: '🌤️', label: 'My Day' },
          { id: 'ai',       icon: '🤖', label: 'AI' },
          { id: 'notes',    icon: '📝', label: 'Notes' },
        ].map((item) => (
          <button
            key={item.id}
            className={styles.mobileNavItem + (activeNav === item.id ? ' ' + styles.mobileNavItemActive : '')}
            onClick={() => setActiveNav(item.id)}
          >
            <span className={styles.mobileNavIcon}>{item.icon}</span>
            <span className={styles.mobileNavLabel}>{item.label}</span>
          </button>
        ))}
        {/* More button opens a quick sheet */}
        <button
          className={styles.mobileNavItem + (['calendar','goals','habits','analytics','reminders'].includes(activeNav) ? ' ' + styles.mobileNavItemActive : '')}
          onClick={() => {
            const more = ['calendar','goals','habits','analytics','reminders'];
            const cur = more.indexOf(activeNav);
            setActiveNav(more[(cur + 1) % more.length]);
          }}
        >
          <span className={styles.mobileNavIcon}>⋯</span>
          <span className={styles.mobileNavLabel}>More</span>
        </button>
      </nav>
    </div>
  );
}
