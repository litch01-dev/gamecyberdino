/**
 * CYBERPUNK HAND RUNNER - Obstacles System
 * Manages all 5 futuristic obstacle types: Cyber Barrier, Electric Crate, Energy Gate, Laser Obstacle, Mechanical Drone.
 */

export class Obstacle {
  constructor(type, x, groundY) {
    this.type = type; // 'BARRIER', 'CRATE', 'GATE', 'LASER', 'DRONE'
    this.x = x;
    this.groundY = groundY;
    this.passed = false;
    this.animTime = Math.random() * 10;

    // Type-specific dimensions and configurations
    switch (type) {
      case 'BARRIER':
        this.width = 38;
        this.height = 54;
        this.y = this.groundY - this.height;
        this.color = '#00E5FF';
        this.secondaryColor = '#287BFF';
        break;

      case 'CRATE':
        this.width = 46;
        this.height = 46;
        this.y = this.groundY - this.height;
        this.color = '#FFE600';
        this.secondaryColor = '#FF0055';
        break;

      case 'GATE':
        this.width = 32;
        this.height = 68;
        this.y = this.groundY - this.height;
        this.color = '#9B5CFF';
        this.secondaryColor = '#00E5FF';
        break;

      case 'LASER':
        this.width = 44;
        this.height = 30;
        this.y = this.groundY - this.height;
        this.color = '#FF0055';
        this.secondaryColor = '#FFE600';
        break;

      case 'DRONE':
        this.width = 42;
        this.height = 36;
        // Hovering above ground (requires jump or careful clearance)
        this.baseHoverY = this.groundY - 78;
        this.y = this.baseHoverY;
        this.color = '#FF0055';
        this.secondaryColor = '#00E5FF';
        break;

      default:
        this.width = 36;
        this.height = 48;
        this.y = this.groundY - this.height;
        this.color = '#00E5FF';
        this.secondaryColor = '#287BFF';
    }
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.animTime += dt;

    if (this.type === 'DRONE') {
      this.y = this.baseHoverY + Math.sin(this.animTime * 5) * 12;
    }
  }

  getBounds() {
    // Generous inset padding for fair play
    const padding = 5;
    return {
      x: this.x + padding,
      y: this.y + padding,
      width: this.width - padding * 2,
      height: this.height - padding * 2
    };
  }

  draw(ctx) {
    ctx.save();
    switch (this.type) {
      case 'BARRIER':
        this.drawCyberBarrier(ctx);
        break;
      case 'CRATE':
        this.drawElectricCrate(ctx);
        break;
      case 'GATE':
        this.drawEnergyGate(ctx);
        break;
      case 'LASER':
        this.drawLaserObstacle(ctx);
        break;
      case 'DRONE':
        this.drawMechanicalDrone(ctx);
        break;
    }
    ctx.restore();
  }

  // 1. CYBER BARRIER
  drawCyberBarrier(ctx) {
    const { x, y, width: w, height: h } = this;

    // Base support
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x + 2, y + h - 8, w - 4, 8);

    // Vertical neon pillars
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;

    ctx.strokeRect(x + 4, y, 6, h - 8);
    ctx.strokeRect(x + w - 10, y, 6, h - 8);

    // Forcefield pulse
    const alpha = 0.4 + Math.sin(this.animTime * 10) * 0.25;
    ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
    ctx.fillRect(x + 10, y + 4, w - 20, h - 14);

    // Diagonal hazard stripes
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 16);
    ctx.lineTo(x + w - 10, y + 28);
    ctx.moveTo(x + 10, y + 28);
    ctx.lineTo(x + w - 10, y + 40);
    ctx.stroke();

    // Top warning beacon
    const flash = Math.sin(this.animTime * 15) > 0;
    ctx.fillStyle = flash ? '#FF0055' : '#550011';
    ctx.shadowColor = '#FF0055';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. ELECTRIC CRATE
  drawElectricCrate(ctx) {
    const { x, y, width: w, height: h } = this;

    // Dark cyber crate body
    ctx.fillStyle = '#1E1B2E';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Inner cross reinforcement
    ctx.strokeStyle = '#332940';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + w - 4, y + h - 4);
    ctx.moveTo(x + w - 4, y + 4);
    ctx.lineTo(x + 4, y + h - 4);
    ctx.stroke();

    // Electric Arcs crackling across crate
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00E5FF';
    ctx.beginPath();
    const arcOffset = Math.sin(this.animTime * 20) * 8;
    ctx.moveTo(x + 6, y + h / 2);
    ctx.lineTo(x + w / 2 + arcOffset, y + 10);
    ctx.lineTo(x + w - 6, y + h / 2);
    ctx.stroke();

    // Danger High Voltage Symbol (Lightning)
    ctx.fillStyle = '#FFE600';
    ctx.shadowColor = '#FFE600';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 + 2, y + 12);
    ctx.lineTo(x + w / 2 - 5, y + 24);
    ctx.lineTo(x + w / 2, y + 24);
    ctx.lineTo(x + w / 2 - 2, y + 34);
    ctx.lineTo(x + w / 2 + 5, y + 22);
    ctx.lineTo(x + w / 2, y + 22);
    ctx.closePath();
    ctx.fill();
  }

  // 3. ENERGY GATE
  drawEnergyGate(ctx) {
    const { x, y, width: w, height: h } = this;

    // Dual ionic emitter pylons
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    // Left pylon
    ctx.fillRect(x, y, 6, h);
    ctx.strokeRect(x, y, 6, h);

    // Right pylon
    ctx.fillRect(x + w - 6, y, 6, h);
    ctx.strokeRect(x + w - 6, y, 6, h);

    // Plasma beam arcs connecting pylons
    const beamCount = 3;
    for (let i = 0; i < beamCount; i++) {
      const beamY = y + 14 + (i * 18);
      const jitter = Math.sin(this.animTime * 25 + i * 2) * 3;

      ctx.strokeStyle = '#F4F7FF';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = this.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(x + 6, beamY);
      ctx.lineTo(x + w / 2, beamY + jitter);
      ctx.lineTo(x + w - 6, beamY);
      ctx.stroke();

      // Energy rings
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(x + w / 2, beamY + jitter, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. LASER OBSTACLE
  drawLaserObstacle(ctx) {
    const { x, y, width: w, height: h } = this;

    // Laser emitter base
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h);
    ctx.lineTo(x + w - 4, y + h);
    ctx.lineTo(x + w - 8, y + 12);
    ctx.lineTo(x + 8, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Laser Projector Core
    ctx.fillStyle = '#FF0055';
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#FF0055';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 12, 6, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal pulsating death laser beam
    const beamPulse = 2 + Math.sin(this.animTime * 18) * 1.5;
    ctx.strokeStyle = '#FF0055';
    ctx.lineWidth = beamPulse;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 10);
    ctx.lineTo(x + w + 6, y + 10);
    ctx.stroke();

    // White hot core of laser
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 10);
    ctx.lineTo(x + w + 6, y + 10);
    ctx.stroke();
  }

  // 5. MECHANICAL DRONE
  drawMechanicalDrone(ctx) {
    const { x, y, width: w, height: h } = this;

    // Rotor wings
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 8);
    ctx.lineTo(x + w + 4, y + 8);
    ctx.stroke();

    // Drone chassis
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;

    ctx.beginPath();
    ctx.moveTo(x + 8, y + 4);
    ctx.lineTo(x + w - 8, y + 4);
    ctx.lineTo(x + w, y + 20);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing surveillance eye / camera
    const eyeFlash = Math.sin(this.animTime * 8);
    ctx.fillStyle = eyeFlash > 0 ? '#00E5FF' : '#FF0055';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 16, 5, 0, Math.PI * 2);
    ctx.fill();

    // Downward scanning cone (subtle holographic light)
    ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h);
    ctx.lineTo(x - 12, this.groundY);
    ctx.lineTo(x + w + 12, this.groundY);
    ctx.closePath();
    ctx.fill();
  }
}

export class ObstacleManager {
  constructor(groundY) {
    this.groundY = groundY;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.types = ['BARRIER', 'CRATE', 'GATE', 'LASER', 'DRONE'];
  }

  reset(groundY) {
    this.groundY = groundY;
    this.obstacles = [];
    this.spawnTimer = 1.2; // Initial delay
  }

  /**
   * Determine dynamic spawn interval based on current speed and level
   */
  getSpawnInterval(gameSpeed, level) {
    // Slower at L1 (approx 2.4 - 3.2s), faster at L5 (approx 1.2 - 1.8s)
    const baseMin = Math.max(1.1, 2.6 - level * 0.28);
    const baseMax = baseMin + 0.9;
    return baseMin + Math.random() * (baseMax - baseMin);
  }

  update(dt, gameSpeed, level, onAvoidObstacle) {
    this.spawnTimer -= dt;

    if (this.spawnTimer <= 0) {
      this.spawnObstacle(level);
      this.spawnTimer = this.getSpawnInterval(gameSpeed, level);
    }

    // Update obstacles and check avoided
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(dt, gameSpeed);

      // Check if player passed obstacle safely (x passed player at 120)
      if (!obs.passed && obs.x + obs.width < 100) {
        obs.passed = true;
        if (onAvoidObstacle) {
          onAvoidObstacle(obs);
        }
      }

      // Remove off-screen obstacles
      if (obs.x + obs.width < -50) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  spawnObstacle(level) {
    // Filter available obstacle types by level
    let allowedTypes = ['BARRIER', 'CRATE'];
    if (level >= 2) allowedTypes.push('GATE');
    if (level >= 3) allowedTypes.push('LASER');
    if (level >= 4) allowedTypes.push('DRONE');

    const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    const spawnX = 960 + Math.random() * 80;

    // Prevent spawning if an obstacle is already near spawnX
    const tooClose = this.obstacles.some(o => Math.abs(o.x - spawnX) < 220);
    if (!tooClose) {
      this.obstacles.push(new Obstacle(type, spawnX, this.groundY));
    }
  }

  draw(ctx) {
    for (const obs of this.obstacles) {
      obs.draw(ctx);
    }
  }
}
