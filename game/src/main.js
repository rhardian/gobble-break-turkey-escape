// Bootstrapper for Gobble Break 3D: wires Three.js WebGL2 canvas, 2D HiDPI UI overlay, audio, and fixed-step loop.

import { AudioEngine } from './audio.js';
import { VIEWPORT } from './config.js';
import { InputController } from './input.js';
import { GameEngine } from './engine.js';

const webglCanvas = document.getElementById('webgl-canvas');
const uiCanvas = document.getElementById('ui-canvas');
webglCanvas.width = VIEWPORT.width;
webglCanvas.height = VIEWPORT.height;
uiCanvas.width = VIEWPORT.width;
uiCanvas.height = VIEWPORT.height;

const audio = new AudioEngine();
const input = new InputController(uiCanvas, () => audio.unlock());
const engine = new GameEngine(webglCanvas, uiCanvas, input, audio);

window.__gobbleBreak = engine;

let lastTime = performance.now();
let accumulator = 0;
const FIXED_DT = 1 / 60;

function frame(now) {
  const delta = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  accumulator += delta;

  while (accumulator >= FIXED_DT) {
    engine.update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  engine.render();
  requestAnimationFrame(frame);
}

engine.render();
requestAnimationFrame(frame);
