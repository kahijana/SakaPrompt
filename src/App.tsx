import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Prompt, PromptHistoryItem, SyncConfig, SyncState, ViewMode, SortOption } from './types/prompt';
import { INITIAL_PROMPTS } from './data/initialPrompts';
import { 
  fetchPromptsFromGAS, 
  createPromptGAS, 
  updatePromptGAS, 
  deletePromptGAS, 
  bulkSyncPromptsGAS 
} from './services/gasService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PromptCard } from './components/PromptCard';
import { PromptListItem } from './components/PromptListItem';
import { PromptModal } from './components/PromptModal';
import { VariableFillModal } from './components/VariableFillModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { extractVariables } from './utils/variableExtractor';
import { soundManager } from './utils/soundEffects';
import { 
  Search, Plus, Sparkles, Database, FileSpreadsheet, 
  FilterX, ArrowUpDown, Layers, Star 
} from 'lucide-react';

const STORAGE_PROMPTS_KEY = 'prompt_library_items_v2';
const STORAGE_HISTORY_KEY = 'prompt_library_history_v1';
const STORAGE_CONFIG_KEY = 'prompt_library_config_v1';

// Legacy dummy prompt IDs to purge
const DUMMY_IDS = new Set([
  'p_eng_01', 'p_write_02', 'p_prod_03', 'p_mkt_04', 'p_eng_05', 'p_learn_06', 'p_design_07'
]);

/**
 * Robust clipboard copy with fallback for older browsers or non-secure contexts
 */
async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('navigator.clipboard failed, attempting fallback...', e);
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Copy fallback failed', err);
    return false;
  }
}

export default function App() {
  // Load state from LocalStorage (starts completely clean, no dummy prompts)
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    try {
      // Check current storage key
      const saved = localStorage.getItem(STORAGE_PROMPTS_KEY) || localStorage.getItem('prompt_library_items_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any dummy prompts
          return parsed.filter((p: Prompt) => p && p.id && !DUMMY_IDS.has(p.id));
        }
      }
    } catch (e) {
      console.error('Failed to parse local prompts', e);
    }
    return [];
  });

  const [history, setHistory] = useState<PromptHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse history', e);
    }
    return [];
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse config', e);
    }
    return {
      gasWebAppUrl: '',
      lastSyncedAt: null,
      autoSync: true,
      sheetName: 'Prompts',
    };
  });

  // Sound mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());

  const handleToggleMute = useCallback(() => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  }, []);

  // UI state
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('updated-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [recentlyCopiedId, setRecentlyCopiedId] = useState<string | null>(null);
  const [historyCopiedId, setHistoryCopiedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [variablePrompt, setVariablePrompt] = useState<Prompt | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Sync to LocalStorage on state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_PROMPTS_KEY, JSON.stringify(prompts));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(syncConfig));
  }, [syncConfig]);

  // Toast helper
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', subtext?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type, subtext }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // One-click Copy Handler
  const handleCopyPrompt = async (prompt: Prompt) => {
    const success = await copyTextToClipboard(prompt.content);
    if (success) {
      soundManager.playCopy();
      setRecentlyCopiedId(prompt.id);
      addToast('Copied to clipboard!', 'success', prompt.title);

      // Add to copy history
      const newHistoryItem: PromptHistoryItem = {
        id: 'h_' + Date.now().toString(),
        promptId: prompt.id,
        promptTitle: prompt.title,
        copiedContent: prompt.content,
        timestamp: new Date().toISOString(),
      };
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)]);

      setTimeout(() => setRecentlyCopiedId(null), 1500);
    } else {
      addToast('Failed to copy', 'error');
    }
  };

  // Variable Fill Modal Copy Success
  const handleVariableFillSuccess = (
    filledText: string,
    prompt: Prompt,
    variablesUsed: Record<string, string>
  ) => {
    soundManager.playCopy();
    setRecentlyCopiedId(prompt.id);
    addToast('Filled prompt copied to clipboard!', 'success', prompt.title);

    const newHistoryItem: PromptHistoryItem = {
      id: 'h_' + Date.now().toString(),
      promptId: prompt.id,
      promptTitle: prompt.title,
      copiedContent: filledText,
      timestamp: new Date().toISOString(),
      variablesUsed: Object.keys(variablesUsed).length > 0 ? variablesUsed : undefined,
    };
    setHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)]);

    setTimeout(() => setRecentlyCopiedId(null), 1500);
  };

  // History Drawer Re-copy
  const handleReCopyHistory = async (item: PromptHistoryItem) => {
    const success = await copyTextToClipboard(item.copiedContent);
    if (success) {
      soundManager.playCopy();
      setHistoryCopiedId(item.id);
      addToast('Copied from history!', 'success', item.promptTitle);
      setTimeout(() => setHistoryCopiedId(null), 1500);
    } else {
      addToast('Failed to copy', 'error');
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string, current: boolean) => {
    const nextFavorite = !current;
    const now = new Date().toISOString();

    // Optimistic update
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: nextFavorite, updatedAt: now } : p))
    );

    // If Google Sheets connected, sync update
    if (syncConfig.gasWebAppUrl) {
      const targetPrompt = prompts.find((p) => p.id === id);
      if (targetPrompt) {
        try {
          setSyncState('syncing');
          await updatePromptGAS(syncConfig.gasWebAppUrl, {
            ...targetPrompt,
            favorite: nextFavorite,
            updatedAt: now,
          });
          setSyncState('synced');
          setSyncConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
        } catch (e: any) {
          console.error('Failed to sync favorite to Google Sheets', e);
          setSyncState('error');
          addToast('Saved locally; Google Sheets sync failed', 'info');
        }
      }
    }
  };

  // Create or Update Prompt
  const handleSavePrompt = async (data: {
    id?: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    favorite: boolean;
    imageUrl?: string;
  }) => {
    const now = new Date().toISOString();

    if (data.id) {
      // Edit existing
      const updatedPrompt: Prompt = {
        id: data.id,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        favorite: data.favorite,
        imageUrl: data.imageUrl,
        createdAt: editingPrompt?.createdAt || now,
        updatedAt: now,
      };

      setPrompts((prev) => prev.map((p) => (p.id === data.id ? updatedPrompt : p)));
      setIsPromptModalOpen(false);
      setEditingPrompt(null);
      soundManager.playUpdate();
      addToast('Prompt updated successfully');

      if (syncConfig.gasWebAppUrl) {
        try {
          setSyncState('syncing');
          await updatePromptGAS(syncConfig.gasWebAppUrl, updatedPrompt);
          setSyncState('synced');
          setSyncConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
        } catch (err: any) {
          console.error('GAS update error', err);
          setSyncState('error');
          addToast('Updated locally (Google Sheets sync error)', 'info');
        }
      }
    } else {
      // Create new
      const newId = 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newPrompt: Prompt = {
        id: newId,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        favorite: data.favorite,
        imageUrl: data.imageUrl,
        createdAt: now,
        updatedAt: now,
      };

      setPrompts((prev) => [newPrompt, ...prev]);
      setIsPromptModalOpen(false);
      soundManager.playCreate();
      addToast('New prompt created');

      if (syncConfig.gasWebAppUrl) {
        try {
          setSyncState('syncing');
          await createPromptGAS(syncConfig.gasWebAppUrl, newPrompt);
          setSyncState('synced');
          setSyncConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
        } catch (err: any) {
          console.error('GAS create error', err);
          setSyncState('error');
          addToast('Created locally (Google Sheets sync error)', 'info');
        }
      }
    }
  };

  // Delete Prompt
  const handleConfirmDelete = async () => {
    if (!deletingPrompt) return;
    const targetId = deletingPrompt.id;

    setPrompts((prev) => prev.filter((p) => p.id !== targetId));
    setIsDeleteModalOpen(false);
    setDeletingPrompt(null);
    soundManager.playDelete();
    addToast('Prompt deleted');

    if (syncConfig.gasWebAppUrl) {
      try {
        setSyncState('syncing');
        await deletePromptGAS(syncConfig.gasWebAppUrl, targetId);
        setSyncState('synced');
        setSyncConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      } catch (err: any) {
        console.error('GAS delete error', err);
        setSyncState('error');
        addToast('Deleted locally (Google Sheets sync error)', 'info');
      }
    }
  };

  // Google Sheets Direct Pull
  const handleSyncPull = async () => {
    if (!syncConfig.gasWebAppUrl) return;

    try {
      setSyncState('syncing');
      soundManager.playSyncStart();
      const gasPrompts = await fetchPromptsFromGAS(syncConfig.gasWebAppUrl);
      if (gasPrompts && gasPrompts.length > 0) {
        setPrompts(gasPrompts);
        setSyncState('synced');
        soundManager.playSyncSuccess();
        setSyncConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
        addToast(`Pulled ${gasPrompts.length} prompts from Google Sheet`, 'success');
      } else {
        setSyncState('synced');
        soundManager.playSyncSuccess();
        addToast('Connected. Sheet is currently empty.', 'info');
      }
    } catch (err: any) {
      console.error('Sync pull failed', err);
      setSyncState('error');
      soundManager.playSyncFailure();
      addToast(err.message || 'Failed to pull from Google Sheets', 'error');
    }
  };

  // Google Sheets Push All
  const handleSyncPushAll = async () => {
    if (!syncConfig.gasWebAppUrl) return;

    try {
      setSyncState('syncing');
      soundManager.playSyncStart();
      await bulkSyncPromptsGAS(syncConfig.gasWebAppUrl, prompts);
      setSyncState('synced');
      soundManager.playSyncSuccess();
      setSyncConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      addToast(`Uploaded ${prompts.length} prompts to Google Sheet`, 'success');
    } catch (err: any) {
      console.error('Sync push failed', err);
      setSyncState('error');
      soundManager.playSyncFailure();
      addToast(err.message || 'Failed to push to Google Sheets', 'error');
    }
  };

  // Compute Categories with count
  const categoriesList = useMemo(() => {
    const map = new Map<string, number>();
    prompts.forEach((p) => {
      const cat = p.category.trim() || 'General';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [prompts]);

  // Compute Tags with count
  const tagsList = useMemo(() => {
    const map = new Map<string, number>();
    prompts.forEach((p) => {
      p.tags.forEach((t) => {
        const clean = t.trim();
        if (clean) map.set(clean, (map.get(clean) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [prompts]);

  const favoritesCount = useMemo(() => prompts.filter((p) => p.favorite).length, [prompts]);

  // Filtered and Sorted Prompts
  const filteredPrompts = useMemo(() => {
    let result = [...prompts];

    // Search query (title, content, tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const isTagSearch = q.startsWith('#');
      const cleanQ = isTagSearch ? q.substring(1) : q;

      result = result.filter((p) => {
        if (isTagSearch) {
          return p.tags.some((t) => t.toLowerCase().includes(cleanQ));
        }
        return (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    // Favorites only
    if (favoritesOnly) {
      result = result.filter((p) => p.favorite);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'updated-desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'updated-asc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'favorites-first':
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [prompts, searchQuery, selectedCategory, selectedTag, favoritesOnly, sortOption]);

  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || selectedTag || favoritesOnly
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
    setFavoritesOnly(false);
  };

  return (
    <div className="min-h-screen bg-zinc-100/60 text-zinc-900 flex font-sans antialiased selection:bg-zinc-200">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <Sidebar
        categories={categoriesList}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        tags={tagsList}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        favoritesOnly={favoritesOnly}
        onToggleFavoritesOnly={() => setFavoritesOnly(!favoritesOnly)}
        totalCount={prompts.length}
        favoritesCount={favoritesCount}
        syncState={syncState}
        hasGASUrl={Boolean(syncConfig.gasWebAppUrl)}
        onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        historyCount={history.length}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOption={sortOption}
          onSortOptionChange={setSortOption}
          onOpenNewPrompt={() => {
            setEditingPrompt(null);
            setIsPromptModalOpen(true);
          }}
          onOpenSidebarMobile={() => setIsSidebarMobileOpen(true)}
          onSyncRefresh={handleSyncPull}
          syncState={syncState}
          hasGASUrl={Boolean(syncConfig.gasWebAppUrl)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-4">
          {/* Active Filter Bar if any filter is set */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-zinc-200 rounded-lg text-xs shadow-2xs">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-zinc-400 font-medium text-[11px] uppercase tracking-wider">
                  Active Filter:
                </span>
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded font-medium">
                    Category: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      &times;
                    </button>
                  </span>
                )}
                {selectedTag && (
                  <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded font-medium">
                    #{selectedTag}
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      &times;
                    </button>
                  </span>
                )}
                {favoritesOnly && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-medium">
                    Favorites Only
                    <button
                      onClick={() => setFavoritesOnly(false)}
                      className="text-amber-500 hover:text-amber-800"
                    >
                      &times;
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded font-medium">
                    "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      &times;
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 underline flex items-center gap-1 flex-shrink-0"
              >
                <FilterX className="w-3 h-3" />
                Reset all
              </button>
            </div>
          )}

          {/* Subheader info: results count and quick action */}
          <div className="flex items-center justify-between text-xs text-zinc-500 px-0.5">
            <span className="font-medium">
              Showing <strong className="text-zinc-900">{filteredPrompts.length}</strong> {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
            </span>

            {!syncConfig.gasWebAppUrl && (
              <button
                type="button"
                onClick={() => setIsGoogleSheetModalOpen(true)}
                className="text-[11px] text-zinc-600 hover:text-zinc-900 flex items-center gap-1 bg-zinc-200/60 hover:bg-zinc-200 px-2 py-0.5 rounded transition-colors"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>Connect Google Sheets API</span>
              </button>
            )}
          </div>

          {/* Main List / Grid Display */}
          {filteredPrompts.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-zinc-200/90 rounded-xl p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-12 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">No prompts found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                {hasActiveFilters
                  ? "No prompts match your current filters or search terms. Try resetting your search."
                  : "You don't have any prompts saved yet. Create your first prompt to get started!"}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-3.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  Clear all filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPrompt(null);
                    setIsPromptModalOpen(true);
                  }}
                  className="mt-4 px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Prompt</span>
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onCopy={handleCopyPrompt}
                  onOpenVariableFill={(p) => {
                    setVariablePrompt(p);
                    setIsVariableModalOpen(true);
                  }}
                  onEdit={(p) => {
                    setEditingPrompt(p);
                    setIsPromptModalOpen(true);
                  }}
                  onDelete={(p) => {
                    setDeletingPrompt(p);
                    setIsDeleteModalOpen(true);
                  }}
                  onToggleFavorite={handleToggleFavorite}
                  onSelectTag={setSelectedTag}
                  onSelectCategory={setSelectedCategory}
                  isRecentlyCopied={recentlyCopiedId === prompt.id}
                />
              ))}
            </div>
          ) : (
            /* Compact List View */
            <div className="space-y-1.5">
              {filteredPrompts.map((prompt) => (
                <PromptListItem
                  key={prompt.id}
                  prompt={prompt}
                  onCopy={handleCopyPrompt}
                  onOpenVariableFill={(p) => {
                    setVariablePrompt(p);
                    setIsVariableModalOpen(true);
                  }}
                  onEdit={(p) => {
                    setEditingPrompt(p);
                    setIsPromptModalOpen(true);
                  }}
                  onDelete={(p) => {
                    setDeletingPrompt(p);
                    setIsDeleteModalOpen(true);
                  }}
                  onToggleFavorite={handleToggleFavorite}
                  isRecentlyCopied={recentlyCopiedId === prompt.id}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Prompt Modal */}
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
          setEditingPrompt(null);
        }}
        onSave={handleSavePrompt}
        promptToEdit={editingPrompt}
        existingCategories={categoriesList.map((c) => c.name)}
        existingTags={tagsList.map((t) => t.name)}
      />

      {/* Variable Fill & Copy Modal */}
      <VariableFillModal
        isOpen={isVariableModalOpen}
        onClose={() => {
          setIsVariableModalOpen(false);
          setVariablePrompt(null);
        }}
        prompt={variablePrompt}
        onCopySuccess={handleVariableFillSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingPrompt(null);
        }}
        prompt={deletingPrompt}
        onConfirm={handleConfirmDelete}
      />

      {/* Google Sheets & Apps Script Setup Modal */}
      <GoogleSheetModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
        config={syncConfig}
        syncState={syncState}
        onSaveConfig={(newConfig) => {
          setSyncConfig(newConfig);
          addToast('Google Apps Script configuration saved');
        }}
        onSyncPull={handleSyncPull}
        onSyncPushAll={handleSyncPushAll}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={history}
        onClearHistory={() => {
          setHistory([]);
          addToast('Copy history cleared');
        }}
        onReCopy={handleReCopyHistory}
        copiedId={historyCopiedId}
      />
    </div>
  );
}
