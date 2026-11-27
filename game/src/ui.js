// Carved-oak & hammered-brass storybook HUD, Title Crest, Pause Menu, and Caught/Escaped End Screens.

import { PALETTE, PHYSICS, STAGE_DEFS, VIEWPORT } from './config.js';

export function getOverlayButtons(mode) {
  const cx = VIEWPORT.width * 0.5;
  if (mode === 'title') {
    return [
      { id: 'play_story', label: 'PLAY ESCAPE', sub: '4 STAGES · FARMYARD TO FREEDOM', x: cx - 242, y: 274, w: 232, h: 68, primary: true },
      { id: 'play_endless', label: 'ENDLESS FEAST', sub: 'INFINITE HIGH-SCORE RUN', x: cx + 10, y: 274, w: 232, h: 68, primary: false },
    ];
  }
  if (mode === 'paused') {
    return [
      { id: 'resume', label: 'RESUME RUN', sub: 'SPACE / P', x: cx - 122, y: 344, w: 244, h: 60, primary: true },
      { id: 'restart', label: 'RESTART', sub: 'R', x: cx - 122, y: 418, w: 244, h: 52, primary: false },
      { id: 'title', label: 'TITLE MENU', sub: '', x: cx - 122, y: 482, w: 244, h: 48, primary: false },
    ];
  }
  if (mode === 'caught' || mode === 'escaped') {
    return [
      { id: 'restart', label: 'PLAY AGAIN', sub: 'SPACE / R', x: cx - 226, y: 504, w: 218, h: 66, primary: true },
      { id: 'title', label: 'TITLE MENU', sub: 'CHANGE MODE', x: cx + 10, y: 504, w: 216, h: 66, primary: false },
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
  for (const btn of buttons) {
    if (px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h) {
      return btn;
    }
  }
  return null;
}

export function renderHud(ctx, state, patterns) {
  const { turkey, farmer, stage, score, combo, distanceMeters, totalEscapeMeters, audio } = state;

  // --- TOP-LEFT: SCORE, COMBO & SCULPTED FEATHER LIVES ---
  drawCarvedPanel(ctx, 18, 12, 304, 88);
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
    ctx.beginPath();
    ctx.roundRect(142, 20, 72, 24, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fffbe8';
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`x${combo} HOT!`, 178, 36);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f7ce74';
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.fillText('LIVES', 228, 34);
  for (let i = 0; i < turkey.maxLives; i++) {
    drawSculptedFeatherLife(ctx, 240 + i * 27, 64, i < turkey.lives);
  }

  // --- TOP-CENTER: ESCAPE DISTANCE & 4-STAGE PROGRESS MAP ---
  const mapW = 482;
  const mapX = (VIEWPORT.width - mapW) * 0.5;
  drawCarvedPanel(ctx, mapX, 12, mapW, 88);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe89e';
  ctx.font = '900 16px "Trebuchet MS", sans-serif';
  const stageHeader = state.endless
    ? `ENDLESS · STAGE ${stage.index + 1}: ${stage.name.toUpperCase()} · ${Math.floor(distanceMeters)}m`
    : `STAGE ${stage.index + 1}/4: ${stage.name.toUpperCase()} · ${Math.floor(distanceMeters)}m / ${totalEscapeMeters}m`;
  ctx.fillText(stageHeader, VIEWPORT.width * 0.5, 36);

  const railX = mapX + 30;
  const railW = mapW - 60;
  const railY = 58;
  ctx.fillStyle = '#1f0d06';
  ctx.strokeStyle = 'rgba(245, 184, 61, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(railX, railY - 6, railW, 12, 6);
  ctx.fill();
  ctx.stroke();

  const stageFrac = Math.max(0, Math.min(1, turkey.x / stage.exitX));
  const totalFrac = state.endless ? stageFrac : (stage.index + stageFrac) / STAGE_DEFS.length;
  const fillG = ctx.createLinearGradient(railX, railY, railX + railW, railY);
  fillG.addColorStop(0, '#e87a24');
  fillG.addColorStop(1, '#ffe066');
  ctx.fillStyle = fillG;
  ctx.beginPath();
  ctx.roundRect(railX + 1, railY - 5, Math.max(8, (railW - 2) * totalFrac), 10, 5);
  ctx.fill();

  ctx.font = '800 10px "Trebuchet MS", sans-serif';
  const labels = ['FARMYARD', 'BARN', 'KITCHEN', 'BANQUET', 'FREEDOM'];
  for (let i = 0; i < labels.length; i++) {
    const tx = railX + (railW * i) / 4;
    ctx.fillStyle = i <= stage.index ? '#ffe69e' : 'rgba(245, 225, 184, 0.52)';
    ctx.fillText(labels[i], tx, railY + 25);
  }

  const farmerFrac = state.endless
    ? Math.max(0, Math.min(1, farmer.x / stage.exitX))
    : Math.max(0, Math.min(1, (stage.index + farmer.x / stage.exitX) / STAGE_DEFS.length));
  drawTrackPin(ctx, railX + railW * farmerFrac, railY, '#d92818', 'J');
  drawTrackPin(ctx, railX + railW * totalFrac, railY, '#f7b831', 'T');

  // --- TOP-RIGHT: FLUTTER & DASH STAMINA + VECTOR CONTROLS ---
  drawCarvedPanel(ctx, VIEWPORT.width - 334, 12, 316, 88);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f7ce74';
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.fillText('FLUTTER & DASH', VIEWPORT.width - 318, 34);

  const barX = VIEWPORT.width - 318;
  const barY = 44;
  const barW = 192;
  ctx.fillStyle = '#1f0d06';
  ctx.strokeStyle = 'rgba(245, 184, 61, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 18, 9);
  ctx.fill();
  ctx.stroke();

  const stamFrac = turkey.stamina / PHYSICS.staminaMax;
  const stamG = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  stamG.addColorStop(0, '#f28b24');
  stamG.addColorStop(1, '#ffe87c');
  ctx.fillStyle = stamG;
  ctx.beginPath();
  ctx.roundRect(barX + 2, barY + 2, Math.max(0, (barW - 4) * stamFrac), 14, 7);
  ctx.fill();

  ctx.fillStyle = '#f5e1b8';
  ctx.font = '800 11px "Trebuchet MS", sans-serif';
  ctx.fillText('SPACE Flutter · SHIFT Dash · S Hide · F Kick', VIEWPORT.width - 318, 84);

  const hudBtns = getHudButtons();
  drawSpeakerIconButton(ctx, hudBtns[0], audio.muted);
  drawPauseIconButton(ctx, hudBtns[1]);

  // Proximity alert badge when Farmer Jeb is dangerously close
  const gap = turkey.x - farmer.x;
  if (gap > 0 && gap < 190 && farmer.state !== 'stunned' && farmer.state !== 'blind') {
    const warnAlpha = Math.max(0.8, Math.min(0.98, (190 - gap) / 100 + 0.55));
    ctx.save();
    ctx.globalAlpha = warnAlpha;
    ctx.fillStyle = '#c92316';
    ctx.strokeStyle = '#ffe599';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(18, 110, 248, 30, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff9e6';
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(farmer.outfit === 'chef' ? '! CHEF JEB RIGHT BEHIND YOU !' : '! FARMER JEB CLOSING IN !', 142, 130);
    ctx.restore();
  }

  // Stage transition ribbon
  if (state.stageBannerTimer > 0) {
    const alpha = Math.min(1, state.stageBannerTimer * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    const bw = 640;
    const bx = (VIEWPORT.width - bw) * 0.5;
    drawCarvedPanel(ctx, bx, 126, bw, 86);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '900 28px "Trebuchet MS", sans-serif';
    ctx.fillText(`STAGE ${stage.index + 1}: ${stage.name.toUpperCase()}`, VIEWPORT.width * 0.5, 163);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = '700 15px "Trebuchet MS", sans-serif';
    ctx.fillText(stage.subtitle, VIEWPORT.width * 0.5, 193);
    ctx.restore();
  }
  void patterns;
}

export function renderTitleOverlay(ctx, state, patterns, pointer, time) {
  const cx = VIEWPORT.width * 0.5;
  const topShade = ctx.createLinearGradient(0, 0, 0, 390);
  topShade.addColorStop(0, 'rgba(24, 9, 4, 0.72)');
  topShade.addColorStop(0.75, 'rgba(24, 9, 4, 0.30)');
  topShade.addColorStop(1, 'rgba(24, 9, 4, 0)');
  ctx.fillStyle = topShade;
  ctx.fillRect(0, 0, VIEWPORT.width, 390);

  // Sculpted Oak & Hammered-Gold Title Crest with autumn maple corner ornaments!
  const crestW = 776;
  const crestX = cx - crestW * 0.5;
  ctx.save();
  drawCarvedPanel(ctx, crestX, 24, crestW, 224, 24);

  // Decorative autumn maple leaves flanking the crest corners
  drawCornerMapleOrnament(ctx, crestX + 28, 52, -0.45);
  drawCornerMapleOrnament(ctx, crestX + crestW - 28, 52, 0.45);

  // Embossed Crimson Ribbon Subtitle
  const ribG = ctx.createLinearGradient(0, 44, 0, 74);
  ribG.addColorStop(0, '#e33b24');
  ribG.addColorStop(1, '#9c1c12');
  ctx.fillStyle = ribG;
  ctx.strokeStyle = '#ffd573';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(cx - 190, 44, 380, 30, 15);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff7e0';
  ctx.font = '900 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE GREAT THANKSGIVING ESCAPE', cx, 64);

  // Hero Carved-Gold Title Typography with warm shadow glow
  const bob = Math.sin(time * 3) * 2.5;
  ctx.font = '900 88px "Trebuchet MS", Impact, sans-serif';
  ctx.shadowColor = 'rgba(255, 136, 28, 0.45)';
  ctx.shadowBlur = 18;
  ctx.lineWidth = 14;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText('GOBBLE BREAK', cx, 155 + bob);
  ctx.shadowBlur = 0;

  const titleG = ctx.createLinearGradient(0, 82, 0, 168);
  titleG.addColorStop(0, '#fff9d6');
  titleG.addColorStop(0.42, '#ffca45');
  titleG.addColorStop(0.75, '#f07c1d');
  titleG.addColorStop(1, '#c93a12');
  ctx.fillStyle = titleG;
  ctx.fillText('GOBBLE BREAK', cx, 155 + bob);

  // Crisp subtitle & Best Score cue
  ctx.fillStyle = '#fae8c4';
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.fillText('Outrun Farmer Jeb  ·  Dodge 450°F Ovens & Carving Knives  ·  Escape Thanksgiving!', cx, 198);

  ctx.fillStyle = '#ffd978';
  ctx.font = '800 14px "Trebuchet MS", sans-serif';
  ctx.fillText(`BEST SCORE: ${state.bestScore}   ·   PRESS SPACE OR CLICK TO RUN`, cx, 228);
  ctx.restore();

  // Interactive Mode Buttons
  for (const btn of getOverlayButtons('title')) {
    drawMenuButton(ctx, btn, hitTestButtons([btn], pointer.x, pointer.y) !== null, time);
  }

  // Bottom sleek carved wood controls bar
  ctx.save();
  drawCarvedPanel(ctx, cx - 468, VIEWPORT.height - 54, 936, 38, 19);
  ctx.fillStyle = '#ffecc2';
  ctx.font = '800 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('A/D or ←/→ Run   ·   SPACE / W Jump & Hold Flutter   ·   SHIFT / Click Dash   ·   S Hide in Cover   ·   F Kick Prop / Gobble', cx, VIEWPORT.height - 30);
  ctx.restore();
  void patterns;
}

export function renderPauseOverlay(ctx, pointer, time) {
  ctx.fillStyle = 'rgba(20, 8, 4, 0.66)';
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  const cx = VIEWPORT.width * 0.5;
  drawCarvedPanel(ctx, cx - 204, 208, 408, 356, 22);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe599';
  ctx.font = '900 44px "Trebuchet MS", sans-serif';
  ctx.fillText('PAUSED', cx, 282);
  ctx.fillStyle = '#f5e1b8';
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.fillText('Catch your breath, Barnaby!', cx, 316);

  for (const btn of getOverlayButtons('paused')) {
    drawMenuButton(ctx, btn, hitTestButtons([btn], pointer.x, pointer.y) !== null, time);
  }
}

export function renderEndOverlay(ctx, state, patterns, pointer, time) {
  const isWin = state.mode === 'escaped';
  const cx = VIEWPORT.width * 0.5;

  ctx.fillStyle = isWin ? 'rgba(30, 15, 5, 0.48)' : 'rgba(32, 8, 5, 0.60)';
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  const cardW = 676;
  const cardH = 470;
  const cardX = cx - cardW * 0.5;
  const cardY = 124;

  ctx.save();
  // Carved mahogany outer frame
  ctx.shadowColor = 'rgba(12, 4, 2, 0.65)';
  ctx.shadowBlur = 28;
  ctx.fillStyle = '#3a190c';
  ctx.strokeStyle = isWin ? '#ffd85c' : '#ff5a36';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  // Warm parchment inner folio
  ctx.fillStyle = patterns.parchment;
  ctx.beginPath();
  ctx.roundRect(cardX + 14, cardY + 14, cardW - 28, cardH - 28, 16);
  ctx.fill();
  ctx.strokeStyle = '#a87032';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Embossed Header Ribbon
  const headG = ctx.createLinearGradient(0, cardY - 30, 0, cardY + 46);
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
  ctx.beginPath();
  ctx.roundRect(cx - 282, cardY - 32, 564, 76, 18);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '900 45px "Trebuchet MS", Impact, sans-serif';
  ctx.lineWidth = 7;
  ctx.strokeStyle = PALETTE.ink;
  const headline = isWin ? 'ESCAPED TO FREEDOM!' : 'CAUGHT FOR DINNER!';
  ctx.strokeText(headline, cx, cardY + 21);
  ctx.fillStyle = '#fff7db';
  ctx.fillText(headline, cx, cardY + 21);

  ctx.fillStyle = '#522510';
  ctx.font = '800 18px "Trebuchet MS", sans-serif';
  const flavor = isWin
    ? 'Barnaby flew out the Banquet Window — Thanksgiving is vegan tonight!'
    : state.caughtReason || 'Farmer Jeb rang the dinner bell — run again and outsmart him!';
  ctx.fillText(flavor, cx, cardY + 86);

  // Bespoke Golden Seal / Silver Dinner Bell Medal
  const rank = computeGrade(state);
  ctx.save();
  ctx.translate(cardX + 102, cardY + 206);
  ctx.rotate(-0.08);
  const sealG = ctx.createRadialGradient(-14, -18, 6, 0, 0, 62);
  if (isWin) {
    sealG.addColorStop(0, '#fff099');
    sealG.addColorStop(0.55, '#f2ad2e');
    sealG.addColorStop(1, '#b86812');
  } else {
    sealG.addColorStop(0, '#ff6a4d');
    sealG.addColorStop(0.6, '#c92a1c');
    sealG.addColorStop(1, '#75130b');
  }
  ctx.fillStyle = sealG;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 248, 214, 0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 49, 0, Math.PI * 2); ctx.stroke();

  if (isWin) {
    ctx.fillStyle = '#4a1d08';
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.fillText('RANK', 0, -23);
    ctx.fillStyle = '#fff9e6';
    ctx.lineWidth = 5;
    ctx.strokeStyle = PALETTE.ink;
    ctx.font = '900 48px "Trebuchet MS", sans-serif';
    ctx.strokeText(rank, 0, 23);
    ctx.fillText(rank, 0, 23);
  } else {
    ctx.fillStyle = '#fff5db';
    ctx.font = '900 11px "Trebuchet MS", sans-serif';
    ctx.fillText('DINNER BELL', 0, -24);
    ctx.fillStyle = '#e5edf4';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 14, 24, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath(); ctx.arc(0, -13, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#cdd9e5';
    ctx.beginPath(); ctx.roundRect(-30, 14, 60, 8, 4); ctx.fill(); ctx.stroke();
  }
  ctx.restore();

  // High-contrast 2x2 Stats Plaques
  const stats = [
    { label: 'FINAL SCORE', value: String(Math.floor(state.score)) },
    { label: 'BEST SCORE', value: String(Math.floor(state.bestScore)) },
    { label: 'DISTANCE RUN', value: `${Math.floor(state.distanceMeters)}m` },
    { label: 'CLOSE SHAVES', value: `${state.closeShaves} · ${state.stuns} STUNS` },
  ];
  const gridX = cardX + 186;
  const gridY = cardY + 122;
  stats.forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = gridX + col * 228;
    const sy = gridY + row * 82;
    ctx.fillStyle = '#e8cf9e';
    ctx.strokeStyle = '#9c6830';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.roundRect(sx, sy, 214, 68, 12); ctx.fill(); ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#6e3818';
    ctx.font = '800 12px "Trebuchet MS", sans-serif';
    ctx.fillText(st.label, sx + 15, sy + 22);
    ctx.fillStyle = '#261009';
    ctx.font = '900 25px "Trebuchet MS", sans-serif';
    ctx.fillText(st.value, sx + 15, sy + 53);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#633014';
  ctx.font = '800 15px "Trebuchet MS", sans-serif';
  ctx.fillText(
    `REACHED: STAGE ${state.stage.index + 1}/4 (${state.stage.name.toUpperCase()})   ·   TIME: ${state.elapsedTime.toFixed(1)}s`,
    cx,
    cardY + 324,
  );
  ctx.restore();

  for (const btn of getOverlayButtons(state.mode)) {
    drawMenuButton(ctx, btn, hitTestButtons([btn], pointer.x, pointer.y) !== null, time);
  }
}

function computeGrade(state) {
  if (state.score >= 5200 && state.turkey.lives === state.turkey.maxLives) return 'S+';
  if (state.score >= 4200) return 'S';
  if (state.score >= 3000) return 'A';
  if (state.score >= 2000) return 'B';
  return 'C';
}

function drawCarvedPanel(ctx, x, y, w, h, radius = 15) {
  ctx.save();
  ctx.shadowColor = 'rgba(18, 6, 2, 0.52)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, 'rgba(66, 28, 12, 0.94)');
  g.addColorStop(1, 'rgba(34, 14, 6, 0.94)');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#e5a63e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();

  // Warm inner brass rim line
  ctx.strokeStyle = 'rgba(255, 228, 162, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x + 5, y + 5, w - 10, h - 10, Math.max(4, radius - 4));
  ctx.stroke();
  ctx.restore();
}

function drawCornerMapleOrnament(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(0, -16, 0, 14);
  g.addColorStop(0, '#ffd452');
  g.addColorStop(0.6, '#e86f1c');
  g.addColorStop(1, '#b32818');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#fff0ba';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(4, -7); ctx.lineTo(13, -9); ctx.lineTo(8, -1);
  ctx.lineTo(14, 5); ctx.lineTo(4, 6); ctx.lineTo(2, 14);
  ctx.lineTo(-2, 14); ctx.lineTo(-4, 6); ctx.lineTo(-14, 5);
  ctx.lineTo(-8, -1); ctx.lineTo(-13, -9); ctx.lineTo(-4, -7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSculptedFeatherLife(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.34);
  if (filled) {
    const fG = ctx.createLinearGradient(0, -16, 0, 16);
    fG.addColorStop(0, '#fff2c2');
    fG.addColorStop(0.35, '#f7b731');
    fG.addColorStop(1, '#c94318');
    ctx.fillStyle = fG;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 16.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a62216';
    ctx.beginPath(); ctx.ellipse(0, -7, 5.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 245, 210, 0.7)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, 14); ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(255, 235, 200, 0.10)';
    ctx.strokeStyle = 'rgba(255, 225, 175, 0.32)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 7.5, 15.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
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
    ctx.lineWidth = 2.6;
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

  ctx.shadowColor = 'rgba(18, 6, 2, 0.55)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;

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
  ctx.beginPath();
  ctx.roundRect(-btn.w * 0.5, -btn.h * 0.5, btn.w, btn.h, 15);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();

  // Tactile top gloss highlight strip
  ctx.fillStyle = btn.primary ? 'rgba(255, 252, 232, 0.34)' : 'rgba(255, 230, 175, 0.14)';
  ctx.beginPath();
  ctx.roundRect(-btn.w * 0.5 + 8, -btn.h * 0.5 + 5, btn.w - 16, 12, 6);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = btn.primary ? '#290f05' : '#fff4d6';
  ctx.font = '900 23px "Trebuchet MS", sans-serif';
  ctx.fillText(btn.label, 0, btn.sub ? -2 : 7);

  if (btn.sub) {
    ctx.fillStyle = btn.primary ? '#4f2008' : '#f7ce7a';
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    ctx.fillText(btn.sub, 0, 19);
  }
  ctx.restore();
}
