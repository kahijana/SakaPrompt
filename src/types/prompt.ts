export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  favorite: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptHistoryItem {
  id: string;
  promptId: string;
  promptTitle: string;
  copiedContent: string;
  timestamp: string;
  variablesUsed?: Record<string, string>;
}

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncConfig {
  gasWebAppUrl: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
  sheetName: string;
}

export type ViewMode = 'grid' | 'compact';
export type SortOption = 'updated-desc' | 'updated-asc' | 'title-asc' | 'title-desc' | 'favorites-first';
