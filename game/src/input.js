// Responsive keyboard and mouse input handler with jump buffering and pointer hit-testing.

import { VIEWPORT } from './config.js';

export class InputController {
  constructor(canvas, onAction) {
    this.canvas = canvas;
    this.onAction = onAction;
    this.keys = new Set();
    this.justPressed = new Set();
    this.pointer = { x: VIEWPORT.width * 0.5, y: VIEWPORT.height * 0.5, down: false, rightDown: false };
    this.clicks = [];
    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }
      if (!this.keys.has(code)) {
        this.justPressed.add(code);
        if (this.onAction) this.onAction('key', code);
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
      const pos = this._toCanvasCoords(e);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.canvas.focus();
      const pos = this._toCanvasCoords(e);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      if (e.button === 2) {
        this.pointer.rightDown = true;
        this.justPressed.add('MouseRight');
        if (this.onAction) this.onAction('rightClick', pos);
      } else if (e.button === 0) {
        this.pointer.down = true;
        this.clicks.push(pos);
        if (this.onAction) this.onAction('click', pos);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.pointer.rightDown = false;
      if (e.button === 0) this.pointer.down = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  _toCanvasCoords(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = VIEWPORT.width / Math.max(1, rect.width);
    const scaleY = VIEWPORT.height / Math.max(1, rect.height);
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  isDown(...codes) {
    for (const c of codes) {
      if (this.keys.has(c)) return true;
    }
    return false;
  }

  wasPressed(...codes) {
    for (const c of codes) {
      if (this.justPressed.has(c)) return true;
    }
    return false;
  }

  getMoveAxis() {
    const left = this.isDown('ArrowLeft', 'KeyA') ? 1 : 0;
    const right = this.isDown('ArrowRight', 'KeyD') ? 1 : 0;
    return right - left;
  }

  isJumpHeld() {
    return this.isDown('Space', 'ArrowUp', 'KeyW') || this.pointer.rightDown;
  }

  wasJumpPressed() {
    return this.wasPressed('Space', 'ArrowUp', 'KeyW', 'MouseRight');
  }

  wasDashPressed() {
    return this.wasPressed('ShiftLeft', 'ShiftRight', 'KeyJ');
  }

  isHideHeld() {
    return this.isDown('ArrowDown', 'KeyS', 'KeyE');
  }

  wasKickPressed() {
    return this.wasPressed('KeyF', 'KeyK');
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
    if (this.clicks.length === 0) return [];
    const copy = this.clicks.slice();
    this.clicks.length = 0;
    return copy;
  }

  endFrame() {
    this.justPressed.clear();
  }
}
