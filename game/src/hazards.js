// Thanksgiving hazards & collectibles: 450°F roasting ovens, carving knives, pendulums, kickable props, pickups.

import { PALETTE, PHYSICS, SCORE_VALUES } from './config.js';
import { stunFarmer } from './farmer.js';
import { damageTurkey } from './turkey.js';

export function updateOvens(stage, turkey, dt, audio, particles, onScore) {
  for (const oven of stage.ovens) {
    oven.timer = (oven.timer + dt) % oven.cycleDuration;
    const t = oven.timer / oven.cycleDuration;

    if (t < 0.48) {
      oven.state = 'idle';
      oven.doorOpen = Math.max(0, oven.doorOpen - dt * 5);
      oven.blastedThisCycle = false;
      oven.closeShaveGiven = false;
    } else if (t < 0.72) {
      oven.state = 'telegraph';
      oven.doorOpen = 0.14 + Math.sin(oven.timer * 42) * 0.06;
      if (Math.random() < dt * 8) {
        particles.spawnEmbers(oven.x + oven.w * 0.5, oven.y + 52, 1, oven.facing);
      }
    } else {
      oven.state = 'blast';
      oven.doorOpen = Math.min(1, oven.doorOpen + dt * 9);
      if (!oven.blastedThisCycle) {
        oven.blastedThisCycle = true;
        if (Math.abs(turkey.x - oven.x) < 760) {
          audio.playOvenBlast();
        }
        particles.spawnEmbers(oven.x + oven.w * 0.5 + oven.facing * 45, oven.y + 66, 12, oven.facing);
      }
      if (Math.random() < dt * 26) {
        particles.spawnEmbers(oven.x + oven.w * 0.5 + oven.facing * 52, oven.y + 68, 1, oven.facing);
      }
    }

    // Flame & heat-wave collision box when blasting
    if (oven.state === 'blast' && !turkey.hiding) {
      const flameStartX = oven.facing < 0 ? oven.x - oven.flameLength : oven.x + oven.w;
      const flameEndX = oven.facing < 0 ? oven.x + 12 : oven.x + oven.w + oven.flameLength;
      const flameTop = oven.y + 34;
      const flameBottom = stage.groundY - 4;

      const hit =
        turkey.x + 16 > flameStartX &&
        turkey.x - 16 < flameEndX &&
        turkey.y - 6 > flameTop &&
        turkey.y - 44 < flameBottom;

      if (hit) {
        damageTurkey(turkey, oven.facing, audio, particles, '450°F ROASTED!');
      } else if (
        !oven.closeShaveGiven &&
        turkey.closeShaveCooldown <= 0 &&
        turkey.x + 48 > flameStartX &&
        turkey.x - 48 < flameEndX &&
        turkey.y > flameTop - 68 &&
        turkey.y - 48 < flameBottom + 14
      ) {
        oven.closeShaveGiven = true;
        turkey.closeShaveCooldown = PHYSICS.closeShaveCooldown;
        audio.playCloseShave();
        particles.triggerHitstop(0.035);
        particles.spawnSparkles(turkey.x, turkey.y - 32, 9, PALETTE.ovenCore);
        onScore(SCORE_VALUES.closeShave, 'TOO HOT! +150', '#ffca57', turkey.x, turkey.y - 84);
      }
    }
  }
}

export function updatePendulums(stage, turkey, dt, audio, particles, onScore) {
  for (const pend of stage.pendulums) {
    pend.phase += dt * pend.speed;
    pend.angle = Math.sin(pend.phase) * pend.maxAngle;
    pend.bobX = pend.x + Math.sin(pend.angle) * pend.length;
    pend.bobY = pend.pivotY + Math.cos(pend.angle) * pend.length;

    if (turkey.hiding) continue;
    const dist = Math.hypot(turkey.x - pend.bobX, (turkey.y - 28) - pend.bobY);
    if (dist < 42) {
      damageTurkey(turkey, turkey.x >= pend.bobX ? 1 : -1, audio, particles, 'CLEAVER HIT!');
    } else if (dist < 84 && !pend.closeShaveGiven && turkey.closeShaveCooldown <= 0) {
      pend.closeShaveGiven = true;
      turkey.closeShaveCooldown = PHYSICS.closeShaveCooldown;
      audio.playCloseShave();
      particles.spawnSparkles(turkey.x, turkey.y - 34, 8, PALETTE.steel);
      onScore(SCORE_VALUES.closeShave, 'CLOSE SHAVE! +150', '#ffe38c', turkey.x, turkey.y - 82);
    } else if (dist > 130) {
      pend.closeShaveGiven = false;
    }
  }
}

export function spawnStageKnifeVolley(stage, turkey, knives, rng, audio) {
  // Spawn a telegraphed slicing or falling carving knife ahead of Barnaby!
  const isHorizontal = stage.theme === 'kitchen' || stage.theme === 'banquet' ? rng.next() < 0.62 : rng.next() < 0.35;
  if (isHorizontal) {
    const startX = Math.min(stage.length - 120, turkey.x + rng.range(430, 620));
    const startY = stage.groundY - rng.pick([44, 96, 152]);
    knives.push({
      x: startX,
      y: startY,
      vx: -(460 + stage.index * 45) * stage.difficultyScale,
      vy: 0,
      gravity: 0,
      rot: Math.PI,
      spin: 0,
      kind: 'slicer',
      telegraph: 0.42,
      life: 2.8,
      closeShaveGiven: false,
    });
  } else {
    const startX = Math.min(stage.length - 160, turkey.x + rng.range(180, 440));
    knives.push({
      x: startX,
      y: 44,
      vx: rng.range(-48, 32),
      vy: 430 + stage.index * 36,
      gravity: 220,
      rot: Math.PI * 0.5,
      spin: 0,
      kind: 'dropper',
      telegraph: 0.48,
      life: 2.4,
      closeShaveGiven: false,
    });
  }
  audio.playKnifeShing();
}

export function updateCarvingKnives(knives, turkey, stage, dt, audio, particles, onScore) {
  for (let i = knives.length - 1; i >= 0; i--) {
    const knife = knives[i];
    if (knife.telegraph > 0) {
      knife.telegraph = Math.max(0, knife.telegraph - dt);
      continue;
    }
    knife.life -= dt;
    knife.vy += knife.gravity * dt;
    knife.x += knife.vx * dt;
    knife.y += knife.vy * dt;
    if (knife.spin !== 0) {
      knife.rot += knife.spin * dt;
    } else {
      knife.rot = Math.atan2(knife.vy, knife.vx);
    }

    if (knife.life <= 0 || knife.y > stage.groundY + 18 || knife.x < -80 || knife.x > stage.length + 120) {
      if (knife.y >= stage.groundY) {
        particles.spawnDust(knife.x, stage.groundY, 4, 0);
      }
      knives.splice(i, 1);
      continue;
    }

    if (turkey.hiding) continue;

    const dist = Math.hypot(turkey.x - knife.x, (turkey.y - 28) - knife.y);
    if (dist < 34) {
      const hurt = damageTurkey(turkey, knife.vx >= 0 ? 1 : -1, audio, particles, 'CARVING KNIFE!');
      if (hurt) {
        knives.splice(i, 1);
      }
    } else if (
      dist < PHYSICS.closeShaveRadius + 24 &&
      !knife.closeShaveGiven &&
      turkey.closeShaveCooldown <= 0
    ) {
      knife.closeShaveGiven = true;
      turkey.closeShaveCooldown = PHYSICS.closeShaveCooldown;
      audio.playCloseShave();
      particles.triggerHitstop(0.035);
      particles.spawnSparkles(turkey.x, turkey.y - 34, 9, '#fff1b8');
      onScore(SCORE_VALUES.closeShave, 'CLOSE SHAVE! +150', PALETTE.gold, turkey.x, turkey.y - 82);
    }
  }
}

export function updateKickProps(stage, farmer, dt, audio, particles, onScore) {
  for (const prop of stage.kickProps) {
    if (prop.used || !prop.kicked) continue;
    prop.vy += 1200 * dt;
    prop.x += prop.vx * dt;
    prop.y += prop.vy * dt;
    prop.rot += (prop.vx * 0.015) * dt;

    if (prop.y + prop.radius >= stage.groundY) {
      prop.y = stage.groundY - prop.radius;
      prop.vy *= -0.45;
      prop.vx *= 0.86;
      if (Math.abs(prop.vx) < 75) {
        prop.kicked = false;
        prop.vx = 0;
        prop.vy = 0;
      }
    }

    // Check impact with Farmer Jeb!
    if (farmer && farmer.state !== 'stunned' && farmer.state !== 'blind') {
      const hitDist = Math.hypot(prop.x - farmer.x, prop.y - (farmer.y - 54));
      if (hitDist < 62) {
        prop.used = true;
        stunFarmer(farmer, prop.kind, audio, particles, onScore);
      }
    }
  }
}

export function updatePickups(stage, turkey, dt, audio, particles, onPickup) {
  for (const item of stage.pickups) {
    if (item.collected) continue;
    item.bobPhase += dt * 4.2;
    const dist = Math.hypot(turkey.x - item.x, (turkey.y - 28) - item.y);
    if (dist < 42) {
      item.collected = true;
      turkey.stamina = Math.min(PHYSICS.staminaMax, turkey.stamina + (item.kind === 'goldenFeather' ? 45 : 18));
      if (item.kind === 'goldenFeather' && turkey.lives < turkey.maxLives) {
        turkey.lives += 1;
      }
      particles.spawnSparkles(item.x, item.y, item.kind === 'goldenFeather' ? 14 : 7,
        item.kind === 'cranberry' ? '#ff4f5a' : PALETTE.gold);
      onPickup(item);
      audio.playPickup(1);
    }
  }
}
