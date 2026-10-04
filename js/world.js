'use strict';
// ================= MUNDO =================
// O terreno vem de um "campo de terra" contínuo (v > 0 = terra). Ele é calculado numa grade de 4 px e
// interpolado por pixel, então as costas ficam orgânicas. A terra fica ACIMA da água: abaixo de toda borda
// sul aparece um barranco (como no jogo de referência). O chão é "assado" em blocos de 256 px sob demanda.
const WW = 4000, WH = 3000, CELL = 4, GW = WW / CELL, GH = WH / CELL, CHUNK = 256, CLIFF = 8;
const PAL = {
  forest: { g: ['#2c8428', '#38982e', '#46aa36', '#58ba42', '#76cc58'], sand: ['#d8b664', '#e6c878', '#f2da96'], wall: ['#6e4a26', '#8e6232', '#ac7c40', '#c89650'], road: ['#a8784a', '#b88a5a', '#c89c6a'], flowers: ['#ffffff', '#fff27a', '#ffb0d0'], blades: true },
  savana: { g: ['#a08c34', '#b49e40', '#c6b04c', '#d6c05c', '#e6d27a'], sand: ['#dcb46a', '#e8c47c', '#f2d696'], wall: ['#8a5a2e', '#a8703a', '#c48a48', '#daa25a'], road: ['#b8784a', '#c88a58', '#d89c6a'], flowers: ['#ffb040', '#ffffff'], blades: true },
  taiga: { g: ['#b4c4da', '#c8d6e6', '#dae4f0', '#eaf0f8', '#fafcff'], sand: ['#8e9cb0', '#a2aec0', '#b6c0d0'], wall: ['#4e5c72', '#66768e', '#8292aa', '#9eaec4'], road: ['#94a2b6', '#a6b4c6', '#b8c4d4'], flowers: ['#bfe7f6', '#ffffff'], blades: false },
  bambu: { g: ['#347e48', '#409452', '#4ea65e', '#62b86a', '#80cc80'], sand: ['#c8b884', '#d8c896', '#e6d8aa'], wall: ['#5a5a54', '#74746c', '#8e8e84', '#a8a89c'], road: ['#9a9890', '#aeaca2', '#c0beb4'], flowers: ['#ffd0e4', '#ffffff', '#ffb0d0'], blades: true },
  swamp: { g: ['#3a5428', '#46642e', '#547436', '#628440', '#76984e'], sand: ['#6e6040', '#7e7048', '#8e8054'], wall: ['#3a3224', '#4e4430', '#62563c', '#76684a'], road: ['#6e5a3c', '#7e6a48', '#8e7a54'], flowers: ['#d0b0ff', '#fff27a'], blades: true },
  mordor: { g: ['#262026', '#302830', '#3a3036', '#463a3e', '#524446'], sand: ['#1e1a1e', '#2a2428', '#342c30'], wall: ['#1a1418', '#2a2026', '#3a2c32', '#4a3a3e'], road: ['#3a3030', '#463a3a', '#524444'], flowers: ['#c8321e'], blades: false },
  island: { g: ['#4aa040', '#58b048', '#68c052', '#80d064', '#a0e07e'], sand: ['#ecd08a', '#f4dc9c', '#fbeab4'], wall: ['#9a7a4a', '#b8945a', '#d0aa6a', '#e2c07c'], road: ['#d8b874', '#e4c684', '#eed494'], flowers: ['#ffffff', '#ff9ac8', '#fff27a'], blades: true },
};
const WATER = { sea: ['#22709e', '#2a84b4', '#3aa0c8', '#5ac2d8'], swamp: ['#2e5a4a', '#3a6e58', '#4a8268', '#62987a'], lava: ['#8a1e14', '#c8321e', '#f07a22', '#ffb040'], ice: ['#a0d0ec', '#b8e0f4', '#d0ecfa', '#e8f6fe'] };

class World {
  constructor(seed) {
    this.seed = seed;
    const N = k => valueNoise(seed * 31 + k);
    this.n1 = N(1); this.n2 = N(2); this.n3 = N(3); this.n4 = N(4); this.n5 = N(5); this.n6 = N(6); this.n7 = N(7); this.n8 = N(8);
    this.V = new Float32Array(GW * GH); this.B = new Uint8Array(GW * GH); this.L = new Uint8Array(GW * GH); this.RD = new Float32Array(GW * GH).fill(999);
    this.chunks = new Map(); this.props = []; this.grid = new Map(); this.GS = 128;
    this.planVillages(); this.planRoads(); this.genField(); this.placeStructures(); this.genProps(); this.buildMinimap();
  }
  // ---------- campo de terra ----------
  baseField(x, y) {
    const dx = Math.abs(x - 1900) / 1450, dy = Math.abs(y - 1500) / 1150, e = Math.cbrt(dx * dx * dx + dy * dy * dy);
    let v = 0.92 - e + (this.n1(x / 420, y / 420) - 0.5) * 0.45 + (this.n2(x / 120, y / 120) - 0.5) * 0.12, isl = false;
    for (const I of ISLANDS) { const d = Math.hypot(x - I.x, y - I.y) / I.r; if (d > 1.6) continue; const iv = (1 - d) * 0.5 + (this.n2(x / 70, y / 70) - 0.5) * 0.22; if (iv > v) { v = iv; isl = true; } }
    return [v, isl];
  }
  biomeRaw(x, y) {
    const wx = x + (this.n4(x / 300, y / 300) - 0.5) * 300, wy = y + (this.n5(x / 300, y / 300) - 0.5) * 300;
    let b1 = 'forest', d1 = 1e9, b2 = 'forest', d2 = 1e9;
    for (const k in BIOMES) { if (k === 'island') continue; const B = BIOMES[k]; let d = Math.hypot(wx - B.cx, (wy - B.cy) * 1.1) - (k === 'forest' ? 160 : 0); if (d < d1) { b2 = b1; d2 = d1; b1 = k; d1 = d; } else if (d < d2) { b2 = k; d2 = d; } }
    return [b1, b2, d2 - d1];
  }
  genField() {
    const lakeTh = { forest: 0.77, savana: 0.74, taiga: 0.72, bambu: 0.75, swamp: 0.6, mordor: 0.66 };
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const x = i * CELL + 2, y = j * CELL + 2, k = j * GW + i;
      let [v, isl] = this.baseField(x, y);
      const b = isl ? 'island' : this.biomeRaw(x, y)[0];
      this.B[k] = BIOMES[b].id;
      if (!isl && v > 0.06) { const ln = this.n3(x / 190, y / 190), th = lakeTh[b]; if (ln > th) { const lv = (th - ln) * 2.6 + 0.02; if (lv < v) { v = lv; if (v <= 0) this.L[k] = 1; } } }
      // estradas e vilas sempre em terra
      let rd = 999; for (const s of this.roadSegs) { if (x < s.x0 - 60 || x > s.x1 + 60 || y < s.y0 - 60 || y > s.y1 + 60) continue; const d = segDist(x, y, s); if (d < rd) rd = d; }
      this.RD[k] = rd;
      if (rd < 30) { const p = 0.14 - rd / 120; if (p > v) { v = p; this.L[k] = 0; } }
      for (const vl of this.villages) { const d = Math.hypot(x - vl.x, y - vl.y); if (d < 200) { const p = 0.35 * (1 - d / 200); if (p > v) { v = p; this.L[k] = 0; } } }
      if (v > 0) this.L[k] = 0;
      this.V[k] = v;
    }
  }
  planVillages() {
    this.villages = [];
    for (const b of ['forest', 'savana', 'taiga', 'bambu', 'swamp']) { const B = BIOMES[b]; this.villages.push({ biome: b, x: B.cx, y: B.cy, ...VILLAGES[b] }); }
  }
  planRoads() {
    const r = mulberry32(this.seed + 5), segs = [];
    const F = this.villages[0];
    for (const v of this.villages.slice(1)) {
      const pts = [[F.x + 40, F.y + 50]], n = 5, ex = v.x + 40, ey = v.y + 50, px = -(ey - pts[0][1]), py = ex - pts[0][0], pl = Math.hypot(px, py);
      for (let i = 1; i < n; i++) { const t = i / n, o = (r() - 0.5) * 140; pts.push([lerp(pts[0][0], ex, t) + px / pl * o, lerp(pts[0][1], ey, t) + py / pl * o]); }
      pts.push([ex, ey]);
      for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx2, by2] = pts[i]; segs.push({ ax, ay, bx: bx2, by: by2, x0: Math.min(ax, bx2), x1: Math.max(ax, bx2), y0: Math.min(ay, by2), y1: Math.max(ay, by2) }); }
    }
    this.roadSegs = segs;
  }
  // ---------- amostragem ----------
  v(x, y) {
    const fx = x / CELL - 0.5, fy = y / CELL - 0.5, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, w = fy - j;
    if (i < 0 || j < 0 || i >= GW - 1 || j >= GH - 1) return -1;
    const k = j * GW + i, V = this.V;
    return (V[k] * (1 - u) + V[k + 1] * u) * (1 - w) + (V[k + GW] * (1 - u) + V[k + GW + 1] * u) * w;
  }
  rd(x, y) { const i = clamp(R(x / CELL - 0.5), 0, GW - 1), j = clamp(R(y / CELL - 0.5), 0, GH - 1); return this.RD[j * GW + i]; }
  cellB(x, y) { const i = clamp(Math.floor(x / CELL), 0, GW - 1), j = clamp(Math.floor(y / CELL), 0, GH - 1); return BIOME_BY_ID[this.B[j * GW + i]] || 'forest'; }
  lake(x, y) { const i = clamp(Math.floor(x / CELL), 0, GW - 1), j = clamp(Math.floor(y / CELL), 0, GH - 1); return this.L[j * GW + i] === 1; }
  // tipo de chão em (x,y): 'land' | 'water' | 'ice' | 'lava'
  ground(x, y) {
    if (x < 0 || y < 0 || x >= WW || y >= WH) return 'water';
    if (this.v(x, y) > 0) return 'land';
    if (this.lake(x, y)) { const b = this.cellB(x, y); if (b === 'taiga') return 'ice'; if (b === 'mordor') return 'lava'; }
    return 'water';
  }
  // bioma visual com borda pontilhada
  biomeVis(x, y) {
    const cb = this.cellB(x, y); if (cb === 'island') return 'island';
    const [b1, b2, gap] = this.biomeRaw(x, y);
    if (gap < 14 && hash2(x, y, 77) > gap / 14) return b2 === 'island' ? b1 : b2;
    return b1;
  }
  // ---------- estruturas ----------
  placeStructures() {
    const r = mulberry32(this.seed + 9);
    this.stops = []; this.shrines = []; this.fires = []; this.npcs = [];
    for (const vl of this.villages) {
      const st = vl.biome, x = vl.x, y = vl.y;
      this.addProp({ kind: 'home', x: x - 70, y: y - 20, spr: ART.props.home[st], rect: [-22, -12, 44, 13], home: true, biome: st });
      this.addProp({ kind: 'house', x: x + 60, y: y - 34, spr: ART.props.house[st], rect: [-22, -12, 44, 13] });
      this.addProp({ kind: 'house', x: x - 5, y: y - 82, spr: ART.props.house[st], rect: [-22, -12, 44, 13] });
      const stop = { kind: 'bus', x: x + 95, y: y + 50, spr: ART.props.bus, rect: [-12, -8, 22, 6], biome: st, name: vl.n };
      this.addProp(stop); this.stops.push(stop);
      const fire = { kind: 'fire', x: x - 20, y: y + 34, spr: ART.props.fire, r: 6, lit: true, village: true };
      this.addProp(fire); this.fires.push(fire);
      this.npcs.push({ x: x + 22, y: y + 14, biome: st, name: vl.npc, lines: vl.lines, village: vl.n });
      vl.home = { x: x - 70, y: y - 6 };
      // santuário: ~260 px da vila, em terra do mesmo bioma
      let best = null;
      for (let t = 0; t < 60; t++) { const a = r() * TAU, d = 220 + r() * 120, sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d; if (this.v(sx, sy) > 0.1 && this.cellB(sx, sy) === st && this.rd(sx, sy) > 40) { best = [sx, sy]; break; } }
      if (!best) best = [x - 150, y + 160];
      const sh = { kind: 'shrine', x: best[0], y: best[1], spr: ART.props.shrine[st], rect: [-16, -8, 32, 8], biome: st };
      this.addProp(sh); this.shrines.push(sh);
    }
    // santuário das ilhas
    const I = ISLANDS[0]; const sh = { kind: 'shrine', x: I.x, y: I.y + 10, spr: ART.props.shrine.island, rect: [-16, -8, 32, 8], biome: 'island' };
    this.addProp(sh); this.shrines.push(sh);
  }
  clear(x, y) {
    for (const vl of this.villages) if (Math.hypot(x - vl.x, y - vl.y) < 170) return false;
    for (const s of this.shrines) if (Math.hypot(x - s.x, y - s.y) < 60) return false;
    if (this.rd(x, y) < 18) return false;
    return true;
  }
  genProps() {
    const r = mulberry32(this.seed + 13), STEP = 20;
    const T = {
      forest: [['oak', 0.15], ['pine', 0.05], ['bush', 0.03], ['berry', 0.03], ['rockM', 0.012], ['boulder', 0.012], ['flowers', 0.05], ['grass', 0.06], ['mush', 0.01], ['stick', 0.014], ['pebble', 0.014]],
      savana: [['acacia', 0.04], ['drybush', 0.02], ['dryberry', 0.025], ['tuft', 0.12], ['mound', 0.01], ['boulder', 0.014], ['rockM', 0.018], ['bones', 0.005], ['stick', 0.012], ['pebble', 0.016]],
      taiga: [['snowpine', 0.19], ['snowbush', 0.02], ['snowberry', 0.025], ['icerock', 0.018], ['boulder', 0.012], ['snowpile', 0.04], ['stick', 0.014], ['pebble', 0.014]],
      bambu: [['bamboo', 0.15], ['sakura', 0.04], ['jungle', 0.02], ['boulder', 0.028], ['rockM', 0.028], ['lantern', 0.005], ['grass', 0.06], ['flowers', 0.03], ['berry', 0.02], ['stick', 0.012], ['pebble', 0.016]],
      swamp: [['swamptree', 0.09], ['reeds', 0.08], ['mush', 0.03], ['bush', 0.03], ['berry', 0.025], ['grass', 0.05], ['rockM', 0.01], ['stick', 0.016], ['pebble', 0.012]],
      mordor: [['deadtree', 0.06], ['darkrock', 0.05], ['bones', 0.015]],
      island: [['palm', 0.09], ['bush', 0.02], ['berry', 0.035], ['grass', 0.05], ['rockM', 0.02], ['flowers', 0.03], ['pebble', 0.012], ['stick', 0.012]],
    };
    for (let y = STEP; y < WH - STEP; y += STEP) for (let x = STEP; x < WW - STEP; x += STEP) {
      const px = x + (r() - 0.5) * STEP * 0.9, py = y + (r() - 0.5) * STEP * 0.9, v = this.v(px, py);
      if (v <= 0) {
        if (v < -0.01 && v > -0.12 && this.cellB(px, py) === 'swamp' && r() < 0.06 && this.ground(px, py) === 'water') this.addProp({ kind: 'lily', x: px, y: py, spr: pick(ART.props.lily), flat: true });
        continue;
      }
      if (v < 0.04 || !this.clear(px, py)) { r(); continue; }
      const b = this.cellB(px, py), tab = T[b]; let roll = r();
      for (const [k, p] of tab) { if (roll < p) { this.spawnProp(k, px, py, b); break; } roll -= p; }
    }
  }
  spawnProp(k, x, y, biome) {
    const P = ART.props, TREES = { oak: 1, pine: 1, snowpine: 1, acacia: 1, sakura: 1, jungle: 1, swamptree: 1, palm: 1 };
    const o = { kind: k, x: R(x), y: R(y), spr: pick(P[k]), biome };
    if (TREES[k]) { o.r = 4; o.harvest = 'tree'; }
    else if (k === 'bamboo') { o.r = 5; o.harvest = 'bamboo'; }
    else if (k === 'boulder') { o.r = 10; o.harvest = 'boulder'; }
    else if (k === 'rockM' || k === 'icerock' || k === 'darkrock') { o.r = 5; o.harvest = k === 'darkrock' ? 'cristal' : 'rock'; }
    else if (k === 'berry' || k === 'snowberry' || k === 'dryberry') { o.r = 5; o.harvest = 'berry'; o.plain = { berry: 'bush', snowberry: 'snowbush', dryberry: 'drybush' }[k]; o.full = o.spr; o.empty = pick(P[o.plain]); }
    else if (k === 'bush' || k === 'snowbush' || k === 'drybush') o.r = 5;
    else if (k === 'stick' || k === 'pebble') { o.harvest = k; o.flat = true; }
    else if (k === 'mound' || k === 'deadtree') o.r = 5;
    else if (k === 'lantern') o.r = 4;
    else if (k === 'flowers' || k === 'grass' || k === 'tuft' || k === 'mush' || k === 'reeds' || k === 'snowpile' || k === 'bones') o.deco = true;
    this.addProp(o); return o;
  }
  addProp(o) {
    this.props.push(o); const k = Math.floor(o.x / this.GS) + ',' + Math.floor(o.y / this.GS);
    let a = this.grid.get(k); if (!a) this.grid.set(k, a = []); a.push(o); return o;
  }
  removeProp(o) { const k = Math.floor(o.x / this.GS) + ',' + Math.floor(o.y / this.GS), a = this.grid.get(k); if (a) { const i = a.indexOf(o); if (i >= 0) a.splice(i, 1); } const i = this.props.indexOf(o); if (i >= 0) this.props.splice(i, 1); }
  near(x, y, rad, fn) {
    const g = this.GS, i0 = Math.floor((x - rad) / g), i1 = Math.floor((x + rad) / g), j0 = Math.floor((y - rad) / g), j1 = Math.floor((y + rad) / g);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const a = this.grid.get(i + ',' + j); if (a) for (const o of a) fn(o); }
  }
  // colisão com objetos sólidos
  hitsProp(x, y, rad) {
    let hit = false;
    this.near(x, y, rad + 40, o => {
      if (hit || o.gone) return;
      if (o.rect) { const [rx, ry, rw, rh] = o.rect; const nx = clamp(x, o.x + rx, o.x + rx + rw), ny = clamp(y, o.y + ry, o.y + ry + rh); if (Math.hypot(x - nx, y - ny) < rad) hit = true; }
      else if (o.r && !o.stump) { if (Math.hypot((x - o.x), (y - o.y) * 1.6) < rad + o.r) hit = true; }
    });
    return hit;
  }
  // ---------- assar o chão ----------
  chunk(ci, cj) {
    const key = ci + ',' + cj; let c = this.chunks.get(key); if (c) return c;
    c = this.bake(ci, cj); this.chunks.set(key, c); return c;
  }
  bake(ci, cj) {
    const c = mkc(CHUNK, CHUNK), x0 = ci * CHUNK, y0 = cj * CHUNK, ctx = c.getContext('2d'), id = ctx.createImageData(CHUNK, CHUNK), D = id.data;
    const foam = [], spark = [];
    const put = (i, col) => { const [r, g, b] = hexRGB(col); D[i] = r; D[i + 1] = g; D[i + 2] = b; D[i + 3] = 255; };
    for (let ly = 0; ly < CHUNK; ly++) for (let lx = 0; lx < CHUNK; lx++) {
      const x = x0 + lx, y = y0 + ly, i = (ly * CHUNK + lx) * 4, v = this.v(x, y);
      if (v > 0) { put(i, this.landColor(x, y, v)); continue; }
      // água: procura terra acima (barranco)
      const lk = this.lake(x, y), cb = this.cellB(x, y), isIce = lk && cb === 'taiga', isLava = lk && cb === 'mordor';
      if (isIce) { const t = bayer(x, y), k = clamp(Math.floor((-v) * 14 + t * 1.2), 0, 3); let col = WATER.ice[3 - k]; if (Math.abs(this.n8(x / 14, y / 14) - 0.5) < 0.015) col = '#ffffff'; put(i, col); continue; }
      let kL = 0; if (v > -0.3) for (let k = 1; k <= CLIFF + 3; k++) if (this.v(x, y - k) > 0) { kL = k; break; }
      const bv = kL ? this.biomeVis(x, y - kL) : cb;
      if (kL && kL <= CLIFF) { const W = PAL[bv].wall, band = (Math.floor((y - kL) / 3) + kL) % 3; let col = kL === 1 ? W[3] : kL >= CLIFF - 1 ? W[0] : W[band === 0 ? 1 : 2]; if (hash2(x, y, 4) < 0.05) col = W[0]; put(i, col); continue; }
      const P = isLava ? WATER.lava : (cb === 'swamp' ? WATER.swamp : WATER.sea);
      let d = clamp((-v) * 7 + bayer(x, y) * 0.5, 0, 3.49); let idx = 3 - Math.floor(d);
      if (kL > CLIFF) idx = Math.max(0, idx - 1);
      put(i, P[clamp(idx, 0, 3)]);
      if (kL === CLIFF + 1 || (v > -0.012 && !kL)) foam.push(lx, ly);
      else if (hash2(x, y, 11) < 0.006) spark.push(lx, ly);
    }
    ctx.putImageData(id, 0, 0);
    return { c, foam, spark };
  }
  landColor(x, y, v) {
    const b = this.biomeVis(x, y), P = PAL[b], rd = this.rd(x, y);
    if (rd < 9 && b !== 'mordor') { const t = rd + (hash2(x, y, 5) - 0.5) * 2.5; if (t < 7) { const k = t > 5.5 ? 0 : (this.n7(x / 4, y / 4) + bayer(x, y) * 0.4 > 0.75 ? 2 : 1); return P.road[k]; } }
    if (v < 0.035) { const k = clamp(Math.floor(v / 0.035 * 3 + bayer(x, y) * 0.8 - 0.4), 0, 2); return P.sand[k]; }
    const t = this.n6(x / 22, y / 22) * 0.62 + this.n7(x / 6, y / 6) * 0.38;
    let k = clamp(Math.floor(t * 5.2 + bayer(x, y) - 0.9), 0, 4);
    if (b === 'mordor' && Math.abs(this.n8(x / 26, y / 26) - 0.5) < 0.01) return '#c8321e';
    if (b === 'swamp' && this.n6(x / 40, y / 40) < 0.3) k = Math.max(0, k - 2);
    const h = hash2(x, y, 1);
    if (P.blades) { if (h < 0.02) k = Math.max(0, k - 2); else if (hash2(x, y + 1, 1) < 0.02) k = Math.min(4, k + 1); }
    if (h > 0.9985) return pick(P.flowers);
    if (b === 'taiga' && h > 0.994) return '#9ad0f0';
    return P.g[k];
  }
  // ---------- minimapa ----------
  buildMinimap() {
    const S = 8, w = WW / S, h = WH / S, c = mkc(w, h), x = c.getContext('2d'), id = x.createImageData(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const px = i * S + 4, py = j * S + 4, v = this.v(px, py), g = this.ground(px, py); let col;
      if (g === 'land') { const b = this.cellB(px, py); col = this.rd(px, py) < 8 && b !== 'mordor' ? PAL[b].road[1] : v < 0.035 ? PAL[b].sand[1] : PAL[b].g[2]; }
      else if (g === 'ice') col = WATER.ice[1]; else if (g === 'lava') col = WATER.lava[2]; else col = v > -0.05 ? WATER.sea[3] : v > -0.15 ? WATER.sea[2] : WATER.sea[1];
      const [r, gg, b] = hexRGB(col), k = (j * w + i) * 4; id.data[k] = r; id.data[k + 1] = gg; id.data[k + 2] = b; id.data[k + 3] = 255;
    }
    x.putImageData(id, 0, 0); this.mini = c;
  }
}
function segDist(x, y, s) { const vx = s.bx - s.ax, vy = s.by - s.ay, l2 = vx * vx + vy * vy || 1, t = clamp(((x - s.ax) * vx + (y - s.ay) * vy) / l2, 0, 1); return Math.hypot(x - s.ax - vx * t, y - s.ay - vy * t); }
