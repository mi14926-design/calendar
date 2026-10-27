import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  AlignLeft,
  Bell,
  Plus,
  Trash2,
  Tag,
  Check,
  CloudUpload,
  Settings,
} from 'lucide-react';
import type { CalendarCategory, CalendarEvent, CategoryItem, EventReminder } from '../types/calendar';
import { formatReminderLabel } from '../types/calendar';
import { toDateTimeLocalString, toDateOnlyString } from '../utils/dateUtils';

interface EventModalProps {
  isOpen: boolean;
  event: Partial<CalendarEvent> | null;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onRequestDelete?: (event: CalendarEvent) => void;
  isOnline: boolean;
  isGoogleConnected: boolean;
  categories: CategoryItem[];
  onOpenCategoryManager?: () => void;
}

const REMINDER_PRESETS = [
  { label: 'At event time', minutes: 0 },
  { label: '10m before', minutes: 10 },
  { label: '30m before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '2 hours before', minutes: 120 },
  { label: '1 day before', minutes: 1440 },
  { label: '2 days before', minutes: 2880 },
  { label: '1 week before', minutes: 10080 },
];

type ReminderUnit = 'minutes' | 'hours' | 'days';

export function EventModal({
  isOpen,
  event,
  onClose,
  onSave,
  onRequestDelete,
  isOnline,
  isGoogleConnected,
  categories,
  onOpenCategoryManager,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [startDateOnly, setStartDateOnly] = useState('');
  const [endDateOnly, setEndDateOnly] = useState('');
  const [category, setCategory] = useState<CalendarCategory>('work');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [reminders, setReminders] = useState<EventReminder[]>([]);

  // Custom reminder input with hours and days
  const [customReminderVal, setCustomReminderVal] = useState<string>('2');
  const [customReminderUnit, setCustomReminderUnit] = useState<ReminderUnit>('hours');
  const [showCustomReminderInput, setShowCustomReminderInput] = useState(false);

  useEffect(() => {
    if (!event) return;

    setTitle(event.title || '');
    setAllDay(!!event.allDay);
    setCategory(event.category || (categories[0]?.id ?? 'work'));
    setLocation(event.location || '');
    setDescription(event.description || '');
    setReminders(
      event.reminders && event.reminders.length > 0
        ? [...event.reminders]
        : [{ minutes: 10, method: 'popup' }]
    );

    const now = new Date();
    const start = event.start ? new Date(event.start) : new Date(now.setMinutes(0, 0, 0));
    const end = event.end ? new Date(event.end) : new Date(start.getTime() + 60 * 60 * 1000);

    setStartDateTime(toDateTimeLocalString(start));
    setEndDateTime(toDateTimeLocalString(end));
    setStartDateOnly(toDateOnlyString(start));
    setEndDateOnly(toDateOnlyString(end));
    setShowCustomReminderInput(false);
  }, [event, categories]);

  if (!isOpen) return null;

  const currentCategoryItem = categories.find((c) => c.id === category) || categories[0] || {
    id: 'work',
    label: 'Work',
    color: '#3b82f6',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalStart: string;
    let finalEnd: string;

    if (allDay) {
      finalStart = `${startDateOnly}T00:00:00.000Z`;
      finalEnd = `${endDateOnly}T23:59:59.000Z`;
    } else {
      finalStart = new Date(startDateTime).toISOString();
      const parsedEnd = new Date(endDateTime);
      if (parsedEnd <= new Date(startDateTime)) {
        finalEnd = new Date(new Date(startDateTime).getTime() + 30 * 60 * 1000).toISOString();
      } else {
        finalEnd = parsedEnd.toISOString();
      }
    }

    const savedEvent: CalendarEvent = {
      id: event?.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      googleId: event?.googleId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      start: finalStart,
      end: finalEnd,
      allDay,
      color: currentCategoryItem.color,
      category,
      reminders,
      synced: false,
      lastModified: Date.now(),
    };

    onSave(savedEvent);
    onClose();
  };

  const handleAddPresetReminder = (minutes: number) => {
    if (reminders.some((r) => r.minutes === minutes)) return;
    setReminders([...reminders, { minutes, method: 'popup' }]);
  };

  const handleAddCustomReminder = () => {
    const rawVal = parseFloat(customReminderVal);
    if (isNaN(rawVal) || rawVal < 0) return;

    let totalMinutes = Math.round(rawVal);
    if (customReminderUnit === 'hours') {
      totalMinutes = Math.round(rawVal * 60);
    } else if (customReminderUnit === 'days') {
      totalMinutes = Math.round(rawVal * 1440);
    }

    if (!reminders.some((r) => r.minutes === totalMinutes)) {
      setReminders([...reminders, { minutes: totalMinutes, method: 'popup' }]);
    }
    setShowCustomReminderInput(false);
  };

  const handleRemoveReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
      >
        {/* Sticky Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
              style={{ backgroundColor: currentCategoryItem.color }}
            />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {event?.id ? 'Edit Event' : 'New Event'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync notification strip */}
        {isGoogleConnected ? (
          <div className="px-4 sm:px-6 py-2 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-[11px] sm:text-xs text-indigo-700 dark:text-indigo-300 shrink-0">
            <CloudUpload className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>
              {isOnline
                ? 'Syncs in real-time with your Google Calendar'
                : 'Offline: Changes will sync when network is restored'}
            </span>
          </div>
        ) : null}

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} id="event-form" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add event title..."
              className="w-full px-3.5 py-2 sm:py-2.5 text-sm sm:text-base font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Category Selector with Edit / New Category Action */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Category & Color
              </label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" /> Manage Categories
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center justify-start gap-2 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate flex-1 text-left">{cat.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}

              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              )}
            </div>
          </div>

          {/* All day toggle & Date/Time inputs */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> All-day event
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 sm:w-11 sm:h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {allDay ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDateOnly}
                    onChange={(e) => {
                      setStartDateOnly(e.target.value);
                      if (endDateOnly < e.target.value) setEndDateOnly(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDateOnly}
                    min={startDateOnly}
                    onChange={(e) => setEndDateOnly(e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" /> Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDateTime}
                    onChange={(e) => {
                      setStartDateTime(e.target.value);
                      if (endDateTime <= e.target.value) {
                        const newEnd = new Date(new Date(e.target.value).getTime() + 60 * 60 * 1000);
                        setEndDateTime(toDateTimeLocalString(newEnd));
                      }
                    }}
                    className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" /> End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDateTime}
                    min={startDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Custom Event Reminders with Minutes, Hours, and Days */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Custom Event Reminders
              </label>
              <button
                type="button"
                onClick={() => setShowCustomReminderInput(!showCustomReminderInput)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Custom Time (Hours/Days)
              </button>
            </div>

            {/* Existing Reminders chips */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5 min-h-[30px]">
              {reminders.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No reminders set</span>
              ) : (
                reminders.map((rem, idx) => {
                  const label = formatReminderLabel(rem.minutes);
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-700 dark:text-indigo-300"
                    >
                      <Bell className="w-3 h-3" />
                      {label}
                      <button
                        type="button"
                        onClick={() => handleRemoveReminder(idx)}
                        className="hover:text-rose-500 transition-colors p-0.5 rounded cursor-pointer"
                        title="Remove reminder"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Custom Time Input (Hours, Days, Minutes) */}
            {showCustomReminderInput && (
              <div className="flex flex-wrap items-center gap-2 p-3 mb-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-100">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Remind me
                </span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customReminderVal}
                  onChange={(e) => setCustomReminderVal(e.target.value)}
                  className="w-16 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                {/* Unit Selector: Minutes / Hours / Days */}
                <select
                  value={customReminderUnit}
                  onChange={(e) => setCustomReminderUnit(e.target.value as ReminderUnit)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="minutes">Minute(s)</option>
                  <option value="hours">Hour(s)</option>
                  <option value="days">Day(s)</option>
                </select>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  before event
                </span>
                <button
                  type="button"
                  onClick={handleAddCustomReminder}
                  className="px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer ml-auto"
                >
                  Add Reminder
                </button>
              </div>
            )}

            {/* Popular Presets (Including Hours and Days) */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {REMINDER_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => handleAddPresetReminder(preset.minutes)}
                  disabled={reminders.some((r) => r.minutes === preset.minutes)}
                  className="px-2 py-0.5 sm:py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  +{preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Location / Video Link
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Google Meet, Room 402, or Blue Bottle Cafe"
              className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" /> Notes & Agenda
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add agenda, notes, or details..."
              className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </form>

        {/* Sticky Modal Actions Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
          {event?.id && onRequestDelete ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestDelete(event as CalendarEvent);
              }}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="event-form"
              className="px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-xs transition-all focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {event?.id ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
