// 3D Hazard & Collectible Simulation: GLSL 450°F Ovens, Spinning Forged Knives, Ceiling Cleavers, Kick Props & Pickups.

import { SCORE_VALUES, WORLD } from './config.js';
import { stunFarmer3D } from './farmer.js';
import { createCarvingKnifeMesh } from './models.js';
import { damageTurkey3D } from './turkey.js';

export function updateOvens3D(stage, turkey, time, dt, audio, effects, onScore) {
  for (const oven of stage.ovens) {
    oven.timer = (oven.timer + dt) % oven.cycleDuration;
    const t = oven.timer / oven.cycleDuration;
    oven.fireMat.uniforms.uTime.value = time;

    if (t < 0.44) {
      oven.state = 'idle';
      oven.doorPivot.rotation.z += (0 - oven.doorPivot.rotation.z) * Math.min(1, dt * 9);
      oven.flameGroup.visible = false;
      oven.fireLight.intensity = 1.8;
      oven.blastedThisCycle = false;
      oven.closeShaveGiven = false;
    } else if (t < 0.68) {
      oven.state = 'telegraph';
      oven.doorPivot.rotation.z = 0.28 + Math.sin(time * 36) * 0.08;
      oven.flameGroup.visible = false;
      oven.fireLight.intensity = 3.6 + Math.sin(time * 28) * 0.9;
      if (Math.random() < dt * 10 && Math.abs(turkey.x - oven.x) < 18) {
        effects.spawnEmbers(oven.x - 1.35, 1.15, oven.z, -1, 1);
      }
    } else {
      oven.state = 'blast';
      oven.doorPivot.rotation.z += (1.42 - oven.doorPivot.rotation.z) * Math.min(1, dt * 13);
      oven.flameGroup.visible = true;
      const pulse = 0.94 + Math.sin(time * 30) * 0.09;
      oven.flameGroup.scale.set(pulse, 1 + Math.cos(time * 24) * 0.08, 1);
      oven.fireLight.intensity = 6.8 + Math.sin(time * 34) * 1.4;

      if (!oven.blastedThisCycle) {
        oven.blastedThisCycle = true;
        if (Math.abs(turkey.x - oven.x) < 18) {
          audio.playOvenBlast();
          effects.spawnEmbers(oven.x - 1.6, 1.15, oven.z, -1, 10);
        }
      }

      // Check 3D horizontal flame plume box (extends LEFT from oven.x - 1.1 to oven.x - 1.1 - flameRange!)
      if (!turkey.hiding) {
        const minX = oven.x - 1.1 - oven.flameRange;
        const maxX = oven.x - 1.0;
        const inX = turkey.x + 0.42 > minX && turkey.x - 0.42 < maxX;
        const inZ = Math.abs(turkey.z - oven.z) < 0.96;
        const inY = turkey.y < 1.56;

        if (inX && inZ && inY) {
          damageTurkey3D(turkey, -0.7, 0.4, audio, effects, '450°F ROASTED!');
        } else if (
          !oven.closeShaveGiven &&
          turkey.closeShaveCooldown <= 0 &&
          inX &&
          Math.abs(turkey.z - oven.z) < 1.55 &&
          turkey.y >= 1.5 &&
          turkey.y < 3.4
        ) {
          oven.closeShaveGiven = true;
          turkey.closeShaveCooldown = WORLD.closeShaveCooldown;
          audio.playCloseShave();
          effects.triggerHitstop(0.035);
          effects.spawnFeathers(turkey.x, turkey.y + 0.7, turkey.z, 6, 4.4);
          onScore(SCORE_VALUES.closeShave, 'TOO HOT! +150', '#ffcf54', turkey.x, turkey.y + 2.35, turkey.z);
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
    p.bobX = p.x + Math.sin(angle) * armLen;
    p.bobY = 5.8 - Math.cos(angle) * armLen;

    if (turkey.hiding) continue;
    const d = Math.hypot(turkey.x - p.bobX, (turkey.y + 0.85) - p.bobY, turkey.z - p.z);
    if (d < 1.15) {
      damageTurkey3D(turkey, Math.sign(turkey.x - p.bobX) || -1, 0, audio, effects, 'CLEAVER HIT!');
    } else if (d < 2.35 && !p.closeShaveGiven && turkey.closeShaveCooldown <= 0) {
      p.closeShaveGiven = true;
      turkey.closeShaveCooldown = WORLD.closeShaveCooldown;
      audio.playCloseShave();
      onScore(SCORE_VALUES.closeShave, 'CLOSE SHAVE! +150', '#ffe38c', turkey.x, turkey.y + 2.3, turkey.z);
    } else if (d > 3.4) {
      p.closeShaveGiven = false;
    }
  }
}

export function spawnStageKnifeVolley3D(stage, turkey, knives, scene, rng, audio) {
  const x = Math.min(stage.exitX - 2, turkey.x + rng.range(12, 16));
  const z = rng.range(WORLD.laneMinZ + 0.6, WORLD.laneMaxZ - 0.6);
  const y = rng.range(1.15, 2.25);
  const mesh = createCarvingKnifeMesh(1.18, true);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  knives.push({
    mesh,
    x,
    y,
    z,
    vx: -(14.0 + stage.index * 1.4) * stage.difficultyScale,
    vy: 0,
    vz: (turkey.z - z) * 0.25,
    gravity: 0,
    spin: -11.5,
    life: 2.5,
    closeShaveGiven: false,
  });
  if (Math.abs(turkey.x - x) < 18) audio.playKnifeShing();
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
    k.mesh.rotation.z += k.spin * dt;

    if (k.life <= 0 || k.y < 0.08) {
      scene.remove(k.mesh);
      knives.splice(i, 1);
      continue;
    }

    if (turkey.hiding) continue;
    const d = Math.hypot(turkey.x - k.x, (turkey.y + 0.85) - k.y, turkey.z - k.z);
    if (d < 0.92) {
      const hurt = damageTurkey3D(turkey, Math.sign(k.vx) || -0.8, 0, audio, effects, 'CARVING KNIFE!');
      if (hurt) {
        scene.remove(k.mesh);
        knives.splice(i, 1);
      }
    } else if (d < WORLD.closeShaveDist && !k.closeShaveGiven && turkey.closeShaveCooldown <= 0) {
      k.closeShaveGiven = true;
      turkey.closeShaveCooldown = WORLD.closeShaveCooldown;
      audio.playCloseShave();
      effects.triggerHitstop(0.035);
      effects.spawnFeathers(turkey.x, turkey.y + 0.9, turkey.z, 5, 4.5);
      onScore(SCORE_VALUES.closeShave, 'CLOSE SHAVE! +150', '#ffd85c', turkey.x, turkey.y + 2.35, turkey.z);
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
    prop.mesh.rotation.z += 7.5 * dt;

    if (prop.y <= 0) {
      prop.y = 0;
      prop.vy *= -0.4;
      prop.vx *= 0.8;
      prop.vz *= 0.8;
      if (Math.hypot(prop.vx, prop.vz) < 1.4) prop.kicked = false;
    }

    if (farmer && farmer.state !== 'stunned' && farmer.state !== 'blind') {
      const d = Math.hypot(prop.x - farmer.x, prop.z - farmer.z);
      if (d < 1.65) {
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

    const d = Math.hypot(turkey.x - item.x, (turkey.y + 0.8) - item.mesh.position.y, turkey.z - item.z);
    if (d < 1.32) {
      item.collected = true;
      item.mesh.visible = false;
      turkey.stamina = Math.min(turkey.maxStamina, turkey.stamina + (item.kind === 'goldenFeather' ? 45 : 18));
      if (item.kind === 'goldenFeather' && turkey.lives < turkey.maxLives) turkey.lives += 1;
      effects.spawnFeathers(item.x, item.y, item.z, item.kind === 'goldenFeather' ? 8 : 3, 4.0);
      audio.playPickup(1);
      onPickup(item);
    }
  }
}
