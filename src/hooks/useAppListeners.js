import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

/**
 * Global Capacitor app listeners.
 * Handles back button, app state changes, etc.
 */
export function useAppListeners() {
  const navigate = useNavigate();

  useEffect(() => {
    let backListenerHandle = null;
    let stateListenerHandle = null;

    // 1. Handle Android Back Button
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    }).then(handle => {
      backListenerHandle = handle;
    });

    // 2. Handle App State (Pause/Resume)
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        logger.info('App resumed');
        // Opportunity to refresh real-time data or check session
      }
    }).then(handle => {
      stateListenerHandle = handle;
    });

    // Cleanup on unmount
    return () => {
      if (backListenerHandle) backListenerHandle.remove();
      if (stateListenerHandle) stateListenerHandle.remove();
    };
  }, [navigate]);
}
