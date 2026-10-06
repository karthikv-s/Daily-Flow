import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTasks, updateTask, deleteTask, createTask } from '../api';

// Modals & Popups
import TaskForm from '../components/TaskForm';
import ChatPanel from '../components/ChatPanel';
import ProfileModal from '../components/ProfileModal';

// Dashboard Modular Components
import Sidebar from '../components/dashboard/Sidebar';
import TopHeader from '../components/dashboard/TopHeader';
import OverviewView from '../components/dashboard/OverviewView';
import MobileBottomNav from '../components/dashboard/MobileBottomNav';
import UpgradeModal from '../components/dashboard/UpgradeModal';

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

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme, isDark } = useTheme();

  const [activeNav, setActiveNavRaw] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const mainRef = useRef(null);

  // Navigate to a view and scroll to top
  function setActiveNav(id) {
    setActiveNavRaw(id);
    setTimeout(() => {
      if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

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

  // Task Completion Handler
  async function handleToggleComplete(task) {
    const isDone = task.status === 'done';
    const newStatus = isDone ? 'pending' : 'done';

    // ⚡ Optimistic update: instantly flip the UI
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : null } : t))
    );

    try {
      const res = await updateTask(task.id, { status: newStatus });
      const { pointsAwarded, newBadges } = res.data;

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
      // Revert optimistic update on failure
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

  // Direct Add Task Helper (used by MyDayView)
  async function handleDirectAddTask(taskData) {
    try {
      const res = await createTask(taskData);
      setTasks((prev) => [res.data, ...prev]);
      addToast({ title: 'Task Created! ✨', message: `Added "${taskData.title}"`, type: 'success' });
    } catch {
      addToast({ title: 'Failed to create task', type: 'error' });
    }
  }

  return (
    <div className={styles.layout}>
      {/* ── Left Sidebar ───────────────────────────────────── */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        onOpenChat={() => setChatOpen(true)}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* ── Main Canvas ────────────────────────────────────── */}
      <main ref={mainRef} className={styles.main}>
        <TopHeader
          greeting={greeting}
          userName={userName}
          dateString={dateString}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          theme={theme}
          setTheme={setTheme}
          isDark={isDark}
          userAvatarEmoji={userAvatarEmoji}
          onOpenReminders={() => setActiveNav('reminders')}
          onOpenProfile={() => setShowProfileModal(true)}
        />

        {/* ── Dynamic View Switcher ────────────────────────── */}
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

        {/* Default Dashboard Overview */}
        {activeNav === 'dashboard' && (
          <OverviewView
            tasks={tasks}
            loading={loading}
            user={user}
            searchQuery={searchQuery}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDelete}
            onOpenAddTask={() => { setEditingTask(null); setShowForm(true); }}
            onOpenChat={() => setChatOpen(true)}
            onNavigate={setActiveNav}
          />
        )}
      </main>

      {/* Modals & Overlays */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          onSaved={() => { fetchTasks(); setShowForm(false); }}
        />
      )}

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} onTasksUpdated={fetchTasks} />}

      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onActivate={() => {
          addToast({ title: 'Pro Feature Unlocked 🎉', message: 'You have full access to all features!', type: 'success' });
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeNav={activeNav}
        onSelectNav={setActiveNav}
      />
    </div>
  );
}
