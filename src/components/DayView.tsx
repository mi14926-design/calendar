import React, { useState } from 'react';
import { Bell, CloudCheck, MapPin, AlignLeft } from 'lucide-react';
import type { CalendarEvent, CategoryItem } from '../types/calendar';
import { getCategoryTheme } from '../types/calendar';
import { formatHourLabel, formatTimeRange, isSameDay } from '../utils/dateUtils';
import { soundService } from '../services/sound';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEventAtTime: (date: Date, hour: number) => void;
  onEventReschedule: (eventId: string, newStart: string, newEnd: string) => void;
  categories?: CategoryItem[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventAtTime,
  onEventReschedule,
  categories,
}: DayViewProps) {
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const dayEvents = events.filter((ev) => isSameDay(new Date(ev.start), currentDate));
  const allDayEvents = dayEvents.filter((ev) => ev.allDay);

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredHour !== hour) setHoveredHour(hour);
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    setHoveredHour(null);
    setDraggedEventId(null);

    if (!eventId) return;
    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;

    const originalStart = new Date(event.start).getTime();
    const originalEnd = new Date(event.end).getTime();
    const durationMs = Math.max(30 * 60 * 1000, originalEnd - originalStart);

    const newStart = new Date(currentDate);
    newStart.setHours(hour, new Date(event.start).getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    soundService.playDropSound();
    onEventReschedule(eventId, newStart.toISOString(), newEnd.toISOString());
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      {/* All Day Banner if any */}
      {allDayEvents.length > 0 && (
        <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 overflow-x-auto">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
            All Day
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {allDayEvents.map((event) => {
              const theme = getCategoryTheme(event.category, categories);
              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${theme.bgLight} ${theme.bgDark} ${theme.textLight} ${theme.textDark} ${theme.borderLight} ${theme.borderDark}`}
                >
                  {event.title}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly View */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {HOURS.map((hour) => {
          const slotEvents = dayEvents.filter((ev) => {
            if (ev.allDay) return false;
            const evStart = new Date(ev.start);
            return evStart.getHours() === hour;
          });

          const isHovered = hoveredHour === hour;

          return (
            <div
              key={hour}
              onDragOver={(e) => handleDragOver(e, hour)}
              onDrop={(e) => handleDrop(e, hour)}
              onClick={() => onCreateEventAtTime(currentDate, hour)}
              className={`flex min-h-[58px] sm:min-h-[68px] 2xl:min-h-[76px] relative group cursor-pointer transition-colors ${
                isHovered
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/50'
                  : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
              }`}
            >
              {/* Hour Label */}
              <div className="w-14 sm:w-20 shrink-0 text-right pr-2.5 sm:pr-4 py-2 sm:py-3 text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 select-none">
                {formatHourLabel(hour)}
              </div>

              {/* Slot Content */}
              <div className="flex-1 pl-2.5 sm:pl-4 pr-3 sm:pr-6 py-1.5 border-l border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 sm:gap-2">
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
                        setHoveredHour(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing shadow-xs ${
                        theme.bgLight
                      } ${theme.bgDark} ${theme.textLight} ${theme.textDark} ${theme.borderLight} ${
                        theme.borderDark
                      } ${
                        isDragged ? 'opacity-30 scale-98 border-dashed border-indigo-500' : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: theme.dotColor }}
                          />
                          <h4 className="text-xs sm:text-sm font-bold truncate">{event.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs opacity-80 shrink-0">
                          {event.reminders && event.reminders.length > 0 && (
                            <span className="flex items-center gap-1 font-medium bg-black/5 dark:bg-white/10 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs">
                              <Bell className="w-2.5 sm:w-3 h-2.5 sm:h-3" /> {event.reminders[0].minutes}m
                            </span>
                          )}
                          {event.googleId && <CloudCheck className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <div className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs opacity-85 font-medium">{timeStr}</div>

                      {(event.location || event.description) && (
                        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-current/15 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs opacity-75">
                          {event.location && (
                            <span className="flex items-center gap-1 truncate max-w-[180px] sm:max-w-xs">
                              <MapPin className="w-3 h-3 shrink-0" /> {event.location}
                            </span>
                          )}
                          {event.description && (
                            <span className="flex items-center gap-1 truncate max-w-sm hidden sm:inline-flex">
                              <AlignLeft className="w-3 h-3 shrink-0" /> {event.description}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
