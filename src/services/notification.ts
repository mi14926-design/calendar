import type { CalendarEvent, EventReminder } from '../types/calendar';
import { soundService } from './sound';

export interface TriggeredReminder {
  eventId: string;
  eventTitle: string;
  eventStart: string;
  minutesBefore: number;
  location?: string;
  color?: string;
}

type ReminderCallback = (reminder: TriggeredReminder) => void;

class NotificationService {
  private listeners: Set<ReminderCallback> = new Set();
  private checkedReminderKeys: Set<string> = new Set();
  private intervalId: number | null = null;

  constructor() {
    this.startWatcher();
  }

  public subscribe(cb: ReminderCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public startWatcher(): void {
    if (this.intervalId !== null) return;
    // Check every 10 seconds for upcoming reminders
    this.intervalId = window.setInterval(() => {
      this.checkReminders();
    }, 10000);
  }

  public stopWatcher(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public checkEvents(events: CalendarEvent[]): void {
    const now = Date.now();

    for (const event of events) {
      const startTime = new Date(event.start).getTime();
      if (isNaN(startTime)) continue;

      const diffMs = startTime - now;
      const diffMinutes = Math.floor(diffMs / 60000);

      // Check each reminder on the event
      for (const reminder of event.reminders) {
        const reminderKey = `${event.id}_${reminder.minutes}_${startTime}`;

        // If reminder is due within this check window:
        // Due when current diffMinutes is <= reminder.minutes and diffMinutes >= -15 (not expired over 15 mins ago)
        if (
          diffMinutes <= reminder.minutes &&
          diffMinutes >= -10 &&
          !this.checkedReminderKeys.has(reminderKey)
        ) {
          this.checkedReminderKeys.add(reminderKey);
          this.triggerReminder(event, reminder);
        }
      }
    }
  }

  private triggerReminder(event: CalendarEvent, reminder: EventReminder): void {
    // 1. Play synthesized chime
    soundService.playReminderChime();

    // 2. Browser native notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const timeStr = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const minutesText =
          reminder.minutes === 0
            ? 'Starting now'
            : reminder.minutes >= 1440
            ? `Starting in ${Math.round(reminder.minutes / 1440)} day${Math.round(reminder.minutes / 1440) > 1 ? 's' : ''}`
            : reminder.minutes >= 60
            ? `Starting in ${Math.round(reminder.minutes / 60)} hour${Math.round(reminder.minutes / 60) > 1 ? 's' : ''}`
            : `Starting in ${reminder.minutes} minutes`;

        new Notification(event.title, {
          body: `${minutesText} (${timeStr})${event.location ? ` • ${event.location}` : ''}`,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }

    // 3. Dispatch to in-app toast / banner subscribers
    const reminderPayload: TriggeredReminder = {
      eventId: event.id,
      eventTitle: event.title,
      eventStart: event.start,
      minutesBefore: reminder.minutes,
      location: event.location,
      color: event.color,
    };

    this.listeners.forEach((cb) => cb(reminderPayload));
  }

  private checkReminders(): void {
    // Will be triggered by App with current events list
  }

  /**
   * Snooze a reminder for X minutes
   */
  public snoozeReminder(eventId: string, minutes: number, onSnooze: (eventId: string, snoozeMinutes: number) => void): void {
    onSnooze(eventId, minutes);
  }
}

export const notificationService = new NotificationService();
