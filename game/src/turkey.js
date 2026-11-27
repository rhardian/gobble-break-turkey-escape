// 3D Player Turkey (Barnaby): 8-directional sprinting, Jump & Flutter Glide, Feather Dash, Haystack Stealth, Prop Kicks, Perks.

import { PHYSICS, SCORE_VALUES, WORLD } from './config.js';

export function createTurkeyState(rig, startZ = 7.5, perks = new Set()) {
  const maxStam = PHYSICS.staminaMax + (perks.has('extra_plumage') ? 25 : 0);
  const maxLives = 3 + (perks.has('extra_plumage') ? 1 : 0);
  return {
    rig,
    x: 0,
    y: 0,
    z: startZ,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    grounded: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    fluttering: false,
    flutterSfxTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashDirX: 0,
    dashDirZ: 1,
    stamina: maxStam,
    maxStamina: maxStam,
    lives: maxLives,
    maxLives,
    invulnTimer: 0,
    hiding: false,
    hideCover: null,
    kickCooldown: 0,
    gobbleCooldown: 0,
    closeShaveCooldown: 0,
    runCycle: 0,
    wingPhase: 0,
    squashY: 1,
  };
}

export function findNearbyCover3D(turkey, stage) {
  let best = null;
  let bestDist = 2.35;
  for (const c of stage.covers) {
    const d = Math.hypot(turkey.x - c.x, turkey.z - c.z);
    if (d < bestDist && turkey.y < 0.75) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

export function triggerDash3D(turkey, dirX, dirZ, perks, audio, effects) {
  const cost = perks.has('cranberry_dash') ? PHYSICS.dashCost * 0.7 : PHYSICS.dashCost;
  if (turkey.dashCooldown > 0 || turkey.dashTimer > 0 || turkey.stamina < cost) return false;

  turkey.hiding = false;
  turkey.hideCover = null;
  const len = Math.hypot(dirX, dirZ);
  if (len > 0.05) {
    turkey.dashDirX = dirX / len;
    turkey.dashDirZ = dirZ / len;
  } else {
    turkey.dashDirX = Math.sin(turkey.yaw);
    turkey.dashDirZ = Math.cos(turkey.yaw);
  }
  turkey.yaw = Math.atan2(turkey.dashDirX, turkey.dashDirZ);
  turkey.dashTimer = PHYSICS.dashDuration;
  turkey.dashCooldown = PHYSICS.dashCooldown;
  turkey.stamina = Math.max(0, turkey.stamina - cost);
  turkey.squashY = 0.78;
  audio.playDash();
  effects.spawnFeathers(turkey.x, turkey.y + 0.8, turkey.z, 8, 6.2);
  return true;
}

export function triggerKickOrGobble3D(turkey, stage, farmer, knives, perks, audio, effects) {
  if (turkey.kickCooldown > 0) return false;
  turkey.hiding = false;
  turkey.hideCover = null;

  // Kick nearest 3D pumpkin, flour sack, or copper pot straight toward Farmer Jeb!
  let targetProp = null;
  let bestDist = PHYSICS.kickRange;
  for (const prop of stage.kickProps) {
    if (prop.used || prop.kicked) continue;
    const d = Math.hypot(prop.x - turkey.x, prop.z - turkey.z);
    if (d < bestDist) {
      bestDist = d;
      targetProp = prop;
    }
  }

  if (targetProp) {
    let dx = farmer ? farmer.x - targetProp.x : 0;
    let dz = farmer ? farmer.z - targetProp.z : -1;
    const len = Math.max(0.01, Math.hypot(dx, dz));
    targetProp.kicked = true;
    targetProp.vx = (dx / len) * 18.5;
    targetProp.vz = (dz / len) * 18.5;
    targetProp.vy = 5.2;
    turkey.kickCooldown = PHYSICS.kickCooldown;
    turkey.squashY = 1.25;
    audio.playBonk();
    effects.addCallout(
      targetProp.x,
      1.7,
      targetProp.z,
      targetProp.kind === 'flourSack' ? 'FLOUR KICK!' : 'PROP KICK!',
      '#ffd85c',
    );
    return 'kick';
  }

  // Otherwise unleash sonic 3D GOBBLE wave that deflects nearby flying knives!
  if (turkey.gobbleCooldown <= 0) {
    turkey.gobbleCooldown = PHYSICS.gobbleCooldown;
    turkey.squashY = 1.28;
    audio.playGobble();
    effects.spawnGobbleWave(turkey.x, turkey.y + 0.65, turkey.z);
    effects.addCallout(turkey.x, turkey.y + 2.1, turkey.z, 'GOBBLE!!', '#ffe484');

    const deflectRadius = perks.has('flour_blast') ? 5.8 : 4.2;
    for (const k of knives) {
      if (Math.hypot(k.x - turkey.x, k.z - turkey.z) < deflectRadius) {
        k.vz = -Math.abs(k.vz) - 8;
        k.vy = 4.5;
      }
    }
    return 'gobble';
  }
  return false;
}

export function damageTurkey3D(turkey, knockX, knockZ, audio, effects, label = 'HIT!') {
  if (turkey.invulnTimer > 0 || turkey.dashTimer > 0) return false;
  turkey.hiding = false;
  turkey.hideCover = null;
  turkey.lives = Math.max(0, turkey.lives - 1);
  turkey.invulnTimer = PHYSICS.invulnDuration;
  turkey.vx = knockX * 7.5;
  turkey.vz = knockZ * 7.5;
  turkey.vy = 7.8;
  turkey.grounded = false;
  turkey.squashY = 1.32;
  audio.playHit();
  effects.spawnFeathers(turkey.x, turkey.y + 0.9, turkey.z, 16, 7.5);
  effects.triggerShake(0.42, 0.3);
  effects.triggerHitstop(0.06);
  effects.triggerFlash('rgba(220, 38, 20, 0.36)', 0.38);
  effects.addCallout(turkey.x, turkey.y + 2.2, turkey.z, label, '#ff684c', 1.15);
  return true;
}

export function updateTurkey3D(turkey, input, stage, farmer, knives, perks, dt, audio, effects, onScore, combo = 1) {
  const prevY = turkey.y;

  turkey.coyoteTimer = Math.max(0, turkey.coyoteTimer - dt);
  turkey.jumpBufferTimer = Math.max(0, turkey.jumpBufferTimer - dt);
  turkey.dashCooldown = Math.max(0, turkey.dashCooldown - dt);
  turkey.invulnTimer = Math.max(0, turkey.invulnTimer - dt);
  turkey.kickCooldown = Math.max(0, turkey.kickCooldown - dt);
  turkey.gobbleCooldown = Math.max(0, turkey.gobbleCooldown - dt);
  turkey.closeShaveCooldown = Math.max(0, turkey.closeShaveCooldown - dt);
  turkey.squashY += (1 - turkey.squashY) * Math.min(1, dt * 12);

  // Check slippery gravy spill
  let onGravy = false;
  if (turkey.y < 0.12) {
    for (const sp of stage.gravySpills) {
      const nx = (turkey.x - sp.x) / sp.rx;
      const nz = (turkey.z - sp.z) / sp.rz;
      if (nx * nx + nz * nz <= 1) {
        onGravy = true;
        break;
      }
    }
  }

  // Stealth cover dive (`E` / `C`)
  const nearCover = findNearbyCover3D(turkey, stage);
  if (input.isHideHeld() && nearCover && turkey.dashTimer <= 0) {
    if (!turkey.hiding) {
      turkey.hiding = true;
      turkey.hideCover = nearCover;
      turkey.y = 0;
      turkey.vy = 0;
      turkey.grounded = true;
      nearCover.rustle = 0.35;
      audio.playHide();
      if (farmer && farmer.state === 'chase') {
        onScore(120, 'HIDDEN!', '#a4f569', nearCover.x, 2.2, nearCover.z);
      }
    }
    turkey.x += (nearCover.x - turkey.x) * Math.min(1, dt * 12);
    turkey.z += (nearCover.z - turkey.z) * Math.min(1, dt * 12);
    turkey.vx = 0;
    turkey.vz = 0;
    turkey.stamina = Math.min(turkey.maxStamina, turkey.stamina + PHYSICS.staminaRegenPerSec * 1.2 * dt);
    syncTurkeyRig(turkey, dt, combo);
    return;
  } else if (turkey.hiding) {
    if (farmer && farmer.state === 'search' && Math.hypot(farmer.x - turkey.x, farmer.z - turkey.z) < 6.5) {
      turkey.vz = PHYSICS.maxRunSpeed + 4.2;
      turkey.stamina = Math.min(turkey.maxStamina, turkey.stamina + 25);
      audio.playCloseShave();
      effects.spawnFeathers(turkey.x, 0.9, turkey.z, 9, 6.0);
      onScore(SCORE_VALUES.ambushSlip, 'AMBUSH SLIP! +200', '#a8ff6b', turkey.x, 2.3, turkey.z);
    }
    turkey.hiding = false;
    turkey.hideCover = null;
  }

  const move = input.getMoveVector3D();

  if (input.wasJumpPressed()) {
    turkey.jumpBufferTimer = PHYSICS.jumpBufferTime;
  }
  if (input.wasDashPressed()) {
    triggerDash3D(turkey, move.x, move.z, perks, audio, effects);
  }
  if (input.wasKickPressed()) {
    triggerKickOrGobble3D(turkey, stage, farmer, knives, perks, audio, effects);
  }

  // Horizontal 3D velocity
  if (turkey.dashTimer > 0) {
    turkey.dashTimer = Math.max(0, turkey.dashTimer - dt);
    const spd = PHYSICS.dashSpeed * (perks.has('cranberry_dash') ? 1.25 : 1);
    turkey.vx = turkey.dashDirX * spd;
    turkey.vz = turkey.dashDirZ * spd;
    turkey.vy = Math.max(0, turkey.vy * 0.8);
  } else {
    const accel = turkey.grounded ? PHYSICS.accel : PHYSICS.airAccel;
    const maxSpd = onGravy ? PHYSICS.maxRunSpeed * 0.72 : PHYSICS.maxRunSpeed;
    if (Math.hypot(move.x, move.z) > 0.05) {
      turkey.vx += move.x * accel * dt;
      turkey.vz += move.z * accel * dt;
      const curSpd = Math.hypot(turkey.vx, turkey.vz);
      if (curSpd > maxSpd) {
        turkey.vx = (turkey.vx / curSpd) * maxSpd;
        turkey.vz = (turkey.vz / curSpd) * maxSpd;
      }
      const targetYaw = Math.atan2(move.x, move.z);
      let diff = targetYaw - turkey.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      turkey.yaw += diff * Math.min(1, dt * 14);
    } else {
      const drag = (onGravy ? PHYSICS.friction * 0.3 : PHYSICS.friction) * dt;
      const curSpd = Math.hypot(turkey.vx, turkey.vz);
      if (curSpd <= drag) {
        turkey.vx = 0;
        turkey.vz = 0;
      } else {
        turkey.vx -= (turkey.vx / curSpd) * drag;
        turkey.vz -= (turkey.vz / curSpd) * drag;
      }
    }
  }

  // Buffered 3D Jump + Coyote Time
  if (turkey.jumpBufferTimer > 0 && turkey.coyoteTimer > 0) {
    const jumpBoost = perks.has('tailwind_flutter') ? 1.14 : 1;
    turkey.vy = PHYSICS.jumpVelocity * jumpBoost;
    turkey.grounded = false;
    turkey.coyoteTimer = 0;
    turkey.jumpBufferTimer = 0;
    turkey.squashY = 1.3;
    audio.playJump();
    effects.spawnFeathers(turkey.x, turkey.y + 0.5, turkey.z, 3, 3.8);
  }

  // Wing-Flutter Glide when holding Space while descending!
  turkey.fluttering = false;
  if (!turkey.grounded && turkey.vy < -0.4 && input.isJumpHeld() && turkey.stamina > 3 && turkey.dashTimer <= 0) {
    turkey.fluttering = true;
    turkey.stamina = Math.max(0, turkey.stamina - PHYSICS.flutterDrainPerSec * dt);
    const maxFall = perks.has('tailwind_flutter') ? PHYSICS.maxFlutterFall * 0.72 : PHYSICS.maxFlutterFall;
    turkey.vy = Math.max(turkey.vy - PHYSICS.flutterGravity * dt, -maxFall);
    turkey.flutterSfxTimer -= dt;
    if (turkey.flutterSfxTimer <= 0) {
      turkey.flutterSfxTimer = 0.14;
      audio.playFlutter();
      effects.spawnFeathers(turkey.x, turkey.y + 0.6, turkey.z, 1, 2.8);
    }
  } else if (turkey.dashTimer <= 0) {
    turkey.vy = Math.max(turkey.vy - PHYSICS.gravity * dt, -PHYSICS.maxFallSpeed);
    const regen = turkey.grounded ? PHYSICS.staminaRegenPerSec : PHYSICS.staminaRegenPerSec * 0.35;
    turkey.stamina = Math.min(turkey.maxStamina, turkey.stamina + regen * dt);
  }

  turkey.x = Math.max(-WORLD.laneHalfWidth, Math.min(WORLD.laneHalfWidth, turkey.x + turkey.vx * dt));
  turkey.z = Math.max(2.0, Math.min(stage.length - 2.0, turkey.z + turkey.vz * dt));
  turkey.y += turkey.vy * dt;

  // 3D Elevated Platform Landing Collision
  turkey.grounded = false;
  if (turkey.vy <= 0) {
    for (const p of stage.platforms) {
      if (
        Math.abs(turkey.x - p.x) < p.w * 0.5 + 0.38 &&
        Math.abs(turkey.z - p.z) < p.d * 0.5 + 0.38 &&
        prevY >= p.topY - 0.18 &&
        turkey.y <= p.topY
      ) {
        turkey.y = p.topY;
        turkey.vy = 0;
        turkey.grounded = true;
        break;
      }
    }
  }

  // Floor collision
  if (turkey.y <= 0) {
    if (prevY > 0.3 && turkey.vy < -6) {
      turkey.squashY = 0.78;
    }
    turkey.y = 0;
    turkey.vy = 0;
    turkey.grounded = true;
  }

  if (turkey.grounded) {
    turkey.coyoteTimer = PHYSICS.coyoteTime;
  }

  syncTurkeyRig(turkey, dt, combo);
}

export function syncTurkeyRig(turkey, dt, combo = 1) {
  const { rig } = turkey;
  rig.root.visible = !turkey.hiding;
  rig.root.position.set(turkey.x, turkey.y, turkey.z);
  rig.root.rotation.y = turkey.yaw;

  const speed = Math.hypot(turkey.vx, turkey.vz);
  if (turkey.grounded && speed > 0.6) {
    turkey.runCycle += dt * speed * 1.45;
  }
  turkey.wingPhase += dt * (turkey.fluttering ? 34 : 8);

  const bob = turkey.grounded && speed > 0.6 ? Math.abs(Math.sin(turkey.runCycle)) * 0.12 : 0;
  rig.bodyPivot.position.y = bob;
  rig.bodyPivot.scale.set(1 / Math.sqrt(turkey.squashY), turkey.squashY, 1 / Math.sqrt(turkey.squashY));

  // Wing articulation
  if (turkey.fluttering || turkey.dashTimer > 0) {
    const flap = Math.sin(turkey.wingPhase) * 0.75;
    rig.leftWing.rotation.z = 0.85 + flap;
    rig.rightWing.rotation.z = -0.85 - flap;
    rig.tailFan.scale.set(1.22, 1.15, 1);
  } else {
    rig.leftWing.rotation.z = 0.12 + Math.sin(turkey.wingPhase) * 0.08;
    rig.rightWing.rotation.z = -0.12 - Math.sin(turkey.wingPhase) * 0.08;
    rig.tailFan.scale.set(1, 1, 1);
  }

  // Leg stride & bouncy wattle
  const stride = turkey.grounded ? Math.sin(turkey.runCycle) * 0.65 : 0.45;
  rig.leftLeg.rotation.x = stride;
  rig.rightLeg.rotation.x = -stride;
  rig.wattlePivot.rotation.z = Math.sin(turkey.runCycle * 1.5) * 0.32;
  rig.scarfTail.rotation.x = Math.sin(turkey.wingPhase * 1.4) * 0.18;

  // Invulnerability blink & combo fever light
  if (turkey.invulnTimer > 0) {
    rig.root.visible = !turkey.hiding && Math.floor(turkey.invulnTimer * 18) % 2 === 0;
  }
  rig.auraLight.intensity = combo >= 4 ? 1.8 : 0;
}
