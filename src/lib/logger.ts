/**
 * Logger utility - Environment-aware logging.
 * Replaces console.log/warn/error with a production-safe logger.
 * In development, logs to console. In production, logs can be sent to a service.
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!isDev) return;

    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    const fullMessage = `${timestamp} ${prefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(fullMessage, ...args);
        break;
      case 'info':
        console.info(fullMessage, ...args);
        break;
      case 'warn':
        console.warn(fullMessage, ...args);
        break;
      case 'error':
        console.error(fullMessage, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.formatMessage('error', message, ...args);
  }
}

// Default logger instance
export const logger = new Logger('DaySync');

// Create logger with custom prefix
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}
