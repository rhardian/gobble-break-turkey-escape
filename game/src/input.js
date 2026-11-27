// Unified 3D Keyboard + Mouse input handler (WASD/Arrows 8-dir movement, Jump/Flutter, Dash, Hide, Kick, Perks).

import { VIEWPORT } from './config.js';

export class InputController {
  constructor(canvas, onInteract) {
    this.canvas = canvas;
    this.onInteract = onInteract;
    this.keys = new Set();
    this.justPressed = new Set();
    this.pointer = { x: VIEWPORT.width * 0.5, y: VIEWPORT.height * 0.5, down: false, rightDown: false };
    this.clicks = [];
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }
      if (!this.keys.has(code)) {
        this.justPressed.add(code);
        if (this.onInteract) this.onInteract();
      }
      this.keys.add(code);
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pointer.down = false;
      this.pointer.rightDown = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const p = this._coords(e);
      this.pointer.x = p.x;
      this.pointer.y = p.y;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.canvas.focus();
      if (this.onInteract) this.onInteract();
      const p = this._coords(e);
      this.pointer.x = p.x;
      this.pointer.y = p.y;
      if (e.button === 2) {
        this.pointer.rightDown = true;
        this.justPressed.add('MouseRight');
      } else if (e.button === 0) {
        this.pointer.down = true;
        this.clicks.push(p);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.pointer.rightDown = false;
      if (e.button === 0) this.pointer.down = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _coords(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (VIEWPORT.width / Math.max(1, r.width)),
      y: (e.clientY - r.top) * (VIEWPORT.height / Math.max(1, r.height)),
    };
  }

  isDown(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  wasPressed(...codes) {
    return codes.some((c) => this.justPressed.has(c));
  }

  // 3D movement vector: X (-1 left .. +1 right across courtyard), Z (+1 forward down escape course .. -1 back)
  getMoveVector3D() {
    // Camera looks toward +Z from behind, with X to screen-left/right:
    // D / Right moves screen-right (-X in world when camera faces +Z? Let's define camera at (0, +Y, Z-12) looking at (0, 0, Z+6):
    // In Three.js right-handed coords: camera at (0, 8, -12) looking at (0, 0, +6) has +X pointing SCREEN-LEFT!
    // So screen-right = -X, screen-left = +X, forward = +Z, backward = -Z!
    const right = this.isDown('KeyD', 'ArrowRight') ? 1 : 0;
    const left = this.isDown('KeyA', 'ArrowLeft') ? 1 : 0;
    const forward = this.isDown('KeyW', 'ArrowUp') ? 1 : 0;
    const back = this.isDown('KeyS', 'ArrowDown') ? 1 : 0;
    let x = left - right;
    let z = forward - back;
    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }
    return { x, z };
  }

  isJumpHeld() {
    return this.isDown('Space');
  }

  wasJumpPressed() {
    return this.wasPressed('Space');
  }

  wasDashPressed() {
    return this.wasPressed('ShiftLeft', 'ShiftRight', 'KeyJ');
  }

  isHideHeld() {
    return this.isDown('KeyE', 'KeyC');
  }

  wasKickPressed() {
    return this.wasPressed('KeyF', 'KeyK', 'MouseRight');
  }

  wasPausePressed() {
    return this.wasPressed('KeyP', 'Escape');
  }

  wasMutePressed() {
    return this.wasPressed('KeyM');
  }

  wasRestartPressed() {
    return this.wasPressed('KeyR');
  }

  consumeClicks() {
    if (!this.clicks.length) return [];
    const out = this.clicks.slice();
    this.clicks.length = 0;
    return out;
  }

  endFrame() {
    this.justPressed.clear();
  }
}
