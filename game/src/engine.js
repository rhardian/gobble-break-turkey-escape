// Master 3D Three.js WebGL2 GameEngine: 38° Pixar 3/4 Diorama Camera, 3-point lighting, GLSL shaders, Perk Draft & Title/Victory Showcases.

import * as THREE from 'three';
import { PERK_DEFS, SCORE_VALUES, STAGE_DEFS, STORAGE_KEYS, VIEWPORT } from './config.js';
import { createRng } from './rng.js';
import { createPbrTextures } from './textures.js';
import { createCarvingKnifeMesh, createFarmerRig, createTurkeyRig } from './models.js';
import { build3DStageWorld } from './world.js';
import { createTurkeyState, syncTurkeyRig, triggerDash3D, updateTurkey3D } from './turkey.js';
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
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    // 38° cinematic telephoto diorama FOV eliminates distortion and gives huge readable silhouettes!
    this.camera = new THREE.PerspectiveCamera(38, VIEWPORT.width / VIEWPORT.height, 0.4, 180);
    this.textures = createPbrTextures();
    this.parchmentPattern = this.uiCtx.createPattern(this.textures.parchmentCanvas, 'repeat');

    this._setupThreePointLighting();
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
    this.volleyTimer = 2.4;
    this.perks = new Set();
    this.perkChoices = [];

    this.score = 0;
    this.bestScore = this._loadBestScore();
    this.combo = 1;
    this.comboTimer = 0;
    this.distanceMeters = 0;
    this.stageBaseMeters = 0;
    this.totalEscapeMeters = STAGE_DEFS.reduce((acc, s) => acc + (s.length - 14), 0);
    this.closeShaves = 0;
    this.stuns = 0;
    this.stageBannerTimer = 0;
    this.caughtReason = '';

    this.camPos = new THREE.Vector3(24, 3.0, 10.6);
    this.camLook = new THREE.Vector3(24, 1.9, -0.6);

    this.setupTitleDiorama();
  }

  _setupThreePointLighting() {
    // 1. Warm Autumn Bounce Hemisphere Light (prevents muddy dark shadows)
    this.hemiLight = new THREE.HemisphereLight(0xffdfad, 0x6b3518, 1.25);
    this.scene.add(this.hemiLight);

    // 2. Hero Key Sun Light from front-upper-left so faces & plumage glow warmly!
    this.sunLight = new THREE.DirectionalLight(0xffe09c, 2.55);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 65;
    const d = 18;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // 3. Crisp Specular Rim Light from upper-back-right for Pixar character edge separation!
    this.rimLight = new THREE.DirectionalLight(0xffb866, 1.15);
    this.rimLight.position.set(10, 12, -14);
    this.scene.add(this.rimLight);
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
    this.scene.background = new THREE.Color(stage.fogColor);
    this.scene.fog = new THREE.FogExp2(stage.fogColor, stage.fogDensity);
    this.sunLight.color.setHex(stage.sunColor);
    this.sunLight.intensity = stage.sunIntensity;
    this.hemiLight.color.setHex(stage.ambientSky);
    this.hemiLight.groundColor.setHex(stage.ambientGround);
  }

  setupTitleDiorama() {
    this.mode = 'title';
    this._clearStageEntities();
    this.rng = createRng(this.seed);
    this.effects.reset(this.rng);

    this.stage = build3DStageWorld(this.scene, 0, this.rng, this.textures, 0);
    this._applyStageAtmosphere(this.stage);

    // Keep the hero stage window spotless (clear colliding hay block & pickups in diorama zone)
    for (const p of this.stage.pickups) {
      if (p.x >= 16 && p.x <= 32) {
        p.collected = true;
        p.mesh.visible = false;
      }
    }
    if (this.stage.platforms[0]) this.stage.platforms[0].mesh.visible = false;

    const tRig = createTurkeyRig(this.textures);
    this.scene.add(tRig.root);
    this.turkey = createTurkeyState(tRig, 23.4, new Set());
    this.turkey.y = 1.48;
    this.turkey.z = 0.25;
    this.turkey.yaw = 0.86; // Expressive 3/4 face-front leap!
    this.turkey.fluttering = true;
    this.turkey.squawkTimer = 99;
    this.turkey.invulnTimer = 999;

    const fRig = createFarmerRig('farmhand', this.textures);
    this.scene.add(fRig.root);
    this.farmer = createFarmerState(fRig, this.stage, 19.7);
    this.farmer.z = 0.45;
    this.farmer.yaw = 0.88; // Full furious face, mustache, overalls & raised knife visible!
    this.farmer.state = 'lunge';
    this.farmer.alertTimer = 99;
    this.farmer.shoutText = 'DINNER TIME!';

    // Hero 450°F Cast-Iron Oven blasting volumetric GLSL flames right beneath Barnaby's leap!
    const heroOven = this.stage.ovens[0];
    heroOven.x = 27.9;
    heroOven.z = -0.1;
    heroOven.group.position.set(27.9, 0, -0.1);
    heroOven.timer = heroOven.cycleDuration * 0.82;

    // Gleaming Forged Carving Knife slicing diagonally above the flame with zero overlap on Barnaby!
    const knifeMesh = createCarvingKnifeMesh(1.12, true);
    knifeMesh.position.set(25.85, 2.85, 0.72);
    knifeMesh.rotation.set(0.08, 0.1, -1.86);
    this.scene.add(knifeMesh);
    this.knives.push({
      mesh: knifeMesh,
      x: 25.85,
      y: 2.85,
      z: 0.72,
      vx: 0,
      vy: 0,
      vz: 0,
      gravity: 0,
      spin: -8.5,
      life: 99,
      closeShaveGiven: true,
    });

    // Hero Pixar low-angle 3/4 theatrical camera leaving generous space below title buttons!
    this.camPos.set(23.85, 3.05, 11.15);
    this.camLook.set(23.95, 2.32, -0.8);
    this._syncLightsAndSky(24.0);
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

    const tRig = createTurkeyRig(this.textures);
    this.scene.add(tRig.root);
    this.turkey = createTurkeyState(tRig, 6.5, this.perks);
    if (!resetLives) this.turkey.lives = Math.min(this.turkey.maxLives, Math.max(1, prevLives));

    const fRig = createFarmerRig(this.stage.farmerOutfit, this.textures);
    this.scene.add(fRig.root);
    this.farmer = createFarmerState(fRig, this.stage, 1.5);

    this.volleyTimer = this.stage.volleyInterval * 0.78;
    this.stageBannerTimer = 2.6;

    this.camPos.set(this.turkey.x + 1.1, 4.15, 11.2);
    this.camLook.set(this.turkey.x + 1.3, 1.85, -0.5);
    this._syncLightsAndSky(this.turkey.x);
    syncTurkeyRig(this.turkey, 0.016, this.combo);
    syncFarmerRig(this.farmer, 0.016);
  }

  _syncLightsAndSky(focusX) {
    this.sunLight.position.set(focusX - 8, 18, 15);
    this.sunLight.target.position.set(focusX + 2, 0, -1);
    this.sunLight.target.updateMatrixWorld();
    if (this.stage?.skyBackdrop) {
      this.stage.skyBackdrop.position.x = focusX + 2;
    }
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
    this.perkChoices = PERK_DEFS.slice(0, 3);
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

    // Update animated GLSL shaders & farm windmills
    if (this.stage?.shaderMats) {
      for (const m of this.stage.shaderMats) {
        if (m.uniforms?.uTime) m.uniforms.uTime.value = this.time;
      }
    }
    if (this.stage?.windmills) {
      for (const blades of this.stage.windmills) blades.rotation.z -= dt * 0.9;
    }

    const clicks = this.input.consumeClicks();

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
        this.turkey.y = 0.2 + Math.abs(Math.sin(this.time * 5.2)) * 0.35;
        this.turkey.yaw = 0.38 + Math.sin(this.time * 2.8) * 0.16;
        this.turkey.fluttering = true;
        this.farmer.dizzyAngle += dt * 4.5;
      }
      syncTurkeyRig(this.turkey, dt, 5);
      syncFarmerRig(this.farmer, dt);
      this.effects.update(dt, this.turkey.x);

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
      const mv = this.input.getMoveVector3D();
      triggerDash3D(this.turkey, mv.x || 1, mv.z, this.perks, this.audio, this.effects);
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
      const txt = item.kind === 'goldenFeather' ? '+1 LIFE & +240' : `+${Math.round(val * this.combo)}`;
      this.addScore(val, txt, item.kind === 'cranberry' ? '#ff7d88' : '#ffe066', item.x, item.y + 0.85, item.z);
    });

    this.volleyTimer -= dt;
    if (this.volleyTimer <= 0) {
      this.volleyTimer = Math.max(1.0, this.stage.volleyInterval / this.stage.difficultyScale);
      spawnStageKnifeVolley3D(this.stage, this.turkey, this.knives, this.scene, this.rng, this.audio);
    }
    updateKnives3D(this.knives, this.turkey, this.scene, dt, this.audio, this.effects, onScore);

    const curMeters = Math.max(0, this.turkey.x - 6.5);
    const nowTotal = this.stageBaseMeters + curMeters;
    if (nowTotal > this.distanceMeters) {
      this.score += (nowTotal - this.distanceMeters) * 4.5;
      this.distanceMeters = nowTotal;
      this._saveBestScore();
    }

    // Smooth 3/4 Side-Scrolling 3D Diorama Camera!
    const targetCamX = this.turkey.x + 1.0;
    const targetCamY = 4.1 + this.turkey.y * 0.25;
    const targetCamZ = 11.1 + this.turkey.z * 0.25;
    this.camPos.x += (targetCamX - this.camPos.x) * Math.min(1, dt * 7.5);
    this.camPos.y += (targetCamY - this.camPos.y) * Math.min(1, dt * 6.5);
    this.camPos.z += (targetCamZ - this.camPos.z) * Math.min(1, dt * 6.5);

    const lookX = this.turkey.x + 1.25;
    const lookY = 1.85 + this.turkey.y * 0.2;
    this.camLook.x += (lookX - this.camLook.x) * Math.min(1, dt * 8.5);
    this.camLook.y += (lookY - this.camLook.y) * Math.min(1, dt * 7.5);
    this.camLook.z += (-0.45 - this.camLook.z) * Math.min(1, dt * 7.5);

    this._syncLightsAndSky(this.turkey.x);
    this.effects.update(dt, this.turkey.x);

    const gap = Math.max(0, this.turkey.x - this.farmer.x);
    this.audio.setMusicState(true, Math.min(1, Math.max(0, 1 - gap / 15) * 0.72 + this.stageIndex * 0.12));
    this.audio.update(dt);

    // Check Caught condition
    if (this.turkey.lives <= 0) {
      this.mode = 'caught';
      this.caughtReason = this.stage.farmerOutfit === 'chef'
        ? 'Chef Jeb cornered Barnaby in the kitchen — kick flour sacks & flutter!'
        : 'Farmer Jeb caught Barnaby — use Space Flutter, Shift Dash & [E] Cover!';
      this.camPos.set(this.turkey.x + 2.4, 2.7, 7.6);
      this.camLook.set(this.turkey.x + 2.0, 1.55, 0);
      this.audio.setMusicState(false, 0);
      this.audio.playCaught();
      this._saveBestScore();
      this.input.endFrame();
      return;
    }

    // Check Stage Exit / Grand Freedom Doors!
    if (this.turkey.x >= this.stage.exitX) {
      this.stageBaseMeters += Math.round(this.stage.exitX - 6.5);
      this.score += SCORE_VALUES.stageClear;
      this.effects.spawnFeathers(this.turkey.x, this.turkey.y + 1.0, this.turkey.z, 14, 6.2);

      if (!this.endless && this.stageIndex >= STAGE_DEFS.length - 1) {
        this.score += SCORE_VALUES.freedomBonus + this.turkey.lives * SCORE_VALUES.lifeBonus;
        this._saveBestScore();
        this.mode = 'escaped';
        // Position Barnaby triumphantly outside the Freedom Doors & stunned flour-blinded Chef Jeb clearly visible right behind him!
        this.turkey.x = this.stage.exitX + 2.45;
        this.turkey.y = 0.22;
        this.turkey.z = 1.65;
        this.turkey.yaw = 0.28;
        this.turkey.fluttering = true;
        this.turkey.squawkTimer = 99;
        this.farmer.x = this.stage.exitX + 0.65;
        this.farmer.z = -0.35;
        this.farmer.yaw = 0.34;
        this.farmer.state = 'blind';
        this.farmer.stateTimer = 99;
        this.farmer.dizzyAngle = 0.8;
        syncTurkeyRig(this.turkey, 0.016, 6);
        syncFarmerRig(this.farmer, 0.016);
        // Unobstructed Split-Showcase Victory Camera: BOTH Barnaby & Dizzy Chef Jeb framed cleanly on LEFT half, Victory Card on RIGHT!
        this.camPos.set(this.stage.exitX + 3.55, 2.45, 8.35);
        this.camLook.set(this.stage.exitX + 3.45, 1.65, -0.4);
        this._syncLightsAndSky(this.stage.exitX + 3);
        this.audio.setMusicState(false, 0);
        this.audio.playVictory();
      } else {
        this._openPerkDraft();
      }
    }

    this.input.endFrame();
  }

  _updateTitleDiorama(dt, clicks) {
    this.turkey.y = 1.08 + Math.abs(Math.sin(this.time * 4.4)) * 0.28;
    this.turkey.invulnTimer = 999;
    this.turkey.runCycle += dt * 11;
    this.turkey.fluttering = true;
    syncTurkeyRig(this.turkey, dt, 5);
    this.turkey.rig.root.visible = true; // never blink invisible on title screen!

    this.farmer.runCycle += dt * 10;
    syncFarmerRig(this.farmer, dt);

    const heroOven = this.stage.ovens[0];
    heroOven.timer = heroOven.cycleDuration * 0.82;
    heroOven.fireMat.uniforms.uTime.value = this.time;
    heroOven.state = 'blast';
    heroOven.doorPivot.rotation.z = 1.42;
    heroOven.flameGroup.visible = true;
    heroOven.fireLight.intensity = 6.8;

    for (const k of this.knives) k.mesh.rotation.z += dt * -8.5;
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
