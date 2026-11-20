/**
 * CYBERPUNK HAND RUNNER - Web Audio API Synthesizer
 * Procedural cyberpunk sound effects & dynamic synthwave music.
 * Zero external audio files required, ensuring 100% offline reliability.
 */

import { Storage } from './storage.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Settings
    const settings = Storage.getSettings();
    this.musicEnabled = settings.musicEnabled;
    this.sfxEnabled = settings.sfxEnabled;
    this.musicVolume = settings.musicVolume;
    this.sfxVolume = settings.sfxVolume;

    // Music Sequencer State
    this.isPlayingMusic = false;
    this.seqTimer = null;
    this.seqStep = 0;
    this.tempo = 125; // BPM
    this.currentLevel = 1;

    // Footstep throttling
    this.lastStepTime = 0;
  }

  /**
   * Initialize AudioContext on user interaction
   */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }

    this.ctx = new AudioContextClass();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Music bus
    this.musicGain = this.ctx.createGain();
    this.updateMusicVolume();
    this.musicGain.connect(this.masterGain);

    // SFX bus
    this.sfxGain = this.ctx.createGain();
    this.updateSfxVolume();
    this.sfxGain.connect(this.masterGain);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    Storage.updateSetting('musicEnabled', enabled);
    this.updateMusicVolume();
    if (enabled && !this.isPlayingMusic) {
      this.startMusic();
    } else if (!enabled && this.isPlayingMusic) {
      this.stopMusic();
    }
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
    Storage.updateSetting('sfxEnabled', enabled);
    this.updateSfxVolume();
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    Storage.updateSetting('musicVolume', this.musicVolume);
    this.updateMusicVolume();
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    Storage.updateSetting('sfxVolume', this.sfxVolume);
    this.updateSfxVolume();
  }

  updateMusicVolume() {
    if (!this.musicGain || !this.ctx) return;
    const effective = this.musicEnabled ? this.musicVolume * 0.45 : 0;
    this.musicGain.gain.setTargetAtTime(effective, this.ctx.currentTime, 0.05);
  }

  updateSfxVolume() {
    if (!this.sfxGain || !this.ctx) return;
    const effective = this.sfxEnabled ? this.sfxVolume * 0.7 : 0;
    this.sfxGain.gain.setTargetAtTime(effective, this.ctx.currentTime, 0.05);
  }

  // ==========================================
  // PROCEDURAL CYBERPUNK MUSIC GENERATOR
  // ==========================================

  startMusic(level = 1) {
    this.ensureContext();
    if (!this.ctx || !this.musicEnabled || this.isPlayingMusic) return;

    this.currentLevel = level;
    this.tempo = 120 + Math.min(level * 4, 30);
    this.isPlayingMusic = true;
    this.seqStep = 0;

    this.scheduleNextBeat();
  }

  setLevel(level) {
    this.currentLevel = level;
    this.tempo = 120 + Math.min(level * 4, 30);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.seqTimer) {
      clearTimeout(this.seqTimer);
      this.seqTimer = null;
    }
  }

  scheduleNextBeat() {
    if (!this.isPlayingMusic || !this.ctx) return;

    const stepDuration = 60 / this.tempo / 4; // 16th notes
    this.playSequencerStep(this.seqStep);

    this.seqStep = (this.seqStep + 1) % 16;
    this.seqTimer = setTimeout(() => {
      this.scheduleNextBeat();
    }, stepDuration * 1000);
  }

  playSequencerStep(step) {
    if (!this.musicEnabled || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Bassline notes: Cyberpunk D Minor scale (D1, F1, G1, A1, C2)
    // Frequencies: D1 = 36.7Hz, F1 = 43.65Hz, G1 = 49Hz, A1 = 55Hz, C2 = 65.4Hz
    const bassPatterns = [
      [36.7, 0, 36.7, 0, 43.65, 0, 36.7, 49.0, 36.7, 0, 55.0, 0, 43.65, 0, 65.4, 49.0], // L1-L2
      [36.7, 36.7, 0, 43.65, 36.7, 0, 49.0, 55.0, 36.7, 36.7, 0, 65.4, 55.0, 49.0, 43.65, 0] // L3+
    ];

    const currentPattern = this.currentLevel >= 3 ? bassPatterns[1] : bassPatterns[0];
    const bassFreq = currentPattern[step];

    if (bassFreq > 0) {
      this.synthBassNote(bassFreq, t, 0.16);
    }

    // Hi-hat groove (every offbeat 16th)
    if (step % 2 === 1) {
      this.synthCyberHiHat(t, step % 4 === 2 ? 0.04 : 0.02);
    }

    // Cyber Snare/Clap on beats 4 and 12
    if (step === 4 || step === 12) {
      this.synthCyberSnare(t);
    }

    // Arpeggiated lead line (cyber synth melody) on higher levels
    if (this.currentLevel >= 2 && step % 2 === 0) {
      const leadNotes = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33]; // D4, F4, G4, A4, C5, D5
      const noteIdx = (step * 3 + this.currentLevel) % leadNotes.length;
      this.synthLeadArp(leadNotes[noteIdx], t, 0.12);
    }
  }

  synthBassNote(freq, startTime, duration) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280 + this.currentLevel * 40, startTime);
    filter.frequency.exponentialRampToValueAtTime(70, startTime + duration);
    filter.Q.setValueAtTime(6.0, startTime);

    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  synthLeadArp(freq, startTime, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  synthCyberHiHat(startTime, duration) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  synthCyberSnare(startTime) {
    const duration = 0.12;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, startTime);
    filter.Q.setValueAtTime(1.5, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  // ==========================================
  // PROCEDURAL SOUND EFFECTS (SFX)
  // ==========================================

  playJump() {
    this.ensureContext();
    if (!this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.18);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);

    // Jet burst secondary noise
    this.playJetWhoosh(t, 0.15);
  }

  playJetWhoosh(t, duration) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  playCollect(type = 'orb') {
    this.ensureContext();
    if (!this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';

    let freqStart = 800;
    let freqEnd = 1600;
    let duration = 0.16;

    if (type === 'coin') {
      freqStart = 1046.5; // C6
      freqEnd = 2093.0; // C7
      duration = 0.2;
    } else if (type === 'power_core') {
      freqStart = 587.33; // D5
      freqEnd = 1760.0; // A6
      duration = 0.25;
    }

    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration * 0.7);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  playPowerUp(type = 'shield') {
    this.ensureContext();
    if (!this.sfxEnabled || !this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  playShieldBreak() {
    this.ensureContext();
    if (!this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  playCollision() {
    this.ensureContext();
    if (!this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;

    // Sub thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    oscGain.gain.setValueAtTime(0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);

    // Impact explosion noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.5);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.5);
  }

  playLevelUp() {
    this.ensureContext();
    if (!this.sfxEnabled || !this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  playFootstep() {
    if (!this.sfxEnabled || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastStepTime < 180) return; // Prevent overlapping spam
    this.lastStepTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.04);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  playHover() {
    this.ensureContext();
    if (!this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.03);
  }

  playClick() {
    this.ensureContext();
    if (!this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }
}

export const Audio = new AudioManager();

