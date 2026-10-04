'use strict';
// ================= EXPANSÃO: CRIATURAS NOVAS (mesmas regras de art.js) =================
CR.pinguelo = (f, pose) => {
  const b = new PB(20, 22), K = ramp('#2e4a7a'), W = ramp('#f2f4f8'), wd = pose === 'walk' ? [0, 1, 0, -1][f] : 0, oy = pose === 'walk' ? [0, -1, 0, -1][f] : 0;
  b.rect(7 + wd, 19, 3, 2, '#f08a2a'); b.rect(11 - wd, 19, 3, 2, '#d0701e');
  b.ell(10, 12 + oy, 5.6, 7, shader(K));
  b.ell(11, 13.4 + oy, 3.6, 5.2, shader(W));
  b.ellR(5.6, 13 + oy, 1.6, 4, 0.25 + (pose === 'idle' && f ? 0.3 : 0), K.s);
  b.ell(11, 6 + oy, 4.2, 3.8, shader(K));
  b.tri(14, 6 + oy, 14, 8 + oy, 18, 7 + oy, '#f2a03a');
  eye(b, 12, 5 + oy, '#1c1424');
  b.set(9, 3 + oy, '#bfe7f6'); b.set(10, 2 + oy, '#bfe7f6');
  return b.outline();
};
CR.imperguim = (f, pose) => {
  const b = new PB(28, 34), K = ramp('#243a64'), W = ramp('#f2f4f8'), I = ramp('#8ad4f4'), wd = pose === 'walk' ? [0, 1, 0, -1][f] : 0, oy = pose === 'walk' ? [0, -1, 0, -1][f] : 0;
  b.rect(10 + wd, 30, 4, 3, '#f08a2a'); b.rect(15 - wd, 30, 4, 3, '#d0701e');
  b.ell(14, 19 + oy, 8.4, 11, shader(K));
  b.ell(15.4, 21 + oy, 5.6, 8.4, shader(W));
  b.ell(16.8, 12 + oy, 2.6, 2.6, '#f2c840');
  b.ellR(6.4, 19 + oy, 2.4, 6.6, 0.25 + (pose === 'idle' && f ? 0.3 : 0), K.s);
  b.ell(15, 8 + oy, 5.4, 4.8, shader(K));
  b.tri(19, 8 + oy, 19, 10 + oy, 25, 9 + oy, '#f2a03a');
  for (const [x, h] of [[11, 5], [14, 7], [17, 5]]) b.tri(x - 1.6, 4 + oy, x + 1.6, 4 + oy, x, 4 + oy - h, (xx) => xx < x ? I.hi : I.m);
  eye(b, 17, 7 + oy, '#1c1424', true);
  return b.outline();
};
CR.tatuzinho = (f, pose) => {
  const b = new PB(26, 17), T = ramp('#b8905a'), oy = bobOf(f, pose);
  legs(b, [7, 9, 15, 17], 12 + oy, 4 - oy, 2, ramp('#8a6a44'), f, pose);
  b.ell(12, 9.6 + oy, 8, 5, (nx, ny, x) => (x % 3 === 0 && ny < 0.5) ? T.s : shader(T)(nx, ny));
  b.ell(20.6, 10.6 + oy, 3, 2.4, shader(ramp('#d8b484')));
  b.tri(22, 10 + oy, 22, 12.4 + oy, 25, 11.6 + oy, '#d8b484'); b.set(24, 11 + oy, '#3a2420');
  b.ell(19.4, 7.4 + oy, 1, 1.6, '#c89a6a'); b.set(4, 11 + oy, T.s); b.set(3, 12 + oy, T.s);
  eye(b, 21, 9 + oy, '#1c1424');
  return b.outline();
};
CR.tatuforte = (f, pose) => {
  const b = new PB(36, 25), T = ramp('#9a7a54'), Rk = ramp('#8a8e98'), oy = bobOf(f, pose);
  legs(b, [9, 12, 21, 24], 17 + oy, 6 - oy, 3, ramp('#6a5034'), f, pose, { foot: ramp('#3a2a20') });
  b.ell(17, 13 + oy, 12, 7.4, (nx, ny, x) => (x % 4 === 0 && ny < 0.5) ? T.d : shader(T)(nx, ny));
  for (let x = 9; x <= 25; x += 4) b.tri(x - 2, 7 + oy, x + 2, 7 + oy, x, 2 + oy, (xx) => xx < x ? Rk.l : Rk.s);
  b.ell(29, 14.6 + oy, 4, 3.4, shader(ramp('#c8a274')));
  b.tri(31, 14 + oy, 31, 17 + oy, 35, 16 + oy, '#c8a274'); b.set(34, 15 + oy, '#3a2420');
  b.ell(27, 10.4 + oy, 1.2, 2, '#b08a5e');
  eye(b, 30, 13 + oy, '#1c1424');
  return b.outline();
};
CR.girinho = (f, pose) => {
  const b = new PB(20, 13), G = ramp('#4a7a5a'), w = [0, 1, 0, -1][f % 4];
  b.thick([[9, 7], [5, 6 + w], [1, 7 - w]], t => 1.6 - t * 1.2, t => t > 0.6 ? G.l : G.m);
  b.ell(12, 7, 5, 4, shader(G, { belly: ramp('#c8d8a0'), bellyY: 0.4 }));
  eye(b, 14, 5, '#1c1424', true); b.set(15, 4, '#f2f0a0');
  return b.outline();
};
CR.sapolodo = (f, pose) => {
  const b = new PB(26, 19), G = ramp('#5a8a3a'), hop = pose === 'walk' ? [0, -2, -3, -1][f] : 0;
  b.ell(8, 15 + hop * 0.3, 4, 2.6, G.s); b.rect(4, 16, 4, 2, G.d);
  b.ell(13, 11 + hop, 8, 5.4, shader(G, { belly: ramp('#d8e0a0'), bellyY: 0.3, bellyX: 0.3 }));
  [[10, 9], [14, 10], [8, 12]].forEach(([x, y]) => b.set(x, y + hop, '#3a5a24'));
  b.rect(16, 14 + hop, 3, 4 - hop, G.m); b.rect(16, 17, 4, 1, G.s);
  b.ell(17, 5.6 + hop, 2.6, 2.6, shader(G)); b.ell(13, 5.8 + hop, 2.4, 2.4, G.s);
  eye(b, 17, 5 + hop, '#1c1424', true); b.set(13, 5 + hop, '#1c1424');
  b.line(17, 12 + hop, 21, 11 + hop, '#2e4a24');
  return b.outline();
};
CR.sapodrago = (f, pose) => {
  const b = new PB(40, 32), G = ramp('#3e7a4a'), P = ramp('#8a4ac8'), oy = bobOf(f, pose);
  b.thick([[10, 22 + oy], [5, 20 + oy], [2, 24 + oy]], t => 2.6 - t * 2, G.s);
  legs(b, [12, 15, 24, 27], 22 + oy, 7 - oy, 3, G, f, pose, { foot: ramp('#24482c') });
  b.ell(19, 18 + oy, 11, 7.4, shader(G, { belly: ramp('#d8e0a0'), bellyY: 0.35 }));
  for (let x = 11; x <= 25; x += 3) b.tri(x - 1.4, 11.4 + oy, x + 1.4, 11.4 + oy, x, 7 + oy, (xx) => xx < x ? P.l : P.m);
  b.ell(30.6, 13 + oy, 6, 4.6, shader(G));
  b.line(32, 16 + oy, 37, 15 + oy, '#24482c');
  b.thick([[28, 9 + oy], [26, 4 + oy], [27, 1 + oy]], 0.7, '#e8dcc0'); b.thick([[32, 9 + oy], [33, 4 + oy], [35, 2 + oy]], 0.7, '#c8bca0');
  eye(b, 32, 11 + oy, '#1c1424', true); b.set(33, 11 + oy, '#ffd040');
  return b.outline();
};
CR.petalis = (f, pose) => {
  const b = new PB(24, 24), P = ramp('#f4a8c8'), fl = [0, 1, 2, 1][f % 4], oy = pose === 'walk' ? [0, -1, -2, -1][f] : (f ? -1 : 0);
  b.ellR(7, 9 + oy, 5.4, 3 - fl * 0.6, -0.6, (u, v) => v < 0 ? P.hi : P.l); b.ellR(7, 14 + oy, 4.6, 2.4 - fl * 0.4, 0.5, P.m);
  b.ell(13, 13 + oy, 3, 5, shader(ramp('#7ac868')));
  b.ell(13.6, 7 + oy, 3.4, 3.2, shader(ramp('#fbe6ee')));
  b.ellR(16, 9 + oy, 4.6, 2.6 - fl * 0.5, 0.6, (u, v) => v < 0 ? P.l : P.s);
  b.line(14, 4 + oy, 12, 1 + oy, '#5a8a3a'); b.set(11, 1 + oy, '#ffd0e4');
  eye(b, 15, 6 + oy, '#1c1424'); b.set(13, 21, '#7ac868'); b.set(13, 20 + oy, '#7ac868');
  return b.outline();
};
CR.caranguarda = (f, pose) => {
  const b = new PB(30, 20), Rr = ramp('#d8483a'), oy = bobOf(f, pose), lg = pose === 'walk' ? f % 2 : 0;
  for (let i = 0; i < 3; i++) { b.line(9 - i * 2, 13 + oy, 6 - i * 2, 18 - lg, Rr.s); b.line(19 + i * 2, 13 + oy, 22 + i * 2, 18 - (1 - lg), Rr.d); }
  b.ell(15, 11 + oy, 8.6, 5, shader(Rr));
  [[11, 9], [15, 8], [19, 9]].forEach(([x, y]) => b.set(x, y + oy, '#ffd8c8'));
  b.thick([[8, 10 + oy], [4, 6 + oy]], 1, Rr.m); b.ell(3.4, 4.4 + oy, 2.6, 2.2, shader(Rr)); b.set(2, 2 + oy, Rr.d);
  b.thick([[22, 10 + oy], [26, 6 + oy]], 1, Rr.m); b.ell(26.6, 4.4 + oy, 2.6, 2.2, shader(Rr)); b.set(28, 2 + oy, Rr.d);
  b.line(13, 6 + oy, 13, 4 + oy, Rr.s); b.line(17, 6 + oy, 17, 4 + oy, Rr.s); b.set(13, 3 + oy, '#1c1424'); b.set(17, 3 + oy, '#1c1424');
  return b.outline();
};
CR.cinzim = (f, pose) => {
  const b = new PB(20, 22), K = ramp('#4a4450'), oy = pose === 'walk' ? [0, -1, -2, -1][f] : (f ? -1 : 0);
  b.ell(10, 13 + oy, 6.4, 6.6, (nx, ny, x, y) => (Math.abs(nx - 0.1) < 0.08 && ny > -0.2) ? '#f07a22' : shader(K)(nx, ny));
  b.tri(5, 8 + oy, 7, 7 + oy, 4, 2 + oy, K.s); b.tri(13, 7 + oy, 15, 8 + oy, 16, 2 + oy, K.m);
  b.set(8, 11 + oy, '#ffb040'); b.set(12, 11 + oy, '#ffb040'); b.set(8, 12 + oy, '#c8321e'); b.set(12, 12 + oy, '#c8321e');
  b.rect(6, 19, 2, 2, K.d); b.rect(12, 19, 2, 2, K.s);
  return b.outline();
};
CR.cinzarrao = (f, pose) => {
  const b = new PB(44, 42), K = ramp('#3e3844'), oy = bobOf(f, pose);
  legs(b, [11, 15, 27, 31], 29 + oy, 10 - oy, 4, K, f, pose, { foot: ramp('#241e28') });
  b.ell(21, 23 + oy, 14, 10, (nx, ny, x, y) => (Math.abs(Math.sin(x * 0.7 + y * 0.4)) < 0.12 && ny < 0.6) ? '#f07a22' : shader(K)(nx, ny));
  b.ell(34, 15 + oy, 6.4, 5.6, shader(K));
  b.thick([[30, 11 + oy], [26, 5 + oy], [27, 1 + oy]], t => 1.3 - t * 0.7, '#5a5260'); b.thick([[37, 11 + oy], [40, 5 + oy], [38, 1 + oy]], t => 1.3 - t * 0.7, '#5a5260');
  b.rect(35, 13 + oy, 3, 2, '#ffb040'); b.set(36, 13 + oy, '#fff0a0');
  b.rect(36, 18 + oy, 5, 1, '#c8321e');
  return b.outline();
};
CR.brasombra = (f, pose) => {
  const b = new PB(38, 26), K = ramp('#2e2836'), oy = bobOf(f, pose);
  b.thick([[9, 14 + oy], [4, 10 + oy], [2, 5 + oy]], t => 1.6 - t, t => t > 0.6 ? '#b06ae8' : K.m);
  legs(b, [11, 13, 23, 25], 16 + oy, 7 - oy, 2, K, f, pose, { foot: ramp('#1a1420') });
  b.ell(18, 13 + oy, 9.4, 4.4, shader(K));
  b.ell(26, 9 + oy, 6, 6, (nx, ny, x, y) => { const k = Math.hypot(nx, ny) + (hash2(x, y + f, 5) - 0.5) * 0.3; return k > 0.8 ? '#5a2a8a' : k > 0.5 ? '#9a4ad8' : '#d8a0ff'; });
  b.ell(29, 10 + oy, 3.6, 3, shader(K));
  b.ell(32.4, 11.4 + oy, 2.4, 1.4, K.l); b.set(34, 11 + oy, '#100c14');
  b.set(30, 9 + oy, '#d8a0ff'); b.set(31, 9 + oy, '#ffffff');
  return b.outline();
};
CR.guardiao = (f, pose) => {
  const b = new PB(64, 60), S = ramp('#5a5460'), oy = bobOf(f, pose), lava = (nx, ny, x, y) => (Math.abs(Math.sin(x * 0.45 + y * 0.31)) < 0.09) ? (y % 2 ? '#ffb040' : '#f07a22') : null;
  legs(b, [16, 21, 38, 43], 42 + oy, 15 - oy, 6, S, f, pose, { foot: ramp('#2e2a32') });
  b.ell(31, 32 + oy, 20, 14, (nx, ny, x, y) => lava(nx, ny, x, y) || shader(S)(nx, ny));
  b.ell(22, 22 + oy, 9, 7, shader(S)); b.ell(40, 22 + oy, 9, 7, shader(S));
  b.ell(50, 26 + oy, 8, 7, (nx, ny, x, y) => lava(nx, ny, x, y) || shader(S)(nx, ny));
  b.rect(52, 24 + oy, 6, 2, '#ffd040'); b.set(55, 24 + oy, '#ffffff'); b.rect(51, 29 + oy, 7, 1, '#c8321e');
  b.thick([[47, 20 + oy], [44, 10 + oy], [46, 3 + oy]], t => 2 - t * 1.4, '#2e2a32'); b.thick([[54, 20 + oy], [58, 11 + oy], [56, 4 + oy]], t => 2 - t * 1.4, '#2e2a32');
  for (const [x, y] of [[20, 14], [30, 15], [40, 14]]) b.tri(x - 3, y + 4 + oy, x + 3, y + 4 + oy, x, y - 3 + oy, '#7a3ac8');
  return b.outline();
};
// ícones novos
ICON_ASCII.cristal = { rows: ['..P..', '.PWp.', 'PPWpp', 'PPPpp', '.Ppp.', '..p..'], pal: { P: '#c890ff', p: '#7a3ac8', W: '#ffffff' } };
ICON_ASCII.superesfera = { rows: ['..PPPP..', '.PpPPPp.', 'PPLLLLPp', 'LLLWWLLL', 'BBLLLLBb', 'BBBBBBBb', '.BBBBBb.', '..bbbb..'], pal: { P: '#c890ff', p: '#7a3ac8', L: '#3a2a4a', W: '#fff0a0', B: '#f2e6c8', b: '#c8b890' } };
ICON_ASCII.amuleto = { rows: ['.L...L.', '..L.L..', '...L...', '..ORO..', '.ORYRO.', '..ORO..', '...O...'], pal: { L: '#c8a060', O: '#c8321e', R: '#f07a22', Y: '#ffd25a' } };
ICON_ASCII.mel = { rows: ['..WW..', '.YYYY.', 'YyYYYy', 'YYYYyy', '.yyyy.'], pal: { W: '#e8dcc0', Y: '#f2b830', y: '#c8861a' } };
