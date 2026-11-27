// 3D Particle & Screen-Space Callout Manager: 3D tumbling feathers, oven sparks, flour clouds, autumn leaves, camera shake.

import * as THREE from 'three';

export class EffectsManager3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.particles = [];
    this.leaves = [];
    this.callouts = [];
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.hitstopTimer = 0;
    this.flashColor = null;
    this.flashAlpha = 0;

    this.featherGeo = new THREE.BoxGeometry(0.24, 0.06, 0.12);
    this.sparkGeo = new THREE.SphereGeometry(0.09, 6, 6);
    this.cloudGeo = new THREE.SphereGeometry(0.45, 10, 8);
    this.leafGeo = new THREE.BoxGeometry(0.22, 0.03, 0.22);
  }

  reset(rng) {
    for (const p of this.particles) this.group.remove(p.mesh);
    for (const l of this.leaves) this.group.remove(l.mesh);
    this.particles = [];
    this.leaves = [];
    this.callouts = [];
    this.shakeTime = 0;
    this.hitstopTimer = 0;
    this.flashAlpha = 0;

    const leafCols = [0xd4301b, 0xeb781e, 0xf7b731, 0xb82616];
    for (let i = 0; i < 42; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: leafCols[i % leafCols.length], roughness: 0.6 });
      const mesh = new THREE.Mesh(this.leafGeo, mat);
      mesh.position.set(rng.range(-9, 9), rng.range(1.2, 8.5), rng.range(-4, 34));
      this.group.add(mesh);
      this.leaves.push({
        mesh,
        vx: rng.range(-0.8, 0.8),
        vy: rng.range(-1.4, -0.65),
        vz: rng.range(-0.8, 0.8),
        vrot: rng.range(-3.2, 3.2),
        sway: rng.range(0, Math.PI * 2),
      });
    }
  }

  triggerShake(intensity, duration = 0.24) {
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

  addCallout(x, y, z, text, color = '#ffd85c', scale = 1) {
    for (const existing of this.callouts) {
      if (existing.text === text && existing.life > existing.maxLife * 0.65) return;
    }
    let ty = y;
    for (const existing of this.callouts) {
      if (Math.hypot(existing.x - x, existing.z - z) < 2.5 && Math.abs(existing.y - ty) < 0.85) {
        ty = existing.y + 0.85;
      }
    }
    if (this.callouts.length >= 4) this.callouts.shift();
    this.callouts.push({ x, y: ty, z, vy: 1.8, text, color, scale, life: 1.05, maxLife: 1.05 });
  }

  spawnFeathers(x, y, z, count = 8, speed = 5.5) {
    const cols = [0xd45219, 0xf7b538, 0x992816, 0xfff0c4];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.45 });
      const mesh = new THREE.Mesh(this.featherGeo, mat);
      mesh.position.set(x, y, z);
      this.group.add(mesh);
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = speed * (0.45 + Math.random() * 0.65);
      this.particles.push({
        mesh,
        vx: Math.cos(a) * spd,
        vy: 2.2 + Math.random() * 3.4,
        vz: Math.sin(a) * spd,
        gravity: 9.5,
        vrot: (Math.random() - 0.5) * 10,
        scaleGrow: 0,
        life: 0.75 + Math.random() * 0.4,
        maxLife: 1.15,
      });
    }
  }

  spawnEmbers(x, y, z, dirX, count = 8) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xfff08a : 0xff5e14 });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.5, z + (Math.random() - 0.5) * 0.6);
      this.group.add(mesh);
      this.particles.push({
        mesh,
        vx: dirX * (2.5 + Math.random() * 5.2),
        vy: 1.2 + Math.random() * 3.2,
        vz: (Math.random() - 0.5) * 2.2,
        gravity: -2.0,
        vrot: 0,
        scaleGrow: -0.6,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
      });
    }
  }

  spawnFlourExplosion(x, y, z, count = 18) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfffbf2,
        roughness: 0.9,
        transparent: true,
        opacity: 0.88,
      });
      const mesh = new THREE.Mesh(this.cloudGeo, mat);
      mesh.position.set(x, y, z);
      this.group.add(mesh);
      const a = Math.random() * Math.PI * 2;
      const spd = 1.4 + Math.random() * 4.8;
      this.particles.push({
        mesh,
        vx: Math.cos(a) * spd,
        vy: 0.8 + Math.random() * 3.2,
        vz: Math.sin(a) * spd,
        gravity: 1.5,
        vrot: 2,
        scaleGrow: 1.6,
        life: 0.85 + Math.random() * 0.55,
        maxLife: 1.4,
      });
    }
  }

  spawnGobbleWave(x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.65, 24),
      new THREE.MeshBasicMaterial({ color: 0xffe066, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
    );
    mesh.rotation.x = -Math.PI * 0.5;
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    this.particles.push({
      mesh,
      vx: 0,
      vy: 0,
      vz: 0,
      gravity: 0,
      vrot: 0,
      scaleGrow: 12.0,
      life: 0.42,
      maxLife: 0.42,
    });
  }

  update(dt, focusZ = 0) {
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      if (this.shakeTime === 0) this.shakeIntensity = 0;
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.9);
    }

    // Keep ambient 3D autumn leaves swirling around current camera Z!
    for (const l of this.leaves) {
      l.sway += dt * 2.4;
      l.mesh.position.x += (l.vx + Math.sin(l.sway) * 0.9) * dt;
      l.mesh.position.y += l.vy * dt;
      l.mesh.position.z += l.vz * dt;
      l.mesh.rotation.x += l.vrot * dt;
      l.mesh.rotation.z += l.vrot * 0.7 * dt;
      if (l.mesh.position.y < 0.1 || l.mesh.position.z < focusZ - 12 || l.mesh.position.z > focusZ + 36) {
        l.mesh.position.set((Math.random() - 0.5) * 18, 7.5 + Math.random() * 2.5, focusZ + Math.random() * 32 - 4);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.group.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= p.gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.05, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += p.vrot * dt;
      p.mesh.rotation.y += p.vrot * dt;
      if (p.scaleGrow !== 0) {
        const s = Math.max(0.05, p.mesh.scale.x + p.scaleGrow * dt);
        p.mesh.scale.setScalar(s);
      }
      if (p.mesh.material.transparent) {
        p.mesh.material.opacity = Math.max(0, (p.life / p.maxLife) * 0.85);
      }
    }

    for (let i = this.callouts.length - 1; i >= 0; i--) {
      const c = this.callouts[i];
      c.life -= dt;
      c.y += c.vy * dt;
      c.vy *= 1 - dt * 2.5;
      if (c.life <= 0) this.callouts.splice(i, 1);
    }
  }

  getShakeOffset() {
    if (this.shakeTime <= 0 || this.shakeIntensity <= 0) return { x: 0, y: 0 };
    const m = this.shakeIntensity * Math.min(1, this.shakeTime * 5);
    return { x: (Math.random() * 2 - 1) * m, y: (Math.random() * 2 - 1) * m };
  }
}
