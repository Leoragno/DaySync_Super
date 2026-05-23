/**
 * Notification service — Legacy compatibility layer.
 * This file now delegates to the new NotificationService for consistency.
 * Kept for backward compatibility with existing imports.
 */

import { notificationService } from './notifications/NotificationService';
import { getNotificationSettings } from './notificationSettings';

let initialized = false;

/**
 * Initialize the notification service.
 * Call this once during app startup.
 */
async function ensureInitialized() {
  if (!initialized) {
    await notificationService.initialize();
    initialized = true;
  }
}

/**
 * Request notification permissions.
 * @returns {Promise<boolean>} Whether permissions were granted.
 */
export async function requestPermission() {
  await ensureInitialized();
  const status = await notificationService.requestPermissions();
  return status.display === 'granted';
}

/**
 * Check if notifications are currently permitted.
 */
export async function checkPermission() {
  await ensureInitialized();
  return notificationService.isPermitted();
}

/**
 * Schedule a notification for an event.
 * @param {object} event - Event data { id, title, date, time, reminder_minutes }
 */
export async function scheduleEventReminder(event) {
  await ensureInitialized();
  
  const soundOn = getNotificationSettings().eventSound;

  return notificationService.scheduleEventReminder({
    eventId: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    reminderMinutes: event.reminder_minutes,
    soundEnabled: soundOn,
  });
}

/**
 * Cancel a scheduled notification.
 * @param {string} eventId
 */
export async function cancelEventReminder(eventId) {
  await ensureInitialized();
  return notificationService.cancelEventReminder(eventId);
}

/**
 * Create the notification channel for Android (required for Android 8+).
 * Call this once during app initialization.
 * @deprecated This is now handled automatically by NotificationService.initialize()
 */
export async function createNotificationChannel() {
  await ensureInitialized();
  // Channels are now created automatically during initialization
}