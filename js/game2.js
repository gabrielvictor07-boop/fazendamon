'use strict';
// ================= EXPANSÃO: GUARDIÃO DO ERMO (chefe que libera o "hardmode") =================
// Fica na fronteira entre o mundo e o Ermo Cinzento, no caminho da Vila Raiz até o Ermo.
function guardianSpot() {
  const W = G.world, a = BIOMES.forest, b = BIOMES.mordor, L = Math.hypot(b.cx - a.cx, b.cy - a.cy);
  for (let d = 0; d < L; d += 6) {
    const x = a.cx + (b.cx - a.cx) * d / L, y = a.cy + (b.cy - a.cy) * d / L;
    if (W.ground(x, y) === 'land' && W.cellB(x, y) === 'mordor') {
      for (let back = 40; back < 200; back += 6) { const bx2 = a.cx + (b.cx - a.cx) * (d - back) / L, by2 = a.cy + (b.cy - a.cy) * (d - back) / L; if (W.ground(bx2, by2) === 'land' && W.cellB(bx2, by2) !== 'mordor') return { x: bx2, y: by2 }; }
    }
  }
  return { x: b.cx - 300, y: b.cy - 300 };
}
function updateBoss(dt) {
  if (S.flags.hardmode || !G.gpos) return;
  if (G.boss && !WILD.includes(G.boss)) G.boss = null;
  if (!G.boss) {
    if (dist(P.x, P.y, G.gpos.x, G.gpos.y) < 360) {
      const w = makeWild('guardiao', 8, G.gpos.x, G.gpos.y); w.stompT = 4; WILD.push(w); G.boss = w;
      G.banner = { s: 'Guardião do Ermo', t: 0 }; Snd.play('god'); shake(0.4);
    }
    return;
  }
  const w = G.boss;
  if (dist(w.x, w.y, G.gpos.x, G.gpos.y) > 140) { const a = Math.atan2(G.gpos.y - w.y, G.gpos.x - w.x); w.x += Math.cos(a) * 40 * dt; w.y += Math.sin(a) * 40 * dt; }
  if (w.state === 'fight' && !w.ko) {
    w.stompT -= dt;
    if (w.stompT < 0.8 && !w.warned) { w.warned = true; FX.text(w.x, w.y - 64, 'TERREMOTO!', '#ff7a4a', 9); Snd.play('fail'); }
    if (w.stompT <= 0) {
      w.stompT = 5; w.warned = false; shake(0.6); Snd.play('rock');
      FX.add({ type: 'ring', x: w.x, y: w.y, r0: 6, r1: 80, life: 0.6, color: '#ffb040' });
      FX.burst(w.x, w.y, 30, { speed: [40, 120], life: [0.4, 0.9], color: ['#5a5460', '#f07a22', '#3a3440'], vz: [30, 80], g: 200 });
      if (C && dist(C.x, C.y, w.x, w.y) < 80) hit('guardiao', atkOf(w) * 1.3, C, 'wild', true, w);
      if (dist(P.x, P.y, w.x, w.y) < 80) hurtPlayer(w);
    }
  }
}
function defeatBoss(w) {
  w.caught = true; w.ko = true; G.boss = null;
  S.flags.hardmode = true; BIOMES.mordor.spawn = BIOMES.mordor.hardSpawn;
  shake(1); Snd.play('evolve');
  for (let i = 0; i < 4; i++) FX.burst(w.x + rand(-20, 20), w.y - rand(10, 40), 20, { speed: [40, 140], life: [0.6, 1.4], color: ['#ffb040', '#c890ff', '#ffffff', '#5a5460'], vz: [40, 110], g: 150, drag: 1.5 });
  if (C) gainXp(C.m, 300);
  for (const m of S.team) if (!C || m !== C.m) gainXp(m, 90, true);
  S.inv.cristal += 3; S.inv.superesfera += 2;
  toast('+3 Cristais Sombrios, +2 Super Esferas', '#c890ff');
  say('Verdan, o Deus-Semente', [
    'Você conseguiu! O Guardião caiu e a névoa cinzenta está se abrindo...',
    'O Ermo Cinzento agora está aberto. Criaturas sombrias moram lá, e elas são muito mais fortes.',
    'Daqui pra frente, todas as criaturas de Verdália ficaram mais fortes também. Prepare sua equipe.',
    'Nas pedras escuras do Ermo existem Cristais Sombrios. Com eles você cria Super Esferas e o Amuleto de Brasa.',
  ], () => saveGame());
}
function drawBossBar() {
  const w = G.boss; if (!w || S.flags.hardmode || dist(w.x, w.y, P.x, P.y) > 320) return;
  uiBegin(); const bw = Math.min(220, V.W - 40), x = R(V.W / 2 - bw / 2), y = V.H - 52;
  text('Guardião do Ermo', V.W / 2, y - 11, { size: 8, align: 'center', bold: true, color: '#ffb040' });
  bar(x, y, bw, 5, w.hp / w.max, '#e8443a');
}
