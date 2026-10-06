import React from 'react';

export default function UpgradeModal({ isOpen, onClose, onActivate }) {
  if (!isOpen) return null;

  return (
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
      onClick={onClose}
    >
      <div
        className="glass-card animate-scale"
        style={{ maxWidth: 440, padding: 32, textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>👑</div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>DailyFlow Pro</h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Unlock limitless potential with custom recurring habits, AI smart autoplanning, unlimited device sync, and priority Claude 3.7 scheduling.
        </p>
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px' }}
          onClick={() => {
            onClose();
            onActivate();
          }}
        >
          Activate Pro Membership ✨
        </button>
      </div>
    </div>
  );
}
