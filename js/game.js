'use strict';
// ================= ESTADO =================
const SAVE_KEY = 'fazendamon_web_v1', SEED = 7;
const G = { mode: 'loading', t: 0, world: null, toasts: [], dialog: null, menu: null, fade: null, banner: null, evo: null, helpT: 0, biome: null, msgCd: 0, rest: false, saveT: 0, mouseWorld: [0, 0] };
let S = null;            // dados salvos
let P = null, C = null;  // jogador e criatura ativa (entidades)
let WILD = [], SHOTS = [], ORBS = [], REGROW = [];
const SPx = k => SPECIES[k];
function mkMon(sp, lv) { const m = { sp, lv, xp: 0, id: Math.random().toString(36).slice(2, 9) }; m.hp = maxHp(m); return m; }
const maxHp = m => R(SPECIES[m.sp].hp * (1 + (m.lv - 1) * 0.13));
const atkOf = m => SPECIES[m.sp].atk * (1 + (m.lv - 1) * 0.1);
const xpNeed = lv => 12 + lv * 8;
const activeMon = () => S.team[S.active] || null;
const teamHas = ab => S.team.find(m => SPECIES[m.sp].ab.includes(ab));
const TYPE_SND = { eletrico: 'zap', planta: 'leaf', fogo: 'fire', agua: 'water', gelo: 'ice', lutador: 'punch', coral: 'water' };
const TYPE_FX = { eletrico: ['#fff27a', '#f2c02c', '#ffffff'], planta: ['#8ad860', '#4aa040', '#c8f0a0'], fogo: ['#ffd25a', '#f07a22', '#c8321e'], agua: ['#8ad4f4', '#3a9ae0', '#ffffff'], gelo: ['#ffffff', '#bfe7f6', '#8ad0ee'], lutador: ['#f2e2b8', '#c8a060', '#ffffff'], coral: ['#ff9ac8', '#fff2a0', '#f07890'] };
function toast(s, col = '#fbf3e0') { G.toasts.push({ s, col, t: 0 }); if (G.toasts.length > 4) G.toasts.shift(); }
function say(name, lines, onEnd, choices) { G.dialog = { name, lines, i: 0, ch: 0, onEnd, choices }; Snd.play('open'); }

function newSave(spawn) {
  return {
    v: 1, spawn, time: 7, day: 1, px: 0, py: 0, energy: 100, warmth: 100, active: 0,
    inv: { madeira: 0, pedra: 0, fruta: 2, esfera: 4, racao: 2, fogueira: 0, tocha: 0, cristal: 0, superesfera: 0, amuleto: 0 },
    team: [], ranch: [], dex: {}, quest: 0, stops: [], shrines: [], fires: [],
    flags: { talked: false, island: false, intro: false }, stats: { sticks: 0, pebbles: 0, crafted: 0, caught: 0, evolved: 0, cristais: 0, supers: 0 },
  };
}
function saveGame() { if (!S || G.mode !== 'play') return; S.px = P.x; S.py = P.y; if (Store.set(SAVE_KEY, S)) G.saved = 2; }

// ================= INÍCIO =================
function boot() {
  buildArt();
  G.world = new World(SEED);
  G.mode = 'title'; G.titleCam = { x: BIOMES.forest.cx - 240, y: BIOMES.forest.cy - 150 };
}
function startPlay(fromSave) {
  const W = G.world;
  if (!fromSave) {
    const vl = W.villages.find(v => v.biome === S.spawn);
    S.px = vl.x + 10; S.py = vl.y + 70;
  }
  const surfer = teamHas('surf');
  P = { x: S.px, y: S.py, dir: 'down', flip: false, t: 0, moving: false, surf: W.ground(S.px, S.py) === 'water' && surfer ? surfer.sp : false, stepT: 0, hurtT: 0 };
  if (W.ground(P.x, P.y) === 'water' && !P.surf) { const vl = W.villages.find(v => v.biome === S.spawn); P.x = vl.x + 10; P.y = vl.y + 70; }
  C = null; WILD = []; SHOTS = []; ORBS = []; REGROW = []; G.cut = null; G.dialog = null; G.menu = null; G.rest = false;
  // o mundo continua na memória entre partidas: restaura o que foi colhido e refaz as fogueiras do jogador
  for (const o of W.props.slice()) { if (o.placed) { W.removeProp(o); continue; } o.gone = false; if (o.stump) { o.stump = false; o.spr = o.orig; o.harvest = 'tree'; } if (o.full && o.spr !== o.full) { o.spr = o.full; o.harvest = 'berry'; } }
  W.fires = W.fires.filter(f => !f.placed);
  for (const sh of W.shrines) sh.pray = null;
  for (const f of S.fires) placeFire(f.x, f.y, f.lit, true);
  spawnCompanion();
  Cam.x = P.x - V.W / 2; Cam.y = P.y - V.H / 2;
  G.mode = 'play'; G.helpT = fromSave ? 12 : 60; G.biome = null;
  // compatibilidade com saves antigos + estado do hardmode
  for (const k of ['cristal', 'superesfera', 'amuleto']) S.inv[k] = S.inv[k] || 0;
  S.stats.cristais = S.stats.cristais || 0; S.stats.supers = S.stats.supers || 0;
  BIOMES.mordor.spawn = S.flags.hardmode ? BIOMES.mordor.hardSpawn : {};
  G.gpos = guardianSpot(); G.boss = null;
  if (!S.flags.intro) faiscaCutscene();
}
function faiscaCutscene() {
  const w = makeWild('faisca', 3, P.x + 130, P.y - 10); w.state = 'approach'; w.tame = true; WILD.push(w);
  G.cut = { w, t: 0 };
}
function finishCutscene() {
  const w = G.cut.w; WILD = WILD.filter(x => x !== w); G.cut = null;
  const m = mkMon('faisca', 3); S.team.push(m); S.active = 0; S.dex.faisca = 2; S.flags.intro = true;
  spawnCompanion(w.x, w.y);
  say('Faísca', ['(Um Faísca chegou correndo e não sai do seu lado...)', 'Faísca entrou pra sua equipe! Ele sabe ACENDER fogueiras e ILUMINAR a noite.', 'Dica: clique numa criatura selvagem pro Faísca lutar. Quando ela estiver fraca, aperte Q pra jogar uma esfera.'], () => saveGame());
}

// ================= ENTIDADES =================
function makeWild(sp, lv, x, y) { const m = { sp, lv }; const max = maxHp(m); return { sp, lv, hp: max, max, x, y, flip: false, t: rand(4), moving: false, state: 'wander', st: rand(1, 3), dx: 0, dy: 0, target: null, cd: 1, hitT: 0, ko: false, koT: 0 }; }
function spawnCompanion(x, y) {
  const m = activeMon(); if (!m || m.hp <= 0 || P.surf) { C = null; return; }
  C = { m, x: x ?? P.x - 16, y: y ?? P.y + 4, flip: false, t: 0, moving: false, target: null, cd: 0.5, hits: 0, hitT: 0, lunge: 0 };
  FX.burst(C.x, C.y - 6, 10, { speed: [20, 50], life: [0.3, 0.6], color: TYPE_FX[SPx(m.sp).t], g: 0, drag: 4 });
}
function placeFire(x, y, lit, silent) {
  const o = G.world.addProp({ kind: 'fire', x: R(x), y: R(y), spr: lit ? ART.props.fire : ART.props.fireOff, r: 6, lit, placed: true });
  G.world.fires.push(o);
  if (!silent) S.fires.push({ x: o.x, y: o.y, lit });
  return o;
}

// ================= MOVIMENTO / COLISÃO =================
function canStand(x, y, surf) {
  const W = G.world, g = W.ground(x, y);
  if (g === 'lava') return false;
  if (g === 'water' && !surf) return false;
  if (g === 'land' || g === 'ice') { if (W.cellB(x, y) === 'mordor' && !S.flags.hardmode) return false; if (W.hitsProp(x, y, 4)) return false; }
  return true;
}
function moveEnt(e, dx, dy, surf) {
  if (dx && canStand(e.x + dx, e.y, surf)) e.x += dx;
  if (dy && canStand(e.x, e.y + dy, surf)) e.y += dy;
}

// ================= JOGO: ATUALIZAÇÃO =================
function updatePlay(dt) {
  const W = G.world;
  // tempo do dia (1 hora = 15 s; descansando passa 8x mais rápido)
  S.time += dt / 15 * (G.rest ? 8 : 1); if (S.time >= 24) { S.time -= 24; S.day++; toast('Dia ' + S.day, '#ffe070'); }
  if (G.cut) { updateCutscene(dt); updateWorldBits(dt); return; }
  // ---- jogador ----
  let mx = (key('d') || key('arrowright') ? 1 : 0) - (key('a') || key('arrowleft') ? 1 : 0);
  let my = (key('s') || key('arrowdown') ? 1 : 0) - (key('w') || key('arrowup') ? 1 : 0);
  const moving = mx || my;
  if (moving && G.rest) { G.rest = false; toast('Você se levantou.'); }
  const running = key('shift') && moving && S.energy > 5 && !P.surf;
  let sp = P.surf ? 70 : running ? 96 : 62;
  if (teamHas('corrida')) sp *= 1.2;
  if (S.energy <= 0) sp *= 0.55;
  if (moving) {
    const l = Math.hypot(mx, my); mx /= l; my /= l;
    const nx = P.x + mx * sp * dt, ny = P.y + my * sp * dt, gNext = W.ground(nx, ny);
    if (!P.surf && gNext === 'water' && W.v(nx, ny) < -0.004) {
      const surfer = teamHas('surf');
      if (surfer) { P.surf = surfer.sp; Snd.play('splash'); FX.burst(nx, ny, 14, { speed: [20, 60], life: [0.3, 0.6], color: ['#ffffff', '#bfe7f6'], vz: [20, 50], g: 160 }); C = null; toast(SPx(surfer.sp).n + ' usou SURF!', '#8ad4f4'); }
      else if (G.msgCd <= 0) { toast('A água é funda. Você precisa de uma criatura com SURF (Lontrágua).', '#ff9a8a'); G.msgCd = 3; }
    }
    if (P.surf && gNext === 'land') { const t = P.surf; P.surf = false; if (canStand(nx, ny, false)) { P.x = nx; P.y = ny; } else P.surf = t; if (!P.surf) { Snd.play('splash'); spawnCompanion(); } }
    if ((W.ground(nx, ny) === 'land' || W.ground(nx, ny) === 'ice') && W.cellB(nx, ny) === 'mordor' && !S.flags.hardmode && G.msgCd <= 0) {
      G.msgCd = 4; say('', ['Uma névoa cinzenta e pesada bloqueia o caminho.', 'Dizem que só quem derrotar o Guardião do Ermo vai conseguir passar. (Em breve: Hardmode)']);
      for (let i = 0; i < 20; i++) FX.add({ x: nx + rand(-30, 30), y: ny + rand(-20, 10), vy: -rand(10, 30), life: rand(0.6, 1.2), color: pick(['#6a3a8a', '#3a1a4a', '#9a6ac0']), size: 2, fade: true });
    }
    moveEnt(P, mx * sp * dt, my * sp * dt, !!P.surf);
    if (Math.abs(mx) > Math.abs(my) * 0.8) { P.dir = 'side'; P.flip = mx < 0; } else P.dir = my < 0 ? 'up' : 'down';
    P.stepT -= dt; if (P.stepT <= 0) { P.stepT = running ? 0.22 : 0.32; if (!P.surf) Snd.play('step'); }
    if (W.ground(P.x, P.y) === 'land' && W.cellB(P.x, P.y) === 'island' && !S.flags.island) { S.flags.island = true; toast('Você chegou nas Ilhas de Coral!', '#ff9ac8'); }
  }
  P.moving = !!moving; P.t += dt * (running ? 1.5 : 1);
  G.msgCd -= dt;
  // ---- energia e frio ----
  S.energy = clamp(S.energy - dt * (0.07 + (running ? 0.45 : 0)), 0, 100);
  const biome = P.surf ? null : W.cellB(P.x, P.y);
  const nearFire = W.fires.some(f => f.lit && dist(f.x, f.y, P.x, P.y) < 70);
  const cold = biome === 'taiga' && !S.inv.amuleto && !teamHas('aquecer') && !teamHas('pelagem') && !nearFire;
  S.warmth = clamp(S.warmth + dt * (cold ? -6 : 18), 0, 100);
  if (S.warmth <= 0) { S.energy = Math.max(0, S.energy - dt * 3); if (G.msgCd <= 0) { toast('Você está congelando! Fique perto de uma fogueira ou leve um Brasinha.', '#9ad8f4'); G.msgCd = 5; } }
  if (nearFire && G.rest) { S.energy = Math.min(100, S.energy + dt * 9); }
  if (S.energy <= 0 && G.msgCd <= 0) { toast('Você está exausto. Descanse numa fogueira ou durma em casa.', '#ffb070'); G.msgCd = 6; }
  const healer = teamHas('cura'); if (healer) for (const m of S.team) if (m.hp > 0) m.hp = Math.min(maxHp(m), m.hp + dt * 1.2);
  // ---- bioma (faixa com o nome + música) ----
  if (biome && biome !== G.biome) { G.biome = biome; G.banner = { s: BIOMES[biome].n, t: 0 }; Music.set(...BIOMES[biome].music); }
  // ---- teclas ----
  if (pressed('e') || pressed(' ')) interact();
  if (pressed('q') || In.rclick) throwOrb();
  if (pressed('g')) throwOrb(true);
  if (biome === 'mordor' && !S.flags.ermo) { S.flags.ermo = true; toast('Você pisou no Ermo Cinzento. Cuidado!', '#c890ff'); }
  updateBoss(dt);
  if (pressed('f')) { const t = nearestWild(150); if (t && C) { C.target = t; Snd.play('click'); } }
  if (pressed('h')) useRation();
  if (pressed('r')) { if (S.inv.fruta > 0) { S.inv.fruta--; S.energy = Math.min(100, S.energy + 15); toast('Você comeu uma fruta. +15 energia', '#8ad860'); Snd.play('pick'); } else toast('Sem frutas.', '#ff9a8a'); }
  if (pressed('b')) placeOwnFire();
  for (let i = 1; i <= 6; i++) if (pressed(String(i)) && S.team[i - 1]) switchActive(i - 1);
  if (pressed('c')) openMenu('craft');
  if (pressed('tab')) openMenu('team');
  if (pressed('m')) openMenu('map');
  if (pressed('escape')) openMenu('pause');
  // clique numa criatura selvagem = mandar atacar
  const wx = In.mx + Cam.x, wy = In.my + Cam.y; G.mouseWorld = [wx, wy];
  if (In.mclick) { const w = wildAt(wx, wy); if (w && w.pray) toast('Essa criatura está rezando. Deixe ela em paz.', '#c8e8ff'); else if (w && w.ko) toast('Está nocauteada! Jogue a esfera (Q).', '#ffe070'); else if (w) { if (C) { C.target = w; Snd.play('click'); } else toast(activeMon() ? 'Sua criatura ativa está desmaiada. Use Ração (H).' : 'Você não tem criatura ativa.', '#ff9a8a'); } }
  updateCompanion(dt); updateWilds(dt); updateShots(dt); updateOrbs(dt); updateWorldBits(dt);
  // missões
  const Q = QUESTS[S.quest]; if (Q && Q.check(S)) { S.quest++; Snd.play('quest'); toast('Missão cumprida: ' + Q.n, '#ffe070'); S.inv.esfera += 2; S.inv.racao += 1; toast('+2 Esferas, +1 Ração', '#ffe070'); }
  G.saveT += dt; if (G.saveT > 40) { G.saveT = 0; saveGame(); }
}
function updateWorldBits(dt) {
  const W = G.world;
  for (const r of REGROW) { r.t -= dt; if (r.t <= 0) { const o = r.o; if (r.kind === 'stump') { o.stump = false; o.spr = o.orig; o.harvest = 'tree'; } else if (r.kind === 'berry') { o.spr = o.full; o.harvest = 'berry'; } else { o.gone = false; } } }
  REGROW = REGROW.filter(r => r.t > 0);
  for (const s of W.stops) if (!S.stops.includes(s.name) && dist(s.x, s.y, P.x, P.y) < 80) { S.stops.push(s.name); toast('Ponto de ônibus descoberto: ' + s.name, '#f2c43a'); Snd.play('bus'); }
  // partículas de fogo das fogueiras próximas
  for (const f of W.fires) if (f.lit && Math.abs(f.x - P.x) < 300 && Math.abs(f.y - P.y) < 200 && Math.random() < dt * 8) FX.add({ x: f.x + rand(-3, 3), y: f.y - 4, vz: rand(14, 30), vx: rand(-4, 4), life: rand(0.4, 0.9), color: pick(['#ffd25a', '#f07a22', '#ff9a3a']), size: 1 });
  ambient(dt);
}
function updateCutscene(dt) {
  const c = G.cut, w = c.w; c.t += dt; w.t += dt;
  const d = dist(w.x, w.y, P.x, P.y);
  if (d > 22) { const a = Math.atan2(P.y - w.y, P.x - w.x); w.x += Math.cos(a) * 70 * dt; w.y += Math.sin(a) * 70 * dt; w.flip = Math.cos(a) < 0; w.moving = true; if (Math.random() < dt * 10) FX.add({ x: w.x, y: w.y - 4, vz: 10, life: 0.3, color: '#fff27a' }); }
  else { w.moving = false; if (!c.bubble) { c.bubble = true; c.bt = 0; Snd.play('cry'); } }
  if (c.bubble) { c.bt += dt; if (c.bt > 1.3 && !G.dialog) finishCutscene(); }
  P.dir = 'side'; P.flip = w.x < P.x;
}

// ================= CRIATURA ATIVA =================
function switchActive(i) {
  if (i === S.active && C) return;
  const m = S.team[i]; if (!m) return;
  S.active = i; if (C) FX.burst(C.x, C.y - 6, 8, { speed: [20, 40], life: [0.2, 0.4], color: '#ffffff' });
  spawnCompanion(); Snd.play('open');
  if (m.hp <= 0) toast(SPx(m.sp).n + ' está desmaiado.', '#ff9a8a'); else toast('Vai, ' + SPx(m.sp).n + '!');
}
function updateCompanion(dt) {
  if (!C) return; const m = C.m, sp = SPx(m.sp);
  if (m.hp <= 0 || activeMon() !== m) { C = null; return; }
  C.t += dt; C.hitT -= dt; C.lunge = Math.max(0, C.lunge - dt * 4);
  if (C.target && (C.target.ko || C.target.dead || !WILD.includes(C.target) || dist(C.target.x, C.target.y, P.x, P.y) > 320)) C.target = null;
  // defende automaticamente quem atacar
  if (!C.target) { const a = WILD.find(w => w.state === 'fight' && w.target === 'comp'); if (a) C.target = a; }
  let tx, ty, spd = 85;
  if (C.target) {
    const T = C.target, range = sp.ranged ? 56 : 15, d = dist(C.x, C.y, T.x, T.y);
    if (d > range) { const a = Math.atan2(T.y - C.y, T.x - C.x); tx = T.x - Math.cos(a) * range * 0.8; ty = T.y - Math.sin(a) * range * 0.8; spd = 110; }
    C.flip = T.x < C.x; C.cd -= dt;
    if (d <= range + 4 && C.cd <= 0) { C.cd = 1.15 / sp.spd; C.hits++; attack(C, m.sp, atkOf(m), T, 'comp', C.hits % 3 === 0); }
    if (T.state !== 'fight' && T.state !== 'ko' && !T.pray) { T.state = 'fight'; T.target = 'comp'; }
  } else { const bx2 = P.x + (P.flip ? 18 : -18), by2 = P.y + 6; if (dist(C.x, C.y, bx2, by2) > 14) { tx = bx2; ty = by2; spd = dist(C.x, C.y, P.x, P.y) > 90 ? 160 : 80; } }
  if (tx !== undefined) { const a = Math.atan2(ty - C.y, tx - C.x), d = dist(C.x, C.y, tx, ty), s = Math.min(d, spd * dt); C.x += Math.cos(a) * s; C.y += Math.sin(a) * s; C.moving = s > 0.2; if (!C.target) C.flip = Math.cos(a) < 0; } else C.moving = false;
  if (dist(C.x, C.y, P.x, P.y) > 260) { C.x = P.x - 14; C.y = P.y + 4; }
  // efeitos de tipo
  if (Math.random() < dt * 3) { const col = TYPE_FX[sp.t]; FX.add({ x: C.x + rand(-6, 6), y: C.y - rand(4, sp.h), vz: rand(4, 12), life: rand(0.3, 0.7), color: pick(col), size: 1 }); }
}
// um ataque (companheiro ou selvagem)
function attack(src, spk, atk, T, side, special) {
  const sp = SPx(spk);
  if (sp.ranged) SHOTS.push({ x: src.x + (src.flip ? -8 : 8), y: src.y - sp.h * 0.6, T, spk, atk, side, special, t: 0 });
  else { src.lunge = 1; hit(spk, atk, T, side, special, src); }
  Snd.play(TYPE_SND[sp.t]);
}
function hit(spk, atk, T, side, special, src) {
  const sp = SPx(spk);
  const defT = side === 'comp' ? SPx(T.sp).t : (T === 'player' ? null : SPx(T.m.sp).t);
  if (T === 'player') { hurtPlayer(src); return; }
  const mult = defT ? typeMult(sp.t, defT) : 1;
  const dmg = Math.max(1, R(atk * mult * rand(0.85, 1.15) * (special ? 1.6 : 1)));
  const tx = side === 'comp' ? T.x : C ? C.x : P.x, ty = side === 'comp' ? T.y : C ? C.y : P.y, th = side === 'comp' ? SPx(T.sp).h : SPx(T.m.sp).h;
  FX.burst(tx, ty - th / 2, special ? 16 : 8, { speed: [30, 90], life: [0.2, 0.5], color: TYPE_FX[sp.t], vz: [10, 40], g: 120, drag: 3 });
  FX.text(tx, ty - th - 6, '' + dmg, mult > 1 ? '#ffd040' : mult < 1 ? '#a8a8b8' : '#ffffff', special ? 9 : 7);
  if (mult > 1) FX.text(tx, ty - th - 16, 'Super efetivo!', '#ffd040', 6);
  if (special) { FX.text(tx, ty - th - (mult > 1 ? 24 : 16), sp.move + '!', '#ffffff', 6); shake(0.25); }
  Snd.play('hit');
  if (side === 'comp') {
    T.hp -= dmg; T.hitT = 0.12; T.x += (T.x > (C ? C.x : P.x) ? 1 : -1) * 3;
    if (T.hp <= 0 && !T.ko) knockOut(T);
    else if (SPx(T.sp).temp === 'timido' && T.hp < T.max * 0.3 && Math.random() < 0.5) { T.state = 'flee'; T.st = 2.5; }
  } else {
    const m = T.m; m.hp -= dmg; T.hitT = 0.12;
    if (m.hp <= 0) { m.hp = 0; Snd.play('faint'); toast(SPx(m.sp).n + ' desmaiou! Use Ração (H) ou troque (1-6).', '#ff9a8a'); FX.burst(T.x, T.y - 6, 14, { speed: [20, 60], life: [0.4, 0.8], color: ['#ffffff', '#c8c8d8'] }); C = null; for (const w of WILD) if (w.target === 'comp') w.target = SPx(w.sp).temp === 'agressivo' ? 'player' : null; }
  }
}
function hurtPlayer(src) {
  if (P.hurtT > 0) return; P.hurtT = 1;
  S.energy = Math.max(0, S.energy - 7); shake(0.4); Snd.play('hit'); G.redFlash = 0.35;
  FX.text(P.x, P.y - 34, '-7 energia', '#ff7a6a', 7);
  if (src) { const a = Math.atan2(P.y - src.y, P.x - src.x); moveEnt(P, Math.cos(a) * 10, Math.sin(a) * 10, !!P.surf); }
}
function knockOut(w) {
  if (SPx(w.sp).boss) { defeatBoss(w); return; }
  w.ko = true; w.hp = 0; w.state = 'ko'; w.koT = 12; Snd.play('faint');
  FX.text(w.x, w.y - SPx(w.sp).h - 10, 'Nocaute! Jogue a esfera (Q)', '#ffe070', 6);
  if (C) gainXp(C.m, 8 + w.lv * 5);
  for (const m of S.team) if (C && m !== C.m && m.hp > 0) gainXp(m, R((8 + w.lv * 5) * 0.3), true);
}
function gainXp(m, n, quiet) {
  m.xp += n; if (!quiet && C && C.m === m) FX.text(C.x, C.y - SPx(m.sp).h - 14, '+' + n + ' XP', '#8ad4f4', 6);
  while (m.xp >= xpNeed(m.lv)) {
    m.xp -= xpNeed(m.lv); const old = maxHp(m); m.lv++; m.hp += maxHp(m) - old;
    if (!quiet) { Snd.play('level'); toast(SPx(m.sp).n + ' subiu pro nível ' + m.lv + '!', '#8ad4f4'); }
    const e = SPx(m.sp).evo; if (e && m.lv >= e.lv && !G.evo) startEvolution(m);
  }
}
function startEvolution(m) { const from = m.sp, to = SPx(from).evo.to; G.evo = { m, from, to, t: 0 }; Snd.play('evolve'); }
function finishEvolution() {
  const e = G.evo, m = e.m, old = maxHp(m); m.sp = e.to; m.hp = Math.min(maxHp(m), m.hp + maxHp(m) - old + 10);
  S.dex[e.to] = 2; S.stats.evolved++; G.evo = null;
  toast(SPx(e.from).n + ' evoluiu para ' + SPx(e.to).n + '!', '#ffe070');
  const nw = SPx(e.to).ab.filter(a => !SPx(e.from).ab.includes(a)); if (nw.length) toast('Nova habilidade: ' + nw.map(a => ABIL[a].n).join(', '), '#8ad860');
  if (C && C.m === m) spawnCompanion(C.x, C.y);
}
function useRation() {
  const m = activeMon(); if (!m) return;
  if (S.inv.racao <= 0) { toast('Sem ração. Crie com 2 frutas (C).', '#ff9a8a'); Snd.play('deny'); return; }
  if (m.hp >= maxHp(m)) { toast(SPx(m.sp).n + ' já está com a vida cheia.'); return; }
  S.inv.racao--; const was = m.hp; m.hp = Math.min(maxHp(m), Math.max(m.hp, 0) + maxHp(m) * 0.6); Snd.play('heal');
  toast(SPx(m.sp).n + ' comeu a ração! +' + R(m.hp - Math.max(was, 0)) + ' vida', '#8ad860');
  if (!C) spawnCompanion();
}

// ================= SELVAGENS =================
function spawnWilds(dt) {
  const W = G.world; G.spawnT = (G.spawnT || 0) - dt; if (G.spawnT > 0) return; G.spawnT = 0.4;
  const near = WILD.filter(w => !w.pray && dist(w.x, w.y, P.x, P.y) < 460).length;
  if (near < 9) for (let t = 0; t < 6; t++) {
    const a = rand(TAU), d = rand(250, 430), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d * 0.75;
    if (W.ground(x, y) !== 'land' || W.v(x, y) < 0.04) continue;
    const b = W.cellB(x, y), B = BIOMES[b]; if (!B || !Object.keys(B.spawn).length) continue;
    if (W.villages.some(v => dist(v.x, v.y, x, y) < 150)) continue;
    let tot = 0; for (const k in B.spawn) tot += B.spawn[k]; let roll = rand(tot), sp = null;
    for (const k in B.spawn) { roll -= B.spawn[k]; if (roll <= 0) { sp = k; break; } } sp = sp || Object.keys(B.spawn)[0];
    let lv = irand(B.lv[0], B.lv[1]) + (S.flags.hardmode ? 3 : 0); if (SPx(sp).evo === undefined && !['nevisco', 'bambule', 'lontragua', 'coralume'].includes(sp)) lv += 3;
    WILD.push(makeWild(sp, lv, x, y)); break;
  }
  // criaturas rezando nos santuários
  for (const sh of W.shrines) {
    if (dist(sh.x, sh.y, P.x, P.y) > 420 || sh.pray) continue;
    const B = BIOMES[sh.biome], ks = Object.keys(B.spawn).sort((a, b) => B.spawn[b] - B.spawn[a]);
    sh.pray = [];
    [[-34, 10], [34, 10], [-20, 26], [20, 26]].forEach(([ox, oy], i) => { const w = makeWild(ks[i % Math.min(2, ks.length)], B.lv[1], sh.x + ox, sh.y + oy); w.pray = true; w.state = 'pray'; w.flip = ox > 0; w.shrine = sh; WILD.push(w); sh.pray.push(w); });
  }
}
function updateWilds(dt) {
  spawnWilds(dt);
  const W = G.world;
  for (const w of WILD) {
    const sp = SPx(w.sp); w.t += dt; w.hitT -= dt;
    const dP = dist(w.x, w.y, P.x, P.y);
    if (dP < 260 && !S.dex[w.sp] && !sp.boss) { S.dex[w.sp] = 1; toast('Nova criatura vista: ' + sp.n, '#c8e8ff'); }
    if (w.pray) { w.moving = false; if (Math.random() < dt * 1.5) FX.add({ x: w.x + rand(-4, 4), y: w.y - sp.h, vz: 12, life: 1, color: SHRINE_COL[w.shrine.biome], type: 'star' }); continue; }
    if (w.caught) continue;
    if (w.ko) { w.koT -= dt; w.moving = false; if (w.koT <= 0) { w.ko = false; w.hp = R(w.max * 0.3); w.state = 'flee'; w.st = 3; } continue; }
    let mx = 0, my = 0, spd = 34;
    w.st -= dt;
    if (w.state === 'wander') {
      if (w.st <= 0) { w.st = rand(1.2, 3.5); const a = rand(TAU); [w.dx, w.dy] = Math.random() < 0.4 ? [0, 0] : [Math.cos(a), Math.sin(a)]; }
      mx = w.dx; my = w.dy;
      if (sp.temp === 'timido' && dP < 55) { w.state = 'flee'; w.st = 1.8; }
      if (sp.temp === 'agressivo' && dP < 95) { w.state = 'fight'; w.target = C ? 'comp' : 'player'; FX.text(w.x, w.y - sp.h - 8, '!', '#ff5a4a', 9); Snd.play('cry'); }
    } else if (w.state === 'flee') {
      const a = Math.atan2(w.y - P.y, w.x - P.x); mx = Math.cos(a); my = Math.sin(a); spd = 70; if (w.st <= 0) w.state = 'wander';
    } else if (w.state === 'fight') {
      if (w.target === 'comp' && !C) w.target = sp.temp === 'agressivo' ? 'player' : null;
      if (!w.target || dP > 300) { w.state = 'wander'; w.target = null; }
      else {
        const T = w.target === 'comp' ? C : P, range = w.target === 'player' ? 12 : (sp.ranged ? 56 : 15), d = dist(w.x, w.y, T.x, T.y);
        if (d > range) { const a = Math.atan2(T.y - w.y, T.x - w.x); mx = Math.cos(a); my = Math.sin(a); spd = 70; }
        w.cd -= dt; w.flip = T.x < w.x;
        if (d <= range + 4 && w.cd <= 0) { w.cd = 1.3 / sp.spd; w.hits = (w.hits || 0) + 1; attack(w, w.sp, atkOf(w) * 0.8, w.target === 'comp' ? C : 'player', 'wild', w.hits % 4 === 0); }
      }
    }
    if (mx || my) { const nx = w.x + mx * spd * dt, ny = w.y + my * spd * dt; if (W.ground(nx, ny) === 'land' && (S.flags.hardmode || W.cellB(nx, ny) !== 'mordor')) { w.x = nx; w.y = ny; } else { w.dx = -w.dx; w.dy = -w.dy; } if (Math.abs(mx) > 0.1 && w.state !== 'fight') w.flip = mx < 0; w.moving = true; } else w.moving = false;
  }
  // tirar os distantes
  WILD = WILD.filter(w => { if (w.caught) return false; const far = dist(w.x, w.y, P.x, P.y) > (w.pray ? 520 : 650); if (far && w.pray && w.shrine) w.shrine.pray = null; return !far || w.tame; });
}
function nearestWild(r) { let best = null, bd = r; for (const w of WILD) { if (w.pray || w.ko || w.tame) continue; const d = dist(w.x, w.y, P.x, P.y); if (d < bd) { bd = d; best = w; } } return best; }
function wildAt(x, y) { let best = null; for (const w of WILD) { if (w.tame) continue; const s = ART.cr[w.sp].idle[0]; if (Math.abs(x - w.x) < s.W / 2 + 3 && y > w.y - s.H - 3 && y < w.y + 4) best = w; } return best; }

// ================= PROJÉTEIS =================
function updateShots(dt) {
  for (const s of SHOTS) {
    s.t += dt; const T = s.T, tx = T === 'player' ? P.x : T.x, ty = (T === 'player' ? P.y : T.y) - 8;
    const a = Math.atan2(ty - s.y, tx - s.x), d = dist(s.x, s.y, tx, ty), v = 190 * dt;
    if (d <= v + 3 || (T !== 'player' && (T.dead || (s.side === 'wild' && !C)))) { s.done = true; if (d <= v + 3) hit(s.spk, s.atk, T === 'player' ? 'player' : (s.side === 'wild' ? C : T), s.side, s.special, s); continue; }
    s.x += Math.cos(a) * v; s.y += Math.sin(a) * v;
    const col = TYPE_FX[SPx(s.spk).t]; FX.add({ x: s.x, y: s.y, life: 0.25, color: pick(col), size: s.special ? 3 : 2 });
    if (s.t > 2) s.done = true;
  }
  SHOTS = SHOTS.filter(s => !s.done);
}
// ================= CAPTURA =================
function throwOrb(sup) {
  const kind = sup ? 'superesfera' : 'esfera';
  if (S.inv[kind] <= 0) { toast(sup ? 'Sem Super Esferas. Crie com cristal (C).' : 'Sem esferas. Crie com madeira + pedra (C).', '#ff9a8a'); Snd.play('deny'); return; }
  let [tx, ty] = G.mouseWorld; if (C && C.target && (pressed('q') || pressed('g'))) { const w = wildAt(tx, ty); if (!w) { tx = C.target.x; ty = C.target.y; } }
  const d = dist(P.x, P.y, tx, ty); if (d > 140) { const a = Math.atan2(ty - P.y, tx - P.x); tx = P.x + Math.cos(a) * 140; ty = P.y + Math.sin(a) * 140; }
  S.inv[kind]--; if (sup) S.stats.supers++; Snd.play('throw');
  ORBS.push({ sup, x0: P.x, y0: P.y - 14, x: P.x, y: P.y, tx, ty, t: 0, dur: 0.45, state: 'fly', z: 0 });
}
function updateOrbs(dt) {
  for (const o of ORBS) {
    o.t += dt;
    if (o.state === 'fly') {
      const k = Math.min(1, o.t / o.dur); o.x = lerp(o.x0, o.tx, k); o.y = lerp(o.y0 + 14, o.ty, k); o.z = Math.sin(k * Math.PI) * 26 + (1 - k) * 14;
      if (k >= 1) {
        let w = null, bd = 16; for (const c of WILD) { if (c.tame || c.caught) continue; const d = dist(c.x, c.y - 4, o.tx, o.ty); if (d < bd) { bd = d; w = c; } }
        if (!w) { o.state = 'done'; FX.burst(o.x, o.y, 6, { speed: [10, 30], life: [0.2, 0.4], color: '#c8b890' }); toast('Errou! A esfera se perdeu.', '#ff9a8a'); continue; }
        if (SPx(w.sp).boss) { o.state = 'done'; toast('Não dá pra capturar o Guardião!', '#ff9a8a'); Snd.play('deny'); continue; }
        if (w.pray) { o.state = 'done'; toast('Essa criatura está rezando. Deixe ela em paz.', '#c8e8ff'); Snd.play('deny'); continue; }
        o.w = w; w.caught = 'trying'; o.state = 'shake'; o.t = 0; o.x = w.x; o.y = w.y; o.z = 0;
        const sp = SPx(w.sp); o.chance = clamp(sp.catch * (1.25 - w.hp / w.max) + (w.ko ? 0.35 : 0) + (o.sup ? 0.3 : 0), 0.04, 0.97);
        o.ok = Math.random() < o.chance; o.shakes = o.ok ? 3 : irand(0, 2);
        FX.burst(w.x, w.y - 8, 12, { speed: [30, 70], life: [0.2, 0.5], color: ['#ffffff', '#8ad860'] }); Snd.play('catch');
      }
    } else if (o.state === 'shake') {
      const n = Math.floor(o.t / 0.6);
      if (n !== o.lastN) { o.lastN = n; if (n > 0 && n <= o.shakes) Snd.play('shake'); }
      if (o.t > 0.6 * (o.shakes + 1)) {
        const w = o.w; o.state = 'done';
        if (o.ok) {
          const m = mkMon(w.sp, w.lv); m.hp = Math.max(1, R(maxHp(m) * Math.max(0.3, w.hp / w.max)));
          if (S.team.length < 6) S.team.push(m); else S.ranch.push(m);
          S.dex[w.sp] = 2; S.stats.caught++; w.caught = true;
          FX.burst(o.x, o.y - 6, 30, { speed: [40, 120], life: [0.6, 1.2], color: ['#ffd23f', '#ff6a8a', '#7ed664', '#56cdea', '#fff6c2'], vz: [50, 100], g: 170, drag: 1.5 });
          Snd.play('catch'); Snd.play('level'); toast('Capturou ' + SPx(w.sp).n + ' (nv ' + w.lv + ')!' + (S.team.length >= 6 && S.ranch.includes(m) ? ' Foi pro rancho.' : ''), '#ffe070');
          if (C) gainXp(C.m, 6 + w.lv * 2);
        } else {
          w.caught = false; Snd.play('fail'); FX.burst(o.x, o.y - 6, 14, { speed: [30, 80], life: [0.3, 0.6], color: ['#ffffff', '#c8b890'] });
          toast(SPx(w.sp).n + ' escapou! (' + R(o.chance * 100) + '% de chance)', '#ff9a8a');
          if (w.ko) { w.ko = false; w.hp = Math.max(1, w.hp); } w.state = SPx(w.sp).temp === 'timido' ? 'flee' : 'fight'; w.st = 2; w.target = C ? 'comp' : 'player';
        }
      }
    }
  }
  ORBS = ORBS.filter(o => o.state !== 'done');
}

// ================= INTERAÇÃO =================
function findInteract() {
  const W = G.world; let best = null, bd = 30;
  const fx = P.x + (P.dir === 'side' ? (P.flip ? -8 : 8) : 0), fy = P.y + (P.dir === 'up' ? -8 : P.dir === 'down' ? 6 : 0);
  for (const n of W.npcs) { const d = dist(n.x, n.y, fx, fy); if (d < bd) { bd = d; best = { type: 'npc', o: n }; } }
  W.near(fx, fy, 70, o => {
    if (o.gone) return; let d = dist(o.x, o.y, fx, fy);
    if (o.kind === 'home' || o.kind === 'house') d = dist(o.x, o.y + 2, fx, fy) - 6; if (o.kind === 'shrine') d -= 10;
    const ok = o.harvest || o.kind === 'fire' || o.kind === 'bus' || o.kind === 'shrine' || o.kind === 'home';
    if (ok && d < bd) { bd = d; best = { type: 'prop', o }; }
  });
  return best;
}
const NEED = { tree: 'cortar', bamboo: 'cortar', boulder: 'forca', rock: 'forca', cristal: 'forca' };
function interactLabel(it) {
  if (!it) return null;
  if (it.type === 'npc') return ['Conversar com ' + it.o.name, null];
  const o = it.o;
  if (o.kind === 'home') return ['Dormir até de manhã', null];
  if (o.kind === 'bus') return ['Pegar o ônibus', null];
  if (o.kind === 'shrine') return ['Rezar no santuário', null];
  if (o.kind === 'fire') return o.lit ? [G.rest ? 'Levantar' : 'Descansar na fogueira', null] : (teamHas('acender') ? ['Acender (' + SPx(teamHas('acender').sp).n + ')', null] : ['Acender', 'precisa de Acender']);
  const nd = NEED[o.harvest];
  const lab = { tree: 'Cortar árvore', bamboo: 'Cortar bambu', boulder: 'Quebrar pedra', rock: 'Quebrar pedra', cristal: 'Minerar cristal', berry: 'Colher frutas', stick: 'Pegar galho', pebble: 'Pegar pedrinha' }[o.harvest];
  if (nd) { const m = teamHas(nd); return m ? [lab + ' (' + SPx(m.sp).n + ')', null] : [lab, 'precisa de ' + ABIL[nd].n]; }
  return [lab, null];
}
function interact() {
  const it = findInteract(); if (!it) return;
  if (it.type === 'npc') { S.flags.talked = true; say(it.o.name + ' · ' + it.o.village, it.o.lines); return; }
  const o = it.o, W = G.world;
  if (o.kind === 'home') { goSleep(); return; }
  if (o.kind === 'bus') { openMenu('map', { travel: true }); return; }
  if (o.kind === 'shrine') { pray(o); return; }
  if (o.kind === 'fire') {
    if (o.lit) { G.rest = !G.rest; if (G.rest) toast('Descansando... o tempo passa mais rápido. Ande pra levantar.', '#ffd25a'); return; }
    const m = teamHas('acender'); if (!m) { toast('Precisa de uma criatura com Acender (Faísca, Brasinha).', '#ff9a8a'); Snd.play('deny'); return; }
    o.lit = true; o.spr = ART.props.fire; Snd.play('fire'); toast(SPx(m.sp).n + ' acendeu a fogueira!', '#ffd25a');
    const sf = S.fires.find(f => f.x === o.x && f.y === o.y); if (sf) sf.lit = true; return;
  }
  const nd = NEED[o.harvest];
  if (nd && !teamHas(nd)) { toast('Precisa de uma criatura com ' + ABIL[nd].n + '. ' + (nd === 'cortar' ? '(Brotinho, Bambulê)' : '(Bambulê, Carvalhão, Fogaréu)'), '#ff9a8a'); Snd.play('deny'); return; }
  if (S.energy < 3 && nd) { toast('Sem energia. Descanse primeiro.', '#ff9a8a'); return; }
  const helper = nd ? teamHas(nd) : null;
  if (helper && C && C.m === helper) { C.x = o.x + (P.x < o.x ? -12 : 12); C.y = o.y + 2; C.lunge = 1; C.flip = P.x > o.x; }
  if (o.harvest === 'tree') { give('madeira', 3); S.energy -= 3; Snd.play('cut'); leafBurst(o); o.stump = true; o.orig = o.spr; o.spr = ART.props.stump[0]; o.harvest = null; REGROW.push({ o, t: 160, kind: 'stump' }); }
  else if (o.harvest === 'bamboo') { give('madeira', 2); S.energy -= 2; Snd.play('cut'); leafBurst(o); o.gone = true; REGROW.push({ o, t: 120 }); }
  else if (o.harvest === 'boulder' || o.harvest === 'rock') { give('pedra', o.harvest === 'boulder' ? 3 : 2); S.energy -= 3; Snd.play('rock'); shake(0.2); FX.burst(o.x, o.y - 5, 16, { speed: [30, 80], life: [0.3, 0.7], color: ['#b8bec4', '#8a94a0', '#e2e6ea'], vz: [30, 70], g: 200 }); o.gone = true; REGROW.push({ o, t: 200 }); }
  else if (o.harvest === 'berry') { give('fruta', 2); Snd.play('pick'); const gr = teamHas('crescer'); if (gr) toast(SPx(gr.sp).n + ' usou Crescer: as frutas brotaram de novo!', '#8ad860'); else { o.spr = o.empty; o.harvest = null; REGROW.push({ o, t: 90, kind: 'berry' }); } }
  else if (o.harvest === 'stick') { give('madeira', 1); S.stats.sticks++; Snd.play('pick'); o.gone = true; REGROW.push({ o, t: 150 }); }
  else if (o.harvest === 'cristal') { give('cristal', 1); S.stats.cristais++; S.energy -= 4; Snd.play('ice'); shake(0.2); FX.burst(o.x, o.y - 5, 16, { speed: [30, 80], life: [0.3, 0.7], color: ['#c890ff', '#7a3ac8', '#ffffff'], vz: [30, 70], g: 200 }); o.gone = true; REGROW.push({ o, t: 240 }); }
  else if (o.harvest === 'pebble') { give('pedra', 1); S.stats.pebbles++; Snd.play('pick'); o.gone = true; REGROW.push({ o, t: 150 }); }
  S.energy = Math.max(0, S.energy);
}
function give(k, n) { S.inv[k] += n; FX.text(P.x, P.y - 36, '+' + n + ' ' + ITEM_NAMES[k], '#ffe070', 7); }
function leafBurst(o) { FX.burst(o.x, o.y - 18, 18, { speed: [20, 60], life: [0.6, 1.2], color: ['#48a446', '#76c85c', '#2c7e38', '#8a5a34'], vz: [10, 50], g: 60, drag: 2, type: 'leaf' }); shake(0.15); }
function placeOwnFire() {
  if (S.inv.fogueira <= 0) { toast('Você não tem fogueira. Crie com 4 madeira + 2 pedra (C).', '#ff9a8a'); Snd.play('deny'); return; }
  const x = P.x + (P.dir === 'side' ? (P.flip ? -18 : 18) : 0), y = P.y + (P.dir === 'down' ? 16 : P.dir === 'up' ? -14 : 2);
  if (G.world.ground(x, y) !== 'land' || G.world.hitsProp(x, y, 8)) { toast('Não dá pra colocar aqui.', '#ff9a8a'); return; }
  S.inv.fogueira--; const lit = !!teamHas('acender'); placeFire(x, y, lit); Snd.play(lit ? 'fire' : 'click');
  toast(lit ? 'Fogueira montada e acesa!' : 'Fogueira montada. Falta uma criatura com Acender.', '#ffd25a');
}
function pray(sh) {
  for (const m of S.team) m.hp = maxHp(m); S.energy = Math.min(100, S.energy + 30); Snd.play('heal'); Snd.play('god');
  FX.burst(sh.x, sh.y - 20, 30, { speed: [20, 70], life: [0.8, 1.5], color: [SHRINE_COL[sh.biome], '#ffffff'], vz: [20, 60], g: -10, drag: 2, type: 'star' });
  const first = !S.shrines.includes(sh.biome); if (first) S.shrines.push(sh.biome);
  if (!C) spawnCompanion();
  const L = { forest: 'A floresta é o coração de Verdália. Obrigado por cuidar dela.', savana: 'O sol daqui já foi gentil. A névoa roubou as chuvas... mas você vai trazê-las de volta.', taiga: 'Até no frio existe vida. Os Neviscos sabem disso melhor que ninguém.', bambu: 'A montanha guarda o caminho pro Ermo. Quando você estiver forte, eu te mostro a passagem.', swamp: 'As águas escondem segredos. Siga a luz do coral no mar.', island: 'Você atravessou o mar com seus amigos. Estou orgulhoso de você.' };
  say('Verdan, o Deus-Semente', [(first ? '(As criaturas param de rezar e olham pra você...) ' : '') + L[sh.biome], 'Sua equipe foi curada e você recuperou energia.']);
}
function goSleep() {
  G.fade = { t: 0, dur: 1.6, mid: () => { if (S.time >= 6) S.day++; S.time = 6; S.energy = 100; S.warmth = 100; for (const m of S.team) m.hp = maxHp(m); G.rest = false; spawnCompanion(); saveGame(); }, after: () => toast('Bom dia! Energia cheia e equipe curada. Jogo salvo.', '#ffe070') };
}
function travel(stop) {
  G.menu = null; Snd.play('bus');
  G.fade = { t: 0, dur: 1.8, bus: true, mid: () => { P.x = stop.x - 10; P.y = stop.y + 18; P.surf = false; S.time += 1; WILD = WILD.filter(w => w.tame); for (const sh of G.world.shrines) sh.pray = null; spawnCompanion(); Cam.x = P.x - V.W / 2; Cam.y = P.y - V.H / 2; G.biome = null; saveGame(); }, after: () => toast('Você chegou em ' + stop.name + '.', '#f2c43a') };
}

// ================= AMBIENTE =================
function ambient(dt) {
  const b = G.biome, night = nightK() > 0.4, x0 = Cam.x, y0 = Cam.y;
  const spawn = (n, fn) => { G.ambAcc = (G.ambAcc || 0) + dt * n; while (G.ambAcc >= 1) { G.ambAcc--; fn(x0 + rand(V.W), y0 + rand(V.H)); } };
  if (b === 'taiga') spawn(40, (x, y) => FX.add({ x, y: y0 - 4, vx: rand(-12, -4), vy: rand(20, 34), life: rand(5, 9), color: pick(['#ffffff', '#e2ecf6']), size: 1 }));
  else if (b === 'bambu') spawn(5, (x, y) => FX.add({ x, y: y0 - 4, vx: rand(4, 14), vy: rand(10, 18), life: rand(8, 12), color: pick(['#ffd0e4', '#f4a8c8']), type: 'leaf' }));
  else if (b === 'savana') spawn(4, (x, y) => FX.add({ x: x0 - 4, y, vx: rand(20, 40), vy: rand(-3, 3), life: rand(6, 12), color: '#e6d27a', size: 1 }));
  else if (b === 'mordor') spawn(8, (x, y) => FX.add({ x, y, vy: rand(-8, -2), life: rand(3, 6), color: pick(['#5a5054', '#8a7a7a']), size: 1 }));
  if (night && (b === 'swamp' || b === 'forest' || b === 'island')) spawn(3, (x, y) => FX.add({ x, y, vx: rand(-6, 6), vy: rand(-6, 6), life: rand(3, 5), color: '#d8ff6a', size: 1, firefly: true }));
}
function nightK() { const h = S ? S.time : 12; if (h >= 7 && h < 17) return 0; if (h >= 19 || h < 5) return 1; if (h >= 17) return (h - 17) / 2; return 1 - (h - 5) / 2; }
function duskK() { const h = S ? S.time : 12; if (h >= 16.5 && h < 19) return 1 - Math.abs(h - 18) / 1.5; if (h >= 5 && h < 7.5) return 1 - Math.abs(h - 6) / 1.5; return 0; }

// ================= MENUS =================
function openMenu(kind, o = {}) { G.menu = { kind, tab: 0, sel: null, ...o }; Snd.play('open'); }
function closeMenu() { G.menu = null; Snd.play('close'); }
