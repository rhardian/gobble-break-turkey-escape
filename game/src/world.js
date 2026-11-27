// 3D Stage World & Architectural Environment Builder for all 4 Thanksgiving Escape Zones.

import * as THREE from 'three';
import { STAGE_DEFS, WORLD } from './config.js';
import {
  createCleaverPendulumMesh,
  createCoverPropMesh,
  createExitGateMesh,
  createKickPropMesh,
  createPickupMesh,
  createRoastingOvenMesh,
} from './models.js';

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
    exitZ: def.length - 8,
  };

  // Main Ground / Floor Slab
  const floorLen = def.length + 34;
  let floorMat;
  if (def.theme === 'kitchen') {
    floorMat = new THREE.MeshStandardMaterial({ map: textures.kitchenTile, roughness: 0.16, metalness: 0.08 });
  } else if (def.theme === 'banquet') {
    floorMat = new THREE.MeshStandardMaterial({ map: textures.banquetFloor, roughness: 0.34, metalness: 0.06 });
  } else if (def.theme === 'barn') {
    floorMat = new THREE.MeshStandardMaterial({ map: textures.woodPlank, roughness: 0.62 });
  } else {
    floorMat = new THREE.MeshStandardMaterial({ map: textures.farmGround, roughness: 0.82 });
  }

  const floor = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.6, floorLen), floorMat);
  floor.position.set(0, -0.3, floorLen * 0.5 - 12);
  floor.receiveShadow = true;
  worldGroup.add(floor);

  // Painted 3D Sky Dome (encloses entire course with sunset clouds or starry harvest moon, unaffected by fog!)
  const skyTex = def.theme === 'banquet' ? textures.skyMoonlit : textures.skyAutumn;
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(182, 32, 20),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  skyDome.position.set(0, 0, def.length * 0.5);
  worldGroup.add(skyDome);

  // Build architectural backdrop & props per theme
  if (def.theme === 'farmyard') {
    buildFarmyardScenery(stage, worldGroup, textures, rng);
  } else if (def.theme === 'barn') {
    buildBarnScenery(stage, worldGroup, textures, rng);
  } else if (def.theme === 'kitchen') {
    buildKitchenScenery(stage, worldGroup, textures, rng);
  } else {
    buildBanquetScenery(stage, worldGroup, textures, rng);
  }

  // Exit Gate / Freedom Portal at the end of the course
  const isFinal = def.theme === 'banquet';
  const gate = createExitGateMesh(isFinal, textures);
  gate.position.set(0, 0, stage.exitZ);
  worldGroup.add(gate);

  // Beyond-the-gate Autumn Maple Freedom Vista for Banquet finale!
  if (isFinal) {
    const meadow = new THREE.Mesh(
      new THREE.PlaneGeometry(54, 42),
      new THREE.MeshStandardMaterial({ color: 0x5c7d2c, roughness: 0.85 }),
    );
    meadow.rotation.x = -Math.PI * 0.5;
    meadow.position.set(0, 0.02, stage.exitZ + 18);
    meadow.receiveShadow = true;
    worldGroup.add(meadow);
    for (const [tx, tz] of [[-5.2, 2.8], [-6.4, 7.5], [5.8, 7.0], [-4.2, 13.5], [4.5, 14.5], [0.5, 17.5]]) {
      const tree = createAutumnTree3D(rng);
      tree.position.set(tx, 0, stage.exitZ + tz);
      worldGroup.add(tree);
    }
  }

  return stage;
}

function addPlatform3D(stage, x, z, w, d, h, style, textures) {
  const mat = style === 'hay'
    ? new THREE.MeshStandardMaterial({ map: textures.hayWeave, roughness: 0.82 })
    : style === 'counter'
      ? new THREE.MeshStandardMaterial({ color: 0xd4924a, roughness: 0.36 })
      : new THREE.MeshStandardMaterial({ map: textures.gingham, roughness: 0.52 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, h * 0.5, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  stage.worldGroup.add(mesh);
  stage.platforms.push({ x, z, w, d, topY: h, mesh });
}

function addCover3D(stage, x, z, kind, textures) {
  const mesh = createCoverPropMesh(kind, textures);
  mesh.position.set(x, 0, z);
  stage.worldGroup.add(mesh);
  stage.covers.push({ x, z, radius: 1.55, kind, mesh, rustle: 0 });
}

function addOven3D(stage, side, z, offsetRatio, cycleDuration) {
  // side: -1 places oven on left wall blasting +X; +1 places oven on right wall blasting -X!
  const facingDir = side < 0 ? 1 : -1;
  const x = side * 6.55;
  const ovenRig = createRoastingOvenMesh(facingDir);
  ovenRig.group.position.set(x, 0, z);
  stage.worldGroup.add(ovenRig.group);
  stage.ovens.push({
    x,
    z,
    facingDir,
    flameRange: 4.5,
    cycleDuration,
    timer: (offsetRatio * cycleDuration) % cycleDuration,
    state: 'idle',
    blastedThisCycle: false,
    closeShaveGiven: false,
    ...ovenRig,
  });
}

function addPendulum3D(stage, z, phase, speed = 2.15) {
  const rig = createCleaverPendulumMesh(5.5);
  rig.root.position.set(0, 0, z);
  stage.worldGroup.add(rig.root);
  stage.pendulums.push({
    z,
    phase,
    speed,
    maxAngle: 0.68,
    bobX: 0,
    bobY: 1.4,
    closeShaveGiven: false,
    ...rig,
  });
}

function addGravy3D(stage, x, z, rx = 2.1, rz = 1.8) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.06, 20),
    new THREE.MeshStandardMaterial({ color: 0x6b3814, roughness: 0.14, metalness: 0.12 }),
  );
  mesh.scale.set(rx, 1, rz);
  mesh.position.set(x, 0.03, z);
  mesh.receiveShadow = true;
  stage.worldGroup.add(mesh);
  stage.gravySpills.push({ x, z, rx, rz, mesh });
}

function addKickProp3D(stage, x, z, kind, y = 0) {
  const mesh = createKickPropMesh(kind);
  mesh.position.set(x, y, z);
  stage.worldGroup.add(mesh);
  stage.kickProps.push({
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    kind,
    kicked: false,
    used: false,
    mesh,
  });
}

function addPickupLine3D(stage, x, startZ, count, stepZ, kind = 'corn', y = 0.85, arcH = 0) {
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const py = y + Math.sin(t * Math.PI) * arcH;
    const pz = startZ + i * stepZ;
    const mesh = createPickupMesh(kind);
    mesh.position.set(x, py, pz);
    stage.worldGroup.add(mesh);
    stage.pickups.push({ x, y: py, z: pz, kind, collected: false, phase: i * 0.65, mesh });
  }
}

function buildFarmyardScenery(stage, group, textures, rng) {
  // Outer golden autumn rolling meadow ground
  const outer = new THREE.Mesh(
    new THREE.PlaneGeometry(110, stage.length + 80),
    new THREE.MeshStandardMaterial({ color: 0x705621, roughness: 0.9 }),
  );
  outer.rotation.x = -Math.PI * 0.5;
  outer.position.set(0, -0.05, stage.length * 0.5);
  outer.receiveShadow = true;
  group.add(outer);

  // Split-rail wooden fences along X = -7.6 and +7.6
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x633216, roughness: 0.75 });
  for (const side of [-1, 1]) {
    const fx = side * WORLD.wallX;
    for (let z = -6; z <= stage.length + 6; z += 4.5) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.45, 0.24), woodMat);
      post.position.set(fx, 0.72, z);
      post.castShadow = true;
      group.add(post);
    }
    for (const ry of [0.52, 1.08]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, stage.length + 14), woodMat);
      rail.position.set(fx, ry, stage.length * 0.5);
      rail.castShadow = true;
      group.add(rail);
    }
  }

  // Hero Red Gambrel Barn + Stone Silo + Spinning Windmill flanking the farmyard!
  for (const [bx, bz, flip] of [[-14.5, 26, 1], [15.0, 68, -1], [-14.8, 102, 1]]) {
    const barn = createRedBarn3D();
    barn.position.set(bx, 0, bz);
    barn.rotation.y = flip * 0.35;
    group.add(barn);

    const wm = createWindmill3D();
    wm.group.position.set(bx + flip * 2.5, 0, bz + 9);
    group.add(wm.group);
    stage.windmills.push(wm.blades);
  }

  // Lush 3D Autumn Maple Trees lining both sides of the farm lane!
  for (let z = 4; z < stage.length + 8; z += 8.5) {
    for (const side of [-1, 1]) {
      if (Math.abs(z - 26) < 6 && side < 0) continue;
      const tree = createAutumnTree3D(rng);
      tree.position.set(side * rng.range(9.6, 15.5), 0, z + rng.range(-2, 2));
      group.add(tree);
    }
  }

  // Gameplay layout: Hay-bale platforms, Haystack & Pumpkin covers, Ovens, Flour Sacks, Pickups!
  addPlatform3D(stage, -2.6, 22, 3.2, 4.4, 1.25, 'hay', textures);
  addPlatform3D(stage, 2.8, 48, 3.2, 4.6, 1.3, 'hay', textures);
  addPlatform3D(stage, -2.4, 76, 3.4, 4.6, 1.3, 'hay', textures);
  addPlatform3D(stage, 2.4, 98, 3.2, 4.4, 1.25, 'hay', textures);

  addCover3D(stage, 3.2, 18, 'haystack', textures);
  addCover3D(stage, -3.4, 38, 'pumpkinPatch', textures);
  addCover3D(stage, 3.4, 62, 'haystack', textures);
  addCover3D(stage, -3.2, 88, 'pumpkinPatch', textures);

  addOven3D(stage, 1, 30, 0.72, 3.6 / stage.difficultyScale);
  addOven3D(stage, -1, 56, 0.25, 3.4 / stage.difficultyScale);
  addOven3D(stage, 1, 82, 0.65, 3.2 / stage.difficultyScale);
  addOven3D(stage, -1, 104, 0.15, 3.1 / stage.difficultyScale);

  addGravy3D(stage, 0.5, 42, 2.3, 1.9);
  addGravy3D(stage, -0.8, 70, 2.4, 2.0);

  addKickProp3D(stage, -1.6, 15, 'pumpkin');
  addKickProp3D(stage, 1.8, 35, 'flourSack');
  addKickProp3D(stage, -1.8, 60, 'flourSack');
  addKickProp3D(stage, 1.6, 85, 'pumpkin');

  addPickupLine3D(stage, -2.6, 19, 4, 2.0, 'corn', 2.05, 0.7);
  addPickupLine3D(stage, 0, 28, 4, 2.4, 'cranberry', 0.9, 0);
  addPickupLine3D(stage, 2.8, 45, 4, 2.1, 'corn', 2.1, 0.7);
  addPickupLine3D(stage, -2.4, 73, 4, 2.1, 'cranberry', 2.1, 0.7);
  addPickupLine3D(stage, 0, 92, 5, 2.2, 'corn', 0.95, 0.5);
  addPickupLine3D(stage, 2.4, 98, 1, 1, 'goldenFeather', 2.45, 0);
}

function buildBarnScenery(stage, group, textures, rng) {
  const wallMat = new THREE.MeshStandardMaterial({ map: textures.woodPlank, roughness: 0.7 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x3b1b0c, roughness: 0.75 });

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.2, stage.length + 24), wallMat);
    wall.position.set(side * 8.1, 3.6, stage.length * 0.5);
    wall.receiveShadow = true;
    group.add(wall);
  }

  for (let z = 0; z <= stage.length + 10; z += 11) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.45, 0.45), beamMat);
    rafter.position.set(0, 6.4, z);
    group.add(rafter);

    const lantern = new THREE.PointLight(0xffb84a, 1.6, 15);
    lantern.position.set((z % 22 === 0 ? -1 : 1) * 4.5, 4.8, z);
    group.add(lantern);
  }

  addPlatform3D(stage, -2.8, 20, 3.4, 4.8, 1.3, 'hay', textures);
  addPlatform3D(stage, 2.8, 46, 3.4, 4.8, 1.35, 'hay', textures);
  addPlatform3D(stage, -2.6, 74, 3.5, 5.0, 1.35, 'hay', textures);
  addPlatform3D(stage, 2.6, 102, 3.4, 4.8, 1.3, 'hay', textures);

  addCover3D(stage, 3.2, 16, 'flourBarrel', textures);
  addCover3D(stage, -3.3, 36, 'haystack', textures);
  addCover3D(stage, 3.4, 62, 'flourBarrel', textures);
  addCover3D(stage, -3.2, 90, 'haystack', textures);

  addOven3D(stage, 1, 28, 0.75, 3.3 / stage.difficultyScale);
  addOven3D(stage, -1, 54, 0.25, 3.1 / stage.difficultyScale);
  addOven3D(stage, 1, 82, 0.65, 3.0 / stage.difficultyScale);
  addOven3D(stage, -1, 108, 0.2, 2.9 / stage.difficultyScale);

  addPendulum3D(stage, 39, 0.4, 2.2 * stage.difficultyScale);
  addPendulum3D(stage, 68, 1.7, 2.35 * stage.difficultyScale);
  addPendulum3D(stage, 96, 2.8, 2.45 * stage.difficultyScale);

  addGravy3D(stage, 0, 48, 2.3, 1.9);
  addGravy3D(stage, 0.4, 86, 2.4, 2.0);

  addKickProp3D(stage, -1.5, 14, 'flourSack');
  addKickProp3D(stage, 1.6, 42, 'pumpkin');
  addKickProp3D(stage, -1.7, 66, 'flourSack');
  addKickProp3D(stage, 1.5, 94, 'flourSack');

  addPickupLine3D(stage, -2.8, 17, 4, 2.1, 'corn', 2.1, 0.6);
  addPickupLine3D(stage, 2.8, 43, 4, 2.1, 'cranberry', 2.15, 0.6);
  addPickupLine3D(stage, 0, 60, 4, 2.3, 'corn', 0.9, 0);
  addPickupLine3D(stage, -2.6, 71, 4, 2.1, 'cranberry', 2.15, 0.6);
  addPickupLine3D(stage, 2.6, 102, 1, 1, 'goldenFeather', 2.5, 0);
  void rng;
}

function buildKitchenScenery(stage, group, textures, rng) {
  const brickMat = new THREE.MeshStandardMaterial({ map: textures.brickWall, roughness: 0.68 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x3b190c, roughness: 0.6 });
  const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xffcf70 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xe37e36, metalness: 0.82, roughness: 0.22 });

  // Left & Right Brick Hearth Kitchen Walls with glowing sunset cottage windows!
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7.6, stage.length + 24), brickMat);
    wall.position.set(side * 8.15, 3.8, stage.length * 0.5);
    wall.receiveShadow = true;
    group.add(wall);

    for (let z = 14; z < stage.length; z += 22) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.1, 2.8), windowGlowMat);
      win.position.set(side * 7.75, 4.3, z);
      group.add(win);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.3, 3.0), trimMat);
      frame.position.set(side * 7.82, 4.3, z);
      group.add(frame);
    }
  }

  // Hanging gleaming 3D Copper Cookware & Timber Hearth Rafters overhead!
  for (let z = 12; z < stage.length; z += 14) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.42, 0.42), trimMat);
    rafter.position.set(0, 7.1, z);
    group.add(rafter);

    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6.4, 8), trimMat);
    bar.rotation.z = Math.PI * 0.5;
    bar.position.set(0, 5.6, z);
    group.add(bar);
    for (const px of [-1.8, 0, 1.8]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.48, 14), copperMat);
      pot.position.set(px, 5.1, z);
      pot.castShadow = true;
      group.add(pot);
    }
  }

  // Butcher-block island counters & Gingham pumpkin-pie hiding tables!
  addPlatform3D(stage, -2.5, 22, 3.2, 5.0, 1.32, 'counter', textures);
  addPlatform3D(stage, 2.5, 50, 3.2, 5.0, 1.32, 'counter', textures);
  addPlatform3D(stage, -2.5, 80, 3.2, 5.0, 1.32, 'counter', textures);
  addPlatform3D(stage, 2.5, 108, 3.2, 5.0, 1.32, 'counter', textures);

  addCover3D(stage, 3.2, 18, 'kitchenTable', textures);
  addCover3D(stage, -3.2, 42, 'kitchenTable', textures);
  addCover3D(stage, 3.2, 68, 'kitchenTable', textures);
  addCover3D(stage, -3.2, 96, 'kitchenTable', textures);

  // Roaring 450°F Cast-Iron Roasting Ovens along both kitchen walls!
  addOven3D(stage, 1, 28, 0.78, 3.0 / stage.difficultyScale);
  addOven3D(stage, -1, 35, 0.76, 3.0 / stage.difficultyScale);
  addOven3D(stage, 1, 58, 0.3, 2.85 / stage.difficultyScale);
  addOven3D(stage, -1, 72, 0.75, 2.8 / stage.difficultyScale);
  addOven3D(stage, 1, 90, 0.25, 2.75 / stage.difficultyScale);
  addOven3D(stage, -1, 114, 0.68, 2.7 / stage.difficultyScale);

  // Swinging ceiling Butcher Cleavers!
  addPendulum3D(stage, 32, 0.65, 2.35 * stage.difficultyScale);
  addPendulum3D(stage, 64, 1.8, 2.45 * stage.difficultyScale);
  addPendulum3D(stage, 102, 0.4, 2.55 * stage.difficultyScale);

  addGravy3D(stage, 0.4, 46, 2.4, 2.0);
  addGravy3D(stage, -0.5, 85, 2.5, 2.0);

  addKickProp3D(stage, -1.5, 15, 'flourSack');
  addKickProp3D(stage, 1.6, 39, 'copperPot');
  addKickProp3D(stage, -1.5, 62, 'flourSack');
  addKickProp3D(stage, 1.5, 92, 'copperPot');

  addPickupLine3D(stage, -2.5, 19, 4, 2.1, 'cranberry', 2.15, 0.65);
  addPickupLine3D(stage, 0, 30, 4, 2.2, 'corn', 0.95, 0.4);
  addPickupLine3D(stage, 2.5, 47, 4, 2.1, 'cranberry', 2.15, 0.65);
  addPickupLine3D(stage, -2.5, 77, 4, 2.1, 'corn', 2.15, 0.65);
  addPickupLine3D(stage, 2.5, 108, 1, 1, 'goldenFeather', 2.5, 0);
  void rng;
}

function buildBanquetScenery(stage, group, textures, rng) {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4f131b, roughness: 0.65 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5ba3d, metalness: 0.8, roughness: 0.24 });
  const moonWinMat = new THREE.MeshBasicMaterial({ color: 0x8eb8ff });

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 8.0, stage.length + 14), wallMat);
    wall.position.set(side * 8.15, 4.0, stage.length * 0.5 - 4);
    wall.receiveShadow = true;
    group.add(wall);

    for (let z = 14; z < stage.length - 10; z += 20) {
      const archWin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 2.4), moonWinMat);
      archWin.position.set(side * 7.75, 4.5, z);
      group.add(archWin);
    }
  }

  // Golden Banquet Chandeliers
  for (let z = 16; z < stage.length - 8; z += 22) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 10, 24), goldMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(0, 5.8, z);
    group.add(ring);
    const chLight = new THREE.PointLight(0xffcb6b, 2.0, 16);
    chLight.position.set(0, 5.4, z);
    group.add(chLight);
  }

  addPlatform3D(stage, -2.6, 22, 3.2, 5.2, 1.35, 'banquet', textures);
  addPlatform3D(stage, 2.6, 52, 3.2, 5.2, 1.35, 'banquet', textures);
  addPlatform3D(stage, -2.6, 82, 3.2, 5.2, 1.35, 'banquet', textures);
  addPlatform3D(stage, 2.6, 106, 3.2, 4.8, 1.35, 'banquet', textures);

  addCover3D(stage, 3.2, 18, 'kitchenTable', textures);
  addCover3D(stage, -3.2, 42, 'kitchenTable', textures);
  addCover3D(stage, 3.2, 70, 'kitchenTable', textures);
  addCover3D(stage, -3.2, 96, 'kitchenTable', textures);

  addOven3D(stage, 1, 28, 0.76, 2.75 / stage.difficultyScale);
  addOven3D(stage, -1, 56, 0.3, 2.65 / stage.difficultyScale);
  addOven3D(stage, 1, 78, 0.72, 2.6 / stage.difficultyScale);
  addOven3D(stage, -1, 98, 0.25, 2.55 / stage.difficultyScale);
  addOven3D(stage, 1, 114, 0.75, 2.5 / stage.difficultyScale);

  addPendulum3D(stage, 36, 0.5, 2.5 * stage.difficultyScale);
  addPendulum3D(stage, 66, 1.9, 2.6 * stage.difficultyScale);
  addPendulum3D(stage, 104, 0.8, 2.7 * stage.difficultyScale);

  addKickProp3D(stage, -1.5, 16, 'flourSack');
  addKickProp3D(stage, 1.6, 46, 'copperPot');
  addKickProp3D(stage, -1.5, 74, 'flourSack');
  addKickProp3D(stage, 1.5, 100, 'copperPot');

  addPickupLine3D(stage, -2.6, 19, 4, 2.1, 'cranberry', 2.2, 0.65);
  addPickupLine3D(stage, 2.6, 49, 4, 2.1, 'corn', 2.2, 0.65);
  addPickupLine3D(stage, -2.6, 79, 4, 2.1, 'cranberry', 2.2, 0.65);
  addPickupLine3D(stage, 0, 112, 4, 2.0, 'corn', 1.0, 0.5);
  void rng;
}

function createAutumnTree3D(rng) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.38, 2.6, 10),
    new THREE.MeshStandardMaterial({ color: 0x4a2210, roughness: 0.85 }),
  );
  trunk.position.y = 1.3;
  trunk.castShadow = true;
  g.add(trunk);

  const palette = [0xc93018, 0xe86a1c, 0xf5ab29, 0xb52616, 0xffbe3b];
  const mainCol = rng.pick(palette);
  const subCol = rng.pick(palette);
  const m1 = new THREE.MeshStandardMaterial({ color: mainCol, roughness: 0.68 });
  const m2 = new THREE.MeshStandardMaterial({ color: subCol, roughness: 0.68 });

  const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.65, 14, 12), m1);
  c1.position.set(0, 3.3, 0);
  c1.castShadow = true;
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(1.18, 12, 10), m2);
  c2.position.set(0.95, 2.75, 0.35);
  c2.castShadow = true;
  const c3 = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), m2);
  c3.position.set(-0.9, 2.85, -0.3);
  c3.castShadow = true;

  g.add(c1, c2, c3);
  const sc = rng.range(0.88, 1.28);
  g.scale.setScalar(sc);
  return g;
}

function createRedBarn3D() {
  const g = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xa62819, roughness: 0.7 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b1a12, roughness: 0.78 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xf2dfc0, roughness: 0.6 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffda75 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.8, 8.6), redMat);
  body.position.y = 2.4;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.8, 4), roofMat);
  roof.rotation.y = Math.PI * 0.25;
  roof.position.y = 6.2;
  roof.castShadow = true;
  g.add(roof);

  // Warm lit loft window & white X trim
  const loftWin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 1.2), glowMat);
  loftWin.position.set(3.42, 3.6, 0);
  g.add(loftWin);

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.4, 2.6), trimMat);
  doorFrame.position.set(3.41, 1.2, 0);
  g.add(doorFrame);

  // Stone silo beside barn
  const silo = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.35, 6.8, 16),
    new THREE.MeshStandardMaterial({ color: 0x802b1d, roughness: 0.72 }),
  );
  silo.position.set(-0.8, 3.4, -5.6);
  silo.castShadow = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.38, 16, 12), roofMat);
  dome.position.set(-0.8, 6.8, -5.6);
  g.add(silo, dome);

  return g;
}

function createWindmill3D() {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x542812, roughness: 0.75 });
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xebd0a2, roughness: 0.6 });

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.95, 7.6, 6), woodMat);
  tower.position.y = 3.8;
  tower.castShadow = true;
  group.add(tower);

  const blades = new THREE.Group();
  blades.position.set(0.42, 7.2, 0);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.x = (i * Math.PI) / 2;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 0.44), sailMat);
    slat.position.y = 1.25;
    arm.add(slat);
    blades.add(arm);
  }
  group.add(blades);
  return { group, blades };
}
