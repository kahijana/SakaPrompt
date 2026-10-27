import React, { useRef, useEffect } from 'react';
import { 
  Search, X, Plus, LayoutGrid, List, ArrowUpDown, 
  Menu, RefreshCw, Volume2, VolumeX 
} from 'lucide-react';
import { ViewMode, SortOption, SyncState } from '../types/prompt';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortOptionChange: (sort: SortOption) => void;
  onOpenNewPrompt: () => void;
  onOpenSidebarMobile: () => void;
  onSyncRefresh: () => void;
  syncState: SyncState;
  hasGASUrl: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortOptionChange,
  onOpenNewPrompt,
  onOpenSidebarMobile,
  onSyncRefresh,
  syncState,
  hasGASUrl,
  isMuted,
  onToggleMute,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isSyncing = syncState === 'syncing';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-zinc-200/80 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & Brand icon & Search bar */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <button
            type="button"
            onClick={onOpenSidebarMobile}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg md:hidden transition-all duration-150 active:scale-95 flex-shrink-0"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand Emblem */}
          <div className="w-6 h-6 rounded-md overflow-hidden border border-zinc-200/90 bg-[#FAF9F4] flex items-center justify-center md:hidden p-0.5 flex-shrink-0 shadow-2xs">
            <img src="/favicon-32x32.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search prompts by title, keyword, or #tag..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white text-zinc-900 placeholder:text-zinc-400 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded transition-all active:scale-90"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Right Controls: Install App, Mute toggle, Sync button, Sort, View Toggle, New Prompt Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* PWA In-App Install Button */}
          <PWAInstallButton />

          {/* Sound Effects Mute / Unmute Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg border transition-all duration-150 active:scale-95 ${
              isMuted
                ? 'text-zinc-400 border-zinc-200 bg-zinc-50 hover:text-zinc-700'
                : 'text-zinc-800 border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
            }`}
            title={isMuted ? 'Sound effects: Muted (Click to enable)' : 'Sound effects: Enabled (Click to mute)'}
            aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-zinc-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* Quick Refresh Sync Button */}
          {hasGASUrl && (
            <button
              type="button"
              onClick={onSyncRefresh}
              disabled={isSyncing}
              className={`p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 transition-all duration-150 ${
                isSyncing
                  ? 'cursor-not-allowed opacity-70 text-zinc-400'
                  : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 active:scale-95'
              }`}
              title={isSyncing ? 'Syncing in progress...' : 'Sync now with Google Sheets'}
              aria-label="Sync now"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-zinc-900' : ''}`} />
            </button>
          )}

          {/* Sort Selector */}
          <div className="relative hidden md:block">
            <select
              value={sortOption}
              onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
              className="text-xs bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg py-1.5 pl-2.5 pr-7 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer transition-colors"
            >
              <option value="updated-desc">Updated (Newest)</option>
              <option value="updated-asc">Updated (Oldest)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="favorites-first">Favorites First</option>
            </select>
          </div>

          {/* View Mode Switch (Grid vs Compact) */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-all duration-150 active:scale-95 ${
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Card Grid View"
              aria-label="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('compact')}
              className={`p-1.5 rounded-md transition-all duration-150 active:scale-95 ${
                viewMode === 'compact'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Compact List View"
              aria-label="Compact List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Prompt Action */}
          <button
            type="button"
            onClick={onOpenNewPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-2xs active:scale-95 transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Prompt</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
