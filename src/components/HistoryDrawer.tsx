import React from 'react';
import { PromptHistoryItem } from '../types/prompt';
import { X, Clock, Copy, Trash2, Check, ArrowRight } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: PromptHistoryItem[];
  onClearHistory: () => void;
  onReCopy: (item: PromptHistoryItem) => void;
  copiedId: string | null;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onReCopy,
  copiedId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 animate-in slide-in-from-right duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-zinc-200/70 text-zinc-800">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h2 id="history-drawer-title" className="text-sm font-semibold text-zinc-900">
                Copy History
              </h2>
              <p className="text-xs text-zinc-500">
                {history.length} recent prompt cop{history.length === 1 ? 'y' : 'ies'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-zinc-100 transition-colors"
                title="Clear history"
                aria-label="Clear history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
              aria-label="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
              <Clock className="w-8 h-8 stroke-1 text-zinc-300 mb-2" />
              <p className="text-xs font-medium text-zinc-600">No copy history yet</p>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px]">
                Prompts you copy to your clipboard will be tracked here for quick access.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const isJustCopied = copiedId === item.id;
              const hasVariables = item.variablesUsed && Object.keys(item.variablesUsed).length > 0;

              return (
                <div
                  key={item.id}
                  className="p-3 bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200/80 rounded-lg space-y-2 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {item.promptTitle}
                    </p>
                    <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-zinc-600 line-clamp-3 leading-relaxed bg-white p-2 rounded border border-zinc-100">
                    {item.copiedContent}
                  </p>

                  {hasVariables && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-zinc-500">
                      <span className="font-semibold text-zinc-600">Variables:</span>
                      {Object.entries(item.variablesUsed!).map(([k, v]) => (
                        <span key={k} className="bg-zinc-200/70 px-1.5 py-0.5 rounded text-zinc-700 font-mono">
                          {k}: {v || '(empty)'}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onReCopy(item)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-all ${
                        isJustCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                    >
                      {isJustCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Again</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
