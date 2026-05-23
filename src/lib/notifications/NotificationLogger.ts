/**
 * NotificationLogger - Structured logging for notification operations.
 * Provides debug capabilities for notification scheduling, cancellation, and errors.
 * Logs are stored in memory with a configurable max size for debugging.
 */

import type { NotificationLogEntry, NotificationType } from './types';

const MAX_LOG_ENTRIES = 100;
const ENABLE_LOGGING = import.meta.env.DEV || import.meta.env.VITE_ENABLE_NOTIFICATION_LOGGING === 'true';

class NotificationLogger {
  private logs: NotificationLogEntry[] = [];
  private listeners: Set<(logs: NotificationLogEntry[]) => void> = new Set();

  /**
   * Add a debug log entry.
   */
  debug(message: string, context?: Record<string, unknown>, notificationType?: NotificationType): void {
    this.addLog('debug', message, context, notificationType);
  }

  /**
   * Add an info log entry.
   */
  info(message: string, context?: Record<string, unknown>, notificationType?: NotificationType): void {
    this.addLog('info', message, context, notificationType);
  }

  /**
   * Add a warning log entry.
   */
  warn(message: string, context?: Record<string, unknown>, notificationType?: NotificationType): void {
    this.addLog('warn', message, context, notificationType);
  }

  /**
   * Add an error log entry.
   */
  error(message: string, context?: Record<string, unknown>, notificationType?: NotificationType): void {
    this.addLog('error', message, context, notificationType);
  }

  /**
   * Add a log entry.
   */
  private addLog(
    level: NotificationLogEntry['level'],
    message: string,
    context?: Record<string, unknown>,
    notificationType?: NotificationType
  ): void {
    if (!ENABLE_LOGGING) return;

    const entry: NotificationLogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      notificationType,
    };

    // Add to logs, maintaining max size
    this.logs.push(entry);
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs.shift();
    }

    // Output to console in development
    if (import.meta.env.DEV) {
      const prefix = `[NotificationLogger${notificationType ? `:${notificationType}` : ''}]`;
      const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      logFn(prefix, message, context || '');
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get all log entries.
   */
  getLogs(): NotificationLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level.
   */
  getLogsByLevel(level: NotificationLogEntry['level']): NotificationLogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs filtered by notification type.
   */
  getLogsByType(type: NotificationType): NotificationLogEntry[] {
    return this.logs.filter((log) => log.notificationType === type);
  }

  /**
   * Clear all log entries.
   */
  clear(): void {
    this.logs = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to log changes.
   */
  subscribe(listener: (logs: NotificationLogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of log changes.
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  /**
   * Export logs as JSON string for debugging.
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get log statistics.
   */
  getStats(): {
    total: number;
    byLevel: Record<NotificationLogEntry['level'], number>;
    byType: Record<NotificationType, number>;
  } {
    const byLevel: Record<NotificationLogEntry['level'], number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };
    const byType: Record<NotificationType, number> = {
      event_reminder: 0,
      daily_morning: 0,
      daily_evening: 0,
      schedule: 0,
      system: 0,
    };

    this.logs.forEach((log) => {
      byLevel[log.level]++;
      if (log.notificationType) {
        byType[log.notificationType]++;
      }
    });

    return {
      total: this.logs.length,
      byLevel,
      byType,
    };
  }
}

// Singleton instance
export const notificationLogger = new NotificationLogger();
