import { useState, useEffect, useMemo } from 'react';
import { createTask, updateTask } from '../api';
import { useToast } from '../contexts/ToastContext';
import styles from './TaskForm.module.css';

// Helper to format Date into local ISO string for <input type="datetime-local">
function toLocalISO(date) {
  const d = date ? new Date(date) : new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Generate default time: 1 hour in the future, rounded to nearest 15 mins
function getDefaultDueTime() {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  const remainder = 15 - (d.getMinutes() % 15);
  d.setMinutes(d.getMinutes() + (remainder === 15 ? 0 : remainder));
  d.setSeconds(0);
  return toLocalISO(d);
}

const CATEGORY_SUGGESTIONS = [
  '💼 Work',
  '🎯 Personal',
  '📚 Study',
  '💪 Health',
  '🛒 Shopping',
  '⚡ Urgent',
];

export default function TaskForm({ task, onClose, onSaved }) {
  const { addToast } = useToast();
  const isEdit = !!task;

  const [title, setTitle]       = useState(task?.title || '');
  const [description, setDesc]  = useState(task?.description || '');
  const [dueAt, setDueAt]       = useState(task?.dueAt ? toLocalISO(task.dueAt) : getDefaultDueTime());
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [category, setCategory] = useState(task?.category || '');
  const [loading, setLoading]   = useState(false);

  // Minimum selectable date-time is right now
  const minDateTime = useMemo(() => toLocalISO(new Date()), []);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Quick Preset Handlers
  function applyPreset(type) {
    const now = new Date();
    let target = new Date();

    if (type === '1hr') {
      target.setHours(now.getHours() + 1);
    } else if (type === 'today_evening') {
      target.setHours(18, 0, 0, 0);
      if (target <= now) target.setHours(now.getHours() + 1); // fallback if past 6 PM
    } else if (type === 'tonight') {
      target.setHours(21, 0, 0, 0);
      if (target <= now) target.setHours(now.getHours() + 1); // fallback if past 9 PM
    } else if (type === 'tomorrow_morning') {
      target.setDate(now.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else if (type === 'tomorrow_evening') {
      target.setDate(now.getDate() + 1);
      target.setHours(18, 0, 0, 0);
    } else if (type === 'in_2_days') {
      target.setDate(now.getDate() + 2);
      target.setHours(9, 0, 0, 0);
    }

    setDueAt(toLocalISO(target));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    // Validate that the chosen due date is NOT in the past (with 30-second buffer)
    const selectedDate = new Date(dueAt);
    const now = new Date(Date.now() - 30000);

    if (selectedDate < now) {
      addToast({
        title: 'Invalid Due Time',
        message: 'Please choose a future date and time for your task.',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: selectedDate.toISOString(),
        priority,
        category: category.trim() || undefined,
      };

      if (isEdit) {
        await updateTask(task.id, data);
        addToast({ title: 'Task Updated! ✨', type: 'success' });
      } else {
        await createTask(data);
        addToast({ title: 'Task Created! 🚀', type: 'success' });
      }
      onSaved();
    } catch (err) {
      addToast({
        title: 'Could not save task',
        message: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Please verify the fields.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal + ' glass-card animate-scale'}>
        <div className={styles.header}>
          <h2 className={styles.modalTitle}>
            <span>{isEdit ? '✏️' : '➕'}</span>
            <span>{isEdit ? 'Edit Task' : 'Create New Task'}</span>
          </h2>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            id="close-task-form"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              className="form-input"
              placeholder="e.g. Finish project proposal, Buy groceries..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description (Optional)</label>
            <textarea
              id="task-desc"
              className="form-textarea"
              placeholder="Add key notes, links, or checklist items..."
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
            />
          </div>

          {/* Due Date & Time with Minimum Restriction */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="task-due">Due Date & Time *</label>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                Future time only
              </span>
            </div>
            <input
              id="task-due"
              type="datetime-local"
              className="form-input"
              value={dueAt}
              min={minDateTime}
              onChange={(e) => setDueAt(e.target.value)}
              required
            />

            {/* Quick Time Preset Chips */}
            <div className={styles.presetsContainer}>
              <button
                type="button"
                className={styles.presetChip}
                onClick={() => applyPreset('1hr')}
              >
                ⏱️ +1 Hour
              </button>
              <button
                type="button"
                className={styles.presetChip}
                onClick={() => applyPreset('today_evening')}
              >
                🌤️ Today 6 PM
              </button>
              <button
                type="button"
                className={styles.presetChip}
                onClick={() => applyPreset('tonight')}
              >
                🌙 Tonight 9 PM
              </button>
              <button
                type="button"
                className={styles.presetChip}
                onClick={() => applyPreset('tomorrow_morning')}
              >
                🌅 Tomorrow 9 AM
              </button>
              <button
                type="button"
                className={styles.presetChip}
                onClick={() => applyPreset('tomorrow_evening')}
              >
                🌇 Tomorrow 6 PM
              </button>
              <button
                type="button"
                className={styles.presetChip}
                onClick={() => applyPreset('in_2_days')}
              >
                📅 In 2 Days
              </button>
            </div>
          </div>

          {/* Priority Interactive Visual Selector */}
          <div className="form-group">
            <label className="form-label">Priority Level</label>
            <div className={styles.priorityGrid}>
              <button
                type="button"
                className={
                  styles.priorityCard +
                  (priority === 'low' ? ' ' + styles.priorityCardActive : '')
                }
                data-priority="low"
                onClick={() => setPriority('low')}
              >
                <span className={styles.priorityEmoji}>🟢</span>
                <span className={styles.priorityText}>Low</span>
              </button>

              <button
                type="button"
                className={
                  styles.priorityCard +
                  (priority === 'medium' ? ' ' + styles.priorityCardActive : '')
                }
                data-priority="medium"
                onClick={() => setPriority('medium')}
              >
                <span className={styles.priorityEmoji}>🟡</span>
                <span className={styles.priorityText}>Medium</span>
              </button>

              <button
                type="button"
                className={
                  styles.priorityCard +
                  (priority === 'high' ? ' ' + styles.priorityCardActive : '')
                }
                data-priority="high"
                onClick={() => setPriority('high')}
              >
                <span className={styles.priorityEmoji}>🔴</span>
                <span className={styles.priorityText}>High</span>
              </button>
            </div>
          </div>

          {/* Category Input & Quick Tags */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-category">Category</label>
            <input
              id="task-category"
              className="form-input"
              placeholder="e.g. Work, Personal, Fitness..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            {/* Quick Category Suggestions */}
            <div className={styles.categoryTags}>
              {CATEGORY_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={
                    styles.categoryTag +
                    (category.toLowerCase() === tag.split(' ')[1]?.toLowerCase()
                      ? ' ' + styles.categoryTagActive
                      : '')
                  }
                  onClick={() => setCategory(tag.split(' ')[1] || tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              id="save-task-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <span className="spinner" />
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create Task 🚀'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
