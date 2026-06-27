import { TILE, TILE_SIZE, BOSS_CONFIGS } from './constants.js';
import { REGION_ENEMY_PROFILES } from './enemy-spawn.js';

export function getTileAt(map, wx, wy) {
  const tx = Math.floor(wx / TILE_SIZE);
  const ty = Math.floor(wy / TILE_SIZE);
  if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) return -1;
  return map[ty][tx];
}

export function getMissionObjectives(level) {
  const boss = BOSS_CONFIGS[level.id];
  const n = level.allies.length;
  const objs = [
    `Rescatar y mantener libres a los ${n} compañeros (tecla E)`,
    `Si un compañero es herido, curálo con [E] para continuar`,
    `Evitar recapturas — los ingleses pueden retomarlos`,
    `Repeler ${level.waves.length} oleadas británicas`,
    `Derrotar al jefe: ${boss.name}`,
  ];
  if (level.mortarOperator != null) {
    objs.push('Colocar mortero: M + clic (con el artillero rescatado)');
    objs.push('El artillero ocupa el puesto y el mortero dispara solo');
  }
  if (level.bonusObjectives?.length) {
    objs.push('— Opcionales —');
    for (const b of level.bonusObjectives) {
      objs.push(`☆ ${b.text}`);
    }
  }
  if (level.conditions?.length) {
    return [...level.conditions, ...objs.slice(2)];
  }
  return objs;
}

function createEmpty(w, h, fill = TILE.GRASS) {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

function drawPath(map, x1, y1, x2, y2) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
        map[y][x] = TILE.PATH;
      }
    }
  }
}

function addRocks(map, cx, cy, count, radius) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = Math.random() * radius;
    const x = Math.floor(cx + Math.cos(angle) * dist);
    const y = Math.floor(cy + Math.sin(angle) * dist);
    if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
      map[y][x] = TILE.ROCK;
    }
  }
}

function addWaterCluster(map, cx, cy, size) {
  for (let dy = -size; dy <= size; dy++) {
    for (let dx = -size; dx <= size; dx++) {
      if (dx * dx + dy * dy <= size * size + Math.random() * 2) {
        const x = cx + dx;
        const y = cy + dy;
        if (y >= 0 && y < map.length && x >= 0 && x < map[0].length && map[y][x] === TILE.GRASS) {
          map[y][x] = TILE.WATER;
        }
      }
    }
  }
}

function addTrenches(map, points) {
  for (const [x, y] of points) {
    if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
      map[y][x] = TILE.TRENCH;
    }
  }
}

export const LEVELS = [
  {
    id: 0,
    name: 'Puerto San Carlos',
    region: 'Bahía San Carlos',
    description: 'Desembarco inicial — terreno abierto con caminos principales.',
    briefing: 'Hoy retomamos Bahía San Carlos, donde tantos soldados dieron todo por la patria. Cada paso en este suelo es por quienes cayeron. Reuní a los compañeros aislados y avanzá en su memoria.',
    mortarOperator: 0,
    enemyProfile: REGION_ENEMY_PROFILES[0],
    bonusObjectives: [
      { id: 'no_recaptures', text: 'Ninguna recaptura de compañeros' },
      { id: 'mortar_trench', text: 'Colocar el mortero en una trinchera' },
    ],
    conditions: [
      'Condición: los 4 compañeros deben quedar rescatados y libres',
      'Si los ingleses se acercan, pueden recapturarlos',
      'El artillero (noroeste) va solo al mortero que ubiques con M + clic',
    ],
    weather: 'wind',
    width: 30,
    height: 24,
    playerStart: { x: 15, y: 12 },
    allies: [
      { x: 8, y: 6 },
      { x: 22, y: 6 },
      { x: 8, y: 18 },
      { x: 22, y: 18 },
    ],
    waves: [
      { count: 4, interval: 3000 },
      { count: 6, interval: 2500 },
      { count: 8, interval: 2000 },
    ],
    generate() {
      const map = createEmpty(this.width, this.height);
      drawPath(map, 14, 0, 16, this.height - 1);
      drawPath(map, 0, 11, this.width - 1, 13);
      addWaterCluster(map, 5, 5, 2);
      addWaterCluster(map, 24, 5, 2);
      addWaterCluster(map, 5, 19, 2);
      addWaterCluster(map, 24, 19, 2);
      addRocks(map, 3, 12, 8, 4);
      return map;
    },
  },
  {
    id: 1,
    name: 'Goose Green',
    region: 'Isla Soledad — Este',
    description: 'Asentamiento con calles entrecruzadas y obstáculos.',
    briefing: 'Goose Green: aquí lucharon y cayeron muchos nuestros. Hoy volvemos a estas calles no para repetir la historia, sino para honrarlos y reivindicar lo que defendieron.',
    mortarOperator: 1,
    enemyProfile: REGION_ENEMY_PROFILES[1],
    bonusObjectives: [
      { id: 'no_recaptures', text: 'Ninguna recaptura en zona urbana' },
      { id: 'quick_heal', text: 'Si hay heridos, curá en menos de 30 s' },
    ],
    conditions: [
      'Condición: rescatar los 5 soldados — ninguno puede quedar en manos enemigas',
      'Vigilá las calles: recapturas frecuentes en zona urbana',
      'Un mortero apoya desde donde lo despliegues — dispara solo',
    ],
    weather: 'rain',
    width: 36,
    height: 28,
    playerStart: { x: 18, y: 14 },
    allies: [
      { x: 6, y: 8 },
      { x: 30, y: 8 },
      { x: 6, y: 20 },
      { x: 30, y: 20 },
      { x: 18, y: 4 },
    ],
    waves: [
      { count: 6, interval: 2800 },
      { count: 8, interval: 2200 },
      { count: 10, interval: 1800 },
      { count: 12, interval: 1500 },
    ],
    generate() {
      const map = createEmpty(this.width, this.height);
      drawPath(map, 17, 0, 19, this.height - 1);
      drawPath(map, 0, 13, this.width - 1, 15);
      drawPath(map, 8, 0, 10, this.height - 1);
      drawPath(map, 26, 0, 28, this.height - 1);
      drawPath(map, 0, 6, this.width - 1, 8);
      drawPath(map, 0, 20, this.width - 1, 22);
      addRocks(map, 12, 10, 10, 5);
      addRocks(map, 24, 18, 10, 5);
      addWaterCluster(map, 14, 22, 3);
      addWaterCluster(map, 22, 6, 2);
      addTrenches(map, [[12, 14], [13, 14], [14, 14], [22, 14], [23, 14], [24, 14]]);
      return map;
    },
  },
  {
    id: 2,
    name: 'Monte Longdon',
    region: 'Isla Soledad — Norte',
    description: 'Terreno montañoso con rocas y trincheras.',
    briefing: 'Las alturas del Monte Longdon guardan la memoria de quienes las defendieron hasta el final. El viento patagónico no apaga su recuerdo. Recuperá estas cumbres por ellos.',
    mortarOperator: 4,
    enemyProfile: REGION_ENEMY_PROFILES[2],
    bonusObjectives: [
      { id: 'no_recaptures', text: 'Ninguna recaptura en las alturas' },
      { id: 'mortar_trench', text: 'Mortero desplegado en trinchera' },
    ],
    conditions: [
      'Condición: 6 compañeros rescatados al final de la misión',
      'En las alturas los ingleses recapturan más rápido — no los dejes solos',
      'El artillero de la cumbre maneja el mortero y dispara automáticamente',
    ],
    weather: 'wind',
    width: 40,
    height: 32,
    playerStart: { x: 20, y: 28 },
    allies: [
      { x: 10, y: 10 },
      { x: 30, y: 10 },
      { x: 10, y: 22 },
      { x: 30, y: 22 },
      { x: 20, y: 6 },
      { x: 5, y: 16 },
    ],
    waves: [
      { count: 8, interval: 2500 },
      { count: 10, interval: 2000 },
      { count: 12, interval: 1600 },
      { count: 14, interval: 1400 },
      { count: 16, interval: 1200 },
    ],
    generate() {
      const map = createEmpty(this.width, this.height);
      drawPath(map, 19, 24, 21, this.height - 1);
      drawPath(map, 19, 0, 21, 10);
      drawPath(map, 0, 15, this.width - 1, 17);
      for (let i = 0; i < 6; i++) {
        addRocks(map, 8 + i * 5, 8 + (i % 3) * 4, 12, 6);
      }
      addWaterCluster(map, 6, 26, 3);
      addWaterCluster(map, 34, 26, 3);
      addTrenches(map, [
        [18, 12], [19, 12], [20, 12], [21, 12], [22, 12],
        [18, 20], [19, 20], [20, 20], [21, 20], [22, 20],
        [10, 16], [11, 16], [30, 16], [31, 16],
      ]);
      return map;
    },
  },
  {
    id: 3,
    name: 'Puerto Argentino',
    region: 'Isla Soledad — Capital',
    description: 'Urbano denso — máxima resistencia enemiga.',
    briefing: 'Puerto Argentino, corazón del archipiélago. Nuestros soldados la defendieron con el alma. Hoy la reivindicamos calle por calle, en nombre de todos los caídos.',
    mortarOperator: 2,
    enemyProfile: REGION_ENEMY_PROFILES[3],
    bonusObjectives: [
      { id: 'no_recaptures', text: 'Ninguna recaptura en la capital' },
      { id: 'no_wounds', text: 'Ningún compañero herido' },
      { id: 'vehicle_hunter', text: 'Destruir 3 vehículos enemigos', goal: 3 },
    ],
    conditions: [
      'Condición: los 8 compañeros deben estar rescatados y vivos al final',
      'Zona urbana densa — recapturas constantes si no los protegés',
      'Desplegá el mortero (M + clic); el artillero ocupa el puesto solo',
    ],
    weather: 'rain',
    width: 44,
    height: 36,
    playerStart: { x: 22, y: 32 },
    allies: [
      { x: 8, y: 8 },
      { x: 36, y: 8 },
      { x: 8, y: 28 },
      { x: 36, y: 28 },
      { x: 22, y: 6 },
      { x: 22, y: 18 },
      { x: 14, y: 18 },
      { x: 30, y: 18 },
    ],
    waves: [
      { count: 10, interval: 2200 },
      { count: 12, interval: 1800 },
      { count: 14, interval: 1500 },
      { count: 16, interval: 1300 },
      { count: 18, interval: 1100 },
      { count: 20, interval: 1000 },
    ],
    generate() {
      const map = createEmpty(this.width, this.height);
      for (let x = 4; x < this.width - 4; x += 6) {
        drawPath(map, x, 0, x + 1, this.height - 1);
      }
      for (let y = 4; y < this.height - 4; y += 6) {
        drawPath(map, 0, y, this.width - 1, y + 1);
      }
      addRocks(map, 15, 12, 8, 4);
      addRocks(map, 29, 12, 8, 4);
      addRocks(map, 15, 24, 8, 4);
      addRocks(map, 29, 24, 8, 4);
      addWaterCluster(map, 4, 18, 2);
      addWaterCluster(map, 40, 18, 2);
      addTrenches(map, [
        [20, 16], [21, 16], [22, 16], [23, 16], [24, 16],
        [20, 20], [21, 20], [22, 20], [23, 20], [24, 20],
        [10, 10], [11, 10], [32, 10], [33, 10],
      ]);
      return map;
    },
  },
  {
    id: 4,
    name: 'Puerto Howard',
    region: 'Isla Gran Malvina — Oeste',
    description: 'Costa occidental con playas y pantanos.',
    briefing: 'La costa occidental de Gran Malvina aún espera. Por cada caído en estas playas y pantanos, seguimos adelante. La reivindicación no se detiene.',
    mortarOperator: 4,
    enemyProfile: REGION_ENEMY_PROFILES[4],
    bonusObjectives: [
      { id: 'no_recaptures', text: 'Ninguna recaptura en la costa' },
      { id: 'vehicle_hunter', text: 'Destruir 4 vehículos en playa/pantano', goal: 4 },
    ],
    conditions: [
      'Condición: 7 soldados libres — todos deben sobrevivir la misión',
      'En la costa los enemigos rodean a los aislados con facilidad',
      'El mortero cubre playas y pantanos — fuego automático al desplegarlo',
    ],
    weather: 'wind',
    width: 46,
    height: 34,
    playerStart: { x: 23, y: 30 },
    allies: [
      { x: 10, y: 10 },
      { x: 36, y: 10 },
      { x: 10, y: 24 },
      { x: 36, y: 24 },
      { x: 23, y: 8 },
      { x: 6, y: 17 },
      { x: 40, y: 17 },
    ],
    waves: [
      { count: 12, interval: 2000 },
      { count: 14, interval: 1600 },
      { count: 16, interval: 1400 },
      { count: 18, interval: 1200 },
      { count: 20, interval: 1000 },
      { count: 22, interval: 900 },
    ],
    generate() {
      const map = createEmpty(this.width, this.height, TILE.SAND);
      drawPath(map, 22, 20, 24, this.height - 1);
      drawPath(map, 0, 16, this.width - 1, 18);
      drawPath(map, 10, 0, 12, 20);
      drawPath(map, 34, 0, 36, 20);
      for (let i = 0; i < 8; i++) {
        addWaterCluster(map, 5 + i * 5, 5 + (i % 4) * 3, 3);
      }
      addRocks(map, 20, 12, 10, 5);
      addTrenches(map, [
        [20, 16], [21, 16], [22, 16], [23, 16], [24, 16], [25, 16],
        [8, 16], [9, 16], [36, 16], [37, 16],
      ]);
      return map;
    },
  },
  {
    id: 5,
    name: 'Bahía Fox',
    region: 'Isla Gran Malvina — Sur',
    description: 'Misión final — liberar la última región.',
    briefing: 'Bahía Fox — el último tramo del archipiélago. Por los 649 caídos, y por las generaciones que vendrán: Malvinas es argentina. Completá la reivindicación.',
    mortarOperator: 4,
    enemyProfile: REGION_ENEMY_PROFILES[5],
    bonusObjectives: [
      { id: 'no_recaptures', text: 'Ninguna recaptura en la misión final' },
      { id: 'boss_phase', text: 'Derrotar al jefe en su fase final' },
      { id: 'rescue_all', text: 'Rescatar a los 10 compañeros' },
    ],
    conditions: [
      'Condición final: rescatar y mantener libres a los 10 compañeros',
      'Misión decisiva — ninguna recaptura puede quedar sin resolver',
      'El mortero de apoyo se despliega donde indiques y dispara solo',
    ],
    weather: 'rain',
    width: 50,
    height: 38,
    playerStart: { x: 25, y: 34 },
    allies: [
      { x: 8, y: 8 },
      { x: 42, y: 8 },
      { x: 8, y: 30 },
      { x: 42, y: 30 },
      { x: 25, y: 6 },
      { x: 25, y: 20 },
      { x: 12, y: 20 },
      { x: 38, y: 20 },
      { x: 6, y: 19 },
      { x: 44, y: 19 },
    ],
    waves: [
      { count: 14, interval: 1800 },
      { count: 16, interval: 1500 },
      { count: 18, interval: 1300 },
      { count: 20, interval: 1100 },
      { count: 22, interval: 1000 },
      { count: 24, interval: 900 },
      { count: 26, interval: 800 },
    ],
    generate() {
      const map = createEmpty(this.width, this.height);
      drawPath(map, 24, 24, 26, this.height - 1);
      drawPath(map, 0, 18, this.width - 1, 20);
      drawPath(map, 12, 0, 14, 25);
      drawPath(map, 36, 0, 38, 25);
      drawPath(map, 0, 8, this.width - 1, 10);
      drawPath(map, 0, 28, this.width - 1, 30);
      for (let i = 0; i < 10; i++) {
        addRocks(map, 6 + i * 4, 12 + (i % 5) * 3, 10, 5);
      }
      addWaterCluster(map, 8, 24, 4);
      addWaterCluster(map, 42, 24, 4);
      addWaterCluster(map, 25, 14, 3);
      addTrenches(map, [
        [22, 18], [23, 18], [24, 18], [25, 18], [26, 18], [27, 18], [28, 18],
        [22, 22], [23, 22], [24, 22], [25, 22], [26, 22], [27, 22], [28, 22],
        [10, 18], [11, 18], [38, 18], [39, 18],
        [10, 10], [11, 10], [38, 10], [39, 10],
      ]);
      return map;
    },
  },
];

export function isSolid(tile) {
  return tile === TILE.WATER || tile === TILE.ROCK;
}

export function isTrench(tile) {
  return tile === TILE.TRENCH;
}

export function worldToTile(x, y) {
  return {
    tx: Math.floor(x / TILE_SIZE),
    ty: Math.floor(y / TILE_SIZE),
  };
}

export function tileCenter(tx, ty) {
  return {
    x: tx * TILE_SIZE + TILE_SIZE / 2,
    y: ty * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function checkCollision(map, x, y, radius) {
  const corners = [
    { x: x - radius, y: y - radius },
    { x: x + radius, y: y - radius },
    { x: x - radius, y: y + radius },
    { x: x + radius, y: y + radius },
  ];
  for (const c of corners) {
    const { tx, ty } = worldToTile(c.x, c.y);
    if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) return true;
    if (isSolid(map[ty][tx])) return true;
  }
  return false;
}

export function collectSpawnPoints(map) {
  const points = [];
  for (let y = 1; y < map.length - 1; y++) {
    for (let x = 1; x < map[0].length - 1; x++) {
      const tile = map[y][x];
      if (tile === TILE.GRASS || tile === TILE.PATH || tile === TILE.SAND) {
        points.push({ x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 });
      }
    }
  }
  return points;
}

export function pickRandomSpawnPoint(points) {
  return points[(Math.random() * points.length) | 0];
}
