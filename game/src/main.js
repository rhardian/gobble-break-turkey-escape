// Entry bootstrapper for Gobble Break: wires canvas, audio, input, and fixed-step game loop.

import { AudioEngine } from './audio.js';
import { VIEWPORT } from './config.js';
import { InputController } from './input.js';
import { GameEngine } from './engine.js';

const canvas = document.getElementById('game-canvas');
const audio = new AudioEngine();
const input = new InputController(canvas, () => audio.unlock());
const engine = new GameEngine(canvas, input, audio);

canvas.width = VIEWPORT.width;
canvas.height = VIEWPORT.height;

// Expose engine instance for clean local testing & inspection
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
