import { Bell, Clock, MapPin, X } from 'lucide-react';
import type { TriggeredReminder } from '../services/notification';

interface ReminderToastProps {
  reminders: TriggeredReminder[];
  onDismiss: (eventId: string) => void;
  onSnooze: (eventId: string, minutes: number) => void;
}

export function ReminderToast({ reminders, onDismiss, onSnooze }: ReminderToastProps) {
  if (reminders.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-50 flex flex-col gap-2.5 pointer-events-none">
      {reminders.map((reminder) => {
        const timeStr = new Date(reminder.eventStart).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        });
        const minutesLabel =
          reminder.minutesBefore === 0
            ? 'Starting now'
            : reminder.minutesBefore >= 1440
            ? `In ${Math.round(reminder.minutesBefore / 1440)}d`
            : reminder.minutesBefore >= 60
            ? `In ${Math.round(reminder.minutesBefore / 60)}h`
            : `In ${reminder.minutesBefore}m`;

        return (
          <div
            key={`${reminder.eventId}_${reminder.minutesBefore}`}
            className="pointer-events-auto bg-white dark:bg-slate-900 border-2 border-indigo-500/40 dark:border-indigo-400/50 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md transform transition-all duration-300 animate-in slide-in-from-bottom-4"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Event Reminder
                </span>
              </div>
              <button
                onClick={() => onDismiss(reminder.eventId)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="mt-1.5 text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
              {reminder.eventTitle}
            </h4>

            <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                <Clock className="w-3.5 h-3.5" />
                {minutesLabel} ({timeStr})
              </span>
              {reminder.location && (
                <span className="flex items-center gap-1 truncate max-w-[140px]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {reminder.location}
                </span>
              )}
            </div>

            <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSnooze(reminder.eventId, 5)}
                  className="px-2 py-1 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  +5m
                </button>
                <button
                  type="button"
                  onClick={() => onSnooze(reminder.eventId, 15)}
                  className="px-2 py-1 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  +15m
                </button>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(reminder.eventId)}
                className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
