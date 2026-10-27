import React from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  subtext?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-zinc-900 text-zinc-100 rounded-lg shadow-lg shadow-zinc-950/20 border border-zinc-800 text-sm animate-in fade-in slide-in-from-bottom-2 duration-150 transition-all"
        >
          {toast.type === 'success' && (
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <Info className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs tracking-wide">{toast.message}</p>
            {toast.subtext && (
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{toast.subtext}</p>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 text-zinc-400 hover:text-zinc-200 transition-colors p-1 -mr-1 rounded"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
