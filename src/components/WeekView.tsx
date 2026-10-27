import React, { useState } from 'react';
import { Bell, CloudCheck } from 'lucide-react';
import type { CalendarEvent, CategoryItem } from '../types/calendar';
import { getCategoryTheme } from '../types/calendar';
import {
  DAYS_OF_WEEK,
  formatHourLabel,
  formatTimeRange,
  getWeekDates,
  isSameDay,
  isToday,
} from '../utils/dateUtils';
import { soundService } from '../services/sound';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventAtTime: (date: Date, hour: number) => void;
  onEventReschedule: (eventId: string, newStart: string, newEnd: string) => void;
  categories?: CategoryItem[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventAtTime,
  onEventReschedule,
  categories,
}: WeekViewProps) {
  const weekDates = getWeekDates(currentDate, false);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<{ dayISO: string; hour: number } | null>(null);

  // Active day filter for mobile view (allows focusing on a specific day or all 7)
  const [mobileDayIdx, setMobileDayIdx] = useState<number>(() => {
    const today = new Date();
    const idx = weekDates.findIndex((d) => isSameDay(d, today));
    return idx >= 0 ? idx : 0;
  });

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e: React.DragEvent, dayISO: string, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragTarget || dragTarget.dayISO !== dayISO || dragTarget.hour !== hour) {
      setDragTarget({ dayISO, hour });
    }
  };

  const handleDrop = (e: React.DragEvent, dayDate: Date, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    setDragTarget(null);
    setDraggedEventId(null);

    if (!eventId) return;

    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;

    // Calculate duration in ms
    const originalStart = new Date(event.start).getTime();
    const originalEnd = new Date(event.end).getTime();
    const durationMs = Math.max(30 * 60 * 1000, originalEnd - originalStart);

    // New start time
    const newStart = new Date(dayDate);
    newStart.setHours(hour, new Date(event.start).getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    soundService.playDropSound();
    onEventReschedule(eventId, newStart.toISOString(), newEnd.toISOString());
  };

  // Quick resize handler
  const handleResizeDuration = (e: React.MouseEvent, event: CalendarEvent, deltaMinutes: number) => {
    e.stopPropagation();
    const start = new Date(event.start);
    const end = new Date(event.end);
    const newEnd = new Date(end.getTime() + deltaMinutes * 60 * 1000);
    if (newEnd.getTime() - start.getTime() >= 15 * 60 * 1000) {
      soundService.playDropSound();
      onEventReschedule(event.id, event.start, newEnd.toISOString());
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      {/* Mobile-Only Day Selector Bar (< sm) */}
      <div className="sm:hidden flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 overflow-x-auto">
        <span className="text-[10px] font-bold uppercase text-slate-400 mr-2 shrink-0">Day:</span>
        <div className="flex items-center gap-1">
          {weekDates.map((date, idx) => {
            const isSelected = mobileDayIdx === idx;
            const isCurrentToday = isToday(date);
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => setMobileDayIdx(idx)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex flex-col items-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isCurrentToday
                    ? 'border border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[9px] uppercase">{DAYS_OF_WEEK[date.getDay()][0]}</span>
                <span className="text-xs">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Horizontal Scroll Container for Week Matrix */}
      <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden">
        <div className="min-w-[620px] sm:min-w-full flex-1 flex flex-col">
          {/* Week Day Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 pl-14 sm:pl-16 sticky top-0 z-20">
            <div className="grid grid-cols-7 flex-1 divide-x divide-slate-100 dark:divide-slate-800">
              {weekDates.map((date, idx) => {
                const isCurrentToday = isToday(date);
                const dayName = DAYS_OF_WEEK[date.getDay()];
                const isFocused = mobileDayIdx === idx;
                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => setMobileDayIdx(idx)}
                    className={`py-2 sm:py-2.5 text-center px-1 cursor-pointer transition-colors ${
                      isFocused ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      {dayName}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center text-xs sm:text-sm font-bold rounded-full w-6 h-6 sm:w-7 sm:h-7 mt-0.5 ${
                        isCurrentToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable Hourly Matrix */}
          <div className="flex-1 overflow-y-auto relative divide-y divide-slate-100 dark:divide-slate-800">
            {HOURS.map((hour) => (
              <div key={hour} className="flex min-h-[50px] sm:min-h-[56px] 2xl:min-h-[64px] relative group">
                {/* Time label */}
                <div className="w-14 sm:w-16 shrink-0 text-right pr-2 sm:pr-3 -mt-2.5 text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 select-none sticky left-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs">
                  {formatHourLabel(hour)}
                </div>

                {/* 7 Columns for the hour */}
                <div className="grid grid-cols-7 flex-1 divide-x divide-slate-100 dark:divide-slate-800 border-l border-slate-100 dark:border-slate-800">
                  {weekDates.map((dayDate) => {
                    const dayISO = dayDate.toISOString().slice(0, 10);
                    const isHovered =
                      dragTarget?.dayISO === dayISO && dragTarget?.hour === hour;

                    // Find events starting in this specific hour on this day
                    const slotEvents = events.filter((ev) => {
                      if (ev.allDay) return false;
                      const evStart = new Date(ev.start);
                      return isSameDay(evStart, dayDate) && evStart.getHours() === hour;
                    });

                    return (
                      <div
                        key={`${dayISO}_${hour}`}
                        onDragOver={(e) => handleDragOver(e, dayISO, hour)}
                        onDrop={(e) => handleDrop(e, dayDate, hour)}
                        onClick={() => onCreateEventAtTime(dayDate, hour)}
                        className={`relative p-1 transition-colors cursor-pointer min-h-[50px] sm:min-h-[56px] ${
                          isHovered
                            ? 'bg-indigo-100/70 dark:bg-indigo-950/70 ring-2 ring-indigo-500 z-10'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {slotEvents.map((event) => {
                          const theme = getCategoryTheme(event.category, categories);
                          const isDragged = draggedEventId === event.id;
                          const timeStr = formatTimeRange(event.start, event.end, event.allDay);

                          return (
                            <div
                              key={event.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, event.id)}
                              onDragEnd={() => {
                                setDraggedEventId(null);
                                setDragTarget(null);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectEvent(event);
                              }}
                              className={`relative group/event flex flex-col justify-between p-1 sm:p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-grab active:cursor-grabbing shadow-xs ${
                                theme.bgLight
                              } ${theme.bgDark} ${theme.textLight} ${theme.textDark} ${theme.borderLight} ${
                                theme.borderDark
                              } ${
                                isDragged ? 'opacity-30 scale-95 border-dashed border-indigo-400' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-bold truncate leading-tight text-[11px] sm:text-xs">
                                  {event.title}
                                </span>
                                <div className="flex items-center gap-1 shrink-0 text-[9px] sm:text-[10px] opacity-80">
                                  {event.reminders && event.reminders.length > 0 && (
                                    <Bell className="w-2.5 h-2.5" />
                                  )}
                                  {event.googleId && <CloudCheck className="w-2.5 h-2.5" />}
                                </div>
                              </div>

                              <div className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] opacity-85 truncate font-normal">
                                {timeStr}
                              </div>

                              {/* Quick duration resize handle at bottom (visible on hover) */}
                              <div className="hidden group-hover/event:flex items-center justify-end gap-1 mt-1 pt-1 border-t border-current/20">
                                <button
                                  type="button"
                                  onClick={(e) => handleResizeDuration(e, event, -15)}
                                  className="px-1 py-0.2 text-[8px] sm:text-[9px] rounded bg-black/10 dark:bg-white/10 hover:bg-black/20"
                                  title="Shorten by 15 mins"
                                >
                                  -15m
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleResizeDuration(e, event, 30)}
                                  className="px-1 py-0.2 text-[8px] sm:text-[9px] rounded bg-black/10 dark:bg-white/10 hover:bg-black/20"
                                  title="Extend by 30 mins"
                                >
                                  +30m
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
