// Procedural offscreen surface textures (zero external images, 60fps cached CanvasPatterns).

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function createSurfacePatterns(ctx) {
  return {
    woodPlank: buildWoodPattern(ctx),
    brickWall: buildBrickPattern(ctx),
    hayWeave: buildHayPattern(ctx),
    parchment: buildParchmentPattern(ctx),
    banquetWall: buildBanquetWallPattern(ctx),
    cobbledDirt: buildCobbledDirtPattern(ctx),
  };
}

function buildWoodPattern(ctx) {
  const c = makeCanvas(160, 80);
  const g = c.getContext('2d');
  g.fillStyle = '#5c2e16';
  g.fillRect(0, 0, 160, 80);

  for (let y = 0; y < 80; y += 2) {
    const wave = Math.sin(y * 0.35) * 0.04;
    g.fillStyle = y % 4 === 0 ? `rgba(28, 11, 4, ${0.22 + wave})` : 'rgba(255, 206, 138, 0.06)';
    g.fillRect(0, y, 160, 2);
  }
  // Subtle wood knot
  g.strokeStyle = 'rgba(32, 12, 5, 0.35)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(106, 20, 12, 5, 0.1, 0, Math.PI * 2);
  g.ellipse(44, 60, 10, 4, -0.1, 0, Math.PI * 2);
  g.stroke();

  // Plank grooves and iron rivets
  g.strokeStyle = 'rgba(24, 9, 4, 0.72)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 40); g.lineTo(160, 40);
  g.moveTo(76, 0); g.lineTo(76, 40);
  g.moveTo(18, 40); g.lineTo(18, 80);
  g.stroke();

  g.fillStyle = 'rgba(255, 210, 148, 0.12)';
  g.fillRect(0, 41, 160, 2);
  g.fillRect(0, 1, 160, 2);

  g.fillStyle = 'rgba(22, 10, 5, 0.72)';
  for (const [nx, ny] of [[69, 10], [69, 30], [83, 10], [83, 30], [11, 50], [25, 70]]) {
    g.beginPath();
    g.arc(nx, ny, 2.2, 0, Math.PI * 2);
    g.fill();
  }
  return ctx.createPattern(c, 'repeat');
}

function buildBrickPattern(ctx) {
  const c = makeCanvas(128, 64);
  const g = c.getContext('2d');
  // Warm aged mortar base
  g.fillStyle = '#3d1c11';
  g.fillRect(0, 0, 128, 64);

  const bricks = [
    [2, 2, 58, 26, '#7c351e', '#994729'],
    [64, 2, 62, 26, '#6d2d19', '#873d24'],
    [-30, 34, 60, 26, '#73311b', '#8f4126'],
    [34, 34, 60, 26, '#873b21', '#a64d2d'],
    [98, 34, 60, 26, '#6b2c18', '#853a22'],
  ];
  for (const [x, y, w, h, main, top] of bricks) {
    const grad = g.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, top);
    grad.addColorStop(0.35, main);
    grad.addColorStop(1, '#4f1e11');
    g.fillStyle = grad;
    g.fillRect(x, y, w, h);
    // Warm chipped highlight edge
    g.fillStyle = 'rgba(255, 208, 152, 0.13)';
    g.fillRect(x + 2, y + 1, w - 4, 3);
    // Subtle hearth soot fleck
    g.fillStyle = 'rgba(26, 10, 5, 0.16)';
    g.fillRect(x + 6, y + h - 5, w - 12, 3);
  }
  return ctx.createPattern(c, 'repeat');
}

function buildHayPattern(ctx) {
  const c = makeCanvas(72, 72);
  const g = c.getContext('2d');
  g.fillStyle = '#d99826';
  g.fillRect(0, 0, 72, 72);
  const tones = ['#fae078', '#b57214', '#ebb53b', '#874c0c', '#ffd666'];
  for (let i = 0; i < 56; i++) {
    g.strokeStyle = tones[i % tones.length];
    g.lineWidth = i % 3 === 0 ? 2.4 : 1.6;
    const x = (i * 23) % 72;
    const y = (i * 31) % 72;
    g.beginPath();
    g.moveTo(x - 14, y - 5);
    g.lineTo(x + 16, y + 6);
    g.stroke();
  }
  return ctx.createPattern(c, 'repeat');
}

function buildParchmentPattern(ctx) {
  const c = makeCanvas(96, 96);
  const g = c.getContext('2d');
  g.fillStyle = '#f6e4be';
  g.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 64; i++) {
    g.fillStyle = i % 2 === 0 ? 'rgba(156, 96, 36, 0.045)' : 'rgba(255, 252, 240, 0.18)';
    g.fillRect((i * 19) % 96, (i * 29) % 96, 8, 5);
  }
  return ctx.createPattern(c, 'repeat');
}

function buildBanquetWallPattern(ctx) {
  const c = makeCanvas(96, 96);
  const g = c.getContext('2d');
  g.fillStyle = '#5c141d';
  g.fillRect(0, 0, 96, 96);
  g.strokeStyle = 'rgba(242, 184, 72, 0.22)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(48, 8); g.lineTo(88, 48); g.lineTo(48, 88); g.lineTo(8, 48);
  g.closePath();
  g.stroke();
  g.fillStyle = 'rgba(242, 184, 72, 0.14)';
  g.beginPath();
  g.arc(48, 48, 7, 0, Math.PI * 2);
  g.fill();
  return ctx.createPattern(c, 'repeat');
}

function buildCobbledDirtPattern(ctx) {
  const c = makeCanvas(144, 72);
  const g = c.getContext('2d');
  g.fillStyle = '#5c2f16';
  g.fillRect(0, 0, 144, 72);
  const stones = [
    [16, 18, 22, 9, '#7a4526'], [58, 16, 26, 10, '#6e3b1e'], [108, 20, 24, 9, '#854c2b'],
    [34, 46, 28, 11, '#733e20'], [84, 48, 24, 10, '#68361b'], [130, 44, 20, 9, '#7d4626'],
  ];
  for (const [sx, sy, rx, ry, col] of stones) {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255, 208, 145, 0.14)';
    g.beginPath();
    g.ellipse(sx - 3, sy - 3, rx * 0.6, ry * 0.4, 0, 0, Math.PI * 2);
    g.fill();
  }
  return ctx.createPattern(c, 'repeat');
}
