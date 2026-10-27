import React, { useState, useEffect, useMemo } from 'react';
import { Prompt } from '../types/prompt';
import { extractVariables, replaceVariables, VariableField } from '../utils/variableExtractor';
import { X, Copy, Check, Sparkles, FileText } from 'lucide-react';

interface VariableFillModalProps {
  prompt: Prompt | null;
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess: (filledText: string, prompt: Prompt, variablesUsed: Record<string, string>) => void;
}

export const VariableFillModal: React.FC<VariableFillModalProps> = ({
  prompt,
  isOpen,
  onClose,
  onCopySuccess,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copiedMode, setCopiedMode] = useState<'filled' | 'raw' | null>(null);

  const variables: VariableField[] = useMemo(() => {
    if (!prompt) return [];
    return extractVariables(prompt.content);
  }, [prompt]);

  // Reset values when prompt changes
  useEffect(() => {
    if (prompt) {
      const initial: Record<string, string> = {};
      variables.forEach((v) => {
        initial[v.key] = '';
      });
      setValues(initial);
      setCopiedMode(null);
    }
  }, [prompt, variables]);

  if (!isOpen || !prompt) return null;

  const interpolatedContent = replaceVariables(prompt.content, values);
  const filledCount = Object.values(values).filter((v) => v.trim().length > 0).length;

  const handleCopyFilled = async () => {
    await navigator.clipboard.writeText(interpolatedContent);
    setCopiedMode('filled');
    onCopySuccess(interpolatedContent, prompt, values);
    setTimeout(() => {
      setCopiedMode(null);
      onClose();
    }, 450);
  };

  const handleCopyRaw = async () => {
    await navigator.clipboard.writeText(prompt.content);
    setCopiedMode('raw');
    onCopySuccess(prompt.content, prompt, {});
    setTimeout(() => {
      setCopiedMode(null);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-xl border border-zinc-200/80 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-variable-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded bg-zinc-200/60 text-zinc-700">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 id="modal-variable-title" className="text-sm font-semibold text-zinc-900 truncate">
                Fill Prompt Variables
              </h2>
              <p className="text-xs text-zinc-500 truncate">
                {prompt.title} ({variables.length} variable{variables.length > 1 ? 's' : ''})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-md hover:bg-zinc-200/50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Variables Inputs Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Variables ({filledCount}/{variables.length} filled)
              </label>
              {filledCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const empty: Record<string, string> = {};
                    variables.forEach(v => { empty[v.key] = ''; });
                    setValues(empty);
                  }}
                  className="text-[11px] text-zinc-500 hover:text-zinc-800 underline transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variables.map((variable) => (
                <div key={variable.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-700 truncate">
                      {variable.label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                      {variable.raw}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={values[variable.key] || ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [variable.key]: e.target.value }))
                    }
                    placeholder={`Enter ${variable.label.toLowerCase()}...`}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white text-zinc-900 placeholder:text-zinc-400 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Live Preview
              </span>
              <span className="text-[11px] text-zinc-400">
                {interpolatedContent.length} chars
              </span>
            </div>
            <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg max-h-52 overflow-y-auto">
              <pre className="text-xs font-mono text-zinc-700 whitespace-pre-wrap leading-relaxed select-all">
                {interpolatedContent}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 bg-zinc-50/70">
          <button
            type="button"
            onClick={handleCopyRaw}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 px-2.5 py-1.5 rounded-md hover:bg-zinc-200/50 transition-colors font-medium"
          >
            {copiedMode === 'raw' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Raw Copied!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span>Copy Raw Template</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCopyFilled}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md shadow-xs active:scale-[0.98] transition-all"
            >
              {copiedMode === 'filled' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Filled Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
