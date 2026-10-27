import React, { useState } from 'react';
import { Prompt } from '../types/prompt';
import { extractVariables } from '../utils/variableExtractor';
import { 
  Star, Copy, Check, Sparkles, MoreVertical, Edit2, 
  Trash2, Calendar, ImageIcon 
} from 'lucide-react';

interface PromptCardProps {
  prompt: Prompt;
  onCopy: (prompt: Prompt) => void;
  onOpenVariableFill: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onSelectTag?: (tag: string) => void;
  onSelectCategory?: (category: string) => void;
  isRecentlyCopied: boolean;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onCopy,
  onOpenVariableFill,
  onEdit,
  onDelete,
  onToggleFavorite,
  onSelectTag,
  onSelectCategory,
  isRecentlyCopied,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const variables = extractVariables(prompt.content);
  const hasVariables = variables.length > 0;

  const formattedDate = new Date(prompt.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

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
      className={`group relative bg-white border rounded-xl overflow-hidden shadow-2xs hover:shadow-md cursor-pointer transition-all duration-150 flex flex-col justify-between active:scale-[0.985] text-left select-none animate-in fade-in zoom-in-98 ${
        isRecentlyCopied
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-zinc-200/90 hover:border-zinc-350'
      }`}
      title="Click anywhere on card to copy prompt"
    >
      {/* Visual Feedback Overlay when copied */}
      {isRecentlyCopied && (
        <div className="absolute inset-0 bg-emerald-950/15 backdrop-blur-2xs z-30 rounded-xl flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-lg border border-emerald-400/30 animate-in zoom-in-75 duration-150">
            <Check className="w-4 h-4 text-white" />
            <span>Copied to Clipboard!</span>
          </div>
        </div>
      )}

      <div>
        {/* Top Header: Category, Variable Badge, Favorite, and 3-Dot Menu (Clean, outside image) */}
        <div 
          className="flex items-center justify-between gap-2 p-3 pb-2 border-b border-zinc-100/70"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCategory?.(prompt.category);
              }}
              className="text-[11px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 px-2.5 py-0.5 rounded-md transition-colors truncate max-w-[120px]"
              title={`Filter category: ${prompt.category}`}
            >
              {prompt.category}
            </button>

            {hasVariables && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVariableFill(prompt);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100/90 border border-amber-200/80 px-1.5 py-0.5 rounded transition-colors"
                title={`${variables.length} variable(s) detected. Click to fill.`}
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                <span>{variables.length} var{variables.length > 1 ? 's' : ''}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Favorite Star Button (e.stopPropagation prevents card copy) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(prompt.id, prompt.favorite);
              }}
              className={`p-1.5 rounded-md transition-all active:scale-90 ${
                prompt.favorite
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50/60'
                  : 'text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100'
              }`}
              title={prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={prompt.favorite ? 'Favorited' : 'Not favorited'}
            >
              <Star className={`w-3.5 h-3.5 ${prompt.favorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>

            {/* 3-Dot Overflow Menu (e.stopPropagation prevents card copy) */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-all active:scale-90"
                aria-label="More options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div 
                    className="absolute right-0 top-full mt-1 w-36 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-30 text-xs animate-in fade-in duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onEdit(prompt);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 text-left transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Edit Prompt</span>
                    </button>
                    {hasVariables && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onOpenVariableFill(prompt);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 text-left transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Fill Variables</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(prompt);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-left transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete Prompt</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 1. Fitted Image Container with Margin (object-contain ensures the entire image fits without cropping) */}
        <div className="p-3">
          <div className="w-full h-44 sm:h-48 bg-zinc-50 border border-zinc-200/70 rounded-lg flex items-center justify-center overflow-hidden p-2">
            {hasValidImage ? (
              <img
                src={prompt.imageUrl}
                alt={prompt.title}
                loading="lazy"
                onError={() => setImageError(true)}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded select-none transition-transform duration-200 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                <ImageIcon className="w-7 h-7 stroke-1 text-zinc-300" />
                <span className="text-[10px] text-zinc-400 font-medium mt-1">No Image</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Judul Prompt (Title) ada di bawah gambar */}
        <div className="px-3.5 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-950 transition-colors line-clamp-2 leading-snug">
              {prompt.title}
            </h3>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-zinc-400 flex items-center gap-0.5 flex-shrink-0 font-medium pt-0.5">
              <Copy className="w-2.5 h-2.5" />
              <span>Copy</span>
            </span>
          </div>

          {/* Tags */}
          {prompt.tags.length > 0 && (
            <div 
              className="flex flex-wrap gap-1 mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {prompt.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag?.(tag);
                  }}
                  className="text-[10px] text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200/70 px-1.5 py-0.5 rounded transition-all active:scale-95"
                >
                  #{tag}
                </button>
              ))}
              {prompt.tags.length > 3 && (
                <span className="text-[10px] text-zinc-400 self-center">
                  +{prompt.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Date & Optional Variable Fill Button */}
      <div className="px-3.5 py-2.5 border-t border-zinc-100 text-xs flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-zinc-300" />
          {formattedDate}
        </span>

        <div className="flex items-center gap-2">
          {hasVariables ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenVariableFill(prompt);
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-md transition-all active:scale-95"
              title="Fill variables before copying"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Fill Variables</span>
            </button>
          ) : (
            <span className="text-[10px] text-zinc-400 font-mono group-hover:text-zinc-600 transition-colors">
              Click to copy
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
