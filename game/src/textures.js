// Procedural offscreen surface textures (zero external images, crisp 60fps CanvasPattern cache).

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function createSurfacePatterns(ctx) {
  return {
    woodPlank: buildWoodPattern(ctx),
    kitchenTile: buildKitchenTilePattern(ctx),
    brickWall: buildBrickPattern(ctx),
    hayWeave: buildHayPattern(ctx),
    parchment: buildParchmentPattern(ctx),
    banquetCarpet: buildBanquetCarpetPattern(ctx),
  };
}

function buildWoodPattern(ctx) {
  const c = makeCanvas(128, 64);
  const g = c.getContext('2d');
  g.fillStyle = '#5e3118';
  g.fillRect(0, 0, 128, 64);

  // Subtle horizontal wood grain streaks
  for (let y = 0; y < 64; y += 3) {
    g.fillStyle = y % 6 === 0 ? 'rgba(34, 14, 6, 0.22)' : 'rgba(255, 198, 130, 0.06)';
    g.fillRect(0, y, 128, 2);
  }
  // Plank seams and nail heads
  g.strokeStyle = 'rgba(28, 11, 5, 0.65)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 32);
  g.lineTo(128, 32);
  g.moveTo(64, 0);
  g.lineTo(64, 32);
  g.moveTo(16, 32);
  g.lineTo(16, 64);
  g.stroke();

  g.fillStyle = 'rgba(26, 12, 6, 0.6)';
  for (const [nx, ny] of [[58, 8], [58, 24], [70, 8], [70, 24], [10, 40], [22, 56]]) {
    g.beginPath();
    g.arc(nx, ny, 2, 0, Math.PI * 2);
    g.fill();
  }
  return ctx.createPattern(c, 'repeat');
}

function buildKitchenTilePattern(ctx) {
  const c = makeCanvas(96, 96);
  const g = c.getContext('2d');
  const s = 48;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const light = (row + col) % 2 === 0;
      g.fillStyle = light ? '#efe0c2' : '#9c3e26';
      g.fillRect(col * s, row * s, s, s);
      // Warm ceramic bevel highlight
      g.fillStyle = light ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 196, 140, 0.14)';
      g.fillRect(col * s + 2, row * s + 2, s - 4, 4);
      g.fillStyle = 'rgba(38, 16, 9, 0.16)';
      g.fillRect(col * s + 2, row * s + s - 5, s - 4, 3);
    }
  }
  g.strokeStyle = 'rgba(48, 22, 12, 0.35)';
  g.lineWidth = 2;
  g.strokeRect(0, 0, 96, 96);
  g.beginPath();
  g.moveTo(48, 0);
  g.lineTo(48, 96);
  g.moveTo(0, 48);
  g.lineTo(96, 48);
  g.stroke();
  return ctx.createPattern(c, 'repeat');
}

function buildBrickPattern(ctx) {
  const c = makeCanvas(96, 48);
  const g = c.getContext('2d');
  g.fillStyle = '#4e2416';
  g.fillRect(0, 0, 96, 48);

  const bricks = [
    [2, 2, 44, 20, '#78341e'],
    [50, 2, 44, 20, '#6c2d1a'],
    [-22, 26, 44, 20, '#6e2f1b'],
    [26, 26, 44, 20, '#813a21'],
    [74, 26, 44, 20, '#6e2f1b'],
  ];
  for (const [x, y, w, h, col] of bricks) {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255, 190, 120, 0.08)';
    g.fillRect(x, y, w, 4);
  }
  return ctx.createPattern(c, 'repeat');
}

function buildHayPattern(ctx) {
  const c = makeCanvas(64, 64);
  const g = c.getContext('2d');
  g.fillStyle = '#d99a2b';
  g.fillRect(0, 0, 64, 64);
  const strands = ['#f4c652', '#b97719', '#e5ad3a', '#8c5310'];
  for (let i = 0; i < 42; i++) {
    g.strokeStyle = strands[i % strands.length];
    g.lineWidth = 2;
    const x = (i * 19) % 64;
    const y = (i * 29) % 64;
    g.beginPath();
    g.moveTo(x - 10, y - 4);
    g.lineTo(x + 14, y + 6);
    g.stroke();
  }
  return ctx.createPattern(c, 'repeat');
}

function buildParchmentPattern(ctx) {
  const c = makeCanvas(64, 64);
  const g = c.getContext('2d');
  g.fillStyle = '#f4dfb8';
  g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 36; i++) {
    g.fillStyle = i % 2 === 0 ? 'rgba(148, 92, 34, 0.05)' : 'rgba(255, 252, 240, 0.14)';
    g.fillRect((i * 17) % 64, (i * 23) % 64, 6, 4);
  }
  return ctx.createPattern(c, 'repeat');
}

function buildBanquetCarpetPattern(ctx) {
  const c = makeCanvas(80, 64);
  const g = c.getContext('2d');
  g.fillStyle = '#6e1922';
  g.fillRect(0, 0, 80, 64);
  g.strokeStyle = 'rgba(245, 184, 61, 0.26)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(40, 6);
  g.lineTo(72, 32);
  g.lineTo(40, 58);
  g.lineTo(8, 32);
  g.closePath();
  g.stroke();
  return ctx.createPattern(c, 'repeat');
}
