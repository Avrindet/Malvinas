export const TILE = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  ROCK: 3,
  TRENCH: 4,
  SAND: 5,
};

export const TILE_SIZE = 40;

export const COLORS = {
  [TILE.GRASS]: '#3a7d44',
  [TILE.PATH]: '#8B6914',
  [TILE.WATER]: '#2471a3',
  [TILE.ROCK]: '#8a9396',
  [TILE.TRENCH]: '#5d4e37',
  [TILE.SAND]: '#c2b280',
};

export const WEAPONS = [
  {
    name: 'FAL',
    clipSize: 20,
    reserve: 60,
    damage: 25,
    fireRate: 150,
    bulletSpeed: 600,
    spread: 0.04,
    auto: true,
    reloadTime: 2000,
  },
  {
    name: 'MAG',
    clipSize: 30,
    reserve: 90,
    damage: 18,
    fireRate: 80,
    bulletSpeed: 550,
    spread: 0.08,
    auto: true,
    reloadTime: 2500,
  },
  {
    name: 'Browning HP',
    clipSize: 13,
    reserve: 52,
    damage: 35,
    fireRate: 300,
    bulletSpeed: 500,
    spread: 0.02,
    auto: false,
    reloadTime: 1800,
  },
  {
    name: 'RPG',
    clipSize: 1,
    reserve: 5,
    damage: 120,
    fireRate: 1500,
    bulletSpeed: 350,
    spread: 0,
    auto: false,
    reloadTime: 3000,
    explosive: true,
    radius: 80,
  },
];

export const PLAYER_SPEED = 180;
export const PLAYER_RADIUS = 14;
export const ENEMY_RADIUS = 12;
export const ALLY_RADIUS = 11;
export const RESCUE_RANGE = 50;
export const ALLY_MAX_HEALTH = 70;

export const ALLY_SPEED = 145;
export const ALLY_SHOOT_RANGE = 360;
export const ALLY_SHOOT_COOLDOWN = 0.5;
export const ALLY_DAMAGE = 18;
export const ALLY_FORMATION_RADIUS = 48;

export const GRENADE_MAX = 4;
export const GRENADE_COOLDOWN = 1.4;
export const GRENADE_RADIUS = 75;
export const GRENADE_DAMAGE = 95;

export const RECAPTURE_RANGE = 42;
export const RECAPTURE_TIME = 2.6;
export const MORTAR_PLACE_RANGE = 340;
export const MORTAR_MIN_DIST_PLAYER = 60;
export const MORTAR_FIRE_RANGE = 520;
export const MORTAR_FIRE_COOLDOWN = 4.5;
export const MORTAR_BLAST_RADIUS = 85;
export const MORTAR_DAMAGE = 75;

export const BOSS_CONFIGS = [
  { name: 'Teniente Davies', title: 'Comandante de playa', health: 350 },
  { name: 'Capitán Price', title: 'Jefe de Goose Green', health: 420 },
  { name: 'Comandante Sánchez', title: 'Defensor de Longdon', health: 500 },
  { name: 'Gobernador Hunt', title: 'Última línea en Puerto Argentino', health: 650 },
  { name: 'Mayor Wilson', title: 'Fortín de Howard', health: 550 },
  { name: 'General Moore', title: 'Comando final — Fox Bay', health: 800, phased: true },
];
