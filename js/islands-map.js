/**
 * Mapa estilizado de las Islas Malvinas con regiones por nivel.
 */
export const ISLAND_REGIONS = [
  { levelId: 0, name: 'Puerto San Carlos', shortName: 'San Carlos', cx: 0.68, cy: 0.52, rx: 0.07, ry: 0.09 },
  { levelId: 1, name: 'Goose Green', shortName: 'Goose Green', cx: 0.58, cy: 0.62, rx: 0.08, ry: 0.07 },
  { levelId: 2, name: 'Monte Longdon', shortName: 'Longdon', cx: 0.72, cy: 0.38, rx: 0.07, ry: 0.08 },
  { levelId: 3, name: 'Puerto Argentino', shortName: 'P. Argentino', cx: 0.78, cy: 0.48, rx: 0.06, ry: 0.07 },
  { levelId: 4, name: 'Puerto Howard', shortName: 'Howard', cx: 0.28, cy: 0.42, rx: 0.08, ry: 0.09 },
  { levelId: 5, name: 'Bahía Fox', shortName: 'Fox Bay', cx: 0.22, cy: 0.58, rx: 0.09, ry: 0.08 },
];

function drawIslandSilhouette(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1a5276');
  grad.addColorStop(1, '#0d3d56');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#4a7c59';
  ctx.strokeStyle = '#2d5a3d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.35);
  ctx.bezierCurveTo(w * 0.15, h * 0.22, w * 0.32, h * 0.18, w * 0.38, h * 0.28);
  ctx.bezierCurveTo(w * 0.42, h * 0.45, w * 0.36, h * 0.72, w * 0.28, h * 0.78);
  ctx.bezierCurveTo(w * 0.18, h * 0.82, w * 0.06, h * 0.68, w * 0.05, h * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#528a62';
  ctx.beginPath();
  ctx.moveTo(w * 0.48, h * 0.25);
  ctx.bezierCurveTo(w * 0.58, h * 0.18, w * 0.82, h * 0.22, w * 0.92, h * 0.38);
  ctx.bezierCurveTo(w * 0.96, h * 0.55, w * 0.88, h * 0.75, w * 0.72, h * 0.82);
  ctx.bezierCurveTo(w * 0.55, h * 0.78, w * 0.44, h * 0.65, w * 0.46, h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#3d6b4a';
  ctx.beginPath();
  ctx.ellipse(w * 0.44, h * 0.72, w * 0.025, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawIslandsMap(canvas, options = {}) {
  const {
    highlightLevel = null,
    liberatedLevels = [],
    currentLevel = null,
    pulse = 0,
  } = options;

  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  drawIslandSilhouette(ctx, w, h);

  for (const region of ISLAND_REGIONS) {
    const rx = region.cx * w;
    const ry = region.cy * h;
    const rw = region.rx * w;
    const rh = region.ry * h;
    const liberated = liberatedLevels.includes(region.levelId);
    const isHighlight = highlightLevel === region.levelId;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2);

    if (liberated) {
      ctx.fillStyle = isHighlight ? 'rgba(46, 204, 113, 0.75)' : 'rgba(46, 204, 113, 0.5)';
      ctx.strokeStyle = '#2ecc71';
    } else if (currentLevel === region.levelId) {
      const glow = 0.5 + Math.sin(pulse * 3) * 0.2;
      ctx.fillStyle = `rgba(116, 185, 255, ${glow})`;
      ctx.strokeStyle = '#74b9ff';
    } else {
      ctx.fillStyle = 'rgba(231, 76, 60, 0.35)';
      ctx.strokeStyle = 'rgba(192, 57, 43, 0.6)';
    }

    ctx.fill();
    ctx.lineWidth = isHighlight ? 3 : 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(8, w * 0.028)}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(region.shortName, rx, ry);
  }

  ctx.font = `${Math.max(7, w * 0.022)}px Segoe UI, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('● Liberada', w * 0.04, h * 0.94);
  ctx.fillStyle = 'rgba(116,185,255,0.8)';
  ctx.fillText('● En combate', w * 0.28, h * 0.94);
  ctx.fillStyle = 'rgba(231,76,60,0.7)';
  ctx.fillText('● Ocupada', w * 0.52, h * 0.94);
}

export function loadLiberatedRegions() {
  try {
    const saved = localStorage.getItem('malvinas-liberated');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveLiberatedRegion(levelId) {
  const list = loadLiberatedRegions();
  if (!list.includes(levelId)) {
    list.push(levelId);
    localStorage.setItem('malvinas-liberated', JSON.stringify(list));
  }
  return list;
}
