// Theatrical 3/4 Side-View 3D Diorama World Builder for all 4 Thanksgiving Escape Zones (+X forward, Z depth).

import * as THREE from 'three';
import { STAGE_DEFS } from './config.js';
import { createGodRayMaterial, createSkyBackdropMaterial } from './shaders.js';
import {
  createCleaverPendulumMesh,
  createCoverPropMesh,
  createExitGateMesh,
  createKickPropMesh,
  createPickupMesh,
  createRoastingOvenMesh,
  createSculptedPumpkinMesh,
} from './models.js';

const stdMat = (p) => new THREE.MeshStandardMaterial(p);

export function build3DStageWorld(scene, stageIndex, rng, textures, loopCount = 0) {
  const def = STAGE_DEFS[stageIndex % STAGE_DEFS.length];
  const difficultyScale = 1 + loopCount * 0.22;
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const stage = {
    ...def,
    loopCount,
    difficultyScale,
    worldGroup,
    platforms: [],
    covers: [],
    ovens: [],
    pendulums: [],
    gravySpills: [],
    kickProps: [],
    pickups: [],
    windmills: [],
    shaderMats: [],
    skyBackdrop: null,
    exitX: def.length - 8,
  };

  // Animated GLSL Painterly Sky Backdrop Curtain (tracks camera X in GameEngine)
  const skyMat = createSkyBackdropMaterial(def.theme);
  stage.shaderMats.push(skyMat);
  const skyBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(78, 36), skyMat);
  skyBackdrop.position.set(16, 10.5, -24);
  worldGroup.add(skyBackdrop);
  stage.skyBackdrop = skyBackdrop;

  const floorLen = def.length + 46;
  const floorMat = def.theme === 'kitchen'
    ? stdMat({ map: textures.kitchenTile, roughness: 0.14, metalness: 0.1 })
    : def.theme === 'banquet'
      ? stdMat({ map: textures.banquetFloor, roughness: 0.34, metalness: 0.08 })
      : def.theme === 'barn'
        ? stdMat({ map: textures.woodPlank, roughness: 0.62 })
        : stdMat({ map: textures.farmGround, roughness: 0.82 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(floorLen, 0.7, 7.6), floorMat);
  floor.position.set(floorLen * 0.5 - 12, -0.35, 0);
  floor.receiveShadow = true;
  worldGroup.add(floor);

  if (def.theme === 'farmyard') buildFarmyardDiorama(stage, worldGroup, textures, rng);
  else if (def.theme === 'barn') buildBarnDiorama(stage, worldGroup, textures, rng);
  else if (def.theme === 'kitchen') buildKitchenDiorama(stage, worldGroup, textures, rng);
  else buildBanquetDiorama(stage, worldGroup, textures, rng);

  const isFinal = def.theme === 'banquet';
  const gate = createExitGateMesh(isFinal, textures);
  gate.position.set(stage.exitX, 0, 0);
  worldGroup.add(gate);

  if (isFinal) {
    const meadow = new THREE.Mesh(new THREE.PlaneGeometry(34, 24), stdMat({ color: 0x4b7026, roughness: 0.86 }));
    meadow.rotation.x = -Math.PI * 0.5;
    meadow.position.set(stage.exitX + 16, 0.02, -1);
    meadow.receiveShadow = true;
    worldGroup.add(meadow);
    for (const [tx, tz, sc] of [[4.2, -4.6, 1.15], [9.5, -5.2, 1.3], [14.5, -3.5, 1.05], [2.4, -7.2, 1.25], [8.0, 4.4, 0.85]]) {
      const tree = createSculptedMapleTree3D(rng, sc);
      tree.position.set(stage.exitX + tx, 0, tz);
      worldGroup.add(tree);
    }
    for (const [px, pz, s] of [[3.2, 2.8, 0.85], [6.4, 2.9, 1.05], [5.2, -2.9, 0.95]]) {
      const p = createSculptedPumpkinMesh(s);
      p.position.set(stage.exitX + px, 0, pz);
      worldGroup.add(p);
    }
  }
  return stage;
}

function addLayout(stage, textures, cfg) {
  for (const [x, z, w, d, h, style] of cfg.platforms || []) {
    const mat = style === 'hay' ? stdMat({ map: textures.hayWeave, roughness: 0.8 })
      : style === 'counter' ? stdMat({ color: 0xd9954c, roughness: 0.34 })
        : stdMat({ map: textures.gingham, roughness: 0.5 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, h * 0.5, z);
    mesh.castShadow = mesh.receiveShadow = true;
    stage.worldGroup.add(mesh);
    stage.platforms.push({ x, z, w, d, topY: h, mesh });
  }
  for (const [x, z, kind] of cfg.covers || []) {
    const mesh = createCoverPropMesh(kind, textures);
    mesh.position.set(x, 0, z);
    stage.worldGroup.add(mesh);
    stage.covers.push({ x, z, radius: 1.65, kind, mesh, rustle: 0 });
  }
  for (const [x, z, off, cyc, hearth] of cfg.ovens || []) {
    const rig = createRoastingOvenMesh(textures, Boolean(hearth));
    rig.group.position.set(x, 0, z);
    rig.group.rotation.y = -0.1;
    stage.worldGroup.add(rig.group);
    stage.shaderMats.push(rig.fireMat);
    const dur = cyc / stage.difficultyScale;
    stage.ovens.push({ x, z, flameRange: 4.7, cycleDuration: dur, timer: (off * dur) % dur, state: 'idle', blastedThisCycle: false, closeShaveGiven: false, ...rig });
  }
  for (const [x, z, phase, spd] of cfg.pendulums || []) {
    const rig = createCleaverPendulumMesh(5.8);
    rig.root.position.set(x, 0, z);
    stage.worldGroup.add(rig.root);
    stage.pendulums.push({ x, z, phase, speed: spd * stage.difficultyScale, maxAngle: 0.66, bobX: x, bobY: 1.5, closeShaveGiven: false, ...rig });
  }
  for (const [x, z, rx, rz] of cfg.gravy || []) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.05, 20), stdMat({ color: 0x6b3814, roughness: 0.12, metalness: 0.14 }));
    mesh.scale.set(rx, 1, rz);
    mesh.position.set(x, 0.025, z);
    mesh.receiveShadow = true;
    stage.worldGroup.add(mesh);
    stage.gravySpills.push({ x, z, rx, rz, mesh });
  }
  for (const [x, z, kind] of cfg.kicks || []) {
    const mesh = createKickPropMesh(kind);
    mesh.position.set(x, 0, z);
    stage.worldGroup.add(mesh);
    stage.kickProps.push({ x, y: 0, z, vx: 0, vy: 0, vz: 0, kind, kicked: false, used: false, mesh });
  }
  for (const [sx, z, count, step, kind, y, arcH] of cfg.pickups || []) {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const px = sx + i * step;
      const py = y + Math.sin(t * Math.PI) * arcH;
      const mesh = createPickupMesh(kind);
      mesh.position.set(px, py, z);
      stage.worldGroup.add(mesh);
      stage.pickups.push({ x: px, y: py, z, kind, collected: false, phase: i * 0.65, mesh });
    }
  }
}

function addGodRayBeam(stage, group, x, y, z, w, h, rotZ, colorHex, opacity) {
  const mat = createGodRayMaterial(colorHex, opacity);
  stage.shaderMats.push(mat);
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  beam.position.set(x, y, z);
  beam.rotation.z = rotZ;
  group.add(beam);
}

function buildFarmyardDiorama(stage, group, textures, rng) {
  const farHillMat = stdMat({ color: 0xa64e24, roughness: 0.92 });
  const midHillMat = stdMat({ color: 0x6e7826, roughness: 0.9 });
  for (let x = -12; x < stage.length + 34; x += 15) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 12), farHillMat);
    f.scale.set(1.5, 0.52, 0.85);
    f.position.set(x, -1.2, -17.5);
    const m = new THREE.Mesh(new THREE.SphereGeometry(9.5, 16, 12), midHillMat);
    m.scale.set(1.4, 0.36, 0.8);
    m.position.set(x + 6, -1.1, -11.5);
    group.add(f, m);
  }
  const backField = new THREE.Mesh(new THREE.PlaneGeometry(stage.length + 70, 24), stdMat({ color: 0x677c26, roughness: 0.9 }));
  backField.rotation.x = -Math.PI * 0.5;
  backField.position.set(stage.length * 0.5, -0.04, -10.5);
  backField.receiveShadow = true;
  group.add(backField);

  const woodMat = stdMat({ color: 0x693416, roughness: 0.74 });
  for (let x = -8; x <= stage.length + 14; x += 3.8) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.5, 0.24), woodMat);
    post.position.set(x, 0.75, -3.7);
    post.castShadow = true;
    group.add(post);
  }
  for (const ry of [0.54, 1.14]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(stage.length + 28, 0.14, 0.12), woodMat);
    rail.position.set(stage.length * 0.5, ry, -3.7);
    group.add(rail);
  }
  for (const [bx, bz] of [[24, -10.8], [64, -11.4], [102, -10.6]]) {
    const barn = createRedBarn3D();
    barn.position.set(bx, 0, bz);
    barn.rotation.y = -0.22;
    const wm = createWindmill3D();
    wm.group.position.set(bx + 7.4, 0, bz + 1.5);
    group.add(barn, wm.group);
    stage.windmills.push(wm.blades);
  }
  for (let x = -4; x < stage.length + 16; x += 7.5) {
    const tree = createSculptedMapleTree3D(rng, rng.range(0.95, 1.35));
    tree.position.set(x + rng.range(-1.4, 1.4), 0, -5.8 - rng.range(0, 3.2));
    group.add(tree);
  }
  for (let x = 10; x < stage.length; x += 18) addGodRayBeam(stage, group, x, 5.2, -4.6, 5.4, 11.5, -0.34, 0xffd578, 0.22);
  for (let x = 4; x < stage.length; x += 11) {
    const p = createSculptedPumpkinMesh(rng.range(0.68, 0.92));
    p.position.set(x, 0, 3.45);
    group.add(p);
  }
  addLayout(stage, textures, {
    platforms: [[19, -0.9, 4.4, 2.2, 1.35, 'hay'], [47, 0.5, 4.4, 2.2, 1.4, 'hay'], [75, -0.7, 4.6, 2.2, 1.4, 'hay'], [98, 0.3, 4.4, 2.2, 1.35, 'hay']],
    covers: [[15, -2, 'haystack'], [38, -2, 'pumpkinPatch'], [63, -2, 'haystack'], [88, -2, 'pumpkinPatch']],
    ovens: [[28, -0.4, 0.78, 3.5, 0], [55, 0.6, 0.3, 3.3, 0], [82, -0.4, 0.7, 3.15, 0], [104, 0.3, 0.2, 3.0, 0]],
    gravy: [[42, 0.2, 2.2, 1.4], [69, -0.3, 2.3, 1.5]],
    kicks: [[13, 0.4, 'pumpkin'], [34, 0.2, 'flourSack'], [60, -0.2, 'flourSack'], [85, 0.4, 'pumpkin']],
    pickups: [[17, -0.9, 4, 1.4, 'corn', 2.05, 0.75], [23, -0.4, 4, 1.3, 'cranberry', 1.8, 1.35], [45, 0.5, 4, 1.4, 'corn', 2.1, 0.75], [73, -0.7, 4, 1.4, 'cranberry', 2.1, 0.75], [98, 0.3, 1, 1, 'goldenFeather', 2.45, 0]],
  });
}

function buildBarnDiorama(stage, group, textures) {
  const wallMat = stdMat({ map: textures.woodPlank, roughness: 0.68 });
  const beamMat = stdMat({ color: 0x3b1a0b, roughness: 0.72 });
  const winGlowMat = new THREE.MeshBasicMaterial({ color: 0xffd275 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(stage.length + 34, 8.2, 0.6), wallMat);
  backWall.position.set(stage.length * 0.5, 4.1, -3.95);
  backWall.receiveShadow = true;
  group.add(backWall);

  for (let x = 6; x <= stage.length + 10; x += 14) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 8.2, 0.55), beamMat);
    pillar.position.set(x, 4.1, -3.55);
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 0.14), winGlowMat);
    win.position.set(x + 7, 5.2, -3.62);
    const lamp = new THREE.PointLight(0xffb84a, 2.0, 14);
    lamp.position.set(x + 7, 4.8, -1.6);
    group.add(pillar, win, lamp);
    addGodRayBeam(stage, group, x + 8.5, 3.1, -2.5, 3.6, 7.6, -0.42, 0xffcb66, 0.2);
  }
  addLayout(stage, textures, {
    platforms: [[20, -0.8, 4.6, 2.2, 1.4, 'hay'], [48, 0.5, 4.6, 2.2, 1.4, 'hay'], [76, -0.7, 4.8, 2.2, 1.4, 'hay'], [102, 0.4, 4.6, 2.2, 1.4, 'hay']],
    covers: [[16, -2.1, 'flourBarrel'], [37, -2.1, 'haystack'], [64, -2.1, 'flourBarrel'], [90, -2.1, 'haystack']],
    ovens: [[29, -0.3, 0.78, 3.25, 0], [56, 0.4, 0.28, 3.1, 0], [84, -0.4, 0.68, 3.0, 0], [108, 0.2, 0.2, 2.9, 0]],
    pendulums: [[40, 0, 0.4, 2.2], [69, -0.2, 1.6, 2.35], [96, 0.1, 2.7, 2.45]],
    gravy: [[48, -0.8, 2.2, 1.4], [86, 0.6, 2.3, 1.5]],
    kicks: [[14, 0.3, 'flourSack'], [43, 0.1, 'pumpkin'], [67, -0.2, 'flourSack'], [93, 0.3, 'flourSack']],
    pickups: [[18, -0.8, 4, 1.4, 'corn', 2.1, 0.7], [46, 0.5, 4, 1.4, 'cranberry', 2.1, 0.7], [74, -0.7, 4, 1.4, 'cranberry', 2.1, 0.7], [102, 0.4, 1, 1, 'goldenFeather', 2.5, 0]],
  });
}

function buildKitchenDiorama(stage, group, textures) {
  const brickMat = stdMat({ map: textures.brickWall, roughness: 0.64 });
  const trimMat = stdMat({ color: 0x3b1a0c, roughness: 0.58 });
  const winGlowMat = new THREE.MeshBasicMaterial({ color: 0xffd57a });
  const copperMat = stdMat({ color: 0xeb8438, metalness: 0.85, roughness: 0.2 });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(stage.length + 34, 8.6, 0.65), brickMat);
  backWall.position.set(stage.length * 0.5, 4.3, -3.95);
  backWall.receiveShadow = true;
  const wainscot = new THREE.Mesh(new THREE.BoxGeometry(stage.length + 34, 0.28, 0.18), trimMat);
  wainscot.position.set(stage.length * 0.5, 3.05, -3.56);
  group.add(backWall, wainscot);

  for (let x = 8; x < stage.length + 10; x += 16) {
    const winBg = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.35, 0.14), winGlowMat);
    winBg.position.set(x, 4.75, -3.6);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.48, 2.6, 0.1), trimMat);
    frame.position.set(x, 4.75, -3.64);
    const mV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.45, 0.18), trimMat);
    mV.position.set(x, 4.75, -3.54);
    const mH = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.14, 0.18), trimMat);
    mH.position.set(x, 4.75, -3.54);
    group.add(frame, winBg, mV, mH);
    addGodRayBeam(stage, group, x + 1.4, 2.65, -2.4, 3.8, 6.8, -0.36, 0xffcf6e, 0.18);

    const rackX = x + 8;
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.16, 0.45), trimMat);
    shelf.position.set(rackX, 5.15, -3.45);
    group.add(shelf);
    for (const dx of [-1.4, 0, 1.4]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.56, 16), copperMat);
      pot.position.set(rackX + dx, 4.42, -3.42);
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), trimMat);
      h.position.set(rackX + dx, 4.92, -3.42);
      group.add(pot, h);
    }
  }
  addLayout(stage, textures, {
    platforms: [[21, -0.8, 4.4, 2.2, 1.38, 'counter'], [49, 0.5, 4.4, 2.2, 1.38, 'counter'], [79, -0.8, 4.4, 2.2, 1.38, 'counter'], [108, 0.4, 4.4, 2.2, 1.38, 'counter']],
    covers: [[16, -2, 'kitchenTable'], [40, -2, 'kitchenTable'], [67, -2, 'kitchenTable'], [95, -2, 'kitchenTable']],
    ovens: [[31, -0.5, 0.8, 2.95, 1], [57, 0.5, 0.3, 2.85, 1], [74, -0.6, 0.78, 2.8, 1], [91, 0.4, 0.25, 2.75, 1], [113, -0.4, 0.72, 2.7, 1]],
    pendulums: [[27.2, 0.3, 0.55, 2.35], [64, -0.2, 1.7, 2.45], [101, 0.1, 0.3, 2.55]],
    gravy: [[45, 0.2, 2.2, 1.5], [84, -0.4, 2.3, 1.5]],
    kicks: [[14, 0.4, 'flourSack'], [36, 0.5, 'copperPot'], [62, -0.1, 'flourSack'], [92, 0.5, 'copperPot']],
    pickups: [[19, -0.8, 4, 1.35, 'cranberry', 2.15, 0.7], [26, -0.5, 4, 1.3, 'corn', 2.0, 1.4], [47, 0.5, 4, 1.35, 'cranberry', 2.15, 0.7], [77, -0.8, 4, 1.35, 'corn', 2.15, 0.7], [108, 0.4, 1, 1, 'goldenFeather', 2.5, 0]],
  });
}

function buildBanquetDiorama(stage, group, textures) {
  const wallMat = stdMat({ color: 0x57141d, roughness: 0.62 });
  const goldMat = stdMat({ color: 0xffc642, metalness: 0.84, roughness: 0.22 });
  const moonWinMat = new THREE.MeshBasicMaterial({ color: 0x9ac2ff });
  const candleMat = new THREE.MeshBasicMaterial({ color: 0xfff099 });

  const hallLen = stage.exitX + 12;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(hallLen, 8.8, 0.65), wallMat);
  backWall.position.set(hallLen * 0.5 - 12, 4.4, -3.95);
  backWall.receiveShadow = true;
  group.add(backWall);

  for (let x = 8; x < stage.exitX - 6; x += 16) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.8, 0.16), moonWinMat);
    win.position.set(x, 4.7, -3.6);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 10, 22), goldMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(x + 8, 5.7, -1.6);
    const chLight = new THREE.PointLight(0xffcb66, 2.2, 16);
    chLight.position.set(x + 8, 5.3, -1.0);
    group.add(win, ring, chLight);
    addGodRayBeam(stage, group, x + 1.2, 2.8, -2.4, 3.4, 7.2, -0.32, 0x9ec4ff, 0.16);
    for (let c = 0; c < 6; c++) {
      const a = (c / 6) * Math.PI * 2;
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), candleMat);
      fl.position.set(x + 8 + Math.cos(a) * 1.15, 5.95, -1.6 + Math.sin(a) * 1.15);
      group.add(fl);
    }
  }
  addLayout(stage, textures, {
    platforms: [[22, -0.7, 4.8, 2.2, 1.4, 'banquet'], [52, 0.5, 4.8, 2.2, 1.4, 'banquet'], [82, -0.7, 4.8, 2.2, 1.4, 'banquet'], [105, 0.4, 4.6, 2.2, 1.4, 'banquet']],
    covers: [[17, -2, 'kitchenTable'], [42, -2, 'kitchenTable'], [70, -2, 'kitchenTable'], [95, -2, 'kitchenTable']],
    ovens: [[30, -0.4, 0.76, 2.75, 1], [58, 0.4, 0.3, 2.65, 1], [80, -0.5, 0.72, 2.6, 1], [102, 0.3, 0.25, 2.55, 1]],
    pendulums: [[37, 0.1, 0.5, 2.5], [67, -0.2, 1.8, 2.6], [98, 0.1, 0.8, 2.7]],
    kicks: [[15, 0.4, 'flourSack'], [46, 0.3, 'copperPot'], [74, -0.2, 'flourSack'], [100, 0.4, 'copperPot']],
    pickups: [[20, -0.7, 4, 1.4, 'cranberry', 2.2, 0.7], [50, 0.5, 4, 1.4, 'corn', 2.2, 0.7], [80, -0.7, 4, 1.4, 'cranberry', 2.2, 0.7]],
  });
}

function createSculptedMapleTree3D(rng, scale = 1) {
  const g = new THREE.Group();
  const barkMat = stdMat({ color: 0x4f2410, roughness: 0.86 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.44, 2.9, 10), barkMat);
  trunk.position.y = 1.45;
  trunk.castShadow = true;
  g.add(trunk);
  for (const [ang, bx] of [[-0.52, -0.45], [0.48, 0.42]]) {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, 1.4, 8), barkMat);
    br.position.set(bx, 2.55, 0);
    br.rotation.z = ang;
    g.add(br);
  }
  const pal = rng.pick([[0xcf2f17, 0xed6a1c, 0xffb32b], [0xb82414, 0xe05216, 0xf79924], [0xd94816, 0xf7a428, 0xffd24d]]);
  const mats = pal.map((c) => stdMat({ color: c, roughness: 0.64 }));
  for (const [cx, cy, cz, rx, ry, rz, mi] of [[0, 3.65, 0, 1.48, 1.18, 1.32, 0], [-1.08, 3.05, 0.22, 1.05, 0.88, 0.98, 1], [1.1, 3.12, -0.18, 1.08, 0.92, 0.95, 1], [-0.52, 4.25, -0.2, 0.94, 0.82, 0.92, 2], [0.64, 4.18, 0.25, 0.9, 0.8, 0.9, 2], [0.12, 2.9, 0.72, 0.86, 0.74, 0.82, 0]]) {
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), mats[mi]);
    puff.scale.set(rx, ry, rz);
    puff.position.set(cx, cy, cz);
    puff.castShadow = true;
    g.add(puff);
  }
  g.scale.setScalar(scale);
  return g;
}

function createRedBarn3D() {
  const g = new THREE.Group();
  const redMat = stdMat({ color: 0xb02a1a, roughness: 0.68 });
  const roofMat = stdMat({ color: 0x3b1a11, roughness: 0.76 });
  const trimMat = stdMat({ color: 0xf7e7cb, roughness: 0.56 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(9.2, 5.2, 6.8), redMat);
  body.position.y = 2.6;
  body.castShadow = body.receiveShadow = true;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.6, 3.0, 4), roofMat);
  roof.rotation.y = Math.PI * 0.25;
  roof.scale.set(1.15, 1, 0.92);
  roof.position.y = 6.7;
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.7, 0.16), trimMat);
  doorFrame.position.set(0, 1.35, 3.42);
  const doorInner = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.4, 0.2), redMat);
  doorInner.position.set(0, 1.35, 3.43);
  const loftWin = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 0.2), new THREE.MeshBasicMaterial({ color: 0xffdf7d }));
  loftWin.position.set(0, 3.9, 3.42);
  const silo = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 7.6, 18), stdMat({ color: 0x872f1e, roughness: 0.7 }));
  silo.position.set(-5.8, 3.8, -0.6);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.48, 16, 12), roofMat);
  dome.position.set(-5.8, 7.6, -0.6);
  g.add(body, roof, doorFrame, doorInner, loftWin, silo, dome);
  for (const ang of [0.76, -0.76]) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 0.24), trimMat);
    cross.position.set(0, 1.35, 3.44);
    cross.rotation.z = ang;
    g.add(cross);
  }
  return g;
}

function createWindmill3D() {
  const group = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 1.0, 8.2, 6), stdMat({ color: 0x592b14, roughness: 0.74 }));
  tower.position.y = 4.1;
  const sailMat = stdMat({ color: 0xf2dbb0, roughness: 0.56 });
  const blades = new THREE.Group();
  blades.position.set(0, 7.7, 0.45);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.55, 0.08), sailMat);
    slat.position.y = 1.35;
    arm.add(slat);
    blades.add(arm);
  }
  group.add(tower, blades);
  return { group, blades };
}
