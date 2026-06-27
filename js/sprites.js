/** Dibujos procedurales top-down para soldados y efectos. */
import { TILE_SIZE } from './constants.js';

function hash(col, row) {
  return ((col * 73856093) ^ (row * 19349663)) >>> 0;
}

export function drawSoldierPlayer(ctx, angle, inTrench = false) {
  ctx.save();
  ctx.rotate(angle);

  if (inTrench) ctx.globalAlpha = 0.65;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(2, 3, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cuerpo — uniforme verde oliva argentino
  ctx.fillStyle = '#4a6741';
  ctx.beginPath();
  ctx.ellipse(0, 2, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hombreras / chaleco
  ctx.fillStyle = '#3d5a35';
  ctx.fillRect(-10, -4, 20, 8);

  // Brazo con rifle
  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.ellipse(6, 4, 4, 3, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Rifle FAL
  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(4, -2, 18, 4);
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(4, 1, 8, 3);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(20, -1, 6, 2);

  // Casco
  ctx.fillStyle = '#5a6b4a';
  ctx.beginPath();
  ctx.arc(0, -6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d4a32';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Visera del casco
  ctx.fillStyle = '#3d4a32';
  ctx.beginPath();
  ctx.arc(0, -6, 8, 0.1, Math.PI - 0.1);
  ctx.fill();

  // Insignia celeste (Argentina)
  ctx.fillStyle = '#74b9ff';
  ctx.beginPath();
  ctx.arc(-4, -5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Franja celeste del poncho / boina
  ctx.fillStyle = 'rgba(116,185,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(-9, 4);
  ctx.lineTo(9, 4);
  ctx.lineTo(7, 10);
  ctx.lineTo(-7, 10);
  ctx.closePath();
  ctx.fill();

  // Brillo en el casco
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(-3, -9, 3, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza (visible bajo casco)
  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.arc(0, -4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Botas
  ctx.fillStyle = '#2c2416';
  ctx.fillRect(-7, 10, 5, 4);
  ctx.fillRect(2, 10, 5, 4);

  ctx.restore();
}

export function drawSoldierEnemy(ctx, angle) {
  ctx.save();
  ctx.rotate(angle);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(2, 3, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Uniforme caqui británico
  ctx.fillStyle = '#6b705c';
  ctx.beginPath();
  ctx.ellipse(0, 2, 8, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#565a48';
  ctx.fillRect(-9, -3, 18, 7);

  // Rifle
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(3, -1.5, 16, 3);
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(3, 1, 7, 2.5);
  ctx.fillRect(17, -0.5, 5, 1.5);

  // Casco británico (más redondo)
  ctx.fillStyle = '#4a5240';
  ctx.beginPath();
  ctx.arc(0, -5, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#353a2e';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Red de casco
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  for (let i = -5; i <= 5; i += 2.5) {
    ctx.beginPath();
    ctx.moveTo(i, -12);
    ctx.lineTo(i, 0);
    ctx.stroke();
  }

  // Cara
  ctx.fillStyle = '#c8956a';
  ctx.beginPath();
  ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Identificador enemigo
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(0, -8, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2c2416';
  ctx.fillRect(-6, 9, 4, 3);
  ctx.fillRect(2, 9, 4, 3);

  ctx.restore();
}

export function drawSoldierCompanion(ctx, angle) {
  ctx.save();
  ctx.rotate(angle);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(2, 3, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Uniforme aliado — verde con detalle celeste
  ctx.fillStyle = '#3d6b4f';
  ctx.beginPath();
  ctx.ellipse(0, 2, 8, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2e5a42';
  ctx.fillRect(-9, -3, 18, 7);

  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.ellipse(5, 3, 3.5, 2.5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // FAL
  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(3, -1.5, 16, 3.5);
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(3, 1, 7, 2.5);
  ctx.fillRect(17, -0.5, 5, 1.5);

  ctx.fillStyle = '#4a7a5a';
  ctx.beginPath();
  ctx.arc(0, -5, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e5a42';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#74b9ff';
  ctx.fillRect(-6, -2, 4, 3);

  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2c2416';
  ctx.fillRect(-6, 9, 4, 3);
  ctx.fillRect(2, 9, 4, 3);

  ctx.restore();
}

export function drawCannon(ctx, angle, healthRatio = 1) {
  ctx.save();
  ctx.rotate(angle);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plataforma
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(-16, -6, 32, 14);
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 2;
  ctx.strokeRect(-16, -6, 32, 14);

  // Orugas
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-18, 6, 36, 5);
  for (let i = -14; i <= 14; i += 7) {
    ctx.fillRect(i - 2, 7, 4, 3);
  }

  // Cañón
  ctx.fillStyle = '#3d3d3d';
  ctx.fillRect(0, -5, 24, 8);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(22, -3, 8, 4);

  // Escudo
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(-8, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Barra de vida
  if (healthRatio < 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-18, -22, 36, 5);
    ctx.fillStyle = healthRatio > 0.4 ? '#e74c3c' : '#922b21';
    ctx.fillRect(-18, -22, 36 * healthRatio, 5);
  }
}

export function drawSoldierAlly(ctx, pulse) {
  const glow = Math.sin(pulse) * 0.3 + 0.7;

  ctx.save();

  // Anillo de rescate
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(241, 196, 15, ${glow})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Compañero agachado esperando rescate
  ctx.fillStyle = '#2980b9';
  ctx.beginPath();
  ctx.ellipse(0, 2, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1f618d';
  ctx.fillRect(-9, -2, 18, 6);

  // Casco abatido
  ctx.fillStyle = '#2471a3';
  ctx.beginPath();
  ctx.arc(0, -5, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Brazos levantados (señal de rendición)
  ctx.strokeStyle = '#d4a574';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(-12, -10);
  ctx.moveTo(7, 0);
  ctx.lineTo(12, -10);
  ctx.stroke();

  // Arma en el suelo
  ctx.fillStyle = '#3a3a3a';
  ctx.save();
  ctx.translate(8, 8);
  ctx.rotate(0.8);
  ctx.fillRect(0, 0, 12, 2.5);
  ctx.restore();

  // Etiqueta [E]
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 3;
  ctx.fillText('[E]', 0, -26);
  ctx.shadowBlur = 0;

  ctx.restore();
}

export function drawSniper(ctx, angle) {
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = '#3d4a32';
  ctx.fillRect(-8, -2, 16, 10);
  ctx.fillStyle = '#2c3e2a';
  ctx.fillRect(2, -1, 22, 3);
  ctx.fillStyle = '#4a5240';
  ctx.beginPath();
  ctx.arc(0, -4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8e44ad';
  ctx.fillRect(-3, -6, 6, 2);
  ctx.restore();
}

export function drawVehicle(ctx, angle) {
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = '#4a5a3a';
  ctx.fillRect(-16, -8, 32, 16);
  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(4, -2, 18, 4);
  ctx.fillStyle = '#1a1a1a';
  for (let i = -12; i <= 12; i += 8) {
    ctx.beginPath();
    ctx.arc(i, 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-14, -10, 6, 4);
  ctx.restore();
}

export function drawBoss(ctx, angle, healthRatio, name, phase = 1) {
  if (name && name.includes('Moore')) {
    drawBossFox(ctx, angle, healthRatio, name, phase);
    return;
  }

  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = '#4a3040';
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(-4, -10, 8, 4);
  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(6, -2, 20, 5);
  ctx.fillStyle = '#8b0000';
  ctx.beginPath();
  ctx.arc(0, -8, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawBossHealthBar(ctx, healthRatio, name);
}

function drawBossHealthBar(ctx, healthRatio, name) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(-22, -28, 44, 6);
  ctx.fillStyle = healthRatio > 0.3 ? '#e74c3c' : '#922b21';
  ctx.fillRect(-22, -28, 44 * healthRatio, 6);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 9px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(name || 'JEFE', 0, -32);
}

function drawBossFox(ctx, angle, healthRatio, name, phase) {
  const enraged = phase >= 2;

  ctx.save();
  if (enraged) {
    ctx.shadowColor = 'rgba(231,76,60,0.55)';
    ctx.shadowBlur = 16;
  }

  ctx.rotate(angle);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(3, 8, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Capa / abrigo de comando
  ctx.fillStyle = enraged ? '#3a2028' : '#2c3540';
  ctx.beginPath();
  ctx.ellipse(0, 4, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hombreras doradas
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(-18, -6, 8, 5);
  ctx.fillRect(10, -6, 8, 5);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(-16, -4, 4, 2);
  ctx.fillRect(12, -4, 4, 2);

  // Uniforme caqui británico
  ctx.fillStyle = '#5a5f48';
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rifle pesado / SMG
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(4, -2, 24, 5);
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(4, 2, 10, 3);
  ctx.fillRect(24, -1, 8, 3);

  // Brazo
  ctx.fillStyle = '#c8956a';
  ctx.beginPath();
  ctx.ellipse(8, 5, 4, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Casco / gorra de oficial
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(0, -8, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8b0000';
  ctx.fillRect(-8, -12, 16, 4);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(-3, -11, 6, 2);

  // Insignia enemiga
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Cara
  ctx.fillStyle = '#c8956a';
  ctx.beginPath();
  ctx.arc(0, -4, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Botas
  ctx.fillStyle = '#1a1410';
  ctx.fillRect(-8, 14, 6, 4);
  ctx.fillRect(2, 14, 6, 4);

  ctx.restore();

  if (enraged) {
    ctx.strokeStyle = 'rgba(231,76,60,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 24 + Math.sin(performance.now() * 0.008) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawBossHealthBar(ctx, healthRatio, name);
}

export function drawBullet(ctx, bullet) {
  if (!bullet.alive) return;

  ctx.save();
  if (bullet.explosive) {
    ctx.fillStyle = '#e67e22';
    ctx.shadowColor = '#e67e22';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const isPlayer = bullet.owner === 'player';
    const isAlly = bullet.owner === 'ally';
    const trailLen = bullet.explosive ? 0.02 : 0.022;
    const color = isPlayer ? '#f1c40f' : isAlly ? '#74b9ff' : '#ff6b6b';
    const trailColor = isPlayer ? 'rgba(241,196,15,0.35)' : isAlly ? 'rgba(116,185,255,0.35)' : 'rgba(255,107,107,0.35)';

    ctx.strokeStyle = trailColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bullet.x - bullet.vx * trailLen, bullet.y - bullet.vy * trailLen);
    ctx.lineTo(bullet.x, bullet.y);
    ctx.stroke();

    ctx.strokeStyle = isPlayer ? 'rgba(241,196,15,0.55)' : isAlly ? 'rgba(116,185,255,0.55)' : 'rgba(255,107,107,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bullet.x - bullet.vx * (trailLen * 0.5), bullet.y - bullet.vy * (trailLen * 0.5));
    ctx.lineTo(bullet.x, bullet.y);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

export function drawExplosion(ctx, x, y, radius) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, radius * 1.15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(80,40,20,0.18)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(230, 126, 34, 0.45)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(241, 196, 15, 0.65)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
    ctx.stroke();
  }

  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 + 0.2;
    const len = radius * (0.55 + (i % 3) * 0.12);
    ctx.strokeStyle = 'rgba(60,30,10,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * radius * 0.3, y + Math.sin(a) * radius * 0.3);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawMuzzleFlash(ctx, angle, intensity = 1, owner = 'player') {
  if (intensity <= 0) return;

  const colors = {
    player: ['#fff9c4', '#f1c40f'],
    ally: ['#d6ecff', '#74b9ff'],
    enemy: ['#ffd5d5', '#ff6b6b'],
  };
  const [core, outer] = colors[owner] || colors.enemy;

  ctx.save();
  ctx.rotate(angle);
  ctx.globalAlpha = Math.min(1, intensity * 4);

  const dist = 22;
  ctx.translate(dist, 0);

  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(14, -5);
  ctx.lineTo(18, 0);
  ctx.lineTo(14, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(10, -3);
  ctx.lineTo(12, 0);
  ctx.lineTo(10, 3);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = intensity * 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(4, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawTileDetail(ctx, tile, x, y, col, row) {
  const h = hash(col, row);

  switch (tile) {
    case 0: drawGrass(ctx, x, y, h); break;
    case 1: drawPath(ctx, x, y, h); break;
    case 2: drawWater(ctx, x, y, h); break;
    case 3: drawRock(ctx, x, y, h); break;
    case 4: drawTrench(ctx, x, y, h); break;
    case 5: drawSand(ctx, x, y, h); break;
    default: break;
  }
}

function drawGrassBlade(ctx, px, py, h, tilt = 0) {
  const tall = (h % 3) + 4;
  ctx.strokeStyle = h % 2 ? '#2d6b34' : '#52a05a';
  ctx.lineWidth = 1.2 + (h % 2) * 0.3;
  ctx.beginPath();
  ctx.moveTo(px, py + 4);
  ctx.quadraticCurveTo(px - 2 + tilt, py, px + tilt * 0.5, py - tall);
  ctx.stroke();
}

function drawGrass(ctx, x, y, h) {
  const variant = h % 3;
  ctx.fillStyle = variant === 0 ? '#458a4d' : variant === 1 ? '#347a3c' : '#3a7d44';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Manchas de pasto seco / tierra
  if (h % 5 === 0) {
    ctx.fillStyle = 'rgba(120,100,60,0.12)';
    ctx.beginPath();
    ctx.ellipse(x + 14 + (h % 12), y + 18 + (h % 10), 10, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  const spots = 5 + (h % 4);
  for (let i = 0; i < spots; i++) {
    const px = x + 4 + ((h + i * 17) % 32);
    const py = y + 4 + ((h + i * 23) % 30);
    drawGrassBlade(ctx, px, py, h + i, (i % 2) * 0.8);
  }

  if (h % 9 === 0) drawGrassTuft(ctx, x + 16 + (h % 10), y + 20 + (h % 8), h);
  if (h % 13 === 0) drawFern(ctx, x + 24 + (h % 8), y + 12 + (h % 14), h);

  if (h % 6 === 0) {
    const fx = x + 8 + (h % 22);
    const fy = y + 10 + (h % 16);
    ctx.fillStyle = h % 12 === 0 ? '#f9e79f' : '#fff';
    ctx.beginPath();
    ctx.arc(fx, fy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = h % 12 === 0 ? '#f1c40f' : '#e8daef';
    ctx.beginPath();
    ctx.arc(fx, fy, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPath(ctx, x, y, h) {
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = '#9a7620';
  ctx.fillRect(x + 2, y + 2, 36, 36);

  // Huellas / surcos del camino
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  const offset = (h % 4) * 3;
  for (let i = 0; i < 3; i++) {
    const ly = y + 8 + i * 12 + offset;
    ctx.beginPath();
    ctx.moveTo(x + 4, ly);
    ctx.lineTo(x + 36, ly);
    ctx.stroke();
  }

  // Piedras sueltas
  ctx.fillStyle = 'rgba(90,80,60,0.5)';
  for (let i = 0; i < 2 + (h % 2); i++) {
    const px = x + 8 + ((h + i * 11) % 24);
    const py = y + 8 + ((h + i * 19) % 24);
    ctx.beginPath();
    ctx.arc(px, py, 1.5 + (h % 2), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWater(ctx, x, y, h) {
  const grad = ctx.createLinearGradient(x, y, x, y + TILE_SIZE);
  grad.addColorStop(0, '#3498db');
  grad.addColorStop(1, '#1a5276');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const wy = y + 10 + i * 12 + (h % 5);
    ctx.beginPath();
    ctx.moveTo(x + 3, wy);
    ctx.quadraticCurveTo(x + 20, wy - 3, x + 37, wy);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.ellipse(x + 12 + (h % 10), y + 8 + (h % 8), 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRockBoulder3D(ctx, cx, cy, r, h, opts = {}) {
  const { moss = true, secondary = true } = opts;

  // Sombra proyectada
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + r * 0.75, r * 1.05, r * 0.38, 0.15, 0, Math.PI * 2);
  ctx.fill();

  if (secondary && h % 3 !== 0) {
    const sx = cx - r * 0.55;
    const sy = cy + r * 0.35;
    const sr = r * 0.42;
    const sGrad = ctx.createRadialGradient(sx - sr * 0.3, sy - sr * 0.4, 0, sx, sy, sr);
    sGrad.addColorStop(0, '#7a8488');
    sGrad.addColorStop(0.55, '#5c6569');
    sGrad.addColorStop(1, '#3d4448');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.moveTo(sx - sr, sy + 1);
    ctx.lineTo(sx - sr * 0.5, sy - sr * 0.7);
    ctx.lineTo(sx + sr * 0.4, sy - sr * 0.5);
    ctx.lineTo(sx + sr * 0.9, sy + sr * 0.4);
    ctx.lineTo(sx - sr * 0.1, sy + sr * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a4044';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r * 1.1);
  grad.addColorStop(0, '#9aa3a8');
  grad.addColorStop(0.45, '#6d777c');
  grad.addColorStop(0.85, '#4a5256');
  grad.addColorStop(1, '#353b3f');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy + 2);
  ctx.lineTo(cx - r * 0.62, cy - r * 0.82);
  ctx.lineTo(cx + r * 0.28, cy - r * 0.98);
  ctx.lineTo(cx + r * 1.02, cy - r * 0.28);
  ctx.lineTo(cx + r * 0.82, cy + r * 0.62);
  ctx.lineTo(cx - r * 0.18, cy + r * 0.92);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#3a4044';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cara iluminada
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy - r * 0.55);
  ctx.lineTo(cx + r * 0.08, cy - r * 0.78);
  ctx.lineTo(cx - r * 0.05, cy - r * 0.25);
  ctx.closePath();
  ctx.fill();

  // Sombra en la base
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.3, cy + r * 0.5);
  ctx.lineTo(cx + r * 0.7, cy + r * 0.55);
  ctx.lineTo(cx + r * 0.5, cy + r * 0.85);
  ctx.lineTo(cx - r * 0.2, cy + r * 0.8);
  ctx.closePath();
  ctx.fill();

  // Grietas
  ctx.strokeStyle = 'rgba(20,25,28,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.15, cy - r * 0.35);
  ctx.lineTo(cx + r * 0.2, cy + r * 0.45);
  ctx.stroke();
  if (h % 2 === 0) {
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.1, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.15);
    ctx.stroke();
  }

  if (moss && h % 3 !== 1) {
    drawMossPatch(ctx, cx - r * 0.35, cy + r * 0.15, r * 0.55, h);
  }
}

function drawRock(ctx, x, y, h) {
  const grad = ctx.createLinearGradient(x, y, x, y + TILE_SIZE);
  grad.addColorStop(0, '#949ea3');
  grad.addColorStop(1, '#6b7378');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Grava alrededor
  ctx.fillStyle = 'rgba(60,65,68,0.35)';
  for (let i = 0; i < 5 + (h % 3); i++) {
    const px = x + 4 + ((h + i * 9) % 32);
    const py = y + 28 + ((h + i * 7) % 10);
    ctx.beginPath();
    ctx.ellipse(px, py, 2 + (i % 2), 1.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const cx = x + TILE_SIZE / 2 + ((h % 3) - 1) * 2;
  const cy = y + TILE_SIZE / 2 + 1;
  const r = 11 + (h % 4);

  drawRockBoulder3D(ctx, cx, cy, r, h);

  if (h % 5 === 0) {
    drawRockBoulder3D(ctx, x + 10 + (h % 8), y + 28, 5 + (h % 3), h + 1, {
      moss: false,
      secondary: false,
    });
  }
}

function drawTrench(ctx, x, y, h) {
  ctx.fillStyle = '#5d4e37';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = '#4a3f2e';
  ctx.fillRect(x, y + 14, TILE_SIZE, 12);

  ctx.fillStyle = '#3d3425';
  ctx.fillRect(x + 3, y + 16, 34, 8);

  // Sacos de arena
  ctx.fillStyle = '#8B7355';
  for (let i = 0; i < 3; i++) {
    const sx = x + 4 + i * 13 + (h % 3);
    ctx.beginPath();
    ctx.ellipse(sx, y + 13, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b5740';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Tablones / apoyo
  ctx.fillStyle = '#3e2f1f';
  ctx.fillRect(x + 2, y + 24, 36, 2);
  ctx.fillRect(x + 18, y + 10, 2, 16);

  // Alambre de púas
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    const wx = x + 4 + i * 10;
    const wy = y + 11 + (i % 2);
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    for (let s = 0; s < 3; s++) {
      ctx.lineTo(wx + 4 + s * 3, wy - (s % 2 === 0 ? 3 : -3));
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#6b6b6b';
  ctx.fillRect(x + 2, y + 9, 2, 8);
  ctx.fillRect(x + 36, y + 9, 2, 8);
}

function drawSand(ctx, x, y, h) {
  ctx.fillStyle = '#c2b280';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = '#d4c494';
  ctx.fillRect(x + 1, y + 1, 38, 38);

  // Ondas de arena / viento
  ctx.strokeStyle = 'rgba(160,140,90,0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const sy = y + 6 + i * 9 + (h % 4);
    ctx.beginPath();
    ctx.moveTo(x + 2, sy);
    ctx.bezierCurveTo(x + 14, sy + 2, x + 26, sy - 2, x + 38, sy);
    ctx.stroke();
  }

  // Conchas / piedritas en la playa
  if (h % 5 === 0) {
    ctx.fillStyle = 'rgba(200,180,150,0.7)';
    ctx.beginPath();
    ctx.ellipse(x + 10 + (h % 20), y + 20 + (h % 12), 3, 2, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGrassTuft(ctx, px, py, h) {
  for (let i = -2; i <= 2; i++) {
    drawGrassBlade(ctx, px + i * 3, py, h + i, i * 0.6);
  }
}

function drawFern(ctx, px, py, h) {
  ctx.strokeStyle = '#2e6b3a';
  ctx.lineWidth = 1.3;
  for (let i = -2; i <= 2; i++) {
    const lean = i * 2.5;
    ctx.beginPath();
    ctx.moveTo(px, py + 4);
    ctx.quadraticCurveTo(px + lean, py - 2, px + lean * 1.2, py - 9 - (h % 2));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + lean * 0.3, py - 3);
    ctx.lineTo(px + lean * 0.8, py - 7);
    ctx.stroke();
  }
}

function drawMossPatch(ctx, cx, cy, size, h) {
  ctx.fillStyle = h % 2 === 0 ? 'rgba(58,110,68,0.55)' : 'rgba(72,130,78,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.7, size * 0.45, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(90,150,85,0.35)';
  ctx.beginPath();
  ctx.arc(cx - size * 0.2, cy - size * 0.15, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawBush(ctx, px, py, scale = 1) {
  const s = scale;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(px + 4 * s, py + 8 * s, 9 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#245a2c';
  ctx.beginPath();
  ctx.arc(px, py + 2 * s, 6 * s, 0, Math.PI * 2);
  ctx.arc(px + 7 * s, py + 3 * s, 5 * s, 0, Math.PI * 2);
  ctx.arc(px - 6 * s, py + 3 * s, 4.5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3d8a45';
  ctx.beginPath();
  ctx.arc(px + 1 * s, py - 1 * s, 4 * s, 0, Math.PI * 2);
  ctx.arc(px + 8 * s, py + 1 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(120,200,100,0.25)';
  ctx.beginPath();
  ctx.arc(px - 1 * s, py - 2 * s, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawSmallRock(ctx, px, py, h = 0) {
  drawRockBoulder3D(ctx, px, py, 4 + (h % 2), h, { moss: h % 4 === 0, secondary: false });
}

function drawMemorialCross(ctx, cx, cy) {
  ctx.fillStyle = '#bdc3c7';
  ctx.fillRect(cx - 1, cy - 7, 2, 12);
  ctx.fillRect(cx - 4, cy - 4, 8, 2);
  ctx.fillStyle = '#74b9ff';
  ctx.fillRect(cx - 1, cy - 2, 2, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAmmoCrate(ctx, px, py) {
  ctx.fillStyle = '#5d4e37';
  ctx.fillRect(px, py, 14, 10);
  ctx.strokeStyle = '#3e3425';
  ctx.lineWidth = 1;
  ctx.strokeRect(px, py, 14, 10);
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(px + 2, py + 3, 10, 2);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(px + 5, py + 1, 4, 2);
}

function drawDriftwood(ctx, px, py) {
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.quadraticCurveTo(px + 8, py - 4, px + 16, py + 1);
  ctx.stroke();
}

function drawBarbedPost(ctx, px, py) {
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(px, py, 2, 14);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px - 3, py + 4);
  ctx.lineTo(px + 5, py + 6);
  ctx.moveTo(px - 2, py + 8);
  ctx.lineTo(px + 4, py + 10);
  ctx.stroke();
}

export function drawBorderVegetation(ctx, map, col, row, x, y) {
  const h = hash(col, row);
  const tile = map[row][col];
  const rows = map.length;
  const cols = map[0].length;

  if (tile !== 0 && tile !== 1 && tile !== 5) return;

  const neighbors = [
    { dx: 0, dy: -1, ax: 18, ay: 4 },
    { dx: 0, dy: 1, ax: 16, ay: 34 },
    { dx: -1, dy: 0, ax: 4, ay: 18 },
    { dx: 1, dy: 0, ax: 34, ay: 16 },
  ];

  for (const { dx, dy, ax, ay } of neighbors) {
    const nr = row + dy;
    const nc = col + dx;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
    const other = map[nr][nc];

    if (tile === 0 && other === 3 && h % 6 === 0) {
      drawGrassTuft(ctx, x + ax + (h % 6), y + ay + (h % 4), h);
      if (h % 12 === 0) drawSmallRock(ctx, x + ax - 4, y + ay + 6, h);
    }

    if (tile === 0 && other === 2 && h % 5 === 0) {
      drawReedCluster(ctx, x + ax + (h % 8), y + ay, h, false);
    }

    if (tile === 5 && other === 2 && h % 4 === 0) {
      drawReedCluster(ctx, x + ax + (h % 6), y + ay, h, true);
    }

    if (tile === 1 && other === 0 && h % 8 === 0) {
      drawBush(ctx, x + ax + (h % 5), y + ay, 0.75);
    }
  }
}

function drawReedCluster(ctx, px, py, h, sandy) {
  const color = sandy ? 'rgba(130,145,85,0.8)' : 'rgba(48,95,55,0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    const ox = px + i * 4 - 6;
    ctx.beginPath();
    ctx.moveTo(ox, py);
    ctx.quadraticCurveTo(ox + (i - 1.5), py - 7, ox + (i - 2), py - 12 - (h % 2));
    ctx.stroke();
  }
}

export function drawAmbientProp(ctx, tile, x, y, col, row) {
  const h = hash(col, row);

  switch (tile) {
    case 0:
      if (h % 9 === 0) drawBush(ctx, x + 8 + (h % 20), y + 10 + ((h >> 3) % 18));
      if (h % 14 === 0) drawBush(ctx, x + 24 + (h % 10), y + 22 + (h % 6), 0.85);
      if (h % 17 === 0) drawSmallRock(ctx, x + 12 + (h % 16), y + 20 + (h % 12), h);
      if (h % 23 === 0) drawGrassTuft(ctx, x + 6 + (h % 26), y + 14 + (h % 20), h);
      if (h % 41 === 0) drawMemorialCross(ctx, x + 20 + (h % 8), y + 22 + (h % 6));
      break;
    case 1:
      if (h % 29 === 0) drawAmmoCrate(ctx, x + 10 + (h % 14), y + 12 + (h % 10));
      if (h % 43 === 0) drawBarbedPost(ctx, x + 6 + (h % 24), y + 8 + (h % 8));
      if (h % 21 === 0) drawGrassTuft(ctx, x + 20 + (h % 14), y + 28 + (h % 6), h);
      break;
    case 3:
      if (h % 11 === 0) drawMossPatch(ctx, x + 12 + (h % 20), y + 30 + (h % 6), 5, h);
      if (h % 19 === 0) drawGrassTuft(ctx, x + 28 + (h % 8), y + 8 + (h % 10), h);
      break;
    case 4:
      if (h % 17 === 0) drawBarbedPost(ctx, x + 4 + (h % 28), y + 6 + (h % 6));
      if (h % 31 === 0) drawGrassTuft(ctx, x + 30 + (h % 6), y + 4 + (h % 8), h);
      break;
    case 5:
      if (h % 11 === 0) drawDriftwood(ctx, x + 6 + (h % 22), y + 18 + (h % 10));
      if (h % 19 === 0) drawSmallRock(ctx, x + 14 + (h % 12), y + 10 + (h % 14), h);
      if (h % 27 === 0) drawGrassTuft(ctx, x + 8 + (h % 24), y + 26 + (h % 8), h);
      break;
    default:
      break;
  }
}

export { hash as tileHash };
