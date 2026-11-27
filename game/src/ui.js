// Crisp 2D Canvas HUD, 3D-projected diegetic callouts, Perk Draft cards, Title Crest, and Split-Showcase End Screens.

import * as THREE from 'three';
import { PALETTE, STAGE_DEFS, VIEWPORT } from './config.js';

const _projVec = new THREE.Vector3();

export function projectToScreen(camera, x, y, z) {
  _projVec.set(x, y, z);
  _projVec.project(camera);
  if (_projVec.z > 1) return null;
  return {
    x: (_projVec.x * 0.5 + 0.5) * VIEWPORT.width,
    y: (-_projVec.y * 0.5 + 0.5) * VIEWPORT.height,
  };
}

export function getOverlayButtons(mode, perkChoices = []) {
  const cx = VIEWPORT.width * 0.5;
  if (mode === 'title') {
    return [
      { id: 'play_story', label: 'PLAY 3D ESCAPE', sub: '4 STAGES + PERKS', x: cx - 246, y: 206, w: 236, h: 62, primary: true },
      { id: 'play_endless', label: 'ENDLESS FEAST', sub: 'HIGH-SCORE GAUNTLET', x: cx + 10, y: 206, w: 236, h: 62, primary: false },
    ];
  }
  if (mode === 'perk_draft') {
    return perkChoices.map((perk, idx) => ({
      id: `perk_${idx}`,
      perk,
      index: idx,
      x: cx - 450 + idx * 308,
      y: 255,
      w: 284,
      h: 230,
      primary: idx === 0,
    }));
  }
  if (mode === 'paused') {
    return [
      { id: 'resume', label: 'RESUME ESCAPE', sub: 'SPACE / P', x: cx - 124, y: 336, w: 248, h: 58, primary: true },
      { id: 'restart', label: 'RESTART', sub: 'R', x: cx - 124, y: 408, w: 248, h: 52, primary: false },
      { id: 'title', label: 'TITLE MENU', sub: '', x: cx - 124, y: 472, w: 248, h: 48, primary: false },
    ];
  }
  if (mode === 'caught' || mode === 'escaped') {
    // Positioned cleanly on the right-hand Split-Showcase Victory/Caught card!
    const cardCx = 918;
    return [
      { id: 'restart', label: 'PLAY AGAIN', sub: 'SPACE / R', x: cardCx - 242, y: 536, w: 232, h: 64, primary: true },
      { id: 'title', label: 'TITLE MENU', sub: 'CHANGE MODE', x: cardCx + 10, y: 536, w: 232, h: 64, primary: false },
    ];
  }
  return [];
}

export function getHudButtons() {
  return [
    { id: 'mute', x: VIEWPORT.width - 108, y: 18, w: 42, h: 42 },
    { id: 'pause', x: VIEWPORT.width - 58, y: 18, w: 42, h: 42 },
  ];
}

export function hitTestButtons(buttons, px, py) {
  for (const b of buttons) {
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b;
  }
  return null;
}

export function renderWorldCallouts(ctx, state) {
  const { camera, farmer, turkey, stage, effects } = state;
  const minBadgeY = state.mode === 'title' ? 286 : 104;
  const maxBadgeX = state.mode === 'caught' || state.mode === 'escaped' ? 560 : VIEWPORT.width - 40;

  // Farmer / Chef Jeb 3D overhead alert / search speech pill
  if (farmer) {
    const pos = projectToScreen(camera, farmer.x, 3.25, farmer.z);
    if (pos && pos.y > minBadgeY - 36 && pos.y < VIEWPORT.height - 54 && pos.x > 40 && pos.x < maxBadgeX) {
      const py = Math.max(minBadgeY, pos.y);
      if (farmer.state === 'stunned' || farmer.state === 'blind') {
        drawWorldBadge(ctx, pos.x, py, farmer.state === 'blind' ? 'ACHOO! BLINDED!' : 'STUNNED!', '#3a1c0f', '#ffe38c', '#ffd24d');
      } else if (farmer.state === 'search') {
        drawWorldBadge(ctx, pos.x, py, '? SEARCHING COVER...', '#f2a924', '#240e06', '#fff2be');
      } else if (farmer.alertTimer > 0 || farmer.state === 'lunge') {
        drawWorldBadge(ctx, pos.x, py, '! ' + farmer.shoutText, '#d62214', '#fff8dc', '#ffe28a');
      }
    }
  }

  if (state.mode === 'caught' || state.mode === 'escaped') return;

  // Hiding / Nearby 3D Cover badge
  if (turkey && stage) {
    if (turkey.hiding && turkey.hideCover) {
      const p = projectToScreen(camera, turkey.hideCover.x, 2.2, turkey.hideCover.z);
      if (p && p.y > minBadgeY) drawWorldBadge(ctx, p.x, p.y, 'HIDDEN! (RELEASE TO AMBUSH)', '#2e8b38', '#ffffff', '#b8ff94');
    } else if (state.mode === 'playing') {
      for (const c of stage.covers) {
        if (Math.hypot(turkey.x - c.x, turkey.z - c.z) < 3.4) {
          const p = projectToScreen(camera, c.x, 2.1, c.z);
          if (p && p.y > minBadgeY) drawWorldBadge(ctx, p.x, p.y, '[E] HIDE IN COVER', 'rgba(36, 14, 6, 0.88)', '#ffe8a3', PALETTE.gold);
          break;
        }
      }
    }

    // Roaring 450°F Oven badges
    for (const oven of stage.ovens) {
      if (Math.abs(oven.z - turkey.z) > 26) continue;
      if (oven.state === 'blast' || oven.state === 'telegraph') {
        const p = projectToScreen(camera, oven.x, 3.05, oven.z);
        if (p && p.x > 60 && p.x < maxBadgeX && p.y > minBadgeY - 30) {
          drawWorldBadge(
            ctx,
            p.x,
            Math.max(minBadgeY, p.y),
            oven.state === 'blast' ? '450°F OVEN FIRE!' : '450°F HEATING!',
            oven.state === 'blast' ? '#de2612' : '#eb781b',
            '#fff8dc',
            '#ffd85c',
          );
        }
      }
    }

    // Exit / Freedom Gate beacon label when within view
    if (stage.exitZ - turkey.z < 36) {
      const gp = projectToScreen(camera, 0, 5.3, stage.exitZ);
      if (gp && gp.y > 95) {
        const labels = ['TO TIMBER BARN →', 'TO ROASTING KITCHEN →', 'TO GRAND BANQUET →', '★ FREEDOM EXIT! ★'];
        drawWorldBadge(ctx, gp.x, gp.y, labels[stage.index] || 'EXIT', '#2e8b38', '#fffbe6', '#ffd85c');
      }
    }
  }

  // Floating 3D Score & Close-Shave Callouts
  for (const c of effects.callouts) {
    const p = projectToScreen(camera, c.x, c.y, c.z);
    if (!p) continue;
    const alpha = Math.min(1, (c.life / c.maxLife) * 1.65);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.scale(c.scale, c.scale);
    ctx.font = '900 25px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 7;
    ctx.strokeStyle = PALETTE.ink;
    ctx.strokeText(c.text, 0, 0);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, 0, 0);
    ctx.restore();
  }
}

export function renderHudOverlay(ctx, state) {
  const { turkey, farmer, stage, score, combo, distanceMeters, totalEscapeMeters, audio, perks } = state;

  // --- TOP-LEFT: SCORE, COMBO & FEATHER LIVES ---
  drawCarvedPanel(ctx, 18, 12, 306, 88);
  ctx.fillStyle = '#f7ce74';
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 34, 34);

  ctx.fillStyle = PALETTE.cream;
  ctx.font = '900 34px "Trebuchet MS", sans-serif';
  ctx.fillText(String(Math.floor(score)).padStart(5, '0'), 34, 70);

  if (combo > 1) {
    const pillG = ctx.createLinearGradient(142, 20, 142, 44);
    pillG.addColorStop(0, '#ff8833');
    pillG.addColorStop(1, '#cf2a1b');
    ctx.fillStyle = pillG;
    ctx.strokeStyle = '#ffe599';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(142, 20, 74, 24, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fffbe8';
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`x${combo} HOT!`, 179, 36);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f7ce74';
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.fillText('LIVES', 228, 34);
  for (let i = 0; i < Math.min(4, turkey.maxLives); i++) {
    drawSculptedFeather(ctx, 238 + i * 22, 64, i < turkey.lives);
  }

  // --- TOP-CENTER: 4-STAGE PROGRESS & DISTANCE RAIL ---
  const mapW = 484;
  const mapX = (VIEWPORT.width - mapW) * 0.5;
  drawCarvedPanel(ctx, mapX, 12, mapW, 88);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe89e';
  ctx.font = '900 15px "Trebuchet MS", sans-serif';
  const stageHeader = state.endless
    ? `ENDLESS 3D · STAGE ${stage.index + 1}: ${stage.name.toUpperCase()} · ${Math.floor(distanceMeters)}m`
    : `STAGE ${stage.index + 1}/4: ${stage.name.toUpperCase()} · ${Math.floor(distanceMeters)}m / ${totalEscapeMeters}m`;
  ctx.fillText(stageHeader, VIEWPORT.width * 0.5, 36);

  const railX = mapX + 30;
  const railW = mapW - 60;
  const railY = 58;
  ctx.fillStyle = '#1f0d06';
  ctx.strokeStyle = 'rgba(245, 184, 61, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(railX, railY - 6, railW, 12, 6); ctx.fill(); ctx.stroke();

  const stageFrac = Math.max(0, Math.min(1, turkey.z / stage.exitZ));
  const totalFrac = state.endless ? stageFrac : (stage.index + stageFrac) / STAGE_DEFS.length;
  const fillG = ctx.createLinearGradient(railX, railY, railX + railW, railY);
  fillG.addColorStop(0, '#eb7b22');
  fillG.addColorStop(1, '#ffe066');
  ctx.fillStyle = fillG;
  ctx.beginPath(); ctx.roundRect(railX + 1, railY - 5, Math.max(8, (railW - 2) * totalFrac), 10, 5); ctx.fill();

  ctx.font = '800 10px "Trebuchet MS", sans-serif';
  const labels = ['FARMYARD', 'BARN', 'KITCHEN', 'BANQUET', 'FREEDOM'];
  for (let i = 0; i < labels.length; i++) {
    const tx = railX + (railW * i) / 4;
    ctx.fillStyle = i <= stage.index ? '#ffe69e' : 'rgba(245, 225, 184, 0.52)';
    ctx.fillText(labels[i], tx, railY + 25);
  }

  const farmerFrac = state.endless
    ? Math.max(0, Math.min(1, farmer.z / stage.exitZ))
    : Math.max(0, Math.min(1, (stage.index + farmer.z / stage.exitZ) / STAGE_DEFS.length));
  drawTrackPin(ctx, railX + railW * farmerFrac, railY, '#d92818', 'J');
  drawTrackPin(ctx, railX + railW * totalFrac, railY, '#f7b831', 'T');

  // --- TOP-RIGHT: STAMINA, ACTIVE PERKS & VECTOR BUTTONS ---
  drawCarvedPanel(ctx, VIEWPORT.width - 334, 12, 316, 88);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f7ce74';
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  const perkCount = perks.size;
  ctx.fillText(perkCount > 0 ? `FLUTTER & DASH · ${perkCount} PERK${perkCount > 1 ? 'S' : ''}` : 'FLUTTER & DASH', VIEWPORT.width - 318, 34);

  const barX = VIEWPORT.width - 318;
  const barY = 44;
  const barW = 192;
  ctx.fillStyle = '#1f0d06';
  ctx.strokeStyle = 'rgba(245, 184, 61, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, 18, 9); ctx.fill(); ctx.stroke();

  const stamFrac = turkey.stamina / turkey.maxStamina;
  const stamG = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  stamG.addColorStop(0, '#f28b24');
  stamG.addColorStop(1, '#ffe87c');
  ctx.fillStyle = stamG;
  ctx.beginPath(); ctx.roundRect(barX + 2, barY + 2, Math.max(0, (barW - 4) * stamFrac), 14, 7); ctx.fill();

  ctx.fillStyle = '#f5e1b8';
  ctx.font = '800 10.5px "Trebuchet MS", sans-serif';
  ctx.fillText('WASD Move · SPACE Flutter · SHIFT Dash · E Hide · F Kick', VIEWPORT.width - 318, 84);

  const hudBtns = getHudButtons();
  drawSpeakerIconButton(ctx, hudBtns[0], audio.muted);
  drawPauseIconButton(ctx, hudBtns[1]);

  // Stage transition ribbon
  if (state.stageBannerTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.stageBannerTimer * 1.4);
    const bw = 640;
    const bx = (VIEWPORT.width - bw) * 0.5;
    drawCarvedPanel(ctx, bx, 120, bw, 84);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '900 27px "Trebuchet MS", sans-serif';
    ctx.fillText(`STAGE ${stage.index + 1}: ${stage.name.toUpperCase()}`, VIEWPORT.width * 0.5, 156);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = '700 15px "Trebuchet MS", sans-serif';
    ctx.fillText(stage.subtitle, VIEWPORT.width * 0.5, 186);
    ctx.restore();
  }
}

export function renderTitleScreen(ctx, state, pointer, time) {
  const cx = VIEWPORT.width * 0.5;

  // Compact top atmospheric gradient leaving the 3D Pixar diorama wide open below!
  const topShade = ctx.createLinearGradient(0, 0, 0, 290);
  topShade.addColorStop(0, 'rgba(20, 7, 3, 0.72)');
  topShade.addColorStop(0.7, 'rgba(20, 7, 3, 0.22)');
  topShade.addColorStop(1, 'rgba(20, 7, 3, 0)');
  ctx.fillStyle = topShade;
  ctx.fillRect(0, 0, VIEWPORT.width, 290);

  const crestW = 760;
  const crestX = cx - crestW * 0.5;
  drawCarvedPanel(ctx, crestX, 16, crestW, 174, 22);
  drawCornerMapleLeaf(ctx, crestX + 28, 42, -0.4);
  drawCornerMapleLeaf(ctx, crestX + crestW - 28, 42, 0.4);

  // Tagline ribbon
  const ribG = ctx.createLinearGradient(0, 30, 0, 56);
  ribG.addColorStop(0, '#e33b24');
  ribG.addColorStop(1, '#9c1c12');
  ctx.fillStyle = ribG;
  ctx.strokeStyle = '#ffd573';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(cx - 196, 30, 392, 26, 13); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff7e0';
  ctx.font = '900 12.5px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE GREAT 3D THANKSGIVING ESCAPE', cx, 48);

  // Hero Carved-Gold Title
  const bob = Math.sin(time * 3) * 2;
  ctx.font = '900 78px "Trebuchet MS", Impact, sans-serif';
  ctx.lineWidth = 13;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText('GOBBLE BREAK', cx, 126 + bob);

  const titleG = ctx.createLinearGradient(0, 62, 0, 136);
  titleG.addColorStop(0, '#fff9d6');
  titleG.addColorStop(0.45, '#ffca45');
  titleG.addColorStop(1, '#cf4514');
  ctx.fillStyle = titleG;
  ctx.fillText('GOBBLE BREAK', cx, 126 + bob);

  ctx.fillStyle = '#fae8c4';
  ctx.font = '700 15px "Trebuchet MS", sans-serif';
  ctx.fillText('Outrun Farmer Jeb  ·  Dodge 450°F Ovens & Carving Knives  ·  Unlock Escape Perks!', cx, 156);

  ctx.fillStyle = '#ffd978';
  ctx.font = '800 13px "Trebuchet MS", sans-serif';
  ctx.fillText(`BEST SCORE: ${state.bestScore}   ·   PRESS SPACE OR CLICK TO START`, cx, 178);

  for (const btn of getOverlayButtons('title')) {
    drawMenuButton(ctx, btn, hitTestButtons([btn], pointer.x, pointer.y) !== null, time);
  }

  // Bottom sleek carved control bar
  drawCarvedPanel(ctx, cx - 472, VIEWPORT.height - 50, 944, 36, 18);
  ctx.fillStyle = '#ffecc2';
  ctx.font = '800 13.5px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / Arrows 3D Run  ·  SPACE Jump & Flutter  ·  SHIFT / Click Dash  ·  E Hide in Cover  ·  F / Right-Click Kick Prop & Gobble', cx, VIEWPORT.height - 27);
}

export function renderPerkDraftOverlay(ctx, state, pointer, time) {
  ctx.fillStyle = 'rgba(18, 7, 3, 0.68)';
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  const cx = VIEWPORT.width * 0.5;
  drawCarvedPanel(ctx, cx - 340, 118, 680, 108, 20);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '900 36px "Trebuchet MS", sans-serif';
  ctx.fillText(`ZONE CLEARED! PICK AN ESCAPE PERK`, cx, 168);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.fillText('Click a card or press [1]  [2]  [3] to power up Barnaby for the next stage!', cx, 202);

  const cards = getOverlayButtons('perk_draft', state.perkChoices);
  for (const card of cards) {
    const hovered = hitTestButtons([card], pointer.x, pointer.y) !== null;
    ctx.save();
    ctx.translate(0, hovered ? -5 : 0);
    drawCarvedPanel(ctx, card.x, card.y, card.w, card.h, 18);

    ctx.fillStyle = card.perk.color;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(card.x + 24, card.y + 22, card.w - 48, 36, 18); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#240e06';
    ctx.font = '900 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[${card.index + 1}] ${card.perk.short}`, card.x + card.w * 0.5, card.y + 45);

    ctx.fillStyle = '#fff6dc';
    ctx.font = '900 24px "Trebuchet MS", sans-serif';
    ctx.fillText(card.perk.name, card.x + card.w * 0.5, card.y + 104);

    ctx.fillStyle = '#f2d5a0';
    ctx.font = '700 15px "Trebuchet MS", sans-serif';
    wrapText(ctx, card.perk.desc, card.x + card.w * 0.5, card.y + 142, card.w - 44, 22);

    ctx.fillStyle = PALETTE.gold;
    ctx.font = '900 14px "Trebuchet MS", sans-serif';
    ctx.fillText('CLICK TO EQUIP →', card.x + card.w * 0.5, card.y + card.h - 24);
    ctx.restore();
  }
  void time;
}

export function renderPauseScreen(ctx, pointer, time) {
  ctx.fillStyle = 'rgba(18, 7, 3, 0.65)';
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  const cx = VIEWPORT.width * 0.5;
  drawCarvedPanel(ctx, cx - 204, 204, 408, 352, 22);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe599';
  ctx.font = '900 44px "Trebuchet MS", sans-serif';
  ctx.fillText('PAUSED', cx, 278);
  ctx.fillStyle = '#f5e1b8';
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.fillText('Catch your breath, Barnaby!', cx, 312);

  for (const btn of getOverlayButtons('paused')) {
    drawMenuButton(ctx, btn, hitTestButtons([btn], pointer.x, pointer.y) !== null, time);
  }
}

export function renderEndScreen(ctx, state, parchmentPattern, pointer, time) {
  const isWin = state.mode === 'escaped';

  // Subtle right-side gradient keeping the LEFT 50% 3D Podium Scene completely crisp & bright!
  const shade = ctx.createLinearGradient(440, 0, VIEWPORT.width, 0);
  shade.addColorStop(0, 'rgba(20, 8, 4, 0)');
  shade.addColorStop(0.35, 'rgba(20, 8, 4, 0.55)');
  shade.addColorStop(1, 'rgba(20, 8, 4, 0.78)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  const cardW = 584;
  const cardH = 492;
  const cardX = 626;
  const cardY = 132;
  const cardCx = cardX + cardW * 0.5;

  ctx.save();
  ctx.shadowColor = 'rgba(10, 3, 1, 0.72)';
  ctx.shadowBlur = 28;
  ctx.fillStyle = '#3a190c';
  ctx.strokeStyle = isWin ? '#ffd85c' : '#ff5a36';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 24); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  ctx.fillStyle = parchmentPattern;
  ctx.beginPath(); ctx.roundRect(cardX + 13, cardY + 13, cardW - 26, cardH - 26, 16); ctx.fill();
  ctx.strokeStyle = '#a87032';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Embossed Header Ribbon
  const headG = ctx.createLinearGradient(0, cardY - 28, 0, cardY + 44);
  if (isWin) {
    headG.addColorStop(0, '#3ca342');
    headG.addColorStop(1, '#1e6623');
  } else {
    headG.addColorStop(0, '#de3621');
    headG.addColorStop(1, '#8f180e');
  }
  ctx.fillStyle = headG;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.roundRect(cardCx - 268, cardY - 28, 536, 72, 18); ctx.fill(); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '900 41px "Trebuchet MS", Impact, sans-serif';
  ctx.lineWidth = 7;
  ctx.strokeStyle = PALETTE.ink;
  const headline = isWin ? 'ESCAPED TO FREEDOM!' : 'CAUGHT FOR DINNER!';
  ctx.strokeText(headline, cardCx, cardY + 21);
  ctx.fillStyle = '#fff7db';
  ctx.fillText(headline, cardCx, cardY + 21);

  ctx.fillStyle = '#522510';
  ctx.font = '800 16px "Trebuchet MS", sans-serif';
  const flavor = isWin
    ? 'Barnaby smashed out the Banquet Gate — Thanksgiving is saved!'
    : state.caughtReason || 'Farmer Jeb rang the dinner bell — run again & outsmart him!';
  ctx.fillText(flavor, cardCx, cardY + 82);

  // Rank Medal Seal
  const rank = state.score >= 5400 ? 'S+' : state.score >= 4200 ? 'S' : state.score >= 2800 ? 'A' : 'B';
  ctx.save();
  ctx.translate(cardX + 86, cardY + 206);
  ctx.rotate(-0.08);
  ctx.fillStyle = isWin ? '#f5b83d' : '#cf2d1e';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 52, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a1d08';
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.fillText(isWin ? 'RANK' : 'BELL', 0, -21);
  ctx.fillStyle = '#fff9e6';
  ctx.lineWidth = 5;
  ctx.font = '900 42px "Trebuchet MS", sans-serif';
  const badgeTxt = isWin ? rank : '!';
  ctx.strokeText(badgeTxt, 0, 20);
  ctx.fillText(badgeTxt, 0, 20);
  ctx.restore();

  // 2x2 Stats Grid
  const stats = [
    { label: 'FINAL SCORE', value: String(Math.floor(state.score)) },
    { label: 'BEST SCORE', value: String(Math.floor(state.bestScore)) },
    { label: 'DISTANCE RUN', value: `${Math.floor(state.distanceMeters)}m` },
    { label: 'CLOSE SHAVES', value: `${state.closeShaves} · ${state.stuns} STUNS` },
  ];
  stats.forEach((st, i) => {
    const sx = cardX + 158 + (i % 2) * 204;
    const sy = cardY + 118 + Math.floor(i / 2) * 82;
    ctx.fillStyle = '#e8cf9e';
    ctx.strokeStyle = '#9c6830';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(sx, sy, 192, 68, 12); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6e3818';
    ctx.font = '800 11.5px "Trebuchet MS", sans-serif';
    ctx.fillText(st.label, sx + 14, sy + 22);
    ctx.fillStyle = '#240e06';
    ctx.font = '900 24px "Trebuchet MS", sans-serif';
    ctx.fillText(st.value, sx + 14, sy + 52);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#633014';
  ctx.font = '800 14.5px "Trebuchet MS", sans-serif';
  ctx.fillText(
    `STAGE ${state.stage.index + 1}/4 (${state.stage.shortName})  ·  PERKS: ${state.perks.size}  ·  TIME: ${state.elapsedTime.toFixed(1)}s`,
    cardCx,
    cardY + 322,
  );
  ctx.restore();

  for (const btn of getOverlayButtons(state.mode)) {
    drawMenuButton(ctx, btn, hitTestButtons([btn], pointer.x, pointer.y) !== null, time);
  }
}

function drawWorldBadge(ctx, x, y, text, bg, fg, border) {
  ctx.save();
  ctx.font = '900 13px "Trebuchet MS", "Segoe UI", sans-serif';
  const w = Math.max(72, ctx.measureText(text).width + 24);
  const h = 26;
  ctx.shadowColor = 'rgba(16, 6, 2, 0.55)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(x - w * 0.5, y - h * 0.5, w, h, 13);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

function drawCarvedPanel(ctx, x, y, w, h, radius = 15) {
  ctx.save();
  ctx.shadowColor = 'rgba(14, 5, 2, 0.56)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, 'rgba(66, 28, 12, 0.93)');
  g.addColorStop(1, 'rgba(32, 13, 6, 0.94)');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#e5a63e';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 228, 162, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x + 5, y + 5, w - 10, h - 10, Math.max(4, radius - 4)); ctx.stroke();
  ctx.restore();
}

function drawCornerMapleLeaf(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#ff9d2e';
  ctx.strokeStyle = '#fff0ba';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(4, -7); ctx.lineTo(13, -9); ctx.lineTo(8, -1);
  ctx.lineTo(13, 5); ctx.lineTo(4, 6); ctx.lineTo(2, 13);
  ctx.lineTo(-2, 13); ctx.lineTo(-4, 6); ctx.lineTo(-13, 5);
  ctx.lineTo(-8, -1); ctx.lineTo(-13, -9); ctx.lineTo(-4, -7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSculptedFeather(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.34);
  if (filled) {
    const fG = ctx.createLinearGradient(0, -15, 0, 15);
    fG.addColorStop(0, '#fff2c2');
    fG.addColorStop(0.35, '#f7b731');
    fG.addColorStop(1, '#c94318');
    ctx.fillStyle = fG;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 7.2, 15.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(255, 235, 200, 0.10)';
    ctx.strokeStyle = 'rgba(255, 225, 175, 0.32)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawTrackPin(ctx, x, y, color, letter) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff8e0';
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(x, y, 10.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, x, y + 1);
  ctx.restore();
}

function drawSpeakerIconButton(ctx, btn, muted) {
  ctx.save();
  ctx.fillStyle = '#5c2a12';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10); ctx.fill(); ctx.stroke();
  const cx = btn.x + btn.w * 0.5;
  const cy = btn.y + btn.h * 0.5;
  ctx.fillStyle = '#fff5db';
  ctx.strokeStyle = '#fff5db';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 4); ctx.lineTo(cx - 4, cy - 4); ctx.lineTo(cx + 2, cy - 10);
  ctx.lineTo(cx + 2, cy + 10); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx - 10, cy + 4);
  ctx.closePath();
  ctx.fill();
  if (muted) {
    ctx.strokeStyle = '#ff6b4a';
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 5); ctx.lineTo(cx + 13, cy + 5);
    ctx.moveTo(cx + 13, cy - 5); ctx.lineTo(cx + 6, cy + 5);
    ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(cx + 4, cy, 5, -0.7, 0.7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 4, cy, 9, -0.7, 0.7); ctx.stroke();
  }
  ctx.restore();
}

function drawPauseIconButton(ctx, btn) {
  ctx.save();
  ctx.fillStyle = '#5c2a12';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10); ctx.fill(); ctx.stroke();
  const cx = btn.x + btn.w * 0.5;
  const cy = btn.y + btn.h * 0.5;
  ctx.fillStyle = '#fff5db';
  ctx.beginPath();
  ctx.roundRect(cx - 7, cy - 9, 5, 18, 2);
  ctx.roundRect(cx + 2, cy - 9, 5, 18, 2);
  ctx.fill();
  ctx.restore();
}

function drawMenuButton(ctx, btn, hovered, time) {
  ctx.save();
  const lift = hovered ? -3 : 0;
  const pulse = btn.primary ? 1 + Math.sin(time * 5) * 0.015 : 1;
  ctx.translate(btn.x + btn.w * 0.5, btn.y + btn.h * 0.5 + lift);
  ctx.scale(pulse, pulse);

  ctx.shadowColor = 'rgba(14, 5, 2, 0.6)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  const grad = ctx.createLinearGradient(0, -btn.h * 0.5, 0, btn.h * 0.5);
  if (btn.primary) {
    grad.addColorStop(0, hovered ? '#ffea80' : '#ffcf4d');
    grad.addColorStop(0.55, hovered ? '#f29024' : '#e07219');
    grad.addColorStop(1, hovered ? '#cf5b10' : '#b3430e');
  } else {
    grad.addColorStop(0, hovered ? '#8f4a24' : '#6e3417');
    grad.addColorStop(1, hovered ? '#54230c' : '#3d1909');
  }

  ctx.fillStyle = grad;
  ctx.strokeStyle = btn.primary ? '#fff7d6' : '#e0a23d';
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.roundRect(-btn.w * 0.5, -btn.h * 0.5, btn.w, btn.h, 15); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();

  ctx.fillStyle = btn.primary ? 'rgba(255, 252, 232, 0.34)' : 'rgba(255, 230, 175, 0.14)';
  ctx.beginPath(); ctx.roundRect(-btn.w * 0.5 + 8, -btn.h * 0.5 + 5, btn.w - 16, 11, 6); ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = btn.primary ? '#290f05' : '#fff4d6';
  ctx.font = '900 21px "Trebuchet MS", sans-serif';
  ctx.fillText(btn.label, 0, btn.sub ? -2 : 7);

  if (btn.sub) {
    ctx.fillStyle = btn.primary ? '#4f2008' : '#f7ce7a';
    ctx.font = '800 10.5px "Trebuchet MS", sans-serif';
    ctx.fillText(btn.sub, 0, 17);
  }
  ctx.restore();
}

function wrapText(ctx, text, cx, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, y);
      line = w;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, y);
}
