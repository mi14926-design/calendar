import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '../types/calendar';
import { DAYS_OF_WEEK, MONTH_NAMES, getMonthGrid, isSameDay, isToday } from '../utils/dateUtils';

interface MiniCalendarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
}

export function MiniCalendar({ currentDate, onSelectDate, events }: MiniCalendarProps) {
  const [navDate, setNavDate] = React.useState(new Date(currentDate));

  const year = navDate.getFullYear();
  const month = navDate.getMonth();
  const days = getMonthGrid(year, month);

  const handlePrevMonth = () => {
    setNavDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs select-none">
      {/* Month & Nav Controls */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
          {MONTH_NAMES[month]} {year}
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <span key={d} className="text-[10px] font-semibold text-slate-400 uppercase">
            {d[0]}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map(({ date, isCurrentMonth }) => {
          const isSelected = isSameDay(date, currentDate);
          const isCurrentToday = isToday(date);
          const hasEvents = events.some((ev) => isSameDay(new Date(ev.start), date));

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`relative flex flex-col items-center justify-center h-7 w-7 mx-auto rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : isCurrentToday
                  ? 'border border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                  : isCurrentMonth
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-slate-300 dark:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{date.getDate()}</span>
              {hasEvents && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
