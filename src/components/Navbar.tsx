import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  LogOut,
  PanelLeft,
} from 'lucide-react';
import type { CalendarView, SyncStatus } from '../types/calendar';
import { MONTH_NAMES } from '../utils/dateUtils';
import type { User } from 'firebase/auth';

interface NavbarProps {
  currentDate: Date;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onOpenCreateModal: () => void;
  user: User | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
  syncStatus: SyncStatus;
  onManualSync: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onToggleSidebar?: () => void;
}

export function Navbar({
  currentDate,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToday,
  currentView,
  onViewChange,
  onOpenCreateModal,
  user,
  onGoogleSignIn,
  onSignOut,
  isLoggingIn,
  syncStatus,
  onManualSync,
  isDarkMode,
  onToggleDarkMode,
  isSoundEnabled,
  onToggleSound,
  isOnline,
  pendingSyncCount,
  onToggleSidebar,
}: NavbarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Dynamic header title according to current view and screen
  let headerTitle = `${MONTH_NAMES[month]} ${year}`;
  if (currentView === 'day') {
    headerTitle = currentDate.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6">
        {/* ========================================================= */}
        {/* DESKTOP & TABLET VIEW (>= 768px: Large, Medium, Small Desktop & Tablet) */}
        {/* ========================================================= */}
        <div className="hidden md:flex items-center justify-between gap-3 py-2.5 sm:py-3">
          {/* Left: Sidebar Toggle + Brand + Navigation */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Toggle Sidebar & Mini Calendar"
                aria-label="Toggle Sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            {/* Logo & App Title */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <CalendarIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm lg:text-base tracking-tight text-slate-900 dark:text-white shrink-0 whitespace-nowrap">
                  Chronosync
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1 py-0.2 rounded-sm hidden xl:inline-block">
                  Pro
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden lg:block" />

            {/* Date Navigation Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onNavigateToday}
                className="px-2.5 py-1 lg:px-3 lg:py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                Today
              </button>
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={onNavigatePrev}
                  className="p-1 lg:p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Previous"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onNavigateNext}
                  className="p-1 lg:p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700"
                  title="Next"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Date Title */}
            <h2 className="text-sm md:text-base lg:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate ml-1">
              {headerTitle}
            </h2>
          </div>

          {/* Right: View Selector + Auth + Actions */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              {(['month', 'week', 'day', 'agenda'] as CalendarView[]).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => onViewChange(view)}
                  className={`px-2.5 lg:px-3 py-1 text-xs font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                    currentView === view
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Sync Button */}
            {user && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={syncStatus === 'syncing' || !isOnline}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-60 cursor-pointer"
                title="Sync with Google Calendar"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${
                    syncStatus === 'syncing' ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden xl:inline">
                  {syncStatus === 'syncing'
                    ? 'Syncing...'
                    : !isOnline
                    ? 'Offline'
                    : 'Sync'}
                </span>
                {pendingSyncCount > 0 && (
                  <span className="bg-amber-500 text-white rounded-full px-1.5 text-[9px] font-bold">
                    {pendingSyncCount}
                  </span>
                )}
              </button>
            )}

            {/* Google Profile or Sign In */}
            {user ? (
              <div className="flex items-center gap-1.5 lg:gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                <div
                  className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500/30 overflow-hidden shrink-0"
                  title={`Signed in as ${user.email}`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (user.displayName || user.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Sign out of Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                className="gsi-material-button shadow-xs !h-[34px] !px-3 text-xs"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon !w-4 !h-4 !mr-1.5">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents !text-xs hidden lg:inline">
                    {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                  </span>
                  <span className="gsi-material-button-contents !text-xs lg:hidden">
                    {isLoggingIn ? '...' : 'Sign in'}
                  </span>
                </div>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer ${
                isSoundEnabled
                  ? 'text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isSoundEnabled ? 'Chime sound enabled' : 'Muted'}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* New Event Button */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3 lg:px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">New Event</span>
              <span className="lg:hidden">New</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE & COMPACT VIEW (< 768px: Smart 2-Row Layout, No Truncation) */}
        {/* ========================================================= */}
        <div className="md:hidden flex flex-col py-2 gap-2">
          {/* Mobile Row 1: Brand + Sidebar Trigger + Controls + Profile */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              {onToggleSidebar && (
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className="p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Open Navigation"
                  aria-label="Open Navigation"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white shrink-0 whitespace-nowrap">
                  Chronosync
                </span>
              </div>
            </div>

            {/* Right Controls on Mobile Row 1 */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={onToggleSound}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title={isSoundEnabled ? 'Chime sound enabled' : 'Muted'}
                aria-label="Toggle chime sound"
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Google Sign In / Avatar */}
              {user ? (
                <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800 shrink-0">
                  <div
                    className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] ring-1 ring-indigo-500/30 overflow-hidden shrink-0"
                    title={`Signed in as ${user.email}`}
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      (user.displayName || user.email || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isLoggingIn}
                  className="h-7 px-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  title="Sign in with Google"
                  aria-label="Sign in with Google"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span className="hidden min-[380px]:inline">Sign in</span>
                </button>
              )}

              {/* Quick Add Button */}
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer shrink-0"
                title="Create New Event"
                aria-label="Create New Event"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Row 2: Date Navigation + View Mode Switcher */}
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            {/* Date Nav Controls + Header Title */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={onNavigateToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                Today
              </button>
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={onNavigatePrev}
                  className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                  title="Previous period"
                  aria-label="Previous period"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onNavigateNext}
                  className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border-l border-slate-200 dark:border-slate-700 shrink-0"
                  title="Next period"
                  aria-label="Next period"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Full Readable Title (Now with abundant room, never truncating "November 2026") */}
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate min-w-0 ml-0.5">
                {headerTitle}
              </h2>
            </div>

            {/* View Selector Dropdown + Sync Indicator */}
            <div className="flex items-center gap-1.5 shrink-0">
              {user && (
                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={syncStatus === 'syncing' || !isOnline}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Sync Calendar"
                  aria-label="Sync Calendar"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`}
                  />
                </button>
              )}

              {/* View Selector Dropdown: Touch-friendly & Compact */}
              <div className="relative shrink-0">
                <select
                  value={currentView}
                  onChange={(e) => onViewChange(e.target.value as CalendarView)}
                  aria-label="Select calendar view"
                  className="appearance-none pl-2.5 pr-6 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer capitalize shadow-xs"
                >
                  <option value="month" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium">Month</option>
                  <option value="week" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium">Week</option>
                  <option value="day" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium">Day</option>
                  <option value="agenda" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium">Agenda</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
