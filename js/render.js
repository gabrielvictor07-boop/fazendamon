'use strict';
// ================= DESENHO DO MUNDO =================
const lightC = document.createElement('canvas'), lx = lightC.getContext('2d');
function frameOf(set, moving, t, fps = 8) { return moving ? set.walk[Math.floor(t * fps) % set.walk.length] : set.idle[Math.floor(t * 1.6) % set.idle.length]; }
function shadow(x, y, r) { bx.fillStyle = 'rgba(24,14,34,0.28)'; pixDisc(bx, R(x), R(y), r, 0.4); }
function drawWorld(camX, camY, gt) {
  const W = G.world; camX = R(camX); camY = R(camY);
  bx.fillStyle = WATER.sea[1]; bx.fillRect(0, 0, V.W, V.H);
  const ci0 = Math.floor(camX / CHUNK), ci1 = Math.floor((camX + V.W) / CHUNK), cj0 = Math.floor(camY / CHUNK), cj1 = Math.floor((camY + V.H) / CHUNK);
  for (let cj = cj0; cj <= cj1; cj++) for (let ci = ci0; ci <= ci1; ci++) {
    if (ci < 0 || cj < 0 || ci * CHUNK >= WW || cj * CHUNK >= WH) continue;
    const ch = W.chunk(ci, cj), ox = ci * CHUNK - camX, oy = cj * CHUNK - camY;
    bx.drawImage(ch.c, ox, oy);
    // espuma e brilho na água (animados)
    const f = ch.foam; for (let i = 0; i < f.length; i += 2) { const x = f[i], y = f[i + 1], ph = Math.sin(gt * 2.2 + (x + ci * CHUNK) * 0.35 + y * 0.2); if (ph > -0.2) { bx.fillStyle = ph > 0.55 ? '#ffffff' : '#c8eef6'; bx.fillRect(ox + x, oy + y + (ph > 0.55 ? 0 : 1), 1, 1); } }
    const s = ch.spark; for (let i = 0; i < s.length; i += 2) { const x = s[i], y = s[i + 1]; if (Math.sin(gt * 1.7 + x * 12.9 + y * 7.1) > 0.8) { bx.fillStyle = '#e8fbff'; bx.fillRect(ox + x, oy + y, 2, 1); } }
  }
  // pré-assa um bloco vizinho por quadro
  const pre = [[ci0 - 1, cj0], [ci1 + 1, cj0], [ci0, cj0 - 1], [ci0, cj1 + 1], [ci1 + 1, cj1], [ci0 - 1, cj1]];
  for (const [i, j] of pre) if (i >= 0 && j >= 0 && i * CHUNK < WW && j * CHUNK < WH && !W.chunks.has(i + ',' + j)) { W.chunk(i, j); break; }
  // objetos
  const list = [], cxw = camX + V.W / 2, cyw = camY + V.H / 2, rad = Math.max(V.W, V.H) / 2 + 70;
  W.near(cxw, cyw, rad, o => {
    if (o.gone) return; const x = o.x - camX, y = o.y - camY; if (x < -70 || x > V.W + 70 || y < -10 || y > V.H + 70) return;
    if (o.flat) drawSpr(bx, o.spr, x, y); else list.push({ y: o.y, d: () => drawProp(o, x, y, gt) });
  });
  if (G.mode === 'play' || G.mode === 'title') {
    for (const n of W.npcs) { const x = n.x - camX, y = n.y - camY; if (x > -30 && x < V.W + 30 && y > -10 && y < V.H + 40) list.push({ y: n.y, d: () => drawNpc(n, x, y, gt) }); }
  }
  if (P && G.mode === 'play') {
    list.push({ y: P.y, d: () => drawPlayer(P.x - camX, P.y - camY, gt) });
    if (C) list.push({ y: C.y, d: () => drawCreature(C, C.m.sp, C.x - camX, C.y - camY, gt, true) });
    for (const w of WILD) { if (w.caught === 'trying' || w.caught === true) continue; const x = w.x - camX, y = w.y - camY; if (x > -40 && x < V.W + 40 && y > -10 && y < V.H + 50) list.push({ y: w.y, d: () => drawCreature(w, w.sp, x, y, gt, false) }); }
    if (G.cut) { const w = G.cut.w; list.push({ y: w.y, d: () => drawCreature(w, w.sp, w.x - camX, w.y - camY, gt, false) }); }
    for (const o of ORBS) list.push({ y: o.y, d: () => drawOrb(o, o.x - camX, o.y - camY, gt) });
  }
  list.sort((a, b) => a.y - b.y); for (const it of list) it.d();
  FX.draw(bx, camX, camY);
  for (const p of FX.parts) if (p.firefly) { const x = R(p.x - camX), y = R(p.y - camY); bx.globalAlpha = 0.5 + Math.sin(p.t * 6) * 0.5; bx.fillStyle = '#f4ff9a'; bx.fillRect(x, y, 1, 1); bx.globalAlpha = 1; }
  drawLights(camX, camY, gt);
}
function drawProp(o, x, y, gt) {
  if (o.kind === 'fire') { drawSpr(bx, o.spr, x, y); if (o.lit) drawFlame(x, y - 3, gt, o.x); return; }
  if (o.kind === 'bus' || o.kind === 'shrine') shadow(x, y, 14);
  drawSpr(bx, o.spr, x, y);
  if (o.kind === 'shrine') { const c = SHRINE_COL[o.biome], k = Math.sin(gt * 2 + o.x) * 0.5 + 0.5; bx.globalAlpha = 0.3 + k * 0.3; bx.fillStyle = c; pixDisc(bx, x, y - 26 + R(Math.sin(gt * 1.5) * 1), 5, 1); bx.globalAlpha = 1; }
}
function drawFlame(x, y, gt, seed) {
  const f = Math.floor(gt * 10 + seed), j = k => (hash2(f, k, seed) - 0.5) * 2;
  bx.fillStyle = '#c8321e'; bx.fillRect(x - 4, y - 5 + R(j(1)), 8, 6);
  bx.fillStyle = '#f07a22'; bx.fillRect(x - 3 + R(j(2) * 0.6), y - 8 + R(j(3)), 6, 8);
  bx.fillStyle = '#ffd25a'; bx.fillRect(x - 1 + R(j(4) * 0.6), y - 9 + R(j(5)), 3, 7);
  bx.fillStyle = '#fff4c0'; bx.fillRect(x, y - 4, 1, 3);
}
function drawCreature(e, sp, x, y, gt, mine) {
  const set = ART.cr[sp], s = SPx(sp), t = e.t || gt;
  let fr = frameOf(set, e.moving, t, 10);
  shadow(x, y, Math.max(5, set.idle[0].W * 0.3));
  if (e.pray) { const k = Math.floor(gt * 0.8 + e.x) % 2; fr = set.idle[k]; }
  const lx2 = (e.lunge || 0) * 5 * (e.flip ? -1 : 1);
  if (e.ko) { drawSpr(bx, fr, x, y, { flip: e.flip, sy: 0.75 }); for (let i = 0; i < 3; i++) { const a = gt * 4 + i * TAU / 3; bx.fillStyle = '#ffe070'; bx.fillRect(R(x + Math.cos(a) * 7), R(y - s.h - 2 + Math.sin(a) * 2), 1, 1); } }
  else drawSpr(bx, fr, x + lx2, y, { flip: e.flip, flash: e.hitT > 0 });
  // barra de vida dos selvagens em luta
  if (!mine && !e.pray && (e.hp < e.max || (C && C.target === e))) { const w = 20, hx = R(x - w / 2), hy = R(y - s.h - 9); bx.fillStyle = '#120c18'; bx.fillRect(hx - 1, hy - 1, w + 2, 4); bx.fillStyle = '#4a2430'; bx.fillRect(hx, hy, w, 2); bx.fillStyle = e.hp / e.max > 0.5 ? '#7ad25a' : e.hp / e.max > 0.2 ? '#f2c02c' : '#e8443a'; bx.fillRect(hx, hy, R(w * Math.max(0, e.hp / e.max)), 2); }
  if (C && C.target === e) { const b = R(Math.sin(gt * 8) * 1.5); bx.fillStyle = '#ff5a4a'; bx.fillRect(R(x) - 1, R(y - s.h - 15 + b), 3, 1); bx.fillRect(R(x), R(y - s.h - 14 + b), 1, 1); }
  if (G.cut && G.cut.w === e && G.cut.bubble) { const b = R(Math.sin(gt * 10) * 1); bx.fillStyle = '#fbf3e0'; bx.fillRect(R(x) - 3, R(y - s.h - 16 + b), 7, 9); bx.fillStyle = '#e8443a'; bx.fillRect(R(x), R(y - s.h - 14 + b), 1, 4); bx.fillRect(R(x), R(y - s.h - 9 + b), 1, 1); }
}
function drawPlayer(x, y, gt) {
  const set = ART.person.player[P.dir], fr = frameOf(set, P.moving, P.t, 9);
  if (P.surf) {
    const cs = ART.cr[P.surf], cf = frameOf(cs, true, gt, 6), bob = R(Math.sin(gt * 4));
    bx.fillStyle = 'rgba(255,255,255,0.6)'; pixRing(bx, R(x), R(y + 1), 12 + (Math.floor(gt * 3) % 3), '#e8fbff');
    drawSpr(bx, cf, x, y + 2 + bob, { flip: P.flip });
    const img = P.flip && P.dir === 'side' ? fr.f : fr.c, dx = R(x - (P.flip && P.dir === 'side' ? fr.W - 1 - fr.ax : fr.ax));
    bx.drawImage(img, 0, 0, fr.W, 22, dx, R(y - 26 + bob), fr.W, 22);
    return;
  }
  shadow(x, y, 6);
  const blink = P.hurtT > 0 && Math.floor(gt * 20) % 2 === 0;
  if (!blink) drawSpr(bx, fr, x, y, { flip: P.dir === 'side' && P.flip });
  if (G.rest) { bx.fillStyle = '#fbf3e0'; const k = Math.floor(gt * 2) % 3; bx.fillRect(R(x + 6 + k), R(y - 36 - k * 3), 2, 1); }
}
function drawNpc(n, x, y, gt) {
  const set = ART.person.npc[n.biome], near = P && dist(n.x, n.y, P.x, P.y) < 90;
  let dir = 'down', flip = false; if (near && Math.abs(P.x - n.x) > Math.abs(P.y - n.y)) { dir = 'side'; flip = P.x < n.x; }
  shadow(x, y, 6); drawSpr(bx, set[dir].idle[Math.floor(gt * 1.2) % 2], x, y, { flip });
  if (S && !S.flags.talked) { const b = R(Math.sin(gt * 5) * 1.5); bx.fillStyle = '#ffe070'; bx.fillRect(R(x), R(y - 42 + b), 2, 5); bx.fillRect(R(x), R(y - 35 + b), 2, 2); }
}
function drawOrb(o, x, y, gt) {
  const shakeX = o.state === 'shake' ? R(Math.sin(o.t * 30) * (Math.floor(o.t / 0.6) <= o.shakes && (o.t % 0.6) < 0.25 ? 2 : 0)) : 0;
  shadow(x, y, 3); drawSpr(bx, ART.orb, x + shakeX, y - (o.z || 0));
}
function drawLights(camX, camY, gt) {
  const nk = nightK(), dk = duskK();
  if (dk > 0) { bx.globalAlpha = dk * 0.18; bx.fillStyle = '#ff8a4a'; bx.fillRect(0, 0, V.W, V.H); bx.globalAlpha = 1; }
  if (nk <= 0.01) return;
  if (lightC.width !== V.W || lightC.height !== V.H) { lightC.width = V.W; lightC.height = V.H; }
  lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, V.W, V.H);
  lx.fillStyle = 'rgba(14,16,46,' + (nk * 0.74).toFixed(3) + ')'; lx.fillRect(0, 0, V.W, V.H);
  lx.globalCompositeOperation = 'destination-out';
  const L = (x, y, r) => { x = R(x - camX); y = R(y - camY); if (x < -r || y < -r || x > V.W + r || y > V.H + r) return; for (const [k, a] of [[1, 0.35], [0.72, 0.4], [0.45, 0.5]]) { lx.globalAlpha = a; lx.beginPath(); lx.ellipse(x, y, r * k, r * k * 0.7, 0, 0, TAU); lx.fill(); } };
  lx.fillStyle = '#000';
  const W = G.world;
  if (P && G.mode === 'play') {
    L(P.x, P.y - 10, 30 + (S.inv.tocha ? 34 : 0));
    if (C) { const ab = SPx(C.m.sp).ab, t = SPx(C.m.sp).t; L(C.x, C.y - 8, ab.includes('luz') ? 70 : t === 'fogo' ? 48 : t === 'coral' ? 40 : 0); }
    for (const w of WILD) if (SPx(w.sp).t === 'fogo' || SPx(w.sp).t === 'coral') L(w.x, w.y - 8, 26);
  }
  for (const f of W.fires) if (f.lit) L(f.x, f.y - 4, 80 + Math.sin(gt * 9 + f.x) * 3);
  W.near(camX + V.W / 2, camY + V.H / 2, Math.max(V.W, V.H) / 2 + 100, o => {
    if (o.kind === 'home' || o.kind === 'house') { L(o.x - 13, o.y - 16, 26); L(o.x + 12, o.y - 16, 26); }
    else if (o.kind === 'shrine') L(o.x, o.y - 24, 56); else if (o.kind === 'lantern') L(o.x, o.y - 10, 34); else if (o.kind === 'bus') L(o.x + 15, o.y - 30, 26);
  });
  lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over';
  bx.drawImage(lightC, 0, 0);
  // brilho quente das fogueiras
  bx.globalCompositeOperation = 'lighter';
  for (const f of W.fires) if (f.lit) { const x = R(f.x - camX), y = R(f.y - camY - 4); if (x > -60 && x < V.W + 60 && y > -60 && y < V.H + 60) { bx.globalAlpha = 0.12 * nk; bx.fillStyle = '#ff8a3a'; pixDisc(bx, x, y, 40, 0.7); bx.globalAlpha = 0.12 * nk; pixDisc(bx, x, y, 22, 0.7); } }
  bx.globalAlpha = 1; bx.globalCompositeOperation = 'source-over';
}

// ================= HUD =================
function icon(k, x, y) { const s = ART.icon[k]; UI.drawImage(s.c, R(x), R(y)); }
function drawHUD(gt) {
  uiBegin();
  // painel de status
  panel(4, 4, 122, S.warmth < 100 || G.biome === 'taiga' ? 44 : 34, PAN.dark, 0.92);
  icon('energia', 8, 8); bar(20, 11, 98, 5, S.energy / 100, S.energy > 25 ? '#ffd84a' : '#ff7a4a');
  const h = Math.floor(S.time), mn = Math.floor((S.time - h) * 60 / 10) * 10, nightNow = S.time >= 18.5 || S.time < 5.5;
  icon(nightNow ? 'lua' : 'sol', 8, 20); text('Dia ' + S.day + '  ' + String(h).padStart(2, '0') + ':' + String(mn).padStart(2, '0'), 20, 20, { size: 8 });
  if (S.warmth < 100 || G.biome === 'taiga') { icon('frio', 7, 31); bar(20, 34, 98, 5, S.warmth / 100, S.warmth > 30 ? '#9ad8f4' : '#5a8ae8'); }
  // missão
  const Q = QUESTS[S.quest];
  if (Q) { const lines = wrapText(Q.hint, 132, 6); const ph = 22 + lines.length * 7; panel(V.W - 150, 4, 146, ph, PAN.dark, 0.92); text('MISSÃO ' + (S.quest + 1) + '/' + QUESTS.length, V.W - 144, 7, { size: 6, color: '#ffe070' }); text(Q.n, V.W - 144, 14, { size: 7 }); lines.forEach((l, i) => text(l, V.W - 144, 23 + i * 7, { size: 6, color: '#c8bcd0' })); }
  else { panel(V.W - 150, 4, 146, 20, PAN.dark, 0.92); text('Todas as missões cumpridas!', V.W - 144, 9, { size: 7, color: '#ffe070' }); }
  // equipe
  const n = Math.max(1, S.team.length), sw = 38, tx0 = R(V.W / 2 - n * sw / 2) - 40;
  S.team.forEach((m, i) => {
    const x = tx0 + i * sw, y = V.H - 40, act = i === S.active;
    panel(x, y, sw - 3, 36, act ? PAN.teal : PAN.dark, 0.92);
    const sp = ART.cr[m.sp].idle[0], k = Math.min(1, 26 / sp.W, 22 / sp.H);
    UI.globalAlpha = m.hp <= 0 ? 0.35 : 1; UI.drawImage(sp.c, R(x + (sw - 3) / 2 - sp.W * k / 2), R(y + 25 - sp.H * k), sp.W * k, sp.H * k); UI.globalAlpha = 1;
    bar(x + 3, y + 29, sw - 9, 2, m.hp / maxHp(m), m.hp / maxHp(m) > 0.3 ? '#7ad25a' : '#e8443a');
    text(String(i + 1), x + 3, y + 2, { size: 6, color: act ? '#ffe070' : '#9a8ea8' }); text('' + m.lv, x + sw - 6, y + 2, { size: 6, align: 'right', color: '#c8bcd0' });
    if (inRect(x, y, sw - 3, 36)) { tooltip(SPx(m.sp).n + ' nv ' + m.lv + ' · ' + R(Math.max(0, m.hp)) + '/' + maxHp(m) + ' vida', x, y - 12); if (In.mclick) { switchActive(i); In.mclick = false; } }
  });
  // inventário
  const inv = [['madeira', S.inv.madeira], ['pedra', S.inv.pedra], ['fruta', S.inv.fruta], ['esfera', S.inv.esfera], ['racao', S.inv.racao], ['fogueira', S.inv.fogueira], ['cristal', S.inv.cristal], ['superesfera', S.inv.superesfera]];
  const ix = V.W - 146, iy = V.H - 40; panel(ix, iy, 142, 36, PAN.dark, 0.92);
  inv.forEach(([k, v], i) => { const x = ix + 4 + (i % 4) * 34, y = iy + 3 + Math.floor(i / 4) * 16; icon(k, x, y); text('' + v, x + 13, y + 2, { size: 8, color: v ? '#fbf3e0' : '#7a6e88' }); if (inRect(x, y, 32, 14)) tooltip(ITEM_NAMES[k], x, y - 12); });
  // prompt de interação
  if (!G.dialog && !G.cut) {
    const it = findInteract(), lab = interactLabel(it);
    if (lab) { const s = '[E] ' + lab[0] + (lab[1] ? ' — ' + lab[1] : ''), w = textW(s, 7) + 10, x = R(P.x - Cam.x - w / 2), y = R(P.y - Cam.y - 52); panel(x, y, w, 13, lab[1] ? PAN.red : PAN.paper, 0.95); text(s, x + 5, y + 3, { size: 7, color: lab[1] ? '#fbf3e0' : '#3a2a20', shadow: false }); }
    const w = wildAt(G.mouseWorld[0], G.mouseWorld[1]);
    if (w) { const sp = SPx(w.sp), s = (w.pray ? '' : '') + sp.n + ' nv ' + w.lv + (w.pray ? ' (rezando)' : w.ko ? ' (nocaute)' : ''); tooltip(s, In.mx + 8, In.my - 12, TYPES[sp.t].c); }
  }
  // faixa do bioma
  if (G.banner) { const b = G.banner, a = b.t < 0.5 ? b.t / 0.5 : b.t > 2.5 ? 1 - (b.t - 2.5) / 0.6 : 1; text(b.s, V.W / 2, 34, { size: 16, align: 'center', color: '#fbf3e0', alpha: a, bold: true }); }
  // avisos
  G.toasts.forEach((t, i) => { const a = t.t > 3.4 ? 1 - (t.t - 3.4) / 0.6 : Math.min(1, t.t * 6); const w = textW(t.s, 7) + 12; UI.globalAlpha = a; panel(V.W / 2 - w / 2, 54 + i * 15, w, 13, PAN.dark); UI.globalAlpha = 1; text(t.s, V.W / 2, 57 + i * 15, { size: 7, align: 'center', color: t.col, alpha: a }); });
  // ajuda
  if (G.helpT > 0) { const a = Math.min(1, G.helpT); const L = ['WASD andar · Shift correr · E interagir', 'Clique numa criatura: atacar · F alvo mais perto', 'Q/botão direito: esfera · 1-6 trocar · H ração', 'C criar · TAB equipe · M mapa · B fogueira · R comer']; panel(4, V.H - 46, 168, 42, PAN.dark, 0.85 * a); L.forEach((l, i) => text(l, 8, V.H - 43 + i * 9, { size: 6, color: '#d8ccdc', alpha: a })); }
  if (G.saved > 0) text('Jogo salvo', 6, V.H - 54, { size: 6, color: '#8ad860', alpha: Math.min(1, G.saved) });
  // frio e dano
  if (S.warmth < 40) { const a = (1 - S.warmth / 40) * 0.5; UI.globalAlpha = a; UI.fillStyle = '#bfe7f6'; UI.fillRect(0, 0, V.W, 6); UI.fillRect(0, V.H - 6, V.W, 6); UI.fillRect(0, 0, 6, V.H); UI.fillRect(V.W - 6, 0, 6, V.H); UI.globalAlpha = 1; }
  if (G.redFlash > 0) { UI.globalAlpha = G.redFlash; UI.fillStyle = '#e8443a'; UI.fillRect(0, 0, V.W, V.H); UI.globalAlpha = 1; }
  FX.drawTexts(Cam.x, Cam.y);
}
function tooltip(s, x, y, col) { const w = textW(s, 7) + 8; x = clamp(R(x), 2, V.W - w - 2); panel(x, R(y), w, 12, PAN.dark); text(s, x + 4, R(y) + 2, { size: 7, color: col || '#fbf3e0' }); }

// ================= DIÁLOGO =================
function updateDialog(dt) {
  const d = G.dialog; if (!d) return false;
  const line = d.lines[d.i] || ''; d.ch = Math.min(line.length, d.ch + dt * 55);
  const last = d.i === d.lines.length - 1;
  if (pressed('e') || pressed(' ') || pressed('enter') || (In.mclick && !(last && d.choices))) {
    In.mclick = false;
    if (d.ch < line.length) d.ch = line.length;
    else if (!last) { d.i++; d.ch = 0; Snd.play('click'); }
    else if (!d.choices) { G.dialog = null; Snd.play('close'); if (d.onEnd) d.onEnd(); }
  }
  return true;
}
function drawDialog() {
  const d = G.dialog; if (!d) return; uiBegin();
  const w = Math.min(V.W - 20, 380), h = 52, x = R(V.W / 2 - w / 2), y = V.H - h - (d.choices ? 6 : 50);
  panel(x, y, w, h, PAN.paper);
  if (d.name) { const nw = textW(d.name, 7) + 12; panel(x + 8, y - 9, nw, 13, PAN.wood); text(d.name, x + 14, y - 6, { size: 7 }); }
  const line = (d.lines[d.i] || '').slice(0, Math.floor(d.ch));
  wrapText(line, w - 20, 8).forEach((l, i) => text(l, x + 10, y + 9 + i * 11, { size: 8, color: '#3a2a20', shadow: false }));
  const last = d.i === d.lines.length - 1, done = d.ch >= (d.lines[d.i] || '').length;
  if (!(last && d.choices) && done && Math.floor(G.t * 3) % 2) text('▼', x + w - 12, y + h - 12, { size: 7, color: '#8a5a34', shadow: false });
  if (last && d.choices && done) {
    const cw = 150, ch = 14, n = d.choices.length, cy0 = y - n * (ch + 2) - 14;
    d.choices.forEach(([lab, val], i) => { if (button('ch' + i, x + w - cw - 4, cy0 + i * (ch + 2), cw, ch, lab, { size: 7, style: PAN.wood })) { G.dialog = null; d.onEnd && d.onEnd(val); } });
  }
}

// ================= MENUS =================
function updateMenu() {
  const M = G.menu; if (!M) return false;
  if (pressed('escape') || (M.kind === 'craft' && pressed('c')) || (M.kind === 'team' && pressed('tab')) || (M.kind === 'map' && pressed('m'))) { closeMenu(); return true; }
  return true;
}
function drawMenu() {
  const M = G.menu; if (!M) return; uiBegin();
  UI.fillStyle = 'rgba(10,6,16,0.55)'; UI.fillRect(0, 0, V.W, V.H);
  if (M.kind === 'craft') drawCraft(M); else if (M.kind === 'team') drawTeam(M); else if (M.kind === 'map') drawMap(M); else if (M.kind === 'pause') drawPause(M);
}
function menuFrame(title, w, h) { const x = R(V.W / 2 - w / 2), y = R(V.H / 2 - h / 2); panel(x, y, w, h, PAN.dark); panel(x + w / 2 - textW(title, 9, true) / 2 - 10, y - 8, textW(title, 9, true) + 20, 15, PAN.gold); text(title, x + w / 2, y - 5, { size: 9, align: 'center', bold: true }); if (button('x', x + w - 16, y + 4, 12, 12, 'x', { size: 7, style: PAN.red })) closeMenu(); return [x, y]; }
function drawCraft(M) {
  const w = 300, h = 30 + RECIPES.length * 36, [x, y] = menuFrame('CRIAR', w, h);
  RECIPES.forEach((r, i) => {
    const ry = y + 16 + i * 36; panel(x + 6, ry, w - 12, 32, PAN.darker || { fill: '#221a2c', out: '#120c18', hi: 'rgba(255,255,255,0.05)', lo: 'rgba(0,0,0,0.3)' });
    icon(Object.keys(r.give)[0], x + 12, ry + 6); text(r.n, x + 28, ry + 4, { size: 8 }); text(r.d, x + 28, ry + 14, { size: 6, color: '#b8acc4' });
    let cx2 = x + 28, ok = true;
    for (const k in r.cost) { const have = S.inv[k], need = r.cost[k]; if (have < need) ok = false; icon(k, cx2, ry + 21); text(have + '/' + need, cx2 + 12, ry + 23, { size: 6, color: have >= need ? '#8ad860' : '#ff7a6a' }); cx2 += 40; }
    const owned = r.once && S.inv[Object.keys(r.give)[0]] > 0;
    if (button('cr' + i, x + w - 62, ry + 9, 52, 15, owned ? 'Já tem' : 'Criar', { disabled: !ok || owned, style: PAN.green, size: 8 })) {
      for (const k in r.cost) S.inv[k] -= r.cost[k]; for (const k in r.give) S.inv[k] += r.give[k]; S.stats.crafted++; Snd.play('craft'); toast('Criou ' + r.n + '!', '#8ad860');
    }
  });
}
function drawTeam(M) {
  const w = Math.min(V.W - 16, 400), h = Math.min(V.H - 24, 238), [x, y] = menuFrame(M.tab ? 'CRIADEX' : 'EQUIPE', w, h);
  if (button('t0', x + 8, y + 10, 70, 13, 'Equipe', { style: M.tab === 0 ? PAN.gold : PAN.wood, size: 7 })) M.tab = 0;
  if (button('t1', x + 82, y + 10, 70, 13, 'Criadex', { style: M.tab === 1 ? PAN.gold : PAN.wood, size: 7 })) M.tab = 1;
  if (M.tab === 0) {
    S.team.forEach((m, i) => {
      const ry = y + 28 + i * 27, sp = SPx(m.sp), act = i === S.active;
      panel(x + 6, ry, w - 12, 25, act ? PAN.teal : { fill: '#221a2c', out: '#120c18', hi: 'rgba(255,255,255,0.05)', lo: 'rgba(0,0,0,0.3)' });
      const s = ART.cr[m.sp].idle[0], k = Math.min(1, 34 / s.W, 22 / s.H); UI.drawImage(s.c, R(x + 26 - s.W * k / 2), R(ry + 23 - s.H * k), s.W * k, s.H * k);
      text(sp.n + '  nv ' + m.lv, x + 48, ry + 3, { size: 8 }); chip(TYPES[sp.t].n, x + 48 + textW(sp.n + '  nv ' + m.lv, 8) + 6, ry + 3, TYPES[sp.t].c);
      bar(x + 48, ry + 15, 70, 3, m.hp / maxHp(m), '#7ad25a'); bar(x + 48, ry + 20, 70, 1, m.xp / xpNeed(m.lv), '#8ad4f4');
      text(R(Math.max(0, m.hp)) + '/' + maxHp(m), x + 122, ry + 13, { size: 6, color: '#c8bcd0' });
      text(sp.ab.map(a => ABIL[a].n).join(' · '), x + 160, ry + 13, { size: 6, color: '#ffe070' });
      if (!act && button('a' + i, x + w - 104, ry + 5, 44, 14, 'Ativar', { size: 7, style: PAN.green })) switchActive(i);
      if (act) text('ATIVA', x + w - 82, ry + 8, { size: 7, align: 'center', color: '#ffe070' });
      if (S.team.length > 1 && button('r' + i, x + w - 56, ry + 5, 44, 14, 'Rancho', { size: 7 })) { S.ranch.push(S.team.splice(i, 1)[0]); if (S.active >= S.team.length) S.active = 0; if (i <= S.active && S.active > 0 && i !== S.active) S.active--; spawnCompanion(); }
    });
    const ry = y + 28 + 6 * 27 + 2; text('Rancho (' + S.ranch.length + '): clique pra trazer pra equipe', x + 8, ry, { size: 6, color: '#b8acc4' });
    let cx2 = x + 8; S.ranch.slice(0, 8).forEach((m, i) => { const lab = SPx(m.sp).n + ' ' + m.lv, bw = textW(lab, 6) + 10; if (button('rk' + i, cx2, ry + 9, bw, 12, lab, { size: 6, disabled: S.team.length >= 6 })) { S.team.push(S.ranch.splice(i, 1)[0]); } cx2 += bw + 3; });
  } else {
    const cols = 8, cw = (w - 16) / cols, chh = 38;
    DEX_ORDER.forEach((k, i) => {
      const cx2 = x + 8 + (i % cols) * cw, cy2 = y + 28 + Math.floor(i / cols) * (chh + 2), st = S.dex[k] || 0, sel = M.sel === k;
      panel(cx2, cy2, cw - 3, chh, sel ? PAN.teal : { fill: '#221a2c', out: '#120c18', hi: 'rgba(255,255,255,0.05)', lo: 'rgba(0,0,0,0.3)' });
      const s = ART.cr[k].idle[0], sc = Math.min(1, (cw - 8) / s.W, 24 / s.H);
      UI.globalAlpha = st ? 1 : 0.18; UI.drawImage(st ? s.c : s.w, R(cx2 + (cw - 3) / 2 - s.W * sc / 2), R(cy2 + 28 - s.H * sc), s.W * sc, s.H * sc); UI.globalAlpha = 1;
      text(st ? SPx(k).n : '???', cx2 + (cw - 3) / 2, cy2 + 29, { size: 6, align: 'center', color: st === 2 ? '#fbf3e0' : '#9a8ea8' });
      text('#' + (i + 1), cx2 + 3, cy2 + 2, { size: 6, color: '#7a6e88' }); if (st === 2) icon('esfera', cx2 + cw - 15, cy2 + 2);
      if (inRect(cx2, cy2, cw - 3, chh) && In.mclick) { M.sel = k; Snd.play('click'); }
    });
    const caught = DEX_ORDER.filter(k => S.dex[k] === 2).length, seen = DEX_ORDER.filter(k => S.dex[k]).length;
    text('Vistas: ' + seen + '/' + DEX_ORDER.length + '   Capturadas: ' + caught + '/' + DEX_ORDER.length, x + w - 8, y + 12, { size: 7, align: 'right', color: '#ffe070' });
    const k = M.sel, dy = y + 28 + 3 * (chh + 2) + 2;
    if (k) {
      const st = S.dex[k] || 0, sp = SPx(k);
      if (!st) text('Você ainda não viu essa criatura.', x + 10, dy + 4, { size: 7, color: '#9a8ea8' });
      else {
        const where = Object.keys(BIOMES).filter(b => BIOMES[b].spawn[k]).map(b => BIOMES[b].n).join(', ') || 'Só por evolução';
        text(sp.n, x + 10, dy + 2, { size: 9, bold: true }); chip(TYPES[sp.t].n, x + 14 + textW(sp.n, 9, true), dy + 3, TYPES[sp.t].c);
        wrapText(sp.desc, w - 20, 7).forEach((l, i) => text(l, x + 10, dy + 14 + i * 9, { size: 7, color: '#d8ccdc' }));
        text('Onde vive: ' + where, x + 10, dy + 34, { size: 6, color: '#b8acc4' });
        const hl = wrapText('Habilidades: ' + (sp.ab.length ? sp.ab.map(a => ABIL[a].n + ' (' + ABIL[a].d.toLowerCase() + ')').join(' · ') : 'nenhuma ainda'), w - 20, 6); hl.forEach((l, i) => text(l, x + 10, dy + 42 + i * 7, { size: 6, color: '#ffe070' }));
        const ev = sp.evo ? 'Evolui para ' + (S.dex[sp.evo.to] ? SPx(sp.evo.to).n : '???') + ' no nível ' + sp.evo.lv : 'Não evolui';
        text(ev, x + 10, dy + 43 + hl.length * 7, { size: 6, color: '#8ad4f4' });
      }
    } else text('Clique numa criatura pra ver os detalhes.', x + 10, dy + 4, { size: 7, color: '#9a8ea8' });
  }
}
function chip(s, x, y, col) { const w = textW(s, 6) + 6; UI.fillStyle = '#120c18'; UI.fillRect(R(x) - 1, R(y) - 1, w + 2, 10); UI.fillStyle = col; UI.fillRect(R(x), R(y), w, 8); text(s, R(x) + 3, R(y), { size: 6, color: '#1a1220', shadow: false }); }
function drawMap(M) {
  const W = G.world, w = Math.min(V.W - 12, 440), h = Math.min(V.H - 20, 250), [x, y] = menuFrame(M.travel ? 'PONTO DE ÔNIBUS' : 'MAPA DE VERDÁLIA', w, h);
  const sc = Math.min((w - 12) / W.mini.width, (h - (M.travel ? 34 : 22)) / W.mini.height), mw = W.mini.width * sc, mh = W.mini.height * sc, mx = R(x + w / 2 - mw / 2), my = y + 12;
  UI.drawImage(W.mini, mx, my, mw, mh);
  const toM = (wx, wy) => [mx + wx / 8 * sc, my + wy / 8 * sc];
  for (const k in BIOMES) { const B = BIOMES[k]; if (!B.cx) continue; const [px, py] = toM(B.cx, B.cy + (k === 'mordor' ? 0 : 160)); text(B.n + (k === 'mordor' && !S.flags.hardmode ? ' (bloqueado)' : ''), px, py, { size: 6, align: 'center', color: k === 'mordor' ? '#c890ff' : '#fbf3e0' }); }
  { const I = ISLANDS[0], [px, py] = toM(I.x, I.y + 240); text(BIOMES.island.n, px, py, { size: 6, align: 'center', color: '#ff9ac8' }); }
  for (const sh of W.shrines) { const [px, py] = toM(sh.x, sh.y), done = S.shrines.includes(sh.biome); UI.fillStyle = '#120c18'; UI.fillRect(R(px) - 2, R(py) - 2, 5, 5); UI.fillStyle = done ? SHRINE_COL[sh.biome] : '#6a5e78'; UI.fillRect(R(px) - 1, R(py) - 1, 3, 3); }
  for (const vl of W.villages) { const [px, py] = toM(vl.x, vl.y); UI.fillStyle = '#120c18'; UI.fillRect(R(px) - 3, R(py) - 3, 7, 6); UI.fillStyle = '#e8c88a'; UI.fillRect(R(px) - 2, R(py) - 2, 5, 4); UI.fillStyle = '#b8463a'; UI.fillRect(R(px) - 2, R(py) - 3, 5, 1); }
  let hov = null;
  for (const s of W.stops) {
    const [px, py] = toM(s.x, s.y), found = S.stops.includes(s.name);
    UI.globalAlpha = found ? 1 : 0.35; icon('onibus', R(px) - 5, R(py) - 4); UI.globalAlpha = 1;
    if (M.travel && found && inRect(px - 7, py - 6, 14, 12)) hov = s;
  }
  const t = G.t, [ppx, ppy] = toM(P.x, P.y); if (Math.floor(t * 4) % 2) { UI.fillStyle = '#ffffff'; UI.fillRect(R(ppx) - 2, R(ppy) - 2, 5, 5); } UI.fillStyle = '#e8443a'; UI.fillRect(R(ppx) - 1, R(ppy) - 1, 3, 3);
  if (M.travel) {
    let bx2 = x + 8; const by2 = y + h - 18;
    text('Destino:', bx2, by2 + 3, { size: 7, color: '#ffe070' }); bx2 += 40;
    for (const s of W.stops) { if (!S.stops.includes(s.name)) continue; const here = dist(s.x, s.y, P.x, P.y) < 120, bw = textW(s.name, 6) + 10; if (button('bus' + s.name, bx2, by2, bw, 13, s.name, { size: 6, disabled: here, style: hov === s ? PAN.gold : PAN.wood })) travel(s); bx2 += bw + 3; }
    if (hov) { tooltip('Viajar para ' + hov.name, In.mx + 8, In.my - 12); if (In.mclick && dist(hov.x, hov.y, P.x, P.y) > 120) travel(hov); }
  } else text('Losango = santuário (colorido = já rezou) · Ônibus apagado = ainda não descoberto', x + w / 2, y + h - 10, { size: 6, align: 'center', color: '#b8acc4' });
}
function drawPause(M) {
  const w = 230, h = M.help ? 200 : 110, [x, y] = menuFrame('PAUSA', w, h);
  if (button('p1', x + 20, y + 14, w - 40, 15, 'Continuar', { style: PAN.green })) closeMenu();
  if (button('p2', x + 20, y + 33, w - 40, 15, 'Salvar jogo')) { saveGame(); toast('Jogo salvo!', '#8ad860'); closeMenu(); }
  if (button('p3', x + 20, y + 52, w - 40, 15, M.help ? 'Esconder controles' : 'Controles')) M.help = !M.help;
  if (button('p4', x + 20, y + 71, w - 40, 15, Music.on ? 'Música: ligada' : 'Música: desligada')) Music.on = !Music.on;
  if (button('p5', x + 20, y + 90, w - 40, 15, 'Menu principal', { style: PAN.red })) { saveGame(); G.menu = null; G.mode = 'title'; }
  if (M.help) ['WASD/setas: andar · Shift: correr', 'E ou Espaço: interagir / conversar', 'Clique numa criatura: sua criatura ataca', 'F: atacar a criatura mais perto', 'Q ou botão direito: jogar esfera', '1 a 6: trocar criatura · H: ração', 'C: criar · TAB: equipe e Criadex · M: mapa', 'B: montar fogueira · R: comer fruta'].forEach((l, i) => text(l, x + 14, y + 114 + i * 10, { size: 7, color: '#d8ccdc' }));
}

// ================= TELA INICIAL =================
const STARS = Array.from({ length: 140 }, () => [Math.random(), Math.random(), Math.random()]);
function drawTitle(dt) {
  G.titleCam.x += dt * 9; G.titleCam.y += dt * 3;
  const tc = G.titleCam; if (tc.x > BIOMES.forest.cx + 300) { tc.x = BIOMES.forest.cx - 300; }
  drawWorld(tc.x, tc.y, G.t);
  present(); uiBegin();
  UI.fillStyle = 'rgba(14,10,24,0.35)'; UI.fillRect(0, 0, V.W, V.H);
  const bob = Math.sin(G.t * 1.5) * 2;
  text('FazendaMon', V.W / 2, 40 + bob, { size: 34, align: 'center', bold: true, color: '#ffd84a', shadowColor: '#4a2808' });
  text('Um mundo de criaturas pra explorar · protótipo', V.W / 2, 80, { size: 8, align: 'center', color: '#fbf3e0' });
  const save = Store.get(SAVE_KEY), bw = 140, bxx = V.W / 2 - bw / 2; let yy = 104;
  if (G.confirmNew) {
    panel(V.W / 2 - 120, 100, 240, 52, PAN.dark); text('Começar de novo? O jogo salvo será apagado.', V.W / 2, 108, { size: 7, align: 'center' });
    if (button('cy', V.W / 2 - 92, 126, 84, 15, 'Sim, começar', { style: PAN.red })) { Store.del(SAVE_KEY); G.confirmNew = false; startIntro(); }
    if (button('cn', V.W / 2 + 8, 126, 84, 15, 'Voltar')) G.confirmNew = false;
  } else {
    if (save && save.flags && save.flags.intro !== undefined) { if (button('cont', bxx, yy, bw, 17, 'Continuar (dia ' + save.day + ')', { style: PAN.green })) { S = save; startPlay(true); } yy += 22; }
    if (button('new', bxx, yy, bw, 17, 'Novo jogo', { style: save ? PAN.wood : PAN.green })) { if (save) G.confirmNew = true; else startIntro(); } yy += 22;
    if (button('ctl', bxx, yy, bw, 17, G.showCtl ? 'Esconder controles' : 'Controles')) G.showCtl = !G.showCtl;
    if (G.showCtl) { panel(V.W / 2 - 130, yy + 22, 260, 62, PAN.dark, 0.95); ['WASD andar · Shift correr · E interagir', 'Clique numa criatura pra sua criatura atacar', 'Q joga a esfera · 1-6 troca de criatura', 'C criar · TAB equipe · M mapa · B fogueira'].forEach((l, i) => text(l, V.W / 2, yy + 28 + i * 13, { size: 7, align: 'center', color: '#d8ccdc' })); }
  }
  text('Clique pra ativar o som', V.W / 2, V.H - 14, { size: 6, align: 'center', color: '#b8acc4' });
}

// ================= ABERTURA (o Deus) =================
function startIntro() {
  G.mode = 'intro'; G.intro = { q: 0, votes: {}, t: 0 }; Snd.play('god');
  say('Verdan', GOD_INTRO, askNext);
}
function askNext() {
  const I = G.intro;
  if (I.q < GOD_QUESTIONS.length) { const Q = GOD_QUESTIONS[I.q]; say('Verdan', [Q.q], v => { I.votes[v] = (I.votes[v] || 0) + 1; I.q++; Snd.play('god'); askNext(); }, Q.a); return; }
  let best = 'forest', bv = -1; for (const k of ['forest', 'savana', 'taiga', 'bambu', 'swamp']) if ((I.votes[k] || 0) > bv) { bv = I.votes[k] || 0; best = k; }
  say('Verdan', GOD_OUTRO(best), () => { G.fade = { t: 0, dur: 2.4, white: true, mid: () => { S = newSave(best); startPlay(false); } }; });
}
function drawIntro(dt) {
  G.intro.t += dt; const t = G.intro.t;
  const g = bx.createLinearGradient(0, 0, 0, V.H); g.addColorStop(0, '#0c0a24'); g.addColorStop(1, '#24184a'); bx.fillStyle = g; bx.fillRect(0, 0, V.W, V.H);
  for (const [sx, sy, k] of STARS) { if (Math.sin(t * (1 + k * 2) + k * 50) > -0.3) { bx.fillStyle = k > 0.8 ? '#ffffff' : '#a8a4d8'; bx.fillRect(R(sx * V.W), R(sy * V.H * 0.8), 1, 1); } }
  const cx2 = V.W / 2, cy2 = V.H / 2 + 20 + Math.sin(t * 1.2) * 3;
  for (let i = 0; i < 4; i++) { bx.globalAlpha = 0.08; bx.fillStyle = '#9af07a'; pixDisc(bx, cx2, cy2 - 70, 30 + i * 12 + Math.sin(t * 2 + i) * 3, 0.9); } bx.globalAlpha = 1;
  pixRing(bx, cx2, cy2 - 150, 18 + Math.sin(t * 2) * 1, '#ffe070');
  drawSpr(bx, ART.god, cx2, cy2, { sx: 2, sy: 2 });
  if (Math.random() < dt * 8) FX.add({ x: cx2 + rand(-60, 60), y: cy2 + rand(-40, 10), vy: -rand(6, 16), vx: rand(-4, 4), life: rand(2, 4), color: pick(['#9af07a', '#ffe070', '#ffffff']), type: 'leaf' });
  FX.draw(bx, 0, 0);
  present();
}

// ================= EVOLUÇÃO / FADE =================
function drawEvo(dt) {
  const e = G.evo; e.t += dt; uiBegin();
  UI.fillStyle = 'rgba(10,6,20,' + Math.min(0.8, e.t * 2) + ')'; UI.fillRect(0, 0, V.W, V.H);
  const per = Math.max(0.06, 0.5 - e.t * 0.14), showTo = e.t > 3.2 || (Math.floor(e.t / per) % 2 === 1 && e.t > 0.8);
  const s = ART.cr[showTo ? e.to : e.from].idle[0], flash = e.t < 3.2 && (e.t % per) < per * 0.5;
  const img = flash ? s.w : s.c; UI.drawImage(img, R(V.W / 2 - s.W), R(V.H / 2 + 10 - s.H * 2), s.W * 2, s.H * 2);
  text(e.t < 3.2 ? 'O quê? ' + SPx(e.from).n + ' está evoluindo!' : SPx(e.from).n + ' evoluiu para ' + SPx(e.to).n + '!', V.W / 2, V.H / 2 + 26, { size: 10, align: 'center', bold: true, color: '#ffe070' });
  if (e.t > 3.2 && e.t < 3.3) { Snd.play('catch'); }
  if (e.t > 4.6) finishEvolution();
}
function drawFade(dt) {
  const f = G.fade; f.t += dt; const half = f.dur / 2;
  if (!f.midDone && f.t >= half) { f.midDone = true; f.mid && f.mid(); }
  const a = f.t < half ? f.t / half : 1 - (f.t - half) / half;
  uiBegin(); UI.globalAlpha = clamp(a, 0, 1); UI.fillStyle = f.white ? '#ffffff' : '#0c0814'; UI.fillRect(0, 0, V.W, V.H); UI.globalAlpha = 1;
  if (f.bus && a > 0.5) { const s = ART.icon.onibus, k = f.t / f.dur; UI.drawImage(s.c, R(-30 + k * (V.W + 60)), R(V.H / 2 - 8), s.W * 3, s.H * 3); text('Viajando...', V.W / 2, V.H / 2 + 16, { size: 8, align: 'center' }); }
  if (f.t >= f.dur) { G.fade = null; f.after && f.after(); }
}

// ================= LAÇO PRINCIPAL =================
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; G.t += dt;
  try { tick(dt); } catch (e) { console.error(e); }
  buttonsEndFrame(); endFrameInput();
  requestAnimationFrame(frame);
}
function tick(dt) {
  Music.update(dt);
  if (G.mode === 'loading') { uiBegin(); cx.fillStyle = '#120c18'; cx.fillRect(0, 0, V.W, V.H); text('Gerando o mundo de Verdália...', V.W / 2, V.H / 2 - 4, { size: 10, align: 'center' }); return; }
  if (G.mode === 'title') { FX.update(dt); drawTitle(dt); if (G.fade) drawFade(dt); return; }
  if (G.mode === 'intro') {
    FX.update(dt); updateDialog(dt); drawIntro(dt); drawDialog(); if (G.fade) drawFade(dt); return;
  }
  // jogo
  const busy = G.fade || G.evo;
  if (In.lost && !G.menu) { In.lost = false; if (G.mode === 'play' && !G.dialog) openMenu('pause'); }
  if (!busy) { if (!updateDialog(dt) && !updateMenu()) updatePlay(dt); }
  FX.update(dt);
  for (const t of G.toasts) t.t += dt; G.toasts = G.toasts.filter(t => t.t < 4);
  if (G.banner) { G.banner.t += dt; if (G.banner.t > 3.1) G.banner = null; }
  G.helpT -= dt; G.saved = (G.saved || 0) - dt; G.redFlash = Math.max(0, (G.redFlash || 0) - dt * 1.5); if (P) P.hurtT -= dt;
  // câmera
  Cam.trauma = Math.max(0, Cam.trauma - dt * 1.6); const sh = Cam.trauma * Cam.trauma * 6;
  const tx = P.x - V.W / 2, ty = P.y - 12 - V.H / 2; Cam.x = lerp(Cam.x, tx, 1 - Math.exp(-dt * 6)); Cam.y = lerp(Cam.y, ty, 1 - Math.exp(-dt * 6));
  Cam.x = clamp(Cam.x, 0, WW - V.W); Cam.y = clamp(Cam.y, 0, WH - V.H);
  drawWorld(Cam.x + (Math.random() - 0.5) * sh, Cam.y + (Math.random() - 0.5) * sh, G.t);
  present();
  drawHUD(G.t); drawBossBar();
  if (G.menu) drawMenu();
  drawDialog();
  if (G.evo) drawEvo(dt);
  if (G.fade) drawFade(dt);
}
requestAnimationFrame(frame);
setTimeout(() => { try { boot(); } catch (e) { console.error(e); G.err = e; } }, 30);
