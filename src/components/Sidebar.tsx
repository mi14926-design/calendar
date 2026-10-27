import {
  Bell,
  CheckCircle2,
  Cloud,
  Sparkles,
  Wifi,
  WifiOff,
  X,
  Calendar as CalendarIcon,
  Settings,
  Plus,
} from 'lucide-react';
import type { CalendarCategory, CalendarEvent, CategoryItem } from '../types/calendar';
import { MiniCalendar } from './MiniCalendar';
import type { User } from 'firebase/auth';

interface SidebarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
  selectedCategories: Set<CalendarCategory>;
  onToggleCategory: (category: CalendarCategory) => void;
  user: User | null;
  isOnline: boolean;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
  lastSyncedAt: Date | null;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  categories: CategoryItem[];
  onOpenCategoryManager: () => void;
}

export function Sidebar({
  currentDate,
  onSelectDate,
  events,
  selectedCategories,
  onToggleCategory,
  user,
  isOnline,
  notificationPermission,
  onRequestNotificationPermission,
  lastSyncedAt,
  isOpenMobile = false,
  onCloseMobile,
  categories,
  onOpenCategoryManager,
}: SidebarProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = events.filter((ev) => ev.start.slice(0, 10) === todayStr).length;
  const remindersCount = events.filter((ev) => ev.reminders && ev.reminders.length > 0).length;

  const content = (
    <div className="flex flex-col gap-3.5 sm:gap-4 p-1">
      {/* Mobile Drawer Header with Close Button */}
      <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white">Calendar Navigation</span>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mini Calendar */}
      <MiniCalendar
        currentDate={currentDate}
        onSelectDate={(date) => {
          onSelectDate(date);
          if (onCloseMobile && window.innerWidth < 1024) {
            onCloseMobile();
          }
        }}
        events={events}
      />

      {/* Quick Stats Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Overview</span>
          <span className="text-[10px] lowercase font-normal bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
            {events.length} events
          </span>
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium block">
              Today
            </span>
            <span className="text-lg sm:text-xl font-black text-indigo-900 dark:text-indigo-100">
              {todayCount}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50">
            <span className="text-xs text-purple-700 dark:text-purple-300 font-medium block flex items-center gap-1">
              <Bell className="w-3 h-3" /> Reminders
            </span>
            <span className="text-lg sm:text-xl font-black text-purple-900 dark:text-purple-100">
              {remindersCount}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filters with Edit Option */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Categories
          </h4>
          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            title="Create, rename, or color categories"
          >
            <Settings className="w-3 h-3" />
            <span>Manage</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
          {categories.map((cat) => {
            const isChecked = selectedCategories.has(cat.id);
            const count = events.filter((ev) => ev.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onToggleCategory(cat.id)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isChecked ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-40'
                    }`}
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.label}</span>
                </div>
                <span className="text-[10px] font-semibold opacity-60 ml-1.5">({count})</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenCategoryManager}
          className="w-full mt-2.5 py-1.5 px-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add / Edit Category
        </button>
      </div>

      {/* Google Calendar Sync & Offline Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5 text-indigo-500" /> Sync Status
        </h4>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Google Calendar:</span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                user ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}
            >
              {user ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </>
              ) : (
                'Not connected'
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Network:</span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" /> Online
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" /> Offline
                </>
              )}
            </span>
          </div>

          {lastSyncedAt && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Last synced:</span>
              <span>{lastSyncedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {/* Browser Notification Permission trigger */}
        {notificationPermission !== 'granted' && (
          <button
            type="button"
            onClick={onRequestNotificationPermission}
            className="w-full mt-2.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable System Reminders</span>
          </button>
        )}
      </div>

      {/* Helpful Shortcuts Card */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" /> Pro Tips
        </div>
        <p>• Drag & drop events to quickly reschedule.</p>
        <p>• Offline edits sync automatically when back online.</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View (Visible on lg and larger: 1024px+) */}
      <aside className="hidden lg:flex w-72 2xl:w-80 shrink-0 flex-col gap-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
        {content}
      </aside>

      {/* Mobile & Tablet Drawer Modal (< 1024px) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-2xl p-4 overflow-y-auto z-10 flex flex-col animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
