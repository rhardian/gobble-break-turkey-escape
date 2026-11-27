// Master 3D Three.js WebGL2 GameEngine: PBR shadows, ACES Filmic lighting, 3rd-person chase camera, Perk progression.

import * as THREE from 'three';
import { PERK_DEFS, SCORE_VALUES, STAGE_DEFS, STORAGE_KEYS, VIEWPORT } from './config.js';
import { createRng } from './rng.js';
import { createPbrTextures } from './textures.js';
import { createCarvingKnifeMesh, createFarmerRig, createTurkeyRig } from './models.js';
import { build3DStageWorld } from './world.js';
import {
  createTurkeyState,
  syncTurkeyRig,
  triggerDash3D,
  triggerKickOrGobble3D,
  updateTurkey3D,
} from './turkey.js';
import { createFarmerState, syncFarmerRig, updateFarmerAI3D } from './farmer.js';
import {
  spawnStageKnifeVolley3D,
  updateKickProps3D,
  updateKnives3D,
  updateOvens3D,
  updatePendulums3D,
  updatePickups3D,
} from './hazards.js';
import { EffectsManager3D } from './particles3d.js';
import {
  getHudButtons,
  getOverlayButtons,
  hitTestButtons,
  renderEndScreen,
  renderHudOverlay,
  renderPauseScreen,
  renderPerkDraftOverlay,
  renderTitleScreen,
  renderWorldCallouts,
} from './ui.js';

export class GameEngine {
  constructor(webglCanvas, uiCanvas, input, audio) {
    this.webglCanvas = webglCanvas;
    this.uiCanvas = uiCanvas;
    this.uiCtx = uiCanvas.getContext('2d');
    this.input = input;
    this.audio = audio;

    // Hardware-accelerated WebGL2 Renderer with ACES Filmic Tone Mapping & Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      canvas: webglCanvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(VIEWPORT.width, VIEWPORT.height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, VIEWPORT.width / VIEWPORT.height, 0.4, 210);
    this.textures = createPbrTextures();
    this.parchmentPattern = this.uiCtx.createPattern(this.textures.parchmentCanvas, 'repeat');

    this._setupLighting();
    this.effects = new EffectsManager3D(this.scene);

    this.mode = 'title'; // title | playing | perk_draft | paused | caught | escaped
    this.endless = false;
    this.seed = 20261128;
    this.rng = createRng(this.seed);
    this.time = 0;
    this.elapsedTime = 0;

    this.stageIndex = 0;
    this.loopCount = 0;
    this.stage = null;
    this.turkey = null;
    this.farmer = null;
    this.knives = [];
    this.volleyTimer = 2.2;
    this.perks = new Set();
    this.perkChoices = [];

    this.score = 0;
    this.bestScore = this._loadBestScore();
    this.combo = 1;
    this.comboTimer = 0;
    this.distanceMeters = 0;
    this.stageBaseMeters = 0;
    this.totalEscapeMeters = STAGE_DEFS.reduce((acc, s) => acc + (s.length - 15), 0);
    this.closeShaves = 0;
    this.stuns = 0;
    this.stageBannerTimer = 0;
    this.caughtReason = '';

    this.camPos = new THREE.Vector3(0, 6.8, -4);
    this.camLook = new THREE.Vector3(0, 1.4, 12);

    this.setupTitleDiorama();
  }

  _setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xffe6b3, 0x592b14, 1.05);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffe29a, 2.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 75;
    const d = 22;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  _loadBestScore() {
    try {
      const v = Number(window.localStorage.getItem(STORAGE_KEYS.bestScore));
      return Number.isFinite(v) && v > 0 ? v : 0;
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
        // Ignore storage restrictions
      }
    }
  }

  _clearStageEntities() {
    if (this.stage?.worldGroup) this.scene.remove(this.stage.worldGroup);
    if (this.turkey?.rig?.root) this.scene.remove(this.turkey.rig.root);
    if (this.farmer?.rig?.root) this.scene.remove(this.farmer.rig.root);
    for (const k of this.knives) this.scene.remove(k.mesh);
    this.knives = [];
  }

  _applyStageAtmosphere(stage) {
    this.scene.background = new THREE.Color(stage.skyColor);
    this.scene.fog = new THREE.FogExp2(stage.fogColor, stage.fogDensity);
    this.sunLight.color.setHex(stage.sunColor);
    this.sunLight.intensity = stage.sunIntensity;
  }

  setupTitleDiorama() {
    this.mode = 'title';
    this._clearStageEntities();
    this.rng = createRng(this.seed);
    this.effects.reset(this.rng);

    this.stage = build3DStageWorld(this.scene, 0, this.rng, this.textures, 0);
    this._applyStageAtmosphere(this.stage);

    // Clear foreground pickups & close hay block in the hero diorama zone so Barnaby, Farmer Jeb & 450°F Oven read with zero clutter
    for (const p of this.stage.pickups) {
      if (p.z < 38) {
        p.collected = true;
        p.mesh.visible = false;
      }
    }
    if (this.stage.platforms[0]) {
      this.stage.platforms[0].mesh.visible = false;
    }

    const tRig = createTurkeyRig();
    this.scene.add(tRig.root);
    this.turkey = createTurkeyState(tRig, 24.3, new Set());
    this.turkey.x = -0.25;
    this.turkey.y = 0.95;
    this.turkey.yaw = -0.82;
    this.turkey.fluttering = true;

    const fRig = createFarmerRig('farmhand', this.textures);
    this.scene.add(fRig.root);
    this.farmer = createFarmerState(fRig, this.stage, 21.8);
    this.farmer.x = 2.25;
    this.farmer.yaw = -0.58;
    this.farmer.alertTimer = 99;
    this.farmer.shoutText = 'DINNER TIME!';

    // Position roaring 450°F Cast-Iron Oven cleanly on screen-RIGHT (-X) blasting flames inward!
    const heroOven = this.stage.ovens[1]; // left-wall/facingDir=+1 oven moved into hero right-hand frame
    heroOven.x = -5.45;
    heroOven.z = 26.8;
    heroOven.group.position.set(-5.45, 0, 26.8);
    heroOven.timer = heroOven.cycleDuration * 0.82;

    // Two gleaming forged 3D Carving Knives spinning mid-air!
    for (const [kx, ky, kz, rotY] of [[0.92, 1.72, 23.1, -0.45], [-2.15, 1.95, 25.5, 0.65]]) {
      const m = createCarvingKnifeMesh(1.32);
      m.position.set(kx, ky, kz);
      m.rotation.set(0.18, rotY, 0.28);
      this.scene.add(m);
      this.knives.push({ mesh: m, x: kx, y: ky, z: kz, vx: 0, vy: 0, vz: 0, gravity: 0, spin: 8, life: 99, closeShaveGiven: true });
    }

    // Hero Pixar low-angle 3/4 title camera!
    this.camPos.set(-1.95, 3.35, 16.8);
    this.camLook.set(0.15, 1.78, 27.5);
    this._syncSunToZ(24);
    this.audio.setMusicState(false, 0);
  }

  startNewRun(endless = false) {
    this.audio.unlock();
    this.endless = endless;
    this.mode = 'playing';
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.elapsedTime = 0;
    this.distanceMeters = 0;
    this.stageBaseMeters = 0;
    this.closeShaves = 0;
    this.stuns = 0;
    this.loopCount = 0;
    this.perks = new Set();
    this.rng = createRng(this.seed + Math.floor(this.time * 100));
    this._loadStage(0, true);
    this.audio.setMusicState(true, 0.28);
  }

  _loadStage(stageIndex, resetLives = false) {
    const prevLives = this.turkey ? this.turkey.lives : 3;
    this._clearStageEntities();
    this.stageIndex = stageIndex;
    this.effects.reset(this.rng);

    this.stage = build3DStageWorld(this.scene, stageIndex, this.rng, this.textures, this.loopCount);
    this._applyStageAtmosphere(this.stage);

    const tRig = createTurkeyRig();
    this.scene.add(tRig.root);
    this.turkey = createTurkeyState(tRig, 7.5, this.perks);
    if (!resetLives) {
      this.turkey.lives = Math.min(this.turkey.maxLives, Math.max(1, prevLives));
    }

    const fRig = createFarmerRig(this.stage.farmerOutfit, this.textures);
    this.scene.add(fRig.root);
    this.farmer = createFarmerState(fRig, this.stage, 1.5);

    this.volleyTimer = this.stage.volleyInterval * 0.75;
    this.stageBannerTimer = 2.6;

    this.camPos.set(this.turkey.x * 0.45 - 1.4, 6.8, this.turkey.z - 10.2);
    this.camLook.set(this.turkey.x * 0.55, 1.35, this.turkey.z + 5.8);
    this._syncSunToZ(this.turkey.z);
    syncTurkeyRig(this.turkey, 0.016, this.combo);
    syncFarmerRig(this.farmer, 0.016);
  }

  _syncSunToZ(focusZ) {
    this.sunLight.position.set(-14, 24, focusZ - 8);
    this.sunLight.target.position.set(0, 0, focusZ + 10);
    this.sunLight.target.updateMatrixWorld();
  }

  addScore(points, label, color, x, y, z) {
    const gained = Math.round(points * this.combo);
    this.score += gained;
    this.combo = Math.min(8, this.combo + 1);
    this.comboTimer = 4.2;
    if (label && (label.includes('SHAVE') || label.includes('HOT'))) this.closeShaves += 1;
    if (label && (label.includes('BONK') || label.includes('FLOUR'))) this.stuns += 1;
    if (label) this.effects.addCallout(x, y, z, label, color, 1.08);
    this._saveBestScore();
  }

  _openPerkDraft() {
    this.mode = 'perk_draft';
    const pool = PERK_DEFS.slice();
    this.perkChoices = pool.slice(0, 3);
  }

  _selectPerkAndAdvance(perk) {
    if (perk) {
      this.perks.add(perk.id);
      this.audio.playStageClear();
    }
    const nextIdx = (this.stageIndex + 1) % STAGE_DEFS.length;
    if (nextIdx === 0) this.loopCount += 1;
    this.mode = 'playing';
    this._loadStage(nextIdx, false);
    if (perk?.id === 'extra_plumage') {
      this.turkey.lives = Math.min(this.turkey.maxLives, this.turkey.lives + 1);
    }
  }

  update(dt) {
    this.time += dt;
    if (this.input.wasMutePressed()) {
      this.audio.unlock();
      this.audio.toggleMute();
    }

    const clicks = this.input.consumeClicks();

    // Rotate any 3D farm windmills
    if (this.stage?.windmills) {
      for (const blades of this.stage.windmills) blades.rotation.x += dt * 0.9;
    }

    if (this.mode === 'title') {
      this._updateTitleDiorama(dt, clicks);
      this.input.endFrame();
      return;
    }

    if (this.mode === 'perk_draft') {
      if (this.input.wasPressed('Digit1')) this._selectPerkAndAdvance(this.perkChoices[0]);
      else if (this.input.wasPressed('Digit2')) this._selectPerkAndAdvance(this.perkChoices[1]);
      else if (this.input.wasPressed('Digit3')) this._selectPerkAndAdvance(this.perkChoices[2]);
      else {
        for (const c of clicks) {
          const hit = hitTestButtons(getOverlayButtons('perk_draft', this.perkChoices), c.x, c.y);
          if (hit?.perk) {
            this._selectPerkAndAdvance(hit.perk);
            break;
          }
        }
      }
      this.input.endFrame();
      return;
    }

    if (this.mode === 'paused') {
      if (this.input.wasPausePressed() || this.input.wasPressed('Space')) this.mode = 'playing';
      else if (this.input.wasRestartPressed()) this.startNewRun(this.endless);
      else {
        for (const c of clicks) {
          const hit = hitTestButtons(getOverlayButtons('paused'), c.x, c.y);
          if (hit?.id === 'resume') this.mode = 'playing';
          if (hit?.id === 'restart') this.startNewRun(this.endless);
          if (hit?.id === 'title') this.setupTitleDiorama();
        }
      }
      this.input.endFrame();
      return;
    }

    if (this.mode === 'caught' || this.mode === 'escaped') {
      this.turkey.runCycle += dt * 6;
      if (this.mode === 'escaped') {
        this.turkey.y = 0.32 + Math.abs(Math.sin(this.time * 5.2)) * 0.38;
        this.turkey.yaw = 0.46 + Math.sin(this.time * 3.0) * 0.22;
        this.turkey.fluttering = true;
      }
      syncTurkeyRig(this.turkey, dt, 5);
      this.effects.update(dt, this.turkey.z);

      if (this.input.wasPressed('Space', 'Enter') || this.input.wasRestartPressed()) {
        this.startNewRun(this.endless);
      } else {
        for (const c of clicks) {
          const hit = hitTestButtons(getOverlayButtons(this.mode), c.x, c.y);
          if (hit?.id === 'restart') this.startNewRun(this.endless);
          if (hit?.id === 'title') this.setupTitleDiorama();
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

    for (const c of clicks) {
      const hudHit = hitTestButtons(getHudButtons(), c.x, c.y);
      if (hudHit?.id === 'mute') {
        this.audio.toggleMute();
        continue;
      }
      if (hudHit?.id === 'pause') {
        this.mode = 'paused';
        this.input.endFrame();
        return;
      }
      // Left-click triggers 3D Feather Dash!
      const mv = this.input.getMoveVector3D();
      triggerDash3D(this.turkey, mv.x, mv.z || 1, this.perks, this.audio, this.effects);
    }

    if (this.effects.hitstopTimer > 0) {
      this.effects.hitstopTimer = Math.max(0, this.effects.hitstopTimer - dt);
      this.input.endFrame();
      return;
    }

    this.elapsedTime += dt;
    this.stageBannerTimer = Math.max(0, this.stageBannerTimer - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    const onScore = (pts, label, col, x, y, z) => this.addScore(pts, label, col, x, y, z);

    updateTurkey3D(this.turkey, this.input, this.stage, this.farmer, this.knives, this.perks, dt, this.audio, this.effects, onScore, this.combo);
    updateFarmerAI3D(this.farmer, this.turkey, this.stage, this.knives, this.scene, dt, this.audio, this.effects);
    updateOvens3D(this.stage, this.turkey, this.time, dt, this.audio, this.effects, onScore);
    updatePendulums3D(this.stage, this.turkey, dt, this.audio, this.effects, onScore);
    updateKickProps3D(this.stage, this.farmer, this.perks, dt, this.audio, this.effects, onScore);
    updatePickups3D(this.stage, this.turkey, dt, this.audio, this.effects, (item) => {
      const val = item.kind === 'goldenFeather' ? SCORE_VALUES.goldenFeather : item.kind === 'cranberry' ? SCORE_VALUES.cranberry : SCORE_VALUES.corn;
      const txt = item.kind === 'goldenFeather' ? '+1 LIFE & +220' : `+${Math.round(val * this.combo)}`;
      this.addScore(val, txt, item.kind === 'cranberry' ? '#ff7d88' : '#ffe066', item.x, item.y + 0.8, item.z);
    });

    this.volleyTimer -= dt;
    if (this.volleyTimer <= 0) {
      this.volleyTimer = Math.max(0.95, this.stage.volleyInterval / this.stage.difficultyScale);
      spawnStageKnifeVolley3D(this.stage, this.turkey, this.knives, this.scene, this.rng, this.audio);
    }
    updateKnives3D(this.knives, this.turkey, this.scene, dt, this.audio, this.effects, onScore);

    // Distance progression
    const curMeters = Math.max(0, this.turkey.z - 7.5);
    const nowTotal = this.stageBaseMeters + curMeters;
    if (nowTotal > this.distanceMeters) {
      this.score += (nowTotal - this.distanceMeters) * 4.5;
      this.distanceMeters = nowTotal;
      this._saveBestScore();
    }

    // Smooth 3rd-person angled action chase camera
    const targetCamX = this.turkey.x * 0.52 - 1.5;
    const targetCamY = 6.75 + this.turkey.y * 0.35;
    const targetCamZ = this.turkey.z - 10.2;
    this.camPos.x += (targetCamX - this.camPos.x) * Math.min(1, dt * 6.5);
    this.camPos.y += (targetCamY - this.camPos.y) * Math.min(1, dt * 6.5);
    this.camPos.z += (targetCamZ - this.camPos.z) * Math.min(1, dt * 8.0);

    const lookX = this.turkey.x * 0.55;
    const lookY = 1.3 + this.turkey.y * 0.3;
    const lookZ = this.turkey.z + 5.8;
    this.camLook.x += (lookX - this.camLook.x) * Math.min(1, dt * 8.0);
    this.camLook.y += (lookY - this.camLook.y) * Math.min(1, dt * 8.0);
    this.camLook.z += (lookZ - this.camLook.z) * Math.min(1, dt * 9.0);

    this._syncSunToZ(this.turkey.z);
    this.effects.update(dt, this.turkey.z);

    const gap = Math.max(0, this.turkey.z - this.farmer.z);
    this.audio.setMusicState(true, Math.min(1, Math.max(0, 1 - gap / 16) * 0.7 + this.stageIndex * 0.12));
    this.audio.update(dt);

    // Check Caught condition
    if (this.turkey.lives <= 0) {
      this.mode = 'caught';
      this.caughtReason = this.stage.farmerOutfit === 'chef'
        ? 'Chef Jeb cornered Barnaby in the kitchen — dodge & kick flour sacks!'
        : 'Farmer Jeb caught Barnaby — use Space Flutter, Shift Dash & [E] Cover!';
      // Frame dramatic Split-Showcase Caught camera on the left side!
      this.camPos.set(this.turkey.x - 4.2, 3.6, this.turkey.z - 5.8);
      this.camLook.set(this.turkey.x + 1.8, 1.3, this.turkey.z + 0.5);
      this.audio.setMusicState(false, 0);
      this.audio.playCaught();
      this._saveBestScore();
      this.input.endFrame();
      return;
    }

    // Check Stage Exit Gate!
    if (this.turkey.z >= this.stage.exitZ) {
      this.stageBaseMeters += Math.round(this.stage.exitZ - 7.5);
      this.score += SCORE_VALUES.stageClear;
      this.effects.spawnFeathers(this.turkey.x, this.turkey.y + 1.0, this.turkey.z, 14, 6.5);

      if (!this.endless && this.stageIndex >= STAGE_DEFS.length - 1) {
        // GRAND VICTORY: SMASHED THROUGH THE BANQUET FREEDOM GATE!
        this.score += SCORE_VALUES.freedomBonus + this.turkey.lives * SCORE_VALUES.lifeBonus;
        this._saveBestScore();
        this.mode = 'escaped';
        // Camera looks back (-Z) toward Freedom Gate, so -X is screen-LEFT!
        this.turkey.x = -1.85;
        this.turkey.y = 0.42;
        this.turkey.z = this.stage.exitZ + 3.6;
        this.turkey.yaw = 0.48;
        this.turkey.fluttering = true;
        this.farmer.x = -0.85;
        this.farmer.z = this.stage.exitZ - 2.6;
        this.farmer.yaw = 0.12;
        this.farmer.state = 'blind';
        this.farmer.stateTimer = 99;
        syncTurkeyRig(this.turkey, 0.016, 6);
        syncFarmerRig(this.farmer, 0.016);
        // Unobstructed Split-Showcase camera: Barnaby & Freedom Gate on LEFT half, Victory Card on RIGHT half!
        this.camPos.set(0.0, 2.75, this.stage.exitZ + 8.6);
        this.camLook.set(0.42, 1.68, this.stage.exitZ - 1.0);
        this._syncSunToZ(this.stage.exitZ + 2);
        this.audio.setMusicState(false, 0);
        this.audio.playVictory();
      } else {
        this._openPerkDraft();
      }
    }

    this.input.endFrame();
  }

  _updateTitleDiorama(dt, clicks) {
    this.turkey.y = 0.65 + Math.abs(Math.sin(this.time * 4.2)) * 0.55;
    this.turkey.runCycle += dt * 11;
    this.turkey.fluttering = true;
    syncTurkeyRig(this.turkey, dt, 5);

    this.farmer.runCycle += dt * 10;
    syncFarmerRig(this.farmer, dt);

    const heroOven = this.stage.ovens[1];
    heroOven.timer = heroOven.cycleDuration * 0.82;
    updateOvens3D(this.stage, this.turkey, this.time, 0.001, this.audio, this.effects, () => {});

    for (const k of this.knives) {
      k.mesh.rotation.z += dt * 9;
    }
    this.effects.update(dt, 24);

    if (this.input.wasPressed('Space', 'Enter')) {
      this.startNewRun(false);
      return;
    }
    for (const c of clicks) {
      const hit = hitTestButtons(getOverlayButtons('title'), c.x, c.y);
      if (hit?.id === 'play_story') this.startNewRun(false);
      else if (hit?.id === 'play_endless') this.startNewRun(true);
    }
  }

  render() {
    const shake = this.effects.getShakeOffset();
    this.camera.position.set(this.camPos.x + shake.x, this.camPos.y + shake.y, this.camPos.z);
    this.camera.lookAt(this.camLook);

    this.renderer.render(this.scene, this.camera);

    const ctx = this.uiCtx;
    ctx.clearRect(0, 0, VIEWPORT.width, VIEWPORT.height);

    if (this.effects.flashAlpha > 0 && this.effects.flashColor) {
      ctx.save();
      ctx.globalAlpha = this.effects.flashAlpha;
      ctx.fillStyle = this.effects.flashColor;
      ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
      ctx.restore();
    }

    if (this.mode === 'title') {
      renderWorldCallouts(ctx, this);
      renderTitleScreen(ctx, this, this.input.pointer, this.time);
    } else if (this.mode === 'perk_draft') {
      renderHudOverlay(ctx, this);
      renderPerkDraftOverlay(ctx, this, this.input.pointer, this.time);
    } else if (this.mode === 'paused') {
      renderHudOverlay(ctx, this);
      renderPauseScreen(ctx, this.input.pointer, this.time);
    } else if (this.mode === 'caught' || this.mode === 'escaped') {
      renderWorldCallouts(ctx, this);
      renderHudOverlay(ctx, this);
      renderEndScreen(ctx, this, this.parchmentPattern, this.input.pointer, this.time);
    } else {
      renderWorldCallouts(ctx, this);
      renderHudOverlay(ctx, this);
    }
  }
}
