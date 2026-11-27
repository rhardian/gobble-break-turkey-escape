// Multi-state Farmer Jeb / Chef Jeb AI: patrol, spot alert, chase, cover search, lunge, and knife throw.

import { PALETTE, SCORE_VALUES } from './config.js';
import { damageTurkey } from './turkey.js';

export function createFarmer(stage) {
  return {
    x: 92,
    y: stage.groundY,
    vx: 0,
    facing: 1,
    outfit: stage.farmerOutfit, // farmhand | chef
    state: 'chase', // chase | search | lunge | stunned | blind
    stateTimer: 0,
    searchProgress: 0,
    alertTimer: 0,
    shoutText: '',
    shoutTimer: 0,
    knifeTimer: stage.farmerKnifeInterval * 0.75,
    lungeCooldown: 2.2,
    lungeDir: 1,
    runCycle: 0,
    armSwing: 0,
    distractTargetX: null,
    distractTimer: 0,
    caughtGrab: false,
  };
}

export function alertFarmer(farmer, text, audio) {
  farmer.alertTimer = 1.1;
  farmer.shoutText = text;
  farmer.shoutTimer = 1.35;
  if (audio) audio.playAlert();
}

export function stunFarmer(farmer, kind, audio, particles, onScore) {
  const isFlour = kind === 'flourSack';
  farmer.state = isFlour ? 'blind' : 'stunned';
  farmer.stateTimer = isFlour ? 2.45 : 1.75;
  farmer.vx = -farmer.facing * 120;
  farmer.shoutText = isFlour ? 'ACHOO! MY EYES!' : 'OUCH! BLASTED BIRD!';
  farmer.shoutTimer = 2.0;
  audio.playBonk();
  if (isFlour) {
    particles.spawnFlourCloud(farmer.x, farmer.y - 68, 28);
    particles.triggerShake(9, 0.25);
    onScore(SCORE_VALUES.flourBlind, 'FLOUR BOMB! +300', '#ffffff', farmer.x, farmer.y - 125);
  } else {
    particles.spawnSparkles(farmer.x, farmer.y - 96, 12, PALETTE.gold);
    particles.triggerShake(8, 0.22);
    onScore(SCORE_VALUES.farmerStun, 'BONKED! +250', PALETTE.gold, farmer.x, farmer.y - 125);
  }
}

export function updateFarmerAI(farmer, turkey, stage, knives, dt, audio, particles, onScore) {
  farmer.alertTimer = Math.max(0, farmer.alertTimer - dt);
  farmer.shoutTimer = Math.max(0, farmer.shoutTimer - dt);
  farmer.lungeCooldown = Math.max(0, farmer.lungeCooldown - dt);
  farmer.distractTimer = Math.max(0, farmer.distractTimer - dt);

  const dx = turkey.x - farmer.x;
  const dist = Math.abs(dx);

  // Stunned / flour-blind recovery
  if (farmer.state === 'stunned' || farmer.state === 'blind') {
    farmer.stateTimer -= dt;
    farmer.vx *= Math.max(0, 1 - dt * 5);
    farmer.x = Math.max(36, Math.min(stage.length - 80, farmer.x + farmer.vx * dt));
    if (farmer.stateTimer <= 0) {
      farmer.state = 'chase';
      alertFarmer(farmer, 'GET BACK HERE!', audio);
    }
    return;
  }

  // If the turkey hides in cover, switch Farmer Jeb to SEARCH mode!
  if (turkey.hiding && turkey.hideCover) {
    if (farmer.state !== 'search') {
      farmer.state = 'search';
      farmer.stateTimer = 0;
      farmer.searchProgress = 0;
      farmer.shoutText = "WHERE'D THAT BIRD GO?";
      farmer.shoutTimer = 1.6;
    }

    const coverCenter = turkey.hideCover.x + turkey.hideCover.w * 0.5;
    const toCover = coverCenter - farmer.x;
    farmer.facing = toCover >= 0 ? 1 : -1;

    if (Math.abs(toCover) > 78) {
      farmer.vx = farmer.facing * (stage.farmerBaseSpeed * 0.58);
      farmer.x += farmer.vx * dt;
      farmer.runCycle += dt * 6;
    } else {
      // Pacing & poking around the hiding spot
      farmer.vx = Math.sin(farmer.stateTimer * 4.5) * 48;
      farmer.x += farmer.vx * dt;
      farmer.stateTimer += dt;
      farmer.searchProgress += dt * 0.52;
      if (farmer.searchProgress >= 1) {
        // Jeb finds Barnaby if you hide too long right under his nose!
        turkey.hiding = false;
        turkey.hideCover = null;
        farmer.state = 'chase';
        farmer.searchProgress = 0;
        alertFarmer(farmer, 'AHA! FOUND YA!', audio);
        particles.addCallout(farmer.x, farmer.y - 125, 'SPOTTED!', '#ff5630', 1.15);
      }
    }
    return;
  } else if (farmer.state === 'search') {
    farmer.state = 'chase';
    farmer.searchProgress = 0;
    alertFarmer(farmer, 'THERE HE IS!', audio);
  }

  // Lunge attack when cornering the turkey closely
  if (farmer.state === 'lunge') {
    farmer.stateTimer -= dt;
    farmer.vx = farmer.lungeDir * (stage.farmerChaseSpeed * 1.48);
    farmer.x = Math.max(36, Math.min(stage.length - 80, farmer.x + farmer.vx * dt));
    farmer.runCycle += dt * 16;
    farmer.armSwing += dt * 20;
    if (Math.random() < dt * 14) {
      particles.spawnDust(farmer.x - farmer.lungeDir * 20, farmer.y, 1, -farmer.lungeDir);
    }
    if (farmer.stateTimer <= 0) {
      farmer.state = 'chase';
      farmer.lungeCooldown = 2.4;
    }
  } else {
    // Relentless chase with rubber-band pacing so tension stays fair & exciting!
    farmer.facing = dx >= 0 ? 1 : -1;
    let targetSpeed = stage.farmerChaseSpeed * stage.difficultyScale;
    if (dist > 520) {
      // Catch up cleanly when far behind so Farmer Jeb stays in the chase
      targetSpeed = Math.max(targetSpeed, 435);
    } else if (dist < 145) {
      targetSpeed *= 0.96;
    }
    if (farmer.distractTimer > 0) {
      targetSpeed *= 0.65;
    }

    farmer.vx += (farmer.facing * targetSpeed - farmer.vx) * Math.min(1, dt * 6.5);
    farmer.x = Math.max(36, Math.min(stage.length - 80, farmer.x + farmer.vx * dt));
    farmer.runCycle += dt * (Math.abs(farmer.vx) / 34);
    farmer.armSwing += dt * 9;

    if (Math.abs(farmer.vx) > 120 && Math.random() < dt * 6) {
      particles.spawnDust(farmer.x - farmer.facing * 18, farmer.y - 2, 1, -farmer.facing);
    }

    // Telegraph & trigger cornering lunge when close on the ground
    if (dist < 185 && dist > 62 && Math.abs(turkey.y - farmer.y) < 75 && farmer.lungeCooldown <= 0) {
      farmer.state = 'lunge';
      farmer.stateTimer = 0.36;
      farmer.lungeDir = farmer.facing;
      alertFarmer(farmer, farmer.outfit === 'chef' ? 'INTO THE OVEN!' : 'DINNER TIME!', audio);
    }

    // Farmer throws gleaming carving knives periodically when at mid-range!
    farmer.knifeTimer -= dt;
    if (farmer.knifeTimer <= 0 && dist > 150 && dist < 760) {
      farmer.knifeTimer = Math.max(1.35, stage.farmerKnifeInterval / stage.difficultyScale);
      const flightTime = Math.max(0.55, Math.min(1.05, dist / 520));
      const aimX = turkey.x + turkey.vx * 0.24;
      const aimY = turkey.y - 34;
      const startX = farmer.x + farmer.facing * 28;
      const startY = farmer.y - 78;
      const vx = (aimX - startX) / flightTime;
      const gravity = 540;
      const vy = (aimY - startY - 0.5 * gravity * flightTime * flightTime) / flightTime;

      knives.push({
        x: startX,
        y: startY,
        vx,
        vy,
        gravity,
        rot: Math.atan2(vy, vx),
        spin: farmer.facing * 11,
        kind: 'thrown',
        telegraph: 0.22,
        life: 3.4,
        closeShaveGiven: false,
      });
      audio.playKnifeShing();
    }
  }

  // Direct grab / collision check with Farmer Jeb
  const grabDist = Math.hypot(turkey.x - farmer.x, (turkey.y - 28) - (farmer.y - 54));
  if (grabDist < 54 && !turkey.hiding) {
    const knock = turkey.x >= farmer.x ? 1 : -1;
    const hurt = damageTurkey(turkey, knock, audio, particles, farmer.outfit === 'chef' ? 'CHEF GRAB!' : 'FARMER GRAB!');
    if (hurt) {
      farmer.vx = -knock * 150;
      farmer.lungeCooldown = 1.6;
      if (turkey.lives <= 0) {
        farmer.caughtGrab = true;
      }
    }
  }
}
