/**
 * CYBERPUNK HAND RUNNER - Collectibles & Power-Ups System
 * Manages Energy Orbs, Cyber Coins, Power Cores, and Shield/Magnet/2X power-ups.
 */

import { Audio } from './audio.js';

export class Collectible {
  constructor(type, x, y) {
    this.type = type; // 'ORB', 'COIN', 'CORE', 'POWER_SHIELD', 'POWER_MAGNET', 'POWER_BOOST'
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.radius = 16;
    this.animTime = Math.random() * 10;
    this.collected = false;

    // Type configuration
    switch (type) {
      case 'ORB':
        this.score = 50;
        this.color = '#00E5FF';
        this.glowColor = '#00E5FF';
        break;
      case 'COIN':
        this.score = 100;
        this.color = '#FFE600';
        this.glowColor = '#FFE600';
        break;
      case 'CORE':
        this.score = 250;
        this.color = '#9B5CFF';
        this.glowColor = '#9B5CFF';
        break;
      case 'POWER_SHIELD':
        this.score = 75;
        this.color = '#00E5FF';
        this.glowColor = '#00E5FF';
        this.isPowerUp = true;
        break;
      case 'POWER_MAGNET':
        this.score = 75;
        this.color = '#287BFF';
        this.glowColor = '#287BFF';
        this.isPowerUp = true;
        break;
      case 'POWER_BOOST':
        this.score = 75;
        this.color = '#9B5CFF';
        this.glowColor = '#FF0055';
        this.isPowerUp = true;
        break;
    }
  }

  update(dt, speed, player) {
    this.x -= speed * dt;
    this.animTime += dt;

    // Floating bobbing motion
    this.y = this.baseY + Math.sin(this.animTime * 4) * 6;

    // Magnet attraction
    if (player && player.hasMagnet && !this.collected) {
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      const dx = px - this.x;
      const dy = py - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 260) {
        const pullSpeed = 450 * (1 - dist / 260) + 150;
        this.x += (dx / dist) * pullSpeed * dt;
        this.y += (dy / dist) * pullSpeed * dt;
        this.baseY = this.y;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    const cx = this.x;
    const cy = this.y;

    switch (this.type) {
      case 'ORB':
        this.drawEnergyOrb(ctx, cx, cy);
        break;
      case 'COIN':
        this.drawCyberCoin(ctx, cx, cy);
        break;
      case 'CORE':
        this.drawPowerCore(ctx, cx, cy);
        break;
      case 'POWER_SHIELD':
        this.drawPowerUpShield(ctx, cx, cy);
        break;
      case 'POWER_MAGNET':
        this.drawPowerUpMagnet(ctx, cx, cy);
        break;
      case 'POWER_BOOST':
        this.drawPowerUpBoost(ctx, cx, cy);
        break;
    }

    ctx.restore();
  }

  // Energy Orb
  drawEnergyOrb(ctx, cx, cy) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.glowColor;

    // Outer glow aura
    ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // Core sphere
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    // Orbital ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.animTime * 3);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Holographic Cyber Coin
  drawCyberCoin(ctx, cx, cy) {
    const scaleX = Math.abs(Math.cos(this.animTime * 3));
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(Math.max(0.1, scaleX), 1);

    ctx.shadowBlur = 10;
    ctx.shadowColor = this.glowColor;

    // Hexagonal coin face
    ctx.fillStyle = '#FFE600';
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * 11;
      const py = Math.sin(a) * 11;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center symbol "C"
    ctx.fillStyle = '#080B16';
    ctx.font = 'bold 9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', 0, 1);

    ctx.restore();
  }

  // Triangular Power Core
  drawPowerCore(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.animTime * 1.5);

    ctx.shadowBlur = 15;
    ctx.shadowColor = this.glowColor;

    // Triangle
    ctx.fillStyle = '#9B5CFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
      const px = Math.cos(a) * 13;
      const py = Math.sin(a) * 13;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing core pip
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Power-up Shield Badge
  drawPowerUpShield(ctx, cx, cy) {
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#00E5FF';

    // Bubble container
    ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shield Icon
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 7);
    ctx.lineTo(cx + 7, cy - 7);
    ctx.lineTo(cx + 7, cy);
    ctx.quadraticCurveTo(cx, cy + 9, cx, cy + 9);
    ctx.quadraticCurveTo(cx, cy + 9, cx - 7, cy);
    ctx.closePath();
    ctx.fill();
  }

  // Power-up Magnet Badge
  drawPowerUpMagnet(ctx, cx, cy) {
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#287BFF';

    // Bubble container
    ctx.fillStyle = 'rgba(40, 123, 255, 0.2)';
    ctx.strokeStyle = '#287BFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Magnet U-shape
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 6, 0, Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#FF0055';
    ctx.fillRect(cx - 8, cy - 7, 4, 4);
    ctx.fillStyle = '#00E5FF';
    ctx.fillRect(cx + 4, cy - 7, 4, 4);
  }

  // Power-up 2X Boost Badge
  drawPowerUpBoost(ctx, cx, cy) {
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#9B5CFF';

    // Bubble container
    ctx.fillStyle = 'rgba(155, 92, 255, 0.25)';
    ctx.strokeStyle = '#9B5CFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // "2X" text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2X', cx, cy + 1);
  }
}

export class CollectibleManager {
  constructor(groundY) {
    this.groundY = groundY;
    this.items = [];
    this.popups = [];
    this.spawnTimer = 2.0;
  }

  reset(groundY) {
    this.groundY = groundY;
    this.items = [];
    this.popups = [];
    this.spawnTimer = 2.0;
  }

  spawnFormation(level) {
    const startX = 980;
    const patternType = Math.floor(Math.random() * 4);

    // Occasional power-up chance (12%)
    if (Math.random() < 0.12) {
      const powerUps = ['POWER_SHIELD', 'POWER_MAGNET', 'POWER_BOOST'];
      const pType = powerUps[Math.floor(Math.random() * powerUps.length)];
      const y = this.groundY - 90 - Math.random() * 50;
      this.items.push(new Collectible(pType, startX, y));
      return;
    }

    if (patternType === 0) {
      // Horizontal run of coins near ground
      for (let i = 0; i < 4; i++) {
        this.items.push(new Collectible('COIN', startX + i * 40, this.groundY - 25));
      }
    } else if (patternType === 1) {
      // Parabolic jump arc of energy orbs
      for (let i = 0; i < 5; i++) {
        const norm = i / 4; // 0 to 1
        const heightArc = Math.sin(norm * Math.PI) * 90;
        this.items.push(new Collectible('ORB', startX + i * 42, this.groundY - 45 - heightArc));
      }
    } else if (patternType === 2) {
      // High cluster with Power Core
      this.items.push(new Collectible('CORE', startX + 50, this.groundY - 110));
      this.items.push(new Collectible('ORB', startX + 15, this.groundY - 95));
      this.items.push(new Collectible('ORB', startX + 85, this.groundY - 95));
    } else {
      // Mixed trail
      this.items.push(new Collectible('COIN', startX, this.groundY - 30));
      this.items.push(new Collectible('COIN', startX + 35, this.groundY - 50));
      this.items.push(new Collectible('COIN', startX + 70, this.groundY - 70));
    }
  }

  addScorePopup(text, x, y, color = '#00E5FF') {
    this.popups.push({
      text,
      x,
      y,
      color,
      alpha: 1.0,
      life: 0.8
    });
  }

  update(dt, gameSpeed, level, player, particleSystem, onCollect) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnFormation(level);
      this.spawnTimer = 2.2 + Math.random() * 2.0;
    }

    // Update floating popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt;
      p.y -= 35 * dt;
      p.alpha = Math.max(0, p.life / 0.8);
      if (p.life <= 0) {
        this.popups.splice(i, 1);
      }
    }

    // Update items & check player collision
    const playerBounds = player.getBounds();

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update(dt, gameSpeed, player);

      // Simple circle-to-box collision
      const closestX = Math.max(playerBounds.x, Math.min(item.x, playerBounds.x + playerBounds.width));
      const closestY = Math.max(playerBounds.y, Math.min(item.y, playerBounds.y + playerBounds.height));
      const dist = Math.hypot(item.x - closestX, item.y - closestY);

      if (dist < item.radius) {
        // Collect!
        item.collected = true;

        if (item.isPowerUp) {
          if (item.type === 'POWER_SHIELD') {
            player.hasShield = true;
            player.shieldTimer = 15; // 15 sec shield or 1 hit
            Audio.playPowerUp('shield');
            this.addScorePopup('SHIELD ACTIVE!', item.x, item.y - 10, '#00E5FF');
          } else if (item.type === 'POWER_MAGNET') {
            player.hasMagnet = true;
            player.magnetTimer = 12; // 12 sec magnet
            Audio.playPowerUp('magnet');
            this.addScorePopup('MAGNET ACTIVE!', item.x, item.y - 10, '#287BFF');
          } else if (item.type === 'POWER_BOOST') {
            player.hasDoubleScore = true;
            player.scoreBoostTimer = 10; // 10 sec 2X boost
            Audio.playPowerUp('boost');
            this.addScorePopup('2X BOOST!', item.x, item.y - 10, '#9B5CFF');
          }
        } else {
          const typeKey = item.type === 'COIN' ? 'coin' : item.type === 'CORE' ? 'power_core' : 'orb';
          Audio.playCollect(typeKey);

          const finalScore = player.hasDoubleScore ? item.score * 2 : item.score;
          this.addScorePopup(`+${finalScore}`, item.x, item.y - 10, item.color);
        }

        if (particleSystem) {
          particleSystem.emitCollect(item.x, item.y, item.color);
        }

        if (onCollect) {
          onCollect(item);
        }

        this.items.splice(i, 1);
        continue;
      }

      // Remove off-screen items
      if (item.x + item.radius < -30) {
        this.items.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const item of this.items) {
      item.draw(ctx);
    }

    // Draw floating score popups
    for (const p of this.popups) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.font = 'bold 15px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
  }
}

