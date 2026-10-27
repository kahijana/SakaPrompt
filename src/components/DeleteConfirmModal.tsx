import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Prompt } from '../types/prompt';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  prompt: Prompt | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  prompt,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !prompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-xl border border-zinc-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-rose-100 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h3 id="delete-confirm-title" className="text-sm font-semibold text-zinc-900">
              Delete Prompt
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded hover:bg-zinc-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Are you sure you want to delete this prompt? This action cannot be undone.
          </p>
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg">
            <p className="text-xs font-semibold text-zinc-900 truncate">{prompt.title}</p>
            <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 font-mono">
              {prompt.content}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-100 bg-zinc-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs transition-colors"
          >
            Delete Prompt
          </button>
        </div>
      </div>
    </div>
  );
};
