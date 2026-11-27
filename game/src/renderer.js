// Painterly 2.5D Thanksgiving storybook renderer: parallax autumn worlds, articulated characters, ovens, knives, lighting.

import { PALETTE, VIEWPORT } from './config.js';

export function renderScene(ctx, state, patterns, time) {
  const { stage, turkey, farmer, knives, particles, cameraX } = state;
  const shake = particles.getShakeOffset();

  ctx.save();
  ctx.translate(shake.x, shake.y);

  renderBackdrop(ctx, stage, patterns, cameraX, time);

  ctx.save();
  ctx.translate(-cameraX, 0);

  renderGroundAndFloor(ctx, stage, patterns, cameraX);
  renderStageDecor(ctx, stage, time);
  renderGravySpills(ctx, stage, time);
  renderPlatforms(ctx, stage, patterns);
  renderExitGate(ctx, stage, time);
  renderOvens(ctx, stage, time);
  renderCoversBack(ctx, stage, turkey);
  renderPickups(ctx, stage, time);
  renderKickProps(ctx, stage);
  renderPendulums(ctx, stage);

  // Dash feather afterimages
  for (const ghost of turkey.trail) {
    ctx.save();
    ctx.globalAlpha = ghost.alpha * 0.45;
    drawTurkeyFigure(ctx, { ...turkey, x: ghost.x, y: ghost.y, facing: ghost.facing }, time, true);
    ctx.restore();
  }

  // Draw Barnaby behind cover if hiding, or in front otherwise
  if (turkey.hiding) {
    renderCoversFront(ctx, stage, turkey, time);
  } else {
    drawTurkeyFigure(ctx, turkey, time, false);
    renderCoversFront(ctx, stage, turkey, time);
  }

  // Draw Farmer Jeb / Chef Jeb
  drawFarmerFigure(ctx, farmer, time);

  // Draw active Carving Knives & danger trajectory telegraphs
  renderCarvingKnives(ctx, knives, time);

  // World-space particles & comic callouts
  renderWorldParticles(ctx, particles, time);

  ctx.restore();

  // Ambient lighting, drifting autumn leaves, and warm vignette
  renderAtmosphereOverlay(ctx, stage, particles, cameraX, time);

  ctx.restore();
}

export function renderBackdrop(ctx, stage, patterns, cameraX, time) {
  const W = VIEWPORT.width;
  const H = VIEWPORT.height;

  // Sky / interior wall gradient
  const sky = ctx.createLinearGradient(0, 0, 0, stage.groundY);
  sky.addColorStop(0, stage.skyTop);
  sky.addColorStop(0.55, stage.skyMid);
  sky.addColorStop(1, stage.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  if (stage.theme === 'farmyard') {
    // Huge golden-hour harvest sun & glowing rays
    const sunX = W * 0.72 - (cameraX * 0.04) % 240;
    const sunY = 175;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 18, sunX, sunY, 320);
    sunGlow.addColorStop(0, 'rgba(255, 245, 200, 0.96)');
    sunGlow.addColorStop(0.22, 'rgba(255, 198, 92, 0.65)');
    sunGlow.addColorStop(0.65, 'rgba(232, 112, 34, 0.16)');
    sunGlow.addColorStop(1, 'rgba(232, 112, 34, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, W, H);

    // Volumetric sun shafts
    ctx.save();
    ctx.fillStyle = 'rgba(255, 224, 150, 0.08)';
    for (let i = 0; i < 4; i++) {
      const rx = ((i * 360 - cameraX * 0.08) % (W + 400) + W + 400) % (W + 400) - 180;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 120, 0);
      ctx.lineTo(rx - 140, stage.groundY);
      ctx.lineTo(rx - 260, stage.groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Far autumn hills
    drawRollingHills(ctx, cameraX * 0.12, 415, '#6b2718', 48, 0.0038);
    drawRollingHills(ctx, cameraX * 0.24, 465, '#8c3718', 36, 0.0052);

    // Silhouette red barn & spinning windmill in mid-parallax
    const barnOffset = -(cameraX * 0.28) % 920;
    for (let bx = barnOffset - 160; bx < W + 400; bx += 920) {
      drawDistantBarn(ctx, bx + 220, stage.groundY - 125, time);
      drawAutumnTreeCluster(ctx, bx + 620, stage.groundY - 110);
    }

    // Rustic split-rail farm fence (foreground parallax)
    const fenceStep = 140;
    const fStart = -((cameraX * 0.62) % fenceStep) - fenceStep;
    ctx.fillStyle = '#522814';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.fillRect(0, stage.groundY - 76, W, 11);
    ctx.fillRect(0, stage.groundY - 42, W, 11);
    for (let fx = fStart; fx < W + fenceStep; fx += fenceStep) {
      ctx.fillStyle = '#633219';
      ctx.fillRect(fx, stage.groundY - 102, 16, 104);
      ctx.strokeRect(fx, stage.groundY - 102, 16, 104);
    }
  } else if (stage.theme === 'barn') {
    // Timber plank barn wall
    ctx.save();
    ctx.globalAlpha = 0.36;
    ctx.translate(-(cameraX * 0.35) % 128, 0);
    ctx.fillStyle = patterns.woodPlank;
    ctx.fillRect(-128, 0, W + 256, stage.groundY);
    ctx.restore();

    // High barn clerestory windows pouring golden autumn shafts
    const winStep = 420;
    const wStart = -((cameraX * 0.35) % winStep) - winStep;
    for (let wx = wStart; wx < W + winStep; wx += winStep) {
      ctx.fillStyle = '#ffcb6b';
      ctx.fillRect(wx + 120, 62, 92, 68);
      ctx.strokeStyle = '#3c1b0c';
      ctx.lineWidth = 6;
      ctx.strokeRect(wx + 120, 62, 92, 68);
      // Shaft of light
      ctx.fillStyle = 'rgba(255, 212, 118, 0.09)';
      ctx.beginPath();
      ctx.moveTo(wx + 120, 130);
      ctx.lineTo(wx + 212, 130);
      ctx.lineTo(wx + 42, stage.groundY);
      ctx.lineTo(wx - 90, stage.groundY);
      ctx.closePath();
      ctx.fill();
    }

    // Heavy ceiling rafters & hanging lanterns
    ctx.fillStyle = '#33170b';
    ctx.fillRect(0, 0, W, 44);
    const beamStep = 320;
    const bStart = -((cameraX * 0.55) % beamStep) - beamStep;
    for (let bx = bStart; bx < W + beamStep; bx += beamStep) {
      ctx.fillStyle = '#3d1c0e';
      ctx.fillRect(bx, 0, 34, stage.groundY);
      drawHangingLantern(ctx, bx + 165, 44, time + bx * 0.01);
    }
  } else if (stage.theme === 'kitchen') {
    // Warm Thanksgiving Kitchen Brick Backsplash & Cream Wainscot
    ctx.save();
    ctx.globalAlpha = 0.52;
    ctx.translate(-(cameraX * 0.38) % 96, 0);
    ctx.fillStyle = patterns.brickWall;
    ctx.fillRect(-96, 0, W + 192, stage.groundY);
    ctx.restore();

    // Cream plaster upper wall + rustic timber wainscoting
    ctx.fillStyle = 'rgba(245, 224, 184, 0.14)';
    ctx.fillRect(0, 0, W, 240);
    ctx.fillStyle = '#4a2212';
    ctx.fillRect(0, 232, W, 18);
    ctx.fillStyle = '#2d130a';
    ctx.fillRect(0, 0, W, 38);

    // Kitchen sunset windows & hanging copper cookware racks
    const kStep = 440;
    const kStart = -((cameraX * 0.42) % kStep) - kStep;
    for (let kx = kStart; kx < W + kStep; kx += kStep) {
      drawKitchenWindow(ctx, kx + 70, 74);
      drawCopperPotRack(ctx, kx + 255, 38, time + kx * 0.01);
    }
  } else {
    // Grand Banquet Hall: burgundy harvest walls, arches, golden chandeliers
    ctx.save();
    ctx.globalAlpha = 0.48;
    ctx.translate(-(cameraX * 0.35) % 80, 0);
    ctx.fillStyle = patterns.banquetCarpet;
    ctx.fillRect(-80, 0, W + 160, stage.groundY);
    ctx.restore();

    ctx.fillStyle = '#3b150e';
    ctx.fillRect(0, 0, W, 42);
    ctx.fillStyle = '#4f2013';
    ctx.fillRect(0, stage.groundY - 140, W, 140);
    ctx.fillStyle = '#d49a38';
    ctx.fillRect(0, stage.groundY - 144, W, 6);

    const bqStep = 420;
    const bqStart = -((cameraX * 0.42) % bqStep) - bqStep;
    for (let x = bqStart; x < W + bqStep; x += bqStep) {
      drawBanquetArchWindow(ctx, x + 70, 72);
      drawChandelier(ctx, x + 280, 42, time + x * 0.01);
    }
  }
}

function drawRollingHills(ctx, offset, baseY, color, amp, freq) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEWPORT.groundY);
  for (let x = 0; x <= VIEWPORT.width; x += 24) {
    const wx = x + offset;
    const y = baseY + Math.sin(wx * freq) * amp + Math.cos(wx * freq * 0.52) * (amp * 0.55);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEWPORT.width, VIEWPORT.groundY);
  ctx.closePath();
  ctx.fill();
}

function drawDistantBarn(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  // Silo
  ctx.fillStyle = '#7c281c';
  ctx.fillRect(108, -22, 42, 148);
  ctx.fillStyle = '#4a1d17';
  ctx.beginPath();
  ctx.arc(129, -22, 21, Math.PI, 0);
  ctx.fill();
  // Barn silhouette
  ctx.fillStyle = '#992c1c';
  ctx.beginPath();
  ctx.moveTo(0, 126);
  ctx.lineTo(0, 32);
  ctx.lineTo(22, -16);
  ctx.lineTo(62, -46);
  ctx.lineTo(102, -16);
  ctx.lineTo(124, 32);
  ctx.lineTo(124, 126);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3d140e';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Warm lit loft window
  ctx.fillStyle = '#ffce69';
  ctx.fillRect(48, 8, 28, 28);
  ctx.strokeStyle = '#5c1c10';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 8, 28, 28);
  // Barn X door
  ctx.strokeStyle = '#e7cfa8';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 56, 52, 68);
  ctx.beginPath();
  ctx.moveTo(36, 56);
  ctx.lineTo(88, 124);
  ctx.moveTo(88, 56);
  ctx.lineTo(36, 124);
  ctx.stroke();
  // Spinning windmill blades
  ctx.save();
  ctx.translate(168, -28);
  ctx.strokeStyle = '#3b1b12';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-14, 152);
  ctx.moveTo(0, 0);
  ctx.lineTo(14, 152);
  ctx.stroke();
  ctx.rotate(time * 0.7);
  ctx.fillStyle = '#d49a52';
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI * 0.5);
    ctx.fillRect(-4, 4, 8, 36);
  }
  ctx.restore();
  ctx.restore();
}

function drawAutumnTreeCluster(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#472112';
  ctx.fillRect(-8, 28, 16, 86);
  ctx.fillRect(46, 38, 14, 76);
  const puffs = [
    [-26, 20, 38, '#b8321b'],
    [16, 6, 44, '#e0671e'],
    [-2, -16, 34, '#f0a629'],
    [54, 24, 36, '#c43b1c'],
    [76, 36, 28, '#e88b25'],
  ];
  for (const [px, py, r, col] of puffs) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHangingLantern(ctx, x, y, phase) {
  const sway = Math.sin(phase * 1.4) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  ctx.strokeStyle = '#261009';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 48);
  ctx.stroke();

  const glow = ctx.createRadialGradient(0, 64, 6, 0, 64, 115);
  glow.addColorStop(0, 'rgba(255, 224, 130, 0.52)');
  glow.addColorStop(0.5, 'rgba(255, 162, 52, 0.18)');
  glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 64, 115, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#331c12';
  ctx.fillRect(-13, 46, 26, 8);
  ctx.fillStyle = '#ffe18c';
  ctx.fillRect(-10, 54, 20, 24);
  ctx.strokeRect(-10, 54, 20, 24);
  ctx.fillStyle = '#331c12';
  ctx.fillRect(-14, 78, 28, 7);
  ctx.restore();
}

function drawKitchenWindow(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  const sky = ctx.createLinearGradient(0, 0, 0, 134);
  sky.addColorStop(0, '#8f2c16');
  sky.addColorStop(0.55, '#e87826');
  sky.addColorStop(1, '#ffcf6e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 146, 134);

  // Glowing sunset orb outside the window
  const orb = ctx.createRadialGradient(104, 86, 4, 104, 86, 46);
  orb.addColorStop(0, 'rgba(255, 248, 210, 0.95)');
  orb.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, 146, 134);

  // Rolling sunset hill & autumn maple silhouette outside
  ctx.fillStyle = '#632112';
  ctx.beginPath();
  ctx.moveTo(0, 134);
  ctx.quadraticCurveTo(45, 96, 95, 108);
  ctx.quadraticCurveTo(125, 112, 146, 98);
  ctx.lineTo(146, 134);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#47170d';
  ctx.fillRect(28, 76, 8, 58);
  ctx.fillStyle = '#a82c16';
  ctx.beginPath();
  ctx.arc(32, 66, 22, 0, Math.PI * 2);
  ctx.arc(16, 78, 16, 0, Math.PI * 2);
  ctx.arc(46, 78, 16, 0, Math.PI * 2);
  ctx.fill();

  // Diagonal warm sunbeam streaming into the kitchen
  ctx.fillStyle = 'rgba(255, 224, 146, 0.08)';
  ctx.beginPath();
  ctx.moveTo(0, 134);
  ctx.lineTo(146, 134);
  ctx.lineTo(54, 480);
  ctx.lineTo(-92, 480);
  ctx.closePath();
  ctx.fill();

  // Window frame & mullions
  ctx.strokeStyle = '#472110';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, 146, 134);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(73, 0);
  ctx.lineTo(73, 134);
  ctx.moveTo(0, 67);
  ctx.lineTo(146, 67);
  ctx.stroke();

  // Scalloped red-and-cream gingham kitchen valance curtain
  ctx.fillStyle = '#c93322';
  ctx.fillRect(-8, -6, 162, 24);
  ctx.fillStyle = '#fff3d6';
  for (let i = 0; i < 156; i += 24) {
    ctx.fillRect(-8 + i, -6, 12, 12);
    ctx.fillRect(4 + i, 6, 12, 12);
  }
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-8, -6, 162, 24);
  ctx.restore();
}

function drawCopperPotRack(ctx, x, y, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#26140d';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-64, 34);
  ctx.lineTo(64, 34);
  ctx.moveTo(-48, 0);
  ctx.lineTo(-48, 34);
  ctx.moveTo(48, 0);
  ctx.lineTo(48, 34);
  ctx.stroke();

  const pots = [-42, 0, 42];
  pots.forEach((px, idx) => {
    ctx.save();
    ctx.translate(px, 34);
    ctx.rotate(Math.sin(phase * 1.3 + idx) * 0.05);
    ctx.strokeStyle = '#331c12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 26);
    ctx.stroke();
    const grad = ctx.createLinearGradient(-16, 26, 18, 60);
    grad.addColorStop(0, '#f3a361');
    grad.addColorStop(0.5, '#c46327');
    grad.addColorStop(1, '#753111');
    ctx.fillStyle = grad;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.5;
    if (idx === 1) {
      ctx.beginPath();
      ctx.arc(0, 48, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.roundRect(-16, 26, 32, 26, 6);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  });
  ctx.restore();
}

function drawBanquetArchWindow(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  const moonSky = ctx.createLinearGradient(0, 0, 0, 185);
  moonSky.addColorStop(0, '#101b36');
  moonSky.addColorStop(0.6, '#273a61');
  moonSky.addColorStop(1, '#615575');
  ctx.fillStyle = moonSky;
  ctx.beginPath();
  ctx.arc(62, 62, 62, Math.PI, 0);
  ctx.lineTo(124, 185);
  ctx.lineTo(0, 185);
  ctx.closePath();
  ctx.fill();

  // Twinkling harvest stars & radiant harvest moon
  ctx.fillStyle = 'rgba(255, 245, 210, 0.85)';
  for (const [sx, sy, sr] of [[28, 36, 2], [44, 24, 1.5], [96, 30, 2], [24, 78, 1.5]]) {
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  const moonGlow = ctx.createRadialGradient(84, 52, 8, 84, 52, 46);
  moonGlow.addColorStop(0, 'rgba(255, 244, 198, 0.96)');
  moonGlow.addColorStop(0.5, 'rgba(255, 216, 138, 0.35)');
  moonGlow.addColorStop(1, 'rgba(255, 216, 138, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(84, 52, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff5cc';
  ctx.beginPath();
  ctx.arc(84, 52, 18, 0, Math.PI * 2);
  ctx.fill();

  // Pine silhouettes outside window
  ctx.fillStyle = '#182438';
  ctx.beginPath();
  ctx.moveTo(0, 185);
  ctx.lineTo(24, 132);
  ctx.lineTo(48, 185);
  ctx.lineTo(76, 122);
  ctx.lineTo(106, 185);
  ctx.lineTo(124, 150);
  ctx.lineTo(124, 185);
  ctx.closePath();
  ctx.fill();

  // Gothic mullions & gold arch frame
  ctx.strokeStyle = '#3b190d';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(62, 62, 62, Math.PI, 0);
  ctx.lineTo(124, 185);
  ctx.lineTo(0, 185);
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(62, 0);
  ctx.lineTo(62, 185);
  ctx.moveTo(0, 112);
  ctx.lineTo(124, 112);
  ctx.stroke();
  ctx.restore();
}

function drawChandelier(ctx, x, y, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#c48f2e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 46);
  ctx.moveTo(-54, 46);
  ctx.quadraticCurveTo(0, 74, 54, 46);
  ctx.stroke();

  const glow = ctx.createRadialGradient(0, 44, 10, 0, 44, 145);
  glow.addColorStop(0, 'rgba(255, 226, 140, 0.45)');
  glow.addColorStop(1, 'rgba(255, 170, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 44, 145, 0, Math.PI * 2);
  ctx.fill();

  for (const cx of [-54, 0, 54]) {
    ctx.fillStyle = '#fff5dc';
    ctx.fillRect(cx - 4, 28, 8, 18);
    const flicker = Math.sin(phase * 14 + cx) * 2;
    ctx.fillStyle = '#ffbe3d';
    ctx.beginPath();
    ctx.ellipse(cx, 22 + flicker * 0.3, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function renderGroundAndFloor(ctx, stage, patterns, cameraX) {
  const g = stage.groundY;
  const h = VIEWPORT.height - g;
  const startX = Math.floor(cameraX / 96) * 96 - 96;
  const width = VIEWPORT.width + 288;

  if (stage.theme === 'kitchen') {
    ctx.fillStyle = patterns.kitchenTile;
    ctx.fillRect(startX, g, width, h);
    ctx.fillStyle = '#3a1a0d';
    ctx.fillRect(startX, g - 6, width, 10);
  } else if (stage.theme === 'banquet') {
    ctx.fillStyle = patterns.banquetCarpet;
    ctx.fillRect(startX, g, width, h);
    ctx.fillStyle = '#e5a93c';
    ctx.fillRect(startX, g, width, 8);
    ctx.fillStyle = '#471a0e';
    ctx.fillRect(startX, g - 5, width, 6);
  } else if (stage.theme === 'barn') {
    ctx.fillStyle = patterns.woodPlank;
    ctx.fillRect(startX, g, width, h);
    ctx.fillStyle = '#3a1b0c';
    ctx.fillRect(startX, g - 4, width, 8);
  } else {
    // Autumn dirt lane with golden grass verge
    const soil = ctx.createLinearGradient(0, g, 0, VIEWPORT.height);
    soil.addColorStop(0, '#78421f');
    soil.addColorStop(0.28, '#592d14');
    soil.addColorStop(1, '#311609');
    ctx.fillStyle = soil;
    ctx.fillRect(startX, g, width, h);

    // Rich autumn grass verge strip
    ctx.fillStyle = '#b56e22';
    ctx.fillRect(startX, g - 5, width, 14);
    ctx.fillStyle = '#d98f2b';
    ctx.fillRect(startX, g - 5, width, 5);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(startX, g - 6, width, 2);
  }
}

function renderStageDecor(ctx, stage, time) {
  const g = stage.groundY;
  for (const d of stage.decor) {
    if (d.kind === 'mapleTree') {
      ctx.save();
      ctx.translate(d.x, g);
      ctx.fillStyle = '#4a2110';
      ctx.fillRect(-10, -142 * d.scale, 20, 142 * d.scale);
      const col = d.hue === 'red' ? '#b82f1b' : d.hue === 'gold' ? '#e59f24' : '#d95e1a';
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.arc(0, -162 * d.scale, 56 * d.scale, 0, Math.PI * 2);
      ctx.arc(-36 * d.scale, -138 * d.scale, 38 * d.scale, 0, Math.PI * 2);
      ctx.arc(38 * d.scale, -136 * d.scale, 40 * d.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (d.kind === 'pumpkins') {
      drawMiniPumpkin(ctx, d.x, g - 12, 16);
      drawMiniPumpkin(ctx, d.x + 22, g - 9, 12);
    } else if (d.kind === 'scarecrow') {
      ctx.save();
      ctx.translate(d.x, g);
      ctx.strokeStyle = '#3b1c0e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -110);
      ctx.moveTo(-36, -78);
      ctx.lineTo(36, -78);
      ctx.stroke();
      ctx.fillStyle = '#c45b20';
      ctx.fillRect(-14, -84, 28, 38);
      ctx.fillStyle = '#e5a229';
      ctx.beginPath();
      ctx.arc(0, -104, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5c3114';
      ctx.fillRect(-24, -118, 48, 6);
      ctx.fillRect(-13, -134, 26, 16);
      ctx.restore();
    }
  }
  void time;
}

function renderGravySpills(ctx, stage, time) {
  for (const spill of stage.gravySpills) {
    ctx.save();
    const grad = ctx.createLinearGradient(spill.x, spill.y, spill.x, spill.y + 18);
    grad.addColorStop(0, '#965421');
    grad.addColorStop(1, '#4f260c');
    ctx.fillStyle = grad;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(spill.x + spill.w * 0.5, spill.y + 6, spill.w * 0.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bubbling gravy sheen
    ctx.fillStyle = 'rgba(255, 220, 155, 0.5)';
    for (let i = 0; i < 3; i++) {
      const bx = spill.x + spill.w * (0.25 + i * 0.25);
      const r = 3 + Math.abs(Math.sin(time * 4 + i * 1.9)) * 3.5;
      ctx.beginPath();
      ctx.arc(bx, spill.y + 3, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function renderPlatforms(ctx, stage, patterns) {
  for (const plat of stage.platforms) {
    ctx.save();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;

    if (plat.style === 'haybale') {
      ctx.fillStyle = patterns.hayWeave;
      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, plat.w, 34, 7);
      ctx.fill();
      ctx.stroke();
      // Twine straps
      ctx.strokeStyle = '#733e14';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(plat.x + plat.w * 0.25, plat.y);
      ctx.lineTo(plat.x + plat.w * 0.25, plat.y + 34);
      ctx.moveTo(plat.x + plat.w * 0.75, plat.y);
      ctx.lineTo(plat.x + plat.w * 0.75, plat.y + 34);
      ctx.stroke();
    } else if (plat.style === 'counter' || plat.style === 'shelf') {
      // Butcher block countertop + support brackets
      ctx.fillStyle = '#c48341';
      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, plat.w, 26, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f2d39c';
      ctx.fillRect(plat.x + 4, plat.y + 3, plat.w - 8, 6);
      // Support brackets
      ctx.fillStyle = '#3b241b';
      ctx.fillRect(plat.x + 16, plat.y + 26, 12, 24);
      ctx.fillRect(plat.x + plat.w - 28, plat.y + 26, 12, 24);
    } else if (plat.style === 'banquet') {
      // Plush white & gold tablecloth banquet table
      ctx.fillStyle = '#753318';
      ctx.fillRect(plat.x + 12, plat.y + 22, 12, stage.groundY - plat.y - 22);
      ctx.fillRect(plat.x + plat.w - 24, plat.y + 22, 12, stage.groundY - plat.y - 22);
      ctx.fillStyle = '#fff5e0';
      ctx.beginPath();
      ctx.roundRect(plat.x - 4, plat.y, plat.w + 8, 28, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.gold;
      ctx.fillRect(plat.x - 2, plat.y + 20, plat.w + 4, 6);
    } else {
      // Timber loft or farm wagon bed
      ctx.fillStyle = patterns.woodPlank;
      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, plat.w, 26, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 212, 140, 0.2)';
      ctx.fillRect(plat.x + 3, plat.y + 3, plat.w - 6, 5);
    }
    ctx.restore();
  }
}

function renderCoversBack(ctx, stage, turkey) {
  for (const c of stage.covers) {
    if (c.kind === 'kitchenTable') {
      ctx.save();
      ctx.fillStyle = '#3a1a0d';
      ctx.fillRect(c.x + 6, c.y + 18, c.w - 12, c.h - 18);
      ctx.restore();
    }
    void turkey;
  }
}

function renderCoversFront(ctx, stage, turkey, time) {
  for (const c of stage.covers) {
    const isHidingHere = turkey.hiding && turkey.hideCover === c;
    const rustle = c.rustleTimer > 0 ? Math.sin(time * 45) * 3.5 : 0;
    if (c.rustleTimer > 0) c.rustleTimer = Math.max(0, c.rustleTimer - 0.016);

    ctx.save();
    ctx.translate(c.x + c.w * 0.5 + rustle, c.y + c.h);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;

    if (c.kind === 'haystack') {
      const grad = ctx.createLinearGradient(0, -c.h, 0, 0);
      grad.addColorStop(0, '#f4c64e');
      grad.addColorStop(1, '#b87416');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-c.w * 0.54, 0);
      ctx.quadraticCurveTo(-c.w * 0.48, -c.h * 0.92, 0, -c.h);
      ctx.quadraticCurveTo(c.w * 0.48, -c.h * 0.92, c.w * 0.54, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Hay tuft strokes
      ctx.strokeStyle = '#854e0f';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 15, -c.h * 0.65);
        ctx.lineTo(i * 18 + 6, -c.h * 0.2);
        ctx.stroke();
      }
    } else if (c.kind === 'pumpkinPatch') {
      // Leafy bush + plump harvest pumpkins
      ctx.fillStyle = '#4e6e2c';
      ctx.beginPath();
      ctx.arc(-20, -34, 28, 0, Math.PI * 2);
      ctx.arc(20, -36, 30, 0, Math.PI * 2);
      ctx.arc(0, -46, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawMiniPumpkin(ctx, -22, -18, 22);
      drawMiniPumpkin(ctx, 20, -16, 20);
      drawMiniPumpkin(ctx, 0, -14, 24);
    } else if (c.kind === 'flourBarrel' || c.kind === 'pantryCrate') {
      ctx.fillStyle = '#8c4c22';
      ctx.beginPath();
      ctx.roundRect(-c.w * 0.5, -c.h, c.w, c.h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3d2a23';
      ctx.fillRect(-c.w * 0.5, -c.h + 14, c.w, 8);
      ctx.fillRect(-c.w * 0.5, -22, c.w, 8);
      // Label
      ctx.fillStyle = PALETTE.parchment;
      ctx.fillRect(-20, -c.h * 0.58, 40, 20);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FLOUR', 0, -c.h * 0.58 + 14);
    } else {
      // Wooden Thanksgiving Kitchen Table with scalloped gingham tablecloth & steaming pumpkin pie!
      // Wooden legs poking underneath
      ctx.fillStyle = '#592911';
      ctx.fillRect(-c.w * 0.44, -22, 12, 22);
      ctx.strokeRect(-c.w * 0.44, -22, 12, 22);
      ctx.fillRect(c.w * 0.44 - 12, -22, 12, 22);
      ctx.strokeRect(c.w * 0.44 - 12, -22, 12, 22);

      // Draped cream tablecloth with scalloped hem
      ctx.fillStyle = '#faecd0';
      ctx.beginPath();
      ctx.moveTo(-c.w * 0.52, -c.h);
      ctx.lineTo(c.w * 0.52, -c.h);
      ctx.lineTo(c.w * 0.52, -16);
      for (let sx = c.w * 0.52; sx > -c.w * 0.52; sx -= 21) {
        ctx.quadraticCurveTo(sx - 10.5, -5, sx - 21, -16);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Checkered festive crimson runner stripe
      ctx.fillStyle = '#c93322';
      ctx.fillRect(-c.w * 0.5 + 2, -c.h + 14, c.w - 4, 12);
      ctx.fillStyle = '#f5b83d';
      ctx.fillRect(-c.w * 0.5 + 2, -28, c.w - 4, 6);

      // Carved butcher-block tabletop rim
      ctx.fillStyle = '#995324';
      ctx.beginPath();
      ctx.roundRect(-c.w * 0.54, -c.h - 4, c.w * 1.08, 16, 5);
      ctx.fill();
      ctx.stroke();

      // Little pumpkin pie sitting on the kitchen table!
      ctx.fillStyle = '#d9862b';
      ctx.beginPath();
      ctx.ellipse(0, -c.h - 6, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff9ec';
      ctx.beginPath();
      ctx.arc(0, -c.h - 10, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // If Barnaby is hiding inside, draw his comical peeking eyes + HIDDEN badge!
    if (isHidingHere) {
      ctx.fillStyle = '#1f0d07';
      ctx.beginPath();
      ctx.ellipse(0, -c.h * 0.52, 22, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // Peeking comic eyes
      for (const ex of [-8, 8]) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, -c.h * 0.52, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#120805';
        ctx.beginPath();
        ctx.arc(ex - 2, -c.h * 0.52, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Floating HIDDEN pill
      drawFloatingPill(ctx, 0, -c.h - 22, 'HIDDEN', '#4aa83b', '#ffffff');
    } else if (Math.abs(turkey.x - (c.x + c.w * 0.5)) < 80 && Math.abs(turkey.y - stage.groundY) < 40) {
      drawFloatingPill(ctx, 0, -c.h - 18, '[S] HIDE', 'rgba(38, 16, 9, 0.82)', '#ffe6a3');
    }

    ctx.restore();
  }
}

function drawMiniPumpkin(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#5e7a2b';
  ctx.fillRect(-3, -r - 5, 6, 9);
  ctx.fillStyle = '#e86f1c';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(-r * 0.32, 0, r * 0.65, r * 0.84, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.32, 0, r * 0.65, r * 0.84, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f58826';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.58, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function renderOvens(ctx, stage, time) {
  for (const oven of stage.ovens) {
    ctx.save();
    ctx.translate(oven.x, oven.y);

    // Warm radiant floor glow around every roasting oven
    const glowIntensity = oven.state === 'blast' ? 0.68 : oven.state === 'telegraph' ? 0.45 : 0.24;
    const glow = ctx.createRadialGradient(oven.w * 0.5, oven.h * 0.65, 14, oven.w * 0.5, oven.h * 0.65, 190);
    glow.addColorStop(0, `rgba(255, 128, 32, ${glowIntensity})`);
    glow.addColorStop(1, 'rgba(255, 80, 12, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(oven.w * 0.5, oven.h * 0.65, 190, 0, Math.PI * 2);
    ctx.fill();

    // Chimney stovepipe
    ctx.fillStyle = '#241e20';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.fillRect(oven.w - 34, -56, 22, 60);
    ctx.strokeRect(oven.w - 34, -56, 22, 60);

    // Cast-iron roasting oven chassis
    const shakeX = oven.state === 'telegraph' ? Math.sin(time * 65) * 3 : 0;
    ctx.translate(shakeX, 0);

    const ironGrad = ctx.createLinearGradient(0, 0, oven.w, oven.h);
    ironGrad.addColorStop(0, '#443c3e');
    ironGrad.addColorStop(0.5, '#2b2527');
    ironGrad.addColorStop(1, '#1a1618');
    ctx.fillStyle = ironGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, oven.w, oven.h, 8);
    ctx.fill();
    ctx.stroke();

    // Copper stovetop rim & brass knobs
    ctx.fillStyle = '#c97434';
    ctx.fillRect(-4, -5, oven.w + 8, 12);
    ctx.strokeRect(-4, -5, oven.w + 8, 12);

    // Temperature badge ("450°F")
    ctx.fillStyle = oven.state === 'idle' ? '#f5e1b8' : '#ff4d24';
    ctx.beginPath();
    ctx.roundRect(12, 14, 54, 20, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = oven.state === 'idle' ? '#261009' : '#ffffff';
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('450°F', 39, 28);

    // Brass burner knobs
    for (let k = 0; k < 2; k++) {
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(80 + k * 18, 24, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Glowing firebox cavity
    const fireGrad = ctx.createLinearGradient(14, 44, 14, oven.h - 14);
    fireGrad.addColorStop(0, '#fff29c');
    fireGrad.addColorStop(0.45, '#ff7a1a');
    fireGrad.addColorStop(1, '#a81c0c');
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.roundRect(12, 44, oven.w - 24, oven.h - 58, 6);
    ctx.fill();
    ctx.stroke();

    // Animated dancing flames inside oven grate
    for (let f = 0; f < 4; f++) {
      const fx = 24 + f * 20;
      const fh = 18 + Math.sin(time * 16 + f * 2.1) * 9;
      ctx.fillStyle = f % 2 === 0 ? '#ffe985' : '#ff5514';
      ctx.beginPath();
      ctx.moveTo(fx - 8, oven.h - 16);
      ctx.quadraticCurveTo(fx, oven.h - 16 - fh, fx + 8, oven.h - 16);
      ctx.closePath();
      ctx.fill();
    }

    // Cast-iron oven grate bars (dimmed as door swings open)
    ctx.strokeStyle = 'rgba(28, 18, 18, 0.85)';
    ctx.lineWidth = 3;
    if (oven.doorOpen < 0.7) {
      for (let gx = 24; gx < oven.w - 16; gx += 16) {
        ctx.beginPath();
        ctx.moveTo(gx, 46);
        ctx.lineTo(gx, oven.h - 16);
        ctx.stroke();
      }
    }

    // Telegraph warning sign above roaring oven
    if (oven.state === 'telegraph') {
      const pulse = 0.7 + Math.sin(time * 28) * 0.3;
      ctx.save();
      ctx.globalAlpha = pulse;
      drawFloatingPill(ctx, oven.w * 0.5, -24, 'OVEN BLAST!', '#e03616', '#fff5d1');
      ctx.restore();
    }

    // Roaring flame jet blasting out of the open oven door!
    if (oven.state === 'blast') {
      const dir = oven.facing;
      const startX = dir < 0 ? 4 : oven.w - 4;
      const len = oven.flameLength * (0.9 + Math.sin(time * 32) * 0.1);
      const midY = 78;

      // Outer crimson-orange flame tongue
      const jetGrad = ctx.createLinearGradient(startX, midY, startX + dir * len, midY);
      jetGrad.addColorStop(0, 'rgba(255, 245, 160, 0.96)');
      jetGrad.addColorStop(0.35, 'rgba(255, 128, 24, 0.92)');
      jetGrad.addColorStop(0.8, 'rgba(220, 42, 16, 0.75)');
      jetGrad.addColorStop(1, 'rgba(220, 42, 16, 0)');

      ctx.fillStyle = jetGrad;
      ctx.beginPath();
      ctx.moveTo(startX, midY - 30);
      ctx.quadraticCurveTo(startX + dir * len * 0.55, midY - 46 + Math.sin(time * 24) * 8, startX + dir * len, midY);
      ctx.quadraticCurveTo(startX + dir * len * 0.55, midY + 42 - Math.cos(time * 22) * 8, startX, midY + 30);
      ctx.closePath();
      ctx.fill();

      // Inner white-gold searing core
      ctx.fillStyle = 'rgba(255, 250, 200, 0.85)';
      ctx.beginPath();
      ctx.moveTo(startX, midY - 14);
      ctx.quadraticCurveTo(startX + dir * len * 0.45, midY - 20, startX + dir * len * 0.72, midY);
      ctx.quadraticCurveTo(startX + dir * len * 0.45, midY + 18, startX, midY + 14);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

function renderPendulums(ctx, stage) {
  for (const pend of stage.pendulums) {
    ctx.save();
    // Chain & pivot
    ctx.strokeStyle = '#332826';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pend.x, pend.pivotY);
    ctx.lineTo(pend.bobX, pend.bobY);
    ctx.stroke();

    ctx.fillStyle = '#5c4b47';
    ctx.beginPath();
    ctx.arc(pend.x, pend.pivotY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Giant gleaming butcher cleaver head
    ctx.translate(pend.bobX, pend.bobY);
    ctx.rotate(-pend.angle);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;

    // Wooden handle
    ctx.fillStyle = '#75391a';
    ctx.fillRect(-7, -34, 14, 24);
    ctx.strokeRect(-7, -34, 14, 24);

    // Cleaver steel blade
    const bladeGrad = ctx.createLinearGradient(-28, -10, 28, 34);
    bladeGrad.addColorStop(0, '#ffffff');
    bladeGrad.addColorStop(0.5, '#cdd9e5');
    bladeGrad.addColorStop(1, '#798da1');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.roundRect(-26, -10, 52, 42, 6);
    ctx.fill();
    ctx.stroke();

    // Sharp gleaming edge & hang hole
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-23, 24, 46, 5);
    ctx.fillStyle = '#331c12';
    ctx.beginPath();
    ctx.arc(14, 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function renderCarvingKnives(ctx, knives, time) {
  for (const k of knives) {
    ctx.save();
    if (k.telegraph > 0) {
      // Crisp dotted danger trajectory line & pulsing warning reticle!
      ctx.strokeStyle = 'rgba(255, 72, 36, 0.78)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(k.x, k.y);
      ctx.lineTo(k.x + k.vx * 0.55, k.y + k.vy * 0.55);
      ctx.stroke();
      ctx.setLineDash([]);

      const pulse = 1 + Math.sin(time * 32) * 0.16;
      ctx.translate(k.x, k.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#e02819';
      ctx.strokeStyle = '#fff5d1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 1);
      ctx.restore();
      continue;
    }

    // Motion swoosh trail
    ctx.strokeStyle = 'rgba(255, 245, 220, 0.36)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(k.x, k.y);
    ctx.lineTo(k.x - k.vx * 0.065, k.y - k.vy * 0.065);
    ctx.stroke();

    // Detailed gleaming carving knife
    ctx.translate(k.x, k.y);
    ctx.rotate(k.rot);
    drawCarvingKnifeSprite(ctx, 1.15);
    ctx.restore();
  }
}

function drawCarvingKnifeSprite(ctx, scale = 1) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.6;

  // Walnut handle with brass rivets
  ctx.fillStyle = '#6e3214';
  ctx.beginPath();
  ctx.roundRect(-34, -6, 22, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(-27, 0, 2.2, 0, Math.PI * 2);
  ctx.arc(-19, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Steel bolster
  ctx.fillStyle = '#b4c3d1';
  ctx.fillRect(-13, -7, 5, 14);

  // Gleaming forged carving blade
  const grad = ctx.createLinearGradient(-8, -9, 38, 9);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.45, '#dde7f0');
  grad.addColorStop(1, '#8fa3b5');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-8, -7);
  ctx.lineTo(24, -6);
  ctx.quadraticCurveTo(38, -2, 44, 4);
  ctx.lineTo(22, 8);
  ctx.lineTo(-8, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Razor glint highlight
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 4);
  ctx.lineTo(36, 3);
  ctx.stroke();
  ctx.restore();
}

function renderKickProps(ctx, stage) {
  for (const prop of stage.kickProps) {
    if (prop.used) continue;
    ctx.save();
    ctx.translate(prop.x, prop.y);
    ctx.rotate(prop.rot);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.8;

    if (prop.kind === 'pumpkin') {
      drawMiniPumpkin(ctx, 0, 0, prop.radius);
    } else if (prop.kind === 'flourSack') {
      ctx.fillStyle = '#f7ebd4';
      ctx.beginPath();
      ctx.roundRect(-20, -22, 40, 44, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b8742e';
      ctx.fillRect(-12, -26, 24, 7);
      ctx.fillStyle = '#c93322';
      ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FLOUR', 0, 4);
    } else {
      // Shiny copper pot
      const g = ctx.createLinearGradient(-18, -16, 18, 16);
      g.addColorStop(0, '#f5a962');
      g.addColorStop(1, '#9e4416');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(-18, -14, 36, 30, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#472110';
      ctx.fillRect(16, -8, 14, 6);
      ctx.strokeRect(16, -8, 14, 6);
    }
    ctx.restore();
  }
}

function renderPickups(ctx, stage, time) {
  for (const item of stage.pickups) {
    if (item.collected) continue;
    const bob = Math.sin(item.bobPhase) * 6;
    ctx.save();
    ctx.translate(item.x, item.y + bob);

    // Soft golden pickup halo
    const halo = ctx.createRadialGradient(0, 0, 3, 0, 0, 24);
    halo.addColorStop(0, item.kind === 'cranberry' ? 'rgba(255, 86, 102, 0.45)' : 'rgba(255, 214, 88, 0.5)');
    halo.addColorStop(1, 'rgba(255, 214, 88, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.4;

    if (item.kind === 'corn') {
      // Golden cob of autumn corn with green husk leaves
      ctx.rotate(-0.3);
      ctx.fillStyle = '#f7c538';
      ctx.beginPath();
      ctx.ellipse(0, -2, 8.5, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#5a8a32';
      ctx.beginPath();
      ctx.ellipse(-6, 8, 5, 10, -0.45, 0, Math.PI * 2);
      ctx.ellipse(6, 8, 5, 10, 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (item.kind === 'cranberry') {
      // Glossy ruby cranberry cluster
      ctx.fillStyle = '#d92638';
      for (const [bx, by] of [[-5, 3], [5, 3], [0, -5]]) {
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -7, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Radiant Golden Turkey Feather (+1 Life / Bonus!)
      ctx.rotate(Math.sin(time * 3 + item.bobPhase) * 0.25);
      ctx.fillStyle = '#ffd54a';
      ctx.beginPath();
      ctx.ellipse(0, -4, 9, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff5d1';
      ctx.beginPath();
      ctx.ellipse(0, -14, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9e5c0a';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 18);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function renderExitGate(ctx, stage, time) {
  const x = stage.exitX;
  const g = stage.groundY;
  ctx.save();
  ctx.translate(x, g);

  const isFinal = stage.theme === 'banquet';
  // Radiant escape beacon glow
  const glow = ctx.createRadialGradient(54, -96, 14, 54, -96, 190);
  glow.addColorStop(0, isFinal ? 'rgba(255, 240, 175, 0.72)' : 'rgba(255, 205, 102, 0.5)');
  glow.addColorStop(1, 'rgba(255, 205, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(54, -96, 190, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;

  if (isFinal) {
    // Tall arched FREEDOM WINDOW looking out onto golden autumn woods!
    const winSky = ctx.createLinearGradient(0, -210, 0, 0);
    winSky.addColorStop(0, '#ffd87a');
    winSky.addColorStop(0.6, '#ff9c3b');
    winSky.addColorStop(1, '#79a84c');
    ctx.fillStyle = winSky;
    ctx.beginPath();
    ctx.arc(56, -148, 56, Math.PI, 0);
    ctx.lineTo(112, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawFloatingPill(ctx, 56, -228 + Math.sin(time * 5) * 4, 'FREEDOM EXIT!', '#2e8b38', '#fff8dc');
  } else {
    // Rustic wooden doorway leading to the next escape zone
    ctx.fillStyle = '#47210e';
    ctx.beginPath();
    ctx.roundRect(0, -175, 110, 175, [54, 54, 0, 0]);
    ctx.fill();
    ctx.stroke();

    const portal = ctx.createLinearGradient(12, -162, 12, 0);
    portal.addColorStop(0, '#ffe494');
    portal.addColorStop(1, '#e87e24');
    ctx.fillStyle = portal;
    ctx.beginPath();
    ctx.roundRect(14, -160, 82, 160, [42, 42, 0, 0]);
    ctx.fill();

    const labels = ['TO BARN →', 'TO KITCHEN →', 'TO BANQUET →', 'FREEDOM!'];
    drawFloatingPill(ctx, 55, -196 + Math.sin(time * 5) * 4, labels[stage.index] || 'NEXT ZONE →', '#c95a18', '#fff5d1');
  }

  ctx.restore();
}

export function drawTurkeyFigure(ctx, turkey, time, isGhost = false) {
  if (!isGhost && turkey.invulnTimer > 0 && Math.floor(time * 18) % 2 === 0) {
    ctx.save();
    ctx.globalAlpha = 0.45;
  } else {
    ctx.save();
  }

  const x = turkey.x;
  const y = turkey.y;
  const f = turkey.facing;

  // Ground shadow
  ctx.fillStyle = 'rgba(28, 12, 6, 0.34)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 28, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, y);
  ctx.scale(f * turkey.squashX * 1.15, turkey.squashY * 1.15);

  const runBob = turkey.grounded && Math.abs(turkey.vx) > 20 ? Math.abs(Math.sin(turkey.runCycle * 2)) * 5 : 0;
  ctx.translate(0, -runBob);

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Glorious fanned-out 7-feather Thanksgiving tail!
  const tailSpread = turkey.fluttering || turkey.dashTimer > 0 ? 1.18 : 0.92;
  const tailColors = ['#9c2c1c', '#d4581c', '#eb8e24', '#c43e1b', '#e37720', '#f0a62e', '#9c2c1c'];
  ctx.save();
  ctx.translate(-14, -30);
  for (let i = -3; i <= 3; i++) {
    const angle = -2.28 + i * 0.27 * tailSpread + Math.sin(time * 12 + i) * 0.03;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = tailColors[i + 3];
    ctx.beginPath();
    ctx.ellipse(24, 0, 23, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Cream-gold autumn feather tip band
    ctx.fillStyle = '#fae5bc';
    ctx.beginPath();
    ctx.ellipse(39, 0, 6.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 2. Energetic kicking orange turkey legs & webbed feet
  const stride = turkey.grounded ? Math.sin(turkey.runCycle * 2) * 14 : 9;
  const kickExt = turkey.kickAnimTimer > 0 ? 18 : 0;
  for (const [legIdx, offset] of [[0, -stride], [1, stride + kickExt]]) {
    ctx.strokeStyle = '#e07a1d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(legIdx === 0 ? -4 : 6, -16);
    ctx.lineTo(offset, -4);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(offset - 6, -2);
    ctx.lineTo(offset + 12, -2);
    ctx.moveTo(offset + 2, -2);
    ctx.lineTo(offset + 9, -6);
    ctx.stroke();
  }

  // 3. Plump shaded chestnut body
  const bodyGrad = ctx.createRadialGradient(4, -34, 6, 0, -28, 32);
  bodyGrad.addColorStop(0, '#9c4b23');
  bodyGrad.addColorStop(0.65, '#6e2d14');
  bodyGrad.addColorStop(1, '#471a0b');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -29, 24, 19, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Warm chest highlight arc
  ctx.fillStyle = 'rgba(255, 200, 128, 0.22)';
  ctx.beginPath();
  ctx.ellipse(9, -34, 12, 9, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // 4. Articulated flapping wing
  const flapAngle = turkey.fluttering
    ? Math.sin(turkey.wingFlap) * 0.95 - 0.5
    : Math.sin(turkey.wingFlap * 0.6) * 0.22;
  ctx.save();
  ctx.translate(-2, -32);
  ctx.rotate(flapAngle);
  ctx.fillStyle = '#853918';
  ctx.beginPath();
  ctx.ellipse(-4, 4, 16, 10, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 5. Expressive bobbing neck & head
  const headBob = Math.sin(turkey.runCycle * 2 + 0.6) * 2.5;
  ctx.save();
  ctx.translate(18, -46 + headBob);

  // Neck
  ctx.fillStyle = '#753116';
  ctx.beginPath();
  ctx.roundRect(-7, -4, 14, 22, 6);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = '#8c3b1b';
  ctx.beginPath();
  ctx.arc(2, -10, 13.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Golden beak (opens wide during GOBBLE!)
  const openMouth = turkey.gobbleMouthTimer > 0 ? 0.35 : 0.04;
  ctx.fillStyle = '#f7b731';
  ctx.beginPath();
  ctx.moveTo(12, -14);
  ctx.lineTo(27, -10 - openMouth * 12);
  ctx.lineTo(13, -7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(12, -7);
  ctx.lineTo(23, -5 + openMouth * 12);
  ctx.lineTo(11, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Iconic wobbling scarlet snood & wattle (spring physics!)
  ctx.save();
  ctx.translate(13, -12);
  ctx.rotate(turkey.wattleSwing);
  ctx.fillStyle = '#e02424';
  ctx.beginPath();
  ctx.ellipse(4, 9, 4.5, 9, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Huge expressive comic eyes!
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(7, -14, 6.2, 7.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#140805';
  ctx.beginPath();
  ctx.arc(8.5, -14, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(9.4, -15.5, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

export function drawFarmerFigure(ctx, farmer, time) {
  ctx.save();
  const x = farmer.x;
  const y = farmer.y;
  const f = farmer.facing;

  // Heavy ground shadow
  ctx.fillStyle = 'rgba(26, 10, 4, 0.36)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 36, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, y);
  ctx.scale(f * 1.1, 1.1);

  const bob = farmer.state === 'stunned' || farmer.state === 'blind'
    ? Math.sin(time * 22) * 2
    : Math.abs(Math.sin(farmer.runCycle * 2)) * 6;
  const lean = farmer.state === 'lunge' ? 0.22 : farmer.state === 'chase' ? 0.1 : 0;

  ctx.translate(0, -bob);
  ctx.rotate(lean);

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Heavy stomping boots & legs
  const stride = farmer.state === 'stunned' || farmer.state === 'blind' ? 0 : Math.sin(farmer.runCycle * 2) * 18;
  for (const offset of [-stride, stride]) {
    ctx.fillStyle = '#2d4766';
    ctx.fillRect(offset - 8, -36, 16, 26);
    ctx.strokeRect(offset - 8, -36, 16, 26);
    ctx.fillStyle = '#3b1e10';
    ctx.beginPath();
    ctx.roundRect(offset - 9, -14, 24, 14, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Torso: Farmhand flannel + overalls OR Chef jacket + Thanksgiving apron!
  if (farmer.outfit === 'chef') {
    ctx.fillStyle = '#fbf6ec';
    ctx.beginPath();
    ctx.roundRect(-24, -84, 48, 54, 14);
    ctx.fill();
    ctx.stroke();
    // Red-checkered Thanksgiving chef apron
    ctx.fillStyle = '#c93322';
    ctx.beginPath();
    ctx.roundRect(-17, -64, 38, 36, 6);
    ctx.fill();
    ctx.stroke();
    // Double-breasted chef buttons
    ctx.fillStyle = PALETTE.ink;
    for (const by of [-74, -64]) {
      ctx.beginPath();
      ctx.arc(4, by, 2.2, 0, Math.PI * 2);
      ctx.arc(14, by, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Red plaid flannel shirt + denim overalls
    ctx.fillStyle = '#b83220';
    ctx.beginPath();
    ctx.roundRect(-24, -84, 48, 54, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#35567a';
    ctx.beginPath();
    ctx.roundRect(-21, -64, 42, 34, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-14, -82, 8, 22);
    ctx.fillRect(8, -82, 8, 22);
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(-10, -62, 3, 0, Math.PI * 2);
    ctx.arc(12, -62, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head & expressive comic face (dusted white when flour-blind!)
  ctx.fillStyle = farmer.state === 'blind' ? '#f5efe6' : '#f2b88b';
  ctx.beginPath();
  ctx.arc(2, -100, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Angry nose & bushy auburn mustache
  ctx.fillStyle = '#e07a5f';
  ctx.beginPath();
  ctx.arc(16, -98, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#783416';
  ctx.beginPath();
  ctx.ellipse(12, -91, 13, 6, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes & furious furrowed brows
  if (farmer.state === 'stunned' || farmer.state === 'blind') {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(6, -108);
    ctx.lineTo(14, -100);
    ctx.moveTo(14, -108);
    ctx.lineTo(6, -100);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10, -104, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(12, -104, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Furrowed angry brow
    ctx.strokeStyle = '#632810';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(3, -113);
    ctx.lineTo(17, -108);
    ctx.stroke();
  }

  // Headgear: Straw Farm Hat OR Tall Pleated Chef Toque!
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  if (farmer.outfit === 'chef') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -134, 13, 0, Math.PI * 2);
    ctx.arc(4, -138, 15, 0, Math.PI * 2);
    ctx.arc(15, -133, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-15, -128, 34, 15);
    ctx.strokeRect(-15, -128, 34, 15);
  } else {
    ctx.fillStyle = '#e5b24c';
    ctx.beginPath();
    ctx.ellipse(2, -115, 30, 7, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-15, -134, 34, 20, [10, 10, 2, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b82c1e';
    ctx.fillRect(-15, -120, 34, 6);
  }

  // Brandished arm holding gleaming giant Carving Knife!
  const swing = farmer.state === 'lunge' ? -0.45 : Math.sin(farmer.armSwing) * 0.35 - 0.15;
  ctx.save();
  ctx.translate(14, -72);
  ctx.rotate(swing);
  ctx.fillStyle = farmer.outfit === 'chef' ? '#fbf6ec' : '#b83220';
  ctx.beginPath();
  ctx.roundRect(-4, -8, 28, 14, 7);
  ctx.fill();
  ctx.stroke();
  ctx.translate(28, 0);
  ctx.rotate(-0.4);
  drawCarvingKnifeSprite(ctx, 1.05);
  ctx.restore();

  ctx.restore();

  // Diegetic AI status badge (! / ? / dizzy stars / comic shout bubble)
  ctx.save();
  ctx.translate(x, y - 166);
  if (farmer.state === 'stunned' || farmer.state === 'blind') {
    for (let i = 0; i < 3; i++) {
      const a = time * 5 + (i * Math.PI * 2) / 3;
      const sx = Math.cos(a) * 26;
      const sy = Math.sin(a) * 9;
      ctx.fillStyle = PALETTE.gold;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (farmer.state === 'search') {
    drawFloatingPill(ctx, 0, 0, '? SEARCHING', '#f0a629', '#261009');
  } else if (farmer.alertTimer > 0 || farmer.state === 'lunge') {
    drawFloatingPill(ctx, 0, 0, '! ' + (farmer.shoutText || 'GET BACK HERE!'), '#d92818', '#fff8dc');
  }
  ctx.restore();
}

function renderWorldParticles(ctx, particles, time) {
  for (const p of particles.particles) {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    if (p.kind === 'feather') {
      ctx.fillStyle = p.color;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (p.kind === 'ember') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'cloud' || p.kind === 'dust') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * (1.2 - alpha * 0.3), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'sparkle') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.4, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size * 0.4, 0);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Comic floating score & feedback callouts
  for (const c of particles.callouts) {
    const alpha = Math.min(1, (c.life / c.maxLife) * 1.6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);
    ctx.font = '900 22px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = PALETTE.ink;
    ctx.strokeText(c.text, 0, 0);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, 0, 0);
    ctx.restore();
  }
  void time;
}

function renderAtmosphereOverlay(ctx, stage, particles, cameraX, time) {
  // Drifting autumn maple leaves in foreground (especially vivid in Farmyard & Banquet)
  const leafAlpha = stage.theme === 'farmyard' ? 0.85 : stage.theme === 'banquet' ? 0.52 : 0.25;
  ctx.save();
  ctx.globalAlpha = leafAlpha;
  for (const leaf of particles.leaves) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot);
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.moveTo(0, -leaf.size);
    ctx.lineTo(leaf.size * 0.65, -leaf.size * 0.2);
    ctx.lineTo(leaf.size * 0.3, leaf.size * 0.5);
    ctx.lineTo(0, leaf.size * 0.9);
    ctx.lineTo(-leaf.size * 0.3, leaf.size * 0.5);
    ctx.lineTo(-leaf.size * 0.65, -leaf.size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Warm ambient color wash & subtle cinematic vignette
  const vig = ctx.createRadialGradient(
    VIEWPORT.width * 0.5,
    VIEWPORT.height * 0.48,
    VIEWPORT.width * 0.34,
    VIEWPORT.width * 0.5,
    VIEWPORT.height * 0.5,
    VIEWPORT.width * 0.72,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(24, 9, 4, 0.46)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  if (particles.flashAlpha > 0 && particles.flashColor) {
    ctx.save();
    ctx.globalAlpha = particles.flashAlpha;
    ctx.fillStyle = particles.flashColor;
    ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
    ctx.restore();
  }
  void cameraX;
  void time;
}

function drawFloatingPill(ctx, x, y, text, bg, fg) {
  ctx.save();
  ctx.font = '800 13px "Trebuchet MS", "Segoe UI", sans-serif';
  const w = Math.max(66, ctx.measureText(text).width + 20);
  const h = 24;
  ctx.fillStyle = bg;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x - w * 0.5, y - h * 0.5, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}
