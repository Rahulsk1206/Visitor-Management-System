import { createContext, useContext, useState, useCallback } from 'react';

let _id = 0;
const ToastContext = createContext({ addToast: () => {} });

const CONFIGS = {
  success: { bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', icon: '✓' },
  error:   { bg: 'bg-rose-500/20    border-rose-500/40    text-rose-300',    icon: '✕' },
  info:    { bg: 'bg-brand-500/20   border-brand-500/40   text-blue-300',    icon: 'ℹ' },
  warning: { bg: 'bg-amber-500/20   border-amber-500/40   text-amber-300',   icon: '⚠' },
};

function ToastItem({ toast, onRemove }) {
  const cfg = CONFIGS[toast.type] || CONFIGS.info;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md
                     shadow-2xl text-sm font-medium min-w-[260px] max-w-[380px] animate-fade-in
                     ${cfg.bg}`}>
      <span className="shrink-0 text-base">{cfg.icon}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition text-lg leading-none">×</button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++_id;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
