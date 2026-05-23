import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { EventsAPI } from '@/api/entities';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

/**
 * useBackgroundSync Hook - Resilient online synchronization.
 * Runs on app startup and whenever the app resumes from the background.
 * Automatically scans the `daysync_background_completed_queue` preference key (populated by native background notification actions)
 * and issues online Supabase mutations to synchronize completed statuses, updating the React Query state afterwards.
 */
export function useBackgroundSync() {
  const qc = useQueryClient();

  const syncBackgroundCompletions = async () => {
    try {
      const { value } = await Preferences.get({ key: 'daysync_background_completed_queue' });
      if (!value) {
        return;
      }

      let completedIds: string[] = [];
      try {
        completedIds = JSON.parse(value);
      } catch (e) {
        logger.warn('[Sync] Failed to parse background completed queue value. Resetting queue.');
        await Preferences.remove({ key: 'daysync_background_completed_queue' });
        return;
      }

      if (!Array.isArray(completedIds) || completedIds.length === 0) {
        return;
      }

      logger.info(`[Sync] Found ${completedIds.length} background completed events to sync`, { completedIds });

      const successIds: string[] = [];
      
      // Update each completed event sequentially to avoid network race conditions
      for (const id of completedIds) {
        try {
          await EventsAPI.update(id, { completed: true });
          successIds.push(id);
          logger.info(`[Sync] Successfully synced event ${id} as completed`);
        } catch (error) {
          logger.error(`[Sync] Failed to sync event ${id} as completed. Retrying on next startup.`, error);
        }
      }

      // If we synced some successfully, remove them from the queue
      if (successIds.length > 0) {
        const remainingIds = completedIds.filter(id => !successIds.includes(id));
        if (remainingIds.length > 0) {
          await Preferences.set({
            key: 'daysync_background_completed_queue',
            value: JSON.stringify(remainingIds),
          });
        } else {
          await Preferences.remove({ key: 'daysync_background_completed_queue' });
        }

        // Invalidate events in React Query so the UI reflects the completions instantly
        qc.invalidateQueries({ queryKey: ['events'] });
      }
    } catch (error) {
      logger.error('[Sync] Error in syncBackgroundCompletions', error);
    }
  };

  useEffect(() => {
    // 1. Run sync on mount (app startup)
    syncBackgroundCompletions();

    // 2. Listen to app state changes (resume from background)
    const activeListener = App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        logger.info('[Sync] App resumed. Checking for background completed events');
        syncBackgroundCompletions();
      }
    });

    return () => {
      activeListener.then(l => l.remove());
    };
  }, []);
}
export default useBackgroundSync;
