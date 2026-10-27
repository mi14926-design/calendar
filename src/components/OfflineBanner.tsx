import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingSyncCount: number;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export function OfflineBanner({
  isOnline,
  pendingSyncCount,
  onSyncNow,
  isSyncing,
}: OfflineBannerProps) {
  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-medium transition-colors ${
        !isOnline
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200'
          : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> You can create, edit, reschedule, or delete events. All changes are stored locally and will automatically sync once your connection is restored.
            </span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Connection restored. You have <strong>{pendingSyncCount}</strong> pending modification{pendingSyncCount > 1 ? 's' : ''} queued for Google Calendar.
            </span>
          </>
        )}
      </div>

      {pendingSyncCount > 0 && isOnline && (
        <button
          type="button"
          onClick={onSyncNow}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Queued Changes'}
        </button>
      )}
    </div>
  );
}
