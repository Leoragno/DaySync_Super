/**
 * Type definitions for the DaySync notification system.
 * Centralized types ensure consistency across all notification modules.
 */

/**
 * Notification channel identifiers for Android.
 * Each channel represents a different type of notification with its own behavior.
 */
export enum NotificationChannel {
  /** Event reminders (agenda) */
  EVENT_REMINDERS = 'daysync-event-reminders',
  
  /** Daily recurring reminders (morning/evening) */
  DAILY_REMINDERS = 'daysync-daily-reminders',
  
  /** Schedule/time-based notifications */
  SCHEDULE = 'daysync-schedule',
  
  /** General system notifications */
  SYSTEM = 'daysync-system',
}

/**
 * Notification priority levels.
 */
export enum NotificationPriority {
  LOW = 1,
  DEFAULT = 2,
  HIGH = 3,
  MAX = 4,
}

/**
 * Notification visibility on lockscreen.
 */
export enum NotificationVisibility {
  /** Show full notification on lockscreen */
  PUBLIC = 1,
  
  /** Hide sensitive content on lockscreen */
  PRIVATE = 0,
  
  /** Don't show on lockscreen */
  SECRET = -1,
}

/**
 * Notification types for categorization and logging.
 */
export enum NotificationType {
  EVENT_REMINDER = 'event_reminder',
  DAILY_MORNING = 'daily_morning',
  DAILY_EVENING = 'daily_evening',
  SCHEDULE = 'schedule',
  SYSTEM = 'system',
}

/**
 * Notification data structure.
 */
export interface NotificationData {
  /** Unique identifier for the notification */
  id: number;
  
  /** Notification title */
  title: string;
  
  /** Notification body text */
  body: string;
  
  /** Channel ID for Android */
  channelId: NotificationChannel;
  
  /** Small icon resource name (without extension) */
  smallIcon: string;
  
  /** Large icon (optional) */
  largeIcon?: string;
  
  /** Sound to play (undefined for silent) */
  sound?: string;
  
  /** Vibration pattern (undefined for default) */
  vibration?: number[];
  
  /** Priority level */
  priority?: NotificationPriority;
  
  /** Lockscreen visibility */
  visibility?: NotificationVisibility;
  
  /** Notification type for categorization */
  type: NotificationType;
  
  /** Additional data payload */
  extra?: Record<string, unknown>;
  
  /** Deep link URL to open when tapped */
  deepLink?: string;
  
  /** Scheduled trigger time (for scheduled notifications) */
  scheduleAt?: Date;
  
  /** Whether this is a recurring notification */
  repeats?: boolean;
  
  /** Allow notification while device is in Doze mode */
  allowWhileIdle?: boolean;
}

/**
 * Event reminder notification data.
 */
export interface EventReminderData {
  /** Event ID from database */
  eventId: string;
  
  /** Event title */
  title: string;
  
  /** Event date (YYYY-MM-DD) */
  date: string;
  
  /** Event time (HH:MM) */
  time: string;
  
  /** Minutes before event to remind */
  reminderMinutes: number;
  
  /** Whether to play sound */
  soundEnabled: boolean;
}

/**
 * Daily reminder notification data.
 */
export interface DailyReminderData {
  /** Reminder slot identifier */
  slotId: number;
  
  /** Morning or evening reminder */
  type: 'morning' | 'evening';
  
  /** Hour (0-23) */
  hour: number;
  
  /** Minute (0-59) */
  minute: number;
  
  /** Notification title */
  title: string;
  
  /** Notification body */
  body: string;
  
  /** Whether to play sound */
  soundEnabled: boolean;
}

/**
 * Schedule notification data.
 */
export interface ScheduleNotificationData {
  /** Schedule ID from database */
  scheduleId: string;
  
  /** Day of week */
  day: string;
  
  /** Start time (HH:MM) */
  hour: string;
  
  /** End time (HH:MM, optional) */
  endHour?: string;
  
  /** Title */
  title: string;
  
  /** Category */
  category?: string;
}

/**
 * Notification permission status.
 */
export interface PermissionStatus {
  /** Whether display permission is granted */
  display: 'granted' | 'denied' | 'prompt' | 'not-determined' | 'prompt-with-rationale';
  
  /** Whether the app can schedule exact alarms (Android 12+) */
  exactAlarm?: 'granted' | 'denied' | 'not-determined';
}

/**
 * Notification schedule result.
 */
export interface ScheduleResult {
  /** Whether scheduling was successful */
  success: boolean;
  
  /** Scheduled notification IDs */
  ids: number[];
  
  /** Error message if failed */
  error?: string;
}

/**
 * Notification cancellation result.
 */
export interface CancelResult {
  /** Whether cancellation was successful */
  success: boolean;
  
  /** Number of notifications cancelled */
  count: number;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Notification log entry for debugging.
 */
export interface NotificationLogEntry {
  /** Timestamp of the log entry */
  timestamp: number;
  
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  
  /** Log message */
  message: string;
  
  /** Additional context */
  context?: Record<string, unknown>;
  
  /** Notification type (if applicable) */
  notificationType?: NotificationType;
}
