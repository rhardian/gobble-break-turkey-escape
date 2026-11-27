// 3D Hazard & Collectible Simulation: 450°F Roasting Ovens, Spinning Carving Knives, Pendulum Cleavers, Kick Props, Pickups.

import { PHYSICS, SCORE_VALUES, WORLD } from './config.js';
import { stunFarmer3D } from './farmer.js';
import { createCarvingKnifeMesh } from './models.js';
import { damageTurkey3D } from './turkey.js';

export function updateOvens3D(stage, turkey, time, dt, audio, effects, onScore) {
  for (const oven of stage.ovens) {
    oven.timer = (oven.timer + dt) % oven.cycleDuration;
    const t = oven.timer / oven.cycleDuration;

    if (t < 0.46) {
      oven.state = 'idle';
      oven.doorPivot.rotation.z += (0 - oven.doorPivot.rotation.z) * Math.min(1, dt * 8);
      oven.flameGroup.visible = false;
      oven.fireLight.intensity = 1.6;
      oven.blastedThisCycle = false;
      oven.closeShaveGiven = false;
    } else if (t < 0.70) {
      oven.state = 'telegraph';
      oven.doorPivot.rotation.z = -oven.facingDir * (0.28 + Math.sin(time * 38) * 0.08);
      oven.flameGroup.visible = false;
      oven.fireLight.intensity = 3.2 + Math.sin(time * 30) * 0.8;
      if (Math.random() < dt * 9 && Math.abs(turkey.z - oven.z) < 22) {
        effects.spawnEmbers(oven.x + oven.facingDir * 1.3, 1.1, oven.z, oven.facingDir, 1);
      }
    } else {
      oven.state = 'blast';
      oven.doorPivot.rotation.z += (-oven.facingDir * 1.45 - oven.doorPivot.rotation.z) * Math.min(1, dt * 12);
      oven.flameGroup.visible = true;
      const pulse = 0.92 + Math.sin(time * 34) * 0.12;
      oven.flameGroup.scale.set(pulse, 1 + Math.cos(time * 28) * 0.08, 1);
      oven.fireLight.intensity = 6.2 + Math.sin(time * 36) * 1.2;

      if (!oven.blastedThisCycle) {
        oven.blastedThisCycle = true;
        if (Math.abs(turkey.z - oven.z) < 20) {
          audio.playOvenBlast();
          effects.spawnEmbers(oven.x + oven.facingDir * 1.5, 1.1, oven.z, oven.facingDir, 8);
        }
      }

      // Check 3D flame jet box against Barnaby!
      if (!turkey.hiding) {
        const minX = oven.facingDir > 0 ? oven.x + 1.0 : oven.x - 1.0 - oven.flameRange;
        const maxX = oven.facingDir > 0 ? oven.x + 1.0 + oven.flameRange : oven.x - 1.0;
        const inX = turkey.x + 0.42 > minX && turkey.x - 0.42 < maxX;
        const inZ = Math.abs(turkey.z - oven.z) < 0.95;
        const inY = turkey.y < 1.58;

        if (inX && inZ && inY) {
          damageTurkey3D(turkey, oven.facingDir * 0.6, -0.5, audio, effects, '450°F ROASTED!');
        } else if (
          !oven.closeShaveGiven &&
          turkey.closeShaveCooldown <= 0 &&
          inX &&
          Math.abs(turkey.z - oven.z) < 1.65 &&
          turkey.y < 2.9
        ) {
          oven.closeShaveGiven = true;
          turkey.closeShaveCooldown = PHYSICS.closeShaveCooldown;
          audio.playCloseShave();
          effects.triggerHitstop(0.035);
          effects.spawnFeathers(turkey.x, turkey.y + 0.8, turkey.z, 5, 4.5);
          onScore(SCORE_VALUES.closeShave, 'TOO HOT! +150', '#ffca57', turkey.x, turkey.y + 2.1, turkey.z);
        }
      }
    }
  }
}

export function updatePendulums3D(stage, turkey, dt, audio, effects, onScore) {
  for (const p of stage.pendulums) {
    p.phase += dt * p.speed;
    const angle = Math.sin(p.phase) * p.maxAngle;
    p.pivot.rotation.z = angle;

    const armLen = Math.abs(p.bobLocalY);
    p.bobX = Math.sin(angle) * armLen;
    p.bobY = 5.5 - Math.cos(angle) * armLen;

    if (turkey.hiding) continue;
    const d = Math.hypot(turkey.x - p.bobX, (turkey.y + 0.75) - p.bobY, turkey.z - p.z);
    if (d < 1.18) {
      damageTurkey3D(turkey, Math.sign(turkey.x - p.bobX) || 1, -0.4, audio, effects, 'CLEAVER HIT!');
    } else if (d < 2.25 && !p.closeShaveGiven && turkey.closeShaveCooldown <= 0) {
      p.closeShaveGiven = true;
      turkey.closeShaveCooldown = PHYSICS.closeShaveCooldown;
      audio.playCloseShave();
      onScore(SCORE_VALUES.closeShave, 'CLOSE SHAVE! +150', '#ffe38c', turkey.x, turkey.y + 2.1, turkey.z);
    } else if (d > 3.2) {
      p.closeShaveGiven = false;
    }
  }
}

export function spawnStageKnifeVolley3D(stage, turkey, knives, scene, rng, audio) {
  const z = Math.min(stage.length - 6, turkey.z + rng.range(13, 19));
  const x = rng.range(-WORLD.laneHalfWidth + 1.0, WORLD.laneHalfWidth - 1.0);
  const mesh = createCarvingKnifeMesh(1.15);
  mesh.position.set(x, 1.05, z);
  scene.add(mesh);

  knives.push({
    mesh,
    x,
    y: 1.05,
    z,
    vx: (turkey.x - x) * 0.25,
    vy: 0,
    vz: -(13.5 + stage.index * 1.4) * stage.difficultyScale,
    gravity: 0,
    spin: 11.0,
    life: 2.6,
    closeShaveGiven: false,
  });
  if (Math.abs(turkey.z - z) < 22) {
    audio.playKnifeShing();
  }
}

export function updateKnives3D(knives, turkey, scene, dt, audio, effects, onScore) {
  for (let i = knives.length - 1; i >= 0; i--) {
    const k = knives[i];
    k.life -= dt;
    k.vy -= k.gravity * dt;
    k.x += k.vx * dt;
    k.y += k.vy * dt;
    k.z += k.vz * dt;

    k.mesh.position.set(k.x, k.y, k.z);
    k.mesh.rotation.y = Math.atan2(-k.vz, k.vx);
    k.mesh.rotation.z += k.spin * dt;

    if (k.life <= 0 || k.y < 0.05) {
      scene.remove(k.mesh);
      knives.splice(i, 1);
      continue;
    }

    if (turkey.hiding) continue;
    const d = Math.hypot(turkey.x - k.x, (turkey.y + 0.75) - k.y, turkey.z - k.z);
    if (d < 0.92) {
      const hurt = damageTurkey3D(turkey, Math.sign(k.vx) || 0.5, -0.5, audio, effects, 'CARVING KNIFE!');
      if (hurt) {
        scene.remove(k.mesh);
        knives.splice(i, 1);
      }
    } else if (d < PHYSICS.closeShaveDist && !k.closeShaveGiven && turkey.closeShaveCooldown <= 0) {
      k.closeShaveGiven = true;
      turkey.closeShaveCooldown = PHYSICS.closeShaveCooldown;
      audio.playCloseShave();
      effects.triggerHitstop(0.035);
      effects.spawnFeathers(turkey.x, turkey.y + 0.85, turkey.z, 5, 4.5);
      onScore(SCORE_VALUES.closeShave, 'CLOSE SHAVE! +150', '#ffd85c', turkey.x, turkey.y + 2.1, turkey.z);
    }
  }
}

export function updateKickProps3D(stage, farmer, perks, dt, audio, effects, onScore) {
  for (const prop of stage.kickProps) {
    if (prop.used || !prop.kicked) continue;
    prop.vy -= 22.0 * dt;
    prop.x += prop.vx * dt;
    prop.y += prop.vy * dt;
    prop.z += prop.vz * dt;
    prop.mesh.position.set(prop.x, Math.max(0, prop.y), prop.z);
    prop.mesh.rotation.x += 7 * dt;

    if (prop.y <= 0) {
      prop.y = 0;
      prop.vy *= -0.4;
      prop.vx *= 0.8;
      prop.vz *= 0.8;
      if (Math.hypot(prop.vx, prop.vz) < 1.5) {
        prop.kicked = false;
      }
    }

    if (farmer && farmer.state !== 'stunned' && farmer.state !== 'blind') {
      const d = Math.hypot(prop.x - farmer.x, prop.z - farmer.z);
      if (d < 1.55) {
        prop.used = true;
        prop.mesh.visible = false;
        stunFarmer3D(farmer, prop.kind, perks, audio, effects, onScore);
      }
    }
  }
}

export function updatePickups3D(stage, turkey, dt, audio, effects, onPickup) {
  for (const item of stage.pickups) {
    if (item.collected) continue;
    item.phase += dt * 3.8;
    item.mesh.position.y = item.y + Math.sin(item.phase) * 0.16;
    item.mesh.rotation.y += dt * 2.2;

    const d = Math.hypot(turkey.x - item.x, (turkey.y + 0.72) - item.mesh.position.y, turkey.z - item.z);
    if (d < 1.25) {
      item.collected = true;
      item.mesh.visible = false;
      turkey.stamina = Math.min(turkey.maxStamina, turkey.stamina + (item.kind === 'goldenFeather' ? 45 : 18));
      if (item.kind === 'goldenFeather' && turkey.lives < turkey.maxLives) {
        turkey.lives += 1;
      }
      effects.spawnFeathers(item.x, item.y, item.z, item.kind === 'goldenFeather' ? 8 : 3, 4.0);
      audio.playPickup(1);
      onPickup(item);
    }
  }
}
