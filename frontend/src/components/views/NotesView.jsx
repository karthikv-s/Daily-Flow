import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import styles from './Views.module.css';

const DEFAULT_NOTES = [
  { id: 1, title: '🚀 Feature Ideas for Planner', content: '1. Add Pomodoro focus timer\n2. Add habit heatmaps\n3. Export schedule to Google Calendar', color: '#fef3c7', pinned: true, date: 'Today' },
  { id: 2, title: '📚 LeetCode Study Roadmap', content: 'Focus on:\n- Binary Trees & Graphs\n- Dynamic Programming\n- Sliding Window technique', color: '#ede9fe', pinned: true, date: 'Yesterday' },
  { id: 3, title: '🛒 Weekend Shopping List', content: '- Whey protein\n- Oats & almond milk\n- Blueberries\n- Green tea', color: '#dcfce7', pinned: false, date: 'Aug 29' },
];

export default function NotesView() {
  const { addToast } = useToast();
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('user_notes');
    return saved ? JSON.parse(saved) : DEFAULT_NOTES;
  });

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#ede9fe');

  function saveNotes(updated) {
    setNotes(updated);
    localStorage.setItem('user_notes', JSON.stringify(updated));
  }

  function handleCreateNote(e) {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const newN = {
      id: Date.now(),
      title: noteTitle.trim() || 'Untitled Note',
      content: noteContent.trim(),
      color: noteColor,
      pinned: false,
      date: 'Just now',
    };

    saveNotes([newN, ...notes]);
    setShowAddModal(false);
    setNoteTitle('');
    setNoteContent('');
    addToast({ title: 'Note Created! 📝', message: `Saved "${newN.title}"`, type: 'success' });
  }

  function handleTogglePin(id) {
    const updated = notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
    saveNotes(updated);
  }

  function handleDeleteNote(id) {
    saveNotes(notes.filter((n) => n.id !== id));
    addToast({ title: 'Note deleted', type: 'info' });
  }

  const filteredNotes = notes.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  return (
    <div className={styles.viewContainer}>
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <h2 className={styles.viewHeading}>📝 Scratchpad & Notes</h2>
          <p className={styles.viewSub}>Capture sudden ideas, meeting notes, code snippets, and daily reflections.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + New Note
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 10, maxWidth: 360 }}>
        <input
          type="text"
          placeholder="Search your notes..."
          className="form-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Notes Masonry Grid */}
      <div className={styles.notesGrid}>
        {filteredNotes.map((n) => (
          <div key={n.id} className={styles.noteCard} style={{ background: n.color }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.72rem', color: '#4b5563', fontWeight: 600 }}>{n.date}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                  onClick={() => handleTogglePin(n.id)}
                  title={n.pinned ? 'Unpin' : 'Pin to top'}
                >
                  {n.pinned ? '📌' : '📍'}
                </button>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                  onClick={() => handleDeleteNote(n.id)}
                  title="Delete Note"
                >
                  ✕
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', marginBottom: 6 }}>{n.title}</h3>
            <p style={{ fontSize: '0.82rem', color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.55 }}>
              {n.content}
            </p>
          </div>
        ))}
      </div>

      {/* Create Note Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard + ' glass-card animate-scale'} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>📝 Create New Note</h3>
            <form onSubmit={handleCreateNote} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  placeholder="Note Title..."
                  className="form-input"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="Write your notes, lists, or thoughts..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sticky Card Color</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { hex: '#ede9fe', label: 'Lavender' },
                    { hex: '#fef3c7', label: 'Yellow' },
                    { hex: '#dcfce7', label: 'Mint' },
                    { hex: '#e0f2fe', label: 'Sky' },
                    { hex: '#ffe4e6', label: 'Rose' },
                  ].map((c) => (
                    <div
                      key={c.hex}
                      onClick={() => setNoteColor(c.hex)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: c.hex,
                        cursor: 'pointer',
                        border: noteColor === c.hex ? '3px solid var(--accent)' : '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
