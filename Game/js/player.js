/**
 * CYBERPUNK HAND RUNNER - Robot Player Character
 * Procedural vector-rendered futuristic cyborg runner with physics, animations, and power-up auras.
 */

import { Audio } from './audio.js';

export class Player {
  constructor(groundY) {
    this.groundY = groundY;
    this.width = 46;
    this.height = 68;

    // Position & Physics
    this.x = 120;
    this.y = this.groundY - this.height;
    this.vy = 0;
    this.gravity = 1750; // px/sec^2
    this.jumpForce = -720; // px/sec
    this.isGrounded = true;

    // Animation States
    this.state = 'RUNNING'; // 'IDLE', 'RUNNING', 'JUMPING', 'LANDING', 'HIT'
    this.animTimer = 0;
    this.landingTimer = 0;
    this.crouchAmount = 0;

    // Power-ups
    this.hasShield = false;
    this.hasMagnet = false;
    this.hasDoubleScore = false;
    this.shieldTimer = 0;
    this.magnetTimer = 0;
    this.scoreBoostTimer = 0;

    // Colors
    this.primaryColor = '#10172A';
    this.armorColor = '#1E293B';
    this.neonCyan = '#00E5FF';
    this.neonPurple = '#9B5CFF';
    this.visorColor = '#00FFFF';

    // Hitbox insets for forgiving collision
    this.hitboxInset = {
      x: 8,
      y: 6,
      w: 16,
      h: 8
    };
  }

  reset(groundY) {
    this.groundY = groundY;
    this.y = this.groundY - this.height;
    this.vy = 0;
    this.isGrounded = true;
    this.state = 'RUNNING';
    this.animTimer = 0;
    this.landingTimer = 0;
    this.crouchAmount = 0;

    this.hasShield = false;
    this.hasMagnet = false;
    this.hasDoubleScore = false;
    this.shieldTimer = 0;
    this.magnetTimer = 0;
    this.scoreBoostTimer = 0;
  }

  jump(particleSystem) {
    if (!this.isGrounded && this.state !== 'RUNNING') return false;

    this.vy = this.jumpForce;
    this.isGrounded = false;
    this.state = 'JUMPING';

    Audio.playJump();

    if (particleSystem) {
      particleSystem.emitJump(this.x + this.width / 2, this.groundY);
    }
    return true;
  }

  update(dt, particleSystem, gameSpeed = 300) {
    this.animTimer += dt * (gameSpeed / 120);

    // Update power-up timers
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) this.hasShield = false;
    }
    if (this.magnetTimer > 0) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) this.hasMagnet = false;
    }
    if (this.scoreBoostTimer > 0) {
      this.scoreBoostTimer -= dt;
      if (this.scoreBoostTimer <= 0) this.hasDoubleScore = false;
    }

    // Physics
    if (!this.isGrounded) {
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;

      // Thruster trail in air
      if (particleSystem && Math.random() < 0.8) {
        particleSystem.emitThruster(this.x + 8, this.y + this.height - 12, true);
      }

      // Check ground collision
      if (this.y >= this.groundY - this.height) {
        this.y = this.groundY - this.height;
        this.vy = 0;
        this.isGrounded = true;
        this.state = 'LANDING';
        this.landingTimer = 0.14; // squash duration

        if (particleSystem) {
          particleSystem.emitLanding(this.x + this.width / 2, this.groundY);
        }
      }
    } else {
      // Grounded behavior
      if (this.state === 'LANDING') {
        this.landingTimer -= dt;
        this.crouchAmount = Math.sin((this.landingTimer / 0.14) * Math.PI) * 7;
        if (this.landingTimer <= 0) {
          this.state = 'RUNNING';
          this.crouchAmount = 0;
        }
      } else {
        this.state = 'RUNNING';
        this.crouchAmount = 0;

        // Running footstep sound and small thruster embers
        const stepCycle = Math.sin(this.animTimer * 6);
        if (stepCycle < -0.92) {
          Audio.playFootstep();
        }

        if (particleSystem && Math.random() < 0.35) {
          particleSystem.emitThruster(this.x + 6, this.groundY - 6, false);
        }
      }
    }
  }

  /**
   * Returns player's tight AABB bounding box
   */
  getBounds() {
    return {
      x: this.x + this.hitboxInset.x,
      y: this.y + this.hitboxInset.y + this.crouchAmount,
      width: this.width - this.hitboxInset.w,
      height: this.height - this.hitboxInset.h - this.crouchAmount
    };
  }

  draw(ctx) {
    ctx.save();

    const cx = this.x;
    const cy = this.y + this.crouchAmount;
    const w = this.width;
    const h = this.height;

    // Power-up auras
    if (this.hasShield) {
      this.drawShieldBubble(ctx, cx + w / 2, cy + h / 2);
    }
    if (this.hasMagnet) {
      this.drawMagnetAura(ctx, cx + w / 2, cy + h / 2);
    }
    if (this.hasDoubleScore) {
      this.drawScoreBoostAura(ctx, cx + w / 2, cy + h / 2);
    }

    // Shadow on the ground
    if (this.isGrounded) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(cx + w / 2, this.groundY, w * 0.45, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const heightAboveGround = this.groundY - (this.y + this.height);
      const shadowScale = Math.max(0.15, 1 - (heightAboveGround / 350));
      ctx.fillStyle = `rgba(0, 229, 255, ${0.2 * shadowScale})`;
      ctx.beginPath();
      ctx.ellipse(cx + w / 2, this.groundY, (w * 0.45) * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Running / Jumping Limb Angles
    let legAngle1 = 0;
    let legAngle2 = 0;
    let armAngle1 = 0;
    let armAngle2 = 0;
    let torsoTilt = 0.12; // forward lean

    if (this.state === 'RUNNING') {
      const cycle = this.animTimer * 5;
      legAngle1 = Math.sin(cycle) * 0.75;
      legAngle2 = Math.sin(cycle + Math.PI) * 0.75;
      armAngle1 = Math.sin(cycle + Math.PI) * 0.65;
      armAngle2 = Math.sin(cycle) * 0.65;
      torsoTilt = 0.15 + Math.sin(cycle * 2) * 0.04;
    } else if (this.state === 'JUMPING') {
      legAngle1 = -0.55;
      legAngle2 = 0.35;
      armAngle1 = -0.6;
      armAngle2 = 0.4;
      torsoTilt = 0.22;
    } else if (this.state === 'IDLE') {
      const breathe = Math.sin(this.animTimer * 2) * 0.03;
      torsoTilt = breathe;
      legAngle1 = 0.05;
      legAngle2 = -0.05;
    }

    // 1. BACK ARM
    this.drawArm(ctx, cx + 18, cy + 24, armAngle2, true);

    // 2. BACK LEG
    this.drawLeg(ctx, cx + 18, cy + 42, legAngle2, true);

    // 3. BACK JETPACK / POWER CONDUIT
    ctx.save();
    ctx.translate(cx + 8, cy + 22);
    ctx.rotate(torsoTilt);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-6, 0, 8, 20);
    // Glowing power core in backpack
    ctx.fillStyle = this.neonCyan;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.neonCyan;
    ctx.fillRect(-4, 4, 4, 12);
    ctx.restore();

    // 4. MAIN TORSO & CYBERNETIC CHASSIS
    ctx.save();
    ctx.translate(cx + 20, cy + 22);
    ctx.rotate(torsoTilt);

    // Armor plate
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(14, -2);
    ctx.lineTo(10, 22);
    ctx.lineTo(-8, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Neon chest chevron / reactor
    ctx.strokeStyle = this.neonCyan;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.neonCyan;
    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(2, 12);
    ctx.lineTo(8, 4);
    ctx.stroke();

    // Secondary purple neon strip
    ctx.strokeStyle = this.neonPurple;
    ctx.shadowColor = this.neonPurple;
    ctx.beginPath();
    ctx.moveTo(-5, 16);
    ctx.lineTo(7, 16);
    ctx.stroke();

    ctx.restore();

    // 5. CYBERNETIC HEAD & VISOR
    ctx.save();
    const headX = cx + 22 + (torsoTilt * 12);
    const headY = cy + 10;
    ctx.translate(headX, headY);

    // Helmet chassis
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(10, -10);
    ctx.lineTo(14, 2);
    ctx.lineTo(8, 8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ocular Visor (Glowing Neon Cyan with scanline)
    ctx.fillStyle = this.visorColor;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.neonCyan;
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(14, -6);
    ctx.lineTo(11, 2);
    ctx.lineTo(2, 2);
    ctx.closePath();
    ctx.fill();

    // Visor HUD line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, -2);
    ctx.lineTo(11, -2);
    ctx.stroke();

    // Antenna / Sensor on helmet
    ctx.strokeStyle = this.neonCyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.lineTo(-8, -17);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-9, -18, 2, 2);

    ctx.restore();

    // 6. FRONT LEG
    this.drawLeg(ctx, cx + 24, cy + 42, legAngle1, false);

    // 7. FRONT ARM
    this.drawArm(ctx, cx + 22, cy + 24, armAngle1, false);

    ctx.restore();
  }

  drawLeg(ctx, hipX, hipY, angle, isBack) {
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(angle);

    const mainColor = isBack ? '#0B132B' : '#1E293B';
    const accentColor = isBack ? '#1C315E' : this.neonCyan;

    // Upper thigh
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(4, 14);
    ctx.stroke();

    // Knee joint
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(4, 14, 3, 0, Math.PI * 2);
    ctx.fill();

    // Shin / Lower leg
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(4, 14);
    ctx.lineTo(2, 26);
    ctx.stroke();

    // Cyber boot with heel thruster
    ctx.fillStyle = isBack ? '#1E293B' : '#334155';
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(10, 26);
    ctx.lineTo(8, 29);
    ctx.lineTo(-2, 29);
    ctx.closePath();
    ctx.fill();

    // Neon stripe on boot
    ctx.strokeStyle = this.neonCyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2, 27);
    ctx.lineTo(7, 27);
    ctx.stroke();

    ctx.restore();
  }

  drawArm(ctx, shoulderX, shoulderY, angle, isBack) {
    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(angle);

    const mainColor = isBack ? '#0B132B' : '#334155';
    const accentColor = isBack ? '#1C315E' : this.neonCyan;

    // Shoulder pauldron
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bicep
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(4, 11);
    ctx.stroke();

    // Forearm
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(4, 11);
    ctx.lineTo(10, 18);
    ctx.stroke();

    // Hand / blaster fist
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(10, 18, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawShieldBubble(ctx, cx, cy) {
    const pulse = 1 + Math.sin(this.animTimer * 8) * 0.05;
    const radius = (this.height * 0.65) * pulse;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#00E5FF';

    // Outer glow circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Hexagonal cyber shield pattern
    ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
    ctx.fill();

    // Rotating shield segments
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.animTimer * 2);
    ctx.strokeStyle = 'rgba(244, 247, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x1 = Math.cos(a) * (radius - 4);
      const y1 = Math.sin(a) * (radius - 4);
      const x2 = Math.cos(a + Math.PI / 3) * (radius - 4);
      const y2 = Math.sin(a + Math.PI / 3) * (radius - 4);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  drawMagnetAura(ctx, cx, cy) {
    const pulse = (this.animTimer * 3) % 1;
    const r = 25 + pulse * 28;
    ctx.save();
    ctx.strokeStyle = `rgba(40, 123, 255, ${0.8 * (1 - pulse)})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#287BFF';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawScoreBoostAura(ctx, cx, cy) {
    const pulse = (this.animTimer * 4) % 1;
    ctx.save();
    ctx.strokeStyle = `rgba(155, 92, 255, ${0.7 * (1 - pulse)})`;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#9B5CFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 30 + pulse * 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

