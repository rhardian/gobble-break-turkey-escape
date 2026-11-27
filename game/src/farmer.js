// 3D Multi-State Farmer Jeb / Chef Jeb AI: 3D flanking chase, volumetric vision cone, cover search, lunge & knife throws.

import { SCORE_VALUES, WORLD } from './config.js';
import { createCarvingKnifeMesh } from './models.js';
import { damageTurkey3D } from './turkey.js';

export function createFarmerState(rig, stage, startZ = 1.5) {
  return {
    rig,
    x: 0,
    y: 0,
    z: startZ,
    vx: 0,
    vz: 0,
    yaw: 0,
    outfit: stage.farmerOutfit,
    state: 'chase', // chase | search | lunge | stunned | blind
    stateTimer: 0,
    searchProgress: 0,
    alertTimer: 1.5,
    shoutText: stage.farmerOutfit === 'chef' ? 'INTO THE OVEN!' : 'DINNER TIME!',
    knifeTimer: stage.farmerKnifeInterval * 0.72,
    lungeCooldown: 2.2,
    runCycle: 0,
  };
}

export function stunFarmer3D(farmer, kind, perks, audio, effects, onScore) {
  const isFlour = kind === 'flourSack';
  const mult = perks.has('flour_blast') ? 1.5 : 1.0;
  farmer.state = isFlour ? 'blind' : 'stunned';
  farmer.stateTimer = (isFlour ? 2.5 : 1.8) * mult;
  farmer.shoutText = isFlour ? 'ACHOO! MY EYES!' : 'OUCH! BLASTED BIRD!';
  farmer.alertTimer = farmer.stateTimer;
  farmer.rig.skinMat.color.setHex(isFlour ? 0xfaf6ee : 0xf2b88e);
  audio.playBonk();

  if (isFlour) {
    effects.spawnFlourExplosion(farmer.x, 1.6, farmer.z, 20);
    effects.triggerShake(0.32, 0.25);
    onScore(SCORE_VALUES.flourBlind, 'FLOUR BOMB! +320', '#ffffff', farmer.x, 3.3, farmer.z);
  } else {
    effects.spawnFeathers(farmer.x, 2.2, farmer.z, 10, 5.0);
    effects.triggerShake(0.28, 0.22);
    onScore(SCORE_VALUES.farmerStun, 'BONKED! +250', '#ffd85c', farmer.x, 3.3, farmer.z);
  }
}

export function updateFarmerAI3D(farmer, turkey, stage, knives, scene, dt, audio, effects) {
  farmer.alertTimer = Math.max(0, farmer.alertTimer - dt);
  farmer.lungeCooldown = Math.max(0, farmer.lungeCooldown - dt);

  // Stunned / Flour-Blind state
  if (farmer.state === 'stunned' || farmer.state === 'blind') {
    farmer.stateTimer -= dt;
    farmer.rig.threatCone.visible = false;
    farmer.rig.bodyPivot.rotation.y = Math.sin(farmer.stateTimer * 14) * 0.25;
    if (farmer.stateTimer <= 0) {
      farmer.state = 'chase';
      farmer.rig.skinMat.color.setHex(0xf2b88e);
      farmer.rig.bodyPivot.rotation.y = 0;
      farmer.shoutText = 'GET BACK HERE!';
      farmer.alertTimer = 1.4;
      audio.playAlert();
    }
    syncFarmerRig(farmer, dt);
    return;
  }

  farmer.rig.threatCone.visible = true;

  // When Barnaby dives into 3D cover, Farmer Jeb switches to SEARCH mode with sweeping golden cone!
  if (turkey.hiding && turkey.hideCover) {
    if (farmer.state !== 'search') {
      farmer.state = 'search';
      farmer.stateTimer = 0;
      farmer.searchProgress = 0;
      farmer.shoutText = "WHERE'D HE GO?";
      farmer.alertTimer = 1.8;
    }
    farmer.rig.coneMat.color.setHex(0xffc938);
    farmer.rig.coneMat.opacity = 0.24;

    const dx = turkey.hideCover.x - farmer.x;
    const dz = turkey.hideCover.z - farmer.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 3.1) {
      const spd = stage.farmerSpeed * 0.62;
      farmer.vx = (dx / dist) * spd;
      farmer.vz = (dz / dist) * spd;
      farmer.x += farmer.vx * dt;
      farmer.z += farmer.vz * dt;
      farmer.yaw = Math.atan2(dx, dz);
    } else {
      farmer.stateTimer += dt;
      farmer.vx = 0;
      farmer.vz = 0;
      farmer.yaw = Math.atan2(dx, dz) + Math.sin(farmer.stateTimer * 4.2) * 0.55;
      farmer.searchProgress += dt * 0.48;
      if (farmer.searchProgress >= 1) {
        turkey.hiding = false;
        turkey.hideCover = null;
        farmer.state = 'chase';
        farmer.shoutText = 'AHA! FOUND YA!';
        farmer.alertTimer = 1.5;
        audio.playAlert();
        effects.addCallout(farmer.x, 3.3, farmer.z, 'SPOTTED!', '#ff5938', 1.15);
      }
    }
    syncFarmerRig(farmer, dt);
    return;
  } else if (farmer.state === 'search') {
    farmer.state = 'chase';
    farmer.shoutText = 'THERE HE IS!';
    farmer.alertTimer = 1.4;
    audio.playAlert();
  }

  // Active 3D Pursuit & Cornering Lunge!
  const dx = turkey.x - farmer.x;
  const dz = turkey.z - farmer.z;
  const dist = Math.max(0.01, Math.hypot(dx, dz));

  farmer.rig.coneMat.color.setHex(farmer.state === 'lunge' ? 0xff1e14 : 0xff4d1f);
  farmer.rig.coneMat.opacity = farmer.state === 'lunge' ? 0.34 : 0.20;

  if (farmer.state === 'lunge') {
    farmer.stateTimer -= dt;
    const lungeSpd = stage.farmerSpeed * 1.48 * stage.difficultyScale;
    farmer.vx = Math.sin(farmer.yaw) * lungeSpd;
    farmer.vz = Math.cos(farmer.yaw) * lungeSpd;
    if (farmer.stateTimer <= 0) {
      farmer.state = 'chase';
      farmer.lungeCooldown = 2.4;
    }
  } else {
    farmer.yaw = Math.atan2(dx, dz);
    let spd = stage.farmerSpeed * stage.difficultyScale;
    if (dz > 13.5) spd = Math.max(spd, 13.8); // Rubber-band catch-up so Jeb stays dangerously close!
    else if (dist < 3.6) spd *= 0.94;

    farmer.vx = (dx / dist) * spd;
    farmer.vz = (dz / dist) * spd;

    if (dist < 4.6 && dist > 1.7 && turkey.y < 1.1 && farmer.lungeCooldown <= 0) {
      farmer.state = 'lunge';
      farmer.stateTimer = 0.38;
      farmer.shoutText = farmer.outfit === 'chef' ? 'INTO THE OVEN!' : 'GOTCHA NOW!';
      farmer.alertTimer = 1.2;
      audio.playAlert();
    }

    // Hurl gleaming 3D Carving Knives toward Barnaby!
    farmer.knifeTimer -= dt;
    if (farmer.knifeTimer <= 0 && dist > 4.2 && dist < 21.0) {
      farmer.knifeTimer = Math.max(1.25, stage.farmerKnifeInterval / stage.difficultyScale);
      const mesh = createCarvingKnifeMesh(1.1);
      const sx = farmer.x;
      const sy = 1.75;
      const sz = farmer.z + 0.6;
      mesh.position.set(sx, sy, sz);
      scene.add(mesh);

      const flightT = Math.max(0.5, Math.min(1.05, dist / 16.5));
      const aimX = Math.max(-WORLD.laneHalfWidth, Math.min(WORLD.laneHalfWidth, turkey.x + turkey.vx * 0.22));
      const aimZ = turkey.z + turkey.vz * 0.22;
      const kvx = (aimX - sx) / flightT;
      const kvz = (aimZ - sz) / flightT;
      const gravity = 9.5;
      const kvy = ((turkey.y + 0.72) - sy + 0.5 * gravity * flightT * flightT) / flightT;

      knives.push({
        mesh,
        x: sx,
        y: sy,
        z: sz,
        vx: kvx,
        vy: kvy,
        vz: kvz,
        gravity,
        spin: 12.5,
        life: 3.0,
        closeShaveGiven: false,
      });
      audio.playKnifeShing();
    }
  }

  farmer.x = Math.max(-WORLD.laneHalfWidth + 0.4, Math.min(WORLD.laneHalfWidth - 0.4, farmer.x + farmer.vx * dt));
  farmer.z = Math.max(0.5, Math.min(stage.length - 3.0, farmer.z + farmer.vz * dt));

  // Direct 3D grab collision with Barnaby
  if (!turkey.hiding && Math.hypot(turkey.x - farmer.x, turkey.z - farmer.z) < 1.28 && Math.abs(turkey.y - farmer.y) < 1.35) {
    const kx = (turkey.x - farmer.x) / dist;
    const kz = Math.max(0.5, (turkey.z - farmer.z) / dist);
    const hurt = damageTurkey3D(
      turkey,
      kx,
      kz,
      audio,
      effects,
      farmer.outfit === 'chef' ? 'CHEF GRAB!' : 'FARMER GRAB!',
    );
    if (hurt) {
      farmer.z = Math.max(0.5, farmer.z - 2.2);
      farmer.lungeCooldown = 1.6;
    }
  }

  syncFarmerRig(farmer, dt);
}

export function syncFarmerRig(farmer, dt) {
  const { rig } = farmer;
  rig.root.position.set(farmer.x, farmer.y, farmer.z);
  rig.root.rotation.y = farmer.yaw;

  const spd = Math.hypot(farmer.vx, farmer.vz);
  if (farmer.state !== 'stunned' && farmer.state !== 'blind' && spd > 0.4) {
    farmer.runCycle += dt * spd * 1.25;
  }

  const stride = farmer.state === 'stunned' || farmer.state === 'blind' ? 0 : Math.sin(farmer.runCycle) * 0.65;
  rig.leftLeg.rotation.x = stride;
  rig.rightLeg.rotation.x = -stride;
  rig.rightArm.rotation.x = farmer.state === 'lunge' ? -0.85 : -0.25 + Math.sin(farmer.runCycle) * 0.45;
  rig.leftArm.rotation.x = -stride * 0.45;
  rig.bodyPivot.position.y = Math.abs(Math.sin(farmer.runCycle)) * 0.1;
}
