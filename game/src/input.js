// Responsive keyboard & mouse controller mapped to 3/4 side-view 3D diorama axes (+X forward, Z lane depth).

import { VIEWPORT } from './config.js';

export class InputController {
  constructor(canvas, onFirstGesture) {
    this.canvas = canvas;
    this.onFirstGesture = onFirstGesture;
    this.down = new Set();
    this.justPressed = new Set();
    this.clicks = [];
    this.rightClicks = [];
    this.pointer = { x: VIEWPORT.width * 0.5, y: VIEWPORT.height * 0.5 };
    this._unlocked = false;
    this._bindEvents();
  }

  _notifyGesture() {
    if (!this._unlocked && this.onFirstGesture) {
      this._unlocked = true;
      this.onFirstGesture();
    }
  }

  _canvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * VIEWPORT.width,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * VIEWPORT.height,
    };
  }

  _bindEvents() {
    const preventKeys = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    window.addEventListener('keydown', (e) => {
      if (preventKeys.has(e.code)) e.preventDefault();
      this._notifyGesture();
      if (!this.down.has(e.code)) this.justPressed.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => {
      this.down.clear();
      this.justPressed.clear();
    });
    this.canvas.addEventListener('mousemove', (e) => {
      this.pointer = this._canvasCoords(e);
    });
    this.canvas.addEventListener('mousedown', (e) => {
      this._notifyGesture();
      const pt = this._canvasCoords(e);
      this.pointer = pt;
      if (e.button === 0) this.clicks.push(pt);
      else if (e.button === 2) this.rightClicks.push(pt);
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  isDown(...codes) {
    return codes.some((c) => this.down.has(c));
  }

  wasPressed(...codes) {
    return codes.some((c) => this.justPressed.has(c));
  }

  // +X = right/forward along escape course; -Z = back lane (Up/W), +Z = front lane (Down/S)
  getMoveVector3D() {
    let x = 0;
    let z = 0;
    if (this.isDown('KeyD', 'ArrowRight')) x += 1;
    if (this.isDown('KeyA', 'ArrowLeft')) x -= 1;
    if (this.isDown('KeyW', 'ArrowUp')) z -= 1;
    if (this.isDown('KeyS', 'ArrowDown')) z += 1;
    const mag = Math.hypot(x, z);
    if (mag > 1) {
      x /= mag;
      z /= mag;
    }
    return { x, z };
  }

  wasJumpPressed() {
    return this.wasPressed('Space');
  }

  isJumpHeld() {
    return this.isDown('Space');
  }

  wasDashPressed() {
    return this.wasPressed('ShiftLeft', 'ShiftRight', 'KeyK');
  }

  isHideHeld() {
    return this.isDown('KeyE', 'KeyC');
  }

  wasKickPressed() {
    return this.wasPressed('KeyF', 'KeyG', 'KeyJ') || this.rightClicks.length > 0;
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
    const out = this.clicks.slice();
    this.clicks.length = 0;
    return out;
  }

  endFrame() {
    this.justPressed.clear();
    this.clicks.length = 0;
    this.rightClicks.length = 0;
  }
}
