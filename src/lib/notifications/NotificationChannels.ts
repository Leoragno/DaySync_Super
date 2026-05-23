/**
 * NotificationChannels - Android notification channel management.
 * Creates and manages notification channels for different notification types.
 * Required for Android 8.0+ (API level 26+).
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { notificationLogger } from './NotificationLogger';
import { NotificationChannel, NotificationPriority, NotificationVisibility } from './types';

/**
 * Channel configuration interface.
 */
interface ChannelConfig {
  id: NotificationChannel;
  name: string;
  description: string;
  importance: NotificationPriority;
  visibility: NotificationVisibility;
  vibration: boolean;
  sound: string | null;
  lights: boolean;
  lightColor?: string;
}

/**
 * Default channel configurations.
 */
const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    id: NotificationChannel.EVENT_REMINDERS,
    name: 'Promemoria Eventi',
    description: 'Notifiche per promemoria degli eventi in agenda',
    importance: NotificationPriority.HIGH,
    visibility: NotificationVisibility.PUBLIC,
    vibration: true,
    sound: 'default',
    lights: true,
    lightColor: '#6366f1',
  },
  {
    id: NotificationChannel.DAILY_REMINDERS,
    name: 'Promemoria Giornalieri',
    description: 'Notifiche ricorrenti mattutine e serali',
    importance: NotificationPriority.DEFAULT,
    visibility: NotificationVisibility.PUBLIC,
    vibration: true,
    sound: 'default',
    lights: true,
    lightColor: '#6366f1',
  },
  {
    id: NotificationChannel.SCHEDULE,
    name: 'Orario',
    description: 'Notifiche per gli orari scolastici',
    importance: NotificationPriority.DEFAULT,
    visibility: NotificationVisibility.PUBLIC,
    vibration: false,
    sound: null,
    lights: false,
  },
  {
    id: NotificationChannel.SYSTEM,
    name: 'Sistema',
    description: 'Notifiche di sistema',
    importance: NotificationPriority.LOW,
    visibility: NotificationVisibility.PRIVATE,
    vibration: false,
    sound: null,
    lights: false,
  },
];

/**
 * NotificationChannels class for managing Android notification channels.
 */
class NotificationChannels {
  private initialized = false;
  private channelCache = new Set<NotificationChannel>();

  /**
   * Initialize all notification channels.
   * Should be called once during app startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      notificationLogger.debug('NotificationChannels already initialized');
      return;
    }

    try {
      notificationLogger.info('Initializing notification channels');

      for (const config of CHANNEL_CONFIGS) {
        await this.createChannel(config);
        this.channelCache.add(config.id);
      }

      this.initialized = true;
      notificationLogger.info('Notification channels initialized successfully', {
        channels: Array.from(this.channelCache),
      });
    } catch (error) {
      notificationLogger.error('Failed to initialize notification channels', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a single notification channel.
   */
  private async createChannel(config: ChannelConfig): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id: config.id,
        name: config.name,
        description: config.description,
        importance: config.importance,
        visibility: config.visibility,
        vibration: config.vibration,
        sound: config.sound,
        lights: config.lights,
        lightColor: config.lightColor,
      });

      notificationLogger.debug(`Created channel: ${config.id}`, { config });
    } catch (error) {
      // Channel may already exist, which is fine
      if (error instanceof Error && error.message.includes('already exists')) {
        notificationLogger.debug(`Channel already exists: ${config.id}`);
        this.channelCache.add(config.id);
        return;
      }

      notificationLogger.warn(`Failed to create channel: ${config.id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Delete a notification channel.
   */
  async deleteChannel(channelId: NotificationChannel): Promise<void> {
    try {
      await LocalNotifications.deleteChannel({ id: channelId });
      this.channelCache.delete(channelId);
      notificationLogger.debug(`Deleted channel: ${channelId}`);
    } catch (error) {
      notificationLogger.warn(`Failed to delete channel: ${channelId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * List all created channels.
   */
  async listChannels(): Promise<NotificationChannel[]> {
    try {
      const result = await LocalNotifications.listChannels();
      notificationLogger.debug('Listed channels', { channels: result.channels });
      return result.channels.map((c) => c.id as NotificationChannel);
    } catch (error) {
      notificationLogger.warn('Failed to list channels', {
        error: error instanceof Error ? error.message : String(error),
      });
      return Array.from(this.channelCache);
    }
  }

  /**
   * Check if a channel exists.
   */
  async channelExists(channelId: NotificationChannel): Promise<boolean> {
    if (this.channelCache.has(channelId)) {
      return true;
    }

    const channels = await this.listChannels();
    return channels.includes(channelId);
  }

  /**
   * Get channel configuration by ID.
   */
  getChannelConfig(channelId: NotificationChannel): ChannelConfig | undefined {
    return CHANNEL_CONFIGS.find((c) => c.id === channelId);
  }

  /**
   * Get all channel configurations.
   */
  getAllChannelConfigs(): ChannelConfig[] {
    return [...CHANNEL_CONFIGS];
  }

  /**
   * Check if channels are initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const notificationChannels = new NotificationChannels();
