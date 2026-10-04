'use strict';
// ================= UTILIDADES =================
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const R = Math.round;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash2 = (x, y, s = 0) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
// ruído de valor suave (tabela 256x256)
function valueNoise(seed) {
  const r = mulberry32(seed), N = 256, P = new Float32Array(N * N); for (let i = 0; i < P.length; i++) P[i] = r();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = xi & 255, y0 = yi & 255, x1 = (xi + 1) & 255, y1 = (yi + 1) & 255;
    const a = P[y0 * N + x0], b = P[y0 * N + x1], c = P[y1 * N + x0], d = P[y1 * N + x1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
const ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: t => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

// ================= TELA: buffer em baixa resolução ampliado por fator inteiro =================
const cv = document.getElementById('game');
const cx = cv.getContext('2d', { alpha: false });
const buf = document.createElement('canvas');
const bx = buf.getContext('2d');
const V = { W: 480, H: 270, S: 2, dpr: 1 };
function resize() {
  const dpr = window.devicePixelRatio || 1; V.dpr = dpr;
  const w = Math.max(320, Math.round(innerWidth * dpr)), h = Math.max(200, Math.round(innerHeight * dpr));
  cv.width = w; cv.height = h; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  // escala inteira; em janelas pequenas ainda usa 2x pro texto continuar legível
  const S = Math.max(w >= 600 && h >= 400 ? 2 : 1, Math.round(Math.min(w / 480, h / 270)));
  V.S = S; V.W = Math.ceil(w / S); V.H = Math.ceil(h / S);
  buf.width = V.W; buf.height = V.H;
  bx.imageSmoothingEnabled = false; cx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); resize();
function present() { cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = false; cx.drawImage(buf, 0, 0, V.W, V.H, 0, 0, V.W * V.S, V.H * V.S); }

// ================= ENTRADA =================
const In = { keys: {}, pressed: {}, mx: 240, my: 135, mdown: false, mclick: false, rclick: false, wheel: 0, lost: false };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (!In.keys[k]) In.pressed[k] = true;
  In.keys[k] = true;
  if ([' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  Snd.unlock();
});
addEventListener('keyup', e => { In.keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { In.keys = {}; In.mdown = false; In.lost = true; });
function mousePos(e) { const r = cv.getBoundingClientRect(); In.mx = (e.clientX - r.left) * (cv.width / r.width) / V.S; In.my = (e.clientY - r.top) * (cv.height / r.height) / V.S; }
cv.addEventListener('mousemove', mousePos);
cv.addEventListener('mousedown', e => { mousePos(e); if (e.button === 0) { In.mdown = true; In.mclick = true; } if (e.button === 2) In.rclick = true; Snd.unlock(); });
addEventListener('mouseup', e => { if (e.button === 0) In.mdown = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { In.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
function endFrameInput() { In.pressed = {}; In.mclick = false; In.rclick = false; In.wheel = 0; }
const key = k => !!In.keys[k];
const pressed = k => !!In.pressed[k];
const inRect = (x, y, w, h) => In.mx >= x && In.mx < x + w && In.my >= y && In.my < y + h;

// ================= SOM (sintetizado, sem arquivos) =================
const Snd = {
  ctx: null, master: null, last: {},
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.22; this.musicBus.connect(this.master);
    const n = this.ctx.sampleRate; this.noiseBuf = this.ctx.createBuffer(1, n, n); const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  },
  tone(f, dur, o = {}) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + (o.delay || 0);
    const os = c.createOscillator(), g = c.createGain(); os.type = o.type || 'square'; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
    const v = (o.vol ?? 0.2); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    os.connect(g); g.connect(o.bus || this.master); os.start(t); os.stop(t + dur + 0.05);
  },
  noise(dur, o = {}) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + (o.delay || 0);
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; const fl = c.createBiquadFilter(); fl.type = o.ft || 'lowpass'; fl.frequency.value = o.f || 1200;
    if (o.fto) fl.frequency.exponentialRampToValueAtTime(o.fto, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(o.vol ?? 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(this.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  play(name) {
    if (!this.ctx) return; const now = this.ctx.currentTime; if (now - (this.last[name] || 0) < 0.04) return; this.last[name] = now;
    const T = (f, d, o) => this.tone(f, d, o), N = (d, o) => this.noise(d, o);
    switch (name) {
      case 'click': T(660, 0.06, { vol: 0.08 }); break;
      case 'hover': T(880, 0.03, { vol: 0.03 }); break;
      case 'open': T(440, 0.07, { vol: 0.07 }); T(660, 0.08, { vol: 0.07, delay: 0.05 }); break;
      case 'close': T(660, 0.07, { vol: 0.07 }); T(440, 0.08, { vol: 0.07, delay: 0.05 }); break;
      case 'step': N(0.05, { f: 900, vol: 0.05 }); break;
      case 'hit': N(0.12, { f: 2400, fto: 300, vol: 0.25 }); T(180, 0.1, { to: 60, vol: 0.15 }); break;
      case 'zap': T(1200, 0.12, { to: 200, type: 'sawtooth', vol: 0.08 }); N(0.1, { ft: 'highpass', f: 3000, vol: 0.1 }); break;
      case 'fire': N(0.25, { f: 900, fto: 200, vol: 0.18 }); break;
      case 'water': N(0.25, { ft: 'bandpass', f: 1400, fto: 500, vol: 0.2 }); break;
      case 'leaf': N(0.15, { ft: 'bandpass', f: 3000, vol: 0.12 }); T(900, 0.08, { to: 1400, type: 'triangle', vol: 0.05 }); break;
      case 'ice': T(1800, 0.15, { to: 2600, type: 'triangle', vol: 0.07 }); N(0.12, { ft: 'highpass', f: 5000, vol: 0.08 }); break;
      case 'punch': N(0.08, { f: 700, vol: 0.3 }); T(120, 0.1, { to: 50, vol: 0.2 }); break;
      case 'throw': N(0.18, { ft: 'bandpass', f: 1800, fto: 600, vol: 0.12 }); break;
      case 'shake': T(300, 0.06, { vol: 0.1, type: 'triangle' }); break;
      case 'catch': [523, 659, 784, 1046].forEach((f, i) => T(f, 0.14, { delay: i * 0.08, vol: 0.12, type: 'square' })); break;
      case 'fail': T(330, 0.15, { to: 160, vol: 0.12 }); break;
      case 'level': [392, 523, 659, 784].forEach((f, i) => T(f, 0.12, { delay: i * 0.06, vol: 0.1, type: 'triangle' })); break;
      case 'evolve': [262, 330, 392, 523, 659, 784, 1046].forEach((f, i) => T(f, 0.25, { delay: i * 0.1, vol: 0.12, type: 'triangle' })); break;
      case 'cut': N(0.1, { ft: 'highpass', f: 1500, vol: 0.2 }); T(220, 0.08, { to: 90, vol: 0.12, type: 'triangle' }); break;
      case 'rock': N(0.15, { f: 500, vol: 0.3 }); T(90, 0.12, { to: 40, vol: 0.2 }); break;
      case 'pick': T(880, 0.06, { vol: 0.07, type: 'triangle' }); T(1320, 0.07, { vol: 0.07, delay: 0.05, type: 'triangle' }); break;
      case 'craft': [523, 784, 1046].forEach((f, i) => T(f, 0.1, { delay: i * 0.07, vol: 0.09, type: 'triangle' })); break;
      case 'deny': T(160, 0.15, { vol: 0.12 }); break;
      case 'heal': [660, 880, 1100].forEach((f, i) => T(f, 0.18, { delay: i * 0.06, vol: 0.06, type: 'sine' })); break;
      case 'bus': T(330, 0.25, { vol: 0.12, type: 'square' }); T(262, 0.35, { vol: 0.12, type: 'square', delay: 0.28 }); break;
      case 'quest': [659, 784, 988, 1318].forEach((f, i) => T(f, 0.16, { delay: i * 0.09, vol: 0.09, type: 'triangle' })); break;
      case 'faint': T(440, 0.4, { to: 110, vol: 0.12, type: 'triangle' }); break;
      case 'god': [196, 247, 294, 392].forEach((f, i) => T(f, 1.6, { delay: i * 0.12, vol: 0.05, type: 'sine', att: 0.3 })); break;
      case 'cry': T(700 + Math.random() * 400, 0.12, { to: 1200, vol: 0.06, type: 'triangle' }); break;
      case 'splash': N(0.3, { ft: 'bandpass', f: 900, vol: 0.18 }); break;
    }
  },
};
// trilha generativa bem simples: dedilhado pentatônico que muda de escala por bioma e dia/noite
const Music = {
  t: 0, step: 0, scale: [0, 2, 4, 7, 9], root: 220, on: true,
  set(root, scale) { this.root = root; this.scale = scale; },
  update(dt) {
    if (!Snd.ctx || !this.on) return; this.t -= dt; if (this.t > 0) return;
    this.t = 0.42; this.step++;
    const sc = this.scale, n = i => this.root * Math.pow(2, (sc[((i % sc.length) + sc.length) % sc.length] + 12 * Math.floor(i / sc.length)) / 12);
    if (this.step % 16 === 0) { [0, 2, 4].forEach(i => Snd.tone(n(i) / 2, 3.2, { type: 'sine', vol: 0.05, att: 0.6, bus: Snd.musicBus })); }
    if (Math.random() < 0.42) Snd.tone(n(irand(3, 9)), 0.5, { type: 'triangle', vol: 0.06, att: 0.01, bus: Snd.musicBus });
  },
};

// ================= TEXTO E INTERFACE (desenhados no canvas de tela cheia, em unidades do buffer) =================
const FONT = '"Pixelify Sans", "Lucida Console", monospace';
let UI = cx; // contexto da interface
function uiBegin() { UI.setTransform(V.S, 0, 0, V.S, 0, 0); UI.imageSmoothingEnabled = false; }
function text(s, x, y, o = {}) {
  const c = UI, size = o.size || 8; s = String(s);
  c.font = (o.bold ? '700 ' : '500 ') + size + 'px ' + FONT; c.textAlign = o.align || 'left'; c.textBaseline = 'top';
  if (o.alpha !== undefined) c.globalAlpha = clamp(o.alpha, 0, 1);
  if (o.shadow !== false) { c.fillStyle = o.shadowColor || 'rgba(20,12,24,0.85)'; const d = Math.max(1, V.S / 2) / V.S; c.fillText(s, x + d, y + d); c.fillText(s, x, y + d * 1.6); }
  c.fillStyle = o.color || '#fbf3e0'; c.fillText(s, x, y);
  c.globalAlpha = 1;
}
function textW(s, size = 8, bold) { UI.font = (bold ? '700 ' : '500 ') + size + 'px ' + FONT; return UI.measureText(String(s)).width; }
function wrapText(s, maxW, size = 8) {
  const out = []; for (const para of String(s).split('\n')) { let cur = ''; for (const w of para.split(' ')) { const t = cur ? cur + ' ' + w : w; if (textW(t, size) > maxW && cur) { out.push(cur); cur = w; } else cur = t; } out.push(cur); }
  return out;
}
const PAN = {
  dark: { fill: '#2c2236', out: '#120c18', hi: 'rgba(255,255,255,0.10)', lo: 'rgba(0,0,0,0.3)' },
  paper: { fill: '#f6ead0', out: '#3a2a20', hi: '#ffffff', lo: '#dcc8a0' },
  wood: { fill: '#8a5a34', out: '#2a1810', hi: '#b8824e', lo: '#5e3a1e' },
  green: { fill: '#3e8a3a', out: '#14300e', hi: '#6cbc5a', lo: '#245a1e' },
  gold: { fill: '#e2a428', out: '#4a2808', hi: '#ffe070', lo: '#a86a10' },
  red: { fill: '#b8362e', out: '#3a0e0e', hi: '#e8665a', lo: '#7a1a1a' },
  teal: { fill: '#2a6e78', out: '#0c2228', hi: '#5ab0b4', lo: '#174850' },
};
function panel(x, y, w, h, st = PAN.dark, alpha) {
  const c = UI; x = R(x); y = R(y); w = R(w); h = R(h);
  if (alpha !== undefined) c.globalAlpha = alpha;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 1, y + h, w - 2, 2);
  c.fillStyle = st.out; c.fillRect(x + 1, y, w - 2, h); c.fillRect(x, y + 1, w, h - 2);
  c.fillStyle = st.fill; c.fillRect(x + 1, y + 1, w - 2, h - 2);
  c.fillStyle = st.hi; c.fillRect(x + 2, y + 1, w - 4, 1);
  c.fillStyle = st.lo; c.fillRect(x + 2, y + h - 2, w - 4, 1);
  c.globalAlpha = 1;
}
const Btn = { hot: null, last: null };
function button(id, x, y, w, h, label, o = {}) {
  const hov = inRect(x, y, w, h) && !o.disabled;
  if (hov) Btn.hot = id;
  const st = o.disabled ? { fill: '#4a3e48', out: '#140e18', hi: 'rgba(255,255,255,0.05)', lo: 'rgba(0,0,0,0.3)' } : (o.style || PAN.wood);
  panel(x, y - (hov ? 1 : 0), w, h, st);
  if (hov) { UI.fillStyle = 'rgba(255,255,255,0.13)'; UI.fillRect(x + 2, y + 1, w - 4, h - 4); }
  text(label, x + w / 2, y + h / 2 - (o.size || 8) / 2 - (hov ? 1 : 0) - 1, { align: 'center', size: o.size || 8, color: o.disabled ? '#8a7e88' : (o.color || '#fbf3e0') });
  if (hov && In.mclick) { Snd.play('click'); In.mclick = false; return true; }
  return false;
}
function bar(x, y, w, h, k, col, bg = '#3a2430') {
  const c = UI; x = R(x); y = R(y);
  c.fillStyle = '#120c18'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.fillStyle = bg; c.fillRect(x, y, w, h);
  c.fillStyle = col; c.fillRect(x, y, R(w * clamp(k, 0, 1)), h);
  c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x, y, R(w * clamp(k, 0, 1)), 1);
}
function buttonsEndFrame() { if (Btn.hot && Btn.hot !== Btn.last) Snd.play('hover'); Btn.last = Btn.hot; Btn.hot = null; }

// ================= JUICE: tremida, flash, partículas, números =================
const Cam = { x: 0, y: 0, trauma: 0, sx: 0, sy: 0 };
function shake(a) { Cam.trauma = Math.min(1, Cam.trauma + a); }
const FX = {
  parts: [], texts: [],
  add(p) { p.t = 0; p.life = p.life || 0.5; p.z = p.z || 0; p.vz = p.vz || 0; p.vx = p.vx || 0; p.vy = p.vy || 0; this.parts.push(p); return p; },
  text(x, y, s, col = '#fbf3e0', size = 7) { this.texts.push({ x, y, s, col, size, t: 0, life: 1 }); },
  burst(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const a = o.angle !== undefined ? o.angle + rand(-(o.spread || 1), o.spread || 1) : rand(TAU), sp = rand(o.speed[0], o.speed[1]);
      this.add({ x: x + rand(-(o.jx || 0), o.jx || 0), y: y + rand(-(o.jy || 0), o.jy || 0), z: o.z || 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: o.vz ? rand(o.vz[0], o.vz[1]) : 0, g: o.g || 0, drag: o.drag ?? 3, life: rand(o.life[0], o.life[1]), size: o.size || 1, color: Array.isArray(o.color) ? pick(o.color) : o.color, type: o.type || 'sq', glow: o.glow });
    }
  },
  update(dt) {
    for (const p of this.parts) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; const d = Math.exp(-(p.drag || 0) * dt); p.vx *= d; p.vy *= d;
      if (p.g) { p.vz -= p.g * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = 0; p.vx *= 0.3; p.vy *= 0.3; } } else if (p.vz) { p.z += p.vz * dt; }
    }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const t of this.texts) { t.t += dt; t.y -= 22 * dt * Math.max(0, 1 - t.t * 1.2); }
    this.texts = this.texts.filter(t => t.t < t.life);
  },
  draw(ctx, camX, camY) {
    for (const p of this.parts) {
      const k = p.t / p.life, x = R(p.x - camX), y = R(p.y - p.z - camY);
      if (x < -10 || y < -10 || x > V.W + 10 || y > V.H + 10) continue;
      ctx.fillStyle = p.color;
      if (p.type === 'ring') { const r = lerp(p.r0, p.r1, ease.outCubic(k)); ctx.globalAlpha = 1 - k; pixRing(ctx, x, y, r, p.color); ctx.globalAlpha = 1; continue; }
      if (p.type === 'star') { if (k < 0.6 || Math.floor(p.t * 20) % 2) { ctx.fillRect(x, y - 1, 1, 3); ctx.fillRect(x - 1, y, 3, 1); } continue; }
      if (p.type === 'leaf') { const w = Math.sin(p.t * 7 + p.x) > 0 ? 2 : 1; ctx.fillRect(x, y, w, 1); continue; }
      const s = Math.max(1, R(p.size * (1 - k * 0.7)));
      if (p.fade) ctx.globalAlpha = 1 - k;
      ctx.fillRect(x - (s >> 1), y - (s >> 1), s, s);
      ctx.globalAlpha = 1;
    }
  },
  drawTexts(camX, camY) {
    for (const t of this.texts) text(t.s, R(t.x - camX), R(t.y - camY), { align: 'center', size: t.size, color: t.col, alpha: t.t > 0.7 ? (1 - t.t) / 0.3 : 1 });
  },
};
function pixRing(ctx, x, y, r, col) { ctx.fillStyle = col; const n = Math.max(8, Math.floor(r * 6)); for (let i = 0; i < n; i++) { const a = i / n * TAU; ctx.fillRect(R(x + Math.cos(a) * r), R(y + Math.sin(a) * r * 0.55), 1, 1); } }
function pixDisc(ctx, x, y, r, sq = 0.55) { for (let j = -Math.ceil(r * sq); j <= Math.ceil(r * sq); j++) { const w = R(Math.sqrt(Math.max(0, r * r - (j / sq) * (j / sq)))); if (w > 0) ctx.fillRect(R(x - w), R(y + j), w * 2, 1); } }

// ================= SALVAR =================
const Store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};
