// Real 3D Three.js Particle & Feedback Manager: feathers, 450°F embers, oven smoke, billowing flour bombs, maple leaves & callouts.

import * as THREE from 'three';

export class EffectsManager3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.particles = [];
    this.ambientLeaves = [];
    this.callouts = [];
    this.shakeTimer = 0;
    this.shakeAmp = 0;
    this.hitstopTimer = 0;
    this.flashAlpha = 0;
    this.flashColor = null;

    this.featherGeo = new THREE.BoxGeometry(0.14, 0.34, 0.03);
    this.emberGeo = new THREE.SphereGeometry(0.085, 6, 6);
    this.flourGeo = new THREE.SphereGeometry(0.42, 10, 10);
    this.leafGeo = new THREE.BoxGeometry(0.24, 0.035, 0.24);
    this.ringGeo = new THREE.TorusGeometry(0.75, 0.075, 8, 24);
  }

  reset(rng) {
    for (const p of this.particles) this.group.remove(p.mesh);
    for (const l of this.ambientLeaves) this.group.remove(l.mesh);
    this.particles = [];
    this.ambientLeaves = [];
    this.callouts = [];
    this.shakeTimer = 0;
    this.hitstopTimer = 0;
    this.flashAlpha = 0;

    // 32 gently swirling 3D autumn maple leaves drifting across the foreground & midground!
    const leafColors = [0xd93218, 0xf27b1b, 0xffc633, 0xb82412];
    for (let i = 0; i < 32; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: leafColors[i % leafColors.length], roughness: 0.62 });
      const mesh = new THREE.Mesh(this.leafGeo, mat);
      mesh.position.set(rng.range(-4, 42), rng.range(1.5, 8.5), rng.range(-3.5, 4.2));
      this.group.add(mesh);
      this.ambientLeaves.push({
        mesh,
        vy: -rng.range(0.55, 1.25),
        vx: -rng.range(0.4, 1.3),
        swayPhase: rng.range(0, Math.PI * 2),
        spin: rng.range(1.6, 3.6),
      });
    }
  }

  triggerShake(amp, dur = 0.22) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
    this.shakeTimer = Math.max(this.shakeTimer, dur);
  }

  triggerHitstop(dur = 0.04) {
    this.hitstopTimer = Math.max(this.hitstopTimer, dur);
  }

  triggerFlash(color, alpha = 0.28) {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  addCallout(x, y, z, text, color = '#ffe066', scale = 1.0) {
    this.callouts.push({ x, y, z, text, color, scale, life: 1.05, maxLife: 1.05 });
  }

  spawnFeathers(x, y, z, count = 8, speed = 5.0) {
    const colors = [0xffcf40, 0xeb6e1e, 0xd42c1a, 0xfff1cc];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.46 });
      const mesh = new THREE.Mesh(this.featherGeo, mat);
      mesh.position.set(x, y, z);
      this.group.add(mesh);
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      this.particles.push({
        mesh,
        vx: Math.cos(a) * speed * (0.45 + Math.random() * 0.7),
        vy: 2.2 + Math.random() * 4.4,
        vz: Math.sin(a) * speed * 0.45,
        gravity: 6.2,
        drag: 0.94,
        spin: (Math.random() - 0.5) * 11,
        grow: 0,
        life: 0.9 + Math.random() * 0.45,
        maxLife: 1.35,
      });
    }
  }

  spawnEmbers(x, y, z, dirX = -1, count = 8) {
    const cols = [0xfff28a, 0xff921c, 0xff3d0d];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: cols[i % cols.length] });
      const mesh = new THREE.Mesh(this.emberGeo, mat);
      mesh.position.set(x, y + (Math.random() - 0.5) * 0.75, z + (Math.random() - 0.5) * 0.75);
      this.group.add(mesh);
      this.particles.push({
        mesh,
        vx: dirX * (3.8 + Math.random() * 5.2),
        vy: 1.0 + Math.random() * 3.0,
        vz: (Math.random() - 0.5) * 2.2,
        gravity: -1.4,
        drag: 0.97,
        spin: 4,
        grow: -0.4,
        life: 0.48 + Math.random() * 0.32,
        maxLife: 0.8,
      });
    }
  }

  spawnFlourExplosion(x, y, z, count = 14) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfffaf0,
        roughness: 0.88,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(this.flourGeo, mat);
      mesh.position.set(x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.4, z + (Math.random() - 0.5) * 0.5);
      this.group.add(mesh);
      const a = (i / count) * Math.PI * 2;
      this.particles.push({
        mesh,
        vx: Math.cos(a) * (1.2 + Math.random() * 2.8),
        vy: 1.0 + Math.random() * 2.8,
        vz: Math.sin(a) * (1.2 + Math.random() * 2.6),
        gravity: 0.8,
        drag: 0.92,
        spin: 2,
        grow: 1.2,
        life: 1.05 + Math.random() * 0.45,
        maxLife: 1.5,
      });
    }
  }

  spawnGobbleRing(x, y, z) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe266, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.PI * 0.5;
    this.group.add(mesh);
    this.particles.push({
      mesh,
      vx: 0,
      vy: 0,
      vz: 0,
      gravity: 0,
      drag: 1,
      spin: 0,
      grow: 6.5,
      life: 0.36,
      maxLife: 0.36,
    });
  }

  update(dt, focusX) {
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      if (this.shakeTimer <= 0) this.shakeAmp = 0;
    }
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.6);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.group.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= p.gravity * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vz *= Math.pow(p.drag, dt * 60);
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.05, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += p.spin * dt;
      p.mesh.rotation.z += p.spin * 0.7 * dt;

      if (p.grow !== 0) {
        const sc = Math.max(0.08, p.mesh.scale.x + p.grow * dt);
        p.mesh.scale.setScalar(sc);
      }
      if (p.mesh.material.transparent) {
        p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
      }
    }

    for (const l of this.ambientLeaves) {
      l.swayPhase += dt * 2.2;
      l.mesh.position.x += (l.vx + Math.cos(l.swayPhase) * 0.45) * dt;
      l.mesh.position.y += l.vy * dt;
      l.mesh.rotation.x += l.spin * dt;
      l.mesh.rotation.y += l.spin * 0.8 * dt;
      if (l.mesh.position.y < 0.1 || l.mesh.position.x < focusX - 18) {
        l.mesh.position.set(focusX + 8 + Math.random() * 24, 6.5 + Math.random() * 4, -3.5 + Math.random() * 7.5);
      }
    }

    for (let i = this.callouts.length - 1; i >= 0; i--) {
      const c = this.callouts[i];
      c.life -= dt;
      c.y += dt * 1.15;
      if (c.life <= 0) this.callouts.splice(i, 1);
    }
  }

  getShakeOffset() {
    if (this.shakeTimer <= 0) return { x: 0, y: 0 };
    const s = this.shakeAmp * (this.shakeTimer / 0.22);
    return { x: (Math.random() - 0.5) * s, y: (Math.random() - 0.5) * s };
  }
}
