const STORAGE_KEY = 'daysync-notification-settings';

const DEFAULTS = {
  dailyMorningEnabled: true,
  morningHour: 9,
  morningMinute: 0,
  morningTitle: 'DaySync: Controlla i tuoi appunti',
  morningBody: 'Inizia bene la giornata: rivedi i tuoi appunti.',
  dailyEveningEnabled: true,
  eveningHour: 18,
  eveningMinute: 0,
  eveningTitle: 'DaySync: Promemoria serale',
  eveningBody: 'Ricontrolla le note prima di chiudere la giornata.',
  dailySound: true,
  eventSound: true,
};

export function getNotificationSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveNotificationSettings(patch) {
  const next = { ...getNotificationSettings(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('daysync-notification-settings'));
  return next;
}
