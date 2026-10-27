import React, { useState } from 'react';
import { Prompt } from '../types/prompt';
import { extractVariables } from '../utils/variableExtractor';
import { Star, Copy, Check, Sparkles, Edit2, Trash2, ImageIcon } from 'lucide-react';

interface PromptListItemProps {
  prompt: Prompt;
  onCopy: (prompt: Prompt) => void;
  onOpenVariableFill: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  isRecentlyCopied: boolean;
}

export const PromptListItem: React.FC<PromptListItemProps> = ({
  prompt,
  onCopy,
  onOpenVariableFill,
  onEdit,
  onDelete,
  onToggleFavorite,
  isRecentlyCopied,
}) => {
  const [imageError, setImageError] = useState(false);
  const variables = extractVariables(prompt.content);
  const hasVariables = variables.length > 0;
  const hasValidImage = Boolean(prompt.imageUrl && prompt.imageUrl.trim() && !imageError);

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={() => onCopy(prompt)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCopy(prompt);
        }
      }}
      className={`group relative bg-white hover:bg-zinc-50/90 border rounded-lg px-3.5 py-2.5 transition-all duration-150 flex items-center justify-between gap-3 shadow-2xs cursor-pointer active:scale-[0.99] select-none ${
        isRecentlyCopied
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
          : 'border-zinc-200/90 hover:border-zinc-350'
      }`}
      title="Click row to copy prompt"
    >
      {/* Left: Thumbnail & Favorite & Main Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(prompt.id, prompt.favorite);
          }}
          className={`p-1 rounded transition-all active:scale-90 flex-shrink-0 ${
            prompt.favorite
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-zinc-300 hover:text-zinc-500'
          }`}
          title={prompt.favorite ? 'Favorited' : 'Add to favorites'}
        >
          <Star className={`w-3.5 h-3.5 ${prompt.favorite ? 'fill-amber-400 text-amber-500' : ''}`} />
        </button>

        {/* Small 16:9 Thumbnail in List */}
        <div className="w-12 h-8 rounded bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-200/60 hidden sm:flex items-center justify-center">
          {hasValidImage ? (
            <img
              src={prompt.imageUrl}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-4 h-4 text-zinc-300 stroke-1" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-zinc-900 truncate">
              {prompt.title}
            </h4>
            <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              {prompt.category}
            </span>
            {hasVariables && (
              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/50 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5 flex-shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                {variables.length} var{variables.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions with Press Animations (stop propagation on action buttons) */}
      <div 
        className="flex items-center gap-1.5 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(prompt);
          }}
          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-all active:scale-95"
          title="Edit prompt"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(prompt);
          }}
          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 rounded transition-all active:scale-95"
          title="Delete prompt"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {hasVariables && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenVariableFill(prompt);
            }}
            className="px-2 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded transition-all active:scale-95 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Fill</span>
          </button>
        )}

        {/* Status chip / Quick feedback button */}
        <div className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-all ${
          isRecentlyCopied
            ? 'bg-emerald-600 text-white'
            : 'text-zinc-500 bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white'
        }`}>
          {isRecentlyCopied ? (
            <>
              <Check className="w-3 h-3 text-white animate-in zoom-in-75 duration-150" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              <span>Copy</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
