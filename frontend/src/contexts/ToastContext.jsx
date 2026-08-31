import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = ++_id;
    setToasts((t) => [...t, { id, title, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️', badge: '🏆' };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast animate-fade">
            <span className="toast-icon">{icons[t.type] || 'ℹ️'}</span>
            <div className="toast-body">
              {t.title && <div className="toast-title">{t.title}</div>}
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
