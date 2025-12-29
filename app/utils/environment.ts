/**
 * Environment detection utilities
 * Prevents hydration errors by safely checking for browser APIs
 */

export const isServer = typeof window === 'undefined';
export const isClient = !isServer;
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Safe localStorage access that works in SSR
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (isServer) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (isServer) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  },
  removeItem: (key: string): void => {
    if (isServer) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }
};

/**
 * Safe sessionStorage access that works in SSR
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (isServer) return null;
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn('sessionStorage not available:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (isServer) return;
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('sessionStorage not available:', e);
    }
  },
  removeItem: (key: string): void => {
    if (isServer) return;
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('sessionStorage not available:', e);
    }
  }
};

/**
 * Wait for window to be available (client-side only)
 */
export const waitForWindow = (): Promise<void> => {
  if (isServer) {
    return Promise.resolve();
  }
  if (typeof window !== 'undefined') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const checkWindow = setInterval(() => {
      if (typeof window !== 'undefined') {
        clearInterval(checkWindow);
        resolve();
      }
    }, 10);
  });
};

