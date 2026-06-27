/** Cielo, luz y ambiente por región de la campaña. */

export const SKY_PRESETS = {
  dawn: { top: '#4a6fa5', bottom: '#c9a86c', tint: 'rgba(255,180,120,0.08)', cloud: 'rgba(255,255,255,0.55)' },
  day: { top: '#3d7ea6', bottom: '#87b5d4', tint: 'rgba(255,255,255,0.04)', cloud: 'rgba(255,255,255,0.72)' },
  overcast: { top: '#5a6472', bottom: '#8a939e', tint: 'rgba(120,130,145,0.12)', cloud: 'rgba(210,215,220,0.5)' },
  dusk: { top: '#3d4a6a', bottom: '#c46b4a', tint: 'rgba(255,120,80,0.1)', cloud: 'rgba(255,200,180,0.45)' },
  night: { top: '#0a1628', bottom: '#1a3050', tint: 'rgba(40,60,100,0.22)', cloud: 'rgba(180,190,210,0.12)' },
};

export function getLevelAtmosphere(level) {
  const periods = ['dawn', 'overcast', 'dusk', 'day', 'day', 'night'];
  const id = level?.id ?? 0;
  return {
    period: periods[id] || 'day',
    coastal: id === 0 || id === 4 || id === 5,
    seagulls: id === 0 || id === 4 || id === 5,
    levelId: id,
  };
}

export function isNearWater(map, x, y, radiusTiles = 4) {
  if (!map?.length) return false;
  const col = Math.floor(x / 40);
  const row = Math.floor(y / 40);
  const rows = map.length;
  const cols = map[0].length;
  for (let r = row - radiusTiles; r <= row + radiusTiles; r++) {
    for (let c = col - radiusTiles; c <= col + radiusTiles; c++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols && map[r][c] === 2) return true;
    }
  }
  return false;
}
