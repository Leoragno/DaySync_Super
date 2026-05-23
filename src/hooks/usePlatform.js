import { useState, useEffect } from 'react';

/**
 * Detects the current platform (web, android, ios) and
 * provides helpers for platform-conditional rendering.
 */
export function usePlatform() {
  const [platform, setPlatform] = useState('web');

  useEffect(() => {
    // Capacitor injects this global when running in a native shell
    if (window.Capacitor?.isNativePlatform()) {
      setPlatform(window.Capacitor.getPlatform()); // 'android' | 'ios'
    }
  }, []);

  return {
    platform,
    isNative: platform !== 'web',
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web',
  };
}
