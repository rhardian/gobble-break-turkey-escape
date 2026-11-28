// Farmer Jeb & Chef Jeb 3D AI: pursues along +X & Z, lunges, searches cover (?), throws forged knives, and stuns/blinds!

import { SCORE_VALUES, WORLD } from './config.js';
import { createCarvingKnifeMesh } from './models.js';
import { damageTurkey3D } from './turkey.js';

export function createFarmerState(rig, stage, startX = 0.5) {
  return {
    rig,
    x: startX,
    y: 0,
    z: 0.15,
    vx: 0,
    vz: 0,
    yaw: 1.12, // Heroic 3/4 side-front pose facing right (+X) & slightly toward camera (+Z)!
    state: 'chase', // chase | lunge | search | stunned | blind
    stateTimer: 0,
    lungeCooldown: 2.0,
    knifeTimer: stage.knifeInterval * 0.75,
    alertTimer: 1.4,
    shoutText: stage.farmerOutfit === 'chef' ? 'INTO THE OVEN!' : 'DINNER TIME!',
    runCycle: 0,
    dizzyAngle: 0,
    searchTarget: null,
  };
}

export function stunFarmer3D(farmer, kind, perks, audio, effects, onScore) {
  const isFlour = kind === 'flourSack';
  const mult = perks.has('flour_blast') ? 1.45 : 1.0;
  farmer.state = isFlour ? 'blind' : 'stunned';
  farmer.stateTimer = (isFlour ? 3.4 : 2.3) * mult;
  farmer.vx = -2.4;
  farmer.shoutText = isFlour ? 'ACHOO! BLINDED!' : 'OUCH! MY SHINS!';

  if (isFlour) {
    audio.playFlourBurst();
    effects.spawnFlourExplosion(farmer.x, 1.75, farmer.z, 18);
    const pts = Math.round(SCORE_VALUES.flourBlind * (perks.has('flour_blast') ? 2 : 1));
    onScore(pts, `FLOUR BLIND! +${pts}`, '#fffaf0', farmer.x, 3.25, farmer.z);
  } else {
    audio.playBonk();
    effects.spawnFeathers(farmer.x, 1.75, farmer.z, 10, 5.0);
    onScore(SCORE_VALUES.farmerStun, 'FARMER BONKED! +260', '#ffda66', farmer.x, 3.25, farmer.z);
  }
  effects.triggerShake(0.32, 0.24);
  effects.triggerHitstop(0.05);
}

export function updateFarmerAI3D(farmer, turkey, stage, knives, scene, dt, audio, effects) {
  farmer.lungeCooldown = Math.max(0, farmer.lungeCooldown - dt);
  farmer.alertTimer = Math.max(0, farmer.alertTimer - dt);

  if (farmer.state === 'stunned' || farmer.state === 'blind') {
    farmer.stateTimer -= dt;
    farmer.vx *= Math.pow(0.88, dt * 60);
    farmer.x = Math.max(0.5, farmer.x + farmer.vx * dt);
    farmer.dizzyAngle += dt * 4.5;
    if (farmer.stateTimer <= 0) {
      farmer.state = 'chase';
      farmer.alertTimer = 1.3;
      farmer.shoutText = stage.farmerOutfit === 'chef' ? 'GET BACK HERE!' : 'COME HERE BIRD!';
    }
    syncFarmerRig(farmer, dt);
    return;
  }

  // If Barnaby hides in 3D cover -> Farmer switches to SEARCHING (?)!
  if (turkey.hiding) {
    if (farmer.state !== 'search') {
      farmer.state = 'search';
      farmer.searchTarget = { x: turkey.x + 1.6, z: turkey.z };
      farmer.shoutText = '? WHERE DID HE GO?';
    }
    const tx = farmer.searchTarget ? farmer.searchTarget.x : turkey.x;
    const tz = farmer.searchTarget ? farmer.searchTarget.z : turkey.z;
    const dx = tx - farmer.x;
    const dz = tz - farmer.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 1.2) {
      farmer.vx = (dx / dist) * stage.farmerSpeed * 0.56;
      farmer.vz = (dz / dist) * stage.farmerSpeed * 0.45;
    } else {
      farmer.vx *= 0.85;
      farmer.vz *= 0.85;
    }
    farmer.x += farmer.vx * dt;
    farmer.z = Math.max(WORLD.laneMinZ, Math.min(WORLD.laneMaxZ, farmer.z + farmer.vz * dt));
    farmer.runCycle += dt * 6.5;
    syncFarmerRig(farmer, dt);
    return;
  }

  // Spotted Barnaby -> Resume Pursuit!
  if (farmer.state === 'search') {
    farmer.state = 'chase';
    farmer.alertTimer = 1.6;
    farmer.shoutText = stage.farmerOutfit === 'chef' ? 'THERE YOU ARE!' : 'SPOTTED YA!';
    audio.playFarmerAlert();
  }

  const dx = turkey.x - farmer.x;
  const dz = turkey.z - farmer.z;
  const dist = Math.hypot(dx, dz);

  // Rubber-band catchup so the farmer ALWAYS stays a visible, intense 3D threat!
  let spd = stage.farmerSpeed * stage.difficultyScale;
  if (dx > 9.5) spd *= 1.48;
  else if (dx > 6.0) spd *= 1.16;

  if (farmer.state === 'lunge') {
    farmer.stateTimer -= dt;
    spd *= 1.44;
    if (farmer.stateTimer <= 0) farmer.state = 'chase';
  } else if (dist < 4.8 && farmer.lungeCooldown <= 0 && dx > 0.2) {
    farmer.state = 'lunge';
    farmer.stateTimer = 0.52;
    farmer.lungeCooldown = 3.2;
    farmer.alertTimer = 1.2;
    farmer.shoutText = stage.farmerOutfit === 'chef' ? 'INTO THE OVEN!' : 'GOTCHA!';
    audio.playFarmerAlert();
  }

  if (dist > 0.2) {
    farmer.vx += ((dx / dist) * spd - farmer.vx) * Math.min(1, dt * 7);
    farmer.vz += ((dz / dist) * spd * 0.72 - farmer.vz) * Math.min(1, dt * 7);
  }
  farmer.x = Math.max(0.5, farmer.x + farmer.vx * dt);
  farmer.z = Math.max(WORLD.laneMinZ, Math.min(WORLD.laneMaxZ, farmer.z + farmer.vz * dt));

  // Keep expressive 3/4 side-front face visibility toward the camera!
  const targetYaw = Math.atan2(dx + 2.5, dz + 2.1);
  farmer.yaw += (targetYaw - farmer.yaw) * Math.min(1, dt * 8);
  farmer.runCycle += dt * (5.5 + Math.hypot(farmer.vx, farmer.vz) * 0.8);

  // Throw Spinning Forged 3D Carving Knife toward Barnaby!
  farmer.knifeTimer -= dt;
  if (farmer.knifeTimer <= 0 && dist > 3.2 && dist < 17) {
    farmer.knifeTimer = Math.max(1.15, stage.knifeInterval / stage.difficultyScale);
    const mesh = createCarvingKnifeMesh(1.18, true);
    mesh.position.set(farmer.x + 0.9, 1.95, farmer.z);
    scene.add(mesh);

    const kSpd = 15.0 * stage.difficultyScale;
    const len = Math.max(1, Math.hypot(dx, dz));
    knives.push({
      mesh,
      x: farmer.x + 0.9,
      y: 1.95,
      z: farmer.z,
      vx: (dx / len) * kSpd,
      vy: 1.8,
      vz: (dz / len) * kSpd * 0.55,
      gravity: 5.0,
      spin: 12.5,
      life: 2.2,
      closeShaveGiven: false,
    });
    audio.playKnifeShing();
  }

  // Catch collision check (fair height check so Barnaby can leap right over Jeb's lunge!)
  if (dist < 1.28 && turkey.y < 1.55) {
    const hurt = damageTurkey3D(turkey, 1.1, 0, audio, effects, 'FARMER GRAB!');
    if (hurt) {
      farmer.vx = -3.8;
      farmer.lungeCooldown = 2.0;
    }
  }

  syncFarmerRig(farmer, dt);
}

export function syncFarmerRig(farmer, dt) {
  const r = farmer.rig;
  r.root.position.set(farmer.x, farmer.y, farmer.z);
  r.root.rotation.y = farmer.yaw;

  const isStun = farmer.state === 'stunned' || farmer.state === 'blind';
  const stride = Math.sin(farmer.runCycle);
  r.leftLeg.rotation.x = isStun ? 0 : stride * 0.72;
  r.rightLeg.rotation.x = isStun ? 0 : -stride * 0.72;
  r.bodyPivot.position.y = isStun ? 0 : Math.abs(stride) * 0.12;
  r.bodyPivot.rotation.x = farmer.state === 'lunge' ? 0.3 : isStun ? -0.14 : 0.1;

  // Dynamic slashing right arm angled slightly outward so Jeb's furious face & mustache stay 100% visible!
  r.rightArm.rotation.x = isStun ? -0.9 : farmer.state === 'lunge' ? -0.58 : -0.35 + Math.sin(farmer.runCycle * 1.4) * 0.35;
  r.rightArm.rotation.z = isStun ? 0 : -0.36;
  r.leftArm.rotation.x = isStun ? -0.75 : -0.25 - stride * 0.4;

  // Orbiting 3D Golden Dizzy Stars + flour-dusted face tint when blinded!
  r.dizzyGroup.visible = isStun;
  if (isStun) r.dizzyGroup.rotation.y = farmer.dizzyAngle;
  r.skinMat.color.setHex(farmer.state === 'blind' ? 0xfff8eb : 0xf5be96);

  // Volumetric 3D floor vision cone color & pulse
  if (isStun) {
    r.threatCone.visible = false;
  } else {
    r.threatCone.visible = true;
    r.coneMat.color.setHex(farmer.state === 'search' ? 0xffc833 : 0xff3b1a);
    r.coneMat.opacity = farmer.state === 'lunge' ? 0.34 : 0.22;
  }
  void dt;
}
