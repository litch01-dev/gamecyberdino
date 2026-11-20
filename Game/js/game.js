/**
 * CYBERPUNK HAND RUNNER - Main Game Engine
 * Manages game loop, canvas rendering, parallax layers, level progression, and collision physics.
 */

import { Storage } from './storage.js';
import { Audio } from './audio.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { CollectibleManager } from './collectibles.js';
import { ParticleSystem } from './particles.js';
import { HandTrackerInstance } from './handTracking.js';

// Polyfill Canvas roundRect for older browser engines
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    const r = typeof radii === 'number' ? radii : 4;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

export const GAME_STATES = {
  MENU: 'MENU',
  CALIBRATION: 'CALIBRATION',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: 'NEON DISTRICT',
    speed: 280,
    targetDistance: 500,
    primaryColor: '#00E5FF',
    accentColor: '#287BFF',
    skyColor1: '#050714',
    skyColor2: '#0D1B2A'
  },
  {
    level: 2,
    name: 'CYBER STREET',
    speed: 340,
    targetDistance: 1200,
    primaryColor: '#287BFF',
    accentColor: '#9B5CFF',
    skyColor1: '#08081A',
    skyColor2: '#1A0B2E'
  },
  {
    level: 3,
    name: 'DIGITAL HIGHWAY',
    speed: 400,
    targetDistance: 2100,
    primaryColor: '#FF0055',
    accentColor: '#FFE600',
    skyColor1: '#140510',
    skyColor2: '#2A0D1B'
  },
  {
    level: 4,
    name: 'MACHINE ZONE',
    speed: 460,
    targetDistance: 3200,
    primaryColor: '#00FF66',
    accentColor: '#00E5FF',
    skyColor1: '#05140D',
    skyColor2: '#0D2A1C'
  },
  {
    level: 5,
    name: 'NEON CORE',
    speed: 530,
    targetDistance: 4500,
    primaryColor: '#9B5CFF',
    accentColor: '#00E5FF',
    skyColor1: '#0B0514',
    skyColor2: '#200D33'
  }
];

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Logical internal resolution (16:9 standard)
    this.width = 960;
    this.height = 540;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Ground plane
    this.groundY = 440;

    // Subsystems
    this.player = new Player(this.groundY);
    this.obstacles = new ObstacleManager(this.groundY);
    this.collectibles = new CollectibleManager(this.groundY);
    this.particles = new ParticleSystem();

    // State Machine
    this.state = GAME_STATES.MENU;
    this.lastTime = 0;
    this.animationFrameId = null;

    // Run Stats
    this.distance = 0;
    this.score = 0;
    this.highScore = Storage.getHighScore();
    this.obstacleAvoidedCount = 0;
    this.collectiblesCount = 0;
    this.currentLevelIndex = 0;
    this.gameSpeed = LEVEL_CONFIGS[0].speed;

    // Level banner animation
    this.levelBannerText = '';
    this.levelBannerTimer = 0;

    // Parallax background offsets
    this.bgOffsets = [0, 0, 0, 0];

    // Connect Hand Tracking jump trigger
    HandTrackerInstance.onJumpCallback = () => {
      if (this.state === GAME_STATES.PLAYING) {
        this.player.jump(this.particles);
      }
    };

    // Keyboard fallback for accessibility and convenience
    this.initKeyboardControls();
  }

  initKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (this.state === GAME_STATES.PLAYING) {
          e.preventDefault();
          this.player.jump(this.particles);
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === GAME_STATES.PLAYING) {
          this.pause();
        } else if (this.state === GAME_STATES.PAUSED) {
          this.resume();
        }
      }
    });
  }

  getCurrentLevelConfig() {
    if (this.currentLevelIndex < LEVEL_CONFIGS.length) {
      return LEVEL_CONFIGS[this.currentLevelIndex];
    }
    // Endless progressive formula after Level 5
    const excess = this.currentLevelIndex - LEVEL_CONFIGS.length + 1;
    return {
      level: this.currentLevelIndex + 1,
      name: `OVERDRIVE MK-${excess}`,
      speed: 530 + excess * 30,
      targetDistance: 4500 + excess * 1500,
      primaryColor: '#00E5FF',
      accentColor: '#FF0055',
      skyColor1: '#0B0514',
      skyColor2: '#200D33'
    };
  }

  startNewGame() {
    this.state = GAME_STATES.PLAYING;
    this.distance = 0;
    this.score = 0;
    this.obstacleAvoidedCount = 0;
    this.collectiblesCount = 0;
    this.currentLevelIndex = 0;

    const lvl = this.getCurrentLevelConfig();
    this.gameSpeed = lvl.speed;

    this.player.reset(this.groundY);
    this.obstacles.reset(this.groundY);
    this.collectibles.reset(this.groundY);
    this.particles.reset();

    this.highScore = Storage.getHighScore();
    this.showLevelBanner(lvl.name);

    Audio.setLevel(lvl.level);
    Audio.startMusic(lvl.level);

    this.lastTime = performance.now();
    if (!this.animationFrameId) {
      this.loop(this.lastTime);
    }
  }

  pause() {
    if (this.state !== GAME_STATES.PLAYING) return;
    this.state = GAME_STATES.PAUSED;
    Audio.stopMusic();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  resume() {
    if (this.state !== GAME_STATES.PAUSED) return;
    this.state = GAME_STATES.PLAYING;
    this.lastTime = performance.now();
    const lvl = this.getCurrentLevelConfig();
    Audio.startMusic(lvl.level);
    if (this.onStateChange) this.onStateChange(this.state);
  }

  gameOver() {
    this.state = GAME_STATES.GAME_OVER;
    Audio.stopMusic();
    Audio.playCollision();

    this.particles.emitCollision(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);

    const isNewHigh = Storage.saveHighScore(Math.floor(this.score));
    if (isNewHigh) {
      this.highScore = Math.floor(this.score);
    }

    Storage.recordGame({
      distance: this.distance,
      collectibles: this.collectiblesCount,
      level: this.getCurrentLevelConfig().level
    });

    if (this.onStateChange) {
      this.onStateChange(this.state, {
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        highScore: this.highScore,
        isNewHigh: isNewHigh,
        level: this.getCurrentLevelConfig().level,
        collectibles: this.collectiblesCount
      });
    }
  }

  showLevelBanner(text) {
    this.levelBannerText = text;
    this.levelBannerTimer = 2.5; // seconds
  }

  checkLevelProgress() {
    const currentConfig = this.getCurrentLevelConfig();
    if (this.distance >= currentConfig.targetDistance) {
      this.currentLevelIndex++;
      const nextConfig = this.getCurrentLevelConfig();
      this.gameSpeed = nextConfig.speed;

      Audio.playLevelUp();
      Audio.setLevel(nextConfig.level);
      this.showLevelBanner(`LEVEL UP! ${nextConfig.name}`);
      this.collectibles.addScorePopup('LEVEL UP!', this.width / 2, 180, nextConfig.primaryColor);
    }
  }

  // ==========================================
  // MAIN GAME LOOP
  // ==========================================

  loop(currentTime) {
    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));

    // Calculate capped delta time
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    if (dt > 0.1) dt = 0.1; // Cap to 100ms to prevent collision tunnel glitches

    // Process Hand Landmarker
    HandTrackerInstance.processFrame();

    // Update & Render
    if (this.state === GAME_STATES.PLAYING) {
      this.update(dt);
    }

    this.render();
  }

  update(dt) {
    const lvl = this.getCurrentLevelConfig();

    // Update Distance & Base Score
    const distGain = this.gameSpeed * dt * 0.08;
    this.distance += distGain;
    const scoreMultiplier = this.player.hasDoubleScore ? 2 : 1;
    this.score += distGain * 2 * scoreMultiplier;

    // Check Level Progression
    this.checkLevelProgress();

    // Update Parallax Backgrounds
    this.bgOffsets[0] = (this.bgOffsets[0] + this.gameSpeed * 0.05 * dt) % this.width;
    this.bgOffsets[1] = (this.bgOffsets[1] + this.gameSpeed * 0.15 * dt) % this.width;
    this.bgOffsets[2] = (this.bgOffsets[2] + this.gameSpeed * 0.35 * dt) % this.width;
    this.bgOffsets[3] = (this.bgOffsets[3] + this.gameSpeed * 1.0 * dt) % 80; // track grid

    // Update Subsystems
    this.player.update(dt, this.particles, this.gameSpeed);

    // Update Obstacles & Avoidance
    this.obstacles.update(dt, this.gameSpeed, lvl.level, (avoidedObs) => {
      const avoidBonus = 100 * scoreMultiplier;
      this.score += avoidBonus;
      this.obstacleAvoidedCount++;
      this.collectibles.addScorePopup(`+${avoidBonus}`, avoidedObs.x, avoidedObs.y - 10, '#00FF66');
    });

    // Update Collectibles
    this.collectibles.update(dt, this.gameSpeed, lvl.level, this.player, this.particles, (item) => {
      this.collectiblesCount++;
      const itemScore = (this.player.hasDoubleScore ? item.score * 2 : item.score);
      this.score += itemScore;
    });

    // Update Particles
    this.particles.update(dt, this.width, this.height, this.gameSpeed);

    // Check Obstacle Collisions
    this.checkCollisions();

    // Level Banner Timer
    if (this.levelBannerTimer > 0) {
      this.levelBannerTimer -= dt;
    }
  }

  checkCollisions() {
    const pBounds = this.player.getBounds();

    for (let i = 0; i < this.obstacles.obstacles.length; i++) {
      const obs = this.obstacles.obstacles[i];
      const oBounds = obs.getBounds();

      // Standard AABB collision
      if (
        pBounds.x < oBounds.x + oBounds.width &&
        pBounds.x + pBounds.width > oBounds.x &&
        pBounds.y < oBounds.y + oBounds.height &&
        pBounds.y + pBounds.height > oBounds.y
      ) {
        if (this.player.hasShield) {
          // Shield absorbs the collision
          this.player.hasShield = false;
          this.player.shieldTimer = 0;
          Audio.playShieldBreak();
          this.particles.emitShieldBreak(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
          this.collectibles.addScorePopup('SHIELD BROKEN!', this.player.x, this.player.y - 20, '#FF0055');
          // Remove the collided obstacle
          this.obstacles.obstacles.splice(i, 1);
          return;
        } else {
          // Game Over collision
          this.gameOver();
          return;
        }
      }
    }
  }

  // ==========================================
  // RENDERING ENGINE
  // ==========================================

  render() {
    const { ctx, width, height } = this;
    const lvl = this.getCurrentLevelConfig();

    ctx.save();

    // Apply Screen Shake
    if (this.particles.shakeOffsetX !== 0 || this.particles.shakeOffsetY !== 0) {
      ctx.translate(this.particles.shakeOffsetX, this.particles.shakeOffsetY);
    }

    // 1. Cyber Sky Gradient & Stars
    this.renderSky(ctx, lvl);

    // 2. Distant Megacity Skyscrapers (Parallax Layer 1)
    this.renderDistantCity(ctx, lvl);

    // 3. Midground Futuristic Towers & Flyways (Parallax Layer 2)
    this.renderMidgroundCity(ctx, lvl);

    // 4. Foreground Cyber Grid Speedway Track
    this.renderTrack(ctx, lvl);

    // 5. Obstacles
    this.obstacles.draw(ctx);

    // 6. Collectibles & Popups
    this.collectibles.draw(ctx);

    // 7. Player Character
    this.player.draw(ctx);

    // 8. Particles, Speed lines & Glow FX
    this.particles.draw(ctx);

    // 9. In-game HUD
    if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
      this.renderHUD(ctx, lvl);
    }

    // 10. Level Transition Banner
    if (this.levelBannerTimer > 0) {
      this.renderLevelBanner(ctx, lvl);
    }

    ctx.restore();
  }

  renderSky(ctx, lvl) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, lvl.skyColor1);
    grad.addColorStop(1, lvl.skyColor2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Distant Cyber Moon / Hologram Sphere
    ctx.save();
    ctx.fillStyle = 'rgba(0, 229, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(this.width * 0.78, 120, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.width * 0.78, 120, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Digital horizon scanlines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let y = 40; y < this.groundY; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderDistantCity(ctx, lvl) {
    ctx.save();
    const offsetX = this.bgOffsets[0];
    const cityBaseY = this.groundY - 14;

    ctx.fillStyle = '#0B0F1C';
    ctx.strokeStyle = 'rgba(40, 123, 255, 0.12)';
    ctx.lineWidth = 1;

    // Draw repeating silhouettes
    for (let loop = -1; loop <= 1; loop++) {
      const baseX = loop * this.width - offsetX;

      const buildings = [
        { x: 30, w: 70, h: 220 },
        { x: 120, w: 55, h: 280 },
        { x: 200, w: 85, h: 190 },
        { x: 310, w: 60, h: 310 },
        { x: 390, w: 90, h: 240 },
        { x: 500, w: 75, h: 290 },
        { x: 600, w: 110, h: 200 },
        { x: 730, w: 65, h: 330 },
        { x: 820, w: 80, h: 250 },
        { x: 920, w: 70, h: 270 }
      ];

      for (const b of buildings) {
        const bx = baseX + b.x;
        const by = cityBaseY - b.h;
        ctx.fillRect(bx, by, b.w, b.h);
        ctx.strokeRect(bx, by, b.w, b.h);

        // Antenna with red blinking light
        ctx.beginPath();
        ctx.moveTo(bx + b.w / 2, by);
        ctx.lineTo(bx + b.w / 2, by - 24);
        ctx.stroke();

        ctx.fillStyle = '#FF0055';
        ctx.fillRect(bx + b.w / 2 - 1.5, by - 26, 3, 3);
        ctx.fillStyle = '#0B0F1C';
      }
    }

    ctx.restore();
  }

  renderMidgroundCity(ctx, lvl) {
    ctx.save();
    const offsetX = this.bgOffsets[1];
    const cityBaseY = this.groundY;

    ctx.fillStyle = '#10172A';
    ctx.strokeStyle = lvl.accentColor;
    ctx.lineWidth = 1;

    for (let loop = -1; loop <= 1; loop++) {
      const baseX = loop * this.width - offsetX;

      const towers = [
        { x: 10, w: 95, h: 160 },
        { x: 130, w: 80, h: 210 },
        { x: 240, w: 105, h: 140 },
        { x: 370, w: 90, h: 190 },
        { x: 490, w: 120, h: 150 },
        { x: 640, w: 85, h: 220 },
        { x: 755, w: 110, h: 175 },
        { x: 890, w: 90, h: 195 }
      ];

      for (const t of towers) {
        const tx = baseX + t.x;
        const ty = cityBaseY - t.h;
        ctx.fillRect(tx, ty, t.w, t.h);

        // Neon windows pattern
        ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
        for (let wy = ty + 15; wy < cityBaseY - 10; wy += 22) {
          for (let wx = tx + 12; wx < tx + t.w - 15; wx += 16) {
            if ((wx + wy) % 5 !== 0) {
              ctx.fillRect(wx, wy, 8, 12);
            }
          }
        }
        ctx.fillStyle = '#10172A';
      }
    }

    ctx.restore();
  }

  renderTrack(ctx, lvl) {
    const { ctx: c, groundY: gy, width: w, height: h } = this;
    c.save();

    // Road surface gradient
    const roadGrad = c.createLinearGradient(0, gy, 0, h);
    roadGrad.addColorStop(0, '#0E1324');
    roadGrad.addColorStop(1, '#05070E');
    c.fillStyle = roadGrad;
    c.fillRect(0, gy, w, h - gy);

    // Glowing Neon Edge Rail
    c.strokeStyle = lvl.primaryColor;
    c.lineWidth = 3;
    c.shadowBlur = 10;
    c.shadowColor = lvl.primaryColor;
    c.beginPath();
    c.moveTo(0, gy);
    c.lineTo(w, gy);
    c.stroke();

    // Sub-edge neon stripe
    c.strokeStyle = lvl.accentColor;
    c.lineWidth = 1.5;
    c.shadowColor = lvl.accentColor;
    c.beginPath();
    c.moveTo(0, gy + 6);
    c.lineTo(w, gy + 6);
    c.stroke();

    // Animated Perspective Grid Lines
    const gridShift = this.bgOffsets[3];
    c.strokeStyle = 'rgba(0, 229, 255, 0.18)';
    c.lineWidth = 1.5;
    c.shadowBlur = 0;

    // Vertical / diagonal rushing grid markings
    for (let x = -80; x < w + 80; x += 60) {
      const lineX = x - gridShift;
      c.beginPath();
      c.moveTo(lineX, gy);
      c.lineTo(lineX - 45, h);
      c.stroke();
    }

    // Horizontal speed lines on road
    for (let y = gy + 20; y < h; y += 22) {
      c.strokeStyle = `rgba(0, 229, 255, ${0.08 + (y - gy) * 0.0015})`;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }

    c.restore();
  }

  renderHUD(ctx, lvl) {
    ctx.save();

    // Top HUD Glass Panel Container
    ctx.fillStyle = 'rgba(8, 11, 22, 0.75)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 16);
    ctx.lineTo(this.width - 20, 16);
    ctx.lineTo(this.width - 20, 68);
    ctx.lineTo(20, 68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 1. SCORE DISPLAY
    ctx.fillStyle = '#8B98B7';
    ctx.font = '10px Orbitron, sans-serif';
    ctx.fillText('SCORE', 36, 32);

    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00E5FF';
    ctx.fillText(`${Math.floor(this.score).toString().padStart(6, '0')}`, 36, 56);
    ctx.shadowBlur = 0;

    // 2. HIGH SCORE
    ctx.fillStyle = '#8B98B7';
    ctx.font = '10px Orbitron, sans-serif';
    ctx.fillText('HIGH SCORE', 185, 32);

    ctx.fillStyle = '#F4F7FF';
    ctx.font = 'bold 18px Orbitron, sans-serif';
    ctx.fillText(`${Math.max(this.highScore, Math.floor(this.score)).toString().padStart(6, '0')}`, 185, 55);

    // 3. DISTANCE
    ctx.fillStyle = '#8B98B7';
    ctx.font = '10px Orbitron, sans-serif';
    ctx.fillText('DISTANCE', 340, 32);

    ctx.fillStyle = '#9B5CFF';
    ctx.font = 'bold 18px Orbitron, sans-serif';
    ctx.fillText(`${Math.floor(this.distance)}m`, 340, 55);

    // 4. LEVEL PROGRESS BAR
    ctx.fillStyle = '#8B98B7';
    ctx.font = '10px Orbitron, sans-serif';
    ctx.fillText(`LVL ${lvl.level} - ${lvl.name}`, 480, 32);

    // Progress bar frame
    const barW = 210;
    const barH = 10;
    const barX = 480;
    const barY = 42;

    ctx.fillStyle = '#10172A';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(barX, barY, barW, barH);

    // Fill progress
    const prevDistance = this.currentLevelIndex === 0 ? 0 : LEVEL_CONFIGS[this.currentLevelIndex - 1].targetDistance;
    const levelRange = lvl.targetDistance - prevDistance;
    const progress = Math.min(1, Math.max(0, (this.distance - prevDistance) / levelRange));

    const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    fillGrad.addColorStop(0, lvl.primaryColor);
    fillGrad.addColorStop(1, lvl.accentColor);
    ctx.fillStyle = fillGrad;
    ctx.shadowBlur = 6;
    ctx.shadowColor = lvl.primaryColor;
    ctx.fillRect(barX + 1, barY + 1, Math.max(0, (barW - 2) * progress), barH - 2);
    ctx.shadowBlur = 0;

    // 5. SPEED DISPLAY
    ctx.fillStyle = '#8B98B7';
    ctx.font = '10px Orbitron, sans-serif';
    ctx.fillText('SPEED', 730, 32);

    ctx.fillStyle = '#FFE600';
    ctx.font = 'bold 18px Orbitron, sans-serif';
    ctx.fillText(`${Math.floor(this.gameSpeed)} KM/H`, 730, 55);

    // 6. POWER-UP BADGES (Top left below main HUD)
    this.renderActivePowerUps(ctx, 36, 85);

    // 7. HAND TRACKING STATUS PILL (In top right corner)
    this.renderHandTrackingPill(ctx, this.width - 190, 85);

    ctx.restore();
  }

  renderActivePowerUps(ctx, startX, startY) {
    let offset = 0;
    const drawBadge = (label, color, timeLeft) => {
      ctx.fillStyle = 'rgba(8, 11, 22, 0.8)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(startX + offset, startY, 115, 26, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 10px Orbitron, sans-serif';
      ctx.fillText(`${label}: ${Math.ceil(timeLeft)}s`, startX + offset + 8, startY + 17);
      offset += 125;
    };

    if (this.player.hasShield && this.player.shieldTimer > 0) {
      drawBadge('SHIELD', '#00E5FF', this.player.shieldTimer);
    }
    if (this.player.hasMagnet && this.player.magnetTimer > 0) {
      drawBadge('MAGNET', '#287BFF', this.player.magnetTimer);
    }
    if (this.player.hasDoubleScore && this.player.scoreBoostTimer > 0) {
      drawBadge('2X BOOST', '#9B5CFF', this.player.scoreBoostTimer);
    }
  }

  renderHandTrackingPill(ctx, x, y) {
    const isDetected = HandTrackerInstance.handDetected;
    const isJump = HandTrackerInstance.isJumpTriggered;

    ctx.fillStyle = 'rgba(8, 11, 22, 0.85)';
    ctx.strokeStyle = isJump ? '#00FF66' : isDetected ? '#00E5FF' : '#FF0055';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, 170, 26, 4);
    ctx.fill();
    ctx.stroke();

    // Status beacon
    ctx.fillStyle = isJump ? '#00FF66' : isDetected ? '#00E5FF' : '#FF0055';
    ctx.shadowBlur = 6;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(x + 14, y + 13, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#F4F7FF';
    ctx.font = 'bold 9px Orbitron, sans-serif';
    const text = isJump ? 'GESTURE: JUMP!' : isDetected ? 'HAND: READY' : 'NO HAND DETECTED';
    ctx.fillText(text, x + 26, y + 17);
  }

  renderLevelBanner(ctx, lvl) {
    ctx.save();
    const progress = this.levelBannerTimer / 2.5;
    const alpha = Math.sin(progress * Math.PI); // Fade in & out

    ctx.globalAlpha = Math.min(1, alpha * 1.2);
    ctx.fillStyle = 'rgba(8, 11, 22, 0.85)';
    ctx.strokeStyle = lvl.primaryColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 18;
    ctx.shadowColor = lvl.primaryColor;

    const bannerW = 480;
    const bannerH = 75;
    const bannerX = (this.width - bannerW) / 2;
    const bannerY = 190;

    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.levelBannerText, this.width / 2, bannerY + 45);

    ctx.restore();
  }
}
