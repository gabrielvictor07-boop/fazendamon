'use strict';
// ================= PIXEL ART PROCEDURAL =================
// Regras: luz vindo de cima-esquerda; rampas de cor com desvio de matiz (claro puxa pro amarelo, escuro pro azul/roxo);
// contorno escuro COLORIDO (derivado da cor vizinha, nunca preto puro); tudo virado pra DIREITA e espelhado pra esquerda.
function mkc(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').imageSmoothingEnabled = false; return c; }
const _rgb = new Map();
function hexRGB(h) { let v = _rgb.get(h); if (v) return v; let s = h.replace('#', ''); if (s.length === 3) s = s.split('').map(c => c + c).join(''); const n = parseInt(s, 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; _rgb.set(h, v); return v; }
const toHex = (r, g, b) => '#' + [r, g, b].map(v => clamp(R(v), 0, 255).toString(16).padStart(2, '0')).join('');
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hsl2hex(h, s, l) { h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1); const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; let r, g, b; if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x]; return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255); }
const hueToward = (h, target, amt) => { let d = ((target - h + 540) % 360) - 180; return h + d * amt; };
// rampa de 5 tons a partir de uma cor base
const _ramp = new Map();
function ramp(hex) {
  let v = _ramp.get(hex); if (v) return v;
  const [h, s, l] = rgb2hsl(...hexRGB(hex));
  v = {
    hi: hsl2hex(hueToward(h, 55, 0.25), s * 0.85, Math.min(0.94, l + 0.2)),
    l: hsl2hex(hueToward(h, 55, 0.12), s * 0.95, Math.min(0.9, l + 0.1)),
    m: hex,
    s: hsl2hex(hueToward(h, 250, 0.12), Math.min(1, s * 1.05 + 0.03), l - 0.12),
    d: hsl2hex(hueToward(h, 260, 0.22), Math.min(1, s * 1.05 + 0.05), l - 0.24),
  };
  _ramp.set(hex, v); return v;
}
function mix(a, b, t) { const A = hexRGB(a), B = hexRGB(b); return toHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
const _dk = new Map();
function outlineOf(c) { let v = _dk.get(c); if (v) return v; const [h, s, l] = rgb2hsl(...hexRGB(c)); v = hsl2hex(hueToward(h, 270, 0.35), Math.min(0.6, s * 0.7 + 0.1), Math.min(0.2, l * 0.28)); _dk.set(c, v); return v; }

class PB {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return; this.d[y * this.w + x] = c; }
  get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.d[y * this.w + x]; }
  ell(cx, cy, rx, ry, fn) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny <= 1) { const c = typeof fn === 'function' ? fn(nx, ny, x, y) : fn; if (c) this.set(x, y, c); }
    }
  }
  // elipse girada
  ellR(cx, cy, rx, ry, ang, fn) {
    const co = Math.cos(ang), si = Math.sin(ang), M = Math.max(rx, ry) + 1;
    for (let y = Math.floor(cy - M); y <= Math.ceil(cy + M); y++) for (let x = Math.floor(cx - M); x <= Math.ceil(cx + M); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = (dx * co + dy * si) / rx, v = (-dx * si + dy * co) / ry;
      if (u * u + v * v <= 1) { const c = typeof fn === 'function' ? fn(u, v, x, y) : fn; if (c) this.set(x, y, c); }
    }
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, typeof c === 'function' ? c(i, j) : c); }
  line(x0, y0, x1, y1, c) {
    x0 = R(x0); y0 = R(y0); x1 = R(x1); y1 = R(y1);
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (; ;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  // traço grosso entre pontos (raio r); fn(t) dá a cor ao longo do traço
  thick(pts, r, fn) {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx2, by2] = pts[i], L = Math.max(1, Math.hypot(bx2 - ax, by2 - ay) * 2);
      for (let k = 0; k <= L; k++) { const t = k / L, x = lerp(ax, bx2, t), y = lerp(ay, by2, t), tt = (i - 1 + t) / (pts.length - 1), rr = typeof r === 'function' ? r(tt) : r; this.ell(x, y, rr, rr, typeof fn === 'function' ? fn(tt) : fn); }
    }
  }
  tri(ax, ay, bx2, by2, cx2, cy2, fn) {
    const x0 = Math.floor(Math.min(ax, bx2, cx2)), x1 = Math.ceil(Math.max(ax, bx2, cx2)), y0 = Math.floor(Math.min(ay, by2, cy2)), y1 = Math.ceil(Math.max(ay, by2, cy2));
    const ar = (bx2 - ax) * (cy2 - ay) - (cx2 - ax) * (by2 - ay); if (!ar) return;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5, w0 = ((bx2 - px) * (cy2 - py) - (cx2 - px) * (by2 - py)) / ar, w1 = ((cx2 - px) * (ay - py) - (ax - px) * (cy2 - py)) / ar, w2 = 1 - w0 - w1;
      if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) this.set(x, y, typeof fn === 'function' ? fn(x, y) : fn);
    }
  }
  ascii(rows, pal, ox = 0, oy = 0) { rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) this.set(ox + x, oy + y, c); } }); }
  // contorno colorido: pixel vazio vizinho de um cheio vira a versão escura daquela cor
  outline(fixed) {
    const s = this.d.slice(), w = this.w, h = this.h;
    const g = (x, y) => x >= 0 && y >= 0 && x < w && y < h ? s[y * w + x] : null;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (s[y * w + x]) continue;
      const n = g(x, y - 1) || g(x - 1, y) || g(x + 1, y) || g(x, y + 1);
      if (n) this.d[y * w + x] = fixed || outlineOf(n);
    }
    return this;
  }
  canvas(map) {
    const c = mkc(this.w, this.h), x = c.getContext('2d'), id = x.createImageData(this.w, this.h);
    for (let i = 0; i < this.d.length; i++) { let col = this.d[i]; if (!col) continue; if (map) col = map(col); const [r, g, b] = hexRGB(col); id.data[i * 4] = r; id.data[i * 4 + 1] = g; id.data[i * 4 + 2] = b; id.data[i * 4 + 3] = 255; }
    x.putImageData(id, 0, 0); return c;
  }
}
function flipCanvas(src) { const c = mkc(src.width, src.height), x = c.getContext('2d'); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c; }
// sprite com variantes normal / espelhado / branco (flash de dano)
function sprite(pb, ax, ay, noFlash) {
  const n = pb.canvas(), o = { c: n, f: flipCanvas(n), ax: ax ?? Math.floor(pb.w / 2), ay: ay ?? pb.h - 1, W: pb.w, H: pb.h };
  if (!noFlash) { o.w = pb.canvas(() => '#ffffff'); o.wf = flipCanvas(o.w); }
  return o;
}
function drawSpr(ctx, s, x, y, o = {}) {
  let img = o.flash && s.w ? (o.flip ? s.wf : s.w) : (o.flip ? s.f : s.c);
  const sx = o.sx ?? 1, sy = o.sy ?? 1;
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (sx === 1 && sy === 1) ctx.drawImage(img, R(x - (o.flip ? s.W - 1 - s.ax : s.ax)), R(y - s.ay));
  else { ctx.save(); ctx.translate(R(x), R(y)); ctx.scale(sx, sy); ctx.drawImage(img, -(o.flip ? s.W - 1 - s.ax : s.ax), -s.ay); ctx.restore(); }
  if (o.alpha !== undefined) ctx.globalAlpha = 1;
}
// sombreamento de volume para elipses (5 tons)
function shader(C, o = {}) {
  return (nx, ny) => {
    if (o.belly && ny > (o.bellyY ?? 0.3) && Math.abs(nx - (o.bellyX || 0)) < (o.bellyW ?? 0.6)) return ny > 0.78 ? o.belly.s : o.belly.m;
    const l = -nx * 0.45 - ny * 0.9;
    if (l > 0.7) return C.hi; if (l > 0.3) return C.l; if (ny > 0.62 || l < -0.8) return C.d; if (ny > 0.25 || l < -0.35) return C.s; return C.m;
  };
}
function eye(b, x, y, col = '#1c1424', big) {
  b.set(x, y, col); b.set(x, y + 1, col); if (big) { b.set(x + 1, y, col); b.set(x + 1, y + 1, col); }
  b.set(x, y, '#ffffff');
}
// pernas de quadrúpede: as de trás (índices ímpares) um tom mais escuras; passo diagonal
function legs(b, xs, top, len, w, C, f, pose, o = {}) {
  const off = pose === 'walk' ? [[1, -1, -1, 1], [0, 0, 0, 0], [-1, 1, 1, -1], [0, 0, 0, 0]][f] : [0, 0, 0, 0];
  const lift = pose === 'walk' ? [[0, 1, 1, 0], [0, 0, 0, 0], [1, 0, 0, 1], [0, 0, 0, 0]][f] : [0, 0, 0, 0];
  xs.forEach((x, i) => {
    const far = i % 2 === 1, lx = x + off[i], l = len - lift[i];
    b.rect(lx, top, w, l, (ii, jj) => far ? (ii === 0 ? C.s : C.d) : (ii === 0 ? C.l : (ii === w - 1 ? C.s : C.m)));
    if (o.foot) b.rect(lx, top + l - 1, w, 1, far ? o.foot.s : o.foot.m);
    if (o.sock) b.rect(lx, top + l - o.sock.n, w, o.sock.n - (o.foot ? 1 : 0), far ? o.sock.C.d : o.sock.C.m);
  });
}
const bobOf = (f, pose) => pose === 'walk' ? [0, -1, 0, -1][f] : (f === 1 ? 1 : 0);

// ================= CRIATURAS (11) =================
const CR = {};
CR.faisca = (f, pose) => {
  const b = new PB(30, 23), Y = ramp('#f2c02c'), Br = ramp('#8a5428'), oy = bobOf(f, pose);
  // cauda em raio (atrás)
  b.thick([[8, 14 + oy], [4, 10 + oy], [8, 8 + oy], [3, 2 + oy]], t => t < 0.2 ? 1.1 : 1.3, t => t < 0.18 ? Br.m : (t > 0.75 ? Y.l : Y.m));
  b.thick([[8, 8 + oy], [11, 5 + oy]], 0.9, Y.l);
  legs(b, [10, 12, 18, 20], 17 + oy, 4 - oy, 2, Y, f, pose, { foot: Br });
  b.ell(15, 14 + oy, 7.2, 4.2, shader(Y, { belly: ramp('#fbe6a6'), bellyY: 0.35, bellyX: 0.25 }));
  // listras marrons no dorso
  [[12, 10], [15, 10]].forEach(([x, y]) => { b.set(x, y + oy, Br.m); b.set(x, y + 1 + oy, Br.s); b.set(x + 1, y + oy, Br.s); });
  b.ell(22.5, 10 + oy, 4, 3.6, shader(Y));
  b.ell(26, 11.6 + oy, 2, 1.5, (nx, ny) => ny < -0.2 ? Y.l : Y.m);
  b.set(27, 11 + oy, '#2a1820');
  // orelhas longas com ponta preta
  b.tri(19, 8 + oy, 21.5, 7.5 + oy, 17, 0 + oy, (x, y) => y < 3 + oy ? '#2a1c24' : (x < 19 ? Y.l : Y.m));
  b.tri(22, 7.5 + oy, 24.5, 7.5 + oy, 24, 0 + oy, (x, y) => y < 3 + oy ? '#2a1c24' : (x > 23 ? Y.s : Y.m));
  b.set(20, 6 + oy, '#e8a080'); b.set(23, 5 + oy, '#e8a080');
  b.ell(24, 12.5 + oy, 1.3, 1.1, '#e24a3a'); b.set(23, 12 + oy, '#ff7a6a');
  eye(b, 24, 9 + oy, '#1c1424');
  b.set(25, 13 + oy, '#8a3020');
  return b.outline();
};
CR.relampago = (f, pose) => {
  const b = new PB(44, 33), Y = ramp('#eeb52a'), Br = ramp('#6e3e22'), oy = bobOf(f, pose);
  b.thick([[11, 17 + oy], [6, 12 + oy], [11, 9 + oy], [4, 1 + oy]], t => 1.2 + t * 0.9, t => t < 0.15 ? Br.m : (t > 0.7 ? Y.hi : Y.l));
  b.thick([[11, 9 + oy], [15, 4 + oy]], 1, Y.l);
  legs(b, [13, 15, 25, 27], 21 + oy, 9 - oy, 2, Y, f, pose, { sock: { n: 3, C: Br } });
  b.ell(20, 18 + oy, 10.5, 5, shader(Y, { belly: ramp('#f8e0a0'), bellyY: 0.4, bellyX: 0.2, bellyW: 0.7 }));
  // crina elétrica em zigue-zague
  for (let x = 13; x <= 29; x += 3) { const t = 13 + oy - Math.round(Math.sin((x - 12) / 20 * Math.PI) * 1.5); b.tri(x - 1.5, t + 1, x + 1.5, t + 1, x - 2.5, t - 3, x > 24 ? Y.hi : Y.l); }
  [[17, 15], [21, 14], [25, 15]].forEach(([x, y]) => { b.line(x, y + oy, x + 1, y + 3 + oy, Br.s); });
  b.ell(30, 13 + oy, 3.2, 5, shader(Y));
  b.ell(34, 9.5 + oy, 4.6, 3.6, shader(Y));
  b.ell(38.6, 11 + oy, 3, 1.6, (nx, ny) => ny < -0.2 ? Y.l : (ny > 0.5 ? Y.s : Y.m));
  b.set(41, 10 + oy, '#2a1820');
  b.tri(30, 7 + oy, 33, 6.5 + oy, 29, 0 + oy, (x, y) => y < 3 + oy ? '#2a1c24' : Y.l);
  b.tri(34, 6.5 + oy, 37, 6.5 + oy, 36.5, 0 + oy, (x, y) => y < 3 + oy ? '#2a1c24' : Y.m);
  b.line(35, 12 + oy, 37, 13 + oy, '#e24a3a'); b.set(36, 13 + oy, '#ff8a6a');
  eye(b, 36, 8 + oy, '#1c1424', true); b.set(38, 8 + oy, '#f8f0c0');
  return b.outline();
};
CR.brotinho = (f, pose) => {
  const b = new PB(26, 25), G = ramp('#79bf55'), Bw = ramp('#8a6a40'), oy = bobOf(f, pose);
  legs(b, [8, 10, 15, 17], 15 + oy, 7 - oy, 1, Bw, f, pose, { foot: ramp('#3a2a22') });
  b.ell(6.5, 12 + oy, 1.4, 1.6, '#f4f0d8');
  b.ell(12, 13.5 + oy, 6.2, 3.6, shader(G, { belly: ramp('#e8efc0'), bellyY: 0.35, bellyW: 0.7 }));
  [[10, 12], [13, 11], [15, 13], [11, 14]].forEach(([x, y]) => b.set(x, y + oy, '#d8f0a8'));
  b.ell(17, 11 + oy, 2.2, 3.4, shader(G));
  b.ell(18.6, 7.6 + oy, 3, 2.6, shader(G));
  b.ell(21.4, 8.8 + oy, 1.7, 1.3, (nx, ny) => ny < 0 ? '#f0f2d0' : '#d4d8a8');
  b.set(22, 8 + oy, '#2a1c24');
  b.ellR(15.6, 5.8 + oy, 2.8, 1.1, -0.5, (u, v) => v < 0 ? G.hi : G.s);
  b.line(18, 5 + oy, 18, 2 + oy, ramp('#3c7a2a').m);
  b.ellR(16.4, 2 + oy, 1.8, 0.9, 0.4, ramp('#a0dc6a').m); b.ellR(19.6, 1.6 + oy, 1.8, 0.9, -0.4, ramp('#a0dc6a').l);
  eye(b, 19, 6 + oy, '#1c1424');
  return b.outline();
};
CR.folhagrande = (f, pose) => {
  const b = new PB(34, 36), G = ramp('#5a9c46'), Bw = ramp('#7a5634'), L = ramp('#8ccc5a'), oy = bobOf(f, pose);
  legs(b, [10, 12, 20, 22], 23 + oy, 9 - oy, 1, Bw, f, pose, { foot: ramp('#2e2220') });
  b.ell(6.6, 18.5 + oy, 1.6, 2, '#f0f0d4');
  b.ell(16, 20.5 + oy, 9, 4.6, shader(G, { belly: ramp('#d8e4b0'), bellyY: 0.4, bellyW: 0.7 }));
  for (let x = 9; x <= 21; x += 3) b.ellR(x, 16.3 + oy - (x > 13 && x < 19 ? 0.6 : 0), 1.7, 0.9, -0.5, L.m);
  b.ell(22.6, 15 + oy, 2.6, 4.8, shader(G));
  b.ell(24.6, 10.4 + oy, 3.3, 2.7, shader(G));
  b.ell(27.8, 11.6 + oy, 1.9, 1.4, (nx, ny) => ny < 0 ? '#e0e4c0' : '#b8bc90');
  b.set(29, 11 + oy, '#2a1c24');
  b.ellR(21.4, 9 + oy, 2.4, 1, -0.4, G.l);
  // chifres de galho com folhas
  const A = Bw.l;
  b.line(23, 8 + oy, 20, 3 + oy, A); b.line(21, 5 + oy, 18, 3 + oy, A); b.line(24, 8 + oy, 26, 3 + oy, A); b.line(25, 5 + oy, 28, 3 + oy, A);
  [[18, 2.5], [21, 1.8], [26, 1.8], [29, 2.8]].forEach(([x, y], i) => b.ell(x, y + oy, 2, 1.4, (nx, ny) => ny < -0.2 ? L.hi : (i % 2 ? L.m : L.l)));
  b.set(21, 1 + oy, '#ffd8e8');
  eye(b, 25, 9 + oy, '#1c1424');
  return b.outline();
};
CR.carvalhao = (f, pose) => {
  const b = new PB(48, 48), G = ramp('#4a7a38'), Bk = ramp('#6a4a2c'), L = ramp('#6cb048'), oy = bobOf(f, pose);
  legs(b, [12, 15, 29, 32], 33 + oy, 10 - oy, 3, Bk, f, pose, { foot: ramp('#2e221c') });
  b.ell(22, 30 + oy, 13.5, 7, (nx, ny, x, y) => { const c = shader(G)(nx, ny); return (c === G.m && hash2(x, y, 3) < 0.12) ? G.l : c; });
  b.ell(19, 23.5 + oy, 9.5, 3.6, (nx, ny, x, y) => ny < -0.2 ? L.l : (hash2(x, y) < 0.2 ? L.hi : L.m));
  [[15, 21], [21, 20], [25, 22]].forEach(([x, y]) => { b.set(x, y + oy, '#f6f0ff'); b.set(x + 1, y + oy, '#ffe070'); });
  b.ell(33, 24 + oy, 3.8, 6, shader(G));
  b.ell(36, 17.5 + oy, 4.6, 3.6, shader(Bk));
  b.ell(40.2, 19.2 + oy, 2.6, 2, (nx, ny) => ny < 0 ? Bk.hi : Bk.l);
  b.set(42, 18 + oy, '#241418');
  for (let x = 34; x <= 38; x++) b.line(x, 21 + oy, x, 23 + oy + (x % 2), L.s);
  // chifres-árvore
  const A = Bk.m;
  b.thick([[35, 15 + oy], [31, 8 + oy], [27, 4 + oy]], 0.8, A); b.thick([[31, 8 + oy], [33, 4 + oy]], 0.6, A);
  b.thick([[37, 15 + oy], [40, 8 + oy], [43, 4 + oy]], 0.8, A); b.thick([[40, 8 + oy], [38, 4 + oy]], 0.6, A);
  [[27, 4, 3.4], [33, 3.2, 2.8], [38, 3.6, 2.6], [43.5, 4, 3]].forEach(([x, y, r]) => b.ell(x, y + oy, r, r * 0.72, (nx, ny, xx, yy) => { const l = -nx * 0.5 - ny * 0.9; return l > 0.5 ? L.hi : l > 0 ? L.l : (hash2(xx, yy) < 0.15 ? L.l : L.m); }));
  [[26, 3], [34, 2], [44, 3]].forEach(([x, y]) => b.set(x, y + oy, '#e84a4a'));
  eye(b, 37, 16 + oy, '#1c1424');
  b.set(38, 15 + oy, '#a8e070');
  return b.outline();
};
function flame(b, cx, cy, rx, ry, f, seed) {
  b.ell(cx, cy, rx, ry, (nx, ny, x, y) => { const k = Math.hypot(nx, ny * 0.9) + (hash2(x, y + f, seed) - 0.5) * 0.25; return k > 0.8 ? '#c8321e' : k > 0.5 ? '#f07a22' : '#ffd25a'; });
  for (let i = 0; i < 3; i++) { const x = R(cx + (i - 1) * rx * 0.6), h = 2 + ((f + i) % 3); b.line(x, R(cy - ry), x, R(cy - ry - h), i === 1 ? '#ffd25a' : '#f07a22'); }
}
CR.brasinha = (f, pose) => {
  const b = new PB(27, 21), O = ramp('#df5a2a'), oy = bobOf(f, pose);
  flame(b, 5, 9 + oy, 3.4, 3, f, 7);
  b.thick([[9, 12 + oy], [6, 11 + oy]], 1.2, O.m);
  legs(b, [9, 11, 15, 17], 14 + oy, 5 - oy, 2, O, f, pose, { sock: { n: 2, C: ramp('#3a2228') } });
  b.ell(13, 12 + oy, 6.4, 3.4, shader(O, { belly: ramp('#f6dab0'), bellyY: 0.35, bellyX: 0.3 }));
  b.ell(19.5, 8.8 + oy, 3.4, 2.9, shader(O));
  b.ell(22.6, 10 + oy, 2.1, 1.2, (nx, ny) => ny < -0.1 ? O.l : '#f6dab0');
  b.set(24, 9 + oy, '#2a1820');
  b.tri(17, 7 + oy, 19.5, 7 + oy, 17, 2 + oy, (x, y) => y < 4 + oy ? '#ffd25a' : O.l);
  b.tri(20, 6.5 + oy, 22.5, 7 + oy, 22, 1.5 + oy, (x, y) => y < 4 + oy ? '#ffb040' : O.m);
  eye(b, 20, 8 + oy, '#1c1424');
  b.set(18, 10 + oy, '#ffd25a');
  return b.outline();
};
CR.fogareu = (f, pose) => {
  const b = new PB(46, 36), O = ramp('#df9444'), oy = bobOf(f, pose);
  b.thick([[11, 21 + oy], [6, 17 + oy], [4, 12 + oy]], 0.6, O.s);
  flame(b, 3.6, 10 + oy, 2.2, 2.6, f, 3);
  legs(b, [13, 16, 26, 29], 25 + oy, 8 - oy, 3, O, f, pose, { foot: ramp('#f2c890') });
  b.ell(21, 22 + oy, 11, 5.6, shader(O, { belly: ramp('#f2d4a0'), bellyY: 0.4, bellyW: 0.7 }));
  // juba de fogo
  b.ell(32, 16 + oy, 8, 8, (nx, ny, x, y) => {
    const a = Math.atan2(ny, nx), rr = Math.hypot(nx, ny), spike = 0.82 + Math.sin(a * 7 + f * 1.3) * 0.12;
    if (rr > spike) return null; return rr > spike - 0.22 ? '#c8321e' : rr > spike - 0.45 ? '#f07a22' : '#ffc84a';
  });
  b.ell(34, 16.5 + oy, 4.6, 4.2, shader(O));
  b.ell(38.4, 18.4 + oy, 2.8, 2.1, (nx, ny) => ny < 0 ? '#f6dcb0' : '#dcb488');
  b.set(40, 17 + oy, '#3a1a18'); b.set(41, 17 + oy, '#3a1a18');
  b.line(37, 20 + oy, 39, 20 + oy, '#8a3a28');
  eye(b, 36, 14 + oy, '#3a1a10', true); b.set(37, 14 + oy, '#ffd040');
  return b.outline();
};
CR.lontragua = (f, pose) => {
  const b = new PB(34, 19), A = ramp('#3f86c2'), oy = bobOf(f, pose);
  b.ell(5, 13 + oy, 5, 1.8, (nx, ny) => ny < -0.2 ? A.s : A.d);
  [[3, 13], [6, 13]].forEach(([x, y]) => b.set(x, y + oy, '#8ad4f4'));
  legs(b, [10, 12, 20, 22], 13 + oy, 4 - oy, 2, A, f, pose, { foot: ramp('#2a4a78') });
  b.ell(16, 11 + oy, 10, 3.7, shader(A, { belly: ramp('#ece2c8'), bellyY: 0.3, bellyW: 0.8 }));
  for (let x = 10; x <= 20; x += 4) { b.set(x, 8 + oy, '#9ae0f8'); b.set(x + 1, 8 + oy, '#c8f0ff'); }
  b.ell(26.5, 8.8 + oy, 3.7, 3.1, shader(A));
  b.ell(29.4, 10 + oy, 2.2, 1.7, (nx, ny) => ny < -0.3 ? '#f4ecd4' : '#ddd0b0');
  b.set(31, 9 + oy, '#1c1424'); b.set(31, 11 + oy, '#c0b8a0'); b.set(32, 11 + oy, '#c0b8a0');
  b.ell(24.4, 6 + oy, 1.1, 1, A.s);
  eye(b, 27, 7 + oy, '#1c1424');
  return b.outline();
};
CR.nevisco = (f, pose) => {
  const b = new PB(24, 28), W = ramp('#e2ecf8'), I = ramp('#8ad0ee'), hop = pose === 'walk' ? [0, -1, -2, -1][f] : 0, flap = pose === 'idle' && f === 1;
  const oy = hop;
  b.rect(9, 23, 2, 2 + (pose === 'walk' && f === 2 ? -1 : 0), '#e89a3a'); b.rect(13, 23, 2, 2, '#c87a2a');
  b.ell(12, 16 + oy, 6.6, 7.6, (nx, ny, x, y) => { const c = shader(W)(nx, ny); return (ny > -0.3 && (x * 3 + y * 5) % 9 === 0) ? '#6a7c98' : c; });
  b.ellR(8.5, 16 + oy - (flap ? 2 : 0), 3.4, 6, flap ? -0.5 : -0.15, (u, v, x, y) => (y % 3 === 0 ? W.s : W.m));
  b.ell(12.5, 8 + oy, 5.4, 4.6, shader(W));
  b.ell(12.5, 9 + oy, 4, 3, W.hi);
  b.tri(7.5, 6 + oy, 9.5, 4.5 + oy, 7, 1 + oy, I.l); b.tri(15.5, 4.5 + oy, 17.5, 6 + oy, 18, 1 + oy, I.m);
  [[10, 8], [15, 8]].forEach(([x, y]) => { b.rect(x, y + oy, 2, 2, '#f2b830'); b.set(x + 1, y + 1 + oy, '#1c1424'); b.set(x, y + oy, '#fff4c0'); });
  b.set(13, 10 + oy, '#d8902a'); b.set(13, 11 + oy, '#b06a20');
  [[12, 15], [11, 16], [13, 16], [12, 17]].forEach(([x, y]) => b.set(x, y + oy, I.l));
  return b.outline();
};
CR.bambule = (f, pose) => {
  const b = new PB(38, 31), Wt = ramp('#efece2'), K = ramp('#3a3440'), J = ramp('#4aa66a'), oy = bobOf(f, pose);
  legs(b, [11, 14, 22, 25], 20 + oy, 8 - oy, 3, K, f, pose);
  b.ell(7.6, 15 + oy, 1.6, 1.4, K.m);
  b.ell(18, 18 + oy, 10, 6, (nx, ny, x, y) => (x >= 19 && x <= 23) ? shader(K)(nx, ny) : shader(Wt)(nx, ny));
  b.line(23, 13 + oy, 27, 14 + oy, J.m); b.line(23, 14 + oy, 27, 15 + oy, J.s); b.set(24, 13 + oy, J.l);
  b.ell(28.5, 11.5 + oy, 5.1, 4.5, shader(Wt));
  b.ell(25.4, 7.6 + oy, 1.9, 1.7, K.m); b.ell(31, 7.2 + oy, 1.9, 1.7, K.s);
  b.ell(30.3, 11.4 + oy, 1.7, 1.4, K.m);
  b.ell(32.6, 13.4 + oy, 1.8, 1.3, Wt.l); b.set(34, 12 + oy, '#241c28');
  b.set(31, 11 + oy, '#ffffff'); b.set(31, 12 + oy, '#14101a');
  b.line(27, 7 + oy, 28, 2 + oy, ramp('#7ab84a').m); b.set(27, 5 + oy, ramp('#7ab84a').s);
  b.ellR(29.6, 2.6 + oy, 2, 0.9, -0.5, ramp('#9ad860').m);
  return b.outline();
};
CR.coralume = (f, pose) => {
  const b = new PB(34, 23), T = ramp('#36a898'), P = ramp('#ea6f68'), oy = bobOf(f, pose);
  legs(b, [10, 13, 21, 24], 16 + oy, 4 - oy, 3, T, f, pose);
  b.ell(5.5, 16 + oy, 2, 1.2, T.s);
  b.ell(17, 13 + oy, 9.4, 5.4, (nx, ny, x, y) => { if (ny > 0.55) return '#f2e2b8'; const c = shader(P)(nx, ny); return ((x + y * 2) % 7 === 0 || (x - y * 2) % 7 === 0) && ny < 0.4 ? P.s : c; });
  [[11, 9], [16, 8], [21, 9]].forEach(([x, y], i) => { b.line(x, y + oy, x - 1 + i, y - 4 + oy, P.l); b.line(x - 1 + i, y - 3 + oy, x + 1 + i, y - 5 + oy, P.l); b.set(x - 1 + i, y - 5 + oy, '#fff2a0'); b.set(x + 1 + i, y - 6 + oy, '#fff8d0'); });
  b.ell(27.2, 13.4 + oy, 3.4, 2.7, shader(T));
  b.set(30, 14 + oy, T.d);
  eye(b, 28, 12 + oy, '#1c1424');
  return b.outline();
};

// ================= PESSOAS =================
// dir: 'down' | 'up' | 'side'. Proporção realista (cabeça ~1/4 da altura), nada de chibi.
const PLAYER_LOOK = { skin: '#eebc94', hair: '#5a3622', coat: '#2f7a9c', shirt: '#efe4c8', pants: '#4a4258', boots: '#6a4026', scarf: '#d0503a', pack: '#a8723e' };
function drawPerson(dir, f, pose, L = PLAYER_LOOK, extra = {}) {
  const b = new PB(18, 34), S = ramp(L.skin), H = ramp(L.hair), C = ramp(L.coat), P = ramp(L.pants), Bt = ramp(L.boots), Sc = ramp(L.scarf), Pk = ramp(L.pack);
  const walk = pose === 'walk', bob = walk ? [0, -1, 0, -1][f] : (f === 1 ? 1 : 0);
  const sw = walk ? [1, 0, -1, 0][f] : 0;
  const cxp = 8.5, y0 = 1 + bob;
  if (dir === 'side') {
    // perna de trás, perna da frente
    const lf = walk ? [2, 0, -2, 0][f] : 0;
    b.rect(R(7 - lf / 2), 22 + bob, 2, 8 - bob, P.s); b.rect(R(7 - lf / 2), 29, 3, 2, Bt.s);
    b.rect(R(8 + lf / 2), 22 + bob, 2, 8 - bob, P.m); b.rect(R(8 + lf / 2), 29, 3, 2, Bt.m);
    if (!extra.noPack) b.rect(4, 12 + y0, 3, 8, (i, j) => i === 0 ? Pk.l : Pk.m);
    b.rect(6, 11 + y0, 6, 11, (i, j) => j > 8 ? C.s : (i === 0 ? C.l : i > 4 ? C.s : C.m));
    b.rect(11, 12 + y0, 1, 7, C.d);
    b.rect(R(8 + sw * 1.5), 12 + y0, 2, 7, (i) => i ? C.s : C.m); b.rect(R(8 + sw * 1.5), 19 + y0, 2, 2, S.m);
    b.rect(8, 9 + y0, 2, 2, S.s);
    b.rect(6, 11 + y0, 6, 1, (i) => i < 3 ? Sc.l : Sc.m); b.set(6, 12 + y0, Sc.s);
    b.ell(9.5, 5.2 + y0, 3.4, 4, shader(S));
    b.ell(8.6, 4.2 + y0, 3.6, 3.2, (nx, ny) => (nx > 0.35 && ny > -0.1) ? null : shader(H)(nx, ny));
    b.rect(6, 4 + y0, 2, 5, H.s);
    b.set(12, 6 + y0, '#1c1424'); b.set(13, 7 + y0, S.s); b.set(9, 6 + y0, S.s);
    if (extra.beard) b.rect(10, 8 + y0, 3, 3, '#e8e4dc');
  } else {
    const up = dir === 'up';
    const lA = walk ? [1, 0, 0, 0][f] : 0, lB = walk ? [0, 0, 1, 0][f] : 0;
    b.rect(5, 22 + bob, 3, 8 - lA - bob, P.m); b.rect(5, 29 - lA, 3, 2, Bt.m);
    b.rect(9, 22 + bob, 3, 8 - lB - bob, P.s); b.rect(9, 29 - lB, 3, 2, Bt.s);
    b.rect(4, 11 + y0, 9, 11, (i, j) => j > 8 ? C.s : (i < 2 ? C.l : i > 6 ? C.s : C.m));
    if (!up) { b.rect(8, 12 + y0, 1, 8, C.hi); b.set(6, 17 + y0, C.d); b.set(10, 17 + y0, C.d); }
    if (up && !extra.noPack) b.rect(5, 12 + y0, 7, 8, (i, j) => j === 0 ? Pk.hi : (i === 0 ? Pk.l : i === 6 ? Pk.s : Pk.m));
    b.rect(3, 12 + y0 + sw, 1, 7, C.m); b.rect(13, 12 + y0 - sw, 1, 7, C.s);
    b.rect(3, 19 + y0 + sw, 1, 2, S.m); b.rect(13, 19 + y0 - sw, 1, 2, S.s);
    b.rect(5, 11 + y0, 7, 1, (i) => i < 3 ? Sc.l : Sc.m); b.set(9, 12 + y0, Sc.s); b.set(9, 13 + y0, Sc.s);
    b.rect(7, 9 + y0, 3, 2, S.s);
    b.ell(cxp, 5.2 + y0, 3.6, 4.1, shader(S));
    if (up) b.ell(cxp, 5.2 + y0, 3.8, 4.3, shader(H));
    else {
      b.ell(cxp, 3.8 + y0, 3.9, 3, (nx, ny) => ny > 0.35 && Math.abs(nx) < 0.75 ? null : shader(H)(nx, ny));
      b.set(7, 6 + y0, '#1c1424'); b.set(10, 6 + y0, '#1c1424'); b.set(7, 5 + y0, H.s); b.set(10, 5 + y0, H.s);
      b.set(8, 8 + y0, S.s); b.set(9, 8 + y0, S.s);
      if (extra.beard) { b.rect(6, 8 + y0, 5, 3, '#e8e4dc'); b.set(8, 11 + y0, '#d0ccc4'); }
    }
  }
  if (extra.hat === 'straw') { b.ell(cxp + (dir === 'side' ? 1 : 0), 2.6 + y0, 6, 1.6, (nx, ny) => ny < 0 ? '#f0d47a' : '#c8a048'); b.ell(cxp + (dir === 'side' ? 1 : 0), 1.4 + y0, 3, 1.6, '#e8c460'); }
  if (extra.hat === 'fur') b.ell(cxp, 2.8 + y0, 4.4, 2.8, (nx, ny) => ny < 0 ? '#f4f0ea' : '#c8c0b4');
  if (extra.hat === 'cone') b.tri(cxp - 6, 3.5 + y0, cxp + 6, 3.5 + y0, cxp, -1.5 + y0, (x, y) => x < cxp ? '#e2c27a' : '#b8964a');
  if (extra.hat === 'hood') b.ell(cxp, 3.4 + y0, 4.4, 3.6, (nx, ny) => ny > 0.3 && Math.abs(nx) < 0.7 && dir === 'down' ? null : (nx < 0 ? '#6a7a48' : '#4e5c34'));
  return b.outline();
}
// deus (tela de abertura): figura alta de túnica com coroa de galhos e auréola
function drawGod() {
  const b = new PB(48, 80), Rb = ramp('#e8f0e0'), G = ramp('#7ac868'), Au = ramp('#f2c860'), S = ramp('#d8b890');
  b.tri(24, 26, 6, 78, 42, 78, (x, y) => { const k = (x - 6) / 36; return k < 0.3 ? Rb.hi : k < 0.55 ? Rb.l : k < 0.8 ? Rb.m : Rb.s; });
  for (let y = 40; y < 78; y += 6) for (let x = 10; x < 40; x += 5) if (b.get(x, y) && hash2(x, y) < 0.5) { b.set(x, y, G.m); b.set(x + 1, y - 1, G.l); }
  b.rect(16, 76, 16, 2, G.s);
  b.ell(24, 30, 9, 5, shader(Rb));
  b.thick([[16, 30], [10, 46], [13, 52]], 1.6, Rb.m); b.thick([[32, 30], [38, 46], [35, 52]], 1.6, Rb.s);
  b.ell(13, 53, 1.8, 1.8, S.m); b.ell(35, 53, 1.8, 1.8, S.s);
  // cabelo longo verde-claro caindo pelos ombros, rosto menor, olhos dourados brilhando
  const Hr = ramp('#cfe8c0');
  b.ell(24, 22, 8, 11, (nx, ny) => nx < -0.3 ? Hr.l : nx > 0.4 ? Hr.s : Hr.m);
  b.ell(24, 17, 4.4, 5.4, shader(S));
  b.ell(24, 13.2, 5.2, 2.6, (nx, ny) => ny < 0.4 ? (nx < 0 ? Hr.hi : Hr.l) : null);
  b.rect(21, 17, 2, 1, '#ffe070'); b.rect(26, 17, 2, 1, '#ffe070'); b.set(21, 17, '#fff8d0'); b.set(26, 17, '#fff8d0');
  b.set(24, 19, S.s); b.rect(23, 21, 3, 1, S.s);
  b.thick([[20, 12], [15, 4], [12, 1]], 0.7, '#8a6038'); b.thick([[16, 6], [19, 2]], 0.5, '#8a6038');
  b.thick([[28, 12], [33, 4], [36, 1]], 0.7, '#6e4a2a'); b.thick([[32, 6], [29, 2]], 0.5, '#6e4a2a');
  [[12, 1], [19, 2], [29, 2], [36, 1]].forEach(([x, y]) => b.ell(x, y + 1, 2, 1.4, G.l));
  b.ell(24, 9, 2.4, 1.6, Au.l);
  return b.outline();
}

// ================= CENÁRIO =================
const TREEP = {
  oak: { d: '#1d5a2c', m: '#2c7e38', l: '#47a443', hi: '#74c95a', tr: '#7a4a2c' },
  sakura: { d: '#b45a84', m: '#de7ea8', l: '#f4a8c8', hi: '#ffd6e6', tr: '#5e3a34' },
  swamp: { d: '#2e4224', m: '#40582c', l: '#58743a', hi: '#7a9450', tr: '#4a3a2a' },
  jungle: { d: '#1f6a3a', m: '#2e8a46', l: '#4aac56', hi: '#7cd06c', tr: '#7a5a3a' },
};
function drawRoundTree(seed, P, big) {
  const r = mulberry32(seed), W = big ? 34 : 28, H = big ? 42 : 34, b = new PB(W, H), cxp = W / 2, T = ramp(P.tr), th = big ? 10 : 8;
  b.rect(R(cxp) - 2, H - th - 2, 4, th + 1, (i) => i === 0 ? T.l : i === 3 ? T.d : T.m);
  b.set(R(cxp) - 3, H - 2, T.s); b.set(R(cxp) + 2, H - 2, T.s); b.set(R(cxp) - 4, H - 2, T.d);
  const RR = W * 0.4, cyp = (H - th) * 0.5;
  const blobs = [[0, 0.05, 1], [-0.6, 0.3, 0.6], [0.6, 0.32, 0.6], [-0.25, -0.5, 0.62], [0.32, -0.42, 0.58], [0, 0.5, 0.6]];
  for (const [ox, oy2, s] of blobs) b.ell(cxp + ox * RR, cyp + oy2 * RR, RR * s, RR * s * 0.9, (nx, ny, x, y) => {
    const l = -nx * 0.5 - ny * 0.85 + (ox + oy2) * -0.25 + (hash2(x, y, seed) - 0.5) * 0.25;
    return l > 0.6 ? P.hi : l > 0.15 ? P.l : l < -0.55 ? P.d : P.m;
  });
  for (let i = 0; i < 7; i++) { const x = R(cxp + (r() * 2 - 1) * RR * 0.8), y = R(cyp + (r() * 2 - 1) * RR * 0.7); if (b.get(x, y) === P.m) { b.set(x, y, P.l); b.set(x + 1, y + 1, P.d); } }
  if (P === TREEP.oak && seed % 3 === 0) for (let i = 0; i < 5; i++) { const x = R(cxp + (r() * 2 - 1) * RR * 0.7), y = R(cyp + (r() * 2 - 1) * RR * 0.6); if (b.get(x, y)) b.set(x, y, '#e8443a'); }
  return b.outline();
}
function drawPine(seed, snow, big) {
  const r = mulberry32(seed), W = big ? 24 : 19, H = big ? 46 : 36, b = new PB(W, H), cxp = (W - 1) / 2;
  const P = snow ? { d: '#1e4a48', m: '#2a6658', l: '#3a8268', hi: '#5a9e78' } : { d: '#174a2a', m: '#1f6634', l: '#2e8240', hi: '#4aa250' };
  const T = ramp('#6a4428'), trunkH = 5, cb = H - trunkH;
  b.rect(R(cxp) - 1, cb - 1, 3, trunkH + 1, (i) => i === 0 ? T.l : i === 2 ? T.d : T.m);
  const tiers = big ? 5 : 4, tierH = (cb - 1) / (tiers * 0.66 + 0.34);
  for (let i = 0; i < tiers; i++) {
    const base = cb - i * tierH * 0.66, apex = base - tierH, hw0 = (W / 2 - 0.5) * (1 - i * 0.17);
    for (let y = Math.floor(apex); y < base; y++) {
      const t = (y + 0.5 - apex) / (base - apex), hw = hw0 * t + (y % 2 ? 0.5 : -0.3);
      for (let x = 0; x < W; x++) {
        const dx = x + 0.5 - cxp; if (Math.abs(dx) > hw) continue;
        const rel = dx / Math.max(1, hw); let c = P.m;
        if (rel < -0.25) c = P.l; if (rel < -0.55 && t < 0.85) c = P.hi; if (rel > 0.35) c = P.d; if (t > 0.85) c = rel < -0.3 ? P.m : P.d;
        if (snow && t < 0.38 + r() * 0.12 && rel < 0.7) c = rel > 0.2 ? '#c4d8ea' : '#f4faff';
        b.set(x, y, c);
      }
    }
  }
  return b.outline();
}
function drawAcacia(seed) {
  const r = mulberry32(seed), b = new PB(46, 34), T = ramp('#7a5434'), P = { d: '#4a6a1e', m: '#6a8c2a', l: '#8aaa3a', hi: '#b2c85a' };
  const lean = r() < 0.5 ? -1 : 1;
  b.thick([[23, 33], [23 + lean * 2, 24], [23 + lean * 5, 14]], t => 1.6 - t * 0.6, t => t < 0.5 ? T.m : T.l);
  b.thick([[23 + lean * 3, 20], [23 - lean * 6, 13]], 0.8, T.m);
  b.ell(23, 10, 20, 4.6, (nx, ny, x, y) => { const l = -ny * 1 - nx * 0.25 + (hash2(x, y, seed) - 0.5) * 0.3; if (Math.abs(nx) > 0.92 && hash2(x, y) < 0.5) return null; return l > 0.6 ? P.hi : l > 0.1 ? P.l : l < -0.5 ? P.d : P.m; });
  b.ell(23 + lean * 6, 6.5, 9, 3, (nx, ny) => ny < -0.2 ? P.hi : P.l);
  return b.outline();
}
function drawBamboo(seed) {
  const r = mulberry32(seed), n = 3 + Math.floor(r() * 3), b = new PB(24, 54), G = ramp('#6aaa3a'), Lf = ramp('#4c9a3c');
  for (let i = 0; i < n; i++) {
    const x = 4 + Math.floor(r() * 15), top = 2 + Math.floor(r() * 14), lean = r() < 0.5 ? 0 : (r() < 0.5 ? -1 : 1);
    for (let y = top; y < 53; y++) { const xx = x + (y < top + 14 ? lean : 0); const node = (y - top) % 7 === 0; b.set(xx, y, node ? G.d : G.l); b.set(xx + 1, y, node ? G.d : G.m); b.set(xx + 2, y, node ? G.d : G.s); }
    for (let k = 0; k < 3; k++) { const y = top + 4 + k * 9, d = k % 2 ? 1 : -1; b.ellR(x + 1 + d * 4, y, 3.4, 0.9, d * 0.5, (u, v) => v < 0 ? Lf.l : Lf.m); }
  }
  return b.outline();
}
function drawSwampTree(seed) {
  const r = mulberry32(seed), b = new PB(32, 42), T = ramp('#4e4230'), P = TREEP.swamp;
  b.thick([[16, 41], [14, 30], [17, 20], [15, 12]], t => 2.2 - t, t => t > 0.5 ? T.l : T.m);
  b.thick([[12, 41], [14, 35]], 0.8, T.s); b.thick([[20, 41], [17, 34]], 0.8, T.s);
  b.thick([[16, 22], [24, 14]], 0.7, T.m); b.thick([[15, 18], [7, 12]], 0.7, T.m);
  [[8, 10, 6], [24, 12, 6], [15, 8, 7.5]].forEach(([x, y, rr]) => b.ell(x, y, rr, rr * 0.55, (nx, ny, xx, yy) => { const l = -ny - nx * 0.3 + (hash2(xx, yy, seed) - 0.5) * 0.4; return l > 0.4 ? P.hi : l > 0 ? P.l : l < -0.5 ? P.d : P.m; }));
  for (let i = 0; i < 6; i++) { const x = 4 + Math.floor(r() * 24), y0 = 12 + Math.floor(r() * 4), L = 4 + Math.floor(r() * 7); if (b.get(x, y0 - 1)) b.line(x, y0, x, y0 + L, i % 2 ? '#7a9450' : '#5a7438'); }
  return b.outline();
}
function drawDeadTree(seed) {
  const b = new PB(26, 36), T = ramp('#3a2e34');
  b.thick([[13, 35], [12, 22], [14, 10]], t => 1.8 - t * 0.9, t => t > 0.5 ? T.l : T.m);
  b.thick([[12, 22], [5, 14], [3, 8]], 0.6, T.m); b.thick([[13, 16], [20, 9], [23, 3]], 0.6, T.m); b.thick([[14, 10], [11, 3]], 0.5, T.l); b.thick([[6, 15], [8, 9]], 0.4, T.s);
  return b.outline();
}
function drawPalm(seed) {
  const r = mulberry32(seed), b = new PB(36, 44), T = ramp('#a07a48'), F = ramp('#3e9a40'), lean = r() < 0.5 ? -1 : 1;
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([18 + lean * Math.sin(t * 1.4) * 6, 43 - t * 30]); }
  for (let i = 1; i < pts.length; i++) b.thick([pts[i - 1], pts[i]], 1.4 - i * 0.05, i % 2 ? T.m : T.l);
  const [tx, ty] = pts[pts.length - 1];
  [[-1, -0.2], [-0.8, 0.5], [1, -0.2], [0.8, 0.5], [0.1, -1], [-0.4, 0.9], [0.4, 0.9]].forEach(([dx, dy], i) => {
    const pp = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pp.push([tx + dx * 15 * t, ty + dy * 7 * t + t * t * 7]); }
    b.thick(pp, t => 1.5 - t, t => t < 0.4 ? F.l : (i % 2 ? F.m : F.s));
  });
  b.ell(tx - 1, ty + 2, 1.5, 1.5, '#6a4a2a'); b.ell(tx + 2, ty + 2.4, 1.5, 1.5, '#5a3a20');
  return b.outline();
}
function drawBush(seed, kind) {
  const r = mulberry32(seed), b = new PB(18, 13);
  const P = kind === 'snow' ? { d: '#3a6a68', m: '#4a8478', l: '#e2eef8', hi: '#ffffff' } : kind === 'dry' ? { d: '#6a6a24', m: '#8a8a30', l: '#a8a844', hi: '#c8c468' } : { d: '#1d5e2e', m: '#2e8038', l: '#48a446', hi: '#76c85c' };
  [[5.5, 8, 4.4], [12, 8, 4.6], [8.8, 5.4, 4.2]].forEach(([x, y, rr]) => b.ell(x, y, rr, rr * 0.82, (nx, ny, xx, yy) => { const l = -nx * 0.5 - ny * 0.9 + (hash2(xx, yy, seed) - 0.5) * 0.3; return l > 0.5 ? P.hi : l > 0.1 ? P.l : l < -0.5 ? P.d : P.m; }));
  return b.outline();
}
function addBerries(pb, seed, col) { const r = mulberry32(seed), o = new PB(pb.w, pb.h); o.d = pb.d.slice(); for (let i = 0; i < 6; i++) { const x = 3 + Math.floor(r() * 12), y = 3 + Math.floor(r() * 7); const c = o.get(x, y); if (c && c.length === 7 && x + 1 < o.w) { o.set(x, y, col); o.set(x + 1, y, mix(col, '#000000', 0.3)); o.set(x, y - 1, mix(col, '#ffffff', 0.5)); } } return o; }
function drawRock(seed, size, pal) {
  const w = [10, 16, 28][size], h = [7, 11, 20][size], b = new PB(w, h), P = pal || { hi: '#e2e4e6', l: '#b8bec4', m: '#959ea8', s: '#6e7884', d: '#525a66' };
  b.ell(w / 2, h / 2 + 0.6, w / 2 - 0.6, h / 2 - 0.5, (nx, ny, x, y) => { const l = -nx * 0.5 - ny * 0.9 + (hash2(x, y, seed) - 0.5) * 0.2; return l > 0.55 ? P.hi : l > 0.1 ? P.l : ny > 0.5 ? P.d : l < -0.4 ? P.s : P.m; });
  if (size === 2) { b.line(8, 6, 11, 11, P.s); b.line(11, 11, 10, 15, P.s); b.line(18, 5, 20, 9, P.d); }
  if (size > 0 && !pal) { const x = R(w / 2) - 2; b.set(x, 2, '#6ab04a'); b.set(x + 1, 2, '#88c95a'); b.set(x - 1, 3, '#5a9a3c'); b.set(x + 2, 3, '#5a9a3c'); }
  return b.outline();
}
function drawTuft(seed, col) { const r = mulberry32(seed), b = new PB(12, 11), C = ramp(col); for (let i = 0; i < 7; i++) { const x = 2 + Math.floor(r() * 8), hgt = 4 + Math.floor(r() * 6), lean = Math.floor(r() * 3) - 1; b.line(x, 10, x + lean, 10 - hgt, i % 3 === 0 ? C.l : i % 3 === 1 ? C.m : C.s); } return b.outline(); }
function drawReeds(seed) { const r = mulberry32(seed), b = new PB(12, 16); for (let i = 0; i < 5; i++) { const x = 2 + Math.floor(r() * 8), hgt = 8 + Math.floor(r() * 6); b.line(x, 15, x, 15 - hgt, '#6a8a3a'); if (i % 2 === 0) b.rect(x, 15 - hgt, 1, 3, '#7a4a2a'); } return b.outline(); }
function drawFlowers(seed, cols) { const r = mulberry32(seed), b = new PB(10, 7); for (let i = 0; i < 4; i++) { const x = 1 + Math.floor(r() * 7), y = 2 + Math.floor(r() * 3), c = pick(cols); b.set(x, y + 1, '#3a7a2a'); b.set(x, y, c); b.set(x - 1, y, c); b.set(x + 1, y, c); b.set(x, y - 1, c); b.set(x, y, '#ffe070'); } return b; }
function drawMush(seed) { const r = mulberry32(seed), b = new PB(10, 8); for (let i = 0; i < 2; i++) { const x = 1 + Math.floor(r() * 5); b.rect(x + 1, 4, 1, 3, '#f0e6d0'); b.ell(x + 1.5, 4, 2, 1.4, (nx, ny) => ny < 0 && nx < 0 ? '#ff6a5a' : '#c83a34'); b.set(x + 1, 3, '#ffffff'); } return b.outline(); }
function drawStump() { const b = new PB(12, 9), T = ramp('#8a5434'); b.rect(1, 3, 10, 5, (i) => i < 2 ? T.l : i > 7 ? T.s : T.m); b.ell(6, 3, 5, 2, (nx, ny) => { const k = Math.hypot(nx, ny); return k > 0.8 ? T.l : k > 0.4 ? '#e2b27a' : '#c8925a'; }); return b.outline(); }
function drawStick() { const b = new PB(12, 6), T = ramp('#8a5a34'); b.line(1, 4, 10, 2, T.m); b.line(1, 5, 10, 3, T.s); b.line(6, 3, 8, 0, T.l); return b.outline(); }
function drawPebble() { const b = new PB(8, 6); b.ell(4, 3.4, 3, 2.2, (nx, ny) => ny < -0.2 ? '#d8dce0' : ny > 0.4 ? '#7a828c' : '#a8b0b8'); return b.outline(); }
function drawLantern() { const b = new PB(12, 22), S = ramp('#a8a49a'); b.rect(4, 16, 4, 5, S.m); b.rect(3, 20, 6, 1, S.s); b.rect(2, 9, 8, 7, (i, j) => i === 0 ? S.l : i === 7 ? S.s : S.m); b.rect(4, 11, 4, 3, '#ffd870'); b.set(4, 11, '#fff4c0'); b.tri(0, 9, 12, 9, 6, 4, (x) => x < 6 ? S.hi : S.s); b.rect(5, 2, 2, 2, S.m); return b.outline(); }
function drawMound() { const b = new PB(16, 20), T = ramp('#b8784a'); b.tri(1, 19, 15, 19, 8, 1, (x, y) => { const l = (8 - x) / 7 - y / 40; return l > 0.4 ? T.l : l > -0.2 ? T.m : T.s; }); b.tri(9, 19, 15, 19, 12, 8, T.m); [[6, 10], [8, 14], [10, 6]].forEach(([x, y]) => b.set(x, y, T.d)); return b.outline(); }
function drawSnowPile(seed) { const b = new PB(16, 8); b.ell(8, 5, 7, 3, (nx, ny) => ny < -0.2 ? '#ffffff' : ny > 0.5 ? '#b0c4dc' : '#e2ecf6'); return b.outline(); }
function drawBones() { const b = new PB(14, 7); b.line(1, 5, 12, 2, '#e8e0cc'); b.set(1, 4, '#e8e0cc'); b.set(12, 1, '#e8e0cc'); b.ell(10, 4, 2.4, 2, (nx, ny) => ny < 0 ? '#f0ead8' : '#c8bea8'); b.set(10, 4, '#3a2a2a'); return b.outline(); }
function drawLilypad(seed) { const b = new PB(10, 6); b.ell(5, 3, 4, 2.2, (nx, ny) => (nx > 0.1 && Math.abs(ny) < 0.25) ? null : ny < 0 ? '#5aa848' : '#3a8436'); if (seed % 2) { b.set(3, 2, '#ffb0d0'); b.set(4, 1, '#ffd0e4'); } return b; }

// ================= CONSTRUÇÕES =================
const HOUSE_STYLE = {
  forest: { wall: '#c8925a', roof: '#b8463a', trim: '#6a3e24', base: '#8a8478' },
  taiga: { wall: '#8a5a3a', roof: '#e8f0fa', trim: '#4a3020', base: '#7a8494' },
  savana: { wall: '#d8a46a', roof: '#d8b450', trim: '#8a5a2a', base: '#a8784a', round: true },
  bambu: { wall: '#ece4d4', roof: '#2e6a5a', trim: '#a83a2a', base: '#8a8a84', pagoda: true },
  swamp: { wall: '#7a6a4a', roof: '#8a8a4a', trim: '#4a3a24', base: '#5a4a34', stilts: true },
};
function drawHouse(style, home) {
  const S = HOUSE_STYLE[style], b = new PB(60, 56), Wl = ramp(S.wall), Rf = ramp(S.roof), Tr = ramp(S.trim), Bs = ramp(S.base);
  const wy = 26, wh = 26, wx = 10, ww = 40;
  if (S.stilts) { [12, 22, 38, 47].forEach(x => b.rect(x, 48, 2, 8, Tr.s)); }
  if (S.round) {
    b.ell(30, 40, 19, 13, (nx, ny, x, y) => { if (y < 30) return null; const l = -nx * 0.6 - ny * 0.4; return l > 0.4 ? Wl.l : l < -0.4 ? Wl.s : Wl.m; });
    b.tri(6, 32, 54, 32, 30, 4, (x, y) => { const l = (30 - x) / 24; const c = l > 0.35 ? Rf.l : l > -0.3 ? Rf.m : Rf.s; return (y % 4 === 0) ? Rf.s : (hash2(x, y) < 0.08 ? Rf.hi : c); });
    b.rect(26, 40, 8, 13, (i, j) => j === 0 ? Tr.d : i === 0 || i === 7 ? Tr.s : '#3a2418');
  } else {
    b.rect(wx, wy, ww, wh - (S.stilts ? 4 : 0), (i, j) => { if (style === 'taiga' && j % 4 === 3) return Wl.s; if (style === 'forest' && i % 6 === 0) return Wl.s; return i < 3 ? Wl.l : i > ww - 4 ? Wl.s : Wl.m; });
    b.rect(wx, wy + wh - 3 - (S.stilts ? 4 : 0), ww, 3, Bs.m);
    // telhado
    if (S.pagoda) {
      b.rect(4, 22, 52, 5, (i, j) => j === 0 ? Rf.hi : j < 3 ? Rf.m : Rf.s); b.set(3, 21, Rf.l); b.set(56, 21, Rf.l); b.set(2, 20, Rf.l); b.set(57, 20, Rf.l);
      b.tri(8, 22, 52, 22, 30, 6, (x, y) => (x < 30 ? (y % 3 === 0 ? Rf.s : Rf.l) : (y % 3 === 0 ? Rf.d : Rf.m)));
      b.rect(26, 4, 8, 3, Tr.m);
      [[14, 32], [42, 32]].forEach(([x, y]) => b.rect(x, y, 2, 12, Tr.m));
    } else {
      b.tri(4, 27, 56, 27, 30, 4, (x, y) => { const left = x < 30; let c = left ? Rf.l : Rf.s; if ((y + (left ? 0 : 1)) % 4 === 0) c = left ? Rf.m : Rf.d; if (x === 30 || x === 29) c = Rf.hi; return c; });
      b.rect(4, 26, 52, 2, Rf.d);
      if (style === 'taiga') for (let x = 6; x < 54; x += 3) b.set(x, 28, '#ffffff');
      b.rect(40, 6, 5, 10, (i) => i === 0 ? Bs.l : Bs.m);
    }
    b.rect(26, wy + 10 - (S.stilts ? 2 : 0), 8, wh - 10, (i, j) => j === 0 ? Tr.d : i === 0 || i === 7 ? Tr.s : '#4a2c1c'); b.set(32, wy + 18, '#e8c060');
    [[14, wy + 8], [39, wy + 8]].forEach(([x, y]) => { b.rect(x, y, 7, 6, Tr.m); b.rect(x + 1, y + 1, 5, 4, '#ffd870'); b.rect(x + 1, y + 1, 2, 1, '#fff4c0'); b.set(x + 3, y + 1, Tr.m); b.set(x + 3, y + 2, Tr.m); b.set(x + 3, y + 3, Tr.m); b.set(x + 3, y + 4, Tr.m); });
  }
  if (home) { b.rect(27, 17, 6, 5, '#f6ead0'); b.set(29, 18, '#c8463a'); b.set(30, 18, '#c8463a'); b.rect(29, 19, 2, 2, '#c8463a'); }
  return b.outline();
}
function drawBusStop() {
  const b = new PB(34, 38), M = ramp('#3a8a9a'), Y = ramp('#f2c43a'), G = ramp('#9aa4ac');
  b.rect(4, 12, 2, 24, G.m); b.rect(26, 12, 2, 24, G.s);
  b.rect(1, 9, 30, 4, (i, j) => j === 0 ? M.hi : j === 3 ? M.d : M.m);
  b.rect(6, 26, 20, 3, (i, j) => j === 0 ? '#c8925a' : '#8a5a34'); b.rect(8, 29, 2, 6, '#5a3a24'); b.rect(22, 29, 2, 6, '#5a3a24');
  b.rect(30, 2, 2, 34, G.l);
  b.ell(31, 5, 3.4, 3.4, (nx, ny) => ny < -0.2 ? Y.hi : Y.m); b.rect(30, 4, 3, 2, '#2a3a5a');
  return b.outline();
}
const SHRINE_COL = { forest: '#8af07a', savana: '#ffb040', taiga: '#9ae4ff', bambu: '#a0f0c8', swamp: '#c8a0ff', island: '#ff9ac8' };
function drawShrine(biome) {
  const b = new PB(40, 40), S = ramp(biome === 'savana' ? '#c09a6a' : biome === 'taiga' ? '#a8b4c4' : biome === 'swamp' ? '#7a8070' : '#a8a8a0'), C = ramp(SHRINE_COL[biome] || '#ffffff');
  b.rect(4, 32, 32, 6, (i, j) => j === 0 ? S.hi : j > 3 ? S.d : S.m); b.rect(8, 28, 24, 4, (i, j) => j === 0 ? S.hi : S.m);
  if (biome === 'bambu') { const Rd = ramp('#c83a2a'); b.rect(8, 8, 3, 20, Rd.m); b.rect(29, 8, 3, 20, Rd.s); b.rect(4, 6, 32, 3, Rd.l); b.rect(6, 11, 28, 2, Rd.m); }
  else { [[8, 12], [29, 12]].forEach(([x, y], i) => { b.rect(x, y, 4, 16, (ii) => ii === 0 ? S.l : ii === 3 ? S.s : S.m); b.rect(x - 1, y - 2, 6, 2, S.hi); }); for (const [x, y] of [[9, 16], [30, 20]]) { b.set(x, y, '#6ab04a'); b.set(x + 1, y + 1, '#4a8a3a'); } }
  b.rect(16, 22, 8, 6, (i) => i < 2 ? S.l : S.m);
  b.tri(20, 6, 16, 13, 24, 13, (x) => x < 20 ? C.hi : C.l); b.tri(16, 13, 24, 13, 20, 19, (x) => x < 20 ? C.m : C.s);
  return b.outline();
}
function drawCampfire(lit) { const b = new PB(18, 10), St = ramp('#9aa0a8'), L = ramp('#8a5a34'); b.line(3, 6, 14, 3, L.m); b.line(3, 3, 14, 6, L.s); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.ell(9 + Math.cos(a) * 7, 5 + Math.sin(a) * 3, 1.6, 1.2, Math.sin(a) < 0 ? St.l : St.m); } if (!lit) b.set(9, 4, '#3a3030'); return b.outline(); }
function drawBarrier() { const b = new PB(12, 20); for (let y = 0; y < 20; y++) for (let x = 0; x < 12; x++) if (hash2(x, y, 9) < 0.25) b.set(x, y, hash2(x, y, 4) < 0.5 ? '#6a3a8a' : '#3a1a4a'); return b; }

// ================= ÍCONES =================
const ICON_ASCII = {
  madeira: { rows: ['..LLLLLL', '.LlllllO', 'LllllllO', 'LllllllO', 'OLLLLLOO', '.OOOOOO.'], pal: { L: '#c8925a', l: '#a8703e', O: '#6a4024' } },
  pedra: { rows: ['..HHHH..', '.HhhhhM.', 'HhhhhmmM', 'hhhmmmmM', '.MMMMMM.'], pal: { H: '#e2e6ea', h: '#b8c0c8', m: '#8a94a0', M: '#5a6470' } },
  fruta: { rows: ['...g....', '..gG....', '.RRRRR..', 'RWRRRRr.', 'RRRRRRr.', 'RRRRRrr.', '.rrrrr..'], pal: { g: '#3a8a3a', G: '#6ac04a', R: '#e2443a', r: '#a8282a', W: '#ffb0a8' } },
  esfera: { rows: ['..GGGG..', '.GgGGGg.', 'GGLLLLGg', 'LLLYYLLL', 'BBLLLLBb', 'BBBBBBBb', '.BBBBBb.', '..bbbb..'], pal: { G: '#5ac04a', g: '#3a8a34', L: '#8a5a34', Y: '#ffe070', B: '#f2e6c8', b: '#c8b890' } },
  racao: { rows: ['.WWWWWW.', 'WbbbbbbW', 'WbYYYYbW', 'WbYGGYbW', 'WbYYYYbW', 'WbbbbbbW', '.WWWWWW.'], pal: { W: '#c8925a', b: '#e8c88a', Y: '#d8443a', G: '#5ac04a' } },
  fogueira: { rows: ['...Y....', '..YOY...', '..OROY..', '.ORRRO..', 'LLLLLLLL', '.llllll.'], pal: { Y: '#ffd25a', O: '#f07a22', R: '#c8321e', L: '#8a5a34', l: '#5a3a20' } },
  tocha: { rows: ['..Y..', '.YOY.', '.ORO.', '..L..', '..L..', '..L..', '..l..'], pal: { Y: '#ffd25a', O: '#f07a22', R: '#c8321e', L: '#a8703e', l: '#6a4024' } },
  energia: { rows: ['...YY', '..YY.', '.YYYY', '...Y.', '..Y..', '.Y...'], pal: { Y: '#ffd84a' } },
  frio: { rows: ['..B..', 'B.B.B', '.BBB.', 'BBWBB', '.BBB.', 'B.B.B', '..B..'], pal: { B: '#9ad8f4', W: '#ffffff' } },
  sol: { rows: ['..Y..', 'Y.Y.Y', '.YWY.', 'YWWWY', '.YWY.', 'Y.Y.Y', '..Y..'], pal: { Y: '#ffc83a', W: '#fff4c0' } },
  lua: { rows: ['.MMM.', 'MMm..', 'MM...', 'MM...', 'MMm..', '.MMM.'], pal: { M: '#e8ecff', m: '#b8c0e8' } },
  coracao: { rows: ['.RR.RR.', 'RWRRRRr', 'RRRRRRr', '.RRRRr.', '..RRr..', '...r...'], pal: { R: '#e8445a', r: '#a8283a', W: '#ffb0b8' } },
  onibus: { rows: ['YYYYYYYY', 'YWWYWWYY', 'YWWYWWYY', 'YYYYYYYY', 'yKyyyyKy', '.K....K.'], pal: { Y: '#f2c43a', y: '#c8962a', W: '#bfe8f8', K: '#2a2a34' } },
};
function iconFromAscii(def) { const r = def.rows, b = new PB(Math.max(...r.map(x => x.length)) + 2, r.length + 2); b.ascii(r, def.pal, 1, 1); return b.outline(); }

// ================= MONTAGEM =================
const ART = { cr: {}, person: {}, props: {}, icon: {} };
function buildArt() {
  for (const k in CR) {
    const o = { walk: [], idle: [] };
    for (let f = 0; f < 4; f++) o.walk.push(sprite(CR[k](f, 'walk')));
    for (let f = 0; f < 2; f++) o.idle.push(sprite(CR[k](f, 'idle')));
    ART.cr[k] = o;
  }
  const person = (look, extra) => { const o = {}; for (const d of ['down', 'up', 'side']) o[d] = { walk: [0, 1, 2, 3].map(f => sprite(drawPerson(d, f, 'walk', look, extra))), idle: [0, 1].map(f => sprite(drawPerson(d, f, 'idle', look, extra))) }; return o; };
  ART.person.player = person(PLAYER_LOOK);
  ART.person.npc = {
    forest: person({ skin: '#c8946a', hair: '#e8e4dc', coat: '#5a8a3a', shirt: '#efe4c8', pants: '#5a4a3a', boots: '#4a3020', scarf: '#d8a43a', pack: '#a8723e' }, { beard: false, noPack: true }),
    savana: person({ skin: '#8a5a3a', hair: '#2a1a14', coat: '#d8843a', shirt: '#f2e0b0', pants: '#7a4a2a', boots: '#5a3a20', scarf: '#2a8a8a', pack: '#a8723e' }, { hat: 'straw', noPack: true }),
    taiga: person({ skin: '#f0c8a8', hair: '#8a8a8a', coat: '#7a3a3a', shirt: '#efe4c8', pants: '#3a3a4a', boots: '#3a2a20', scarf: '#e8e0d0', pack: '#a8723e' }, { hat: 'fur', beard: true, noPack: true }),
    bambu: person({ skin: '#f0cca0', hair: '#1a1a24', coat: '#3a6a5a', shirt: '#efe4c8', pants: '#2a2a34', boots: '#2a2028', scarf: '#c83a2a', pack: '#a8723e' }, { hat: 'cone', noPack: true }),
    swamp: person({ skin: '#a87850', hair: '#3a2418', coat: '#5a6a3a', shirt: '#d8d0b0', pants: '#4a4030', boots: '#3a3020', scarf: '#8a5aa8', pack: '#a8723e' }, { hat: 'hood', noPack: true }),
  };
  ART.god = sprite(drawGod(), 24, 79, true);
  const P = ART.props, many = (n, fn) => Array.from({ length: n }, (_, i) => sprite(fn(i * 7 + 3)));
  P.oak = many(4, s => drawRoundTree(s, TREEP.oak, s % 2)); P.sakura = many(3, s => drawRoundTree(s, TREEP.sakura, s % 2));
  P.jungle = many(2, s => drawRoundTree(s, TREEP.jungle, 1));
  P.pine = many(3, s => drawPine(s, false, s % 2)); P.snowpine = many(3, s => drawPine(s, true, s % 2));
  P.acacia = many(3, drawAcacia); P.bamboo = many(4, drawBamboo); P.swamptree = many(3, drawSwampTree); P.deadtree = many(3, drawDeadTree); P.palm = many(3, drawPalm);
  P.bush = many(2, s => drawBush(s)); P.berry = many(2, s => addBerries(drawBush(s), s, '#e2443a'));
  P.snowbush = many(2, s => drawBush(s, 'snow')); P.snowberry = many(2, s => addBerries(drawBush(s, 'snow'), s, '#5a7ae8'));
  P.drybush = many(2, s => drawBush(s, 'dry')); P.dryberry = many(2, s => addBerries(drawBush(s, 'dry'), s, '#f08a2a'));
  P.rock = many(2, s => drawRock(s, 0)); P.rockM = many(2, s => drawRock(s, 1)); P.boulder = many(2, s => drawRock(s, 2));
  P.darkrock = many(2, s => drawRock(s, 1, { hi: '#6a6070', l: '#4e4656', m: '#3e3644', s: '#2e2834', d: '#201a26' }));
  P.icerock = many(2, s => drawRock(s, 1, { hi: '#ffffff', l: '#d8f0fc', m: '#a8d8f0', s: '#7ab4d8', d: '#5a8ab4' }));
  P.tuft = many(3, s => drawTuft(s, '#c8b450')); P.grass = many(3, s => drawTuft(s, '#4aa040')); P.reeds = many(2, drawReeds);
  P.flowers = many(3, s => drawFlowers(s, ['#ffffff', '#fff27a', '#ffb0d0', '#c8a0ff'])); P.mush = many(2, drawMush);
  P.lantern = [sprite(drawLantern())]; P.mound = [sprite(drawMound())]; P.snowpile = many(2, drawSnowPile); P.bones = [sprite(drawBones())]; P.lily = many(2, drawLilypad);
  P.stump = [sprite(drawStump())]; P.stick = [sprite(drawStick())]; P.pebble = [sprite(drawPebble())];
  P.house = {}; P.home = {}; for (const st in HOUSE_STYLE) { P.house[st] = sprite(drawHouse(st), 30, 55); P.home[st] = sprite(drawHouse(st, true), 30, 55); }
  P.bus = sprite(drawBusStop(), 16, 37); P.shrine = {}; for (const k in SHRINE_COL) P.shrine[k] = sprite(drawShrine(k), 20, 39);
  P.fire = sprite(drawCampfire(true), 9, 8); P.fireOff = sprite(drawCampfire(false), 9, 8); P.barrier = sprite(drawBarrier(), 6, 19, true);
  for (const k in ICON_ASCII) ART.icon[k] = sprite(iconFromAscii(ICON_ASCII[k]), undefined, undefined, true);
  ART.orb = ART.icon.esfera;
}
