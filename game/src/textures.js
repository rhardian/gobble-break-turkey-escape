// Rich procedural painted PBR CanvasTextures (diffuse & detail maps, 100% offline, zero external assets).

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
  // 1. Hand-Painted Scalloped Chestnut & Bronze Turkey Plumage
  const turkeyPlumage = makeTex(256, 256, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#c26023');
    bg.addColorStop(0.55, '#8c3716');
    bg.addColorStop(1, '#5e200c');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const rows = 8;
    const cols = 8;
    const rw = w / cols;
    const rh = h / rows;
    for (let r = 0; r <= rows; r++) {
      const off = (r % 2) * (rw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const cx = c * rw + off;
        const cy = r * rh;
        g.fillStyle = r < 3 ? '#cf6f29' : r < 6 ? '#9c4019' : '#732910';
        g.beginPath();
        g.arc(cx, cy, rw * 0.56, 0, Math.PI);
        g.fill();
        g.strokeStyle = 'rgba(255, 224, 165, 0.24)';
        g.lineWidth = 2;
        g.stroke();
        g.strokeStyle = 'rgba(38, 13, 5, 0.42)';
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(cx, cy + 2, rw * 0.56, 0.15, Math.PI - 0.15);
        g.stroke();
      }
    }
  }, 2, 2);

  // 2. Autumn Farmyard Cobblestone & Sunlit Dirt Lane (runs along +X!)
  const farmGround = makeTex(512, 512, (g, w, h) => {
    // Rich sunlit harvest earth center
    g.fillStyle = '#915726';
    g.fillRect(0, 0, w, h);

    // Lush mossy-golden autumn grass edges (top=back Z, bottom=front Z)
    const topGrass = g.createLinearGradient(0, 0, 0, 108);
    topGrass.addColorStop(0, '#4c6620');
    topGrass.addColorStop(1, '#708729');
    g.fillStyle = topGrass;
    g.fillRect(0, 0, w, 104);

    const botGrass = g.createLinearGradient(0, h - 104, 0, h);
    botGrass.addColorStop(0, '#708729');
    botGrass.addColorStop(1, '#48611e');
    g.fillStyle = botGrass;
    g.fillRect(0, h - 104, w, 104);

    // Soft cobblestone & sunlit highlight strip along center path
    g.fillStyle = 'rgba(255, 212, 138, 0.15)';
    g.fillRect(0, 196, w, 120);
    g.fillStyle = 'rgba(64, 30, 10, 0.22)';
    g.fillRect(0, 148, w, 16);
    g.fillRect(0, h - 164, w, 16);

    // Subtle stepping cobbles & soil grain
    const stones = ['#a86832', '#7a451c', '#b87a3d', '#824b1e'];
    for (let i = 0; i < 380; i++) {
      g.fillStyle = stones[i % stones.length];
      const x = (i * 89) % w;
      const y = 112 + ((i * 67) % (h - 224));
      g.fillRect(x, y, 6 + (i % 5), 4 + (i % 4));
    }

    // Fine grass tufts along verges
    const blades = ['#89a135', '#3d5418', '#b89a2c'];
    for (let i = 0; i < 280; i++) {
      g.fillStyle = blades[i % blades.length];
      const x = (i * 53) % w;
      const y = i % 2 === 0 ? (i * 31) % 98 : h - 98 + ((i * 29) % 94);
      g.fillRect(x, y, 5, 3);
    }

    // Crisp scattered fallen autumn maple leaves
    const leaves = ['#d93218', '#f5a623', '#e8681a', '#ffd04d'];
    for (let i = 0; i < 60; i++) {
      g.fillStyle = leaves[i % leaves.length];
      g.fillRect((i * 107) % w, (i * 71) % h, 5, 4);
    }
  }, 16, 1);

  // 3. Glossy Cream & Terracotta Checkered Kitchen Floor
  const kitchenTile = makeTex(256, 256, (g) => {
    const s = 64;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cream = (r + c) % 2 === 0;
        g.fillStyle = cream ? '#f7ebd2' : '#ad3b21';
        g.fillRect(c * s, r * s, s, s);
        // Glossy ceramic bevel highlight
        g.fillStyle = cream ? 'rgba(255,255,255,0.46)' : 'rgba(255,205,150,0.22)';
        g.fillRect(c * s + 3, r * s + 3, s - 6, 7);
        g.fillStyle = 'rgba(42, 16, 8, 0.14)';
        g.fillRect(c * s + 3, r * s + s - 7, s - 6, 4);
        g.strokeStyle = 'rgba(46, 18, 10, 0.42)';
        g.lineWidth = 3;
        g.strokeRect(c * s, r * s, s, s);
      }
    }
  }, 30, 3.2);

  // 4. Warm Pegged Oak Timber Barn Planks (planks run along +X!)
  const woodPlank = makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#733b1c';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) {
      g.fillStyle = y % 128 === 0 ? '#7d411f' : '#693417';
      g.fillRect(0, y, w, 62);
      for (let gy = y + 6; gy < y + 58; gy += 6) {
        g.fillStyle = gy % 12 === 0 ? 'rgba(30,12,5,0.18)' : 'rgba(255,208,145,0.09)';
        g.fillRect(0, gy, w, 2);
      }
      g.fillStyle = '#2e1307';
      g.fillRect(0, y + 62, w, 3);
    }
  }, 24, 3);

  // 5. Warm Rustic Hearth Brick Kitchen Wall
  const brickWall = makeTex(256, 256, (g) => {
    g.fillStyle = '#472214';
    g.fillRect(0, 0, 256, 256);
    const cols = ['#9c4123', '#823319', '#b04e2a', '#752b15', '#a64826'];
    for (let row = 0; row < 8; row++) {
      const y = row * 32 + 3;
      const off = (row % 2) * 32;
      for (let col = -1; col < 5; col++) {
        g.fillStyle = cols[(row * 3 + col + 8) % cols.length];
        g.fillRect(col * 64 + off + 3, y, 58, 26);
        g.fillStyle = 'rgba(255, 220, 168, 0.18)';
        g.fillRect(col * 64 + off + 4, y + 1, 56, 4);
        g.fillStyle = 'rgba(34, 12, 5, 0.22)';
        g.fillRect(col * 64 + off + 4, y + 22, 56, 4);
      }
    }
  }, 20, 2.2);

  // 6. Royal Banquet Crimson & Gold Runner Floor (runs along +X!)
  const banquetFloor = makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#4f2412';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#8a1724';
    g.fillRect(0, 44, w, h - 88);
    g.fillStyle = '#f2ba3d';
    g.fillRect(0, 44, w, 9);
    g.fillRect(0, h - 53, w, 9);
    g.strokeStyle = 'rgba(255, 214, 112, 0.32)';
    g.lineWidth = 3;
    for (let x = 0; x < w; x += 64) {
      g.beginPath();
      g.moveTo(x + 8, h * 0.5);
      g.lineTo(x + 32, 68);
      g.lineTo(x + 56, h * 0.5);
      g.lineTo(x + 32, h - 68);
      g.closePath();
      g.stroke();
    }
  }, 18, 1);

  // 7. Golden Woven Straw / Hay Texture
  const hayWeave = makeTex(128, 128, (g, w, h) => {
    g.fillStyle = '#e0a028';
    g.fillRect(0, 0, w, h);
    const strands = ['#fce37c', '#ba7412', '#f2bd3d', '#94550b'];
    for (let i = 0; i < 110; i++) {
      g.strokeStyle = strands[i % strands.length];
      g.lineWidth = 2.6;
      const x = (i * 29) % w;
      const y = (i * 41) % h;
      g.beginPath();
      g.moveTo(x - 16, y - 5);
      g.lineTo(x + 18, y + 6);
      g.stroke();
    }
  }, 2, 2);

  // 8. Festive Red & Cream Gingham Tablecloth / Apron
  const gingham = makeTex(128, 128, (g) => {
    g.fillStyle = '#fff6e3';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(209, 44, 29, 0.58)';
    for (let i = 0; i < 128; i += 32) {
      g.fillRect(i, 0, 16, 128);
      g.fillRect(0, i, 128, 16);
    }
  }, 2.2, 2.2);

  // 9. Red Lumberjack Buffalo Plaid Flannel
  const plaid = makeTex(128, 128, (g) => {
    g.fillStyle = '#cc2e1d';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(24, 10, 8, 0.46)';
    for (let i = 0; i < 128; i += 32) {
      g.fillRect(i, 0, 14, 128);
      g.fillRect(0, i, 128, 14);
    }
    g.strokeStyle = 'rgba(255, 228, 168, 0.25)';
    g.lineWidth = 2;
    for (let i = 16; i < 128; i += 32) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
    }
  }, 2.5, 2.5);

  // 10. Woven Straw Hat Texture
  const strawHat = makeTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f0bf54';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      g.fillStyle = y % 16 === 0 ? 'rgba(176, 114, 24, 0.35)' : 'rgba(255, 244, 196, 0.3)';
      g.fillRect(0, y, w, 4);
    }
  }, 3, 2);

  // 11. Brass "450°F" Oven Thermometer Dial Face
  const ovenDial = makeTex(256, 128, (g, w, h) => {
    g.fillStyle = '#240f08';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#d92814';
    g.fillRect(8, 8, w - 16, h - 16);
    g.strokeStyle = '#ffcf54';
    g.lineWidth = 7;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#fff9de';
    g.font = '900 66px "Trebuchet MS", Impact, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('450°F', w * 0.5, h * 0.54);
  }, 1, 1);

  // 12. Warm Parchment UI Pattern
  const parchmentCanvas = document.createElement('canvas');
  parchmentCanvas.width = 96;
  parchmentCanvas.height = 96;
  const pCtx = parchmentCanvas.getContext('2d');
  pCtx.fillStyle = '#f7e6c2';
  pCtx.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 64; i++) {
    pCtx.fillStyle = i % 2 === 0 ? 'rgba(155, 96, 36, 0.055)' : 'rgba(255, 253, 242, 0.22)';
    pCtx.fillRect((i * 19) % 96, (i * 29) % 96, 8, 5);
  }

  return {
    turkeyPlumage,
    farmGround,
    kitchenTile,
    woodPlank,
    brickWall,
    banquetFloor,
    hayWeave,
    gingham,
    plaid,
    strawHat,
    ovenDial,
    parchmentCanvas,
  };
}
