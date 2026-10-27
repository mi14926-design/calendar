export type CalendarCategory = string;

export interface EventReminder {
  minutes: number; // minutes before start
  method: 'popup' | 'audio' | 'email';
  triggered?: boolean;
}

export interface CalendarEvent {
  id: string;
  googleId?: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO string e.g. "2026-10-18T10:00:00.000Z"
  end: string;   // ISO string e.g. "2026-10-18T11:00:00.000Z"
  allDay: boolean;
  color: string; // Hex code or preset color
  category: CalendarCategory;
  reminders: EventReminder[];
  synced: boolean;
  offlinePending?: boolean;
  lastModified: number;
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface OfflineQueueItem {
  id: string; // unique operation id
  action: 'create' | 'update' | 'delete';
  event: CalendarEvent;
  timestamp: number;
}

export interface CategoryItem {
  id: string;
  label: string;
  color: string; // hex code
  isCustom?: boolean;
}

export interface CategoryTheme {
  id: string;
  label: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderLight: string;
  borderDark: string;
  badgeBg: string;
  dotColor: string;
  customStyle?: React.CSSProperties;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'work', label: 'Work', color: '#3b82f6', isCustom: false },
  { id: 'personal', label: 'Personal', color: '#10b981', isCustom: false },
  { id: 'meeting', label: 'Meeting', color: '#a855f7', isCustom: false },
  { id: 'reminder', label: 'Reminder', color: '#f59e0b', isCustom: false },
  { id: 'focus', label: 'Focus Time', color: '#6366f1', isCustom: false },
  { id: 'urgent', label: 'Urgent', color: '#f43f5e', isCustom: false },
];

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  work: {
    id: 'work',
    label: 'Work',
    bgLight: 'bg-blue-50 hover:bg-blue-100',
    bgDark: 'dark:bg-blue-950/60 dark:hover:bg-blue-900/70',
    textLight: 'text-blue-700',
    textDark: 'dark:text-blue-300',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-800',
    badgeBg: 'bg-blue-500',
    dotColor: '#3b82f6',
  },
  personal: {
    id: 'personal',
    label: 'Personal',
    bgLight: 'bg-emerald-50 hover:bg-emerald-100',
    bgDark: 'dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70',
    textLight: 'text-emerald-700',
    textDark: 'dark:text-emerald-300',
    borderLight: 'border-emerald-200',
    borderDark: 'dark:border-emerald-800',
    badgeBg: 'bg-emerald-500',
    dotColor: '#10b981',
  },
  meeting: {
    id: 'meeting',
    label: 'Meeting',
    bgLight: 'bg-purple-50 hover:bg-purple-100',
    bgDark: 'dark:bg-purple-950/60 dark:hover:bg-purple-900/70',
    textLight: 'text-purple-700',
    textDark: 'dark:text-purple-300',
    borderLight: 'border-purple-200',
    borderDark: 'dark:border-purple-800',
    badgeBg: 'bg-purple-500',
    dotColor: '#a855f7',
  },
  reminder: {
    id: 'reminder',
    label: 'Reminder',
    bgLight: 'bg-amber-50 hover:bg-amber-100',
    bgDark: 'dark:bg-amber-950/60 dark:hover:bg-amber-900/70',
    textLight: 'text-amber-700',
    textDark: 'dark:text-amber-300',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-800',
    badgeBg: 'bg-amber-500',
    dotColor: '#f59e0b',
  },
  focus: {
    id: 'focus',
    label: 'Focus Time',
    bgLight: 'bg-indigo-50 hover:bg-indigo-100',
    bgDark: 'dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70',
    textLight: 'text-indigo-700',
    textDark: 'dark:text-indigo-300',
    borderLight: 'border-indigo-200',
    borderDark: 'dark:border-indigo-800',
    badgeBg: 'bg-indigo-500',
    dotColor: '#6366f1',
  },
  urgent: {
    id: 'urgent',
    label: 'Urgent',
    bgLight: 'bg-rose-50 hover:bg-rose-100',
    bgDark: 'dark:bg-rose-950/60 dark:hover:bg-rose-900/70',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    borderLight: 'border-rose-200',
    borderDark: 'dark:border-rose-800',
    badgeBg: 'bg-rose-500',
    dotColor: '#f43f5e',
  },
};

/**
 * Get styling tokens for any category, dynamically synthesizing styles for custom user categories
 */
export function getCategoryTheme(
  categoryId: string,
  categoriesList?: CategoryItem[]
): CategoryTheme {
  if (CATEGORY_THEMES[categoryId]) {
    return CATEGORY_THEMES[categoryId];
  }

  const customCat = categoriesList?.find((c) => c.id === categoryId);
  const color = customCat?.color || '#6366f1';
  const label = customCat?.label || categoryId;

  return {
    id: categoryId,
    label,
    bgLight: 'bg-slate-50 hover:bg-slate-100',
    bgDark: 'dark:bg-slate-900/80 dark:hover:bg-slate-800',
    textLight: 'text-slate-800',
    textDark: 'dark:text-slate-100',
    borderLight: 'border-slate-200',
    borderDark: 'dark:border-slate-700',
    badgeBg: 'bg-indigo-500',
    dotColor: color,
  };
}

/**
 * Format reminder minutes into human-readable label (e.g. "15 min before", "2 hours before", "3 days before")
 */
export function formatReminderLabel(minutes: number): string {
  if (minutes === 0) return 'At event time';
  if (minutes === 60) return '1 hour before';
  if (minutes === 1440) return '1 day before';

  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} days before`;
  }

  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hours before`;
  }

  if (minutes > 1440) {
    const days = Math.floor(minutes / 1440);
    const remHours = Math.floor((minutes % 1440) / 60);
    if (remHours > 0) {
      return `${days}d ${remHours}h before`;
    }
    return `${days} days before`;
  }

  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return `${hours}h ${remMins}m before`;
  }

  return `${minutes} min before`;
}
