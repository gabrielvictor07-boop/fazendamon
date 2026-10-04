'use strict';
// ================= EXPANSÃO 2: horta, rancho produtivo, pesca, mascate e moedas, montaria, clima =================
// Este arquivo carrega por último e "embrulha" funções do jogo (findInteract, interact, drawPlayer...):
// chama a versão original e acrescenta o comportamento novo.

// ---------- itens, ícones e arte nova ----------
Object.assign(ITEM_NAMES, { semente: 'Semente', peixe: 'Peixe', peixedourado: 'Peixe Dourado', frutadourada: 'Fruta Dourada', vara: 'Vara de Pesca', sela: 'Sela' });
Object.assign(ICON_ASCII, {
  moeda: { rows: ['.YYYY.', 'YyWYYy', 'YWYYYy', 'YYYYYy', 'YYYYyy', '.yyyy.'], pal: { Y: '#ffd23f', y: '#d9941a', W: '#fff6c2' } },
  semente: { rows: ['..G...', '.GgG..', '..BB..', '.BBbB.', '.BbbB.', '..BB..'], pal: { G: '#6ac04a', g: '#3a8a34', B: '#a8703e', b: '#7a4a24' } },
  peixe: { rows: ['.....BB.', 'BB.BBBBB', 'BBBBBWKB', 'BB.bbbbB', '.....bb.'], pal: { B: '#6aa8d8', b: '#3a78a8', W: '#ffffff', K: '#1c1424' } },
  peixedourado: { rows: ['.....YY.', 'YY.YYYYY', 'YYYYYWKY', 'YY.yyyyY', '.....yy.'], pal: { Y: '#ffd23f', y: '#d9941a', W: '#ffffff', K: '#1c1424' } },
  frutadourada: { rows: ['...g....', '..gG....', '.YYYYY..', 'YWYYYYy.', 'YYYYYYy.', 'YYYYYyy.', '.yyyyy..'], pal: { g: '#3a8a3a', G: '#6ac04a', Y: '#ffd84a', y: '#d9941a', W: '#fff6c2' } },
  vara: { rows: ['.......L', '......L.', '.....L.s', '....L..s', '...L...s', '..L....o', '.L......', 'L.......'], pal: { L: '#a8703e', s: '#e8e8e8', o: '#e8443a' } },
  sela: { rows: ['..BBBB..', '.BbbbbB.', 'BBbYYbBB', 'B.BBBB.B', 'B......B'], pal: { B: '#8a5a34', b: '#b8824e', Y: '#ffd23f' } },
  chuva: { rows: ['.WWW.', 'WWWWW', '.....', 'B.B.B', '.B.B.'], pal: { W: '#c8d0e0', B: '#6aa8f4' } },
});
function drawPlot(stage, wet) {
  const b = new PB(18, 22), Sd = ramp(wet ? '#5a3a24' : '#7a5034'), G = ramp('#4aa040');
  b.ell(9, 17, 8, 4, (nx, ny, x, y) => (y % 2 === 0 && Math.abs(nx) < 0.8) ? Sd.s : (ny < 0 ? Sd.l : Sd.m));
  if (stage === 1) { b.set(7, 16, '#c8a060'); b.set(11, 17, '#c8a060'); }
  if (stage === 2) { b.line(9, 16, 9, 13, G.m); b.set(8, 13, G.l); b.set(10, 12, G.l); }
  if (stage === 3) { b.line(9, 16, 9, 9, G.m); b.ellR(6.6, 11, 2.6, 1.1, -0.4, G.l); b.ellR(11.4, 10, 2.6, 1.1, 0.4, G.m); b.ellR(7, 7, 2, 1, -0.5, G.l); }
  if (stage === 4) { b.line(9, 16, 9, 7, G.s); b.ellR(6, 11, 3, 1.3, -0.4, G.l); b.ellR(12, 10, 3, 1.3, 0.4, G.m); [[6, 8], [12, 6], [9, 4]].forEach(([x, y]) => b.ell(x, y, 1.9, 1.9, (nx, ny) => ny < -0.2 && nx < 0 ? '#ff8a7a' : '#e2443a')); }
  return b.outline();
}
function ensureArt3() {
  if (ART.props.plot) return;
  for (const k of ['moeda', 'semente', 'peixe', 'peixedourado', 'frutadourada', 'vara', 'sela', 'chuva']) if (!ART.icon[k]) ART.icon[k] = sprite(iconFromAscii(ICON_ASCII[k]), undefined, undefined, true);
  ART.props.plot = []; ART.props.plotWet = [];
  for (let s = 0; s <= 4; s++) { ART.props.plot.push(sprite(drawPlot(s, false), 9, 21)); ART.props.plotWet.push(sprite(drawPlot(s, true), 9, 21)); }
  const look = { skin: '#d8a07a', hair: '#6a3a24', coat: '#7a3a8a', shirt: '#efe4c8', pants: '#3a3040', boots: '#4a3020', scarf: '#ffd23f', pack: '#a8723e' };
  const o = {}; for (const d of ['down', 'up', 'side']) o[d] = { walk: [0, 1, 2, 3].map(f => sprite(drawPerson(d, f, 'walk', look, { hat: 'straw' }))), idle: [0, 1].map(f => sprite(drawPerson(d, f, 'idle', look, { hat: 'straw' }))) };
  ART.person.npc.mascate = o;
};

// ---------- loja ----------
const SHOP_BUY = [
  { k: 'semente', p: 5, d: 'Planta na horta perto da sua casa' }, { k: 'esfera', p: 6 }, { k: 'racao', p: 8 },
  { k: 'vara', p: 25, once: true, d: 'Pesque de frente pra água (E)' }, { k: 'sela', p: 60, once: true, d: 'Monte nas criaturas grandes (X)' },
  { k: 'superesfera', p: 45 },
];
const SHOP_SELL = { fruta: 2, madeira: 1, pedra: 1, cristal: 12, peixe: 5, peixedourado: 30, frutadourada: 25 };
const ensureNew = () => {
  for (const k of ['semente', 'peixe', 'peixedourado', 'frutadourada', 'vara', 'sela']) S.inv[k] = S.inv[k] || 0;
  if (S.coins === undefined) S.coins = 20;
  if (!S.farm) S.farm = Array.from({ length: 6 }, () => ({ stage: 0, t: 0, wet: false }));
  S.stats.fish = S.stats.fish || 0; S.stats.harvest = S.stats.harvest || 0;
};

// ---------- início da partida: horta, mascates, clima ----------
const _startPlay = startPlay;
startPlay = function (fromSave) {
  ensureArt3(); ensureNew();
  const W = G.world;
  if (!W._exp2) {
    W._exp2 = true;
    for (const vl of W.villages) W.npcs.push({ x: vl.x - 46, y: vl.y + 62, biome: 'mascate', shop: true, name: 'Mascate Tito', village: vl.n, lines: [] });
  }
  for (const o of W.props.slice()) if (o.kind === 'plot') W.removeProp(o);
  const vl = W.villages.find(v => v.biome === S.spawn) || W.villages[0];
  G.plots = [];
  for (let i = 0; i < 6; i++) G.plots.push(W.addProp({ kind: 'plot', x: vl.x - 150 + (i % 3) * 20, y: vl.y - 6 + Math.floor(i / 3) * 18, i, spr: ART.props.plot[0] }));
  G.wx = G.wx || { type: 'clear', t: 50 };
  _startPlay(fromSave);
};

// ---------- interação ----------
const _findInteract = findInteract;
findInteract = function () {
  let best = _findInteract();
  if (best && best.type === 'npc') return best;
  const fx = P.x + (P.dir === 'side' ? (P.flip ? -8 : 8) : 0), fy = P.y + (P.dir === 'up' ? -8 : P.dir === 'down' ? 6 : 0);
  if (G.plots) for (const o of G.plots) { const d = dist(o.x, o.y - 4, fx, fy); if (d < 14 && (!best || d < dist(best.o.x, best.o.y, fx, fy))) best = { type: 'plot', o }; }
  if ((!best || (best.type === 'prop' && best.o.harvest)) && S.inv.vara && !P.surf) { const wx = P.x + (P.dir === 'side' ? (P.flip ? -22 : 22) : 0), wy = P.y + (P.dir === 'up' ? -22 : P.dir === 'down' ? 18 : 0); if (G.world.ground(wx, wy) === 'water') best = { type: 'fish', o: { x: wx, y: wy } }; }
  return best;
};
const _interactLabel = interactLabel;
interactLabel = function (it) {
  if (!it) return null;
  if (it.type === 'npc' && it.o.shop) return ['Comprar e vender (Mascate)', null];
  if (it.type === 'fish') return G.fish ? (G.fish.bite ? ['FISGOU! Aperte E!', null] : ['Esperando o peixe...', null]) : ['Pescar', null];
  if (it.type === 'plot') {
    const f = S.farm[it.o.i];
    if (f.stage === 0) return S.inv.semente ? ['Plantar semente', null] : ['Plantar', 'compre sementes no Mascate'];
    if (f.stage === 4) return ['Colher', null];
    if (!f.wet) { const w = S.team.find(m => SPx(m.sp).t === 'agua'); return w ? ['Regar (' + SPx(w.sp).n + ')', null] : ['Regar', 'precisa de criatura de Água']; }
    return ['Crescendo... (' + ['', 'semente', 'broto', 'quase lá'][f.stage] + ')', null];
  }
  return _interactLabel(it);
};
const _interact = interact;
interact = function () {
  if (G.fish) { fishPress(); return; }
  const it = findInteract(); if (!it) return;
  if (it.type === 'npc' && it.o.shop) { S.flags.talked = true; openMenu('shop', { tab: 0 }); return; }
  if (it.type === 'fish') { startFishing(it.o); return; }
  if (it.type === 'plot') { plotAction(it.o); return; }
  _interact();
};
function plotAction(o) {
  const f = S.farm[o.i];
  if (f.stage === 0) { if (!S.inv.semente) { toast('Sem sementes. O Mascate vende (5 moedas).', '#ff9a8a'); Snd.play('deny'); return; } S.inv.semente--; f.stage = 1; f.t = 0; Snd.play('pick'); FX.burst(o.x, o.y - 4, 8, { speed: [10, 30], life: [0.3, 0.6], color: ['#7a5034', '#a8703e'] }); return; }
  if (f.stage === 4) {
    const n = irand(2, 4); S.inv.fruta += n; let msg = '+' + n + ' Fruta';
    if (Math.random() < 0.25) { S.inv.frutadourada++; msg += ', +1 Fruta Dourada!'; }
    if (Math.random() < 0.5) { S.inv.semente++; msg += ', +1 Semente'; }
    f.stage = 0; f.wet = false; S.stats.harvest++; Snd.play('craft'); toast('Colheita: ' + msg, '#8ad860');
    FX.burst(o.x, o.y - 10, 14, { speed: [20, 60], life: [0.4, 0.8], color: ['#e2443a', '#8ad860', '#ffd23f'], vz: [20, 60], g: 160 }); return;
  }
  if (!f.wet) {
    const w = S.team.find(m => SPx(m.sp).t === 'agua'); if (!w) { toast('Precisa de uma criatura de Água pra regar (Lontrágua, Girinho...).', '#ff9a8a'); Snd.play('deny'); return; }
    f.wet = true; Snd.play('water'); toast(SPx(w.sp).n + ' regou a plantação! Vai crescer duas vezes mais rápido.', '#8ad4f4');
    FX.burst(o.x, o.y - 8, 14, { speed: [10, 40], life: [0.3, 0.6], color: ['#8ad4f4', '#ffffff'], vz: [10, 30], g: 120 });
  }
}
function updateFarm(dt) {
  if (!S.farm) return;
  const raining = G.wx && (G.wx.type === 'rain' || G.wx.type === 'storm');
  S.farm.forEach((f, i) => {
    if (raining && f.stage > 0 && f.stage < 4) f.wet = true;
    if (f.stage > 0 && f.stage < 4) { f.t += dt * (f.wet ? 2 : 1); if (f.t >= 35) { f.t = 0; f.stage++; if (f.stage === 4 && G.plots && dist(G.plots[i].x, G.plots[i].y, P.x, P.y) < 300) toast('Uma plantação está pronta pra colher!', '#8ad860'); } }
    if (G.plots && G.plots[i]) G.plots[i].spr = (f.wet ? ART.props.plotWet : ART.props.plot)[f.stage];
  });
}

// ---------- pesca ----------
function startFishing(spot) { G.fish = { x: spot.x, y: spot.y, t: 0, biteAt: rand(1.6, 4.2), bite: false }; Snd.play('throw'); toast('Lançou a linha. Espere o peixe fisgar e aperte E!', '#8ad4f4'); }
function fishPress() {
  const F = G.fish; G.fish = null;
  if (!F.bite) { toast('Puxou cedo demais. O peixe fugiu.', '#ff9a8a'); Snd.play('fail'); return; }
  const b = G.world.cellB(F.x, F.y), r = Math.random();
  if (r < 0.06) { const sp = b === 'island' ? 'caranguarda' : b === 'swamp' ? 'girinho' : 'lontragua'; const w = makeWild(sp, irand(4, 9), F.x, F.y); if (G.world.ground(P.x, P.y + 14) === 'land') { w.x = P.x; w.y = P.y + 14; } w.state = 'fight'; w.target = C ? 'comp' : 'player'; WILD.push(w); toast('Algo enorme fisgou... é um ' + SPx(sp).n + '!', '#ffd040'); Snd.play('cry'); shake(0.3); return; }
  const gold = r < (b === 'island' ? 0.25 : 0.12);
  S.inv[gold ? 'peixedourado' : 'peixe']++; S.stats.fish++; Snd.play('catch');
  toast(gold ? 'Pescou um PEIXE DOURADO!' : 'Pescou um peixe!', gold ? '#ffd23f' : '#8ad4f4');
  FX.burst(F.x, F.y, 12, { speed: [20, 60], life: [0.3, 0.6], color: ['#ffffff', '#8ad4f4'], vz: [30, 60], g: 160 });
}
function updateFishing(dt) {
  const F = G.fish; if (!F) return;
  if (key('w') || key('a') || key('s') || key('d')) { G.fish = null; toast('Você guardou a vara.'); return; }
  F.t += dt;
  if (!F.bite && F.t >= F.biteAt) { F.bite = true; F.bt = 0; Snd.play('shake'); FX.text(F.x, F.y - 12, '!', '#ffd040', 12); FX.burst(F.x, F.y, 8, { speed: [10, 30], life: [0.2, 0.4], color: '#ffffff' }); }
  if (F.bite) { F.bt += dt; if (F.bt > 0.8) { G.fish = null; toast('O peixe escapou...', '#ff9a8a'); Snd.play('fail'); } }
}

// ---------- rancho produz enquanto você dorme ----------
const _goSleep = goSleep;
goSleep = function () {
  _goSleep();
  const mid = G.fade.mid;
  G.fade.mid = () => {
    mid();
    if (!S.ranch.length) return;
    const got = {};
    for (const m of S.ranch) {
      const ab = SPx(m.sp).ab, t = SPx(m.sp).t, n = 1 + Math.floor(m.lv / 8);
      const k = ab.includes('cortar') ? 'madeira' : ab.includes('forca') ? 'pedra' : ab.includes('crescer') ? 'fruta' : t === 'sombrio' ? 'cristal' : t === 'agua' ? 'peixe' : pick(['fruta', 'madeira', 'pedra']);
      got[k] = (got[k] || 0) + n;
    }
    for (const k in got) S.inv[k] += got[k];
    const coins = S.ranch.length * 2; S.coins += coins;
    setTimeout(() => toast('O rancho trabalhou: ' + Object.keys(got).map(k => '+' + got[k] + ' ' + ITEM_NAMES[k]).join(', ') + ', +' + coins + ' moedas', '#8ad860'), 1700);
  };
};

// ---------- montaria ----------
const canMount = m => m && SPx(m.sp).h >= 18 && !SPx(m.sp).boss;
function toggleMount() {
  if (P.mount) { P.mount = null; Snd.play('click'); spawnCompanion(); return; }
  if (!S.inv.sela) { toast('Você precisa de uma Sela (Mascate, 60 moedas).', '#ff9a8a'); Snd.play('deny'); return; }
  const m = activeMon();
  if (!m || m.hp <= 0) { toast('Sua criatura ativa precisa estar de pé.', '#ff9a8a'); return; }
  if (!canMount(m)) { toast(SPx(m.sp).n + ' é pequeno demais pra montar. Tente Relâmpago, Fogaréu, Carvalhão...', '#ff9a8a'); Snd.play('deny'); return; }
  if (P.surf) return;
  P.mount = m.sp; C = null; Snd.play('cry'); toast('Montou no ' + SPx(m.sp).n + '! Você anda bem mais rápido.', '#ffe070');
}
const _spawnCompanion = spawnCompanion;
spawnCompanion = function (x, y) { if (P && P.mount) { C = null; return; } _spawnCompanion(x, y); };

// ---------- clima ----------
function updateWeather(dt) {
  const w = G.wx; w.t -= dt;
  if (w.t <= 0) {
    const r = Math.random(), old = w.type;
    w.type = r < 0.55 ? 'clear' : r < 0.85 ? 'rain' : 'storm'; w.t = rand(50, 110);
    if (w.type !== old) toast(w.type === 'clear' ? 'O tempo abriu.' : w.type === 'rain' ? (G.biome === 'taiga' ? 'Começou uma nevasca!' : 'Começou a chover. A horta é regada sozinha.') : 'Tempestade! Raios atraem criaturas elétricas.', '#c8d8f0');
  }
  if (w.type === 'storm') { w.flashT = (w.flashT || rand(3, 7)) - dt; if (w.flashT <= 0) { w.flashT = rand(4, 9); G.flash = 0.6; Snd.play('zap'); shake(0.15); } }
  G.flash = Math.max(0, (G.flash || 0) - dt * 2);
  // tempestade faz aparecer Faísca e Relâmpago perto
  if (w.type === 'storm' && Math.random() < dt * 0.05 && WILD.length < 14) { const a = rand(TAU), d = rand(220, 320), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d * 0.7; if (G.world.ground(x, y) === 'land' && G.world.cellB(x, y) !== 'mordor') WILD.push(makeWild(Math.random() < 0.3 ? 'relampago' : 'faisca', irand(5, 12), x, y)); }
}
const _updateWorldBits = updateWorldBits;
updateWorldBits = function (dt) { _updateWorldBits(dt); if (G.mode !== 'play' || G.cut) return; updateWeather(dt); updateFarm(dt); updateFishing(dt); if (pressed('x')) toggleMount(); if (P.mount && P.surf) { P.mount = null; } };

// ---------- desenho ----------
const _drawPlayer = drawPlayer;
drawPlayer = function (x, y, gt) {
  if (G.fish) { const F = G.fish, fx = R(F.x - Cam.x), fy = R(F.y - Cam.y) + (F.bite ? R(Math.sin(gt * 30)) : R(Math.sin(gt * 3))); bx.strokeStyle = 'rgba(240,240,240,0.7)'; bx.lineWidth = 1; bx.beginPath(); bx.moveTo(R(x + (P.flip ? -8 : 8)), R(y - 26)); bx.lineTo(fx, fy); bx.stroke(); bx.fillStyle = '#e8443a'; bx.fillRect(fx - 1, fy - 1, 3, 2); bx.fillStyle = '#ffffff'; bx.fillRect(fx - 1, fy - 2, 3, 1); }
  if (!P.mount) return _drawPlayer(x, y, gt);
  const cs = ART.cr[P.mount], cf = frameOf(cs, P.moving, gt, 12), fr = frameOf(ART.person.player[P.dir], false, P.t, 9), h = SPx(P.mount).h;
  const flip = P.dir === 'side' ? P.flip : false;
  shadow(x, y, cs.idle[0].W * 0.3); drawSpr(bx, cf, x, y, { flip });
  const img = flip && P.dir === 'side' ? fr.f : fr.c, dx = R(x - (flip ? fr.W - 1 - fr.ax : fr.ax));
  bx.drawImage(img, 0, 0, fr.W, 22, dx, R(y - h - 18), fr.W, 22);
};
const _drawProp = drawProp;
drawProp = function (o, x, y, gt) { if (o.kind === 'plot') { drawSpr(bx, o.spr, x, y); return; } _drawProp(o, x, y, gt); };
const _drawNpc = drawNpc;
drawNpc = function (n, x, y, gt) { _drawNpc(n, x, y, gt); if (n.shop) { const b = R(Math.sin(gt * 3) * 1); drawSpr(bx, ART.icon.moeda, x, y - 40 + b); } };
const _drawLights = drawLights;
drawLights = function (camX, camY, gt) {
  _drawLights(camX, camY, gt);
  const w = G.wx; if (!w || G.mode !== 'play' || w.type === 'clear') return;
  const snow = G.biome === 'taiga', n = w.type === 'storm' ? 140 : 80;
  bx.globalAlpha = w.type === 'storm' ? 0.22 : 0.12; bx.fillStyle = '#1a2440'; bx.fillRect(0, 0, V.W, V.H); bx.globalAlpha = 1;
  for (let i = 0; i < n; i++) {
    const sx = (hash2(i, 1, 9) * (V.W + 60) + gt * (snow ? 14 : -60)) % (V.W + 60), sy = (hash2(i, 2, 9) * V.H + gt * (snow ? 30 : 260) * (0.7 + hash2(i, 3, 9) * 0.6)) % V.H;
    const xx = R((sx + V.W + 60) % (V.W + 60) - 30), yy = R(sy);
    if (snow) { bx.fillStyle = '#ffffff'; bx.fillRect(xx, yy, 1, 1); } else { bx.fillStyle = 'rgba(170,200,255,0.55)'; bx.fillRect(xx, yy, 1, 4); }
  }
  if (G.flash > 0) { bx.globalAlpha = G.flash * 0.6; bx.fillStyle = '#e8f0ff'; bx.fillRect(0, 0, V.W, V.H); bx.globalAlpha = 1; }
};
// inventário do HUD: mostra o que você tem (até 8)
function hudInv() {
  const order = ['madeira', 'pedra', 'fruta', 'esfera', 'racao', 'superesfera', 'cristal', 'fogueira', 'semente', 'peixe', 'peixedourado', 'frutadourada'];
  const list = order.filter((k, i) => i < 4 || S.inv[k] > 0).slice(0, 8);
  return list.map(k => [k, S.inv[k] || 0]);
}
const _drawHUD = drawHUD;
drawHUD = function (gt) {
  _drawHUD(gt);
  const y0 = S.warmth < 100 || G.biome === 'taiga' ? 50 : 40;
  panel(4, y0, 122, 14, PAN.dark, 0.92); icon('moeda', 7, y0 + 2); text('' + S.coins, 19, y0 + 3, { size: 8, color: '#ffe070' });
  if (G.wx && G.wx.type !== 'clear') { icon('chuva', 52, y0 + 2); text(G.wx.type === 'storm' ? 'Tempestade' : G.biome === 'taiga' ? 'Nevasca' : 'Chuva', 63, y0 + 3, { size: 7, color: '#c8d8f0' }); }
  if (P.mount) text('[X] desmontar', 6, y0 + 16, { size: 6, color: '#ffe070' });
};
// ---------- menu da loja ----------
const _drawMenu = drawMenu;
drawMenu = function () {
  if (!G.menu || G.menu.kind !== 'shop') return _drawMenu();
  uiBegin(); UI.fillStyle = 'rgba(10,6,16,0.55)'; UI.fillRect(0, 0, V.W, V.H);
  const M = G.menu, w = Math.min(V.W - 16, 330), h = 200, [x, y] = menuFrame('MASCATE TITO', w, h);
  if (button('s0', x + 8, y + 10, 70, 13, 'Comprar', { style: M.tab === 0 ? PAN.gold : PAN.wood, size: 7 })) M.tab = 0;
  if (button('s1', x + 82, y + 10, 70, 13, 'Vender', { style: M.tab === 1 ? PAN.gold : PAN.wood, size: 7 })) M.tab = 1;
  icon('moeda', x + w - 60, y + 12); text('' + S.coins, x + w - 48, y + 13, { size: 8, color: '#ffe070' });
  const rowBg = { fill: '#221a2c', out: '#120c18', hi: 'rgba(255,255,255,0.05)', lo: 'rgba(0,0,0,0.3)' };
  if (M.tab === 0) SHOP_BUY.forEach((it, i) => {
    const ry = y + 28 + i * 27, owned = it.once && S.inv[it.k] > 0; panel(x + 6, ry, w - 12, 25, rowBg);
    icon(it.k, x + 12, ry + 6); text(ITEM_NAMES[it.k], x + 30, ry + 4, { size: 8 }); if (it.d) text(it.d, x + 30, ry + 14, { size: 6, color: '#b8acc4' });
    text(it.p + ' moedas', x + w - 104, ry + 8, { size: 7, color: S.coins >= it.p ? '#ffe070' : '#ff7a6a' });
    if (button('b' + i, x + w - 56, ry + 5, 46, 14, owned ? 'Já tem' : 'Comprar', { size: 7, style: PAN.green, disabled: owned || S.coins < it.p })) { S.coins -= it.p; S.inv[it.k]++; Snd.play('craft'); toast('Comprou ' + ITEM_NAMES[it.k] + '!', '#8ad860'); }
  });
  else Object.keys(SHOP_SELL).forEach((k, i) => {
    const ry = y + 28 + i * 23, have = S.inv[k] || 0, p = SHOP_SELL[k]; panel(x + 6, ry, w - 12, 21, rowBg);
    icon(k, x + 12, ry + 4); text(ITEM_NAMES[k] + '  x' + have, x + 30, ry + 6, { size: 8, color: have ? '#fbf3e0' : '#7a6e88' }); text(p + ' cada', x + w - 150, ry + 7, { size: 7, color: '#ffe070' });
    if (button('v' + i, x + w - 104, ry + 4, 44, 13, 'Vender 1', { size: 6, disabled: !have })) { S.inv[k]--; S.coins += p; Snd.play('pick'); }
    if (button('vt' + i, x + w - 56, ry + 4, 46, 13, 'Tudo', { size: 6, disabled: !have, style: PAN.gold })) { S.coins += p * have; S.inv[k] = 0; Snd.play('craft'); toast('+' + p * have + ' moedas', '#ffe070'); }
  });
};

// ---------- comida: R come fruta, ou peixe se não tiver fruta ----------
const _updatePlay = updatePlay;
updatePlay = function (dt) {
  if (pressed('r') && !S.inv.fruta && S.inv.peixe > 0) { S.inv.peixe--; S.energy = Math.min(100, S.energy + 25); toast('Você comeu um peixe assado. +25 energia', '#8ad4f4'); Snd.play('pick'); In.pressed.r = false; }
  if (P && P.mount && P.moving && Math.random() < dt * 12) FX.add({ x: P.x + rand(-6, 6), y: P.y, vx: rand(-10, 10), vz: 6, life: 0.4, color: '#c8b890', fade: true, size: 2 });
  _updatePlay(dt);
};

// ---------- missões novas (antes de "registrar todas") ----------
QUESTS.splice(QUESTS.length - 1, 0,
  { n: 'Colha sua primeira plantação', hint: 'Compre sementes no Mascate, plante na horta perto de casa', check: s => (s.stats.harvest || 0) >= 1 },
  { n: 'Pesque 3 peixes', hint: 'Vara de Pesca no Mascate. Fique de frente pra água e aperte E', check: s => (s.stats.fish || 0) >= 3 },
  { n: 'Junte 200 moedas', hint: 'Venda peixes, frutas douradas e cristais pro Mascate', check: s => (s.coins || 0) >= 200 },
);
