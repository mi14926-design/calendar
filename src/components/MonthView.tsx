import React, { useState } from 'react';
import { Bell, CloudCheck, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import type { CalendarEvent, CategoryItem } from '../types/calendar';
import { getCategoryTheme } from '../types/calendar';
import { DAYS_OF_WEEK, formatTimeRange, getMonthGrid, isSameDay, isToday } from '../utils/dateUtils';
import { soundService } from '../services/sound';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
  onEventDropDate: (eventId: string, newDate: Date) => void;
  categories?: CategoryItem[];
}

export function MonthView({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventOnDate,
  onEventDropDate,
  categories,
}: MonthViewProps) {
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [hoveredDropDate, setHoveredDropDate] = useState<string | null>(null);
  // Selected day for mobile preview drawer/panel
  const [mobileSelectedDate, setMobileSelectedDate] = useState<Date>(new Date(currentDate));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthGrid(year, month);

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEventId(eventId);
  };

  const handleDragEnd = () => {
    setDraggedEventId(null);
    setHoveredDropDate(null);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredDropDate !== dateStr) {
      setHoveredDropDate(dateStr);
    }
  };

  const handleDragLeave = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (hoveredDropDate === dateStr) {
      setHoveredDropDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    setHoveredDropDate(null);
    setDraggedEventId(null);

    if (eventId) {
      soundService.playDropSound();
      onEventDropDate(eventId, targetDate);
    }
  };

  // Events for the mobile selected day
  const mobileSelectedEvents = events.filter((ev) => isSameDay(new Date(ev.start), mobileSelectedDate));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 text-center py-2 sm:py-2.5">
        {DAYS_OF_WEEK.map((dayName, idx) => (
          <div
            key={dayName}
            className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
              idx === 0 || idx === 6
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {/* Show 1 letter on mobile, 3 letters on sm+ */}
            <span className="sm:hidden">{dayName[0]}</span>
            <span className="hidden sm:inline">{dayName}</span>
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 grid-rows-5 flex-1 divide-x divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-100 dark:bg-slate-900/50 min-h-[300px]">
        {days.map(({ date, isCurrentMonth }) => {
          const dateISO = date.toISOString().slice(0, 10);
          const isCurrentToday = isToday(date);
          const isDropHovered = hoveredDropDate === dateISO;
          const isMobileSelected = isSameDay(date, mobileSelectedDate);

          // Events that fall on this day
          const dayEvents = events.filter((ev) => {
            const evStart = new Date(ev.start);
            return isSameDay(evStart, date);
          });

          return (
            <div
              key={dateISO}
              onDragOver={(e) => handleDragOver(e, dateISO)}
              onDragLeave={(e) => handleDragLeave(e, dateISO)}
              onDrop={(e) => handleDrop(e, date)}
              onClick={() => {
                setMobileSelectedDate(date);
                if (window.innerWidth >= 640) {
                  onCreateEventOnDate(date);
                }
              }}
              className={`group relative flex flex-col p-1 sm:p-1.5 transition-all duration-150 cursor-pointer min-h-[50px] sm:min-h-[80px] lg:min-h-[95px] 2xl:min-h-[120px] ${
                isCurrentMonth
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                  : 'bg-slate-50/60 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
              } ${
                isDropHovered
                  ? 'ring-2 ring-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 z-10'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              } ${isMobileSelected ? 'sm:ring-0 bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-0.5 sm:mb-1 px-0.5 sm:px-1">
                <span
                  className={`inline-flex items-center justify-center text-[11px] sm:text-xs font-semibold rounded-full w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                    isCurrentToday
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : isMobileSelected
                      ? 'border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {date.getDate()}
                </span>

                {/* Quick Add icon (visible on hover on desktop) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEventOnDate(date);
                  }}
                  className="hidden sm:block opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-opacity"
                  title="Add event on this day"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mobile (< 640px): Color Dots indicator */}
              <div className="sm:hidden flex items-center justify-center gap-1 flex-wrap px-0.5 mt-auto pb-0.5 min-h-[10px]">
                {dayEvents.slice(0, 3).map((ev) => {
                  const theme = getCategoryTheme(ev.category, categories);
                  return (
                    <span
                      key={ev.id}
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: theme.dotColor }}
                    />
                  );
                })}
                {dayEvents.length > 3 && (
                  <span className="text-[8px] font-bold text-slate-500 leading-none">+</span>
                )}
              </div>

              {/* Desktop / Tablet (>= 640px): Event chips */}
              <div className="hidden sm:flex flex-1 flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => {
                  const theme = getCategoryTheme(event.category, categories);
                  const isBeingDragged = draggedEventId === event.id;
                  const timeFormatted = event.allDay
                    ? 'All day'
                    : new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                  return (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, event.id)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className={`flex items-center justify-between gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] lg:text-[11px] font-medium border transition-all cursor-grab active:cursor-grabbing truncate ${
                        theme.bgLight
                      } ${theme.bgDark} ${theme.textLight} ${theme.textDark} ${theme.borderLight} ${
                        theme.borderDark
                      } ${
                        isBeingDragged ? 'opacity-30 scale-95 border-dashed border-indigo-400' : 'hover:shadow-xs'
                      }`}
                      title={`${event.title} (${timeFormatted})\nDrag to another day to reschedule`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: theme.dotColor }}
                        />
                        <span className="truncate">{event.title}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-[9px] lg:text-[10px] opacity-80">
                        {event.reminders && event.reminders.length > 0 && (
                          <Bell className="w-2.5 h-2.5" />
                        )}
                        {event.googleId && <CloudCheck className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                  );
                })}

                {dayEvents.length > 3 && (
                  <div className="text-[9px] lg:text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1 pt-0.5">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile-Only (< 640px) Selected Day Drawer / Details Panel */}
      <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/90 max-h-[180px] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            {mobileSelectedDate.toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <button
            type="button"
            onClick={() => onCreateEventOnDate(mobileSelectedDate)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Event
          </button>
        </div>

        {mobileSelectedEvents.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No events scheduled on this date.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {mobileSelectedEvents.map((ev) => {
              const theme = getCategoryTheme(ev.category, categories);
              const timeStr = formatTimeRange(ev.start, ev.end, ev.allDay);
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${theme.bgLight} ${theme.bgDark} ${theme.textLight} ${theme.textDark} ${theme.borderLight} ${theme.borderDark}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: theme.dotColor }}
                    />
                    <span className="font-semibold truncate">{ev.title}</span>
                  </div>
                  <span className="text-[10px] opacity-80 shrink-0 font-medium ml-2">{timeStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
