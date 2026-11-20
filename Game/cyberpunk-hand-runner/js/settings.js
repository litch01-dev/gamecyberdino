/**
 * CYBERPUNK HAND RUNNER - Settings Controller
 * Handles user preferences: Audio, Hand Sensitivity, Camera toggle, and High Score reset.
 */

import { Storage } from './storage.js';
import { Audio } from './audio.js';
import { HandTrackerInstance } from './handTracking.js';

export class SettingsManager {
  constructor() {
    this.settings = Storage.getSettings();
  }

  initUI(elements) {
    this.elements = elements;
    this.syncUI();
    this.bindEvents();
  }

  syncUI() {
    const s = this.settings;
    if (this.elements.musicToggle) this.elements.musicToggle.checked = s.musicEnabled;
    if (this.elements.sfxToggle) this.elements.sfxToggle.checked = s.sfxEnabled;
    if (this.elements.musicVolume) this.elements.musicVolume.value = Math.round(s.musicVolume * 100);
    if (this.elements.sfxVolume) this.elements.sfxVolume.value = Math.round(s.sfxVolume * 100);
    if (this.elements.sensitivitySlider) this.elements.sensitivitySlider.value = s.handSensitivity;
    if (this.elements.sensitivityValue) this.elements.sensitivityValue.textContent = s.handSensitivity;
  }

  bindEvents() {
    // Music Toggle
    if (this.elements.musicToggle) {
      this.elements.musicToggle.addEventListener('change', (e) => {
        Audio.setMusicEnabled(e.target.checked);
        Audio.playClick();
      });
    }

    // SFX Toggle
    if (this.elements.sfxToggle) {
      this.elements.sfxToggle.addEventListener('change', (e) => {
        Audio.setSfxEnabled(e.target.checked);
        Audio.playClick();
      });
    }

    // Music Volume
    if (this.elements.musicVolume) {
      this.elements.musicVolume.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        Audio.setMusicVolume(val);
      });
    }

    // SFX Volume
    if (this.elements.sfxVolume) {
      this.elements.sfxVolume.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        Audio.setSfxVolume(val);
      });
      this.elements.sfxVolume.addEventListener('change', () => {
        Audio.playCollect('coin'); // Test beep on release
      });
    }

    // Sensitivity Slider
    if (this.elements.sensitivitySlider) {
      this.elements.sensitivitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.elements.sensitivityValue) {
          this.elements.sensitivityValue.textContent = val;
        }
        HandTrackerInstance.setSensitivity(val);
        Storage.updateSetting('handSensitivity', val);
      });
    }

    // Reset High Score
    if (this.elements.resetScoreBtn) {
      this.elements.resetScoreBtn.addEventListener('click', () => {
        if (confirm('Reset high score and player stats to zero?')) {
          Storage.resetHighScore();
          Audio.playCollision();
          if (this.elements.onScoreReset) {
            this.elements.onScoreReset();
          }
        }
      });
    }
  }
}

export const Settings = new SettingsManager();
