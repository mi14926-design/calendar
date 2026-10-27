import type { CalendarEvent, CategoryItem, OfflineQueueItem } from '../types/calendar';
import { DEFAULT_CATEGORIES } from '../types/calendar';

const STORAGE_KEY_EVENTS = 'chronosync_events_v1';
const STORAGE_KEY_QUEUE = 'chronosync_offline_queue_v1';
const STORAGE_KEY_CATEGORIES = 'chronosync_custom_categories_v1';

/**
 * Generate initial sample events for new users or offline exploratory use
 */
function generateSampleEvents(): CalendarEvent[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  return [
    {
      id: 'sample-1',
      title: 'Sprint Planning & Roadmap',
      description: 'Review quarterly goals, user feedback, and upcoming deliverables.',
      location: 'Conference Room Alpha / Google Meet',
      start: new Date(y, m, d, 10, 0).toISOString(),
      end: new Date(y, m, d, 11, 30).toISOString(),
      allDay: false,
      color: '#3b82f6',
      category: 'work',
      reminders: [{ minutes: 15, method: 'popup' }],
      synced: false,
      lastModified: Date.now(),
    },
    {
      id: 'sample-2',
      title: 'Design Critique: Calendar UX',
      description: 'Walkthrough drag-and-drop interactions, dark mode tokens, and reminder badges.',
      location: 'Virtual Huddle',
      start: new Date(y, m, d, 14, 0).toISOString(),
      end: new Date(y, m, d, 15, 0).toISOString(),
      allDay: false,
      color: '#a855f7',
      category: 'meeting',
      reminders: [{ minutes: 10, method: 'popup' }, { minutes: 5, method: 'audio' }],
      synced: false,
      lastModified: Date.now(),
    },
    {
      id: 'sample-3',
      title: 'Deep Focus: Flow State Coding',
      description: 'Zero distractions. Offline sync engine and drag event handlers.',
      location: 'Home Studio',
      start: new Date(y, m, d + 1, 9, 0).toISOString(),
      end: new Date(y, m, d + 1, 12, 0).toISOString(),
      allDay: false,
      color: '#6366f1',
      category: 'focus',
      reminders: [{ minutes: 5, method: 'popup' }],
      synced: false,
      lastModified: Date.now(),
    },
    {
      id: 'sample-4',
      title: 'Team Coffee & Quick Catch-up',
      description: 'Catch up on weekend plans and casual banter.',
      location: 'Blue Bottle Cafe',
      start: new Date(y, m, d + 1, 15, 30).toISOString(),
      end: new Date(y, m, d + 1, 16, 15).toISOString(),
      allDay: false,
      color: '#10b981',
      category: 'personal',
      reminders: [{ minutes: 30, method: 'popup' }],
      synced: false,
      lastModified: Date.now(),
    },
    {
      id: 'sample-5',
      title: 'Security & Deployment Audit',
      description: 'Verify OAuth scopes, tokens, and offline encryption readiness.',
      location: 'Ops Terminal',
      start: new Date(y, m, d + 2, 11, 0).toISOString(),
      end: new Date(y, m, d + 2, 12, 0).toISOString(),
      allDay: false,
      color: '#f43f5e',
      category: 'urgent',
      reminders: [{ minutes: 60, method: 'popup' }, { minutes: 10, method: 'popup' }],
      synced: false,
      lastModified: Date.now(),
    },
    {
      id: 'sample-6',
      title: 'Product Launch Day',
      description: 'Major release celebration and monitoring across all channels.',
      location: 'Worldwide',
      start: new Date(y, m, d + 3, 0, 0).toISOString(),
      end: new Date(y, m, d + 3, 23, 59, 59).toISOString(),
      allDay: true,
      color: '#f59e0b',
      category: 'reminder',
      reminders: [{ minutes: 1440, method: 'popup' }], // 1 day before
      synced: false,
      lastModified: Date.now(),
    },
  ];
}

/**
 * Load cached events from local storage
 */
export function loadCachedEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (!raw) {
      const samples = generateSampleEvents();
      saveCachedEvents(samples);
      return samples;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading cached events:', err);
    return generateSampleEvents();
  }
}

/**
 * Save events list to local storage
 */
export function saveCachedEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Error saving cached events:', err);
  }
}

/**
 * Get offline mutation queue
 */
export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error loading offline queue:', err);
    return [];
  }
}

/**
 * Save offline mutation queue
 */
export function saveOfflineQueue(queue: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error('Error saving offline queue:', err);
  }
}

/**
 * Enqueue an offline action (create / update / delete)
 */
export function enqueueOfflineAction(action: 'create' | 'update' | 'delete', event: CalendarEvent): void {
  const queue = getOfflineQueue();
  // If there's an existing action for this event, merge or replace
  const existingIdx = queue.findIndex((item) => item.event.id === event.id);

  const newItem: OfflineQueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action,
    event,
    timestamp: Date.now(),
  };

  if (existingIdx >= 0) {
    const prev = queue[existingIdx];
    if (prev.action === 'create' && action === 'delete') {
      // Created offline then deleted offline: remove altogether
      queue.splice(existingIdx, 1);
      saveOfflineQueue(queue);
      return;
    } else if (prev.action === 'create' && action === 'update') {
      // Created offline then updated offline: remain create with updated event
      queue[existingIdx] = { ...prev, event, timestamp: Date.now() };
      saveOfflineQueue(queue);
      return;
    } else {
      queue[existingIdx] = newItem;
    }
  } else {
    queue.push(newItem);
  }

  saveOfflineQueue(queue);
}

/**
 * Clear the offline queue
 */
export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_QUEUE);
  } catch (e) {
    // Ignore
  }
}

/**
 * Load categories list (defaults + custom categories)
 */
export function loadCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed: CategoryItem[] = JSON.parse(raw);
    return parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch (e) {
    console.error('Error loading categories:', e);
    return DEFAULT_CATEGORIES;
  }
}

/**
 * Save categories list to localStorage
 */
export function saveCategories(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

