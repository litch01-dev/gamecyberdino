/**
 * CYBERPUNK HAND RUNNER - Local Storage Manager
 * Handles persistent storage for high scores, user preferences, and stats.
 */

const STORAGE_KEYS = {
  HIGH_SCORE: 'cyberpunk_high_score',
  SETTINGS: 'cyberpunk_settings',
  STATS: 'cyberpunk_stats'
};

const DEFAULT_SETTINGS = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.6,
  sfxVolume: 0.75,
  handSensitivity: 3, // 1 (low) to 5 (high)
  cameraEnabled: true,
  calibrationBaseline: 0.65
};

const DEFAULT_STATS = {
  gamesPlayed: 0,
  totalDistance: 0,
  totalCollectibles: 0,
  highestLevel: 1
};

export const Storage = {
  /**
   * Retrieve high score from LocalStorage
   * @returns {number}
   */
  getHighScore() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      return val ? parseInt(val, 10) : 0;
    } catch (e) {
      console.warn('Storage error getting high score:', e);
      return 0;
    }
  },

  /**
   * Save high score if greater than current
   * @param {number} score
   * @returns {boolean} true if new high score
   */
  saveHighScore(score) {
    try {
      const current = this.getHighScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Storage error saving high score:', e);
      return false;
    }
  },

  /**
   * Reset high score
   */
  resetHighScore() {
    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, '0');
    } catch (e) {
      console.warn('Storage error resetting high score:', e);
    }
  },

  /**
   * Retrieve settings object
   * @returns {typeof DEFAULT_SETTINGS}
   */
  getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Storage error reading settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  },

  /**
   * Save complete settings object
   * @param {object} settings
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage error saving settings:', e);
    }
  },

  /**
   * Update a single setting
   * @param {string} key
   * @param {any} value
   */
  updateSetting(key, value) {
    const current = this.getSettings();
    current[key] = value;
    this.saveSettings(current);
    return current;
  },

  /**
   * Get lifetime player statistics
   */
  getStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATS);
      if (raw) {
        return { ...DEFAULT_STATS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Storage error reading stats:', e);
    }
    return { ...DEFAULT_STATS };
  },

  /**
   * Record a finished run stats
   * @param {{ distance: number, collectibles: number, level: number }} runData
   */
  recordGame(runData) {
    try {
      const stats = this.getStats();
      stats.gamesPlayed += 1;
      stats.totalDistance += Math.floor(runData.distance || 0);
      stats.totalCollectibles += (runData.collectibles || 0);
      if (runData.level > stats.highestLevel) {
        stats.highestLevel = runData.level;
      }
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Storage error recording stats:', e);
    }
  }
};
