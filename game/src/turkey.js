// Player turkey (Barnaby): responsive run/jump/flutter/dash physics, stealth hiding, and prop kicks.

import { PALETTE, PHYSICS, SCORE_VALUES } from './config.js';

export function createTurkey(startX, groundY) {
  return {
    x: startX,
    y: groundY,
    vx: 0,
    vy: 0,
    radius: 26,
    facing: 1,
    grounded: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    fluttering: false,
    flutterSoundTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashDir: 1,
    stamina: PHYSICS.staminaMax,
    lives: 3,
    maxLives: 3,
    invulnTimer: 0,
    hiding: false,
    hideCover: null,
    hideTimer: 0,
    kickCooldown: 0,
    kickAnimTimer: 0,
    gobbleCooldown: 0,
    gobbleMouthTimer: 0,
    closeShaveCooldown: 0,
    onGravy: false,
    runCycle: 0,
    wingFlap: 0,
    squashX: 1,
    squashY: 1,
    wattleSwing: 0,
    wattleVel: 0,
    trail: [],
    lookTargetX: startX + 180,
    lookTargetY: groundY - 40,
  };
}

export function findNearbyCover(turkey, stage) {
  let best = null;
  let bestDist = 72;
  for (const cover of stage.covers) {
    const cx = cover.x + cover.w * 0.5;
    const dx = Math.abs(turkey.x - cx);
    const dy = Math.abs(turkey.y - stage.groundY);
    if (dx < cover.w * 0.52 + 26 && dy < 38 && dx < bestDist) {
      best = cover;
      bestDist = dx;
    }
  }
  return best;
}

export function triggerDash(turkey, direction, audio, particles) {
  if (turkey.dashCooldown > 0 || turkey.dashTimer > 0 || turkey.stamina < PHYSICS.dashCost) {
    return false;
  }
  turkey.hiding = false;
  turkey.hideCover = null;
  turkey.dashDir = direction !== 0 ? Math.sign(direction) : turkey.facing;
  turkey.facing = turkey.dashDir;
  turkey.dashTimer = PHYSICS.dashDuration;
  turkey.dashCooldown = PHYSICS.dashCooldown;
  turkey.stamina = Math.max(0, turkey.stamina - PHYSICS.dashCost);
  turkey.vx = turkey.dashDir * PHYSICS.dashSpeed;
  turkey.vy = Math.min(turkey.vy, -40);
  turkey.squashX = 1.38;
  turkey.squashY = 0.72;
  audio.playDash();
  particles.spawnFeathers(turkey.x - turkey.dashDir * 14, turkey.y - 28, 7, 190);
  return true;
}

export function triggerKickOrGobble(turkey, stage, farmer, audio, particles) {
  if (turkey.kickCooldown > 0) return false;
  turkey.hiding = false;
  turkey.hideCover = null;

  // Check if a kickable prop (pumpkin, flour sack, copper pot) is within range
  let targetProp = null;
  let bestDist = PHYSICS.kickRange;
  for (const prop of stage.kickProps) {
    if (prop.used || prop.kicked) continue;
    const dist = Math.hypot(prop.x - turkey.x, prop.y - (turkey.y - 24));
    if (dist < bestDist) {
      bestDist = dist;
      targetProp = prop;
    }
  }

  if (targetProp) {
    const towardFarmer = farmer && farmer.x < targetProp.x ? -1 : -turkey.facing;
    targetProp.kicked = true;
    targetProp.vx = towardFarmer * 650;
    targetProp.vy = -240;
    turkey.kickCooldown = PHYSICS.kickCooldown;
    turkey.kickAnimTimer = 0.24;
    turkey.squashX = 1.25;
    turkey.squashY = 0.82;
    audio.playBonk();
    particles.spawnDust(targetProp.x, targetProp.y + 10, 8, towardFarmer);
    particles.addCallout(
      targetProp.x,
      targetProp.y - 34,
      targetProp.kind === 'flourSack' ? 'FLOUR KICK!' : targetProp.kind === 'copperPot' ? 'CLANG!' : 'PUMPKIN KICK!',
      PALETTE.gold,
      0.95,
    );
    return true;
  }

  // Otherwise emit a comical GOBBLE decoy wave that pushes nearby knives and distracts Jeb
  if (turkey.gobbleCooldown <= 0) {
    turkey.gobbleCooldown = PHYSICS.gobbleCooldown;
    turkey.gobbleMouthTimer = 0.36;
    turkey.squashX = 0.85;
    turkey.squashY = 1.24;
    audio.playGobble();
    particles.spawnGobbleRing(turkey.x + turkey.facing * 20, turkey.y - 42);
    particles.addCallout(turkey.x, turkey.y - 78, 'GOBBLE!!', '#ffe184', 1.05);
    return 'gobble';
  }
  return false;
}

export function damageTurkey(turkey, knockDir, audio, particles, reason = 'HIT!') {
  if (turkey.invulnTimer > 0 || turkey.dashTimer > 0) return false;
  turkey.hiding = false;
  turkey.hideCover = null;
  turkey.lives = Math.max(0, turkey.lives - 1);
  turkey.invulnTimer = PHYSICS.invulnDuration;
  turkey.vx = knockDir * 310;
  turkey.vy = -410;
  turkey.grounded = false;
  turkey.squashX = 0.72;
  turkey.squashY = 1.32;
  audio.playHit();
  particles.spawnFeathers(turkey.x, turkey.y - 32, 16, 290);
  particles.triggerShake(13, 0.32);
  particles.triggerHitstop(0.065);
  particles.triggerFlash('rgba(220, 42, 24, 0.38)', 0.4);
  particles.addCallout(turkey.x, turkey.y - 76, reason, '#ff6448', 1.18);
  return true;
}

export function updateTurkey(turkey, input, stage, farmer, dt, audio, particles, onScore) {
  const prevY = turkey.y;

  // Timers
  turkey.coyoteTimer = Math.max(0, turkey.coyoteTimer - dt);
  turkey.jumpBufferTimer = Math.max(0, turkey.jumpBufferTimer - dt);
  turkey.dashCooldown = Math.max(0, turkey.dashCooldown - dt);
  turkey.invulnTimer = Math.max(0, turkey.invulnTimer - dt);
  turkey.kickCooldown = Math.max(0, turkey.kickCooldown - dt);
  turkey.kickAnimTimer = Math.max(0, turkey.kickAnimTimer - dt);
  turkey.gobbleCooldown = Math.max(0, turkey.gobbleCooldown - dt);
  turkey.gobbleMouthTimer = Math.max(0, turkey.gobbleMouthTimer - dt);
  turkey.closeShaveCooldown = Math.max(0, turkey.closeShaveCooldown - dt);

  // Spring recovery for squash-and-stretch and wattle physics
  turkey.squashX += (1 - turkey.squashX) * Math.min(1, dt * 13);
  turkey.squashY += (1 - turkey.squashY) * Math.min(1, dt * 13);
  const targetWattle = -turkey.vx * 0.0022;
  turkey.wattleVel += (targetWattle - turkey.wattleSwing) * 42 * dt;
  turkey.wattleVel *= Math.max(0, 1 - dt * 6.5);
  turkey.wattleSwing += turkey.wattleVel * dt;

  // Check if standing in a slippery gravy spill
  turkey.onGravy = false;
  if (turkey.grounded && Math.abs(turkey.y - stage.groundY) < 4) {
    for (const spill of stage.gravySpills) {
      if (turkey.x > spill.x && turkey.x < spill.x + spill.w) {
        turkey.onGravy = true;
        break;
      }
    }
  }

  // Stealth cover hide handling (forgiving ground snap so ducking into cover feels instant!)
  const moveAxis = input.getMoveAxis();
  const wantsHide = input.isHideHeld();
  const nearCover = findNearbyCover(turkey, stage);
  const nearGround = turkey.grounded || (Math.abs(turkey.y - stage.groundY) < 34 && turkey.vy >= -80);

  if (wantsHide && nearGround && nearCover && turkey.dashTimer <= 0) {
    if (!turkey.hiding) {
      turkey.hiding = true;
      turkey.hideCover = nearCover;
      turkey.hideTimer = 0;
      turkey.y = stage.groundY;
      turkey.vy = 0;
      turkey.grounded = true;
      nearCover.rustleTimer = 0.35;
      audio.playHide();
      particles.spawnDust(turkey.x, turkey.y - 6, 7, 0);
      if (farmer && farmer.state === 'chase') {
        onScore(SCORE_VALUES.stealthSlip, 'HIDDEN!', '#a5e86b', turkey.x, turkey.y - 78);
      }
    }
    turkey.hideTimer += dt;
    const coverCenter = nearCover.x + nearCover.w * 0.5;
    turkey.x += (coverCenter - turkey.x) * Math.min(1, dt * 12);
    turkey.vx *= Math.max(0, 1 - dt * 14);
    turkey.stamina = Math.min(PHYSICS.staminaMax, turkey.stamina + PHYSICS.staminaRegenPerSec * 1.15 * dt);
    return;
  } else if (turkey.hiding) {
    turkey.hiding = false;
    turkey.hideCover = null;
    turkey.squashX = 0.82;
    turkey.squashY = 1.24;
  }

  // Buffer jump press
  if (input.wasJumpPressed()) {
    turkey.jumpBufferTimer = PHYSICS.jumpBufferTime;
  }

  // Dash trigger
  if (input.wasDashPressed()) {
    triggerDash(turkey, moveAxis, audio, particles);
  }

  // Kick prop or Gobble decoy
  if (input.wasKickPressed()) {
    const res = triggerKickOrGobble(turkey, stage, farmer, audio, particles);
    if (res === 'gobble' && farmer && Math.abs(farmer.x - turkey.x) < 460) {
      farmer.distractTargetX = turkey.x;
      farmer.distractTimer = 0.7;
    }
  }

  // Horizontal movement
  if (turkey.dashTimer > 0) {
    turkey.dashTimer = Math.max(0, turkey.dashTimer - dt);
    turkey.vx = turkey.dashDir * PHYSICS.dashSpeed;
    turkey.vy *= 0.85;
    turkey.trail.push({ x: turkey.x, y: turkey.y, facing: turkey.facing, alpha: 0.55 });
  } else {
    const accel = turkey.grounded ? PHYSICS.runAccel : PHYSICS.airAccel;
    const maxSpeed = turkey.onGravy ? PHYSICS.maxRunSpeed * 0.74 : PHYSICS.maxRunSpeed;
    if (moveAxis !== 0) {
      turkey.vx += moveAxis * accel * dt;
      if (Math.abs(turkey.vx) > maxSpeed) {
        turkey.vx = Math.sign(turkey.vx) * maxSpeed;
      }
      turkey.facing = moveAxis > 0 ? 1 : -1;
    } else {
      const drag = turkey.onGravy ? PHYSICS.friction * 0.28 : (turkey.grounded ? PHYSICS.friction : PHYSICS.friction * 0.35);
      if (Math.abs(turkey.vx) <= drag * dt) {
        turkey.vx = 0;
      } else {
        turkey.vx -= Math.sign(turkey.vx) * drag * dt;
      }
    }
  }

  // Execute buffered jump with coyote time
  if (turkey.jumpBufferTimer > 0 && turkey.coyoteTimer > 0) {
    turkey.vy = PHYSICS.jumpVelocity;
    turkey.grounded = false;
    turkey.coyoteTimer = 0;
    turkey.jumpBufferTimer = 0;
    turkey.squashX = 0.76;
    turkey.squashY = 1.32;
    audio.playJump();
    particles.spawnDust(turkey.x, turkey.y, 6, -turkey.facing);
    particles.spawnFeathers(turkey.x, turkey.y - 18, 3, 120);
  }

  // Variable jump height cut
  if (!input.isJumpHeld() && turkey.vy < -180 && turkey.dashTimer <= 0) {
    turkey.vy *= 1 - (1 - PHYSICS.jumpCutMultiplier) * Math.min(1, dt * 16);
  }

  // Wing-flutter glide when holding jump while descending
  turkey.fluttering = false;
  if (!turkey.grounded && turkey.vy > 20 && input.isJumpHeld() && turkey.stamina > 4 && turkey.dashTimer <= 0) {
    turkey.fluttering = true;
    turkey.stamina = Math.max(0, turkey.stamina - PHYSICS.flutterDrainPerSec * dt);
    turkey.vy = Math.min(turkey.vy + PHYSICS.flutterGravity * dt, PHYSICS.maxFlutterFall);
    turkey.wingFlap += dt * 34;
    turkey.flutterSoundTimer -= dt;
    if (turkey.flutterSoundTimer <= 0) {
      turkey.flutterSoundTimer = 0.14;
      audio.playFlutter();
      particles.spawnFeathers(turkey.x, turkey.y - 16, 1, 90);
    }
  } else if (turkey.dashTimer <= 0) {
    turkey.vy = Math.min(turkey.vy + PHYSICS.gravity * dt, PHYSICS.maxFallSpeed);
    turkey.wingFlap += dt * (turkey.grounded ? 7 : 12);
    if (turkey.grounded) {
      turkey.stamina = Math.min(PHYSICS.staminaMax, turkey.stamina + PHYSICS.staminaRegenPerSec * dt);
    } else {
      turkey.stamina = Math.min(PHYSICS.staminaMax, turkey.stamina + PHYSICS.staminaRegenPerSec * 0.35 * dt);
    }
  }

  // Integrate position
  turkey.x += turkey.vx * dt;
  turkey.y += turkey.vy * dt;
  turkey.x = Math.max(48, Math.min(stage.length - 48, turkey.x));

  // Platform one-way landing collision
  turkey.grounded = false;
  if (turkey.vy >= 0) {
    for (const plat of stage.platforms) {
      if (
        turkey.x + 18 > plat.x &&
        turkey.x - 18 < plat.x + plat.w &&
        prevY <= plat.y + 8 &&
        turkey.y >= plat.y
      ) {
        turkey.y = plat.y;
        if (turkey.vy > 260) {
          turkey.squashX = 1.26;
          turkey.squashY = 0.78;
          particles.spawnDust(turkey.x, turkey.y, 4, 0);
        }
        turkey.vy = 0;
        turkey.grounded = true;
        break;
      }
    }
  }

  // Ground collision
  if (turkey.y >= stage.groundY) {
    if (prevY < stage.groundY - 12 && turkey.vy > 260) {
      turkey.squashX = 1.28;
      turkey.squashY = 0.76;
      particles.spawnDust(turkey.x, stage.groundY, 5, 0);
    }
    turkey.y = stage.groundY;
    turkey.vy = 0;
    turkey.grounded = true;
  }

  if (turkey.grounded) {
    turkey.coyoteTimer = PHYSICS.coyoteTime;
    if (Math.abs(turkey.vx) > 35) {
      turkey.runCycle += dt * (Math.abs(turkey.vx) / 36);
      if (Math.random() < dt * 7) {
        particles.spawnDust(turkey.x - turkey.facing * 14, turkey.y - 2, 1, -turkey.facing);
      }
    }
  }

  // Update dash trail
  for (let i = turkey.trail.length - 1; i >= 0; i--) {
    turkey.trail[i].alpha -= dt * 2.8;
    if (turkey.trail[i].alpha <= 0) turkey.trail.splice(i, 1);
  }
}
