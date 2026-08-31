/**
 * Storage wrapper: uses chrome.storage.local when running as an extension,
 * falls back to localStorage when running as a plain web page (or the
 * standalone /game.html preview), so the rest of the game never branches
 * on which context it's in.
 */

const gameStorage = {
  hasChromeStorage() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  },

  async get(key, fallback) {
    if (this.hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(key in result ? result[key] : fallback);
        });
      });
    }
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  async set(key, value) {
    if (this.hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode, quota) — game still works, just won't persist */
    }
  },
};
