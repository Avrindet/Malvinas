import { WEAPONS } from './constants.js';
import { DEFAULT_ENEMY_PROFILE } from './enemy-spawn.js';

const STORAGE_KEY = 'malvinas-difficulty';

export const DIFFICULTIES = [
  {
    id: 'conscripto',
    name: 'Conscripto',
    icon: '🛡️',
    description: 'Más vida y munición. Ideal para aprender.',
  },
  {
    id: 'soldado',
    name: 'Soldado',
    icon: '⚔️',
    description: 'Equilibrio recomendado.',
  },
  {
    id: 'veterano',
    name: 'Veterano',
    icon: '💀',
    description: 'Más enemigos, menos balas, combate duro.',
  },
];

const MODIFIERS = {
  conscripto: {
    playerHealth: 120,
    ammoReserveMult: 1.35,
    enemyCountMult: 0.82,
    spawnIntervalMult: 1.2,
    enemyDamageMult: 0.72,
    allyDamageMult: 1.28,
    specialEnemyMult: 0.65,
    grenades: 5,
  },
  soldado: {
    playerHealth: 100,
    ammoReserveMult: 1,
    enemyCountMult: 1,
    spawnIntervalMult: 1,
    enemyDamageMult: 1,
    allyDamageMult: 1,
    specialEnemyMult: 1,
    grenades: 4,
  },
  veterano: {
    playerHealth: 85,
    ammoReserveMult: 0.72,
    enemyCountMult: 1.32,
    spawnIntervalMult: 0.82,
    enemyDamageMult: 1.28,
    allyDamageMult: 0.82,
    specialEnemyMult: 1.45,
    grenades: 3,
  },
};

let activeId = 'soldado';
let activeModifiers = MODIFIERS.soldado;

export function loadDifficultyId() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && MODIFIERS[saved]) return saved;
  } catch {
    /* ignore */
  }
  return 'soldado';
}

export function saveDifficultyId(id) {
  if (!MODIFIERS[id]) return;
  localStorage.setItem(STORAGE_KEY, id);
  setActiveDifficulty(id);
}

export function setActiveDifficulty(id) {
  activeId = MODIFIERS[id] ? id : 'soldado';
  activeModifiers = MODIFIERS[activeId];
}

export function getActiveDifficultyId() {
  return activeId;
}

export function getActiveModifiers() {
  return activeModifiers;
}

export function getDifficultyById(id) {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}

export function getDifficultyLabel(id = activeId) {
  const def = getDifficultyById(id);
  return `${def.icon} ${def.name}`;
}

export function applyPlayerDifficulty(player, mods = activeModifiers) {
  player.maxHealth = mods.playerHealth;
  player.health = mods.playerHealth;
  player.grenades = mods.grenades;
  for (let i = 0; i < player.weapons.length; i++) {
    const baseReserve = WEAPONS[i].reserve;
    player.weapons[i].reserve = Math.max(1, Math.round(baseReserve * mods.ammoReserveMult));
  }
}

export function scaleWaveEnemyCount(baseCount, mods = activeModifiers) {
  return Math.max(1, Math.round(baseCount * mods.enemyCountMult));
}

export function scaleSpawnIntervalMs(baseMs, mods = activeModifiers) {
  return Math.max(350, Math.round(baseMs * mods.spawnIntervalMult));
}

export function pickEnemyTypeWithDifficulty(level, wave, mods = activeModifiers) {
  const profile = level.enemyProfile ?? DEFAULT_ENEMY_PROFILE;
  if (wave < (profile.minWaveForSpecial ?? 2)) return 'soldier';

  const cap = (v) => Math.min(0.5, (v ?? 0) * mods.specialEnemyMult);
  const sniper = cap(profile.sniper);
  const vehicle = cap(profile.vehicle);
  const cannon = cap(profile.cannon);

  const r = Math.random();
  let acc = sniper;
  if (r < acc) return 'sniper';
  acc += vehicle;
  if (r < acc) return 'vehicle';
  acc += cannon;
  if (r < acc) return 'cannon';
  return 'soldier';
}

export function scaleEnemyDamage(amount, mods = activeModifiers) {
  return amount * mods.enemyDamageMult;
}

export function scaleAllyDamage(amount, mods = activeModifiers) {
  return amount * mods.allyDamageMult;
}

// Sincronizar al cargar el módulo
setActiveDifficulty(loadDifficultyId());
