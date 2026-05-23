/**
 * Daily reminders — Legacy compatibility layer.
 * This file now delegates to the new NotificationService for consistency.
 */

import { notificationService } from './notifications/NotificationService';
import { getNotificationSettings } from './notificationSettings';
import { logger } from './logger';

export const DAILY_REMINDER_SLOTS = [
  { id: 900, key: 'morning' },
  { id: 1800, key: 'evening' },
];

/**
 * Cancella e ripianifica i promemoria giornalieri ricorrenti in base alle impostazioni salvate.
 * Richiede permesso display; se negato esce senza errori fatali.
 */
export async function syncDailyReminders() {
  try {
    const s = getNotificationSettings();
    
    await notificationService.syncDailyReminders({
      dailyMorningEnabled: s.dailyMorningEnabled,
      morningHour: s.morningHour,
      morningMinute: s.morningMinute,
      morningTitle: s.morningTitle,
      morningBody: s.morningBody,
      dailyEveningEnabled: s.dailyEveningEnabled,
      eveningHour: s.eveningHour,
      eveningMinute: s.eveningMinute,
      eveningTitle: s.eveningTitle,
      eveningBody: s.eveningBody,
      dailySound: s.dailySound,
    });
  } catch (err) {
    logger.error('Daily reminders sync failed:', err);
  }
}
