/**
 * CYBERPUNK HAND RUNNER - Particle System
 * Manages all neon particles, visual FX, thruster trails, explosions, and screen shake.
 */

export class Particle {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.vx = options.vx || (Math.random() - 0.5) * 200;
    this.vy = options.vy || (Math.random() - 0.5) * 200;
    this.size = options.size || 4;
    this.endSize = options.endSize !== undefined ? options.endSize : 0;
    this.color = options.color || '#00E5FF';
    this.alpha = options.alpha !== undefined ? options.alpha : 1.0;
    this.life = options.life || 0.6; // in seconds
    this.maxLife = this.life;
    this.decay = 1.0;
    this.type = options.type || 'spark'; // 'spark', 'ring', 'trail', 'line', 'smoke'
    this.radius = options.radius || 10;
    this.gravity = options.gravity !== undefined ? options.gravity : 0;
    this.glow = options.glow !== undefined ? options.glow : true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;

    const progress = 1 - (this.life / this.maxLife);
    this.currentSize = this.size + (this.endSize - this.size) * progress;

    if (this.type === 'ring') {
      this.radius += (this.vx * dt);
    }

    return true;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.alpha * (this.life / this.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.glow) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
    }

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    if (this.type === 'ring') {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1, this.radius), 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === 'line') {
      ctx.lineWidth = Math.max(1, this.currentSize);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 0.08, this.y - this.vy * 0.08);
      ctx.stroke();
    } else {
      // Spark / circle
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, this.currentSize), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.speedLines = [];
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  reset() {
    this.particles = [];
    this.speedLines = [];
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /**
   * Trigger screen shake
   * @param {number} duration in seconds
   * @param {number} intensity in pixels
   */
  shake(duration = 0.3, intensity = 8) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  // ==========================================
  // EMITTERS FOR GAMEPLAY EVENTS
  // ==========================================

  /**
   * Thruster fire from robot jetpack/boots
   */
  emitThruster(x, y, isJumping = false) {
    const count = isJumping ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const colors = ['#00E5FF', '#287BFF', '#9B5CFF'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 4,
        vx: -(120 + Math.random() * 80),
        vy: isJumping ? (60 + Math.random() * 80) : ((Math.random() - 0.5) * 30),
        size: isJumping ? 4.5 : 3,
        endSize: 0.5,
        color: color,
        life: 0.25 + Math.random() * 0.2,
        glow: true
      }));
    }
  }

  /**
   * Jump liftoff ring and sparks
   */
  emitJump(x, y) {
    // Shockwave ring
    this.particles.push(new Particle({
      x: x,
      y: y,
      type: 'ring',
      radius: 6,
      vx: 140, // expansion speed
      vy: 0,
      color: '#00E5FF',
      life: 0.35,
      glow: true
    }));

    // Downward sparks
    for (let i = 0; i < 12; i++) {
      const angle = (Math.random() * Math.PI) + Math.PI; // downwards
      const speed = 80 + Math.random() * 140;
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed * 0.6,
        size: 3.5,
        endSize: 0.5,
        color: '#00E5FF',
        life: 0.3 + Math.random() * 0.2,
        gravity: 200,
        glow: true
      }));
    }
  }

  /**
   * Landing ground impact shock
   */
  emitLanding(x, y) {
    for (let i = 0; i < 14; i++) {
      const dir = (i % 2 === 0 ? 1 : -1);
      const speed = 70 + Math.random() * 120;
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 2,
        vx: dir * speed,
        vy: -(20 + Math.random() * 50),
        size: 3,
        endSize: 0.5,
        color: i % 3 === 0 ? '#00E5FF' : '#9B5CFF',
        life: 0.25 + Math.random() * 0.2,
        gravity: 300,
        glow: true
      }));
    }
  }

  /**
   * Collectible pickup burst
   */
  emitCollect(x, y, color = '#00E5FF', count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 90 + Math.random() * 140;
      this.particles.push(new Particle({
        x: x,
        y: y,
        type: i % 2 === 0 ? 'line' : 'spark',
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4,
        endSize: 1,
        color: color,
        life: 0.4 + Math.random() * 0.25,
        gravity: 60,
        glow: true
      }));
    }

    // Sparkle ring
    this.particles.push(new Particle({
      x: x,
      y: y,
      type: 'ring',
      radius: 4,
      vx: 180,
      vy: 0,
      color: color,
      life: 0.3,
      glow: true
    }));
  }

  /**
   * Collision explosion with neon tech fragments
   */
  emitCollision(x, y) {
    this.shake(0.45, 14);

    const colors = ['#FF0055', '#00E5FF', '#FFE600', '#F4F7FF'];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 260;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        type: Math.random() > 0.4 ? 'line' : 'spark',
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: 4 + Math.random() * 4,
        endSize: 0.5,
        color: color,
        life: 0.5 + Math.random() * 0.4,
        gravity: 350,
        glow: true
      }));
    }

    // Double shockwaves
    this.particles.push(new Particle({
      x: x,
      y: y,
      type: 'ring',
      radius: 8,
      vx: 240,
      vy: 0,
      color: '#FF0055',
      life: 0.4,
      glow: true
    }));
    this.particles.push(new Particle({
      x: x,
      y: y,
      type: 'ring',
      radius: 4,
      vx: 160,
      vy: 0,
      color: '#00E5FF',
      life: 0.3,
      glow: true
    }));
  }

  /**
   * Shield crack effect when absorbing damage
   */
  emitShieldBreak(x, y) {
    this.shake(0.25, 7);
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28;
      const speed = 120 + Math.random() * 100;
      this.particles.push(new Particle({
        x: x,
        y: y,
        type: 'line',
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        endSize: 0.5,
        color: '#00E5FF',
        life: 0.4,
        glow: true
      }));
    }
  }

  /**
   * Ambient particles for high speed
   */
  emitSpeedLine(width, height, gameSpeed) {
    if (gameSpeed < 380) return;
    if (Math.random() < 0.25) {
      this.speedLines.push({
        x: width + 20,
        y: 40 + Math.random() * (height - 120),
        length: 60 + Math.random() * 140,
        speed: (gameSpeed * 1.5) + Math.random() * 200,
        color: Math.random() > 0.5 ? 'rgba(0, 229, 255, 0.4)' : 'rgba(155, 92, 255, 0.4)',
        width: 1 + Math.random() * 1.5
      });
    }
  }

  update(dt, canvasWidth, canvasHeight, gameSpeed = 300) {
    // Screen shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const currentIntensity = this.shakeIntensity * (this.shakeDuration > 0 ? (this.shakeDuration / 0.4) : 0);
      this.shakeOffsetX = (Math.random() - 0.5) * currentIntensity * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * currentIntensity * 2;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const alive = this.particles[i].update(dt);
      if (!alive) {
        this.particles.splice(i, 1);
      }
    }

    // Speed lines update
    this.emitSpeedLine(canvasWidth, canvasHeight, gameSpeed);
    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      const line = this.speedLines[i];
      line.x -= line.speed * dt;
      if (line.x + line.length < 0) {
        this.speedLines.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Draw speed lines
    for (const line of this.speedLines) {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.beginPath();
      ctx.moveTo(line.x, line.y);
      ctx.lineTo(line.x + line.length, line.y);
      ctx.stroke();
    }

    // Draw particles
    for (const p of this.particles) {
      p.draw(ctx);
    }

    ctx.restore();
  }
}
