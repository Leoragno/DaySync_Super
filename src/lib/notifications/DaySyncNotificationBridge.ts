import { registerPlugin, Capacitor } from '@capacitor/core';
import { notificationLogger } from './NotificationLogger';

export interface DaySyncNotificationPluginType {
  rescheduleAll(): Promise<{ success: boolean }>;
  checkExactAlarmPermission(): Promise<{ granted: boolean }>;
  requestExactAlarmPermission(): Promise<{ triggered: boolean }>;
  checkBatteryOptimizations(): Promise<{ ignoring: boolean }>;
  requestIgnoreBatteryOptimizations(): Promise<{ triggered: boolean }>;
}

const PLUGIN_NAME = 'DaySyncNotification';

// Core native plugin registration
let NativePlugin: DaySyncNotificationPluginType | null = null;
try {
  if (Capacitor.isPluginAvailable(PLUGIN_NAME)) {
    NativePlugin = registerPlugin<DaySyncNotificationPluginType>(PLUGIN_NAME);
  }
} catch (error) {
  notificationLogger.warn('DaySyncNotification plugin is not available. Using fallback/mock implementation.', { error });
}

/**
 * DaySyncNotificationBridge - Resilient platform-aware bridge.
 * Delegates directly to the native Android plugin if running on Android,
 * otherwise provides safe, silent mock implementations for Web/iOS/Desktop.
 */
class DaySyncNotificationBridge implements DaySyncNotificationPluginType {
  private isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  async rescheduleAll(): Promise<{ success: boolean }> {
    if (this.isAndroid() && NativePlugin) {
      try {
        notificationLogger.info('[Bridge] Triggering native rescheduleAll');
        return await NativePlugin.rescheduleAll();
      } catch (error) {
        notificationLogger.error('[Bridge] Failed to trigger native rescheduleAll', { error });
        return { success: false };
      }
    } else {
      notificationLogger.debug('[Bridge] Mock rescheduleAll (Non-Android platform)');
      return { success: true };
    }
  }

  async checkExactAlarmPermission(): Promise<{ granted: boolean }> {
    if (this.isAndroid() && NativePlugin) {
      try {
        return await NativePlugin.checkExactAlarmPermission();
      } catch (error) {
        notificationLogger.error('[Bridge] Error checking exact alarm permission', { error });
        return { granted: false };
      }
    } else {
      return { granted: true };
    }
  }

  async requestExactAlarmPermission(): Promise<{ triggered: boolean }> {
    if (this.isAndroid() && NativePlugin) {
      try {
        notificationLogger.info('[Bridge] Requesting exact alarm permission screen');
        return await NativePlugin.requestExactAlarmPermission();
      } catch (error) {
        notificationLogger.error('[Bridge] Error requesting exact alarm permission', { error });
        return { triggered: false };
      }
    } else {
      notificationLogger.debug('[Bridge] Mock requestExactAlarmPermission (Non-Android)');
      return { triggered: false };
    }
  }

  async checkBatteryOptimizations(): Promise<{ ignoring: boolean }> {
    if (this.isAndroid() && NativePlugin) {
      try {
        return await NativePlugin.checkBatteryOptimizations();
      } catch (error) {
        notificationLogger.error('[Bridge] Error checking battery optimizations', { error });
        return { ignoring: true };
      }
    } else {
      return { ignoring: true };
    }
  }

  async requestIgnoreBatteryOptimizations(): Promise<{ triggered: boolean }> {
    if (this.isAndroid() && NativePlugin) {
      try {
        notificationLogger.info('[Bridge] Requesting ignore battery optimizations settings screen');
        return await NativePlugin.requestIgnoreBatteryOptimizations();
      } catch (error) {
        notificationLogger.error('[Bridge] Error requesting battery optimizations exemption', { error });
        return { triggered: false };
      }
    } else {
      notificationLogger.debug('[Bridge] Mock requestIgnoreBatteryOptimizations (Non-Android)');
      return { triggered: false };
    }
  }
}

export const daySyncNotificationBridge = new DaySyncNotificationBridge();
export default daySyncNotificationBridge;
