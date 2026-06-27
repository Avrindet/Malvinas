/** Perfiles de spawn enemigo por región. */
export const DEFAULT_ENEMY_PROFILE = {
  minWaveForSpecial: 2,
  sniper: 0.08,
  vehicle: 0.08,
  cannon: 0.08,
};

export function pickEnemyTypeForLevel(level, wave) {
  const profile = level.enemyProfile ?? DEFAULT_ENEMY_PROFILE;
  if (wave < (profile.minWaveForSpecial ?? 2)) return 'soldier';

  const r = Math.random();
  let acc = profile.sniper ?? 0;
  if (r < acc) return 'sniper';
  acc += profile.vehicle ?? 0;
  if (r < acc) return 'vehicle';
  acc += profile.cannon ?? 0;
  if (r < acc) return 'cannon';
  return 'soldier';
}

export const REGION_ENEMY_PROFILES = {
  0: { minWaveForSpecial: 3, sniper: 0.06, vehicle: 0.05, cannon: 0.05 },
  1: { minWaveForSpecial: 1, sniper: 0.22, vehicle: 0.08, cannon: 0.10 },
  2: { minWaveForSpecial: 2, sniper: 0.10, vehicle: 0.06, cannon: 0.22 },
  3: { minWaveForSpecial: 1, sniper: 0.14, vehicle: 0.18, cannon: 0.12 },
  4: { minWaveForSpecial: 1, sniper: 0.08, vehicle: 0.28, cannon: 0.08 },
  5: { minWaveForSpecial: 1, sniper: 0.18, vehicle: 0.18, cannon: 0.15 },
};
