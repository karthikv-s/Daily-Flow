import { useState, useEffect, useRef } from 'react';
import { sendChat, getChatHistory, batchCreateTasks, createTask } from '../api';
import { useToast } from '../contexts/ToastContext';
import styles from './ChatPanel.module.css';

export default function ChatPanel({ onClose, onTasksUpdated }) {
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [schedulingTask, setSchedulingTask] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getChatHistory()
      .then((r) => setMessages(r.data))
      .catch(() => addToast({ title: 'Could not load chat history', type: 'error' }))
      .finally(() => setLoadingHistory(false));
  }, [addToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSend(e, customText) {
    if (e) e.preventDefault();
    const text = (customText || input).trim();
    if (!text || loading) return;
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: text, createdAt: new Date() }]);
    setLoading(true);

    try {
      const res = await sendChat(text);
      const { reply, suggestedTasks } = res.data;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          suggestedTasks: suggestedTasks || [],
          createdAt: new Date(),
        },
      ]);
    } catch {
      addToast({ title: 'AI Assistant Error', message: 'Please try again', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // 1-Click Schedule All suggested tasks
  async function handleScheduleAll(taskList) {
    if (!taskList || taskList.length === 0 || schedulingTask) return;
    setSchedulingTask(true);
    try {
      const res = await batchCreateTasks(taskList);
      addToast({
        title: 'Schedule Updated! 🚀',
        message: `Added ${res.data.count} tasks to your planner`,
        type: 'success',
      });
      if (onTasksUpdated) onTasksUpdated();

      // Append confirmation message in chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ Successfully scheduled **${taskList.length} tasks** into your daily plan! You can view them on your dashboard timeline now.`,
          createdAt: new Date(),
        },
      ]);
    } catch {
      addToast({ title: 'Could not schedule tasks', type: 'error' });
    } finally {
      setSchedulingTask(false);
    }
  }

  // 1-Click Schedule Single Task
  async function handleScheduleSingle(task) {
    if (schedulingTask) return;
    setSchedulingTask(true);
    try {
      await createTask({
        title: task.title,
        dueAt: task.dueAt,
        priority: task.priority || 'medium',
        category: task.category || 'Personal',
      });
      addToast({
        title: 'Task Scheduled! 📌',
        message: `Scheduled "${task.title}"`,
        type: 'success',
      });
      if (onTasksUpdated) onTasksUpdated();
    } catch {
      addToast({ title: 'Could not schedule task', type: 'error' });
    } finally {
      setSchedulingTask(false);
    }
  }

  const quickPrompts = [
    '⚡ Prioritize my tasks',
    '📅 Plan rest of my day',
    '💡 Give me 3 focus tips',
    '🔥 Check my streak',
  ];

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel + ' glass-card animate-fade'}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>🤖</div>
            <div>
              <div className={styles.botName}>AI Planning Assistant</div>
              <div className={styles.botStatus}>Powered by Google Gemini ⚡</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="close-chat" title="Close (Esc)">✕</button>
        </div>

        {/* Messages list */}
        <div className={styles.messages}>
          {loadingHistory && (
            <div className={styles.center}><span className="spinner" /></div>
          )}

          {!loadingHistory && messages.length === 0 && (
            <div className={styles.welcome}>
              <p className={styles.welcomeText}>
                👋 Hi! I&apos;m your <strong>AI Daily Planner</strong>. Tell me your goals or schedule (e.g. <em>&ldquo;Solve 2 LeetCode problems, gym at 8:00pm, and watch a movie&rdquo;</em>) and I&apos;ll schedule them for you!
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={styles.message + ' ' + (msg.role === 'user' ? styles.userMsg : styles.botMsg)}
            >
              {msg.role === 'assistant' && <span className={styles.msgAvatar}>🤖</span>}
              <div className={styles.bubble}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} style={{ margin: line ? '2px 0' : '4px 0' }}>
                    {line.startsWith('**') && line.endsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line}
                  </p>
                ))}

                {/* Render Interactive Suggested Task Cards */}
                {msg.suggestedTasks && msg.suggestedTasks.length > 0 && (
                  <div className={styles.taskCardsList}>
                    {msg.suggestedTasks.map((t, idx) => (
                      <div key={idx} className={styles.taskCardItem}>
                        <div className={styles.taskCardLeft}>
                          <div className={styles.taskCardTitle}>📌 {t.title}</div>
                          <div className={styles.taskCardMeta}>
                            <span>⏰ {new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className={`badge ${t.category === 'Study' ? 'badge-purple' : t.category === 'Health' ? 'badge-yellow' : 'badge-green'}`}>
                              {t.category}
                            </span>
                            <span>•</span>
                            <span style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem' }}>{t.priority}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          onClick={() => handleScheduleSingle(t)}
                          disabled={schedulingTask}
                        >
                          + Add
                        </button>
                      </div>
                    ))}

                    {/* Batch Add All Button */}
                    <button
                      type="button"
                      className={styles.batchAddBtn}
                      onClick={() => handleScheduleAll(msg.suggestedTasks)}
                      disabled={schedulingTask}
                    >
                      {schedulingTask ? <span className="spinner" /> : `✨ Add All Tasks to Schedule (${msg.suggestedTasks.length})`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className={styles.message + ' ' + styles.botMsg}>
              <span className={styles.msgAvatar}>🤖</span>
              <div className={styles.bubble + ' ' + styles.typing}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className={styles.quickChipsRow}>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.quickChip}
              onClick={() => handleSend(null, p)}
              disabled={loading}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} className={styles.inputRow}>
          <input
            id="chat-input"
            className={styles.chatInput + ' form-input'}
            placeholder="Tell me what you want to do today..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button
            id="chat-send-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
            style={{ flexShrink: 0 }}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
