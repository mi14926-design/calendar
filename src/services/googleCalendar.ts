import type { CalendarCategory, CalendarEvent, EventReminder } from '../types/calendar';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary';

interface GoogleDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

interface GoogleCalendarEventResource {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: GoogleDateTime;
  end?: GoogleDateTime;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  colorId?: string;
  status?: string;
  updated?: string;
}

/**
 * Determine best category based on summary/description or color
 */
function inferCategory(summary?: string, description?: string): CalendarCategory {
  const text = `${summary || ''} ${description || ''}`.toLowerCase();
  if (text.includes('urgent') || text.includes('asap') || text.includes('deadline')) return 'urgent';
  if (text.includes('meet') || text.includes('call') || text.includes('sync') || text.includes('zoom') || text.includes('interview')) return 'meeting';
  if (text.includes('work') || text.includes('project') || text.includes('task') || text.includes('review') || text.includes('client')) return 'work';
  if (text.includes('focus') || text.includes('deep work') || text.includes('study') || text.includes('code')) return 'focus';
  if (text.includes('remind') || text.includes('birthday') || text.includes('doctor') || text.includes('gym')) return 'reminder';
  return 'personal';
}

/**
 * Converts a Google API Event into a clean app CalendarEvent
 */
export function mapGoogleToLocalEvent(gEvent: GoogleCalendarEventResource): CalendarEvent {
  const isAllDay = !gEvent.start?.dateTime && !!gEvent.start?.date;
  const startISO = gEvent.start?.dateTime || (gEvent.start?.date ? `${gEvent.start.date}T00:00:00.000Z` : new Date().toISOString());
  const endISO = gEvent.end?.dateTime || (gEvent.end?.date ? `${gEvent.end.date}T23:59:59.000Z` : new Date(Date.now() + 3600000).toISOString());

  const reminders: EventReminder[] = [];
  if (gEvent.reminders?.overrides && gEvent.reminders.overrides.length > 0) {
    for (const r of gEvent.reminders.overrides) {
      reminders.push({
        minutes: r.minutes,
        method: r.method === 'email' ? 'email' : 'popup',
      });
    }
  } else if (gEvent.reminders?.useDefault !== false) {
    // Default 10 min reminder
    reminders.push({ minutes: 10, method: 'popup' });
  }

  const category = inferCategory(gEvent.summary, gEvent.description);

  return {
    id: gEvent.id || `g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    googleId: gEvent.id,
    title: gEvent.summary || '(No title)',
    description: gEvent.description || '',
    location: gEvent.location || '',
    start: startISO,
    end: endISO,
    allDay: isAllDay,
    color: '#3b82f6',
    category,
    reminders,
    synced: true,
    lastModified: gEvent.updated ? new Date(gEvent.updated).getTime() : Date.now(),
  };
}

/**
 * Converts app CalendarEvent into Google API payload
 */
export function mapLocalToGooglePayload(event: CalendarEvent): GoogleCalendarEventResource {
  const payload: GoogleCalendarEventResource = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
  };

  if (event.allDay) {
    const startDate = event.start.slice(0, 10);
    const endDate = event.end.slice(0, 10);
    payload.start = { date: startDate };
    payload.end = { date: endDate };
  } else {
    payload.start = { dateTime: new Date(event.start).toISOString() };
    payload.end = { dateTime: new Date(event.end).toISOString() };
  }

  if (event.reminders && event.reminders.length > 0) {
    payload.reminders = {
      useDefault: false,
      overrides: event.reminders.map((r) => ({
        method: r.method === 'email' ? 'email' : 'popup',
        minutes: r.minutes,
      })),
    };
  } else {
    payload.reminders = {
      useDefault: false,
      overrides: [],
    };
  }

  return payload;
}

/**
 * Fetch events from Google Calendar
 */
export async function fetchGoogleEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  if (timeMin) params.set('timeMin', timeMin);
  if (timeMax) params.set('timeMax', timeMax);

  const url = `${CALENDAR_API_BASE}/events?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    const errBody = await response.text();
    throw new Error(`Google Calendar API Error: ${response.status} - ${errBody}`);
  }

  const data = await response.json();
  const items: GoogleCalendarEventResource[] = data.items || [];
  return items.filter((item) => item.status !== 'cancelled').map(mapGoogleToLocalEvent);
}

/**
 * Create event in Google Calendar
 */
export async function createGoogleEvent(
  accessToken: string,
  event: CalendarEvent
): Promise<CalendarEvent> {
  const payload = mapLocalToGooglePayload(event);
  const response = await fetch(`${CALENDAR_API_BASE}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('TOKEN_EXPIRED');
    const err = await response.text();
    throw new Error(`Failed to create event: ${response.status} - ${err}`);
  }

  const created: GoogleCalendarEventResource = await response.json();
  const mapped = mapGoogleToLocalEvent(created);
  return {
    ...mapped,
    category: event.category,
    color: event.color,
  };
}

/**
 * Update event in Google Calendar
 */
export async function updateGoogleEvent(
  accessToken: string,
  event: CalendarEvent
): Promise<CalendarEvent> {
  if (!event.googleId) {
    return createGoogleEvent(accessToken, event);
  }

  const payload = mapLocalToGooglePayload(event);
  const response = await fetch(`${CALENDAR_API_BASE}/events/${event.googleId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('TOKEN_EXPIRED');
    const err = await response.text();
    throw new Error(`Failed to update event: ${response.status} - ${err}`);
  }

  const updated: GoogleCalendarEventResource = await response.json();
  const mapped = mapGoogleToLocalEvent(updated);
  return {
    ...mapped,
    category: event.category,
    color: event.color,
  };
}

/**
 * Delete event in Google Calendar
 */
export async function deleteGoogleEvent(accessToken: string, googleId: string): Promise<boolean> {
  const response = await fetch(`${CALENDAR_API_BASE}/events/${googleId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    if (response.status === 401) throw new Error('TOKEN_EXPIRED');
    const err = await response.text();
    throw new Error(`Failed to delete event: ${response.status} - ${err}`);
  }

  return true;
}
