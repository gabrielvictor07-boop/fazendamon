'use strict';
// ================= TIPOS =================
const TYPES = {
  eletrico: { n: 'Elétrico', c: '#f2c02c' }, planta: { n: 'Planta', c: '#6cc04a' }, fogo: { n: 'Fogo', c: '#f06a2a' },
  agua: { n: 'Água', c: '#3a9ae0' }, gelo: { n: 'Gelo', c: '#9ad8f0' }, lutador: { n: 'Lutador', c: '#c8a060' }, coral: { n: 'Coral', c: '#f07890' },
};
const STRONG = { eletrico: ['agua'], planta: ['agua', 'lutador'], fogo: ['planta', 'gelo'], agua: ['fogo'], gelo: ['planta', 'eletrico'], lutador: ['gelo'], coral: ['fogo', 'lutador'] };
function typeMult(a, d) { if (STRONG[a] && STRONG[a].includes(d)) return 1.5; if (STRONG[d] && STRONG[d].includes(a)) return 0.7; return 1; }

// ================= HABILIDADES (o que dá pra fazer com a criatura fora da luta) =================
const ABIL = {
  acender: { n: 'Acender', d: 'Acende fogueiras' },
  luz: { n: 'Luz', d: 'Ilumina o caminho à noite' },
  cortar: { n: 'Cortar', d: 'Corta árvores e bambu (madeira)' },
  crescer: { n: 'Crescer', d: 'Faz arbustos darem frutas na hora' },
  aquecer: { n: 'Aquecer', d: 'Você não sente frio' },
  pelagem: { n: 'Pelagem', d: 'Você não sente frio' },
  surf: { n: 'Surf', d: 'Leva você pela água até as ilhas' },
  forca: { n: 'Força', d: 'Quebra pedras grandes (pedra)' },
  cura: { n: 'Cura', d: 'Cura a equipe aos poucos' },
  corrida: { n: 'Corrida', d: 'Você anda mais rápido' },
};

// ================= CRIATURAS =================
// hp/atk = base; spd = ritmo de ataque; temp = temperamento selvagem; catch = facilidade de captura
const SPECIES = {
  faisca: { n: 'Faísca', t: 'eletrico', hp: 34, atk: 9, spd: 1.15, ab: ['acender', 'luz'], evo: { to: 'relampago', lv: 8 }, temp: 'timido', catch: 0.55, ranged: true, move: 'Choquinho', h: 14,
    desc: 'Roedor elétrico que faísca quando fica feliz. Foi a primeira criatura a te encontrar.' },
  relampago: { n: 'Relâmpago', t: 'eletrico', hp: 58, atk: 15, spd: 1.3, ab: ['acender', 'luz', 'corrida'], temp: 'agressivo', catch: 0.22, ranged: true, move: 'Trovão', h: 22,
    desc: 'A forma adulta do Faísca. Corre tão rápido que deixa um rastro de estática.' },
  brotinho: { n: 'Brotinho', t: 'planta', hp: 38, atk: 8, spd: 1, ab: ['cortar'], evo: { to: 'folhagrande', lv: 6 }, temp: 'timido', catch: 0.6, ranged: true, move: 'Folha Navalha', h: 16,
    desc: 'Filhote de cervo com um broto na cabeça. As orelhas são folhas de verdade.' },
  folhagrande: { n: 'Folhagrande', t: 'planta', hp: 60, atk: 12, spd: 1, ab: ['cortar', 'crescer'], evo: { to: 'carvalhao', lv: 12 }, temp: 'calmo', catch: 0.35, move: 'Chifrada Verde', h: 26,
    desc: 'Os chifres dão folhas na primavera. Faz frutas brotarem por onde passa.' },
  carvalhao: { n: 'Carvalhão', t: 'planta', hp: 96, atk: 17, spd: 0.85, ab: ['cortar', 'crescer', 'forca'], temp: 'calmo', catch: 0.16, move: 'Raiz Ancestral', h: 34,
    desc: 'Guardião antigo da floresta. Dizem que carrega um pomar inteiro na cabeça.' },
  brasinha: { n: 'Brasinha', t: 'fogo', hp: 36, atk: 10, spd: 1.2, ab: ['acender', 'aquecer'], evo: { to: 'fogareu', lv: 9 }, temp: 'timido', catch: 0.5, ranged: true, move: 'Brasa', h: 14,
    desc: 'Raposinha da savana com uma chama no lugar do rabo. Ótima companhia no frio.' },
  fogareu: { n: 'Fogaréu', t: 'fogo', hp: 74, atk: 17, spd: 1.1, ab: ['acender', 'aquecer', 'forca'], temp: 'agressivo', catch: 0.2, move: 'Juba Flamejante', h: 26,
    desc: 'Leão de juba em chamas. Protege a savana e não gosta de visitas.' },
  lontragua: { n: 'Lontrágua', t: 'agua', hp: 48, atk: 10, spd: 1.1, ab: ['surf'], temp: 'timido', catch: 0.45, ranged: true, move: "Jato d'Água", h: 12,
    desc: 'Lontra dos brejos. Nada tão bem que carrega gente nas costas.' },
  nevisco: { n: 'Nevisco', t: 'gelo', hp: 44, atk: 11, spd: 1.05, ab: ['pelagem'], temp: 'calmo', catch: 0.45, ranged: true, move: 'Vento Gélido', h: 22,
    desc: 'Coruja da taiga. As penas guardam tanto calor que aquecem quem está perto.' },
  bambule: { n: 'Bambulê', t: 'lutador', hp: 64, atk: 13, spd: 0.95, ab: ['forca', 'cortar'], temp: 'calmo', catch: 0.38, move: 'Golpe de Bambu', h: 24,
    desc: 'Monge do bambuzal. Medita o dia todo e quebra pedra com uma patada.' },
  coralume: { n: 'Coralume', t: 'coral', hp: 56, atk: 12, spd: 0.9, ab: ['surf', 'cura'], temp: 'timido', catch: 0.32, ranged: true, move: 'Pulso de Coral', h: 16,
    desc: 'Tartaruga das ilhas. O coral das costas brilha e cura quem está perto.' },
};
const DEX_ORDER = ['faisca', 'relampago', 'brotinho', 'folhagrande', 'carvalhao', 'brasinha', 'fogareu', 'lontragua', 'nevisco', 'bambule', 'coralume'];

// ================= BIOMAS =================
// cx/cy = centro no mundo; lv = nível dos selvagens; spawn = espécie: peso
const BIOMES = {
  forest: { id: 1, n: 'Floresta Verdejante', cx: 1900, cy: 1500, lv: [2, 5], spawn: { brotinho: 5, faisca: 3, folhagrande: 1, relampago: 0.25, carvalhao: 0.2 }, music: [220, [0, 2, 4, 7, 9]] },
  savana: { id: 2, n: 'Savana Dourada', cx: 3050, cy: 1420, lv: [4, 8], spawn: { brasinha: 6, faisca: 1.4, fogareu: 0.5 }, music: [196, [0, 3, 5, 7, 10]] },
  taiga: { id: 3, n: 'Taiga Gelada', cx: 1900, cy: 580, lv: [6, 10], spawn: { nevisco: 6, relampago: 0.3 }, music: [247, [0, 2, 3, 7, 8]] },
  bambu: { id: 4, n: 'Montes do Bambuzal', cx: 740, cy: 1380, lv: [5, 9], spawn: { bambule: 6, brotinho: 2 }, music: [262, [0, 2, 5, 7, 9]] },
  swamp: { id: 5, n: 'Pântano Sussurrante', cx: 1300, cy: 2420, lv: [3, 7], spawn: { lontragua: 6, brotinho: 1.8, folhagrande: 0.4 }, music: [185, [0, 3, 5, 6, 10]] },
  mordor: { id: 6, n: 'Ermo Cinzento', cx: 2750, cy: 2330, lv: [0, 0], spawn: {}, music: [110, [0, 1, 5, 6, 10]] },
  island: { id: 7, n: 'Ilhas de Coral', cx: 0, cy: 0, lv: [9, 13], spawn: { coralume: 6, lontragua: 1 }, music: [294, [0, 2, 4, 7, 9]] },
};
const BIOME_BY_ID = {}; for (const k in BIOMES) BIOME_BY_ID[BIOMES[k].id] = k;
const ISLANDS = [{ x: 3730, y: 330, r: 210 }, { x: 230, y: 2720, r: 200 }, { x: 3800, y: 2330, r: 150 }];

// ================= VILAS (cada uma com sua história) =================
const VILLAGES = {
  forest: { n: 'Vila Raiz', npc: 'Anciã Moema', lines: [
    'Então você é a pessoa que o Deus-Semente chamou. Eu sonhei com você.',
    'Verdália está adoecendo. Uma névoa cinza sobe do Ermo Cinzento, lá no sudeste, e seca tudo o que toca.',
    'Cada bioma tem um santuário onde as criaturas rezam pela natureza. Visite todos, é assim que se escuta o Deus.',
    'Use as criaturas pra tudo: cortar lenha, acender fogo, atravessar o mar. Ninguém aqui anda armado.',
  ] },
  savana: { n: 'Aldeia Sol-Poente', npc: 'Guardiã Zuri', lines: [
    'Bem-vindo à Sol-Poente. Aqui o sol se põe duas vezes mais bonito.',
    'Os Fogaréus guardam esta savana há gerações. Se um rugir pra você, não corra. Respeite.',
    'Desde que a névoa cinza apareceu, as chuvas sumiram. Os poços estão quase secos.',
    'Se for pra Taiga, leve um Brasinha. O frio de lá não perdoa ninguém.',
  ] },
  taiga: { n: 'Posto Geada', npc: 'Velho Iuri', lines: [
    'Feche a porta, a neve entra! Ha, brincadeira. Aqui fora não tem porta.',
    'Sem uma criatura de fogo, ou um Nevisco do seu lado, você congela em minutos.',
    'Fogueiras te esquentam e devolvem energia. Faça uma com madeira e pedra (tecla C).',
    'Os Neviscos guiam viajantes perdidos na nevasca. Eu devo minha vida a um deles.',
  ] },
  bambu: { n: 'Templo das Mil Folhas', npc: 'Mestra Lin', lines: [
    'O bambu se curva ao vento, mas não quebra. Lembre disso nas lutas.',
    'Os Bambulês meditam no santuário ao amanhecer. Quebram pedras com uma patada, mas não fazem mal a ninguém.',
    'Nossa montanha guarda o caminho antigo pro Ermo. Ninguém volta de lá desde que a névoa chegou.',
    'Disciplina, viajante. Treine suas criaturas e elas vão evoluir.',
  ] },
  swamp: { n: 'Palafitas do Brejo', npc: 'Barqueira Nanã', lines: [
    'Ô de casa! Chegou na hora do caldo. Senta aí.',
    'Eu não preciso de barco: as Lontráguas me levam pra todo canto. Com uma delas você também atravessa o mar.',
    'Lá longe, no mar, tem ilhas de coral que brilham de noite. Criaturas que ninguém daqui conhece.',
    'De noite o brejo fica cheio de vaga-lumes. Mas cuidado com o escuro: leve luz.',
  ] },
};

// ================= RECEITAS (tecla C) =================
const RECIPES = [
  { id: 'esfera', n: 'Esfera de Captura x2', d: 'Pra capturar criaturas', cost: { madeira: 1, pedra: 1 }, give: { esfera: 2 } },
  { id: 'racao', n: 'Ração', d: 'Cura 60% da criatura ativa (tecla H)', cost: { fruta: 2 }, give: { racao: 1 } },
  { id: 'fogueira', n: 'Fogueira', d: 'Coloque com B. Esquenta e recupera energia', cost: { madeira: 4, pedra: 2 }, give: { fogueira: 1 } },
  { id: 'tocha', n: 'Tocha', d: 'Ilumina mais à noite (permanente)', cost: { madeira: 3, fruta: 1 }, give: { tocha: 1 }, once: true },
];
const ITEM_NAMES = { madeira: 'Madeira', pedra: 'Pedra', fruta: 'Fruta', esfera: 'Esfera', racao: 'Ração', fogueira: 'Fogueira', tocha: 'Tocha' };

// ================= MISSÕES (em sequência) =================
const QUESTS = [
  { n: 'Fale com o morador da vila', hint: 'Chegue perto do morador e aperte E', check: s => s.flags.talked },
  { n: 'Junte 2 galhos e 2 pedrinhas', hint: 'Galhos e pedrinhas ficam no chão. Aperte E', check: s => s.stats.sticks >= 2 && s.stats.pebbles >= 2 },
  { n: 'Crie esferas de captura', hint: 'Aperte C e crie Esfera de Captura', check: s => s.stats.crafted >= 1 },
  { n: 'Capture sua primeira criatura', hint: 'Clique numa criatura pra lutar, depois Q pra jogar a esfera', check: s => s.stats.caught >= 1 },
  { n: 'Reze no santuário do seu bioma', hint: 'Abra o mapa (M). O santuário fica perto da vila', check: s => s.shrines.length >= 1 },
  { n: 'Descubra 3 pontos de ônibus', hint: 'Cada vila tem um. Use pra viajar rápido', check: s => s.stops.length >= 3 },
  { n: 'Evolua uma criatura', hint: 'Lute e ganhe níveis. Brotinho evolui no nível 6', check: s => s.stats.evolved >= 1 },
  { n: 'Chegue numa Ilha de Coral', hint: 'Capture uma Lontrágua no pântano e entre na água', check: s => s.flags.island },
  { n: 'Registre todas as 11 criaturas', hint: 'Veja o Criadex (TAB)', check: s => DEX_ORDER.every(k => s.dex[k] === 2) },
];

// ================= ABERTURA: as perguntas do Deus =================
const GOD_QUESTIONS = [
  { q: 'Antes de tudo... qual é a sua comida favorita?', a: [['Frutas e pão de queijo', 'forest'], ['Churrasco na brasa', 'savana'], ['Sopa bem quentinha', 'taiga'], ['Lámen com bolinho', 'bambu'], ['Moqueca de peixe', 'swamp']] },
  { q: 'Onde você se sente em paz?', a: [['Debaixo de uma árvore', 'forest'], ['Sob o sol forte', 'savana'], ['Na neve silenciosa', 'taiga'], ['No alto de uma montanha', 'bambu'], ['Ouvindo a chuva', 'swamp']] },
  { q: 'E o que você mais valoriza?', a: [['Amizade', 'forest'], ['Coragem', 'savana'], ['Persistência', 'taiga'], ['Disciplina', 'bambu'], ['Curiosidade', 'swamp']] },
];
const GOD_INTRO = [
  'Ah... você acordou. Não tenha medo.',
  'Eu sou Verdan, o Deus-Semente. Fui eu que te chamei para o meu mundo, Verdália.',
  'Meu mundo está adoecendo, e eu preciso de alguém de fora. Alguém como você.',
  'Mas primeiro quero te conhecer. Responda com o coração.',
];
const GOD_OUTRO = b => [
  'Entendo. Então o seu lugar é ' + BIOMES[b].n + '.',
  'Lá as criaturas vão te ajudar em tudo. Cuide delas, e elas vão cuidar de você.',
  'Encontre os santuários. É neles que eu consigo falar com você.',
  'Agora vá. E não se assuste: um amiguinho já está te esperando.',
];
