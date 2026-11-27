// Procedural PBR CanvasTexture generator for Three.js materials (100% offline, zero external assets).

import * as THREE from 'three';

function makeTex(w, h, drawFn, repeatX = 1, repeatY = 1, srgb = true) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function createPbrTextures() {
  // 1. Crisp Autumn Carriage Dirt Road & Lush Grass Verges (512x512, zero giant blotches)
  const farmGround = makeTex(512, 512, (g, w, h) => {
    // Rich packed autumn earth road center
    g.fillStyle = '#875024';
    g.fillRect(0, 0, w, h);

    // Lush olive-gold autumn grass verges on left & right shoulders
    g.fillStyle = '#586e26';
    g.fillRect(0, 0, 92, h);
    g.fillRect(w - 92, 0, 92, h);

    // Timber border edging along road shoulders
    g.fillStyle = '#4d2611';
    g.fillRect(88, 0, 6, h);
    g.fillRect(w - 94, 0, 6, h);

    // Subtle wagon-wheel ruts & warm sunlit center crown
    g.fillStyle = 'rgba(255, 198, 120, 0.10)';
    g.fillRect(190, 0, 132, h);
    g.fillStyle = 'rgba(56, 26, 9, 0.22)';
    g.fillRect(148, 0, 18, h);
    g.fillRect(w - 166, 0, 18, h);

    // Fine pebble & soil grain on the dirt road
    const earthTones = ['#9e612e', '#6e3d18', '#b37237', '#78441c'];
    for (let i = 0; i < 420; i++) {
      g.fillStyle = earthTones[i % earthTones.length];
      const x = 98 + ((i * 73) % (w - 196));
      const y = (i * 97) % h;
      g.fillRect(x, y, 3 + (i % 3), 2 + (i % 3));
    }

    // Fine grass blades on outer verges
    const grassTones = ['#6f872f', '#46591c', '#8fa138', '#ab8b29'];
    for (let i = 0; i < 320; i++) {
      g.fillStyle = grassTones[i % grassTones.length];
      const leftSide = i % 2 === 0;
      const gx = leftSide ? (i * 29) % 84 : w - 88 + ((i * 31) % 84);
      const gy = (i * 67) % h;
      g.fillRect(gx, gy, 2, 6 + (i % 4));
    }

    // Tiny crisp fallen crimson & gold maple leaves
    const leaves = ['#d4321c', '#f5a627', '#e3641b'];
    for (let i = 0; i < 64; i++) {
      g.fillStyle = leaves[i % leaves.length];
      g.fillRect((i * 83) % w, (i * 113) % h, 4, 3);
    }
  }, 1, 10);

  // 2. Glossy Cream & Terracotta Checkered Kitchen Floor
  const kitchenTile = makeTex(256, 256, (g) => {
    const s = 64;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cream = (r + c) % 2 === 0;
        g.fillStyle = cream ? '#f4e5c8' : '#a13820';
        g.fillRect(c * s, r * s, s, s);
        g.fillStyle = cream ? 'rgba(255,255,255,0.35)' : 'rgba(255,195,140,0.16)';
        g.fillRect(c * s + 3, r * s + 3, s - 6, 6);
        g.strokeStyle = 'rgba(42, 18, 10, 0.35)';
        g.lineWidth = 3;
        g.strokeRect(c * s, r * s, s, s);
      }
    }
  }, 3.4, 28);

  // 3. Weathered Oak & Cedar Barn Planks
  const woodPlank = makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#693619';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) {
      g.fillStyle = y % 8 === 0 ? 'rgba(30, 12, 5, 0.24)' : 'rgba(255, 204, 136, 0.08)';
      g.fillRect(0, y, w, 3);
    }
    g.strokeStyle = '#2b1207';
    g.lineWidth = 4;
    for (let x = 0; x <= w; x += 64) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
    }
  }, 4, 22);

  // 4. Warm Rustic Hearth Brick Wall
  const brickWall = makeTex(256, 128, (g) => {
    g.fillStyle = '#3d1c11';
    g.fillRect(0, 0, 256, 128);
    const cols = ['#8c3b20', '#752e18', '#9e4728', '#6b2915'];
    for (let row = 0; row < 4; row++) {
      const y = row * 32 + 3;
      const off = (row % 2) * 32;
      for (let col = -1; col < 5; col++) {
        g.fillStyle = cols[(row + col + 4) % cols.length];
        g.fillRect(col * 64 + off + 3, y, 58, 26);
        g.fillStyle = 'rgba(255, 212, 155, 0.14)';
        g.fillRect(col * 64 + off + 4, y + 1, 56, 4);
      }
    }
  }, 14, 2);

  // 5. Royal Banquet Burgundy & Gold Runner Floor
  const banquetFloor = makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#472010';
    g.fillRect(0, 0, w, h);
    // Plush royal crimson center carpet
    g.fillStyle = '#7c1722';
    g.fillRect(36, 0, w - 72, h);
    g.fillStyle = '#ebb03b';
    g.fillRect(36, 0, 8, h);
    g.fillRect(w - 44, 0, 8, h);
    g.strokeStyle = 'rgba(255, 206, 98, 0.25)';
    g.lineWidth = 3;
    for (let y = 0; y < h; y += 64) {
      g.beginPath();
      g.moveTo(w * 0.5, y + 8);
      g.lineTo(w - 64, y + 32);
      g.lineTo(w * 0.5, y + 56);
      g.lineTo(64, y + 32);
      g.closePath();
      g.stroke();
    }
  }, 1, 18);

  // 6. Golden Woven Straw / Hay Texture
  const hayWeave = makeTex(128, 128, (g, w, h) => {
    g.fillStyle = '#db9b27';
    g.fillRect(0, 0, w, h);
    const strands = ['#fae075', '#b57112', '#f0b93a', '#8c500b'];
    for (let i = 0; i < 90; i++) {
      g.strokeStyle = strands[i % strands.length];
      g.lineWidth = 3;
      const x = (i * 29) % w;
      const y = (i * 41) % h;
      g.beginPath(); g.moveTo(x - 16, y - 6); g.lineTo(x + 18, y + 7); g.stroke();
    }
  }, 2, 2);

  // 7. Festive Red & Cream Gingham Tablecloth
  const gingham = makeTex(128, 128, (g) => {
    g.fillStyle = '#fff5e0';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(204, 42, 28, 0.55)';
    for (let i = 0; i < 128; i += 32) {
      g.fillRect(i, 0, 16, 128);
      g.fillRect(0, i, 128, 16);
    }
  }, 2, 2);

  // 8. Red Lumberjack Plaid Flannel
  const plaid = makeTex(128, 128, (g) => {
    g.fillStyle = '#c42b1c';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(28, 12, 10, 0.45)';
    for (let i = 0; i < 128; i += 32) {
      g.fillRect(i, 0, 12, 128);
      g.fillRect(0, i, 128, 12);
    }
  }, 2, 2);

  // 9. Parchment UI Pattern
  const parchmentCanvas = document.createElement('canvas');
  parchmentCanvas.width = 96;
  parchmentCanvas.height = 96;
  const pCtx = parchmentCanvas.getContext('2d');
  pCtx.fillStyle = '#f6e4be';
  pCtx.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 60; i++) {
    pCtx.fillStyle = i % 2 === 0 ? 'rgba(150, 92, 34, 0.05)' : 'rgba(255, 252, 240, 0.18)';
    pCtx.fillRect((i * 19) % 96, (i * 29) % 96, 8, 5);
  }

  // 10. Painted Golden-Hour Thanksgiving Sunset Sky Dome
  const skyAutumn = makeTex(1024, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#36182c');
    grad.addColorStop(0.24, '#8a2f2b');
    grad.addColorStop(0.42, '#db6525');
    grad.addColorStop(0.54, '#ffb94d');
    grad.addColorStop(0.64, '#ffe596');
    grad.addColorStop(1.0, '#7a451c');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    // Radiant golden harvest sun near +Z horizon (u ≈ 0.25 and 0.75 on equirectangular dome)
    for (const sx of [w * 0.25, w * 0.75]) {
      const sunGlow = g.createRadialGradient(sx, h * 0.46, 6, sx, h * 0.46, 96);
      sunGlow.addColorStop(0, 'rgba(255, 252, 224, 0.96)');
      sunGlow.addColorStop(0.3, 'rgba(255, 212, 112, 0.62)');
      sunGlow.addColorStop(1, 'rgba(255, 140, 42, 0)');
      g.fillStyle = sunGlow;
      g.beginPath();
      g.arc(sx, h * 0.46, 96, 0, Math.PI * 2);
      g.fill();
    }

    // Painterly coral & gold sunset clouds across upper sky band
    for (let i = 0; i < 22; i++) {
      const cx = (i * 97) % w;
      const cy = h * (0.24 + (i % 5) * 0.048);
      const cw = 54 + (i % 4) * 24;
      const ch = 12 + (i % 3) * 6;
      g.fillStyle = i % 2 === 0 ? 'rgba(255, 214, 138, 0.34)' : 'rgba(235, 108, 66, 0.28)';
      g.beginPath();
      g.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
      g.fill();
    }
  }, 1, 1);
  skyAutumn.wrapS = THREE.RepeatWrapping;
  skyAutumn.wrapT = THREE.ClampToEdgeWrapping;

  // 11. Starry Harvest-Moon Twilight Sky Dome for Grand Banquet Finale
  const skyMoonlit = makeTex(1024, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#0f0b21');
    grad.addColorStop(0.28, '#231c47');
    grad.addColorStop(0.48, '#543566');
    grad.addColorStop(0.58, '#bd7246');
    grad.addColorStop(1.0, '#2e1810');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    g.fillStyle = 'rgba(255, 248, 220, 0.85)';
    for (let i = 0; i < 140; i++) {
      const sx = (i * 79) % w;
      const sy = (i * 43) % Math.floor(h * 0.44);
      g.fillRect(sx, sy, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
    }

    for (const mx of [w * 0.26, w * 0.76]) {
      const mGlow = g.createRadialGradient(mx, h * 0.34, 8, mx, h * 0.34, 68);
      mGlow.addColorStop(0, 'rgba(255, 250, 224, 0.96)');
      mGlow.addColorStop(0.35, 'rgba(255, 218, 148, 0.45)');
      mGlow.addColorStop(1, 'rgba(255, 190, 110, 0)');
      g.fillStyle = mGlow;
      g.beginPath();
      g.arc(mx, h * 0.34, 68, 0, Math.PI * 2);
      g.fill();
    }
  }, 1, 1);
  skyMoonlit.wrapS = THREE.RepeatWrapping;
  skyMoonlit.wrapT = THREE.ClampToEdgeWrapping;

  return {
    farmGround,
    kitchenTile,
    woodPlank,
    brickWall,
    banquetFloor,
    hayWeave,
    gingham,
    plaid,
    parchmentCanvas,
    skyAutumn,
    skyMoonlit,
  };
}
