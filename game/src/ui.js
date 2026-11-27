// Storybook HUD, Title Screen, Stage Banner, Pause Menu, and Caught/Escaped End Overlays.

import { PALETTE, PHYSICS, STAGE_DEFS, VIEWPORT } from './config.js';

export function getOverlayButtons(mode) {
  const cx = VIEWPORT.width * 0.5;
  if (mode === 'title') {
    return [
      { id: 'play_story', label: 'PLAY ESCAPE', sub: '4 STAGES · FARMYARD TO FREEDOM', x: cx - 235, y: 278, w: 224, h: 66, primary: true },
      { id: 'play_endless', label: 'ENDLESS FEAST', sub: 'INFINITE HIGH-SCORE RUN', x: cx + 11, y: 278, w: 224, h: 66, primary: false },
    ];
  }
  if (mode === 'paused') {
    return [
      { id: 'resume', label: 'RESUME RUN', sub: 'SPACE / P', x: cx - 120, y: 345, w: 240, h: 58, primary: true },
      { id: 'restart', label: 'RESTART', sub: 'R', x: cx - 120, y: 418, w: 240, h: 52, primary: false },
      { id: 'title', label: 'TITLE MENU', sub: '', x: cx - 120, y: 482, w: 240, h: 48, primary: false },
    ];
  }
  if (mode === 'caught' || mode === 'escaped') {
    return [
      { id: 'restart', label: 'PLAY AGAIN', sub: 'SPACE / R', x: cx - 220, y: 506, w: 212, h: 64, primary: true },
      { id: 'title', label: 'TITLE MENU', sub: 'CHANGE MODE', x: cx + 12, y: 506, w: 208, h: 64, primary: false },
    ];
  }
  return [];
}

export function getHudButtons() {
  return [
    { id: 'mute', x: VIEWPORT.width - 106, y: 18, w: 42, h: 42 },
    { id: 'pause', x: VIEWPORT.width - 56, y: 18, w: 42, h: 42 },
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

  // --- TOP-LEFT: SCORE, COMBO & FEATHER LIVES ---
  drawWoodPanel(ctx, 18, 14, 296, 86, patterns);
  ctx.fillStyle = '#f5ca72';
  ctx.font = '800 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 34, 36);

  ctx.fillStyle = PALETTE.cream;
  ctx.font = '900 32px "Trebuchet MS", sans-serif';
  ctx.fillText(String(Math.floor(score)).padStart(5, '0'), 34, 67);

  if (combo > 1) {
    ctx.fillStyle = '#ff6b35';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(142, 22, 66, 22, 11);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff9e6';
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`x${combo} HOT!`, 175, 37);
  }

  // Feather Lives (3 large readable icons)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f5ca72';
  ctx.font = '800 12px "Trebuchet MS", sans-serif';
  ctx.fillText('LIVES', 222, 34);
  for (let i = 0; i < turkey.maxLives; i++) {
    drawFeatherIcon(ctx, 234 + i * 26, 62, i < turkey.lives);
  }

  // --- TOP-CENTER: ESCAPE DISTANCE & STAGE PROGRESS MAP ---
  const mapW = 474;
  const mapX = (VIEWPORT.width - mapW) * 0.5;
  drawWoodPanel(ctx, mapX, 14, mapW, 86, patterns);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe599';
  ctx.font = '900 16px "Trebuchet MS", sans-serif';
  const stageHeader = state.endless
    ? `ENDLESS · STAGE ${stage.index + 1}: ${stage.name.toUpperCase()} · ${Math.floor(distanceMeters)}m`
    : `STAGE ${stage.index + 1}/4: ${stage.name.toUpperCase()} · ${Math.floor(distanceMeters)}m / ${totalEscapeMeters}m`;
  ctx.fillText(stageHeader, VIEWPORT.width * 0.5, 37);

  // Progress rail showing Farmyard -> Barn -> Kitchen -> Freedom
  const railX = mapX + 28;
  const railW = mapW - 56;
  const railY = 58;
  ctx.fillStyle = '#261108';
  ctx.beginPath();
  ctx.roundRect(railX, railY - 6, railW, 12, 6);
  ctx.fill();

  const stageFrac = Math.max(0, Math.min(1, turkey.x / stage.exitX));
  const totalFrac = state.endless ? stageFrac : (stage.index + stageFrac) / STAGE_DEFS.length;
  const fillGrad = ctx.createLinearGradient(railX, railY, railX + railW, railY);
  fillGrad.addColorStop(0, '#e87a24');
  fillGrad.addColorStop(1, '#ffd24d');
  ctx.fillStyle = fillGrad;
  ctx.beginPath();
  ctx.roundRect(railX + 1, railY - 5, Math.max(8, (railW - 2) * totalFrac), 10, 5);
  ctx.fill();

  // Stage tick labels
  ctx.font = '800 10px "Trebuchet MS", sans-serif';
  const labels = ['FARMYARD', 'BARN', 'KITCHEN', 'BANQUET', 'FREEDOM'];
  for (let i = 0; i < labels.length; i++) {
    const tx = railX + (railW * i) / 4;
    ctx.fillStyle = i <= stage.index ? '#ffe499' : 'rgba(245, 225, 184, 0.52)';
    ctx.fillText(labels[i], tx, railY + 24);
  }

  // Live Farmer & Turkey pins on the escape track
  const farmerFrac = state.endless
    ? Math.max(0, Math.min(1, farmer.x / stage.exitX))
    : Math.max(0, Math.min(1, (stage.index + farmer.x / stage.exitX) / STAGE_DEFS.length));
  drawTrackPin(ctx, railX + railW * farmerFrac, railY, '#d92818', 'J');
  drawTrackPin(ctx, railX + railW * totalFrac, railY, '#f7b831', 'T');

  // --- TOP-RIGHT: STAMINA / FLUTTER METER + AUDIO & PAUSE ---
  drawWoodPanel(ctx, VIEWPORT.width - 332, 14, 314, 86, patterns);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f5ca72';
  ctx.font = '800 12px "Trebuchet MS", sans-serif';
  ctx.fillText('FLUTTER & DASH', VIEWPORT.width - 316, 35);

  const barX = VIEWPORT.width - 316;
  const barY = 44;
  const barW = 192;
  ctx.fillStyle = '#261009';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 18, 9);
  ctx.fill();
  const stamFrac = turkey.stamina / PHYSICS.staminaMax;
  const stamGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  stamGrad.addColorStop(0, '#f28b24');
  stamGrad.addColorStop(1, '#ffe478');
  ctx.fillStyle = stamGrad;
  ctx.beginPath();
  ctx.roundRect(barX + 2, barY + 2, Math.max(0, (barW - 4) * stamFrac), 14, 7);
  ctx.fill();

  // Mini action cue line
  ctx.fillStyle = '#f5e1b8';
  ctx.font = '700 11px "Trebuchet MS", sans-serif';
  ctx.fillText('SPACE Flutter · SHIFT Dash · S Hide · F Kick', VIEWPORT.width - 316, 84);

  // Mute & Pause crisp custom vector buttons
  const hudBtns = getHudButtons();
  drawSpeakerIconButton(ctx, hudBtns[0], audio.muted);
  drawPauseIconButton(ctx, hudBtns[1]);

  // --- DANGER PROXIMITY INDICATOR WHEN FARMER JEB IS CLOSE ---
  const gap = turkey.x - farmer.x;
  if (gap > 0 && gap < 195 && farmer.state !== 'stunned' && farmer.state !== 'blind') {
    const warnAlpha = Math.max(0.78, Math.min(0.96, (195 - gap) / 110 + 0.55));
    ctx.save();
    ctx.globalAlpha = warnAlpha;
    ctx.fillStyle = '#c92316';
    ctx.strokeStyle = '#ffe599';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(18, 112, 246, 30, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff9e6';
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(farmer.outfit === 'chef' ? '! CHEF JEB RIGHT BEHIND YOU !' : '! FARMER JEB CLOSING IN !', 141, 132);
    ctx.restore();
  }

  // Stage transition announcement ribbon
  if (state.stageBannerTimer > 0) {
    const alpha = Math.min(1, state.stageBannerTimer * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    const bw = 620;
    const bx = (VIEWPORT.width - bw) * 0.5;
    drawWoodPanel(ctx, bx, 128, bw, 84, patterns);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '900 28px "Trebuchet MS", sans-serif';
    ctx.fillText(`STAGE ${stage.index + 1}: ${stage.name.toUpperCase()}`, VIEWPORT.width * 0.5, 165);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = '700 15px "Trebuchet MS", sans-serif';
    ctx.fillText(stage.subtitle, VIEWPORT.width * 0.5, 194);
    ctx.restore();
  }
}

export function renderTitleOverlay(ctx, state, patterns, pointer, time) {
  const cx = VIEWPORT.width * 0.5;
  // Soft top vignette so title banner pops vividly while leaving the live chase scene crystal-clear below!
  const topShade = ctx.createLinearGradient(0, 0, 0, 390);
  topShade.addColorStop(0, 'rgba(26, 10, 5, 0.72)');
  topShade.addColorStop(0.75, 'rgba(26, 10, 5, 0.34)');
  topShade.addColorStop(1, 'rgba(26, 10, 5, 0)');
  ctx.fillStyle = topShade;
  ctx.fillRect(0, 0, VIEWPORT.width, 390);

  // Carved Autumn Wooden Emblem & Title Crest
  const crestW = 760;
  const crestX = cx - crestW * 0.5;
  ctx.save();
  ctx.fillStyle = 'rgba(44, 19, 8, 0.92)';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(crestX, 28, crestW, 218, 24);
  ctx.fill();
  ctx.stroke();

  // Inner parchment accent stroke
  ctx.strokeStyle = 'rgba(255, 224, 152, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(crestX + 9, 37, crestW - 18, 200, 18);
  ctx.stroke();

  // Tagline pill
  ctx.fillStyle = '#c93322';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(cx - 184, 48, 368, 28, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff5db';
  ctx.font = '900 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE GREAT THANKSGIVING ESCAPE', cx, 67);

  // Big bold iconic Title Typography
  const bob = Math.sin(time * 3) * 2.5;
  ctx.font = '900 84px "Trebuchet MS", Impact, sans-serif';
  ctx.lineWidth = 13;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText('GOBBLE BREAK', cx, 154 + bob);

  const titleGrad = ctx.createLinearGradient(0, 84, 0, 168);
  titleGrad.addColorStop(0, '#fff7cc');
  titleGrad.addColorStop(0.48, '#f7b733');
  titleGrad.addColorStop(1, '#e05a1b');
  ctx.fillStyle = titleGrad;
  ctx.fillText('GOBBLE BREAK', cx, 154 + bob);

  // Crisp one-line hook comfortably inside the crest frame
  ctx.fillStyle = '#fae7c0';
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.fillText('Outrun Farmer Jeb  ·  Dodge 450°F Ovens & Carving Knives  ·  Escape Thanksgiving!', cx, 196);

  // High Score badge
  ctx.fillStyle = '#ffd573';
  ctx.font = '800 14px "Trebuchet MS", sans-serif';
  ctx.fillText(`BEST SCORE: ${state.bestScore}   ·   PRESS SPACE OR CLICK TO RUN`, cx, 226);
  ctx.restore();

  // Interactive Mode Buttons
  const buttons = getOverlayButtons('title');
  for (const btn of buttons) {
    const hovered = hitTestButtons([btn], pointer.x, pointer.y) !== null;
    drawMenuButton(ctx, btn, hovered, time);
  }

  // Bottom sleek control reference bar
  ctx.save();
  ctx.fillStyle = 'rgba(32, 14, 7, 0.84)';
  ctx.strokeStyle = 'rgba(245, 184, 61, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - 460, VIEWPORT.height - 54, 920, 38, 19);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe9ba';
  ctx.font = '800 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('A/D or ←/→ Run   ·   SPACE / W Jump & Hold Flutter   ·   SHIFT / Click Dash   ·   S Hide in Cover   ·   F Kick Prop / Gobble', cx, VIEWPORT.height - 30);
  ctx.restore();
  void patterns;
}

export function renderPauseOverlay(ctx, pointer, time) {
  ctx.fillStyle = 'rgba(20, 8, 4, 0.65)';
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  const cx = VIEWPORT.width * 0.5;
  ctx.fillStyle = '#3b1a0c';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(cx - 200, 210, 400, 352, 22);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe394';
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

  // Dramatic vignette dim keeping frozen chase/escape diorama visible around the card!
  ctx.fillStyle = isWin ? 'rgba(34, 18, 6, 0.52)' : 'rgba(32, 8, 5, 0.62)';
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  const cardW = 660;
  const cardH = 468;
  const cardX = cx - cardW * 0.5;
  const cardY = 126;

  // Warm parchment & mahogany storybook summary card
  ctx.save();
  ctx.fillStyle = '#3a190c';
  ctx.strokeStyle = isWin ? '#ffd24d' : '#ff5a36';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = patterns.parchment;
  ctx.beginPath();
  ctx.roundRect(cardX + 14, cardY + 14, cardW - 28, cardH - 28, 16);
  ctx.fill();
  ctx.strokeStyle = '#9c6830';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top Header Ribbon
  ctx.fillStyle = isWin ? '#2e7d32' : '#b82518';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(cx - 275, cardY - 30, 550, 74, 18);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '900 44px "Trebuchet MS", Impact, sans-serif';
  ctx.lineWidth = 7;
  ctx.strokeStyle = PALETTE.ink;
  const headline = isWin ? 'ESCAPED TO FREEDOM!' : 'CAUGHT FOR DINNER!';
  ctx.strokeText(headline, cx, cardY + 21);
  ctx.fillStyle = '#fff5d6';
  ctx.fillText(headline, cx, cardY + 21);

  // Comic flavor subtitle
  ctx.fillStyle = '#522510';
  ctx.font = '800 18px "Trebuchet MS", sans-serif';
  const flavor = isWin
    ? 'Barnaby flew out the Banquet Window — Thanksgiving is vegan tonight!'
    : state.caughtReason || 'Farmer Jeb rang the dinner bell — run again and outsmart him!';
  ctx.fillText(flavor, cx, cardY + 86);

  // Custom Vector Medal / Status Emblem (zero system emojis!)
  const rank = computeGrade(state);
  ctx.save();
  ctx.translate(cardX + 98, cardY + 206);
  ctx.rotate(-0.08);
  ctx.fillStyle = isWin ? '#f5b83d' : '#c93322';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 245, 210, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.stroke();

  if (isWin) {
    ctx.fillStyle = '#4a1d08';
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.fillText('RANK', 0, -22);
    ctx.fillStyle = '#fff9e6';
    ctx.lineWidth = 5;
    ctx.strokeStyle = PALETTE.ink;
    ctx.font = '900 46px "Trebuchet MS", sans-serif';
    ctx.strokeText(rank, 0, 22);
    ctx.fillText(rank, 0, 22);
  } else {
    // Crisp custom vector Silver Cloche Platter + Dinner Bell emblem!
    ctx.fillStyle = '#fff5db';
    ctx.font = '900 11px "Trebuchet MS", sans-serif';
    ctx.fillText('DINNER BELL', 0, -24);
    ctx.fillStyle = '#e5edf4';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.5;
    // Dome cloche
    ctx.beginPath();
    ctx.arc(0, 14, 24, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Knob on top
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(0, -13, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Platter tray base
    ctx.fillStyle = '#cdd9e5';
    ctx.beginPath();
    ctx.roundRect(-30, 14, 60, 8, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Crisp 2x2 Stats Tiles (super readable even shrunk!)
  const stats = [
    { label: 'FINAL SCORE', value: String(Math.floor(state.score)) },
    { label: 'BEST SCORE', value: String(Math.floor(state.bestScore)) },
    { label: 'DISTANCE RUN', value: `${Math.floor(state.distanceMeters)}m` },
    { label: 'CLOSE SHAVES', value: `${state.closeShaves} · ${state.stuns} STUNS` },
  ];
  const gridX = cardX + 180;
  const gridY = cardY + 124;
  stats.forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = gridX + col * 224;
    const sy = gridY + row * 82;
    ctx.fillStyle = '#e7cc9c';
    ctx.strokeStyle = '#9c6830';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(sx, sy, 210, 68, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#6e3818';
    ctx.font = '800 12px "Trebuchet MS", sans-serif';
    ctx.fillText(st.label, sx + 14, sy + 22);
    ctx.fillStyle = '#261009';
    ctx.font = '900 24px "Trebuchet MS", sans-serif';
    ctx.fillText(st.value, sx + 14, sy + 52);
  });

  // Stage reached line
  ctx.textAlign = 'center';
  ctx.fillStyle = '#633014';
  ctx.font = '800 15px "Trebuchet MS", sans-serif';
  ctx.fillText(
    `REACHED: STAGE ${state.stage.index + 1}/4 (${state.stage.name.toUpperCase()})   ·   TIME: ${state.elapsedTime.toFixed(1)}s`,
    cx,
    cardY + 324,
  );
  ctx.restore();

  // Restart & Menu buttons
  const buttons = getOverlayButtons(state.mode);
  for (const btn of buttons) {
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

function drawWoodPanel(ctx, x, y, w, h, patterns) {
  ctx.save();
  ctx.fillStyle = 'rgba(46, 20, 9, 0.9)';
  ctx.strokeStyle = '#d99938';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
  void patterns;
  ctx.restore();
}

function drawFeatherIcon(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.35);
  ctx.fillStyle = filled ? '#f5a623' : 'rgba(255, 235, 200, 0.14)';
  ctx.strokeStyle = filled ? PALETTE.ink : 'rgba(255, 225, 175, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (filled) {
    ctx.fillStyle = '#c93322';
    ctx.beginPath();
    ctx.ellipse(0, -8, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTrackPin(ctx, x, y, color, letter) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff8e0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
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
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10);
  ctx.fill();
  ctx.stroke();

  const cx = btn.x + btn.w * 0.5;
  const cy = btn.y + btn.h * 0.5;
  ctx.fillStyle = '#fff5db';
  ctx.strokeStyle = '#fff5db';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 4);
  ctx.lineTo(cx - 4, cy - 4);
  ctx.lineTo(cx + 2, cy - 10);
  ctx.lineTo(cx + 2, cy + 10);
  ctx.lineTo(cx - 4, cy + 4);
  ctx.lineTo(cx - 10, cy + 4);
  ctx.closePath();
  ctx.fill();

  if (muted) {
    ctx.strokeStyle = '#ff6b4a';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 5);
    ctx.lineTo(cx + 13, cy + 5);
    ctx.moveTo(cx + 13, cy - 5);
    ctx.lineTo(cx + 6, cy + 5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx + 4, cy, 5, -0.7, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 4, cy, 9, -0.7, 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPauseIconButton(ctx, btn) {
  ctx.save();
  ctx.fillStyle = '#5c2a12';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10);
  ctx.fill();
  ctx.stroke();
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

  const grad = ctx.createLinearGradient(0, -btn.h * 0.5, 0, btn.h * 0.5);
  if (btn.primary) {
    grad.addColorStop(0, hovered ? '#ffe070' : '#f7c143');
    grad.addColorStop(1, hovered ? '#e6781e' : '#c95614');
  } else {
    grad.addColorStop(0, hovered ? '#8a4621' : '#6b3216');
    grad.addColorStop(1, hovered ? '#59270e' : '#421c0a');
  }

  ctx.fillStyle = grad;
  ctx.strokeStyle = btn.primary ? '#fff5cf' : '#d99a3a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(-btn.w * 0.5, -btn.h * 0.5, btn.w, btn.h, 14);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = btn.primary ? '#2b1106' : '#fff2d1';
  ctx.font = '900 22px "Trebuchet MS", sans-serif';
  ctx.fillText(btn.label, 0, btn.sub ? -2 : 7);

  if (btn.sub) {
    ctx.fillStyle = btn.primary ? '#4f2108' : '#f2c879';
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    ctx.fillText(btn.sub, 0, 18);
  }
  ctx.restore();
}
