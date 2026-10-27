/**
 * Clean Date and Time utilities for Calendar views
 */

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const FULL_DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns the start of the day (00:00:00.000) for a given date
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the end of the day (23:59:59.999) for a given date
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Returns true if both dates fall on the same calendar day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Returns whether a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get grid of 35-42 days for the Month view
 */
export function getMonthGrid(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayIndex = firstDayOfMonth.getDay(); // 0 for Sun, 1 for Mon...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startDayIndex - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDate - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill complete weeks (35 or 42 cells)
  const remainingCells = (7 - (days.length % 7)) % 7;
  const targetTotal = days.length + remainingCells < 35 ? 35 : days.length + remainingCells;
  let nextMonthDay = 1;
  while (days.length < targetTotal) {
    days.push({
      date: new Date(year, month + 1, nextMonthDay++),
      isCurrentMonth: false,
    });
  }

  return days;
}

/**
 * Get the 7 dates for the week containing `currentDate`
 */
export function getWeekDates(currentDate: Date, startOnMonday = false): Date[] {
  const d = new Date(currentDate);
  const day = d.getDay();
  // Adjust starting day
  const diff = d.getDate() - day + (startOnMonday ? (day === 0 ? -6 : 1) : 0);
  const startOfWeek = new Date(d.setDate(diff));

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(startOfWeek);
    nextDate.setDate(startOfWeek.getDate() + i);
    week.push(nextDate);
  }
  return week;
}

/**
 * Format time range e.g. "10:00 AM - 11:30 AM"
 */
export function formatTimeRange(startISO: string, endISO: string, allDay: boolean): string {
  if (allDay) return 'All Day';
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endStr = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startStr} – ${endStr}`;
}

/**
 * Format hour label e.g. "9 AM", "12 PM"
 */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/**
 * Format date for input datetime-local: "YYYY-MM-DDTHH:mm"
 */
export function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

/**
 * Format date for input date: "YYYY-MM-DD"
 */
export function toDateOnlyString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}
