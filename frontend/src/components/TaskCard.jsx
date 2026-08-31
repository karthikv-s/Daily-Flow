import { formatDistanceToNow, isPast } from 'date-fns';
import styles from './TaskCard.module.css';

const PRIORITY_COLORS = { high: 'red', medium: 'yellow', low: 'green' };
const PRIORITY_ICONS  = { high: '🔴', medium: '🟡', low: '🟢' };

export default function TaskCard({ task, onComplete, onEdit, onDelete }) {
  const dueDate  = new Date(task.dueAt);
  const isOverdue = task.status === 'pending' && isPast(dueDate);
  const timeLabel = formatDistanceToNow(dueDate, { addSuffix: true });
  const priorityColor = PRIORITY_COLORS[task.priority] || 'yellow';

  return (
    <div
      className={
        styles.card + ' glass-card' +
        (task.status === 'done' ? ' ' + styles.done : '') +
        (isOverdue ? ' ' + styles.overdue : '')
      }
    >
      {/* Priority stripe */}
      <div className={styles.stripe} data-priority={task.priority} />

      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={`badge badge-${priorityColor}`}>
            {PRIORITY_ICONS[task.priority]} {task.priority}
          </span>
          {task.category && (
            <span className="badge badge-accent">{task.category}</span>
          )}
          {task.status === 'done' && task.pointsAwarded > 0 && (
            <span className="badge badge-green">+{task.pointsAwarded} pts</span>
          )}
        </div>

        <h3 className={styles.title + (task.status === 'done' ? ' ' + styles.strikethrough : '')}>
          {task.title}
        </h3>

        {task.description && (
          <p className={styles.desc}>{task.description}</p>
        )}

        <div className={styles.meta}>
          <span className={styles.dueTime + (isOverdue ? ' ' + styles.overdueText : '')}>
            {isOverdue ? '⚠️' : '🕐'} {timeLabel}
          </span>
          <span className={styles.dueDate}>
            {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {task.status === 'pending' && (
          <button
            id={`complete-task-${task.id}`}
            className="btn btn-sm"
            style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(52,211,153,0.25)' }}
            onClick={onComplete}
            title="Mark complete"
          >
            ✓ Done
          </button>
        )}
        {task.status === 'pending' && (
          <button
            id={`edit-task-${task.id}`}
            className="btn btn-ghost btn-sm"
            onClick={onEdit}
            title="Edit task"
          >
            ✏️
          </button>
        )}
        <button
          id={`delete-task-${task.id}`}
          className="btn btn-danger btn-sm"
          onClick={onDelete}
          title="Delete task"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
