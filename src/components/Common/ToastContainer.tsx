import React, { useEffect } from 'react';
import { useQueue, ToastMessage } from '../../context/QueueContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Volume2,
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useQueue();

  return (
    <aside
      aria-label="System notifications"
      className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </aside>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getTheme = () => {
    switch (toast.type) {
      case 'urgent':
        return {
          border: 'border-amber-500/80',
          bg: 'bg-slate-900/95',
          accent: 'bg-amber-500/20 text-amber-400',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
        };
      case 'warning':
        return {
          border: 'border-rose-500/80',
          bg: 'bg-slate-900/95',
          accent: 'bg-rose-500/20 text-rose-400',
          icon: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />,
        };
      case 'success':
        return {
          border: 'border-emerald-500/80',
          bg: 'bg-slate-900/95',
          accent: 'bg-emerald-500/20 text-emerald-400',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
        };
      case 'info':
      default:
        return {
          border: 'border-cyan-500/80',
          bg: 'bg-slate-900/95',
          accent: 'bg-cyan-500/20 text-cyan-400',
          icon: <Bell className="w-5 h-5 text-cyan-400 shrink-0" />,
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto p-4 rounded-xl border ${theme.border} ${theme.bg} shadow-2xl backdrop-blur-md text-white transition-all duration-300 animate-slide-in flex items-start gap-3 relative`}
    >
      <div className={`p-2 rounded-lg ${theme.accent} shrink-0`}>
        {theme.icon}
      </div>

      <div className="flex-1 pr-6 min-w-0">
        <h4 className="text-xs font-bold tracking-tight text-white line-clamp-1">
          {toast.title}
        </h4>
        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
          {toast.message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white transition-colors p-1 rounded-md cursor-pointer"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
