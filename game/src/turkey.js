// Barnaby the Turkey 3D controller (+X forward, Z lane depth, +Y jump/flutter, dash, cover stealth, prop kick & gobble).

import { SCORE_VALUES, WORLD } from './config.js';

export function createTurkeyState(rig, startX = 6, perks = new Set()) {
  const maxLives = perks.has('extra_plumage') ? 4 : 3;
  return {
    rig,
    x: startX,
    y: 0,
    z: 0.1,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 1.16, // Heroic 3/4 side-front pose facing right (+X) & slightly toward camera (+Z)!
    grounded: true,
    fluttering: false,
    coyoteTimer: 0,
    jumpBuffer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    kickCooldown: 0,
    invulnTimer: 0,
    closeShaveCooldown: 0,
    hiding: false,
    hideCover: null,
    hideDuration: 0,
    ambushBoost: 0,
    stamina: WORLD.staminaMax,
    maxStamina: WORLD.staminaMax,
    lives: maxLives,
    maxLives,
    runCycle: 0,
    squawkTimer: 0,
  };
}

export function triggerDash3D(turkey, dirX, dirZ, perks, audio, effects) {
  if (turkey.hiding || turkey.dashCooldown > 0 || turkey.stamina < WORLD.dashCost) return false;
  const cdMult = perks.has('cranberry_dash') ? 0.65 : 1.0;
  const spdMult = perks.has('cranberry_dash') ? 1.25 : 1.0;
  turkey.stamina = Math.max(0, turkey.stamina - WORLD.dashCost);
  turkey.dashTimer = WORLD.dashDuration;
  turkey.dashCooldown = WORLD.dashCooldown * cdMult;
  turkey.invulnTimer = Math.max(turkey.invulnTimer, WORLD.dashDuration + 0.12);
  turkey.squawkTimer = 0.35;

  const mag = Math.hypot(dirX, dirZ);
  const nx = mag > 0.1 ? dirX / mag : 1;
  const nz = mag > 0.1 ? dirZ / mag : 0;
  turkey.vx = nx * WORLD.dashSpeed * spdMult;
  turkey.vz = nz * WORLD.dashSpeed * 0.55;
  turkey.vy = Math.max(turkey.vy, 3.2);
  turkey.grounded = false;

  audio.playDash();
  effects.spawnFeathers(turkey.x, turkey.y + 0.9, turkey.z, 9, 5.2);
  effects.triggerShake(0.16, 0.14);
  return true;
}

export function triggerKickOrGobble3D(turkey, stage, farmer, knives, perks, audio, effects, onScore) {
  if (turkey.hiding || turkey.kickCooldown > 0) return false;
  turkey.kickCooldown = 0.55;
  turkey.squawkTimer = 0.4;

  // 1. Check nearby kickable Flour Sack / Pumpkin / Copper Pot -> blast backward (-X) into Farmer Jeb!
  let bestProp = null;
  let bestDist = 3.2;
  for (const prop of stage.kickProps) {
    if (prop.used || prop.kicked) continue;
    const d = Math.hypot(prop.x - turkey.x, prop.z - turkey.z);
    if (d < bestDist) {
      bestDist = d;
      bestProp = prop;
    }
  }

  if (bestProp) {
    bestProp.kicked = true;
    const dx = farmer ? farmer.x - bestProp.x : -8;
    const dz = farmer ? farmer.z - bestProp.z : 0;
    const dist = Math.max(0.5, Math.hypot(dx, dz));
    bestProp.vx = (dx / dist) * 18.5;
    bestProp.vz = (dz / dist) * 14.5;
    bestProp.vy = 5.4;
    audio.playPropKick();
    effects.spawnFeathers(bestProp.x, 0.7, bestProp.z, 6, 4.2);
    effects.triggerShake(0.22, 0.16);
    onScore(60, bestProp.kind === 'flourSack' ? 'FLOUR KICK!' : 'PROP KICK!', '#ffe680', bestProp.x, 1.9, bestProp.z);
    return true;
  }

  // 2. Otherwise unleash a Sonic Gobble Shockwave that deflects nearby carving knives!
  audio.playGobble();
  effects.spawnGobbleRing(turkey.x + 0.5, turkey.y + 1.0, turkey.z);
  let deflected = 0;
  for (const k of knives) {
    if (Math.hypot(k.x - turkey.x, k.z - turkey.z) < 4.5 && k.vx < 0) {
      k.vx = Math.abs(k.vx) * 1.3;
      k.vy = 4.2;
      k.life = Math.min(k.life, 0.65);
      deflected += 1;
    }
  }
  if (deflected > 0) {
    effects.triggerHitstop(0.04);
    onScore(SCORE_VALUES.knifeDeflect * deflected, 'GOBBLE DEFLECT!', '#ffe378', turkey.x, turkey.y + 2.3, turkey.z);
  }
  void perks;
  return true;
}

export function damageTurkey3D(turkey, knockX, knockZ, audio, effects, reasonText) {
  if (turkey.invulnTimer > 0 || turkey.hiding) return false;
  turkey.lives = Math.max(0, turkey.lives - 1);
  turkey.invulnTimer = WORLD.invulnDuration;
  turkey.squawkTimer = 0.5;
  turkey.vx = knockX * 8.5;
  turkey.vz = knockZ * 5.0;
  turkey.vy = 7.4;
  turkey.grounded = false;

  audio.playHit();
  effects.triggerHitstop(0.06);
  effects.triggerShake(0.42, 0.3);
  effects.triggerFlash('#ff3b1f', 0.34);
  effects.spawnFeathers(turkey.x, turkey.y + 1.0, turkey.z, 14, 6.4);
  if (reasonText) effects.addCallout(turkey.x, turkey.y + 2.35, turkey.z, reasonText, '#ff7b61', 1.15);
  return true;
}

export function updateTurkey3D(turkey, input, stage, farmer, knives, perks, dt, audio, effects, onScore, combo) {
  turkey.dashCooldown = Math.max(0, turkey.dashCooldown - dt);
  turkey.kickCooldown = Math.max(0, turkey.kickCooldown - dt);
  turkey.invulnTimer = Math.max(0, turkey.invulnTimer - dt);
  turkey.closeShaveCooldown = Math.max(0, turkey.closeShaveCooldown - dt);
  turkey.ambushBoost = Math.max(0, turkey.ambushBoost - dt);
  turkey.squawkTimer = Math.max(0, turkey.squawkTimer - dt);

  const mv = input.getMoveVector3D();

  // Check Cover Stealth Hide ([E] / [C])
  let nearestCover = null;
  let coverDist = 2.45;
  for (const c of stage.covers) {
    const d = Math.hypot(turkey.x - c.x, turkey.z - c.z);
    if (d < coverDist) {
      coverDist = d;
      nearestCover = c;
    }
  }

  if (input.isHideHeld() && nearestCover && turkey.y < 0.7 && turkey.dashTimer <= 0) {
    if (!turkey.hiding) {
      turkey.hiding = true;
      turkey.hideCover = nearestCover;
      turkey.hideDuration = 0;
      turkey.vx = 0;
      turkey.vz = 0;
      nearestCover.rustle = 0.45;
      audio.playHide();
      effects.spawnFeathers(nearestCover.x, 1.1, nearestCover.z, 4, 3.0);
    }
    turkey.hideDuration += dt;
    turkey.x += (nearestCover.x - turkey.x) * Math.min(1, dt * 10);
    turkey.z += (nearestCover.z - turkey.z) * Math.min(1, dt * 10);
    turkey.stamina = Math.min(turkey.maxStamina, turkey.stamina + WORLD.staminaRegen * 1.45 * dt);
    syncTurkeyRig(turkey, dt, combo);
    return;
  } else if (turkey.hiding) {
    // Pop out of cover -> Ambush Slip burst if Farmer Jeb was searching nearby!
    turkey.hiding = false;
    const cover = turkey.hideCover;
    turkey.hideCover = null;
    if (farmer && (farmer.state === 'search' || Math.hypot(farmer.x - turkey.x, farmer.z - turkey.z) < 7.5)) {
      turkey.ambushBoost = 1.15;
      turkey.vx = WORLD.runSpeedX * 1.38;
      turkey.vy = 6.2;
      turkey.grounded = false;
      audio.playDash();
      effects.spawnFeathers(turkey.x, 1.1, turkey.z, 8, 4.8);
      onScore(SCORE_VALUES.ambushSlip, 'AMBUSH SLIP! +200', '#9eff8a', turkey.x, 2.3, turkey.z);
    } else if (cover) {
      cover.rustle = 0.35;
    }
  }

  if (input.wasJumpPressed()) turkey.jumpBuffer = WORLD.jumpBuffer;
  else turkey.jumpBuffer = Math.max(0, turkey.jumpBuffer - dt);

  if (input.wasDashPressed()) triggerDash3D(turkey, mv.x || 1, mv.z, perks, audio, effects);
  if (input.wasKickPressed()) triggerKickOrGobble3D(turkey, stage, farmer, knives, perks, audio, effects, onScore);

  // Check sticky gravy spill slowdown
  let inGravy = false;
  for (const g of stage.gravySpills) {
    if (turkey.y < 0.25 && Math.hypot((turkey.x - g.x) / g.rx, (turkey.z - g.z) / g.rz) < 1.0) {
      inGravy = true;
      break;
    }
  }

  if (turkey.dashTimer > 0) {
    turkey.dashTimer = Math.max(0, turkey.dashTimer - dt);
  } else {
    const speedBoost = turkey.ambushBoost > 0 ? 1.28 : 1.0;
    const gravyDrag = inGravy ? 0.56 : 1.0;
    const targetVx = mv.x * WORLD.runSpeedX * speedBoost * gravyDrag;
    const targetVz = mv.z * WORLD.strafeSpeedZ * speedBoost * gravyDrag;
    const accel = turkey.grounded ? 14 : 9.5;
    turkey.vx += (targetVx - turkey.vx) * Math.min(1, dt * accel);
    turkey.vz += (targetVz - turkey.vz) * Math.min(1, dt * accel);
  }

  // Coyote time + buffered jump!
  if (turkey.grounded) turkey.coyoteTimer = WORLD.coyoteTime;
  else turkey.coyoteTimer = Math.max(0, turkey.coyoteTimer - dt);

  if (turkey.jumpBuffer > 0 && turkey.coyoteTimer > 0) {
    const liftMult = perks.has('tailwind_flutter') ? 1.12 : 1.0;
    turkey.vy = WORLD.jumpVelocity * liftMult;
    turkey.grounded = false;
    turkey.coyoteTimer = 0;
    turkey.jumpBuffer = 0;
    turkey.squawkTimer = 0.25;
    audio.playJump();
    effects.spawnFeathers(turkey.x, turkey.y + 0.5, turkey.z, 5, 3.6);
  }

  // Wing-Flutter Glide when holding Space while descending!
  const flutterCost = perks.has('tailwind_flutter') ? WORLD.flutterCostPerSec * 0.5 : WORLD.flutterCostPerSec;
  turkey.fluttering = !turkey.grounded && turkey.vy < 1.5 && input.isJumpHeld() && turkey.stamina > 2;
  if (turkey.fluttering) {
    turkey.stamina = Math.max(0, turkey.stamina - flutterCost * dt);
    turkey.vy -= WORLD.flutterGravity * dt;
    if (turkey.vy < -2.3) turkey.vy = -2.3;
  } else {
    turkey.vy -= WORLD.gravity * dt;
    if (turkey.grounded) {
      turkey.stamina = Math.min(turkey.maxStamina, turkey.stamina + WORLD.staminaRegen * dt);
    }
  }

  const prevY = turkey.y;
  turkey.x += turkey.vx * dt;
  turkey.y += turkey.vy * dt;
  turkey.z += turkey.vz * dt;

  turkey.x = Math.max(1.2, Math.min(stage.length + 10, turkey.x));
  turkey.z = Math.max(WORLD.laneMinZ, Math.min(WORLD.laneMaxZ, turkey.z));

  // Resolve 3D Elevated Platform Landing (Hay Bales, Butcher Counters, Banquet Tables)
  let supportY = 0;
  for (const p of stage.platforms) {
    if (Math.abs(turkey.x - p.x) < p.w * 0.5 + 0.4 && Math.abs(turkey.z - p.z) < p.d * 0.5 + 0.4) {
      if (prevY >= p.topY - 0.3 && turkey.vy <= 0) {
        supportY = Math.max(supportY, p.topY);
      }
    }
  }

  if (turkey.y <= supportY) {
    turkey.y = supportY;
    turkey.vy = 0;
    turkey.grounded = true;
    turkey.fluttering = false;
  } else {
    turkey.grounded = false;
  }

  // Expressive 3/4 side-front heading: running right turns slightly toward camera (+Z) so face ALWAYS shines!
  const spd = Math.hypot(turkey.vx, turkey.vz);
  if (spd > 0.6) {
    const rawYaw = Math.atan2(turkey.vx, turkey.vz + 1.85);
    let diff = rawYaw - turkey.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    turkey.yaw += diff * Math.min(1, dt * 11);
  }
  turkey.runCycle += dt * (4.5 + spd * 1.15);

  syncTurkeyRig(turkey, dt, combo);
}

export function syncTurkeyRig(turkey, dt, combo = 1) {
  const r = turkey.rig;
  r.root.visible = !turkey.hiding && !(turkey.invulnTimer > 0 && Math.floor(turkey.invulnTimer * 18) % 2 === 0);
  r.root.position.set(turkey.x, turkey.y, turkey.z);
  r.root.rotation.y = turkey.yaw;

  const stride = Math.sin(turkey.runCycle);
  const running = turkey.grounded && Math.hypot(turkey.vx, turkey.vz) > 0.8;
  r.leftLeg.rotation.x = running ? stride * 0.85 : -0.35;
  r.rightLeg.rotation.x = running ? -stride * 0.85 : 0.35;
  r.bodyPivot.position.y = running ? Math.abs(stride) * 0.1 : 0;
  r.bodyPivot.rotation.x = turkey.dashTimer > 0 ? 0.32 : running ? 0.1 : 0.04;

  // Dramatic flapping airfoil wings during Flutter Glide / Jump!
  const flap = turkey.fluttering ? Math.sin(turkey.runCycle * 4.4) * 0.72 + 0.92 : !turkey.grounded ? 0.8 : Math.abs(stride) * 0.24;
  r.leftWing.rotation.z = -flap;
  r.rightWing.rotation.z = flap;

  r.tailFan.rotation.x = -0.44 + Math.sin(turkey.runCycle * 0.9) * 0.09;
  r.wattlePivot.rotation.z = Math.sin(turkey.runCycle * 1.8) * 0.32;
  r.scarfTail.rotation.y = Math.sin(turkey.runCycle * 1.6) * 0.22;
  r.lowerBeak.rotation.x = turkey.squawkTimer > 0 || turkey.fluttering ? Math.PI * 0.76 : Math.PI * 0.6;
  r.auraLight.intensity = combo >= 3 || turkey.dashTimer > 0 ? 2.4 : 0;
  void dt;
}
