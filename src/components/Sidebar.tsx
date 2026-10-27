import React from 'react';
import { 
  Folder, Star, Layers, Tag, Database, Clock, 
  ChevronRight, Sparkles, X, ShieldCheck, RefreshCw, AlertCircle
} from 'lucide-react';
import { SyncState } from '../types/prompt';

interface SidebarProps {
  categories: { name: string; count: number }[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  tags: { name: string; count: number }[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  totalCount: number;
  favoritesCount: number;
  syncState: SyncState;
  hasGASUrl: boolean;
  onOpenGoogleSheetModal: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  tags,
  selectedTag,
  onSelectTag,
  favoritesOnly,
  onToggleFavoritesOnly,
  totalCount,
  favoritesCount,
  syncState,
  hasGASUrl,
  onOpenGoogleSheetModal,
  onOpenHistory,
  historyCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-zinc-50 border-r border-zinc-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Main Nav */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200/80 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-200/90 bg-[#FAF9F4] flex items-center justify-center p-0.5 shadow-2xs flex-shrink-0">
                <img src="/favicon-32x32.png" alt="Saka Prompt Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xs font-bold text-zinc-900 tracking-tight">
                  SAKA PROMPT
                </h1>
                <p className="text-[10px] text-zinc-400 font-medium">Sheets Sync &middot; Light</p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1 text-zinc-400 hover:text-zinc-700 md:hidden rounded"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="p-3 space-y-1">
            <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Views
            </span>

            <button
              type="button"
              onClick={() => {
                onSelectCategory(null);
                onSelectTag(null);
                if (favoritesOnly) onToggleFavoritesOnly();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !selectedCategory && !selectedTag && !favoritesOnly
                  ? 'bg-zinc-200/70 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                <span>All Prompts</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">{totalCount}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectCategory(null);
                onSelectTag(null);
                if (!favoritesOnly) onToggleFavoritesOnly();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                favoritesOnly
                  ? 'bg-amber-100/60 text-amber-900 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-500 text-amber-600' : 'text-zinc-400'}`} />
                <span>Favorites</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">{favoritesCount}</span>
            </button>
          </div>

          {/* Categories */}
          <div className="px-3 py-2 space-y-1">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Categories
              </span>
              {selectedCategory && (
                <button
                  onClick={() => onSelectCategory(null)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-700 underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => onSelectCategory(isActive ? null : cat.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-white font-medium shadow-2xs'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Cloud */}
          {tags.length > 0 && (
            <div className="px-3 py-2 space-y-1.5">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Tags
                </span>
                {selectedTag && (
                  <button
                    onClick={() => onSelectTag(null)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-700 underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1 px-1">
                {tags.slice(0, 12).map((tag) => {
                  const isActive = selectedTag === tag.name;
                  return (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => onSelectTag(isActive ? null : tag.name)}
                      className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                        isActive
                          ? 'bg-zinc-800 text-white font-semibold'
                          : 'bg-zinc-200/60 hover:bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Panel: History & Google Sheets Sync Status */}
        <div className="p-3 border-t border-zinc-200/80 bg-white space-y-2">
          {/* History Shortcut */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Copy History</span>
            </div>
            {historyCount > 0 && (
              <span className="text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.2 rounded font-mono">
                {historyCount}
              </span>
            )}
          </button>

          {/* Google Sheets Sync Card */}
          <button
            type="button"
            onClick={onOpenGoogleSheetModal}
            className="w-full text-left p-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-900" />
                <span className="text-xs font-semibold text-zinc-800">
                  Google Sheets
                </span>
              </div>
              
              {/* Sync status pill */}
              <div className="flex items-center gap-1 text-[10px]">
                {syncState === 'syncing' && (
                  <span className="flex items-center gap-1 text-amber-700 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Syncing</span>
                  </span>
                )}
                {syncState === 'synced' && (
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Synced</span>
                  </span>
                )}
                {syncState === 'error' && (
                  <span className="flex items-center gap-1 text-rose-700 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>Error</span>
                  </span>
                )}
                {syncState === 'idle' && (
                  <span className="flex items-center gap-1 text-zinc-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasGASUrl ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                    <span>{hasGASUrl ? 'Ready' : 'Local'}</span>
                  </span>
                )}
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 mt-1 truncate">
              {hasGASUrl ? 'Connected to Apps Script' : 'Click to configure Apps Script sync'}
            </p>
          </button>
        </div>
      </aside>
    </>
  );
};
