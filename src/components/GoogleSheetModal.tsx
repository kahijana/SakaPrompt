import React, { useState } from 'react';
import { GOOGLE_APPS_SCRIPT_CODE, testConnectionGAS } from '../services/gasService';
import { SyncConfig, SyncState } from '../types/prompt';
import { 
  X, Check, Copy, ExternalLink, RefreshCw, Database, 
  HelpCircle, Code2, Table, CheckCircle2, AlertCircle, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SyncConfig;
  syncState: SyncState;
  onSaveConfig: (newConfig: SyncConfig) => void;
  onSyncPull: () => void;
  onSyncPushAll: () => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  config,
  syncState,
  onSaveConfig,
  onSyncPull,
  onSyncPushAll,
}) => {
  const [urlInput, setUrlInput] = useState(config.gasWebAppUrl);
  const [activeTab, setActiveTab] = useState<'connection' | 'code' | 'schema' | 'guide'>('connection');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testConnectionGAS(urlInput);
      setTestResult(res);
      if (res.success) {
        onSaveConfig({
          ...config,
          gasWebAppUrl: urlInput.trim(),
        });
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      ...config,
      gasWebAppUrl: urlInput.trim(),
    });
    onClose();
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-xl border border-zinc-200/80 w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gas-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-zinc-200/70 text-zinc-800">
              <Database className="w-4 h-4" />
            </span>
            <div>
              <h2 id="gas-modal-title" className="text-sm font-semibold text-zinc-900">
                Google Sheets & Apps Script Sync
              </h2>
              <p className="text-xs text-zinc-500">
                Persistent database powered by Google Sheets and Google Apps Script
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-md hover:bg-zinc-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-100 px-5 bg-white text-xs">
          <button
            onClick={() => setActiveTab('connection')}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'connection'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Connection
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'code'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Backend Code (Code.gs)
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'schema'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Sheet Schema
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'guide'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Deploy Guide
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {activeTab === 'connection' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  <span>Google Apps Script Web App URL</span>
                  {config.lastSyncedAt && (
                    <span className="text-[11px] font-normal text-zinc-400">
                      Last synced: {new Date(config.lastSyncedAt).toLocaleTimeString()}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="flex-1 px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white text-zinc-900 placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !urlInput.trim()}
                    className="px-3 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    {testingConnection ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                    <span>Test Connection</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Must be deployed as Web App with "Execute as: Me" and "Who has access: Anyone".
                </p>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.count !== undefined && (
                      <p className="text-[11px] mt-0.5 opacity-90">
                        {testResult.count} prompt{testResult.count === 1 ? '' : 's'} detected in Google Sheet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sync Actions Card */}
              <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-800">
                    Direct Sync Operations
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Status: {syncState}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onSyncPull}
                    disabled={!config.gasWebAppUrl || syncState === 'syncing'}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-lg disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Pull from Google Sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={onSyncPushAll}
                    disabled={!config.gasWebAppUrl || syncState === 'syncing'}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-lg disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <ArrowUpFromLine className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Upload All to Sheet</span>
                  </button>
                </div>
              </div>

              {/* Local Storage fallback note */}
              <div className="text-[11px] text-zinc-500 bg-zinc-100/70 p-3 rounded-lg leading-relaxed">
                <strong>Offline-ready fallback:</strong> All changes are continuously backed up in your browser's local storage. When you configure the Google Apps Script URL, changes automatically sync to your Google Sheet!
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">
                  Google Apps Script code for <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono">Code.gs</code>:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                >
                  {codeCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Copy Full Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative border border-zinc-200 rounded-lg overflow-hidden bg-zinc-900 text-zinc-100 max-h-80 overflow-y-auto">
                <pre className="p-4 text-[11px] font-mono leading-relaxed select-all">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>

              <p className="text-[11px] text-zinc-500">
                This code automatically handles auto-creating the "Prompts" tab with proper header row, LockService concurrency guards, and JSON responses.
              </p>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-zinc-700 font-medium">
                  Google Sheet: <span className="font-semibold">"Saka Prompt DB"</span> &middot; Tab: <span className="font-semibold">"Prompts"</span>
                </p>
                <p className="text-[11px] text-zinc-500">
                  The script will automatically format and create these columns on first run if they do not exist:
                </p>
              </div>

              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-100 text-zinc-700 border-b border-zinc-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold w-16">Col</th>
                      <th className="py-2 px-3 font-semibold">Field Name</th>
                      <th className="py-2 px-3 font-semibold">Type</th>
                      <th className="py-2 px-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono text-[11px] text-zinc-600">
                    <tr>
                      <td className="py-2 px-3 font-bold text-zinc-900">A</td>
                      <td className="py-2 px-3 text-zinc-900 font-semibold">id</td>
                      <td className="py-2 px-3">String</td>
                      <td className="py-2 px-3 font-sans">Unique prompt identifier</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-zinc-900">B</td>
                      <td className="py-2 px-3 text-zinc-900 font-semibold">title</td>
                      <td className="py-2 px-3">String</td>
                      <td className="py-2 px-3 font-sans">Prompt title / headline</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-zinc-900">C</td>
                      <td className="py-2 px-3 text-zinc-900 font-semibold">content</td>
                      <td className="py-2 px-3">String</td>
                      <td className="py-2 px-3 font-sans">Full prompt content with variables</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-zinc-900">D</td>
                      <td className="py-2 px-3 text-zinc-900 font-semibold">category</td>
                      <td className="py-2 px-3">String</td>
                      <td className="py-2 px-3 font-sans">Category name</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-zinc-900">E</td>
                      <td className="py-2 px-3 text-zinc-900 font-semibold">tags</td>
                      <td className="py-2 px-3">String</td>
                      <td className="py-2 px-3 font-sans">Comma-separated tags (e.g. SEO, B2B)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-zinc-900">F</td>
                      <td className="py-2 px-3 text-zinc-900 font-semibold">favorite</td>
                      <td className="py-2 px-3">Boolean</td>
                      <td className="py-2 px-3 font-sans">TRUE / FALSE</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-zinc-900">G</td>
                      <td className="py-2 px-3 text-zinc-900 font-semibold">createdAt</td>
                      <td className="py-2 px-3">DateTime</td>
                      <td className="py-2 px-3 font-sans">Creation timestamp</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-zinc-900">H</td>
                      <td className="py-2 px-3 text-zinc-900 font-semibold">updatedAt</td>
                      <td className="py-2 px-3">DateTime</td>
                      <td className="py-2 px-3 font-sans">Last modified timestamp</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-zinc-900">I</td>
                      <td className="py-2 px-3 text-zinc-900 font-semibold">imageUrl</td>
                      <td className="py-2 px-3">String</td>
                      <td className="py-2 px-3 font-sans">Optional thumbnail image link (16:9)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-zinc-700">
              <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg space-y-2.5">
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900">Create a Google Spreadsheet</p>
                    <p className="text-zinc-500 text-[11px]">
                      Go to <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline font-medium inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-2.5 h-2.5" /></a> and name your spreadsheet <strong>Saka Prompt DB</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900">Open Apps Script</p>
                    <p className="text-zinc-500 text-[11px]">
                      In the spreadsheet menu, click <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900">Paste Code.gs</p>
                    <p className="text-zinc-500 text-[11px]">
                      Copy the code from the <strong>Backend Code</strong> tab, paste it over the default script, and click Save (Floppy disk icon).
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900">Deploy as Web App</p>
                    <p className="text-zinc-500 text-[11px]">
                      Click <strong>Deploy</strong> &gt; <strong>New deployment</strong>. Select type <strong>Web app</strong>. Set:
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-zinc-600 mt-1 space-y-0.5">
                      <li><strong>Execute as:</strong> Me (your email)</li>
                      <li><strong>Who has access:</strong> Anyone</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    5
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900">Copy URL &amp; Connect</p>
                    <p className="text-zinc-500 text-[11px]">
                      Copy the generated Web App URL, paste it into the <strong>Connection</strong> tab in this dialog, and click <strong>Test Connection</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 bg-zinc-50/70">
          <span className="text-[11px] text-zinc-400">
            {config.gasWebAppUrl ? 'Connected to Google Sheets' : 'Local storage active'}
          </span>
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
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md shadow-xs active:scale-[0.98] transition-all"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
