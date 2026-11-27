// Core game state machine, fixed-timestep loop, camera tracking, persistence, and live attract diorama.

import { SCORE_VALUES, STAGE_DEFS, STORAGE_KEYS, VIEWPORT } from './config.js';
import { createFarmer, updateFarmerAI } from './farmer.js';
import {
  spawnStageKnifeVolley,
  updateCarvingKnives,
  updateKickProps,
  updateOvens,
  updatePendulums,
  updatePickups,
} from './hazards.js';
import { ParticleSystem } from './particles.js';
import { renderScene } from './renderer.js';
import { createRng } from './rng.js';
import { buildStage } from './stages.js';
import { createSurfacePatterns } from './textures.js';
import { createTurkey, triggerDash, triggerKickOrGobble, updateTurkey } from './turkey.js';
import {
  getHudButtons,
  getOverlayButtons,
  hitTestButtons,
  renderEndOverlay,
  renderHud,
  renderPauseOverlay,
  renderTitleOverlay,
} from './ui.js';

export class GameEngine {
  constructor(canvas, input, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.audio = audio;
    this.patterns = createSurfacePatterns(this.ctx);
    this.particles = new ParticleSystem();

    this.mode = 'title'; // title | playing | paused | caught | escaped
    this.endless = false;
    this.seed = 20261127;
    this.rng = createRng(this.seed);
    this.time = 0;
    this.elapsedTime = 0;

    this.stageIndex = 0;
    this.loopCount = 0;
    this.stage = null;
    this.turkey = null;
    this.farmer = null;
    this.knives = [];
    this.knifeVolleyTimer = 2.4;

    this.cameraX = 0;
    this.prevCameraX = 0;
    this.score = 0;
    this.bestScore = this._loadBestScore();
    this.combo = 1;
    this.comboTimer = 0;
    this.distanceMeters = 0;
    this.totalEscapeMeters = STAGE_DEFS.reduce((acc, s) => acc + Math.round((s.length - 230) / 10), 0);
    this.stageBaseMeters = 0;
    this.closeShaves = 0;
    this.stuns = 0;
    this.stageBannerTimer = 0;
    this.caughtReason = '';

    this._setupTitleDiorama();
  }

  _loadBestScore() {
    try {
      const val = Number(window.localStorage.getItem(STORAGE_KEYS.bestScore));
      return Number.isFinite(val) && val > 0 ? val : 0;
    } catch {
      return 0;
    }
  }

  _saveBestScore() {
    if (this.score > this.bestScore) {
      this.bestScore = Math.floor(this.score);
      try {
        window.localStorage.setItem(STORAGE_KEYS.bestScore, String(this.bestScore));
      } catch {
        // Ignore storage restrictions in sandboxed environments
      }
    }
  }

  _setupTitleDiorama() {
    this.mode = 'title';
    this.rng = createRng(this.seed);
    this.particles.reset(this.rng);
    this.stage = buildStage(0, this.rng, 0);
    // Cleanly space title-diorama elements so Barnaby, Farmer Jeb, Roasting Oven & Knives each shine unobstructed!
    this.stage.covers = [
      { x: 1180, y: this.stage.groundY - 78, w: 98, h: 78, kind: 'haystack', searched: false, rustleTimer: 0 },
    ];
    this.stage.kickProps = [
      { x: 1120, y: this.stage.groundY - 22, vx: 0, vy: 0, radius: 22, kind: 'pumpkin', kicked: false, used: false, rot: 0 },
    ];
    this.stage.platforms = [
      { x: 1125, y: this.stage.groundY - 152, w: 170, h: 24, style: 'haybale' },
    ];
    this.stage.ovens[0].x = 955;
    this.stage.ovens[0].timer = this.stage.ovens[0].cycleDuration * 0.82;
    this.stage.ovens[0].state = 'blast';
    this.stage.ovens[0].doorOpen = 1;
    // Keep skyline right behind Barnaby clean in the title diorama
    this.stage.decor = this.stage.decor.filter((d) => Math.abs(d.x - 645) > 130);
    // Clean floating corn arc over Barnaby's flutter leap
    this.stage.pickups = [
      { x: 560, y: 452, kind: 'corn', collected: false, bobPhase: 0.2 },
      { x: 640, y: 416, kind: 'corn', collected: false, bobPhase: 1.0 },
      { x: 720, y: 432, kind: 'cranberry', collected: false, bobPhase: 1.8 },
      { x: 1015, y: 415, kind: 'goldenFeather', collected: false, bobPhase: 0.7 },
    ];

    this.turkey = createTurkey(645, this.stage.groundY - 38);
    this.turkey.vx = 250;
    this.turkey.facing = 1;
    this.farmer = createFarmer(this.stage);
    this.farmer.x = 345;
    this.farmer.alertTimer = 10;
    this.farmer.shoutText = 'DINNER TIME!';

    this.knives = [
      {
        x: 515,
        y: 422,
        vx: 310,
        vy: -25,
        gravity: 0,
        rot: -0.25,
        spin: 9,
        kind: 'thrown',
        telegraph: 0,
        life: 99,
        closeShaveGiven: false,
      },
      {
        x: 865,
        y: 410,
        vx: -280,
        vy: 30,
        gravity: 0,
        rot: Math.PI - 0.12,
        spin: 0,
        kind: 'slicer',
        telegraph: 0,
        life: 99,
        closeShaveGiven: false,
      },
    ];
    this.cameraX = 110;
    this.audio.setMusicState(false, 0);
  }

  startNewRun(endless = false, stageIndex = 0) {
    this.audio.unlock();
    this.endless = endless;
    this.mode = 'playing';
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.elapsedTime = 0;
    this.closeShaves = 0;
    this.stuns = 0;
    this.distanceMeters = 0;
    this.stageBaseMeters = 0;
    this.loopCount = 0;
    this.caughtReason = '';
    this.rng = createRng(this.seed + Math.floor(this.time * 100));
    this.particles.reset(this.rng);
    this._loadStage(stageIndex, true);
    this.audio.setMusicState(true, 0.25);
  }

  _loadStage(stageIndex, resetLives = false) {
    const prevLives = this.turkey ? this.turkey.lives : 3;
    this.stageIndex = stageIndex;
    this.stage = buildStage(stageIndex, this.rng, this.loopCount);
    this.turkey = createTurkey(320, this.stage.groundY);
    if (!resetLives) {
      this.turkey.lives = Math.min(this.turkey.maxLives, Math.max(1, prevLives));
    }
    this.farmer = createFarmer(this.stage);
    this.farmer.x = 76;
    this.farmer.alertTimer = 1.4;
    this.farmer.shoutText = this.stage.theme === 'kitchen' ? 'FIRE UP THE OVEN!' : 'GET THAT TURKEY!';
    this.knives = [];
    this.knifeVolleyTimer = Math.max(1.2, this.stage.knifeVolleyRate * 0.7);
    this.cameraX = 0;
    this.prevCameraX = 0;
    this.stageBannerTimer = 2.6;
  }

  addScore(points, label, color, x, y) {
    const total = Math.round(points * this.combo);
    this.score += total;
    this.combo = Math.min(8, this.combo + 1);
    this.comboTimer = 4.2;
    if (label && label.includes('SHAVE') || (label && label.includes('HOT'))) {
      this.closeShaves += 1;
    }
    if (label && (label.includes('BONK') || label.includes('FLOUR'))) {
      this.stuns += 1;
    }
    if (label) {
      this.particles.addCallout(x, y, label, color, 1.05);
    }
    this._saveBestScore();
  }

  update(dt) {
    this.time += dt;

    if (this.input.wasMutePressed()) {
      this.audio.unlock();
      this.audio.toggleMute();
    }

    const clicks = this.input.consumeClicks();

    if (this.mode === 'title') {
      this._updateTitleDiorama(dt, clicks);
      this.audio.update(dt);
      this.input.endFrame();
      return;
    }

    if (this.mode === 'paused') {
      if (this.input.wasPausePressed() || this.input.wasPressed('Space')) {
        this.mode = 'playing';
      } else if (this.input.wasRestartPressed()) {
        this.startNewRun(this.endless, 0);
      } else {
        for (const click of clicks) {
          const hit = hitTestButtons(getOverlayButtons('paused'), click.x, click.y);
          if (hit?.id === 'resume') this.mode = 'playing';
          if (hit?.id === 'restart') this.startNewRun(this.endless, 0);
          if (hit?.id === 'title') this._setupTitleDiorama();
        }
      }
      this.input.endFrame();
      return;
    }

    if (this.mode === 'caught' || this.mode === 'escaped') {
      this.particles.update(dt, 18);
      if (this.input.wasPressed('Space', 'Enter') || this.input.wasRestartPressed()) {
        this.startNewRun(this.endless, 0);
      } else {
        for (const click of clicks) {
          const hit = hitTestButtons(getOverlayButtons(this.mode), click.x, click.y);
          if (hit?.id === 'restart') this.startNewRun(this.endless, 0);
          if (hit?.id === 'title') this._setupTitleDiorama();
        }
      }
      this.input.endFrame();
      return;
    }

    // --- PLAYING STATE ---
    if (this.input.wasPausePressed()) {
      this.mode = 'paused';
      this.input.endFrame();
      return;
    }

    // Handle HUD clicks & mouse gameplay actions
    for (const click of clicks) {
      this.audio.unlock();
      const hudHit = hitTestButtons(getHudButtons(), click.x, click.y);
      if (hudHit?.id === 'mute') {
        this.audio.toggleMute();
        continue;
      }
      if (hudHit?.id === 'pause') {
        this.mode = 'paused';
        this.input.endFrame();
        return;
      }
      // Left-click in gameplay kicks nearby prop or dashes toward cursor!
      const kicked = triggerKickOrGobble(this.turkey, this.stage, this.farmer, this.audio, this.particles);
      if (!kicked) {
        const worldClickX = click.x + this.cameraX;
        const dir = worldClickX >= this.turkey.x ? 1 : -1;
        triggerDash(this.turkey, dir, this.audio, this.particles);
      }
    }

    // Brief comic hitstop freeze on dramatic close shaves or hits
    if (this.particles.hitstopTimer > 0) {
      this.particles.hitstopTimer = Math.max(0, this.particles.hitstopTimer - dt);
      this.particles.update(dt * 0.25, 0);
      this.input.endFrame();
      return;
    }

    this.elapsedTime += dt;
    this.stageBannerTimer = Math.max(0, this.stageBannerTimer - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    const onScore = (pts, label, color, x, y) => this.addScore(pts, label, color, x, y);

    updateTurkey(this.turkey, this.input, this.stage, this.farmer, dt, this.audio, this.particles, onScore);
    updateFarmerAI(this.farmer, this.turkey, this.stage, this.knives, dt, this.audio, this.particles, onScore);
    updateOvens(this.stage, this.turkey, dt, this.audio, this.particles, onScore);
    updatePendulums(this.stage, this.turkey, dt, this.audio, this.particles, onScore);
    updateKickProps(this.stage, this.farmer, dt, this.audio, this.particles, onScore);
    updatePickups(this.stage, this.turkey, dt, this.audio, this.particles, (item) => {
      const val = item.kind === 'goldenFeather'
        ? SCORE_VALUES.goldenFeather
        : item.kind === 'cranberry'
          ? SCORE_VALUES.cranberry
          : SCORE_VALUES.corn;
      const text = item.kind === 'goldenFeather' ? '+1 LIFE & +200' : `+${Math.round(val * this.combo)}`;
      this.addScore(val, text, item.kind === 'cranberry' ? '#ff7d88' : '#ffe066', item.x, item.y - 24);
    });

    // Periodic stage carving knife volleys
    this.knifeVolleyTimer -= dt;
    if (this.knifeVolleyTimer <= 0) {
      this.knifeVolleyTimer = Math.max(1.05, this.stage.knifeVolleyRate / this.stage.difficultyScale);
      spawnStageKnifeVolley(this.stage, this.turkey, this.knives, this.rng, this.audio);
    }
    updateCarvingKnives(this.knives, this.turkey, this.stage, dt, this.audio, this.particles, onScore);

    // Distance & continuous escape points
    const currentStageMeters = Math.max(0, (this.turkey.x - 320) / 10);
    const totalMetersNow = this.stageBaseMeters + currentStageMeters;
    if (totalMetersNow > this.distanceMeters) {
      this.score += (totalMetersNow - this.distanceMeters) * 2.2;
      this.distanceMeters = totalMetersNow;
      this._saveBestScore();
    }

    // Smooth look-ahead camera keeping both Barnaby and Farmer Jeb well-framed!
    const targetCamX = Math.max(
      0,
      Math.min(this.stage.length - VIEWPORT.width, this.turkey.x - VIEWPORT.width * 0.44 + this.turkey.facing * 60),
    );
    this.prevCameraX = this.cameraX;
    this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 7.5);
    const camSpeed = (this.cameraX - this.prevCameraX) / Math.max(0.001, dt);
    this.particles.update(dt, camSpeed);

    // Music tension increases as Farmer Jeb closes in or inside the Kitchen/Banquet
    const gap = Math.max(0, this.turkey.x - this.farmer.x);
    const proximityTension = Math.max(0, 1 - gap / 520);
    const stageTension = this.stageIndex * 0.14;
    this.audio.setMusicState(true, Math.min(1, proximityTension * 0.72 + stageTension));
    this.audio.update(dt);

    // Check loss condition (0 Feather Lives!)
    if (this.turkey.lives <= 0) {
      this.mode = 'caught';
      this.caughtReason = this.stage.theme === 'kitchen' || this.stage.theme === 'banquet'
        ? 'Chef Jeb got the carving platter ready — leap & hide to outsmart him!'
        : 'Farmer Jeb caught Barnaby in the farmyard — use Dash, Flutter & Cover!';
      this.audio.setMusicState(false, 0);
      this.audio.playCaught();
      this._saveBestScore();
      this.input.endFrame();
      return;
    }

    // Check stage exit gate!
    if (this.turkey.x >= this.stage.exitX + 24) {
      this.stageBaseMeters += Math.round((this.stage.exitX - 320) / 10);
      this.addScore(SCORE_VALUES.stageClear, 'ZONE CLEARED! +600', '#a5f56e', this.turkey.x, this.turkey.y - 90);
      this.particles.spawnFeathers(this.turkey.x, this.turkey.y - 36, 16, 260);

      if (!this.endless && this.stageIndex >= STAGE_DEFS.length - 1) {
        // GRAND VICTORY: ESCAPED THROUGH THE BANQUET FREEDOM WINDOW!
        this.score += SCORE_VALUES.freedomBonus + this.turkey.lives * SCORE_VALUES.lifeBonus;
        this._saveBestScore();
        this.mode = 'escaped';
        this.audio.setMusicState(false, 0);
        this.audio.playVictory();
      } else {
        const nextStage = (this.stageIndex + 1) % STAGE_DEFS.length;
        if (nextStage === 0) this.loopCount += 1;
        this.audio.playStageClear();
        this._loadStage(nextStage, false);
      }
    }

    this.input.endFrame();
  }

  _updateTitleDiorama(dt, clicks) {
    // Alive animated Thanksgiving chase diorama right behind the title crest!
    this.turkey.runCycle += dt * 9.5;
    this.turkey.wingFlap += dt * 16;
    this.turkey.y = this.stage.groundY - Math.abs(Math.sin(this.time * 4.4)) * 34;
    this.turkey.fluttering = this.turkey.y < this.stage.groundY - 12;
    this.farmer.runCycle += dt * 9.5;
    this.farmer.armSwing += dt * 9;
    this.farmer.x = 335 + Math.sin(this.time * 1.8) * 28;
    this.turkey.x = 675 + Math.sin(this.time * 1.8 + 0.5) * 32;

    const oven = this.stage.ovens[0];
    oven.state = 'blast';
    oven.doorOpen = 1;
    if (Math.random() < dt * 18) {
      this.particles.spawnEmbers(oven.x - 16, oven.y + 68, 1, -1);
    }

    // Bobbing/spinning decorative carving knives in the live scene
    this.knives[0].x = 490 + ((this.time * 190) % 210);
    this.knives[0].y = 435 - Math.sin(((this.time * 190) % 210) / 210 * Math.PI) * 58;
    this.knives[0].rot += dt * 10;

    this.knives[1].x = 960 - ((this.time * 220) % 230);
    this.knives[1].y = 468;

    this.particles.update(dt, 95);

    if (this.input.wasPressed('Space', 'Enter')) {
      this.startNewRun(false, 0);
      return;
    }
    for (const click of clicks) {
      const hit = hitTestButtons(getOverlayButtons('title'), click.x, click.y);
      if (hit?.id === 'play_story') this.startNewRun(false, 0);
      else if (hit?.id === 'play_endless') this.startNewRun(true, 0);
    }
  }

  render() {
    renderScene(this.ctx, this, this.patterns, this.time);

    if (this.mode === 'title') {
      renderTitleOverlay(this.ctx, this, this.patterns, this.input.pointer, this.time);
    } else {
      renderHud(this.ctx, this, this.patterns);
      if (this.mode === 'paused') {
        renderPauseOverlay(this.ctx, this.input.pointer, this.time);
      } else if (this.mode === 'caught' || this.mode === 'escaped') {
        renderEndOverlay(this.ctx, this, this.patterns, this.input.pointer, this.time);
      }
    }
  }
}
