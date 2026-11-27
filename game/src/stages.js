// Hand-crafted & seeded 4-stage builder with guaranteed non-overlapping tactical spacing.

import { STAGE_DEFS, VIEWPORT } from './config.js';

export function buildStage(stageIndex, rng, loopCount = 0) {
  const def = STAGE_DEFS[stageIndex % STAGE_DEFS.length];
  const difficultyScale = 1 + loopCount * 0.22;

  const stage = {
    ...def,
    loopCount,
    difficultyScale,
    groundY: VIEWPORT.groundY,
    platforms: [],
    covers: [],
    ovens: [],
    pendulums: [],
    gravySpills: [],
    kickProps: [],
    pickups: [],
    decor: [],
    exitX: def.length - 230,
  };

  if (def.theme === 'farmyard') {
    populateFarmyardStage(stage, rng);
  } else if (def.theme === 'barn') {
    populateBarnStage(stage, rng);
  } else if (def.theme === 'kitchen') {
    populateKitchenStage(stage, rng);
  } else {
    populateBanquetStage(stage, rng);
  }

  return stage;
}

function addPlatform(stage, x, y, w, style) {
  stage.platforms.push({ x, y, w, h: 24, style });
}

function addCover(stage, x, kind) {
  const specs = {
    haystack: { w: 98, h: 78 },
    pumpkinPatch: { w: 96, h: 66 },
    flourBarrel: { w: 72, h: 78 },
    kitchenTable: { w: 126, h: 82 },
    pantryCrate: { w: 84, h: 74 },
  };
  const spec = specs[kind] || specs.haystack;
  stage.covers.push({
    x,
    y: stage.groundY - spec.h,
    w: spec.w,
    h: spec.h,
    kind,
    searched: false,
    rustleTimer: 0,
  });
}

function addOven(stage, x, cycleOffset, cycleDuration, flameLength = 155, facing = -1) {
  stage.ovens.push({
    x,
    y: stage.groundY - 124,
    w: 112,
    h: 124,
    facing,
    flameLength,
    cycleDuration,
    timer: cycleOffset % cycleDuration,
    state: 'idle',
    doorOpen: 0,
    tempF: 450,
    blastedThisCycle: false,
    closeShaveGiven: false,
  });
}

function addPendulum(stage, x, pivotY, length, phase, speed = 2.05) {
  stage.pendulums.push({
    x,
    pivotY,
    length,
    angle: 0,
    maxAngle: 0.72,
    phase,
    speed,
    bobX: x,
    bobY: pivotY + length,
    closeShaveGiven: false,
  });
}

function addGravy(stage, x, w) {
  stage.gravySpills.push({ x, y: stage.groundY - 8, w, h: 16 });
}

function addKickProp(stage, x, kind, y = null) {
  const radius = kind === 'flourSack' ? 24 : kind === 'copperPot' ? 21 : 22;
  stage.kickProps.push({
    x,
    y: y !== null ? y - radius : stage.groundY - radius,
    vx: 0,
    vy: 0,
    radius,
    kind,
    kicked: false,
    used: false,
    rot: 0,
  });
}

function addPickupArc(stage, startX, baseY, count, spacing, arcHeight, kind = 'corn') {
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = startX + i * spacing;
    const y = baseY - Math.sin(t * Math.PI) * arcHeight;
    stage.pickups.push({
      x,
      y,
      kind,
      collected: false,
      bobPhase: i * 0.7,
    });
  }
}

export function populateFarmyardStage(stage, rng) {
  const g = stage.groundY;

  // Cleanly spaced hay bales & wagons (never overlapping ground hazards)
  addPlatform(stage, 480, g - 122, 175, 'haybale');
  addPlatform(stage, 1020, g - 154, 195, 'wagon');
  addPlatform(stage, 1520, g - 124, 175, 'haybale');
  addPlatform(stage, 1960, g - 162, 210, 'wagon');
  addPlatform(stage, 2380, g - 126, 165, 'haybale');

  // Cover spots cleanly separated from ovens
  addCover(stage, 710, 'haystack');
  addCover(stage, 1390, 'pumpkinPatch');
  addCover(stage, 1895, 'haystack');
  addCover(stage, 2245, 'pumpkinPatch');

  // Outdoor brick smokehouse ovens with clear flame runway to the left
  addOven(stage, 1185, 0.4, 3.7 / stage.difficultyScale, 150, -1);
  addOven(stage, 1735, 1.9, 3.5 / stage.difficultyScale, 155, -1);
  addOven(stage, 2450, 0.9, 3.3 / stage.difficultyScale, 160, -1);

  // Mud & gravy puddles in clear lanes
  addGravy(stage, 875, 120);
  addGravy(stage, 2065, 130);

  // Kickable pumpkins & flour sacks spaced clear of ovens & covers
  addKickProp(stage, 575, 'pumpkin');
  addKickProp(stage, 1345, 'flourSack');
  addKickProp(stage, 1605, 'pumpkin');
  addKickProp(stage, 2195, 'flourSack');

  addPickupArc(stage, 470, g - 172, 4, 56, 36, 'corn');
  addPickupArc(stage, 1010, g - 208, 4, 60, 42, 'corn');
  addPickupArc(stage, 1500, g - 176, 3, 62, 34, 'cranberry');
  addPickupArc(stage, 1965, g - 216, 4, 60, 40, 'corn');
  stage.pickups.push({ x: 1115, y: g - 262, kind: 'goldenFeather', collected: false, bobPhase: 0.4 });
  stage.pickups.push({ x: 2065, y: g - 270, kind: 'goldenFeather', collected: false, bobPhase: 1.8 });

  for (let x = 150; x < stage.length; x += rng.int(240, 340)) {
    stage.decor.push({
      kind: rng.pick(['mapleTree', 'scarecrow', 'pumpkins']),
      x,
      scale: rng.range(0.88, 1.22),
      hue: rng.pick(['red', 'orange', 'gold']),
    });
  }
}

export function populateBarnStage(stage, rng) {
  const g = stage.groundY;

  addPlatform(stage, 460, g - 125, 200, 'timber');
  addPlatform(stage, 840, g - 188, 195, 'timber');
  addPlatform(stage, 1275, g - 132, 190, 'haybale');
  addPlatform(stage, 1715, g - 196, 220, 'timber');
  addPlatform(stage, 2180, g - 135, 195, 'timber');
  addPlatform(stage, 2530, g - 186, 210, 'timber');

  addCover(stage, 685, 'flourBarrel');
  addCover(stage, 1185, 'haystack');
  addCover(stage, 1690, 'flourBarrel');
  addCover(stage, 2160, 'haystack');
  addCover(stage, 2445, 'flourBarrel');

  addOven(stage, 990, 0.2, 3.4 / stage.difficultyScale, 155, -1);
  addOven(stage, 1515, 1.5, 3.2 / stage.difficultyScale, 165, -1);
  addOven(stage, 1985, 2.3, 3.1 / stage.difficultyScale, 165, -1);
  addOven(stage, 2635, 0.7, 3.0 / stage.difficultyScale, 170, -1);

  addPendulum(stage, 785, 108, 260, 0.3, 2.1 * stage.difficultyScale);
  addPendulum(stage, 1410, 106, 274, 1.8, 2.25 * stage.difficultyScale);
  addPendulum(stage, 2320, 108, 270, 0.9, 2.35 * stage.difficultyScale);

  addGravy(stage, 1095, 105);
  addGravy(stage, 1825, 125);

  addKickProp(stage, 605, 'flourSack');
  addKickProp(stage, 1340, 'pumpkin');
  addKickProp(stage, 1645, 'flourSack');
  addKickProp(stage, 2110, 'flourSack');
  addKickProp(stage, 2535, 'pumpkin');

  addPickupArc(stage, 465, g - 180, 4, 58, 34, 'corn');
  addPickupArc(stage, 855, g - 245, 4, 56, 36, 'cranberry');
  addPickupArc(stage, 1725, g - 252, 4, 60, 38, 'corn');
  addPickupArc(stage, 2540, g - 240, 4, 56, 36, 'cranberry');
  stage.pickups.push({ x: 940, y: g - 300, kind: 'goldenFeather', collected: false, bobPhase: 0.2 });
  stage.pickups.push({ x: 2270, y: g - 255, kind: 'goldenFeather', collected: false, bobPhase: 1.5 });

  for (let x = 180; x < stage.length; x += 340) {
    stage.decor.push({ kind: 'barnBeam', x, scale: 1, hue: 'amber' });
  }
}

export function populateKitchenStage(stage, rng) {
  const g = stage.groundY;

  // Butcher blocks, granite counters, upper shelves
  addPlatform(stage, 430, g - 126, 210, 'counter');
  addPlatform(stage, 830, g - 188, 210, 'shelf');
  addPlatform(stage, 1245, g - 130, 215, 'counter');
  addPlatform(stage, 1695, g - 196, 230, 'shelf');
  addPlatform(stage, 2150, g - 132, 220, 'counter');
  addPlatform(stage, 2575, g - 192, 230, 'shelf');

  // Ruffled kitchen tables & pantry crates — cleanly spaced with >90px clear gap from every oven!
  addCover(stage, 755, 'kitchenTable');
  addCover(stage, 1185, 'pantryCrate');
  addCover(stage, 1660, 'kitchenTable');
  addCover(stage, 2145, 'pantryCrate');
  addCover(stage, 2495, 'kitchenTable');

  // Roaring 450°F Cast-Iron Roasting Ovens!
  addOven(stage, 575, 0.5, 3.15 / stage.difficultyScale, 164, -1);
  addOven(stage, 1020, 1.8, 3.0 / stage.difficultyScale, 168, -1);
  addOven(stage, 1475, 0.9, 2.9 / stage.difficultyScale, 170, -1);
  addOven(stage, 1965, 2.1, 2.85 / stage.difficultyScale, 174, -1);
  addOven(stage, 2720, 0.4, 2.75 / stage.difficultyScale, 178, -1);

  // Hanging swinging carving cleavers
  addPendulum(stage, 805, 96, 272, 0.2, 2.35 * stage.difficultyScale);
  addPendulum(stage, 1640, 96, 274, 1.5, 2.45 * stage.difficultyScale);
  addPendulum(stage, 2385, 96, 272, 2.5, 2.55 * stage.difficultyScale);

  // Slippery boiling gravy spills
  addGravy(stage, 905, 100);
  addGravy(stage, 1815, 118);
  addGravy(stage, 2265, 118);

  // Kickable copper pots & flour sacks cleanly spaced
  addKickProp(stage, 505, 'copperPot', g - 126);
  addKickProp(stage, 1300, 'flourSack');
  addKickProp(stage, 1615, 'copperPot');
  addKickProp(stage, 2105, 'flourSack');
  addKickProp(stage, 2450, 'copperPot');

  addPickupArc(stage, 445, g - 180, 4, 56, 36, 'cranberry');
  addPickupArc(stage, 855, g - 242, 4, 56, 38, 'corn');
  addPickupArc(stage, 1265, g - 184, 4, 56, 36, 'cranberry');
  addPickupArc(stage, 1720, g - 252, 4, 60, 40, 'corn');
  addPickupArc(stage, 2595, g - 248, 4, 58, 38, 'cranberry');
  stage.pickups.push({ x: 950, y: g - 295, kind: 'goldenFeather', collected: false, bobPhase: 0.5 });
  stage.pickups.push({ x: 1815, y: g - 305, kind: 'goldenFeather', collected: false, bobPhase: 1.9 });

  for (let x = 160; x < stage.length; x += 290) {
    stage.decor.push({ kind: rng.pick(['copperRack', 'kitchenWindow', 'spiceShelf']), x, scale: 1, hue: 'copper' });
  }
}

export function populateBanquetStage(stage, rng) {
  const g = stage.groundY;

  addPlatform(stage, 430, g - 128, 225, 'banquet');
  addPlatform(stage, 830, g - 190, 225, 'banquet');
  addPlatform(stage, 1235, g - 134, 230, 'banquet');
  addPlatform(stage, 1655, g - 196, 240, 'banquet');
  addPlatform(stage, 2065, g - 134, 230, 'banquet');
  addPlatform(stage, 2455, g - 188, 215, 'banquet');

  // Clean separation from ovens
  addCover(stage, 735, 'kitchenTable');
  addCover(stage, 1175, 'pantryCrate');
  addCover(stage, 1625, 'kitchenTable');
  addCover(stage, 2075, 'kitchenTable');
  addCover(stage, 2365, 'pantryCrate');

  addOven(stage, 575, 0.2, 2.85 / stage.difficultyScale, 172, -1);
  addOven(stage, 1005, 1.3, 2.75 / stage.difficultyScale, 176, -1);
  addOven(stage, 1455, 2.1, 2.65 / stage.difficultyScale, 178, -1);
  addOven(stage, 1905, 0.7, 2.60 / stage.difficultyScale, 180, -1);
  addOven(stage, 2555, 1.5, 2.55 / stage.difficultyScale, 184, -1);

  addPendulum(stage, 785, 92, 276, 0.4, 2.5 * stage.difficultyScale);
  addPendulum(stage, 1600, 92, 278, 1.6, 2.6 * stage.difficultyScale);
  addPendulum(stage, 2295, 92, 274, 2.8, 2.7 * stage.difficultyScale);

  addGravy(stage, 885, 105);
  addGravy(stage, 1765, 118);
  addGravy(stage, 2215, 118);

  addKickProp(stage, 515, 'copperPot');
  addKickProp(stage, 1295, 'flourSack');
  addKickProp(stage, 1585, 'copperPot');
  addKickProp(stage, 2035, 'flourSack');
  addKickProp(stage, 2465, 'copperPot');

  addPickupArc(stage, 450, g - 184, 4, 58, 38, 'cranberry');
  addPickupArc(stage, 855, g - 248, 4, 58, 38, 'corn');
  addPickupArc(stage, 1675, g - 252, 5, 55, 42, 'cranberry');
  addPickupArc(stage, 2470, g - 246, 4, 56, 38, 'corn');
  stage.pickups.push({ x: 1350, y: g - 265, kind: 'goldenFeather', collected: false, bobPhase: 0.7 });
  stage.pickups.push({ x: 2560, y: g - 300, kind: 'goldenFeather', collected: false, bobPhase: 2.1 });

  for (let x = 210; x < stage.length; x += 360) {
    stage.decor.push({ kind: rng.pick(['chandelier', 'tapestry', 'archWindow']), x, scale: 1, hue: 'gold' });
  }
}
