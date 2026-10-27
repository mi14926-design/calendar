import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { Plus } from 'lucide-react';
import type { CalendarCategory, CalendarEvent, CalendarView, CategoryItem, SyncStatus } from './types/calendar';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  logout,
} from './services/firebaseAuth';
import {
  fetchGoogleEvents,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
} from './services/googleCalendar';
import {
  loadCachedEvents,
  saveCachedEvents,
  getOfflineQueue,
  enqueueOfflineAction,
  clearOfflineQueue,
  loadCategories,
  saveCategories,
} from './services/storage';
import { notificationService, type TriggeredReminder } from './services/notification';
import { soundService } from './services/sound';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { AgendaView } from './components/AgendaView';
import { EventModal } from './components/EventModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ReminderToast } from './components/ReminderToast';
import { OfflineBanner } from './components/OfflineBanner';
import { CategoryManagerModal } from './components/CategoryManagerModal';

export default function App() {
  // Navigation & View State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');

  // Mobile / Tablet Drawer State
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Categories State (defaults + custom user categories)
  const [categories, setCategories] = useState<CategoryItem[]>(() => loadCategories());
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Events & Filter State
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadCachedEvents());
  const [selectedCategories, setSelectedCategories] = useState<Set<CalendarCategory>>(
    () => new Set(loadCategories().map((c) => c.id))
  );

  // Persist categories when updated
  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Connectivity & Offline Queue State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getOfflineQueue().length);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chronosync_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sound State
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => soundService.isEnabled());

  // Modals & Dialogs State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);

  // Destructive Action Confirmation Modal
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<CalendarEvent | null>(null);

  // Active Reminder Toasts
  const [activeReminders, setActiveReminders] = useState<TriggeredReminder[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    () => notificationService.getPermissionStatus()
  );

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chronosync_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('chronosync_theme', 'light');
    }
  }, [isDarkMode]);

  // Online / Offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, token) => {
        setUser(authenticatedUser);
        syncGoogleCalendar(token);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync events with localStorage whenever events change
  useEffect(() => {
    saveCachedEvents(events);
    notificationService.checkEvents(events);
  }, [events]);

  // Periodic reminder checking
  useEffect(() => {
    const interval = setInterval(() => {
      notificationService.checkEvents(events);
    }, 15000);
    return () => clearInterval(interval);
  }, [events]);

  // Subscribe to triggered reminder alerts
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((reminder) => {
      setActiveReminders((prev) => {
        if (prev.some((r) => r.eventId === reminder.eventId && r.minutesBefore === reminder.minutesBefore)) {
          return prev;
        }
        return [...prev, reminder];
      });
    });
    return () => unsubscribe();
  }, []);

  // Keep pending sync count up-to-date
  const updateQueueCount = useCallback(() => {
    setPendingSyncCount(getOfflineQueue().length);
  }, []);

  // ===================== Google Calendar Sync =====================

  const syncGoogleCalendar = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride || (await getAccessToken());
    if (!token) return;

    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    try {
      setSyncStatus('syncing');

      const startWindow = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
      const endWindow = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();

      const remoteEvents = await fetchGoogleEvents(token, startWindow, endWindow);

      setEvents((prev) => {
        const localOnly = prev.filter((ev) => !ev.googleId);
        const merged = [...remoteEvents, ...localOnly];
        saveCachedEvents(merged);
        return merged;
      });

      setLastSyncedAt(new Date());
      setSyncStatus('synced');
    } catch (err: unknown) {
      console.error('Google Calendar sync failed:', err);
      setSyncStatus('error');
    }
  }, [currentDate]);

  // Process offline mutation queue
  const syncOfflineQueue = useCallback(async () => {
    const token = await getAccessToken();
    if (!token || !navigator.onLine) return;

    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setSyncStatus('syncing');

    try {
      for (const item of queue) {
        if (item.action === 'create') {
          const created = await createGoogleEvent(token, item.event);
          setEvents((prev) =>
            prev.map((ev) => (ev.id === item.event.id ? created : ev))
          );
        } else if (item.action === 'update') {
          if (item.event.googleId) {
            const updated = await updateGoogleEvent(token, item.event);
            setEvents((prev) =>
              prev.map((ev) => (ev.id === item.event.id ? updated : ev))
            );
          }
        } else if (item.action === 'delete') {
          if (item.event.googleId) {
            await deleteGoogleEvent(token, item.event.googleId);
          }
        }
      }

      clearOfflineQueue();
      updateQueueCount();
      await syncGoogleCalendar();
    } catch (err) {
      console.error('Error synchronizing offline queue:', err);
      setSyncStatus('error');
    }
  }, [syncGoogleCalendar, updateQueueCount]);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        await syncGoogleCalendar(res.accessToken);
      }
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign out Handler
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setSyncStatus('idle');
  };

  // Request browser notification permission
  const handleRequestNotificationPermission = async () => {
    const status = await notificationService.requestPermission();
    setNotificationPermission(status);
  };

  // ===================== Event CRUD & Drag/Drop Handlers =====================

  const handleSaveEvent = async (event: CalendarEvent) => {
    const isNew = !events.some((ev) => ev.id === event.id);

    if (isNew) {
      setEvents((prev) => [...prev, event]);
    } else {
      setEvents((prev) => prev.map((ev) => (ev.id === event.id ? event : ev)));
    }

    const token = await getAccessToken();

    if (token && isOnline) {
      try {
        setSyncStatus('syncing');
        if (isNew) {
          const created = await createGoogleEvent(token, event);
          setEvents((prev) =>
            prev.map((ev) => (ev.id === event.id ? created : ev))
          );
        } else {
          const updated = await updateGoogleEvent(token, event);
          setEvents((prev) =>
            prev.map((ev) => (ev.id === event.id ? updated : ev))
          );
        }
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      } catch (err) {
        console.error('Failed to sync event with Google:', err);
        enqueueOfflineAction(isNew ? 'create' : 'update', event);
        updateQueueCount();
        setSyncStatus('offline');
      }
    } else if (user) {
      enqueueOfflineAction(isNew ? 'create' : 'update', event);
      updateQueueCount();
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteEvent) return;
    const target = pendingDeleteEvent;
    setPendingDeleteEvent(null);

    setEvents((prev) => prev.filter((ev) => ev.id !== target.id));

    const token = await getAccessToken();

    if (token && isOnline && target.googleId) {
      try {
        setSyncStatus('syncing');
        await deleteGoogleEvent(token, target.googleId);
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      } catch (err) {
        console.error('Failed to delete event from Google Calendar:', err);
        enqueueOfflineAction('delete', target);
        updateQueueCount();
        setSyncStatus('offline');
      }
    } else if (user && target.googleId) {
      enqueueOfflineAction('delete', target);
      updateQueueCount();
    }
  };

  // Drag and drop to a new date (Month view)
  const handleEventDropDate = (eventId: string, newDate: Date) => {
    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;

    const originalStart = new Date(event.start);
    const originalEnd = new Date(event.end);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    const newStart = new Date(newDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    const updatedEvent: CalendarEvent = {
      ...event,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
      lastModified: Date.now(),
    };

    handleSaveEvent(updatedEvent);
  };

  // Drag and drop reschedule with new start and end ISO (Week / Day views)
  const handleEventReschedule = (eventId: string, newStart: string, newEnd: string) => {
    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;

    const updatedEvent: CalendarEvent = {
      ...event,
      start: newStart,
      end: newEnd,
      lastModified: Date.now(),
    };

    handleSaveEvent(updatedEvent);
  };

  // Quick event creation on date / time
  const handleCreateEventOnDate = (date: Date) => {
    const start = new Date(date);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setEditingEvent({
      title: '',
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      category: 'work',
      reminders: [{ minutes: 10, method: 'popup' }],
    });
    setIsEventModalOpen(true);
  };

  const handleCreateEventAtTime = (date: Date, hour: number) => {
    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    setEditingEvent({
      title: '',
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      category: 'work',
      reminders: [{ minutes: 10, method: 'popup' }],
    });
    setIsEventModalOpen(true);
  };

  // Date Navigation
  const handleNavigatePrev = () => {
    const next = new Date(currentDate);
    if (currentView === 'month') next.setMonth(next.getMonth() - 1);
    else if (currentView === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNavigateNext = () => {
    const next = new Date(currentDate);
    if (currentView === 'month') next.setMonth(next.getMonth() + 1);
    else if (currentView === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleNavigateToday = () => {
    setCurrentDate(new Date());
  };

  // Category Filter Toggle
  const handleToggleCategory = (category: CalendarCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        if (next.size > 1) next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Save (create or edit) Category
  const handleSaveCategory = (categoryToSave: CategoryItem) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === categoryToSave.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = categoryToSave;
        return next;
      }
      return [...prev, categoryToSave];
    });

    // Update color on existing events if color changed
    setEvents((prev) =>
      prev.map((ev) =>
        ev.category === categoryToSave.id ? { ...ev, color: categoryToSave.color } : ev
      )
    );

    // Make sure new category is active in filters
    setSelectedCategories((prev) => new Set([...prev, categoryToSave.id]));
  };

  // Delete Category
  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });

    // Reassign events using this deleted category to fallback 'work'
    setEvents((prev) =>
      prev.map((ev) => (ev.category === categoryId ? { ...ev, category: 'work' } : ev))
    );
  };

  // Filtered events based on selected categories
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => selectedCategories.has(ev.category));
  }, [events, selectedCategories]);

  // Reminder Snooze / Dismiss
  const handleDismissReminder = (eventId: string) => {
    setActiveReminders((prev) => prev.filter((r) => r.eventId !== eventId));
  };

  const handleSnoozeReminder = (eventId: string, minutes: number) => {
    setActiveReminders((prev) => prev.filter((r) => r.eventId !== eventId));
    setTimeout(() => {
      const ev = events.find((e) => e.id === eventId);
      if (ev) {
        soundService.playReminderChime();
        setActiveReminders((prev) => [
          ...prev,
          {
            eventId: ev.id,
            eventTitle: `[Snoozed] ${ev.title}`,
            eventStart: ev.start,
            minutesBefore: 0,
            location: ev.location,
            color: ev.color,
          },
        ]);
      }
    }, minutes * 60 * 1000);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        currentDate={currentDate}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        onNavigateToday={handleNavigateToday}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenCreateModal={() => {
          setEditingEvent(null);
          setIsEventModalOpen(true);
        }}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        isLoggingIn={isLoggingIn}
        syncStatus={syncStatus}
        onManualSync={() => syncGoogleCalendar()}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => {
          const next = !isSoundEnabled;
          setIsSoundEnabled(next);
          soundService.setEnabled(next);
        }}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onToggleSidebar={() => setIsSidebarOpenMobile(true)}
      />

      {/* Offline Alert Strip */}
      <OfflineBanner
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onSyncNow={syncOfflineQueue}
        isSyncing={syncStatus === 'syncing'}
      />

      {/* Main Calendar Workspace (Responsive: Mobile / Tablet / Desktop Small / Medium / Large) */}
      <main className="flex-1 min-h-0 p-2 sm:p-3 md:p-4 lg:p-5 flex flex-col lg:flex-row gap-2.5 sm:gap-4 lg:gap-5 max-w-[1920px] w-full mx-auto overflow-hidden">
        {/* Responsive Sidebar (Fixed on Desktop lg+, Off-canvas Drawer on Mobile/Tablet) */}
        <Sidebar
          currentDate={currentDate}
          onSelectDate={(date) => {
            setCurrentDate(date);
          }}
          events={events}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          user={user}
          isOnline={isOnline}
          notificationPermission={notificationPermission}
          onRequestNotificationPermission={handleRequestNotificationPermission}
          lastSyncedAt={lastSyncedAt}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          categories={categories}
          onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        />

        {/* Calendar View Area */}
        <section className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
          {currentView === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={(event) => {
                setEditingEvent(event);
                setIsEventModalOpen(true);
              }}
              onCreateEventOnDate={handleCreateEventOnDate}
              onEventDropDate={handleEventDropDate}
              categories={categories}
            />
          )}

          {currentView === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={(event) => {
                setEditingEvent(event);
                setIsEventModalOpen(true);
              }}
              onCreateEventAtTime={handleCreateEventAtTime}
              onEventReschedule={handleEventReschedule}
              categories={categories}
            />
          )}

          {currentView === 'day' && (
            <DayView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={(event) => {
                setEditingEvent(event);
                setIsEventModalOpen(true);
              }}
              onCreateEventAtTime={handleCreateEventAtTime}
              onEventReschedule={handleEventReschedule}
              categories={categories}
            />
          )}

          {currentView === 'agenda' && (
            <AgendaView
              events={filteredEvents}
              onSelectEvent={(event) => {
                setEditingEvent(event);
                setIsEventModalOpen(true);
              }}
              onRequestDelete={(event) => setPendingDeleteEvent(event)}
              onCreateEvent={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              categories={categories}
            />
          )}
        </section>
      </main>

      {/* Floating Action Button for Mobile (< md) to quickly add events with one thumb */}
      <button
        type="button"
        onClick={() => {
          setEditingEvent(null);
          setIsEventModalOpen(true);
        }}
        className="md:hidden fixed bottom-5 right-5 z-40 w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
        aria-label="Create new event"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Event Add/Edit Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        event={editingEvent}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        onRequestDelete={(event) => setPendingDeleteEvent(event)}
        isOnline={isOnline}
        isGoogleConnected={!!user}
        categories={categories}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
      />

      {/* Category & Color Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* User Confirmation Dialog for Destructive Operations */}
      <ConfirmationModal
        isOpen={!!pendingDeleteEvent}
        title="Delete Calendar Event?"
        description={
          pendingDeleteEvent
            ? `Are you sure you want to permanently delete "${pendingDeleteEvent.title}"? This will also remove it from Google Calendar if connected.`
            : ''
        }
        actionType="delete"
        confirmLabel="Yes, Delete Event"
        cancelLabel="Keep Event"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteEvent(null)}
      />

      {/* Live Reminder Notifications Toast with Snooze */}
      <ReminderToast
        reminders={activeReminders}
        onDismiss={handleDismissReminder}
        onSnooze={handleSnoozeReminder}
      />
    </div>
  );
}
