'use strict';
// ================= EXPANSÃO: Ermo Cinzento, 12 criaturas novas, chefe, cristais =================
TYPES.sombrio = { n: 'Sombrio', c: '#9a6ac8' };
STRONG.sombrio = ['coral', 'eletrico'];
STRONG.lutador.push('sombrio');
STRONG.agua.push('sombrio');

Object.assign(SPECIES, {
  pinguelo: { n: 'Pinguelo', t: 'gelo', hp: 40, atk: 9, spd: 1.05, ab: ['pelagem'], evo: { to: 'imperguim', lv: 11 }, temp: 'timido', catch: 0.5, ranged: true, move: 'Bico Gelado', h: 18,
    desc: 'Pinguim da taiga que escorrega de barriga pelo gelo. Adora peixe e odeia calor.' },
  imperguim: { n: 'Imperguim', t: 'gelo', hp: 72, atk: 15, spd: 1, ab: ['pelagem', 'forca'], temp: 'calmo', catch: 0.22, move: 'Coroa de Gelo', h: 30,
    desc: 'O imperador da taiga. A coroa de gelo nunca derrete, nem perto do fogo.' },
  tatuzinho: { n: 'Tatuzinho', t: 'lutador', hp: 42, atk: 8, spd: 1, ab: ['forca'], evo: { to: 'tatuforte', lv: 10 }, temp: 'timido', catch: 0.55, move: 'Rolamento', h: 12,
    desc: 'Tatu da savana. Quando se assusta, vira uma bolinha e sai rolando.' },
  tatuforte: { n: 'Tatuforte', t: 'lutador', hp: 80, atk: 14, spd: 0.9, ab: ['forca', 'corrida'], temp: 'calmo', catch: 0.25, move: 'Casco de Pedra', h: 20,
    desc: 'O casco endureceu até virar rocha. Abre caminho por qualquer pedreira.' },
  girinho: { n: 'Girinho', t: 'agua', hp: 30, atk: 7, spd: 1.2, ab: [], evo: { to: 'sapolodo', lv: 5 }, temp: 'timido', catch: 0.7, ranged: true, move: 'Bolha', h: 9,
    desc: 'Girino do brejo. Ninguém acredita no que ele vai virar.' },
  sapolodo: { n: 'Sapolodo', t: 'agua', hp: 50, atk: 11, spd: 1.05, ab: ['crescer'], evo: { to: 'sapodrago', lv: 13 }, temp: 'calmo', catch: 0.4, ranged: true, move: 'Língua Pegajosa', h: 14,
    desc: 'Sapo gordinho que vive na lama. Por onde passa, as plantas crescem.' },
  sapodrago: { n: 'Sapodrago', t: 'agua', hp: 92, atk: 18, spd: 1, ab: ['crescer', 'surf', 'forca'], temp: 'agressivo', catch: 0.15, ranged: true, move: 'Rugido do Pântano', h: 26,
    desc: 'Metade sapo, metade dragão. O rei absoluto do pântano.' },
  petalis: { n: 'Pétalis', t: 'planta', hp: 36, atk: 11, spd: 1.25, ab: ['cura', 'cortar'], temp: 'timido', catch: 0.35, ranged: true, move: 'Chuva de Pétalas', h: 20,
    desc: 'Fada das cerejeiras do bambuzal. Só aparece quando as flores caem.' },
  caranguarda: { n: 'Caranguarda', t: 'agua', hp: 62, atk: 13, spd: 0.95, ab: ['surf', 'forca'], temp: 'agressivo', catch: 0.3, move: 'Pinça Dupla', h: 14,
    desc: 'Caranguejo das ilhas que guarda as praias como um soldado.' },
  cinzim: { n: 'Cinzim', t: 'sombrio', hp: 44, atk: 13, spd: 1.2, ab: ['acender'], evo: { to: 'cinzarrao', lv: 18 }, temp: 'agressivo', catch: 0.4, ranged: true, move: 'Brasa Sombria', h: 16,
    desc: 'Diabinho de cinzas do Ermo. Nasceu da névoa cinzenta.' },
  cinzarrao: { n: 'Cinzarrão', t: 'sombrio', hp: 110, atk: 21, spd: 0.9, ab: ['acender', 'aquecer', 'forca'], temp: 'agressivo', catch: 0.12, move: 'Erupção', h: 34,
    desc: 'Fera gigante feita de cinza e lava. Dizem que ele nunca dorme.' },
  brasombra: { n: 'Brasombra', t: 'sombrio', hp: 76, atk: 19, spd: 1.3, ab: ['luz', 'corrida', 'aquecer'], temp: 'agressivo', catch: 0.18, ranged: true, move: 'Chama Roxa', h: 20,
    desc: 'Lobo da sombra com uma juba de fogo roxo. Caça em bando.' },
  guardiao: { n: 'Guardião do Ermo', t: 'sombrio', hp: 520, atk: 20, spd: 0.75, ab: [], temp: 'agressivo', catch: 0, move: 'Terremoto', h: 52, boss: true,
    desc: 'O colosso que segura a névoa cinzenta.' },
});
DEX_ORDER.push('pinguelo', 'imperguim', 'tatuzinho', 'tatuforte', 'girinho', 'sapolodo', 'sapodrago', 'petalis', 'caranguarda', 'cinzim', 'cinzarrao', 'brasombra');

Object.assign(BIOMES.taiga.spawn, { pinguelo: 4, imperguim: 0.4 });
Object.assign(BIOMES.savana.spawn, { tatuzinho: 4, tatuforte: 0.4 });
Object.assign(BIOMES.swamp.spawn, { girinho: 4, sapolodo: 1.2, sapodrago: 0.15 });
Object.assign(BIOMES.bambu.spawn, { petalis: 2 });
Object.assign(BIOMES.island.spawn, { caranguarda: 3 });
BIOMES.mordor.lv = [14, 19];
BIOMES.mordor.hardSpawn = { cinzim: 5, brasombra: 2.5, cinzarrao: 0.5 };

RECIPES.push(
  { id: 'superesfera', n: 'Super Esfera x2', d: 'Captura muito mais fácil (tecla G)', cost: { madeira: 1, pedra: 1, cristal: 1 }, give: { superesfera: 2 } },
  { id: 'amuleto', n: 'Amuleto de Brasa', d: 'Você nunca mais sente frio', cost: { cristal: 2, pedra: 3 }, give: { amuleto: 1 }, once: true },
);
Object.assign(ITEM_NAMES, { cristal: 'Cristal Sombrio', superesfera: 'Super Esfera', amuleto: 'Amuleto' });

// missões novas entram antes de "registrar todas"
QUESTS.pop();
QUESTS.push(
  { n: 'Capture 10 criaturas', hint: 'Cada bioma tem criaturas novas pra achar', check: s => s.stats.caught >= 10 },
  { n: 'Derrote o Guardião do Ermo', hint: 'Ele bloqueia a entrada do Ermo Cinzento (sudeste). Leve uma equipe forte!', check: s => s.flags.hardmode },
  { n: 'Entre no Ermo Cinzento', hint: 'A névoa sumiu. Agora dá pra entrar', check: s => s.flags.ermo },
  { n: 'Minere 3 Cristais Sombrios', hint: 'Pedras escuras do Ermo. Precisa de Força', check: s => s.stats.cristais >= 3 },
  { n: 'Crie uma Super Esfera', hint: 'Madeira + pedra + cristal (tecla C)', check: s => s.inv.superesfera > 0 || s.stats.supers > 0 },
  { n: 'Capture um Cinzarrão', hint: 'A fera mais forte do Ermo. Use a Super Esfera (G)', check: s => s.dex.cinzarrao === 2 },
  { n: 'Registre todas as ' + DEX_ORDER.length + ' criaturas', hint: 'Veja o Criadex (TAB)', check: s => DEX_ORDER.every(k => s.dex[k] === 2) },
);
