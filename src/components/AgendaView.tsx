import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Bell,
  CloudCheck,
  MapPin,
  Clock,
  Trash2,
  Edit2,
} from 'lucide-react';
import type { CalendarCategory, CalendarEvent, CategoryItem } from '../types/calendar';
import { getCategoryTheme } from '../types/calendar';
import { formatTimeRange, isSameDay } from '../utils/dateUtils';

interface AgendaViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onRequestDelete: (event: CalendarEvent) => void;
  onCreateEvent: () => void;
  categories?: CategoryItem[];
}

export function AgendaView({
  events,
  onSelectEvent,
  onRequestDelete,
  onCreateEvent,
  categories,
}: AgendaViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (selectedCategory !== 'all' && ev.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = ev.title.toLowerCase().includes(q);
          const matchDesc = ev.description?.toLowerCase().includes(q);
          const matchLoc = ev.location?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events, searchQuery, selectedCategory]);

  // Group events by date label
  const groupedEvents = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const groups: { label: string; date: Date; items: CalendarEvent[] }[] = [];

    filteredEvents.forEach((event) => {
      const eventDate = new Date(event.start);
      let label: string;

      if (isSameDay(eventDate, today)) {
        label = `Today, ${eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
      } else if (isSameDay(eventDate, tomorrow)) {
        label = `Tomorrow, ${eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
      } else {
        label = eventDate.toLocaleDateString([], {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: eventDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
      }

      const existingGroup = groups.find((g) => g.label === label);
      if (existingGroup) {
        existingGroup.items.push(event);
      } else {
        groups.push({ label, date: eventDate, items: [event] });
      }
    });

    return groups;
  }, [filteredEvents]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 bg-slate-50/50 dark:bg-slate-900/80">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agenda..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            All ({events.length})
          </button>
          {(categories || []).map((cat) => {
            const theme = getCategoryTheme(cat.id, categories);
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: theme.dotColor }}
                />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Agenda Events List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
        {groupedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center text-slate-400">
            <CalendarIcon className="w-10 sm:w-12 h-10 sm:h-12 stroke-1 mb-2.5 text-slate-300 dark:text-slate-600" />
            <h4 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
              No matching events found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Try adjusting your search query or schedule a new event.
            </p>
            <button
              type="button"
              onClick={onCreateEvent}
              className="mt-3.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              + Create Event
            </button>
          </div>
        ) : (
          groupedEvents.map((group) => (
            <div key={group.label} className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {group.label}
                </span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
                {group.items.map((event) => {
                  const theme = getCategoryTheme(event.category, categories);
                  const timeStr = formatTimeRange(event.start, event.end, event.allDay);

                  return (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className={`group p-3 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs hover:shadow-md ${
                        theme.bgLight
                      } ${theme.bgDark} ${theme.borderLight} ${theme.borderDark}`}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                        <span
                          className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: theme.dotColor }}
                        />
                        <div className="min-w-0">
                          <h4
                            className={`text-xs sm:text-sm font-bold leading-tight truncate ${theme.textLight} ${theme.textDark}`}
                          >
                            {event.title}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5" /> {timeStr}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1 truncate max-w-[160px] sm:max-w-xs">
                                <MapPin className="w-3.5 h-3.5 shrink-0" /> {event.location}
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-xl">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 justify-end shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-current/10">
                        {event.reminders && event.reminders.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-white/60 dark:bg-black/30 px-2 py-0.5 sm:py-1 rounded-md">
                            <Bell className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            <span>{event.reminders[0].minutes}m</span>
                          </div>
                        )}

                        {event.googleId && (
                          <span
                            className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                            title="Synced with Google Calendar"
                          >
                            <CloudCheck className="w-4 h-4" />
                          </span>
                        )}

                        {/* Always visible on touch / mobile devices, hoverable on desktop */}
                        <div className="flex sm:opacity-0 sm:group-hover:opacity-100 items-center gap-1 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvent(event);
                            }}
                            className="p-1 sm:p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestDelete(event);
                            }}
                            className="p-1 sm:p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
