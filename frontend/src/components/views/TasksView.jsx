import { useState, useMemo } from 'react';
import styles from './Views.module.css';

export default function TasksView({ tasks, onToggleComplete, onDeleteTask, onOpenAddTask, onEditTask }) {
  const [filter, setFilter] = useState('all'); // all, pending, done, high, overdue
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('dueAt'); // dueAt, priority, title

  const now = new Date();

  const categories = useMemo(() => {
    const set = new Set(tasks.map((t) => t.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (filter === 'pending') return t.status === 'pending';
        if (filter === 'done') return t.status === 'done';
        if (filter === 'high') return t.priority === 'high' && t.status === 'pending';
        if (filter === 'overdue') return new Date(t.dueAt) < now && t.status === 'pending';
        return true;
      })
      .filter((t) => {
        if (selectedCategory === 'all') return true;
        return t.category === selectedCategory;
      })
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'dueAt') return new Date(a.dueAt) - new Date(b.dueAt);
        if (sortBy === 'priority') {
          const pMap = { high: 1, medium: 2, low: 3 };
          return (pMap[a.priority] || 2) - (pMap[b.priority] || 2);
        }
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [tasks, filter, selectedCategory, search, sortBy, now]);

  return (
    <div className={styles.viewContainer}>
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <h2 className={styles.viewHeading}>☑️ All Tasks</h2>
          <p className={styles.viewSub}>Manage, prioritize, and track all your tasks in one place.</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenAddTask}>
          + Add Task
        </button>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className={styles.filterBar}>
        <div className={styles.filterTabs}>
          {[
            { id: 'all', label: `All (${tasks.length})` },
            { id: 'pending', label: `Pending (${tasks.filter((t) => t.status === 'pending').length})` },
            { id: 'high', label: '⚡ High Priority' },
            { id: 'done', label: `Done (${tasks.filter((t) => t.status === 'done').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              className={styles.filterTabBtn + (filter === tab.id ? ' ' + styles.filterTabActive : '')}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.filterActions}>
          <input
            type="text"
            placeholder="Search tasks..."
            className="form-input"
            style={{ width: 180, padding: '7px 12px', fontSize: '0.8rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-select"
            style={{ width: 'auto', padding: '7px 10px', fontSize: '0.8rem' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : `🏷️ ${c}`}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '7px 10px', fontSize: '0.8rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="dueAt">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className={styles.sectionCard}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📋</div>
            <h4>No tasks found</h4>
            <p>Try adjusting your search or filters, or add a new task.</p>
          </div>
        ) : (
          <div className={styles.itemList}>
            {filteredTasks.map((t) => {
              const isDone = t.status === 'done';
              const isOverdue = !isDone && new Date(t.dueAt) < now;

              return (
                <div key={t.id} className={styles.taskRow + (isDone ? ' ' + styles.taskRowDone : '')}>
                  <button
                    className={styles.checkboxBtn + (isDone ? ' ' + styles.checkboxDone : '')}
                    onClick={() => onToggleComplete(t)}
                    title={isDone ? 'Mark Pending' : 'Mark Complete'}
                  >
                    {isDone ? '✓' : ''}
                  </button>

                  <div className={styles.taskInfo}>
                    <div className={styles.taskTitle} style={isDone ? { textDecoration: 'line-through' } : {}}>
                      {t.title}
                      {isOverdue && <span className="badge badge-red" style={{ marginLeft: 8 }}>Overdue</span>}
                    </div>
                    <div className={styles.taskMeta}>
                      <span>📅 {new Date(t.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className={`badge ${t.priority === 'high' ? 'badge-red' : t.priority === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                        {t.priority}
                      </span>
                      {t.category && (
                        <>
                          <span>•</span>
                          <span>🏷️ {t.category}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onEditTask(t)} title="Edit Task">
                      ✏️
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => onDeleteTask(t.id)} title="Delete Task">
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
