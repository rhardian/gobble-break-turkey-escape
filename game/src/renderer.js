// Studio-grade 2.5D storybook world renderer: 4-layer parallax, perspective floors, dynamic firelight & depth framing.

import {
  drawCarvingKnifeSprite,
  drawFarmerVillain,
  drawFloatingPill,
  drawMiniPumpkin,
  drawStarSpark,
  drawTurkeyHero,
  drawVictorianOven,
} from './artwork.js';
import { PALETTE, VIEWPORT } from './config.js';

export function renderScene(ctx, state, patterns, time) {
  const { stage, turkey, farmer, knives, particles, cameraX, combo } = state;
  const shake = particles.getShakeOffset();

  ctx.save();
  ctx.translate(shake.x, shake.y);

  renderBackdrop(ctx, stage, patterns, cameraX, time);

  ctx.save();
  ctx.translate(-cameraX, 0);

  renderPerspectiveFloor(ctx, stage, patterns, cameraX, time);
  renderStageDecor(ctx, stage, time);
  renderGravySpills(ctx, stage, time);
  renderPlatforms(ctx, stage, patterns);
  renderExitGate(ctx, stage, time);
  renderOvens(ctx, stage, time);
  renderCoversBack(ctx, stage);
  renderPickups(ctx, stage, time);
  renderKickProps(ctx, stage);
  renderPendulums(ctx, stage);

  // Dash feather afterimages
  for (const ghost of turkey.trail) {
    ctx.save();
    ctx.globalAlpha = ghost.alpha * 0.44;
    drawTurkeyHero(ctx, { ...turkey, x: ghost.x, y: ghost.y, facing: ghost.facing }, time, true, 1);
    ctx.restore();
  }

  // Barnaby behind cover if hiding, or prominently in front otherwise
  if (turkey.hiding) {
    renderCoversFront(ctx, stage, turkey, time);
  } else {
    drawTurkeyHero(ctx, turkey, time, false, combo);
    renderCoversFront(ctx, stage, turkey, time);
  }

  drawFarmerVillain(ctx, farmer, time);
  renderCarvingKnives(ctx, knives, time);
  renderWorldParticles(ctx, particles);

  ctx.restore();

  // Foreground depth silhouettes, drifting maple leaves, warm rim vignette
  renderAtmosphereAndForeground(ctx, stage, particles, cameraX, time);

  ctx.restore();
}

export function renderBackdrop(ctx, stage, patterns, cameraX, time) {
  const W = VIEWPORT.width;
  const H = VIEWPORT.height;

  const sky = ctx.createLinearGradient(0, 0, 0, stage.groundY);
  sky.addColorStop(0, stage.skyTop);
  sky.addColorStop(0.54, stage.skyMid);
  sky.addColorStop(1, stage.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  if (stage.theme === 'farmyard') {
    renderFarmyardParallax(ctx, stage, cameraX, time);
  } else if (stage.theme === 'barn') {
    renderBarnParallax(ctx, stage, patterns, cameraX, time);
  } else if (stage.theme === 'kitchen') {
    renderKitchenParallax(ctx, stage, patterns, cameraX, time);
  } else {
    renderBanquetParallax(ctx, stage, patterns, cameraX, time);
  }
}

function renderFarmyardParallax(ctx, stage, cameraX, time) {
  const W = VIEWPORT.width;
  const g = stage.groundY;

  // Radiant golden-hour harvest sun & atmospheric haze
  const sunX = W * 0.74 - (cameraX * 0.03) % 220;
  const sunY = 172;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 16, sunX, sunY, 370);
  sunGlow.addColorStop(0, 'rgba(255, 250, 212, 0.98)');
  sunGlow.addColorStop(0.18, 'rgba(255, 206, 98, 0.72)');
  sunGlow.addColorStop(0.55, 'rgba(235, 114, 34, 0.22)');
  sunGlow.addColorStop(1, 'rgba(235, 114, 34, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, W, g);

  // Painterly golden-edged sunset cumulus clouds
  const cloudWrap = W + 420;
  for (let i = 0; i < 6; i++) {
    const cx = (((i * 270 + 80 - cameraX * 0.05) % cloudWrap) + cloudWrap) % cloudWrap - 160;
    const cy = 96 + (i % 3) * 44;
    drawSunsetCloud(ctx, cx, cy, 0.85 + (i % 2) * 0.35);
  }

  // Distant V-formation migrating autumn geese silhouettes!
  ctx.strokeStyle = 'rgba(54, 18, 12, 0.65)';
  ctx.lineWidth = 2.2;
  const flockX = ((W * 0.45 - time * 18 - cameraX * 0.06) % (W + 240) + W + 240) % (W + 240) - 100;
  for (let b = 0; b < 5; b++) {
    const bx = flockX + b * 22;
    const by = 148 + Math.abs(b - 2) * 11 + Math.sin(time * 6 + b) * 3;
    ctx.beginPath();
    ctx.moveTo(bx - 7, by + 3);
    ctx.quadraticCurveTo(bx - 3, by - 4, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - 4, bx + 7, by + 3);
    ctx.stroke();
  }

  // Diagonal volumetric sunset shafts
  ctx.fillStyle = 'rgba(255, 224, 150, 0.085)';
  for (let i = 0; i < 5; i++) {
    const rx = (((i * 310 - cameraX * 0.08) % (W + 420)) + W + 420) % (W + 420) - 180;
    ctx.beginPath();
    ctx.moveTo(rx, 0); ctx.lineTo(rx + 108, 0);
    ctx.lineTo(rx - 150, g); ctx.lineTo(rx - 258, g);
    ctx.closePath();
    ctx.fill();
  }

  // 3-layer rolling autumn mountain & harvest patchwork hills
  drawRollingHills(ctx, cameraX * 0.1, 392, '#5c1f1a', 52, 0.0034);
  drawRollingHills(ctx, cameraX * 0.2, 438, '#7e2f19', 42, 0.0046);
  drawRollingHills(ctx, cameraX * 0.3, 488, '#9e4419', 26, 0.006);

  // Midground red clapboard barn, stone silo, spinning windmill & lush maple groves
  const span = 940;
  const start = -((cameraX * 0.32) % span) - span;
  for (let bx = start; bx < W + span; bx += span) {
    drawDistantBarn(ctx, bx + 195, g - 134, time);
    drawAutumnMapleGrove(ctx, bx + 575, g - 118);
  }

  // Warm atmospheric mist separating background from playable lane
  const mist = ctx.createLinearGradient(0, g - 185, 0, g);
  mist.addColorStop(0, 'rgba(248, 162, 74, 0)');
  mist.addColorStop(1, 'rgba(248, 162, 74, 0.2)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, g - 185, W, 185);

  // Detailed weathered split-rail wooden farm fence
  const fStep = 148;
  const fStart = -((cameraX * 0.65) % fStep) - fStep;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.2;
  for (const ry of [g - 78, g - 44]) {
    const rGrad = ctx.createLinearGradient(0, ry, 0, ry + 12);
    rGrad.addColorStop(0, '#783e1f');
    rGrad.addColorStop(1, '#47210e');
    ctx.fillStyle = rGrad;
    ctx.fillRect(0, ry, W, 12);
    ctx.strokeRect(-2, ry, W + 4, 12);
  }
  for (let fx = fStart; fx < W + fStep; fx += fStep) {
    const pGrad = ctx.createLinearGradient(fx, 0, fx + 18, 0);
    pGrad.addColorStop(0, '#854623');
    pGrad.addColorStop(1, '#4a220e');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(fx, g - 106, 18, 108, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();
  }
}

function renderBarnParallax(ctx, stage, patterns, cameraX, time) {
  const W = VIEWPORT.width;
  const g = stage.groundY;

  ctx.save();
  ctx.globalAlpha = 0.44;
  ctx.translate(-((cameraX * 0.35) % 160), 0);
  ctx.fillStyle = patterns.woodPlank;
  ctx.fillRect(-160, 0, W + 320, g);
  ctx.restore();

  // Arched sunlit barn loft windows casting volumetric golden rays
  const wStep = 430;
  const wStart = -((cameraX * 0.36) % wStep) - wStep;
  for (let wx = wStart; wx < W + wStep; wx += wStep) {
    ctx.fillStyle = '#ffd275';
    ctx.fillRect(wx + 120, 62, 104, 78);
    ctx.strokeStyle = '#36170a';
    ctx.lineWidth = 7;
    ctx.strokeRect(wx + 120, 62, 104, 78);
    ctx.beginPath();
    ctx.moveTo(wx + 172, 62); ctx.lineTo(wx + 172, 140);
    ctx.moveTo(wx + 120, 101); ctx.lineTo(wx + 224, 101);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 218, 130, 0.10)';
    ctx.beginPath();
    ctx.moveTo(wx + 120, 140); ctx.lineTo(wx + 224, 140);
    ctx.lineTo(wx + 44, g); ctx.lineTo(wx - 94, g);
    ctx.closePath();
    ctx.fill();
  }

  // Heavy cathedral timber trusses & swaying golden lanterns
  ctx.fillStyle = '#2e1409';
  ctx.fillRect(0, 0, W, 46);
  const bStep = 330;
  const bStart = -((cameraX * 0.56) % bStep) - bStep;
  for (let bx = bStart; bx < W + bStep; bx += bStep) {
    ctx.fillStyle = '#3d1c0d';
    ctx.fillRect(bx, 0, 38, g);
    // Diagonal timber brace
    ctx.strokeStyle = '#3d1c0d';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(bx + 36, 132);
    ctx.lineTo(bx + 115, 42);
    ctx.stroke();
    drawHangingLantern(ctx, bx + 175, 46, time + bx * 0.01);
  }
}

function renderKitchenParallax(ctx, stage, patterns, cameraX, time) {
  const W = VIEWPORT.width;
  const g = stage.groundY;

  // Warm mortar-shaded hearth brick wall
  ctx.save();
  ctx.globalAlpha = 0.62;
  ctx.translate(-((cameraX * 0.38) % 128), 0);
  ctx.fillStyle = patterns.brickWall;
  ctx.fillRect(-128, 0, W + 256, g);
  ctx.restore();

  // Warm top timber header beam & rustic chair-rail molding
  ctx.fillStyle = '#2b1209';
  ctx.fillRect(0, 0, W, 40);
  ctx.fillStyle = '#5c2c16';
  ctx.fillRect(0, 38, W, 8);
  ctx.fillStyle = '#3d1b0d';
  ctx.fillRect(0, 238, W, 16);
  ctx.fillStyle = 'rgba(255, 208, 140, 0.14)';
  ctx.fillRect(0, 238, W, 3);

  // Repeating hearth kitchen bays: glowing sunset cottage windows, hanging copper racks & spice shelves!
  const kStep = 450;
  const kStart = -((cameraX * 0.42) % kStep) - kStep;
  for (let kx = kStart; kx < W + kStep; kx += kStep) {
    drawKitchenWindow(ctx, kx + 58, 72);
    drawCopperPotRack(ctx, kx + 275, 40, time + kx * 0.01);
    drawSpiceShelf(ctx, kx + 225, 198);
  }

  // Soft hearth-glow warmth rising from the floor
  const hearth = ctx.createLinearGradient(0, g - 220, 0, g);
  hearth.addColorStop(0, 'rgba(255, 132, 42, 0)');
  hearth.addColorStop(1, 'rgba(255, 132, 42, 0.16)');
  ctx.fillStyle = hearth;
  ctx.fillRect(0, g - 220, W, 220);
}

function renderBanquetParallax(ctx, stage, patterns, cameraX, time) {
  const W = VIEWPORT.width;
  const g = stage.groundY;

  ctx.save();
  ctx.globalAlpha = 0.56;
  ctx.translate(-((cameraX * 0.35) % 96), 0);
  ctx.fillStyle = patterns.banquetWall;
  ctx.fillRect(-96, 0, W + 192, g);
  ctx.restore();

  // Rich oak wainscoting with gold trim
  ctx.fillStyle = '#33120b';
  ctx.fillRect(0, 0, W, 44);
  ctx.fillStyle = '#471b10';
  ctx.fillRect(0, g - 146, W, 146);
  ctx.fillStyle = '#e5a93c';
  ctx.fillRect(0, g - 150, W, 6);

  // Tall moonlit Gothic windows casting cool silver-blue shafts + warm gold chandeliers!
  const bqStep = 440;
  const bqStart = -((cameraX * 0.42) % bqStep) - bqStep;
  for (let x = bqStart; x < W + bqStep; x += bqStep) {
    drawBanquetArchWindow(ctx, x + 64, 68);
    drawChandelier(ctx, x + 286, 44, time + x * 0.01);
  }
}

function renderPerspectiveFloor(ctx, stage, patterns, cameraX, time) {
  const g = stage.groundY;
  const h = VIEWPORT.height - g;
  const startX = Math.floor(cameraX / 128) * 128 - 128;
  const width = VIEWPORT.width + 384;

  if (stage.theme === 'kitchen') {
    // TRUE 2.5D PERSPECTIVE CHECKERED THANKSGIVING KITCHEN FLOOR!
    const tileRows = 4;
    const rowHeights = [22, 27, 34, 46];
    let curY = g;
    const cx = cameraX + VIEWPORT.width * 0.5;
    for (let r = 0; r < tileRows; r++) {
      const rh = rowHeights[r];
      const topScale = 1 + r * 0.12;
      const botScale = 1 + (r + 1) * 0.12;
      const baseTileW = 62;
      const firstCol = Math.floor((cameraX - 240) / baseTileW);
      const lastCol = Math.ceil((cameraX + VIEWPORT.width + 240) / baseTileW);
      for (let col = firstCol; col <= lastCol; col++) {
        const wx0 = col * baseTileW;
        const wx1 = (col + 1) * baseTileW;
        const tx0 = cx + (wx0 - cx) * topScale;
        const tx1 = cx + (wx1 - cx) * topScale;
        const bx0 = cx + (wx0 - cx) * botScale;
        const bx1 = cx + (wx1 - cx) * botScale;
        const isCream = (col + r) % 2 === 0;
        ctx.fillStyle = isCream ? '#f2e3c4' : '#9c3b23';
        ctx.beginPath();
        ctx.moveTo(tx0, curY);
        ctx.lineTo(tx1, curY);
        ctx.lineTo(bx1, curY + rh);
        ctx.lineTo(bx0, curY + rh);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(54, 24, 12, 0.34)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      curY += rh;
    }

    // Polished ceramic tile reflections of every roaring 450°F oven flame!
    for (const oven of stage.ovens) {
      const intensity = oven.state === 'blast' ? 0.44 : 0.18;
      const rx = oven.facing < 0 ? oven.x - 36 : oven.x + oven.w + 36;
      const refl = ctx.createRadialGradient(rx, g + 34, 8, rx, g + 44, 145);
      refl.addColorStop(0, `rgba(255, 164, 52, ${intensity})`);
      refl.addColorStop(1, 'rgba(255, 92, 18, 0)');
      ctx.fillStyle = refl;
      ctx.fillRect(rx - 150, g, 300, h);
    }

    // Dark baseboard molding strip
    ctx.fillStyle = '#33150a';
    ctx.fillRect(startX, g - 7, width, 11);
    ctx.fillStyle = 'rgba(255, 224, 165, 0.25)';
    ctx.fillRect(startX, g - 6, width, 2);
  } else if (stage.theme === 'banquet') {
    // 2.5D Banquet Hall mahogany floor with plush gold-trimmed crimson carpet runner!
    ctx.fillStyle = '#3d190d';
    ctx.fillRect(startX, g, width, h);
    const runnerG = ctx.createLinearGradient(0, g + 14, 0, VIEWPORT.height - 14);
    runnerG.addColorStop(0, '#8f1b26');
    runnerG.addColorStop(0.5, '#6e141d');
    runnerG.addColorStop(1, '#4a0c12');
    ctx.fillStyle = runnerG;
    ctx.fillRect(startX, g + 14, width, h - 24);
    // Gold woven border stripes
    ctx.fillStyle = '#e5a93c';
    ctx.fillRect(startX, g + 14, width, 5);
    ctx.fillRect(startX, g + 23, width, 2);
    ctx.fillRect(startX, VIEWPORT.height - 16, width, 5);
    ctx.fillStyle = '#290f08';
    ctx.fillRect(startX, g - 6, width, 8);
  } else if (stage.theme === 'barn') {
    ctx.fillStyle = patterns.woodPlank;
    ctx.fillRect(startX, g, width, h);
    ctx.fillStyle = '#2d1308';
    ctx.fillRect(startX, g - 5, width, 9);
  } else {
    // Painterly cobbled autumn farm lane with golden grass verge & grass blades!
    ctx.fillStyle = patterns.cobbledDirt;
    ctx.fillRect(startX, g, width, h);
    const soilShade = ctx.createLinearGradient(0, g, 0, VIEWPORT.height);
    soilShade.addColorStop(0, 'rgba(255, 190, 96, 0.14)');
    soilShade.addColorStop(0.5, 'rgba(30, 12, 4, 0.15)');
    soilShade.addColorStop(1, 'rgba(20, 8, 3, 0.65)');
    ctx.fillStyle = soilShade;
    ctx.fillRect(startX, g, width, h);

    // Lush autumn verge & stylized grass blades
    ctx.fillStyle = '#b86d1f';
    ctx.fillRect(startX, g - 5, width, 15);
    ctx.fillStyle = '#e59d2c';
    ctx.fillRect(startX, g - 5, width, 5);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillRect(startX, g - 6, width, 2);

    ctx.strokeStyle = '#d98f26';
    ctx.lineWidth = 2;
    for (let gx = startX; gx < startX + width; gx += 34) {
      ctx.beginPath();
      ctx.moveTo(gx, g - 4);
      ctx.lineTo(gx - 4, g - 13);
      ctx.moveTo(gx + 5, g - 4);
      ctx.lineTo(gx + 9, g - 11);
      ctx.stroke();
    }
  }
  void time;
}

function drawSunsetCloud(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const grad = ctx.createLinearGradient(0, -40, 0, 22);
  grad.addColorStop(0, 'rgba(116, 36, 26, 0.36)');
  grad.addColorStop(0.62, 'rgba(186, 74, 34, 0.34)');
  grad.addColorStop(1, 'rgba(255, 202, 112, 0.42)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-42, 16);
  ctx.arc(-10, 4, 24, Math.PI * 0.75, Math.PI * 1.75);
  ctx.arc(28, -10, 34, Math.PI * 1.05, Math.PI * 1.9);
  ctx.arc(72, -4, 28, Math.PI * 1.1, Math.PI * 1.95);
  ctx.arc(106, 6, 18, Math.PI * 1.15, Math.PI * 0.2);
  ctx.quadraticCurveTo(40, 22, -42, 16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRollingHills(ctx, offset, baseY, color, amp, freq) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEWPORT.groundY);
  for (let x = 0; x <= VIEWPORT.width; x += 24) {
    const wx = x + offset;
    const y = baseY + Math.sin(wx * freq) * amp + Math.cos(wx * freq * 0.52) * (amp * 0.52);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEWPORT.width, VIEWPORT.groundY);
  ctx.closePath();
  ctx.fill();
}

function drawDistantBarn(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  // Stone silo with copper dome
  ctx.fillStyle = '#75251a';
  ctx.fillRect(114, -24, 44, 160);
  ctx.fillStyle = '#471a14';
  ctx.beginPath(); ctx.arc(136, -24, 22, Math.PI, 0); ctx.fill();

  // Classic red gambrel barn with shadowed roof eave
  const barnG = ctx.createLinearGradient(0, -48, 0, 136);
  barnG.addColorStop(0, '#b5341e');
  barnG.addColorStop(1, '#751c12');
  ctx.fillStyle = barnG;
  ctx.beginPath();
  ctx.moveTo(0, 136); ctx.lineTo(0, 34); ctx.lineTo(22, -16);
  ctx.lineTo(64, -48); ctx.lineTo(106, -16); ctx.lineTo(128, 34); ctx.lineTo(128, 136);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#38120c';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Warm glowing hayloft window
  ctx.fillStyle = '#ffe082';
  ctx.fillRect(48, 6, 32, 32);
  ctx.strokeStyle = '#4f180e';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 6, 32, 32);

  // Cream cross-braced barn doors
  ctx.strokeStyle = '#edd4ab';
  ctx.lineWidth = 3.2;
  ctx.strokeRect(36, 58, 56, 76);
  ctx.beginPath();
  ctx.moveTo(36, 58); ctx.lineTo(92, 134);
  ctx.moveTo(92, 58); ctx.lineTo(36, 134);
  ctx.stroke();

  // Detailed farm windmill
  ctx.save();
  ctx.translate(178, -28);
  ctx.strokeStyle = '#3b1910';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(-16, 162);
  ctx.moveTo(0, 0); ctx.lineTo(16, 162);
  ctx.moveTo(-8, 70); ctx.lineTo(8, 70);
  ctx.stroke();
  ctx.rotate(time * 0.72);
  ctx.fillStyle = '#e0a658';
  for (let i = 0; i < 6; i++) {
    ctx.rotate((Math.PI * 2) / 6);
    ctx.fillRect(-3.5, 4, 7, 36);
  }
  ctx.restore();
  ctx.restore();
}

function drawAutumnMapleGrove(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#471e10';
  ctx.fillRect(-10, 26, 18, 94);
  ctx.fillRect(54, 38, 16, 82);
  const foliage = [
    [-34, 24, 42, '#b32c19'], [14, 4, 50, '#e3631b'], [-4, -20, 38, '#f5aa2a'],
    [60, 22, 40, '#c4371b'], [88, 36, 32, '#ed8d24'], [26, -12, 30, '#ffc44d'],
  ];
  for (const [px, py, r, col] of foliage) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHangingLantern(ctx, x, y, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(phase * 1.4) * 0.08);
  ctx.strokeStyle = '#240f08';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 48); ctx.stroke();

  const glow = ctx.createRadialGradient(0, 64, 6, 0, 64, 130);
  glow.addColorStop(0, 'rgba(255, 228, 138, 0.56)');
  glow.addColorStop(0.5, 'rgba(255, 162, 52, 0.2)');
  glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 64, 130, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#2e1810';
  ctx.fillRect(-14, 46, 28, 8);
  ctx.fillStyle = '#ffe594';
  ctx.fillRect(-10, 54, 20, 24);
  ctx.strokeRect(-10, 54, 20, 24);
  ctx.fillStyle = '#2e1810';
  ctx.fillRect(-14, 78, 28, 7);
  ctx.restore();
}

function drawKitchenWindow(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  const sky = ctx.createLinearGradient(0, 0, 0, 136);
  sky.addColorStop(0, '#8a2914');
  sky.addColorStop(0.52, '#e87826');
  sky.addColorStop(1, '#ffd478');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 148, 136);

  const orb = ctx.createRadialGradient(104, 86, 4, 104, 86, 48);
  orb.addColorStop(0, 'rgba(255, 250, 214, 0.96)');
  orb.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, 148, 136);

  // Rolling sunset hill & autumn maple outside
  ctx.fillStyle = '#632112';
  ctx.beginPath();
  ctx.moveTo(0, 136); ctx.quadraticCurveTo(48, 96, 98, 110);
  ctx.quadraticCurveTo(126, 114, 148, 98); ctx.lineTo(148, 136);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#47170d';
  ctx.fillRect(28, 76, 8, 60);
  ctx.fillStyle = '#b32d17';
  ctx.beginPath();
  ctx.arc(32, 66, 22, 0, Math.PI * 2);
  ctx.arc(16, 78, 16, 0, Math.PI * 2);
  ctx.arc(46, 78, 16, 0, Math.PI * 2);
  ctx.fill();

  // Warm sunbeam shaft pouring diagonally across the kitchen
  ctx.fillStyle = 'rgba(255, 224, 146, 0.085)';
  ctx.beginPath();
  ctx.moveTo(0, 136); ctx.lineTo(148, 136);
  ctx.lineTo(52, 490); ctx.lineTo(-96, 490);
  ctx.closePath();
  ctx.fill();

  // Wooden window frame & mullions
  ctx.strokeStyle = '#45200f';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, 148, 136);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(74, 0); ctx.lineTo(74, 136);
  ctx.moveTo(0, 68); ctx.lineTo(148, 68);
  ctx.stroke();

  // Festive red-and-cream gingham kitchen valance
  ctx.fillStyle = '#c93322';
  ctx.fillRect(-8, -6, 164, 24);
  ctx.fillStyle = '#fff3d6';
  for (let i = 0; i < 156; i += 24) {
    ctx.fillRect(-8 + i, -6, 12, 12);
    ctx.fillRect(4 + i, 6, 12, 12);
  }
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-8, -6, 164, 24);
  ctx.restore();
}

function drawCopperPotRack(ctx, x, y, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#24120b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-72, 34); ctx.lineTo(72, 34);
  ctx.moveTo(-54, 0); ctx.lineTo(-54, 34);
  ctx.moveTo(54, 0); ctx.lineTo(54, 34);
  ctx.stroke();

  [-48, 0, 48].forEach((px, idx) => {
    ctx.save();
    ctx.translate(px, 34);
    ctx.rotate(Math.sin(phase * 1.3 + idx) * 0.05);
    ctx.strokeStyle = '#331c12';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.stroke();

    const grad = ctx.createLinearGradient(-18, 26, 20, 64);
    grad.addColorStop(0, '#ffcb91');
    grad.addColorStop(0.45, '#cf6b2b');
    grad.addColorStop(1, '#753111');
    ctx.fillStyle = grad;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.6;
    if (idx === 1) {
      ctx.beginPath(); ctx.arc(0, 50, 23, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 248, 224, 0.45)';
      ctx.beginPath(); ctx.ellipse(-7, 42, 5, 9, -0.4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.roundRect(-17, 26, 34, 28, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 248, 224, 0.35)';
      ctx.fillRect(-12, 30, 5, 18);
    }
    ctx.restore();
  });
  ctx.restore();
}

function drawSpiceShelf(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#4f2411';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  ctx.fillRect(0, 0, 108, 10);
  ctx.strokeRect(0, 0, 108, 10);
  const jars = [
    [14, '#d94c26'], [38, '#e8a82e'], [62, '#5a8234'], [86, '#c93322'],
  ];
  for (const [jx, col] of jars) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.roundRect(jx, -24, 16, 24, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c48341';
    ctx.fillRect(jx + 2, -29, 12, 5);
  }
  ctx.restore();
}

function drawBanquetArchWindow(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  const moonSky = ctx.createLinearGradient(0, 0, 0, 190);
  moonSky.addColorStop(0, '#0e1730');
  moonSky.addColorStop(0.58, '#243a63');
  moonSky.addColorStop(1, '#5c5278');
  ctx.fillStyle = moonSky;
  ctx.beginPath();
  ctx.arc(64, 64, 64, Math.PI, 0);
  ctx.lineTo(128, 190);
  ctx.lineTo(0, 190);
  ctx.closePath();
  ctx.fill();

  // Twinkling harvest stars & moon glow
  ctx.fillStyle = 'rgba(255, 248, 220, 0.88)';
  for (const [sx, sy, sr] of [[26, 36, 2], [46, 22, 1.5], [100, 30, 2], [22, 82, 1.5]]) {
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }
  const moonGlow = ctx.createRadialGradient(86, 52, 8, 86, 52, 50);
  moonGlow.addColorStop(0, 'rgba(255, 246, 206, 0.98)');
  moonGlow.addColorStop(0.5, 'rgba(215, 226, 255, 0.35)');
  moonGlow.addColorStop(1, 'rgba(215, 226, 255, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath(); ctx.arc(86, 52, 50, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff7d4';
  ctx.beginPath(); ctx.arc(86, 52, 18, 0, Math.PI * 2); ctx.fill();

  // Pine silhouettes outside window
  ctx.fillStyle = '#142033';
  ctx.beginPath();
  ctx.moveTo(0, 190); ctx.lineTo(26, 134); ctx.lineTo(50, 190);
  ctx.lineTo(78, 122); ctx.lineTo(108, 190); ctx.lineTo(128, 152); ctx.lineTo(128, 190);
  ctx.closePath();
  ctx.fill();

  // Cool silver-blue moonlight shaft entering the banquet hall
  ctx.fillStyle = 'rgba(182, 208, 255, 0.065)';
  ctx.beginPath();
  ctx.moveTo(0, 190); ctx.lineTo(128, 190);
  ctx.lineTo(44, 520); ctx.lineTo(-84, 520);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#38170c';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(64, 64, 64, Math.PI, 0);
  ctx.lineTo(128, 190); ctx.lineTo(0, 190); ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, 0); ctx.lineTo(64, 190);
  ctx.moveTo(0, 114); ctx.lineTo(128, 114);
  ctx.stroke();
  ctx.restore();
}

function drawChandelier(ctx, x, y, phase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#d49d35';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 48);
  ctx.moveTo(-58, 48); ctx.quadraticCurveTo(0, 78, 58, 48);
  ctx.stroke();

  const glow = ctx.createRadialGradient(0, 44, 10, 0, 44, 158);
  glow.addColorStop(0, 'rgba(255, 228, 144, 0.48)');
  glow.addColorStop(1, 'rgba(255, 170, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 44, 158, 0, Math.PI * 2); ctx.fill();

  for (const cx of [-58, 0, 58]) {
    ctx.fillStyle = '#fff5dc';
    ctx.fillRect(cx - 4, 28, 8, 20);
    const fl = Math.sin(phase * 14 + cx) * 2;
    ctx.fillStyle = '#ffc442';
    ctx.beginPath();
    ctx.ellipse(cx, 22 + fl * 0.3, 5.2, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function renderStageDecor(ctx, stage, time) {
  const g = stage.groundY;
  for (const d of stage.decor) {
    if (d.kind === 'mapleTree') {
      ctx.save();
      ctx.translate(d.x, g);
      ctx.fillStyle = '#471f0f';
      ctx.fillRect(-10, -148 * d.scale, 20, 148 * d.scale);
      const col = d.hue === 'red' ? '#ba301a' : d.hue === 'gold' ? '#eba528' : '#de611a';
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.arc(0, -168 * d.scale, 58 * d.scale, 0, Math.PI * 2);
      ctx.arc(-38 * d.scale, -142 * d.scale, 40 * d.scale, 0, Math.PI * 2);
      ctx.arc(40 * d.scale, -140 * d.scale, 42 * d.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (d.kind === 'pumpkins') {
      drawMiniPumpkin(ctx, d.x, g - 12, 16);
      drawMiniPumpkin(ctx, d.x + 23, g - 9, 12);
    } else if (d.kind === 'scarecrow') {
      ctx.save();
      ctx.translate(d.x, g);
      ctx.strokeStyle = '#3b1c0e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, -112);
      ctx.moveTo(-36, -80); ctx.lineTo(36, -80);
      ctx.stroke();
      ctx.fillStyle = '#c45b20';
      ctx.fillRect(-14, -86, 28, 38);
      ctx.fillStyle = '#e8a52a';
      ctx.beginPath(); ctx.arc(0, -106, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c3114';
      ctx.fillRect(-24, -120, 48, 6);
      ctx.fillRect(-13, -136, 26, 16);
      ctx.restore();
    }
  }
  void time;
}

function renderGravySpills(ctx, stage, time) {
  for (const spill of stage.gravySpills) {
    ctx.save();
    const grad = ctx.createLinearGradient(spill.x, spill.y, spill.x, spill.y + 18);
    grad.addColorStop(0, '#a15a23');
    grad.addColorStop(1, '#4f260c');
    ctx.fillStyle = grad;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(spill.x + spill.w * 0.5, spill.y + 6, spill.w * 0.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 224, 158, 0.54)';
    for (let i = 0; i < 3; i++) {
      const bx = spill.x + spill.w * (0.25 + i * 0.25);
      const r = 3 + Math.abs(Math.sin(time * 4 + i * 1.9)) * 3.5;
      ctx.beginPath(); ctx.arc(bx, spill.y + 3, r, 0, Math.PI * 2); ctx.fill();
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
      ctx.beginPath(); ctx.roundRect(plat.x, plat.y, plat.w, 34, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 240, 175, 0.28)';
      ctx.fillRect(plat.x + 4, plat.y + 3, plat.w - 8, 6);
      ctx.strokeStyle = '#733e14';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(plat.x + plat.w * 0.25, plat.y); ctx.lineTo(plat.x + plat.w * 0.25, plat.y + 34);
      ctx.moveTo(plat.x + plat.w * 0.75, plat.y); ctx.lineTo(plat.x + plat.w * 0.75, plat.y + 34);
      ctx.stroke();
    } else if (plat.style === 'counter' || plat.style === 'shelf') {
      const topG = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + 26);
      topG.addColorStop(0, '#e3a65c');
      topG.addColorStop(0.5, '#ba7636');
      topG.addColorStop(1, '#7a451a');
      ctx.fillStyle = topG;
      ctx.beginPath(); ctx.roundRect(plat.x, plat.y, plat.w, 26, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 242, 210, 0.45)';
      ctx.fillRect(plat.x + 5, plat.y + 3, plat.w - 10, 5);
      // Wrought-iron brackets
      ctx.fillStyle = '#332018';
      ctx.fillRect(plat.x + 16, plat.y + 26, 12, 26);
      ctx.fillRect(plat.x + plat.w - 28, plat.y + 26, 12, 26);
    } else if (plat.style === 'banquet') {
      ctx.fillStyle = '#6b2d14';
      ctx.fillRect(plat.x + 12, plat.y + 22, 12, stage.groundY - plat.y - 22);
      ctx.fillRect(plat.x + plat.w - 24, plat.y + 22, 12, stage.groundY - plat.y - 22);
      ctx.fillStyle = '#fff5e0';
      ctx.beginPath(); ctx.roundRect(plat.x - 4, plat.y, plat.w + 8, 28, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = PALETTE.gold;
      ctx.fillRect(plat.x - 2, plat.y + 20, plat.w + 4, 6);
    } else {
      ctx.fillStyle = patterns.woodPlank;
      ctx.beginPath(); ctx.roundRect(plat.x, plat.y, plat.w, 26, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 224, 155, 0.22)';
      ctx.fillRect(plat.x + 4, plat.y + 3, plat.w - 8, 5);
    }
    ctx.restore();
  }
}

function renderCoversBack(ctx, stage) {
  for (const c of stage.covers) {
    if (c.kind === 'kitchenTable') {
      ctx.fillStyle = '#36170b';
      ctx.fillRect(c.x + 8, c.y + 18, c.w - 16, c.h - 18);
    }
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
      grad.addColorStop(0, '#fae074');
      grad.addColorStop(0.55, '#d99824');
      grad.addColorStop(1, '#9c5c0e');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-c.w * 0.54, 0);
      ctx.quadraticCurveTo(-c.w * 0.48, -c.h * 0.94, 0, -c.h);
      ctx.quadraticCurveTo(c.w * 0.48, -c.h * 0.94, c.w * 0.54, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#854e0f';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(i * 15, -c.h * 0.68); ctx.lineTo(i * 18 + 6, -c.h * 0.18); ctx.stroke();
      }
    } else if (c.kind === 'pumpkinPatch') {
      ctx.fillStyle = '#4a6e28';
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
      const barG = ctx.createLinearGradient(-c.w * 0.5, 0, c.w * 0.5, 0);
      barG.addColorStop(0, '#6e3716');
      barG.addColorStop(0.45, '#a85f2c');
      barG.addColorStop(1, '#5c2b10');
      ctx.fillStyle = barG;
      ctx.beginPath(); ctx.roundRect(-c.w * 0.5, -c.h, c.w, c.h, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#382721';
      ctx.fillRect(-c.w * 0.5, -c.h + 14, c.w, 8);
      ctx.fillRect(-c.w * 0.5, -22, c.w, 8);
      ctx.fillStyle = PALETTE.parchment;
      ctx.fillRect(-22, -c.h * 0.58, 44, 20);
      ctx.fillStyle = PALETTE.ink;
      ctx.font = '900 10px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FLOUR', 0, -c.h * 0.58 + 14);
    } else {
      // Wooden Thanksgiving Kitchen Table with scalloped gingham cloth & steaming lattice pumpkin pie!
      ctx.fillStyle = '#592911';
      ctx.fillRect(-c.w * 0.44, -22, 12, 22); ctx.strokeRect(-c.w * 0.44, -22, 12, 22);
      ctx.fillRect(c.w * 0.44 - 12, -22, 12, 22); ctx.strokeRect(c.w * 0.44 - 12, -22, 12, 22);

      ctx.fillStyle = '#faecd0';
      ctx.beginPath();
      ctx.moveTo(-c.w * 0.52, -c.h);
      ctx.lineTo(c.w * 0.52, -c.h);
      ctx.lineTo(c.w * 0.52, -16);
      for (let sx = c.w * 0.52; sx > -c.w * 0.52; sx -= 21) {
        ctx.quadraticCurveTo(sx - 10.5, -4, sx - 21, -16);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#c93322';
      ctx.fillRect(-c.w * 0.5 + 2, -c.h + 14, c.w - 4, 12);
      ctx.fillStyle = '#f5b83d';
      ctx.fillRect(-c.w * 0.5 + 2, -28, c.w - 4, 6);

      ctx.fillStyle = '#995324';
      ctx.beginPath(); ctx.roundRect(-c.w * 0.54, -c.h - 4, c.w * 1.08, 16, 5); ctx.fill(); ctx.stroke();

      // Steaming Thanksgiving pumpkin pie with whipped cream dollop!
      ctx.fillStyle = '#df8626';
      ctx.beginPath(); ctx.ellipse(0, -c.h - 6, 24, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff9ec';
      ctx.beginPath(); ctx.arc(0, -c.h - 11, 6.5, 0, Math.PI * 2); ctx.fill();
    }

    if (isHidingHere) {
      ctx.fillStyle = '#1f0d07';
      ctx.beginPath(); ctx.ellipse(0, -c.h * 0.52, 23, 11, 0, 0, Math.PI * 2); ctx.fill();
      for (const ex of [-8, 8]) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(ex, -c.h * 0.52, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#120805';
        ctx.beginPath(); ctx.arc(ex - 2, -c.h * 0.52, 2.8, 0, Math.PI * 2); ctx.fill();
      }
      drawFloatingPill(ctx, 0, -c.h - 24, 'HIDDEN!', '#3e9e35', '#ffffff');
    } else if (Math.abs(turkey.x - (c.x + c.w * 0.5)) < 82 && Math.abs(turkey.y - stage.groundY) < 42) {
      drawFloatingPill(ctx, 0, -c.h - 20, '[S] HIDE', 'rgba(38, 16, 9, 0.88)', '#ffe6a3', PALETTE.gold);
    }

    ctx.restore();
  }
}

function renderOvens(ctx, stage, time) {
  for (const oven of stage.ovens) {
    drawVictorianOven(ctx, oven, time);
  }
}

function renderPendulums(ctx, stage) {
  for (const pend of stage.pendulums) {
    ctx.save();
    // Linked wrought-iron chain
    const dx = pend.bobX - pend.x;
    const dy = pend.bobY - pend.pivotY;
    const steps = 14;
    ctx.strokeStyle = '#332826';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(pend.x, pend.pivotY);
    ctx.lineTo(pend.bobX, pend.bobY);
    ctx.stroke();
    ctx.fillStyle = '#63534e';
    for (let s = 1; s < steps; s++) {
      const lx = pend.x + (dx * s) / steps;
      const ly = pend.pivotY + (dy * s) / steps;
      ctx.beginPath(); ctx.arc(lx, ly, 3.2, 0, Math.PI * 2); ctx.fill();
    }

    // Gleaming oversized Butcher Cleaver head
    ctx.translate(pend.bobX, pend.bobY);
    ctx.rotate(-pend.angle);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;

    ctx.fillStyle = '#75391a';
    ctx.fillRect(-7, -36, 14, 26); ctx.strokeRect(-7, -36, 14, 26);

    const bladeG = ctx.createLinearGradient(-28, -10, 28, 36);
    bladeG.addColorStop(0, '#ffffff');
    bladeG.addColorStop(0.5, '#cbd8e6');
    bladeG.addColorStop(1, '#778ca1');
    ctx.fillStyle = bladeG;
    ctx.beginPath(); ctx.roundRect(-27, -10, 54, 44, 6); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-24, 26, 48, 5);
    ctx.fillStyle = '#331c12';
    ctx.beginPath(); ctx.arc(15, 2, 4.2, 0, Math.PI * 2); ctx.fill();
    drawStarSpark(ctx, -14, 26, 5.5, '#ffffff');
    ctx.restore();
  }
}

function renderCarvingKnives(ctx, knives, time) {
  for (const k of knives) {
    ctx.save();
    if (k.telegraph > 0) {
      ctx.strokeStyle = 'rgba(255, 72, 36, 0.82)';
      ctx.lineWidth = 3.2;
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
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 1);
      ctx.restore();
      continue;
    }

    // Crisp luminous wind-ribbon motion streak
    const streak = ctx.createLinearGradient(k.x, k.y, k.x - k.vx * 0.09, k.y - k.vy * 0.09);
    streak.addColorStop(0, 'rgba(255, 248, 224, 0.58)');
    streak.addColorStop(1, 'rgba(255, 248, 224, 0)');
    ctx.strokeStyle = streak;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(k.x, k.y);
    ctx.lineTo(k.x - k.vx * 0.09, k.y - k.vy * 0.09);
    ctx.stroke();

    ctx.translate(k.x, k.y);
    ctx.rotate(k.rot);
    drawCarvingKnifeSprite(ctx, 1.18);
    ctx.restore();
  }
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
      const sG = ctx.createLinearGradient(-20, -22, 20, 22);
      sG.addColorStop(0, '#fff7e8');
      sG.addColorStop(1, '#dec9a4');
      ctx.fillStyle = sG;
      ctx.beginPath(); ctx.roundRect(-21, -23, 42, 46, 13); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b8742e';
      ctx.fillRect(-12, -27, 24, 7);
      ctx.fillStyle = '#c93322';
      ctx.font = '900 10px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FLOUR', 0, 4);
    } else {
      const g = ctx.createLinearGradient(-18, -16, 18, 16);
      g.addColorStop(0, '#ffc88c');
      g.addColorStop(0.5, '#cf6b2b');
      g.addColorStop(1, '#853511');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(-18, -14, 36, 30, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#472110';
      ctx.fillRect(16, -8, 14, 6); ctx.strokeRect(16, -8, 14, 6);
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

    const halo = ctx.createRadialGradient(0, 0, 3, 0, 0, 26);
    halo.addColorStop(0, item.kind === 'cranberry' ? 'rgba(255, 86, 102, 0.48)' : 'rgba(255, 220, 96, 0.56)');
    halo.addColorStop(1, 'rgba(255, 214, 88, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.4;

    if (item.kind === 'corn') {
      ctx.rotate(-0.3);
      ctx.fillStyle = '#fad043';
      ctx.beginPath(); ctx.ellipse(0, -2, 8.8, 15.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5a8a32';
      ctx.beginPath();
      ctx.ellipse(-6, 8, 5, 10, -0.45, 0, Math.PI * 2);
      ctx.ellipse(6, 8, 5, 10, 0.45, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (item.kind === 'cranberry') {
      ctx.fillStyle = '#de2438';
      for (const [bx, by] of [[-5, 3], [5, 3], [0, -5]]) {
        ctx.beginPath(); ctx.arc(bx, by, 7.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-2, -7, 2.2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.rotate(Math.sin(time * 3 + item.bobPhase) * 0.25);
      ctx.fillStyle = '#ffd852';
      ctx.beginPath(); ctx.ellipse(0, -4, 9.5, 21, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff7d6';
      ctx.beginPath(); ctx.ellipse(0, -14, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9e5c0a';
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 18); ctx.stroke();
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
  const glow = ctx.createRadialGradient(58, -104, 16, 58, -104, 210);
  glow.addColorStop(0, isFinal ? 'rgba(255, 244, 184, 0.78)' : 'rgba(255, 205, 102, 0.54)');
  glow.addColorStop(1, 'rgba(255, 205, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(58, -104, 210, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;

  if (isFinal) {
    const winSky = ctx.createLinearGradient(0, -218, 0, 0);
    winSky.addColorStop(0, '#ffe082');
    winSky.addColorStop(0.58, '#ff9c3b');
    winSky.addColorStop(1, '#6ba344');
    ctx.fillStyle = winSky;
    ctx.beginPath();
    ctx.arc(58, -152, 58, Math.PI, 0);
    ctx.lineTo(116, 0); ctx.lineTo(0, 0); ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawFloatingPill(ctx, 58, -234 + Math.sin(time * 5) * 4, 'FREEDOM EXIT!', '#2e8b38', '#fff8dc', '#ffd85e');
  } else {
    ctx.fillStyle = '#47210e';
    ctx.beginPath(); ctx.roundRect(0, -178, 114, 178, [56, 56, 0, 0]); ctx.fill(); ctx.stroke();
    const portal = ctx.createLinearGradient(14, -162, 14, 0);
    portal.addColorStop(0, '#ffe89c');
    portal.addColorStop(1, '#e87e24');
    ctx.fillStyle = portal;
    ctx.beginPath(); ctx.roundRect(14, -162, 86, 162, [44, 44, 0, 0]); ctx.fill();
    const labels = ['TO BARN →', 'TO KITCHEN →', 'TO BANQUET →', 'FREEDOM!'];
    drawFloatingPill(ctx, 57, -200 + Math.sin(time * 5) * 4, labels[stage.index] || 'NEXT ZONE →', '#c95a18', '#fff5d1', '#ffd85e');
  }
  ctx.restore();
}

function renderWorldParticles(ctx, particles) {
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
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (p.kind === 'ember') {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'cloud' || p.kind === 'dust') {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, 0, p.size * (1.22 - alpha * 0.3), 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'sparkle') {
      drawStarSpark(ctx, 0, 0, p.size, p.color);
    } else if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  for (const c of particles.callouts) {
    const alpha = Math.min(1, (c.life / c.maxLife) * 1.6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);
    ctx.font = '900 24px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 7;
    ctx.strokeStyle = PALETTE.ink;
    ctx.strokeText(c.text, 0, 0);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, 0, 0);
    ctx.restore();
  }
}

function renderAtmosphereAndForeground(ctx, stage, particles, cameraX, time) {
  // Subtle out-of-focus foreground depth foliage silhouettes at bottom corners (Farmyard)
  if (stage.theme === 'farmyard') {
    ctx.save();
    ctx.fillStyle = 'rgba(34, 13, 6, 0.55)';
    const sway = Math.sin(time * 2.2) * 4;
    for (const [bx, dir] of [[0, 1], [VIEWPORT.width, -1]]) {
      ctx.beginPath();
      ctx.moveTo(bx, VIEWPORT.height);
      ctx.quadraticCurveTo(bx + dir * 48, VIEWPORT.height - 62 + sway, bx + dir * 92, VIEWPORT.height - 28);
      ctx.quadraticCurveTo(bx + dir * 56, VIEWPORT.height - 10, bx + dir * 124, VIEWPORT.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Drifting autumn maple leaves across camera plane
  const leafAlpha = stage.theme === 'farmyard' ? 0.88 : stage.theme === 'banquet' ? 0.55 : 0.28;
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

  // Cinematic warm storybook vignette
  const vig = ctx.createRadialGradient(
    VIEWPORT.width * 0.5, VIEWPORT.height * 0.48, VIEWPORT.width * 0.34,
    VIEWPORT.width * 0.5, VIEWPORT.height * 0.5, VIEWPORT.width * 0.72,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(22, 8, 3, 0.48)');
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
}
