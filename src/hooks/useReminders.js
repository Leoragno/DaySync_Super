import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { syncDailyReminders } from '@/lib/dailyReminders';

/**
 * Pianifica i promemoria giornalieri leggendo le preferenze in localStorage.
 */
export function useReminders() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    void syncDailyReminders();
  }, [user]);

  useEffect(() => {
    const h = () => {
      void syncDailyReminders();
    };
    window.addEventListener('daysync-notification-settings', h);
    return () => window.removeEventListener('daysync-notification-settings', h);
  }, []);
}
