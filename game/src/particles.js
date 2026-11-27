// Particles, autumn foliage, oven embers, flour clouds, comic callouts, and camera feedback.

import { PALETTE, VIEWPORT } from './config.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.callouts = [];
    this.leaves = [];
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.hitstopTimer = 0;
    this.flashColor = null;
    this.flashAlpha = 0;
  }

  reset(rng) {
    this.particles = [];
    this.callouts = [];
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.hitstopTimer = 0;
    this.flashAlpha = 0;
    this.leaves = [];
    for (let i = 0; i < 34; i++) {
      this.leaves.push({
        x: rng.range(0, VIEWPORT.width),
        y: rng.range(0, VIEWPORT.height),
        vx: rng.range(-55, -18),
        vy: rng.range(24, 64),
        rot: rng.range(0, Math.PI * 2),
        vrot: rng.range(-2.6, 2.6),
        size: rng.range(7, 15),
        swayPhase: rng.range(0, Math.PI * 2),
        color: rng.pick([PALETTE.mapleRed, PALETTE.mapleOrange, PALETTE.mapleGold, '#d94d1a']),
      });
    }
  }

  triggerShake(intensity, duration = 0.22) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  triggerHitstop(duration = 0.045) {
    this.hitstopTimer = Math.max(this.hitstopTimer, duration);
  }

  triggerFlash(color, alpha = 0.35) {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  addCallout(x, y, text, color = PALETTE.gold, scale = 1) {
    // Deduplicate identical recent callouts and prevent vertical stacking overlaps
    for (const existing of this.callouts) {
      if (existing.text === text && existing.life > existing.maxLife * 0.65) {
        return;
      }
    }
    let targetY = y;
    for (const existing of this.callouts) {
      if (Math.abs(existing.x - x) < 155 && Math.abs(existing.y - targetY) < 36) {
        targetY = existing.y - 36;
      }
    }
    if (this.callouts.length >= 3) {
      this.callouts.shift();
    }
    this.callouts.push({
      x,
      y: targetY,
      vy: -58,
      text,
      color,
      scale,
      life: 1.0,
      maxLife: 1.0,
    });
  }

  spawnFeathers(x, y, count = 8, spreadSpeed = 230) {
    const colors = ['#8c3c18', '#c95c1e', '#e8962e', '#f5e1b8', '#a62a1d'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const speed = spreadSpeed * (0.45 + Math.random() * 0.7);
      this.particles.push({
        kind: 'feather',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 90,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 9,
        size: 8 + Math.random() * 6,
        color: colors[i % colors.length],
        life: 0.75 + Math.random() * 0.45,
        maxLife: 1.15,
        gravity: 220,
      });
    }
  }

  spawnEmbers(x, y, count = 10, dirX = -1) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        kind: 'ember',
        x: x + (Math.random() - 0.5) * 26,
        y: y + (Math.random() - 0.5) * 24,
        vx: dirX * (80 + Math.random() * 210) + (Math.random() - 0.5) * 70,
        vy: -50 - Math.random() * 140,
        rot: 0,
        vrot: 0,
        size: 3 + Math.random() * 5,
        color: i % 2 === 0 ? PALETTE.ovenCore : PALETTE.ovenEmber,
        life: 0.35 + Math.random() * 0.4,
        maxLife: 0.75,
        gravity: -80,
      });
    }
  }

  spawnFlourCloud(x, y, count = 24) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 210;
      this.particles.push({
        kind: 'cloud',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 45,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 2,
        size: 16 + Math.random() * 26,
        color: '#fff8ee',
        life: 0.8 + Math.random() * 0.7,
        maxLife: 1.5,
        gravity: -15,
      });
    }
  }

  spawnDust(x, y, count = 5, dirX = -1) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        kind: 'dust',
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 6,
        vx: dirX * (25 + Math.random() * 75),
        vy: -20 - Math.random() * 45,
        rot: 0,
        vrot: 0,
        size: 6 + Math.random() * 8,
        color: '#e8cfa6',
        life: 0.32 + Math.random() * 0.25,
        maxLife: 0.58,
        gravity: -20,
      });
    }
  }

  spawnSparkles(x, y, count = 10, color = PALETTE.gold) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 70 + Math.random() * 140;
      this.particles.push({
        kind: 'sparkle',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: angle,
        vrot: 6,
        size: 4 + Math.random() * 5,
        color,
        life: 0.4 + Math.random() * 0.25,
        maxLife: 0.65,
        gravity: 80,
      });
    }
  }

  spawnGobbleRing(x, y) {
    this.particles.push({
      kind: 'ring',
      x,
      y,
      vx: 0,
      vy: 0,
      rot: 0,
      vrot: 0,
      size: 20,
      color: '#ffd670',
      life: 0.42,
      maxLife: 0.42,
      gravity: 0,
    });
  }

  update(dt, cameraSpeed = 0) {
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      if (this.shakeTime === 0) this.shakeIntensity = 0;
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.8);
    }

    // Drifting ambient autumn leaves (viewport space)
    for (const leaf of this.leaves) {
      leaf.swayPhase += dt * 2.4;
      leaf.x += (leaf.vx - cameraSpeed * 0.14 + Math.sin(leaf.swayPhase) * 24) * dt;
      leaf.y += leaf.vy * dt;
      leaf.rot += leaf.vrot * dt;
      if (leaf.x < -30) leaf.x = VIEWPORT.width + 25;
      if (leaf.x > VIEWPORT.width + 35) leaf.x = -25;
      if (leaf.y > VIEWPORT.height + 25) {
        leaf.y = -20;
        leaf.x = Math.random() * VIEWPORT.width;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.kind === 'ring') {
        p.size += dt * 360;
      } else {
        p.vy += p.gravity * dt;
        p.vx *= p.kind === 'feather' ? (1 - dt * 2.2) : (1 - dt * 1.1);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
      }
    }

    for (let i = this.callouts.length - 1; i >= 0; i--) {
      const c = this.callouts[i];
      c.life -= dt;
      c.y += c.vy * dt;
      c.vy *= 1 - dt * 2.6;
      if (c.life <= 0) this.callouts.splice(i, 1);
    }
  }

  getShakeOffset() {
    if (this.shakeTime <= 0 || this.shakeIntensity <= 0) return { x: 0, y: 0 };
    const mag = this.shakeIntensity * Math.min(1, this.shakeTime * 6);
    return {
      x: (Math.random() * 2 - 1) * mag,
      y: (Math.random() * 2 - 1) * mag,
    };
  }
}
