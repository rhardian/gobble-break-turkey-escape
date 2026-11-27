// Sculpted storybook illustration sprites: Barnaby the Turkey, Farmer/Chef Jeb, Victorian 450°F Ovens, Carving Knives, Props.

import { PALETTE } from './config.js';

export function drawFloatingPill(ctx, x, y, text, bg, fg, border = PALETTE.ink) {
  ctx.save();
  ctx.font = '900 13px "Trebuchet MS", "Segoe UI", sans-serif';
  const w = Math.max(70, ctx.measureText(text).width + 24);
  const h = 26;
  ctx.shadowColor = 'rgba(20, 8, 3, 0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.roundRect(x - w * 0.5, y - h * 0.5, w, h, 13);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

export function drawTurkeyHero(ctx, turkey, time, isGhost = false, combo = 1) {
  ctx.save();
  if (!isGhost && turkey.invulnTimer > 0 && Math.floor(time * 18) % 2 === 0) {
    ctx.globalAlpha = 0.46;
  }

  const x = turkey.x;
  const y = turkey.y;
  const f = turkey.facing;

  // Soft perspective ground shadow
  if (!isGhost) {
    ctx.fillStyle = 'rgba(24, 9, 4, 0.36)';
    ctx.beginPath();
    ctx.ellipse(x, y + 3, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hot-streak golden aura at combo >= 4
  if (!isGhost && combo >= 4) {
    const aura = ctx.createRadialGradient(x, y - 34, 8, x, y - 34, 58);
    aura.addColorStop(0, 'rgba(255, 226, 118, 0.32)');
    aura.addColorStop(1, 'rgba(255, 165, 36, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y - 34, 58, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(x, y);
  ctx.scale(f * turkey.squashX * 1.18, turkey.squashY * 1.18);

  const runBob = turkey.grounded && Math.abs(turkey.vx) > 20 ? Math.abs(Math.sin(turkey.runCycle * 2)) * 5 : 0;
  const tilt = turkey.dashTimer > 0 ? 0.22 : turkey.fluttering ? -0.1 : Math.max(-0.12, Math.min(0.14, turkey.vx * 0.00028));
  ctx.translate(0, -runBob);
  ctx.rotate(tilt);

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Glorious 9-feather iridescent autumn tail plume with rachis quills & notched cream tips!
  const spread = turkey.fluttering || turkey.dashTimer > 0 ? 1.2 : 0.94;
  const plumeBands = ['#8c2214', '#c94318', '#e87820', '#b83218', '#f09a24', '#d9581a', '#eb8822', '#b32d18', '#8c2214'];
  ctx.save();
  ctx.translate(-15, -31);
  for (let i = -4; i <= 4; i++) {
    const angle = -2.26 + i * 0.215 * spread + Math.sin(time * 13 + i * 0.7) * 0.028;
    ctx.save();
    ctx.rotate(angle);
    const fGrad = ctx.createLinearGradient(0, 0, 48, 0);
    fGrad.addColorStop(0, '#4a170a');
    fGrad.addColorStop(0.55, plumeBands[i + 4]);
    fGrad.addColorStop(0.84, '#f5ba42');
    fGrad.addColorStop(1, '#fff2d1');
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.ellipse(25, 0, 24.5, 8.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dark sub-terminal Thanksgiving turkey band + cream ivory tip
    ctx.fillStyle = '#361309';
    ctx.fillRect(35, -5.5, 4.5, 11);
    ctx.fillStyle = '#fff3d4';
    ctx.beginPath();
    ctx.ellipse(44.5, 0, 4.5, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feather quill line
    ctx.strokeStyle = 'rgba(255, 240, 195, 0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(34, 0);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.6;
    ctx.restore();
  }
  ctx.restore();

  // 2. Back wing (visible fanned out during Wing-Flutter Glide!)
  if (turkey.fluttering) {
    ctx.save();
    ctx.translate(4, -38);
    ctx.rotate(-0.85 + Math.sin(turkey.wingFlap + 0.5) * 0.55);
    drawFeatheredWing(ctx, '#6e2a12', '#c45b20');
    ctx.restore();
  }

  // 3. Kicking orange legs & detailed webbed feet
  const stride = turkey.grounded ? Math.sin(turkey.runCycle * 2) * 14 : 10;
  const kickExt = turkey.kickAnimTimer > 0 ? 19 : 0;
  for (const [legIdx, offset] of [[0, -stride], [1, stride + kickExt]]) {
    ctx.strokeStyle = '#df7818';
    ctx.lineWidth = 5.2;
    ctx.beginPath();
    ctx.moveTo(legIdx === 0 ? -4 : 6, -15);
    ctx.lineTo(offset * 0.55, -9);
    ctx.lineTo(offset, -3);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(offset - 6, -2);
    ctx.lineTo(offset + 13, -2);
    ctx.moveTo(offset + 3, -2);
    ctx.lineTo(offset + 10, -6);
    ctx.stroke();
  }

  // 4. Sculpted plump chestnut torso with layered scalloped breast feathers & warm rim light
  const bodyGrad = ctx.createRadialGradient(8, -37, 4, -2, -28, 32);
  bodyGrad.addColorStop(0, '#c2652d');
  bodyGrad.addColorStop(0.55, '#823415');
  bodyGrad.addColorStop(1, '#471909');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.9;
  ctx.beginPath();
  ctx.ellipse(0, -29, 25, 19.5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Scalloped hand-painted plumage arcs across breast
  ctx.strokeStyle = 'rgba(255, 206, 138, 0.35)';
  ctx.lineWidth = 1.8;
  for (const [fx, fy] of [[5, -35], [12, -29], [3, -24], [-5, -31]]) {
    ctx.beginPath();
    ctx.arc(fx, fy, 6, -0.3, Math.PI * 0.65);
    ctx.stroke();
  }

  // Warm golden firelight rim edge along chest
  ctx.strokeStyle = 'rgba(255, 224, 140, 0.65)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(2, -30, 22, -0.9, 0.55);
  ctx.stroke();

  // 5. Fluttering crimson autumn fugitive bandana/scarf around neck!
  const scarfWave = Math.sin(time * 18) * 5;
  ctx.fillStyle = '#cf2a1e';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(10, -40);
  ctx.quadraticCurveTo(-8, -42 + scarfWave * 0.5, -26, -34 + scarfWave);
  ctx.lineTo(-22, -26 + scarfWave * 0.8);
  ctx.quadraticCurveTo(-4, -33, 13, -34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 6. Articulated foreground feathered wing
  const flapAngle = turkey.fluttering
    ? Math.sin(turkey.wingFlap) * 0.9 - 0.55
    : Math.sin(turkey.wingFlap * 0.65) * 0.22;
  ctx.save();
  ctx.translate(-3, -32);
  ctx.rotate(flapAngle);
  drawFeatheredWing(ctx, '#99401a', '#e88a2a');
  ctx.restore();

  // 7. Expressive arched neck & 3/4 comic head
  const headBob = Math.sin(turkey.runCycle * 2 + 0.5) * 2.5;
  ctx.save();
  ctx.translate(18, -47 + headBob);

  ctx.fillStyle = '#853517';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.roundRect(-7, -4, 14, 22, 6);
  ctx.fill();
  ctx.stroke();

  // Scarf collar knot
  ctx.fillStyle = '#d92f21';
  ctx.beginPath();
  ctx.ellipse(0, 12, 9.5, 4.8, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head & playful tuft feathers
  const headGrad = ctx.createRadialGradient(5, -15, 2, 2, -11, 15);
  headGrad.addColorStop(0, '#ba5526');
  headGrad.addColorStop(1, '#6e2812');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(2, -11, 13.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tiny ruffled crest feathers on top of head
  ctx.fillStyle = '#d4581e';
  ctx.beginPath();
  ctx.ellipse(-4, -24, 4, 7, -0.55, 0, Math.PI * 2);
  ctx.ellipse(2, -25, 3.5, 6.5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Golden curved beak (opens dramatically during GOBBLE or flutter!)
  const open = turkey.gobbleMouthTimer > 0 ? 0.42 : turkey.fluttering ? 0.16 : 0.05;
  ctx.fillStyle = '#f8be36';
  ctx.beginPath();
  ctx.moveTo(12, -15);
  ctx.quadraticCurveTo(22, -14 - open * 10, 29, -10 - open * 13);
  ctx.lineTo(13, -7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0961c';
  ctx.beginPath();
  ctx.moveTo(12, -7);
  ctx.lineTo(25, -5 + open * 13);
  ctx.lineTo(11, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bouncy crimson snood & throat wattle (spring physics!)
  ctx.save();
  ctx.translate(14, -13);
  ctx.rotate(turkey.wattleSwing);
  const watGrad = ctx.createLinearGradient(0, 0, 8, 18);
  watGrad.addColorStop(0, '#ff453a');
  watGrad.addColorStop(1, '#a61414');
  ctx.fillStyle = watGrad;
  ctx.beginPath();
  ctx.ellipse(4, 10, 4.8, 9.5, 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Expressive 3/4 comic eyes (far eye + near eye + panicked brows!)
  for (const [ex, ey, rx, ry] of [[11, -15, 4.5, 5.5], [4.5, -14.5, 6.2, 7.2]]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#140805';
    ctx.beginPath();
    ctx.arc(ex + 1.4, ey, rx * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + 2.2, ey - 1.8, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Curved comic brow
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-2, -22);
  ctx.quadraticCurveTo(4, -25, 9, -22);
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

function drawFeatheredWing(ctx, darkCol, tipCol) {
  const g = ctx.createLinearGradient(-16, -6, 12, 12);
  g.addColorStop(0, tipCol);
  g.addColorStop(0.65, darkCol);
  g.addColorStop(1, '#4a1b0a');
  ctx.fillStyle = g;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(8, -6);
  ctx.quadraticCurveTo(-6, -12, -20, -2);
  ctx.quadraticCurveTo(-24, 6, -16, 11);
  ctx.quadraticCurveTo(-11, 15, -6, 12);
  ctx.quadraticCurveTo(1, 16, 7, 10);
  ctx.quadraticCurveTo(14, 3, 8, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawFarmerVillain(ctx, farmer, time) {
  ctx.save();
  const x = farmer.x;
  const y = farmer.y;
  const f = farmer.facing;

  // Volumetric searchlight lantern cone (Farmyard/Barn) or piercing focus beam (Search mode)!
  if (farmer.state !== 'stunned' && farmer.state !== 'blind') {
    const isSearch = farmer.state === 'search';
    const sweepAngle = isSearch ? Math.sin(time * 5.2) * 0.28 : 0.08;
    const beamLen = isSearch ? 235 : 190;
    ctx.save();
    ctx.translate(x + f * 18, y - 78);
    ctx.rotate(sweepAngle * f);
    const beam = ctx.createLinearGradient(0, 0, f * beamLen, 0);
    beam.addColorStop(0, isSearch ? 'rgba(255, 224, 112, 0.34)' : 'rgba(255, 198, 92, 0.22)');
    beam.addColorStop(1, 'rgba(255, 198, 92, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(f * beamLen, -52);
    ctx.lineTo(f * beamLen, 64);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Heavy ground drop shadow
  ctx.fillStyle = 'rgba(24, 9, 4, 0.42)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, y);
  ctx.scale(f * 1.14, 1.14);

  const bob = farmer.state === 'stunned' || farmer.state === 'blind'
    ? Math.sin(time * 22) * 2
    : Math.abs(Math.sin(farmer.runCycle * 2)) * 6.5;
  const lean = farmer.state === 'lunge' ? 0.24 : farmer.state === 'chase' ? 0.11 : 0;

  ctx.translate(0, -bob);
  ctx.rotate(lean);

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Off-hand prop behind torso: Brass Search Lantern (Farmhand) OR Roasting Fork (Chef)!
  ctx.save();
  ctx.translate(-12, -70);
  ctx.rotate(-Math.sin(farmer.armSwing) * 0.35 + 0.15);
  if (farmer.outfit === 'chef') {
    // Gleaming 2-prong carving fork held ready!
    ctx.strokeStyle = '#6e3214';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, -12); ctx.stroke();
    ctx.strokeStyle = '#dce6f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, -11); ctx.lineTo(34, -22);
    ctx.moveTo(28, -18); ctx.lineTo(42, -21);
    ctx.moveTo(28, -18); ctx.lineTo(39, -30);
    ctx.stroke();
  } else {
    // Glowing brass farm lantern!
    ctx.fillStyle = '#331c10';
    ctx.fillRect(10, -2, 16, 5);
    ctx.fillStyle = '#ffe58c';
    ctx.fillRect(12, 3, 12, 16);
    ctx.strokeRect(12, 3, 12, 16);
    ctx.fillStyle = '#331c10';
    ctx.fillRect(10, 19, 16, 4);
  }
  ctx.restore();

  // Heavy stomping legs & cuffed leather work boots
  const stride = farmer.state === 'stunned' || farmer.state === 'blind' ? 0 : Math.sin(farmer.runCycle * 2) * 18;
  for (const offset of [-stride, stride]) {
    ctx.fillStyle = farmer.outfit === 'chef' ? '#2c2b33' : '#2a4769';
    ctx.beginPath();
    ctx.roundRect(offset - 9, -38, 18, 28, 5);
    ctx.fill();
    ctx.stroke();
    // Stitched leather boot with toe highlight
    const bootG = ctx.createLinearGradient(offset - 10, -14, offset + 16, 0);
    bootG.addColorStop(0, '#592d16');
    bootG.addColorStop(1, '#2b1308');
    ctx.fillStyle = bootG;
    ctx.beginPath();
    ctx.roundRect(offset - 10, -15, 27, 15, [4, 7, 3, 3]);
    ctx.fill();
    ctx.stroke();
  }

  // Sculpted barrel torso: Plaid Flannel + Denim Overalls OR Double-Breasted Chef Coat + Checkered Apron!
  if (farmer.outfit === 'chef') {
    const coatG = ctx.createLinearGradient(-26, -88, 26, -32);
    coatG.addColorStop(0, '#ffffff');
    coatG.addColorStop(1, '#ded2be');
    ctx.fillStyle = coatG;
    ctx.beginPath();
    ctx.roundRect(-25, -88, 52, 58, 16);
    ctx.fill();
    ctx.stroke();

    // Red Thanksgiving chef neckerchief
    ctx.fillStyle = '#c92a1e';
    ctx.beginPath();
    ctx.moveTo(-8, -86); ctx.lineTo(14, -86); ctx.lineTo(4, -74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gingham kitchen apron with waist tie & pocket
    ctx.fillStyle = '#c93322';
    ctx.beginPath();
    ctx.roundRect(-18, -66, 40, 38, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 244, 220, 0.25)';
    for (let ax = -14; ax < 18; ax += 10) {
      ctx.fillRect(ax, -65, 4, 36);
    }
    ctx.fillStyle = '#8f1f14';
    ctx.fillRect(-6, -48, 18, 13);
    ctx.strokeRect(-6, -48, 18, 13);

    // Double-breasted buttons
    ctx.fillStyle = PALETTE.ink;
    for (const by of [-76, -68]) {
      ctx.beginPath();
      ctx.arc(4, by, 2.3, 0, Math.PI * 2);
      ctx.arc(15, by, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Rich red-and-black plaid lumberjack flannel
    ctx.fillStyle = '#b82d1b';
    ctx.beginPath();
    ctx.roundRect(-25, -88, 52, 58, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(42, 12, 8, 0.32)';
    ctx.fillRect(-24, -76, 50, 6);
    ctx.fillRect(-10, -86, 6, 54);
    ctx.fillRect(10, -86, 6, 54);

    // Shaded denim overalls + brass hardware
    const denG = ctx.createLinearGradient(-22, -66, 22, -28);
    denG.addColorStop(0, '#456f9e');
    denG.addColorStop(1, '#264161');
    ctx.fillStyle = denG;
    ctx.beginPath();
    ctx.roundRect(-22, -66, 45, 36, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-15, -85, 8, 22);
    ctx.strokeRect(-15, -85, 8, 22);
    ctx.fillRect(9, -85, 8, 22);
    ctx.strokeRect(9, -85, 8, 22);
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(-11, -63, 3.2, 0, Math.PI * 2);
    ctx.arc(13, -63, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sculpted expressive comic head (coated white when Flour-Blinded!)
  const faceG = ctx.createRadialGradient(6, -106, 3, 2, -101, 22);
  if (farmer.state === 'blind') {
    faceG.addColorStop(0, '#ffffff');
    faceG.addColorStop(1, '#e6d8c5');
  } else {
    faceG.addColorStop(0, '#f7c89e');
    faceG.addColorStop(1, '#d68a5c');
  }
  ctx.fillStyle = faceG;
  ctx.beginPath();
  ctx.arc(3, -102, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rosy cheek & bulbous comic nose
  ctx.fillStyle = 'rgba(218, 76, 54, 0.35)';
  ctx.beginPath(); ctx.arc(12, -96, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e07a5f';
  ctx.beginPath(); ctx.arc(17, -99, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Wide yelling teeth under bushy sculpted auburn mustache
  if (farmer.state === 'chase' || farmer.state === 'lunge') {
    ctx.fillStyle = '#5c1410';
    ctx.beginPath();
    ctx.ellipse(11, -87, 9, 4.8, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9ee';
    ctx.fillRect(5, -90, 12, 3.5);
  }
  ctx.fillStyle = '#753114';
  ctx.beginPath();
  ctx.moveTo(-1, -91);
  ctx.quadraticCurveTo(8, -98, 22, -92);
  ctx.quadraticCurveTo(25, -86, 15, -86);
  ctx.quadraticCurveTo(6, -85, -1, -91);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Furious eyes & bushy sculpted brows
  if (farmer.state === 'stunned' || farmer.state === 'blind') {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(6, -110); ctx.lineTo(15, -101);
    ctx.moveTo(15, -110); ctx.lineTo(6, -101);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(10, -106, 5.5, 5.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath(); ctx.arc(12, -106, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#63260e';
    ctx.beginPath();
    ctx.moveTo(1, -116); ctx.lineTo(18, -110); ctx.lineTo(17, -106); ctx.lineTo(0, -111);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Sculpted headgear: Volumetric Pleated Chef Toque OR Woven Harvest Straw Hat
  if (farmer.outfit === 'chef') {
    const hatG = ctx.createLinearGradient(-16, -152, 22, -116);
    hatG.addColorStop(0, '#ffffff');
    hatG.addColorStop(0.75, '#f0e6d2');
    hatG.addColorStop(1, '#cfc0a7');
    ctx.fillStyle = hatG;
    ctx.beginPath();
    ctx.arc(-9, -138, 13.5, 0, Math.PI * 2);
    ctx.arc(4, -143, 16, 0, Math.PI * 2);
    ctx.arc(16, -137, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-16, -131, 36, 16);
    ctx.strokeRect(-16, -131, 36, 16);
    // Red band & pleats
    ctx.fillStyle = '#c93322';
    ctx.fillRect(-15, -121, 34, 5);
  } else {
    const strawG = ctx.createLinearGradient(-28, -136, 30, -112);
    strawG.addColorStop(0, '#f7ce68');
    strawG.addColorStop(1, '#c48320');
    ctx.fillStyle = strawG;
    ctx.beginPath();
    ctx.ellipse(3, -117, 33, 8, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-16, -137, 36, 22, [11, 11, 2, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b8281a';
    ctx.fillRect(-15, -123, 34, 6);
  }

  // Brandishing foreground arm holding giant gleaming Carving Knife!
  const swing = farmer.state === 'lunge' ? -0.42 : Math.sin(farmer.armSwing) * 0.34 - 0.14;
  ctx.save();
  ctx.translate(14, -74);
  ctx.rotate(swing);
  ctx.fillStyle = farmer.outfit === 'chef' ? '#ffffff' : '#b82d1b';
  ctx.beginPath();
  ctx.roundRect(-4, -8.5, 30, 15, 7);
  ctx.fill();
  ctx.stroke();
  // Clenched fist
  ctx.fillStyle = farmer.state === 'blind' ? '#f5efe6' : '#f2b88b';
  ctx.beginPath(); ctx.arc(27, -1, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.translate(30, -1);
  ctx.rotate(-0.36);
  drawCarvingKnifeSprite(ctx, 1.15);
  ctx.restore();

  ctx.restore();

  // Diegetic AI status badge above head (! / ? / dizzy stars / comic speech pill)
  ctx.save();
  ctx.translate(x, y - 180);
  if (farmer.state === 'stunned' || farmer.state === 'blind') {
    for (let i = 0; i < 4; i++) {
      const a = time * 5.2 + (i * Math.PI * 2) / 4;
      drawStarSpark(ctx, Math.cos(a) * 28, Math.sin(a) * 10, 7, PALETTE.gold);
    }
    drawFloatingPill(ctx, 0, -22, farmer.state === 'blind' ? 'ACHOO! BLINDED!' : 'STUNNED!', '#3a1d10', '#ffe38c', PALETTE.gold);
  } else if (farmer.state === 'search') {
    drawFloatingPill(ctx, 0, 0, '? SEARCHING...', '#f2a924', '#261009');
  } else if (farmer.alertTimer > 0 || farmer.state === 'lunge') {
    drawFloatingPill(ctx, 0, 0, '! ' + (farmer.shoutText || 'GET BACK HERE!'), '#d42214', '#fff8dc', '#ffe28a');
  }
  ctx.restore();
}

export function drawVictorianOven(ctx, oven, time) {
  ctx.save();
  ctx.translate(oven.x, oven.y);

  // Warm radiant oven firelight halo
  const glowA = oven.state === 'blast' ? 0.72 : oven.state === 'telegraph' ? 0.48 : 0.28;
  const halo = ctx.createRadialGradient(oven.w * 0.5, oven.h * 0.65, 16, oven.w * 0.5, oven.h * 0.65, 215);
  halo.addColorStop(0, `rgba(255, 134, 36, ${glowA})`);
  halo.addColorStop(0.55, `rgba(235, 76, 16, ${glowA * 0.35})`);
  halo.addColorStop(1, 'rgba(235, 76, 16, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(oven.w * 0.5, oven.h * 0.65, 215, 0, Math.PI * 2);
  ctx.fill();

  const shakeX = oven.state === 'telegraph' ? Math.sin(time * 66) * 3.2 : 0;
  ctx.translate(shakeX, 0);

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;

  // Chimney stovepipe with brass collar & rising wisps of heat smoke
  ctx.fillStyle = '#251f21';
  ctx.fillRect(oven.w - 36, -58, 24, 62);
  ctx.strokeRect(oven.w - 36, -58, 24, 62);
  ctx.fillStyle = '#c97c36';
  ctx.fillRect(oven.w - 39, -18, 30, 8);
  ctx.strokeRect(oven.w - 39, -18, 30, 8);

  // Curved cast-iron Victorian stove feet
  ctx.fillStyle = '#1e191b';
  ctx.beginPath();
  ctx.roundRect(6, oven.h - 10, 18, 12, 4);
  ctx.roundRect(oven.w - 24, oven.h - 10, 18, 12, 4);
  ctx.fill();
  ctx.stroke();

  // Heavy beveled cast-iron stove body
  const ironG = ctx.createLinearGradient(0, 0, oven.w, oven.h);
  ironG.addColorStop(0, '#4f464a');
  ironG.addColorStop(0.42, '#2d2729');
  ironG.addColorStop(1, '#171315');
  ctx.fillStyle = ironG;
  ctx.beginPath();
  ctx.roundRect(0, 0, oven.w, oven.h - 4, 10);
  ctx.fill();
  ctx.stroke();

  // Polished copper stovetop mantle & decorative bevel line
  const copG = ctx.createLinearGradient(-5, -6, oven.w + 5, 10);
  copG.addColorStop(0, '#f5b06e');
  copG.addColorStop(0.5, '#c76c2a');
  copG.addColorStop(1, '#7a3512');
  ctx.fillStyle = copG;
  ctx.beginPath();
  ctx.roundRect(-6, -6, oven.w + 12, 14, 4);
  ctx.fill();
  ctx.stroke();

  // Glowing red-hot 450°F nameplate & brass burner dial knobs
  ctx.fillStyle = oven.state === 'idle' ? '#f5e1b8' : '#e62e14';
  ctx.beginPath();
  ctx.roundRect(11, 14, 56, 22, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = oven.state === 'idle' ? '#261009' : '#fff7dc';
  ctx.font = '900 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('450°F', 39, 29);

  for (let k = 0; k < 2; k++) {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(82 + k * 18, 25, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#47210c';
    ctx.beginPath();
    ctx.arc(82 + k * 18, 25, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing firebox hearth window
  const fireG = ctx.createLinearGradient(12, 44, 12, oven.h - 14);
  fireG.addColorStop(0, '#fff7b2');
  fireG.addColorStop(0.42, '#ff861f');
  fireG.addColorStop(0.85, '#c7260e');
  fireG.addColorStop(1, '#5e0f07');
  ctx.fillStyle = fireG;
  ctx.beginPath();
  ctx.roundRect(12, 44, oven.w - 24, oven.h - 58, 7);
  ctx.fill();
  ctx.stroke();

  // Dancing multi-layer interior fire tongues
  for (let f = 0; f < 5; f++) {
    const fx = 22 + f * 17;
    const fh = 22 + Math.sin(time * 18 + f * 1.9) * 10;
    ctx.fillStyle = f % 2 === 0 ? '#fff29c' : '#ff5a14';
    ctx.beginPath();
    ctx.moveTo(fx - 9, oven.h - 16);
    ctx.quadraticCurveTo(fx, oven.h - 16 - fh, fx + 9, oven.h - 16);
    ctx.closePath();
    ctx.fill();
  }

  // Perspective hinged cast-iron oven door
  if (oven.doorOpen < 0.72) {
    ctx.strokeStyle = 'rgba(26, 16, 16, 0.88)';
    ctx.lineWidth = 3.2;
    for (let gx = 24; gx < oven.w - 16; gx += 16) {
      ctx.beginPath();
      ctx.moveTo(gx, 46);
      ctx.lineTo(gx, oven.h - 16);
      ctx.stroke();
    }
  } else {
    // Swung-open iron door flap projecting on the side
    ctx.fillStyle = '#241e20';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(12, oven.h - 16);
    ctx.lineTo(-10, oven.h - 4);
    ctx.lineTo(oven.w - 22, oven.h - 4);
    ctx.lineTo(oven.w - 12, oven.h - 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Telegraph badge
  if (oven.state === 'telegraph') {
    ctx.save();
    ctx.globalAlpha = 0.75 + Math.sin(time * 28) * 0.25;
    drawFloatingPill(ctx, oven.w * 0.5, -24, '450°F BLAST!', '#de2b12', '#fff7d6', '#ffd24d');
    ctx.restore();
  }

  // Volumetric layered roaring flame jet blasting from the open hearth!
  if (oven.state === 'blast') {
    const dir = oven.facing;
    const startX = dir < 0 ? 4 : oven.w - 4;
    const len = oven.flameLength * (0.92 + Math.sin(time * 32) * 0.08);
    const midY = 78;

    // Outer fiery red-orange plume
    const outerG = ctx.createLinearGradient(startX, midY, startX + dir * len, midY);
    outerG.addColorStop(0, 'rgba(255, 248, 175, 0.98)');
    outerG.addColorStop(0.32, 'rgba(255, 138, 28, 0.94)');
    outerG.addColorStop(0.76, 'rgba(224, 42, 14, 0.78)');
    outerG.addColorStop(1, 'rgba(224, 42, 14, 0)');
    ctx.fillStyle = outerG;
    ctx.beginPath();
    ctx.moveTo(startX, midY - 32);
    ctx.quadraticCurveTo(startX + dir * len * 0.52, midY - 48 + Math.sin(time * 26) * 8, startX + dir * len, midY);
    ctx.quadraticCurveTo(startX + dir * len * 0.52, midY + 44 - Math.cos(time * 24) * 8, startX, midY + 32);
    ctx.closePath();
    ctx.fill();

    // Molten golden-white inner jet
    ctx.fillStyle = 'rgba(255, 252, 206, 0.9)';
    ctx.beginPath();
    ctx.moveTo(startX, midY - 15);
    ctx.quadraticCurveTo(startX + dir * len * 0.44, midY - 22, startX + dir * len * 0.74, midY);
    ctx.quadraticCurveTo(startX + dir * len * 0.44, midY + 19, startX, midY + 15);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawCarvingKnifeSprite(ctx, scale = 1) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.6;

  // Sculpted riveted rosewood handle
  const handleG = ctx.createLinearGradient(-34, -7, -12, 7);
  handleG.addColorStop(0, '#8f431d');
  handleG.addColorStop(1, '#4a1e0a');
  ctx.fillStyle = handleG;
  ctx.beginPath();
  ctx.roundRect(-36, -6.5, 23, 13, 4.5);
  ctx.fill();
  ctx.stroke();

  // Brass rivets & steel bolster
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(-29, 0, 2.3, 0, Math.PI * 2);
  ctx.arc(-20, 0, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c4d4e3';
  ctx.fillRect(-14, -7.5, 6, 15);
  ctx.strokeRect(-14, -7.5, 6, 15);

  // Dual-facet forged steel carving blade
  const topG = ctx.createLinearGradient(-8, -8, 44, 0);
  topG.addColorStop(0, '#f0f6fc');
  topG.addColorStop(0.55, '#b8cadb');
  topG.addColorStop(1, '#7e93a8');
  ctx.fillStyle = topG;
  ctx.beginPath();
  ctx.moveTo(-8, -7.5);
  ctx.lineTo(25, -6.5);
  ctx.quadraticCurveTo(40, -2.5, 47, 4.5);
  ctx.lineTo(22, 8.5);
  ctx.lineTo(-8, 7.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mirror-bright honed cutting bevel & glint star!
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-6, 3);
  ctx.lineTo(42, 4);
  ctx.lineTo(22, 7.5);
  ctx.lineTo(-6, 6.5);
  ctx.closePath();
  ctx.fill();
  drawStarSpark(ctx, 35, 1, 5.5, '#ffffff');

  ctx.restore();
}

export function drawStarSpark(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.3, -r * 0.3);
  ctx.lineTo(r, 0);
  ctx.lineTo(r * 0.3, r * 0.3);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.3, r * 0.3);
  ctx.lineTo(-r, 0);
  ctx.lineTo(-r * 0.3, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawMiniPumpkin(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  // Curled vine stem
  ctx.fillStyle = '#5a7828';
  ctx.beginPath();
  ctx.roundRect(-3.5, -r - 6, 7, 10, 3);
  ctx.fill();
  ctx.stroke();

  const pG = ctx.createRadialGradient(-r * 0.25, -r * 0.3, 2, 0, 0, r * 1.15);
  pG.addColorStop(0, '#ffaa3b');
  pG.addColorStop(0.65, '#e86817');
  pG.addColorStop(1, '#a83c0c');
  ctx.fillStyle = pG;
  ctx.beginPath();
  ctx.ellipse(-r * 0.34, 0, r * 0.66, r * 0.85, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.34, 0, r * 0.66, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.56, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Gloss highlight
  ctx.fillStyle = 'rgba(255, 240, 195, 0.35)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.16, -r * 0.36, r * 0.16, r * 0.32, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
