// Procedural canvas textures. No external image files are needed.
import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d') };
}

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function toTexture(canvas, { srgb = true, repeat = [1, 1] } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

function wavyLine(g, x0, x1, y0, amp, freq, phase, step = 8) {
  g.beginPath();
  for (let x = x0; x <= x1; x += step) {
    const y = y0 + Math.sin(x * freq + phase) * amp;
    if (x === x0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
}

// Matte woven boucle: bump map plus a subtle colour variation map.
export function weaveTextures() {
  const size = 512;
  const cell = 8;
  const r = rng(11);
  const b = makeCanvas(size, size);
  const m = makeCanvas(size, size);
  b.g.fillStyle = '#7a7a7a';
  b.g.fillRect(0, 0, size, size);
  m.g.fillStyle = '#f0f0f0';
  m.g.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const over = ((x + y) / cell) % 2 === 0;
      const gr = over
        ? b.g.createLinearGradient(x, y, x, y + cell)
        : b.g.createLinearGradient(x, y, x + cell, y);
      const v = 170 + Math.floor(r() * 50);
      gr.addColorStop(0, 'rgb(60,60,60)');
      gr.addColorStop(0.5, `rgb(${v},${v},${v})`);
      gr.addColorStop(1, 'rgb(60,60,60)');
      b.g.fillStyle = gr;
      b.g.fillRect(x, y, cell, cell);
      const l = 222 + Math.floor(r() * 30);
      m.g.fillStyle = `rgb(${l},${l},${l})`;
      m.g.fillRect(x, y, cell, cell);
    }
  }
  // Boucle loops
  for (let i = 0; i < 9000; i++) {
    const x = r() * size;
    const y = r() * size;
    const rad = 0.8 + r() * 1.8;
    const v = 140 + Math.floor(r() * 115);
    b.g.fillStyle = `rgba(${v},${v},${v},0.55)`;
    b.g.beginPath();
    b.g.arc(x, y, rad, 0, Math.PI * 2);
    b.g.fill();
    const l = 200 + Math.floor(r() * 55);
    m.g.fillStyle = `rgba(${l},${l},${l},0.5)`;
    m.g.beginPath();
    m.g.arc(x, y, rad, 0, Math.PI * 2);
    m.g.fill();
  }
  return {
    bump: toTexture(b.c, { srgb: false, repeat: [3, 3] }),
    map: toTexture(m.c, { repeat: [3, 3] }),
  };
}

export function woodTexture() {
  const w = 1024;
  const h = 256;
  const { c, g } = makeCanvas(w, h);
  const r = rng(5);
  g.fillStyle = '#a67c52';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    const dark = r() < 0.6;
    g.strokeStyle = dark
      ? `rgba(92,60,32,${0.08 + r() * 0.18})`
      : `rgba(214,176,128,${0.06 + r() * 0.12})`;
    g.lineWidth = 0.6 + r() * 1.8;
    wavyLine(g, 0, w, r() * h, 2 + r() * 6, 0.004 + r() * 0.01, r() * 6.28);
  }
  return toTexture(c);
}

export function stoneTexture() {
  const s = 512;
  const { c, g } = makeCanvas(s, s);
  const r = rng(9);
  g.fillStyle = '#9a9a96';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 14000; i++) {
    const v = 110 + Math.floor(r() * 90);
    g.fillStyle = `rgba(${v},${v},${v - 4},${0.15 + r() * 0.3})`;
    g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
  }
  return toTexture(c, { repeat: [1, 1] });
}

// Fine directional streaks used as a roughness map for brushed metal.
export function brushedTexture() {
  const s = 512;
  const { c, g } = makeCanvas(s, s);
  const r = rng(17);
  for (let y = 0; y < s; y++) {
    const v = 228 + Math.floor(r() * 27);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, s, 1);
  }
  for (let i = 0; i < 260; i++) {
    const v = 215 + Math.floor(r() * 40);
    g.fillStyle = `rgba(${v},${v},${v},0.6)`;
    g.fillRect(r() * s, r() * s, 40 + r() * 200, 1);
  }
  return toTexture(c, { srgb: false, repeat: [2, 2] });
}

// Dark monocrystalline panel with a fine cell grid.
export function solarTexture() {
  const w = 1024;
  const h = 512;
  const { c, g } = makeCanvas(w, h);
  const r = rng(3);
  g.fillStyle = '#2c333d';
  g.fillRect(0, 0, w, h);
  const cols = 12;
  const rows = 6;
  const pad = 14;
  const gap = 5;
  const cw = (w - pad * 2 - gap * (cols - 1)) / cols;
  const ch = (h - pad * 2 - gap * (rows - 1)) / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = pad + i * (cw + gap);
      const y = pad + j * (ch + gap);
      const base = 18 + Math.floor(r() * 5);
      const gr = g.createLinearGradient(x, y, x + cw, y + ch);
      gr.addColorStop(0, `rgb(${base},${base + 4},${base + 10})`);
      gr.addColorStop(1, `rgb(${base - 3},${base},${base + 6})`);
      g.fillStyle = gr;
      g.fillRect(x, y, cw, ch);
      g.lineWidth = 1;
      g.strokeStyle = 'rgba(120,130,145,0.10)';
      for (let k = 1; k < 14; k++) {
        const yy = Math.round(y + (k * ch) / 14) + 0.5;
        g.beginPath();
        g.moveTo(x, yy);
        g.lineTo(x + cw, yy);
        g.stroke();
      }
      g.strokeStyle = 'rgba(160,168,180,0.4)';
      for (let k = 1; k <= 3; k++) {
        const xx = Math.round(x + (k * cw) / 4) + 0.5;
        g.beginPath();
        g.moveTo(xx, y);
        g.lineTo(xx, y + ch);
        g.stroke();
      }
    }
  }
  const t = toTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Travertine paving: one texture repeat = 2.4m x 2.4m, tiles 1.2m x 0.6m in running bond.
export function travertineTexture(repeat = [1, 1], seed = 21) {
  const s = 1024;
  const { c, g } = makeCanvas(s, s);
  const r = rng(seed);
  const tileW = s / 2;
  const tileH = s / 4;
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? tileW / 2 : 0;
    for (let col = -1; col < 3; col++) {
      const x = col * tileW + off;
      const y = row * tileH;
      const l = 214 + Math.floor(r() * 12);
      g.fillStyle = `rgb(${l},${l - 10},${l - 26})`;
      g.fillRect(x, y, tileW, tileH);
      g.save();
      g.beginPath();
      g.rect(x, y, tileW, tileH);
      g.clip();
      for (let v = 0; v < 26; v++) {
        const dark = r() < 0.55;
        g.strokeStyle = dark
          ? `rgba(160,140,110,${0.05 + r() * 0.12})`
          : `rgba(250,246,238,${0.08 + r() * 0.15})`;
        g.lineWidth = 0.5 + r() * 2.5;
        wavyLine(g, x, x + tileW, y + r() * tileH, r() * 3, 0.01 + r() * 0.01, v, 16);
      }
      for (let p = 0; p < 120; p++) {
        g.fillStyle = `rgba(140,120,95,${0.15 + r() * 0.25})`;
        g.beginPath();
        g.ellipse(x + r() * tileW, y + r() * tileH, 1 + r() * 4, 0.5 + r() * 1.2, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
      g.strokeStyle = 'rgba(150,132,108,0.55)';
      g.lineWidth = 2;
      g.strokeRect(x + 1, y + 1, tileW - 2, tileH - 2);
    }
  }
  return toTexture(c, { repeat });
}

// Soft contact shadow used to ground the chair.
export function contactShadowTexture() {
  const s = 256;
  const { c, g } = makeCanvas(s, s);
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)');
  gr.addColorStop(0.55, 'rgba(0,0,0,0.22)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
