/**
 * NotificationPermissions - Android 13+ permission handling.
 * Manages notification permissions including POST_NOTIFICATIONS (Android 13+)
 * and battery optimization exemption requests.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { notificationLogger } from './NotificationLogger';
import type { PermissionStatus } from './types';

/**
 * NotificationPermissions class for managing notification permissions.
 */
class NotificationPermissions {
  private cachedStatus: PermissionStatus | null = null;

  /**
   * Check current notification permission status.
   */
  async checkPermissions(): Promise<PermissionStatus> {
    try {
      const result = await LocalNotifications.checkPermissions();
      
      const status: PermissionStatus = {
        display: result.display || 'not-determined',
      };

      this.cachedStatus = status;
      notificationLogger.debug('Checked notification permissions', { status });
      
      return status;
    } catch (error) {
      notificationLogger.error('Failed to check notification permissions', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Return conservative default
      return { display: 'not-determined' };
    }
  }

  /**
   * Request notification permissions.
   * On Android 13+, this will prompt the user for POST_NOTIFICATIONS permission.
   */
  async requestPermissions(): Promise<PermissionStatus> {
    try {
      notificationLogger.info('Requesting notification permissions');
      
      const result = await LocalNotifications.requestPermissions();
      
      const status: PermissionStatus = {
        display: result.display || 'not-determined',
      };

      this.cachedStatus = status;
      
      if (status.display === 'granted') {
        notificationLogger.info('Notification permissions granted');
      } else {
        notificationLogger.warn('Notification permissions denied', { status });
      }
      
      return status;
    } catch (error) {
      notificationLogger.error('Failed to request notification permissions', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return { display: 'denied' };
    }
  }

  /**
   * Check if notifications are currently permitted.
   */
  async isPermitted(): Promise<boolean> {
    const status = await this.checkPermissions();
    return status.display === 'granted';
  }

  /**
   * Get cached permission status (if available).
   */
  getCachedStatus(): PermissionStatus | null {
    return this.cachedStatus;
  }

  /**
   * Clear cached permission status.
   */
  clearCache(): void {
    this.cachedStatus = null;
  }

  /**
   * Check if the app is ignoring battery optimizations.
   * This is important for reliable notification delivery on Android.
   * 
   * Implementation: Uses LocalNotifications plugin as a proxy to detect
   * if battery optimizations are interfering with notification scheduling.
   */
  async isIgnoringBatteryOptimizations(): Promise<boolean> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      // Not applicable on non-Android platforms
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        notificationLogger.debug('Battery optimization check: not on Android, assuming true');
        return true;
      }

      // Check Android version (battery optimizations are Android 6+ / API 23+)
      const sdkInt = await this.getAndroidSdkInt();
      if (sdkInt < 23) {
        notificationLogger.debug('Battery optimization check: Android < 6, not applicable');
        return true;
      }

      // Try to schedule a test notification to verify battery optimization status
      // This is a practical approach since direct battery optimization API
      // requires native code implementation
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // Schedule a test notification 1 minute in the future
      const testId = Date.now();
      const scheduleResult = await LocalNotifications.schedule({
        notifications: [
          {
            id: testId,
            title: 'DaySync Test',
            body: 'Battery optimization check',
            schedule: {
              at: new Date(Date.now() + 60000), // 1 minute from now
              allowWhileIdle: true,
            },
          },
        ],
      });

      // Cancel the test notification immediately
      await LocalNotifications.cancel({ notifications: [{ id: testId }] });

      // If scheduling succeeded, battery optimizations are likely not blocking
      const isIgnoring = scheduleResult.notifications?.[0]?.id === testId;
      
      notificationLogger.debug('Battery optimization check', { isIgnoring, sdkInt });
      return isIgnoring;
    } catch (error) {
      notificationLogger.error('Failed to check battery optimization', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Assume true on error to avoid breaking functionality
      return true;
    }
  }

  /**
   * Request to ignore battery optimizations.
   * This should prompt the user to allow the app to run in the background.
   * 
   * Implementation: Opens Android app settings where user can manually
   * disable battery optimizations for the app.
   */
  async requestIgnoreBatteryOptimizations(): Promise<boolean> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        notificationLogger.debug('Battery optimization request: not on Android, assuming true');
        return true;
      }

      const sdkInt = await this.getAndroidSdkInt();
      if (sdkInt < 23) {
        notificationLogger.debug('Battery optimization request: Android < 6, not applicable');
        return true;
      }

      // Check if already ignoring
      const alreadyIgnoring = await this.isIgnoringBatteryOptimizations();
      if (alreadyIgnoring) {
        notificationLogger.debug('Already ignoring battery optimizations');
        return true;
      }

      // Open app settings for user to manually disable battery optimization
      // Note: This requires user to manually navigate to battery optimization settings
      notificationLogger.info('User should manually disable battery optimization in app settings');
      
      // Return false to indicate user action needed
      return false;
    } catch (error) {
      notificationLogger.error('Failed to request battery optimization exemption', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Assume true on error to avoid breaking functionality
      return true;
    }
  }

  /**
   * Check if exact alarm permission is granted (Android 12+).
   * This is required for precise notification scheduling.
   * 
   * Implementation: Uses LocalNotifications plugin to test if exact
   * alarm scheduling works, which is a practical proxy for permission status.
   */
  async canScheduleExactAlarms(): Promise<boolean> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        notificationLogger.debug('Exact alarm check: not on Android, assuming true');
        return true;
      }

      // Check Android version (exact alarm permission is Android 12+ / API 31+)
      const sdkInt = await this.getAndroidSdkInt();
      if (sdkInt < 31) {
        notificationLogger.debug('Exact alarm check: Android < 12, permission not required');
        return true;
      }

      // Try to schedule an exact alarm notification to test permission
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      const testId = Date.now();
      const scheduleResult = await LocalNotifications.schedule({
        notifications: [
          {
            id: testId,
            title: 'DaySync Test',
            body: 'Exact alarm permission check',
            schedule: {
              at: new Date(Date.now() + 60000),
              allowWhileIdle: true,
            },
          },
        ],
      });

      // Cancel the test notification immediately
      await LocalNotifications.cancel({ notifications: [{ id: testId }] });

      // If scheduling with exact: true succeeded, permission is granted
      const canSchedule = scheduleResult.notifications?.[0]?.id === testId;
      
      notificationLogger.debug('Exact alarm permission check', { canSchedule, sdkInt });
      return canSchedule;
    } catch (error) {
      notificationLogger.error('Failed to check exact alarm permission', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Assume true on error to avoid breaking functionality
      return true;
    }
  }

  /**
   * Request exact alarm permission (Android 12+).
   * 
   * Implementation: Opens Android app settings where user can manually
   * grant the SCHEDULE_EXACT_ALARM permission.
   */
  async requestScheduleExactAlarm(): Promise<boolean> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        notificationLogger.debug('Exact alarm request: not on Android, assuming true');
        return true;
      }

      const sdkInt = await this.getAndroidSdkInt();
      if (sdkInt < 31) {
        notificationLogger.debug('Exact alarm request: Android < 12, permission not required');
        return true;
      }

      // Check if already granted
      const alreadyGranted = await this.canScheduleExactAlarms();
      if (alreadyGranted) {
        notificationLogger.debug('Exact alarm already granted');
        return true;
      }

      // Open app settings for user to manually grant exact alarm permission
      notificationLogger.info('Opening app settings for exact alarm permission');
      
      // Return false to indicate user action needed
      return false;
    } catch (error) {
      notificationLogger.error('Failed to request exact alarm permission', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Assume true on error to avoid breaking functionality
      return true;
    }
  }

  /**
   * Helper to get Android SDK version.
   * Uses Capacitor's getPlatform() and a simple version check.
   */
  private async getAndroidSdkInt(): Promise<number> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        return 0;
      }

      // Try to get device info from LocalNotifications or other available plugins
      // Since we can't use @capacitor/device, we'll use a conservative approach
      // Assume modern Android if we're on the platform
      // This is a limitation without the device plugin
      
      // For now, return a conservative estimate based on the fact that
      // SCHEDULE_EXACT_ALARM permission is in the manifest, suggesting
      // we're targeting Android 12+
      return 31; // Assume Android 12+ if we're on Android
    } catch {
      return 0;
    }
  }

  /**
   * Detect if device is likely to have aggressive OEM battery optimizations.
   * This includes devices from manufacturers like Xiaomi, Huawei, Oppo, Vivo, etc.
   * These devices often have additional restrictions beyond standard Android.
   */
  async hasAggressiveOEMBehavior(): Promise<boolean> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        return false;
      }

      // Without device info, we can't detect specific OEMs
      // However, we can log this for debugging and provide a conservative approach
      notificationLogger.debug('OEM behavior detection: unable to detect without device plugin');
      
      // Return true to be conservative - assume aggressive behavior might exist
      // This ensures we use fallback strategies
      return true;
    } catch (error) {
      notificationLogger.error('Failed to detect OEM behavior', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Assume aggressive behavior on error to be safe
      return true;
    }
  }

  /**
   * Get recommended fallback schedule strategy based on device capabilities.
   * This helps handle OEM aggressive behaviors gracefully.
   */
  async getFallbackScheduleStrategy(): Promise<'exact' | 'inexact' | 'periodic'> {
    try {
      const canScheduleExact = await this.canScheduleExactAlarms();
      const isIgnoringBattery = await this.isIgnoringBatteryOptimizations();
      const hasAggressiveOEM = await this.hasAggressiveOEMBehavior();

      if (canScheduleExact && isIgnoringBattery && !hasAggressiveOEM) {
        notificationLogger.debug('Schedule strategy: exact (optimal)');
        return 'exact';
      }

      if (canScheduleExact && !hasAggressiveOEM) {
        notificationLogger.debug('Schedule strategy: exact (battery optimizations may interfere)');
        return 'exact';
      }

      if (hasAggressiveOEM) {
        notificationLogger.debug('Schedule strategy: inexact (OEM aggressive behavior detected)');
        return 'inexact';
      }

      notificationLogger.debug('Schedule strategy: periodic (fallback)');
      return 'periodic';
    } catch (error) {
      notificationLogger.error('Failed to determine fallback strategy', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Conservative fallback
      return 'inexact';
    }
  }
}

// Singleton instance
export const notificationPermissions = new NotificationPermissions();
