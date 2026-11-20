/**
 * CYBERPUNK HAND RUNNER - Main Application Controller
 * Orchestrates UI navigation, screen state transitions, webcam calibration flow, and game lifecycle.
 */

import { Storage } from './storage.js';
import { Audio } from './audio.js';
import { Settings } from './settings.js';
import { HandTrackerInstance } from './handTracking.js';
import { GameEngine, GAME_STATES } from './game.js';

class App {
  constructor() {
    this.gameEngine = null;
    this.isCalibrating = false;
    this.calibrationFrameId = null;
    this.miniPipFrameId = null;

    // Cache DOM Elements
    this.cacheElements();
  }

  cacheElements() {
    // Screens / Modals
    this.screens = {
      menu: document.getElementById('screen-menu'),
      howToPlay: document.getElementById('screen-how-to-play'),
      calibration: document.getElementById('screen-calibration'),
      game: document.getElementById('screen-game'),
      pause: document.getElementById('overlay-pause'),
      gameOver: document.getElementById('overlay-game-over'),
      settings: document.getElementById('screen-settings')
    };

    // Video & Canvases
    this.webcamVideo = document.getElementById('webcam-video');
    this.gameCanvas = document.getElementById('game-canvas');
    this.calibrationCanvas = document.getElementById('calibration-canvas');
    this.miniPipCanvas = document.getElementById('mini-pip-canvas');

    // UI Buttons
    this.buttons = {
      playNow: document.getElementById('btn-play-now'),
      calibrateMenu: document.getElementById('btn-calibrate-menu'),
      howToPlay: document.getElementById('btn-how-to-play'),
      closeHowToPlay: document.getElementById('btn-close-how-to-play'),
      settings: document.getElementById('btn-settings'),
      closeSettings: document.getElementById('btn-close-settings'),
      startCalibration: document.getElementById('btn-start-calibration'),
      proceedToGame: document.getElementById('btn-proceed-to-game'),
      cancelCalibration: document.getElementById('btn-cancel-calibration'),
      pauseBtn: document.getElementById('btn-hud-pause'),
      resumeBtn: document.getElementById('btn-resume'),
      restartBtn: document.getElementById('btn-restart'),
      pauseMenuBtn: document.getElementById('btn-pause-menu'),
      playAgainBtn: document.getElementById('btn-play-again'),
      gameOverMenuBtn: document.getElementById('btn-gameover-menu')
    };

    // Status & Text Fields
    this.menuHighScoreEl = document.getElementById('menu-high-score');
    this.cameraStatusPill = document.getElementById('menu-camera-status');
    this.calibrationStatusText = document.getElementById('calibration-status-text');
    this.calibrationFeedback = document.getElementById('calibration-feedback');

    // Game Over Results
    this.goScoreEl = document.getElementById('go-final-score');
    this.goHighScoreEl = document.getElementById('go-high-score');
    this.goDistanceEl = document.getElementById('go-distance');
    this.goLevelEl = document.getElementById('go-level');
    this.goCollectiblesEl = document.getElementById('go-collectibles');
    this.goBadgeNewHigh = document.getElementById('go-new-high-badge');
  }

  init() {
    // 1. Initialize Game Engine
    this.gameEngine = new GameEngine(this.gameCanvas);
    this.gameEngine.onStateChange = (state, data) => this.handleGameStateChange(state, data);

    // 2. Initialize Settings UI
    Settings.initUI({
      musicToggle: document.getElementById('setting-music-toggle'),
      sfxToggle: document.getElementById('setting-sfx-toggle'),
      musicVolume: document.getElementById('setting-music-volume'),
      sfxVolume: document.getElementById('setting-sfx-volume'),
      sensitivitySlider: document.getElementById('setting-sensitivity-slider'),
      sensitivityValue: document.getElementById('setting-sensitivity-value'),
      resetScoreBtn: document.getElementById('btn-reset-scores'),
      onScoreReset: () => this.updateHighScoreDisplay()
    });

    // 3. Update High Scores
    this.updateHighScoreDisplay();

    // 4. Hook HandTracker status listener
    HandTrackerInstance.onStatusChangeCallback = (status) => {
      if (this.cameraStatusPill) {
        this.cameraStatusPill.textContent = status;
      }
      if (this.calibrationStatusText) {
        this.calibrationStatusText.textContent = status;
      }
    };

    // 5. Bind Button Listeners
    this.bindEvents();

    // 6. Handle Browser Audio Autoplay Unlock
    const unlockAudio = () => {
      Audio.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // 7. Mini PIP Render Loop during gameplay
    this.startMiniPipLoop();
  }

  updateHighScoreDisplay() {
    const hs = Storage.getHighScore();
    if (this.menuHighScoreEl) {
      this.menuHighScoreEl.textContent = hs.toString().padStart(6, '0');
    }
  }

  bindEvents() {
    const addSound = (btn, action) => {
      if (!btn) return;
      btn.addEventListener('mouseenter', () => Audio.playHover());
      btn.addEventListener('click', (e) => {
        Audio.playClick();
        action(e);
      });
    };

    // Play Now -> Calibration Screen
    addSound(this.buttons.playNow, () => this.openCalibrationScreen());
    addSound(this.buttons.calibrateMenu, () => this.openCalibrationScreen());

    // How To Play Modal
    addSound(this.buttons.howToPlay, () => {
      this.screens.howToPlay.classList.remove('hidden');
    });
    addSound(this.buttons.closeHowToPlay, () => {
      this.screens.howToPlay.classList.add('hidden');
    });

    // Settings Modal
    addSound(this.buttons.settings, () => {
      this.screens.settings.classList.remove('hidden');
    });
    addSound(this.buttons.closeSettings, () => {
      this.screens.settings.classList.add('hidden');
    });

    // Calibration Actions
    addSound(this.buttons.startCalibration, () => this.handleCalibrateBaseline());
    addSound(this.buttons.proceedToGame, () => this.startGameFromCalibration());
    addSound(this.buttons.cancelCalibration, () => this.returnToMainMenu());

    // HUD Pause
    addSound(this.buttons.pauseBtn, () => this.gameEngine.pause());

    // Pause Menu Actions
    addSound(this.buttons.resumeBtn, () => this.gameEngine.resume());
    addSound(this.buttons.restartBtn, () => {
      this.screens.pause.classList.add('hidden');
      this.gameEngine.startNewGame();
    });
    addSound(this.buttons.pauseMenuBtn, () => {
      this.screens.pause.classList.add('hidden');
      this.returnToMainMenu();
    });

    // Game Over Actions
    addSound(this.buttons.playAgainBtn, () => {
      this.screens.gameOver.classList.add('hidden');
      this.gameEngine.startNewGame();
    });
    addSound(this.buttons.gameOverMenuBtn, () => {
      this.screens.gameOver.classList.add('hidden');
      this.returnToMainMenu();
    });

    // Window Resize Handling
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();
  }

  handleResize() {
    // Keep canvas crisp
    const container = document.getElementById('canvas-wrapper');
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    // CSS aspect ratio handles scaling, canvas internal size remains 960x540
  }

  // ==========================================
  // CALIBRATION FLOW
  // ==========================================

  async openCalibrationScreen() {
    this.screens.menu.classList.add('hidden');
    this.screens.game.classList.add('hidden');
    this.screens.calibration.classList.remove('hidden');
    this.isCalibrating = true;

    // Reset feedback
    if (this.calibrationFeedback) {
      this.calibrationFeedback.textContent = 'Position your hand comfortably in front of the camera, then click "LOCK BASELINE".';
      this.calibrationFeedback.className = 'feedback-neutral';
    }

    try {
      await HandTrackerInstance.init(this.webcamVideo);
    } catch (err) {
      if (this.calibrationFeedback) {
        this.calibrationFeedback.textContent = 'Camera or vision model error. Check browser permissions or network connection. Keyboard controls (Spacebar/Up) remain available!';
        this.calibrationFeedback.className = 'feedback-error';
      }
    }

    this.runCalibrationLoop();
  }

  runCalibrationLoop() {
    if (!this.isCalibrating) return;

    // Process tracking frame
    HandTrackerInstance.processFrame();

    // Render debug skeleton on calibration canvas
    const ctx = this.calibrationCanvas.getContext('2d');
    HandTrackerInstance.renderDebug(ctx, this.calibrationCanvas.width, this.calibrationCanvas.height, false);

    // Dynamic test feedback
    if (HandTrackerInstance.isJumpTriggered && this.calibrationFeedback) {
      this.calibrationFeedback.textContent = 'JUMP DETECTED! Motion is working cleanly!';
      this.calibrationFeedback.className = 'feedback-success';
    }

    this.calibrationFrameId = requestAnimationFrame(() => this.runCalibrationLoop());
  }

  handleCalibrateBaseline() {
    if (!HandTrackerInstance.handDetected) {
      if (this.calibrationFeedback) {
        this.calibrationFeedback.textContent = 'Hand not detected! Please raise your hand into the camera frame first.';
        this.calibrationFeedback.className = 'feedback-error';
      }
      Audio.playCollision();
      return;
    }

    const success = HandTrackerInstance.calibrateCurrentPosition();
    if (success) {
      Audio.playCollect('power_core');
      if (this.calibrationFeedback) {
        this.calibrationFeedback.textContent = 'BASELINE LOCKED! Raise your hand up to test the jump trigger.';
        this.calibrationFeedback.className = 'feedback-success';
      }
    }
  }

  startGameFromCalibration() {
    this.isCalibrating = false;
    if (this.calibrationFrameId) {
      cancelAnimationFrame(this.calibrationFrameId);
      this.calibrationFrameId = null;
    }

    this.screens.calibration.classList.add('hidden');
    this.screens.game.classList.remove('hidden');

    this.gameEngine.startNewGame();
  }

  returnToMainMenu() {
    this.isCalibrating = false;
    if (this.calibrationFrameId) {
      cancelAnimationFrame(this.calibrationFrameId);
      this.calibrationFrameId = null;
    }

    this.gameEngine.state = GAME_STATES.MENU;
    Audio.stopMusic();

    this.screens.calibration.classList.add('hidden');
    this.screens.game.classList.add('hidden');
    this.screens.pause.classList.add('hidden');
    this.screens.gameOver.classList.add('hidden');
    this.screens.menu.classList.remove('hidden');

    this.updateHighScoreDisplay();
  }

  // ==========================================
  // MINI PIP LOOP FOR IN-GAME WEBCAM
  // ==========================================

  startMiniPipLoop() {
    const pipCtx = this.miniPipCanvas.getContext('2d');
    const updateMiniPip = () => {
      if (this.gameEngine.state === GAME_STATES.PLAYING || this.gameEngine.state === GAME_STATES.PAUSED) {
        HandTrackerInstance.renderDebug(pipCtx, this.miniPipCanvas.width, this.miniPipCanvas.height, true);
      }
      this.miniPipFrameId = requestAnimationFrame(updateMiniPip);
    };
    this.miniPipFrameId = requestAnimationFrame(updateMiniPip);
  }

  // ==========================================
  // GAME STATE TRANSITION HANDLER
  // ==========================================

  handleGameStateChange(state, data) {
    if (state === GAME_STATES.PAUSED) {
      this.screens.pause.classList.remove('hidden');
    } else if (state === GAME_STATES.PLAYING) {
      this.screens.pause.classList.add('hidden');
    } else if (state === GAME_STATES.GAME_OVER) {
      this.screens.gameOver.classList.remove('hidden');

      if (data) {
        if (this.goScoreEl) this.goScoreEl.textContent = data.score.toString().padStart(6, '0');
        if (this.goHighScoreEl) this.goHighScoreEl.textContent = data.highScore.toString().padStart(6, '0');
        if (this.goDistanceEl) this.goDistanceEl.textContent = `${data.distance}m`;
        if (this.goLevelEl) this.goLevelEl.textContent = `LVL ${data.level}`;
        if (this.goCollectiblesEl) this.goCollectiblesEl.textContent = data.collectibles;

        if (this.goBadgeNewHigh) {
          if (data.isNewHigh) {
            this.goBadgeNewHigh.classList.remove('hidden');
          } else {
            this.goBadgeNewHigh.classList.add('hidden');
          }
        }
      }
      this.updateHighScoreDisplay();
    }
  }
}

// Instantiate and initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

