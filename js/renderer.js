import { TILE, TILE_SIZE, COLORS } from './constants.js';
import { drawTileDetail, drawAmbientProp, drawBorderVegetation, tileHash } from './sprites.js';
import { SKY_PRESETS } from './atmosphere.js';

function shadeMapEdges(ctx, map) {
  const rows = map.length;
  const cols = map[0].length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tile = map[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      const neighbors = [
        { dx: 0, dy: -1, edge: 'top' },
        { dx: 1, dy: 0, edge: 'right' },
        { dx: 0, dy: 1, edge: 'bottom' },
        { dx: -1, dy: 0, edge: 'left' },
      ];

      for (const { dx, dy, edge } of neighbors) {
        const nr = row + dy;
        const nc = col + dx;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const other = map[nr][nc];
        if (other === tile) continue;

        const isLower = other === TILE.WATER || (tile === TILE.GRASS && other === TILE.SAND);
        const isRaised = other === TILE.ROCK || (tile === TILE.WATER && other !== TILE.WATER);
        const rockCast = other === TILE.ROCK && tile !== TILE.ROCK;
        const alpha = rockCast ? 0.2 : isLower ? 0.14 : isRaised ? 0.1 : 0.07;

        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        if (edge === 'top') ctx.fillRect(x, y, TILE_SIZE, 3);
        if (edge === 'bottom') ctx.fillRect(x, y + TILE_SIZE - 3, TILE_SIZE, 3);
        if (edge === 'left') ctx.fillRect(x, y, 3, TILE_SIZE);
        if (edge === 'right') ctx.fillRect(x + TILE_SIZE - 3, y, 3, TILE_SIZE);
      }
    }
  }
}

export function buildMapCache(map) {
  const width = map[0].length * TILE_SIZE;
  const height = map.length * TILE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[0].length; col++) {
      const tile = map[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      ctx.fillStyle = COLORS[tile] || COLORS[TILE.GRASS];
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      drawTileDetail(ctx, tile, x, y, col, row);
      drawAmbientProp(ctx, tile, x, y, col, row);
      drawBorderVegetation(ctx, map, col, row, x, y);
    }
  }

  shadeMapEdges(ctx, map);

  return { canvas, width, height };
}

export function drawSkyBackground(ctx, w, h, atmosphere, time) {
  const preset = SKY_PRESETS[atmosphere?.period] || SKY_PRESETS.day;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, preset.top);
  grad.addColorStop(1, preset.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const cloudCount = atmosphere?.period === 'night' ? 4 : 7;
  for (let i = 0; i < cloudCount; i++) {
    const speed = 0.012 + i * 0.004;
    const baseX = ((time * speed + i * 137) % (w + 200)) - 100;
    const baseY = 30 + (i * 47) % Math.max(80, h * 0.35);
    const scale = 0.7 + (i % 3) * 0.25;
    drawCloud(ctx, baseX, baseY, 60 * scale, preset.cloud);
  }

  if (atmosphere?.period === 'night') {
    for (let i = 0; i < 28; i++) {
      const sx = (i * 97 + 13) % w;
      const sy = (i * 53 + 7) % (h * 0.45);
      ctx.fillStyle = `rgba(255,255,255,${0.25 + (i % 5) * 0.08})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }
}

function drawCloud(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
  ctx.arc(x + size * 0.3, y - size * 0.08, size * 0.28, 0, Math.PI * 2);
  ctx.arc(x + size * 0.55, y + size * 0.05, size * 0.32, 0, Math.PI * 2);
  ctx.arc(x + size * 0.2, y + size * 0.12, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAtmosphereTint(ctx, w, h, atmosphere) {
  const preset = SKY_PRESETS[atmosphere?.period] || SKY_PRESETS.day;
  if (preset.tint) {
    ctx.fillStyle = preset.tint;
    ctx.fillRect(0, 0, w, h);
  }
}

export function drawMapAmbience(ctx, map, camera, canvasW, canvasH, time) {
  if (!map?.length) return;

  const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
  const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
  const endCol = Math.min(map[0].length, Math.ceil((camera.x + canvasW) / TILE_SIZE) + 1);
  const endRow = Math.min(map.length, Math.ceil((camera.y + canvasH) / TILE_SIZE) + 1);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = map[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      const h = tileHash(col, row);

      if (tile === TILE.WATER) {
        const phase = time * 0.002 + h * 0.01;
        ctx.strokeStyle = `rgba(255,255,255,${0.12 + Math.sin(phase) * 0.06})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
          const wy = y + 12 + i * 14 + Math.sin(phase + i) * 2;
          ctx.beginPath();
          ctx.moveTo(x + 4, wy);
          ctx.quadraticCurveTo(x + 20, wy - 4 + Math.sin(phase * 1.3) * 2, x + 36, wy);
          ctx.stroke();
        }
      }

      if (tile === TILE.GRASS && h % 5 === 0) {
        const sway = Math.sin(time * 0.003 + h) * 1.8;
        const px = x + 8 + (h % 24);
        const py = y + 6 + (h % 20);
        drawAnimatedGrassBlade(ctx, px, py, sway, h);
      }

      if (tile === TILE.GRASS && h % 7 === 0) {
        const sway = Math.sin(time * 0.0025 + h * 1.3) * 1.2;
        const px = x + 22 + (h % 14);
        const py = y + 14 + (h % 16);
        drawAnimatedGrassBlade(ctx, px, py, sway, h + 3, '#3a8a48');
      }
    }
  }

  drawWaterEdgeReeds(ctx, map, startCol, startRow, endCol, endRow, time);

  ctx.restore();
}

function drawAnimatedGrassBlade(ctx, px, py, sway, seed, color = '#2d6b34') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px, py + 6);
  ctx.quadraticCurveTo(px + sway, py + 1, px + sway * 0.6, py - 6 - (seed % 3));
  ctx.stroke();
  if (seed % 4 === 0) {
    ctx.strokeStyle = 'rgba(82,160,90,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 3, py + 5);
    ctx.quadraticCurveTo(px + sway + 2, py, px + sway, py - 4);
    ctx.stroke();
  }
}

function drawWaterEdgeReeds(ctx, map, startCol, startRow, endCol, endRow, time) {
  const rows = map.length;
  const cols = map[0].length;

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = map[row][col];
      if (tile !== TILE.GRASS && tile !== TILE.SAND) continue;

      const h = tileHash(col, row);
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      const neighbors = [
        { dx: 0, dy: -1, side: 'top' },
        { dx: 0, dy: 1, side: 'bottom' },
        { dx: -1, dy: 0, side: 'left' },
        { dx: 1, dy: 0, side: 'right' },
      ];

      for (const { dx, dy, side } of neighbors) {
        const nr = row + dy;
        const nc = col + dx;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (map[nr][nc] !== TILE.WATER) continue;
        if (h % 4 !== 0) continue;

        const sway = Math.sin(time * 0.002 + h + col) * 2;
        const bx = side === 'left' ? x + 4 : side === 'right' ? x + 34 : x + 10 + (h % 20);
        const by = side === 'top' ? y + 6 : side === 'bottom' ? y + 30 : y + 10 + (h % 18);

        ctx.strokeStyle = tile === TILE.SAND ? 'rgba(140,160,90,0.65)' : 'rgba(55,110,60,0.75)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
          const ox = bx + i * 5;
          ctx.beginPath();
          ctx.moveTo(ox, by);
          ctx.quadraticCurveTo(ox + sway, by - 8, ox + sway * 0.5, by - 14 - (i % 2) * 3);
          ctx.stroke();
        }
      }
    }
  }
}

export function drawAtmosphericVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.22, w / 2, h / 2, w * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(8,18,28,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function drawMapCached(ctx, cache, camera, canvasW, canvasH) {
  ctx.drawImage(
    cache.canvas,
    camera.x, camera.y, canvasW, canvasH,
    0, 0, canvasW, canvasH,
  );
}

export function buildMinimapCache(map, mapW, mapH) {
  const canvas = document.createElement('canvas');
  canvas.width = mapW;
  canvas.height = mapH;
  const ctx = canvas.getContext('2d');
  const scaleX = mapW / (map[0].length * TILE_SIZE);
  const scaleY = mapH / (map.length * TILE_SIZE);

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[0].length; col++) {
      ctx.fillStyle = COLORS[map[row][col]] || '#333';
      ctx.fillRect(
        col * TILE_SIZE * scaleX,
        row * TILE_SIZE * scaleY,
        TILE_SIZE * scaleX + 1,
        TILE_SIZE * scaleY + 1,
      );
    }
  }

  return { canvas, scaleX, scaleY, width: mapW, height: mapH };
}

export function drawCrosshair(ctx, mouseX, mouseY) {
  ctx.save();
  ctx.strokeStyle = 'rgba(116,185,255,0.35)';
  ctx.lineWidth = 3;
  const size = 14;
  ctx.beginPath();
  ctx.moveTo(mouseX - size, mouseY);
  ctx.lineTo(mouseX - 5, mouseY);
  ctx.moveTo(mouseX + 5, mouseY);
  ctx.lineTo(mouseX + size, mouseY);
  ctx.moveTo(mouseX, mouseY - size);
  ctx.lineTo(mouseX, mouseY - 5);
  ctx.moveTo(mouseX, mouseY + 5);
  ctx.lineTo(mouseX, mouseY + size);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mouseX - size, mouseY);
  ctx.lineTo(mouseX - 5, mouseY);
  ctx.moveTo(mouseX + 5, mouseY);
  ctx.lineTo(mouseX + size, mouseY);
  ctx.moveTo(mouseX, mouseY - size);
  ctx.lineTo(mouseX, mouseY - 5);
  ctx.moveTo(mouseX, mouseY + 5);
  ctx.lineTo(mouseX, mouseY + size);
  ctx.stroke();

  ctx.fillStyle = 'rgba(241,196,15,0.85)';
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

const WARNING_STYLES = {
  fog: { bg: '#4a5568', border: '#bdc3c7', text: '#ecf0f1', sub: '#d5dbdb' },
  attack: { bg: '#7b241c', border: '#e74c3c', text: '#ffffff', sub: '#fadbd8' },
  boss: { bg: '#7d6608', border: '#f1c40f', text: '#ffffff', sub: '#fdebd0' },
};

export function drawWarningSign(ctx, text, type, timer, duration, canvasW, canvasH, frameTime, yOffset = 0) {
  if (timer <= 0) return;

  const portrait = canvasH > canvasW;
  const fadeIn = Math.min(1, (duration - timer) / 0.35);
  const fadeOut = Math.min(1, timer / 0.45);
  const alpha = Math.min(fadeIn, fadeOut);
  const blink = type === 'attack' ? 0.75 + Math.sin(frameTime * 0.012) * 0.25 : 1;

  const style = WARNING_STYLES[type] || WARNING_STYLES.attack;
  const boxW = Math.min(portrait ? canvasW - 36 : 480, canvasW - 20);
  const boxH = portrait ? (type === 'fog' ? 50 : 44) : (type === 'fog' ? 60 : 52);
  const x = (canvasW - boxW) / 2;
  const y = (portrait ? 106 : 68) + yOffset;

  ctx.save();
  ctx.globalAlpha = alpha * blink;

  ctx.fillStyle = style.bg;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 8);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, boxW, boxH);
  }

  ctx.strokeStyle = style.border;
  ctx.lineWidth = portrait ? 2 : 3;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 8);
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, boxW, boxH);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = style.text;
  ctx.font = `bold ${portrait ? 12 : 16}px Segoe UI, sans-serif`;
  const mainY = type === 'fog' ? y + boxH / 2 - 8 : y + boxH / 2 - (portrait ? 5 : 6);
  wrapHintText(ctx, text, canvasW / 2, mainY, boxW - 20, portrait ? 14 : 16);

  if (type === 'fog') {
    ctx.fillStyle = style.sub;
    ctx.font = `${portrait ? 10 : 12}px Segoe UI, sans-serif`;
    ctx.fillText('Visibilidad reducida', canvasW / 2, y + boxH - 10);
  }

  ctx.restore();
}

export function drawOutOfAmmoHint(ctx, canvasW, canvasH, weaponName) {
  const boxW = Math.min(400, canvasW - 32);
  const x = (canvasW - boxW) / 2;
  const y = canvasH - 52;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, 36, 6);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, boxW, 36);
  }
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, 36, 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 13px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Sin munición (${weaponName}) — [B] Comprar balas`, canvasW / 2, y + 18);
  ctx.restore();
}

export function drawTutorialHint(ctx, hint, canvasW, canvasH, woundedActive = false) {
  if (!hint) return;

  const boxW = Math.min(480, canvasW - 40);
  const boxH = 78;
  const x = (canvasW - boxW) / 2;
  const y = canvasH - 118 - (woundedActive ? 42 : 0);

  ctx.save();
  ctx.fillStyle = 'rgba(8, 22, 40, 0.88)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 8);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, boxW, boxH);
  }
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 2;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 8);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#74b9ff';
  ctx.font = 'bold 12px Segoe UI, sans-serif';
  ctx.fillText(hint.title, canvasW / 2, y + 22);
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '13px Segoe UI, sans-serif';
  wrapHintText(ctx, hint.text, canvasW / 2, y + 42, boxW - 32, 16);
  ctx.fillStyle = '#95a5a6';
  ctx.font = '11px Segoe UI, sans-serif';
  ctx.fillText('[Espacio] Omitir paso', canvasW / 2, y + boxH - 10);
  ctx.restore();
}

function wrapHintText(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, centerX, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, centerX, y);
}

export function drawWoundedPointer(ctx, target, camera, canvasW, canvasH, frameTime) {
  if (!target) return;

  const sx = target.x - camera.x;
  const sy = target.y - camera.y;
  const margin = 52;
  const onScreen = sx >= margin && sx <= canvasW - margin
    && sy >= margin && sy <= canvasH - margin;
  const bob = Math.sin(frameTime * 0.006) * 5;

  ctx.save();

  if (onScreen) {
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(canvasW / 2, canvasH / 2);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.translate(sx, sy - 34 + bob);
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-10, -4);
    ctx.lineTo(10, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const dx = sx - cx;
    const dy = sy - cy;
    const pad = 36;
    const tX = dx !== 0 ? Math.abs((dx > 0 ? canvasW - pad - cx : pad - cx) / dx) : Infinity;
    const tY = dy !== 0 ? Math.abs((dy > 0 ? canvasH - pad - cy : pad - cy) / dy) : Infinity;
    const t = Math.min(tX, tY);
    const ex = cx + dx * t;
    const ey = cy + dy * t;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(192, 57, 43, 0.92)';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HERIDO', ex, ey - 18 + bob * 0.3);
  }

  ctx.restore();
}

export function drawWoundedHint(ctx, canvasW, canvasH) {
  const portrait = canvasH > canvasW;
  const boxW = Math.min(portrait ? canvasW - 32 : 400, canvasW - 24);
  const boxH = portrait ? 46 : 54;
  const x = (canvasW - boxW) / 2;
  const y = portrait ? 102 : 68;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 8);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, boxW, boxH);
  }
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 8);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b6b';
  ctx.font = `bold ${portrait ? 12 : 15}px Segoe UI, sans-serif`;
  ctx.fillText('⚠ Compañero herido — curá con E', canvasW / 2, y + (portrait ? 18 : 22));
  ctx.fillStyle = '#f1c40f';
  ctx.font = `${portrait ? 10 : 11}px Segoe UI, sans-serif`;
  ctx.fillText('Oleadas en pausa', canvasW / 2, y + (portrait ? 34 : 40));
  ctx.restore();
}

export function drawMissionBriefing(ctx, level, timer, duration, canvasW, canvasH) {
  if (timer <= 0) return;

  const fadeIn = Math.min(1, (duration - timer) / 0.4);
  const fadeOut = timer < 1.2 ? timer / 1.2 : 1;
  const alpha = Math.min(fadeIn, fadeOut);
  if (alpha <= 0) return;

  const objectives = level.objectives || [];
  const panelW = Math.min(560, canvasW - 40);
  const lineH = 22;
  const objH = objectives.length * lineH;
  const panelH = 200 + objH;
  const x = (canvasW - panelW) / 2;
  const y = (canvasH - panelH) / 2;

  ctx.save();
  ctx.globalAlpha = alpha * 0.92;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(12, 18, 28, 0.94)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, panelW, panelH, 10);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, panelW, panelH);
  }

  ctx.strokeStyle = '#74b9ff';
  ctx.lineWidth = 3;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, panelW, panelH, 10);
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, panelW, panelH);
  }

  let ty = y + 28;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#74b9ff';
  ctx.font = 'bold 11px Segoe UI, sans-serif';
  ctx.fillText('EN SU MEMORIA', canvasW / 2, ty);
  ty += 22;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Segoe UI, sans-serif';
  ctx.fillText(level.name, canvasW / 2, ty);
  ty += 20;

  ctx.fillStyle = '#95a5a6';
  ctx.font = '13px Segoe UI, sans-serif';
  ctx.fillText(level.region, canvasW / 2, ty);
  ty += 28;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#bdc3c7';
  ctx.font = '14px Segoe UI, sans-serif';
  const context = level.briefing || level.description;
  ty = wrapText(ctx, context, x + 24, ty, panelW - 48, 20) + 16;

  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 12px Segoe UI, sans-serif';
  ctx.fillText('OBJETIVOS', x + 24, ty);
  ty += 20;

  ctx.fillStyle = '#ecf0f1';
  ctx.font = '14px Segoe UI, sans-serif';
  for (const obj of objectives) {
    ctx.fillText(`▸ ${obj}`, x + 28, ty);
    ty += lineH;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#888';
  ctx.font = '12px Segoe UI, sans-serif';
  const hint = timer > 1.5 ? 'Clic o Espacio para comenzar' : '¡Adelante!';
  ctx.fillText(hint, canvasW / 2, y + panelH - 16);

  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

export function drawLevelBanner(ctx, text, timer, canvasW, canvasH) {
  const fadeIn = Math.min(1, (3 - timer) / 0.3);
  const fadeOut = Math.min(1, timer / 0.5);
  const alpha = Math.min(fadeIn, fadeOut);
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  const boxW = Math.min(canvasW * 0.6, text.length * 16 + 80);
  const boxH = 56;
  const x = (canvasW - boxW) / 2;
  const y = (canvasH - boxH) / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 8);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, boxW, boxH);
  }

  ctx.fillStyle = '#74b9ff';
  ctx.font = 'bold 24px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvasW / 2, canvasH / 2);

  ctx.restore();
}

export function drawMortarPreview(ctx, camera, player, wx, wy, mortar, canPlace) {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  if (!mortar?.placed) {
    ctx.strokeStyle = canPlace ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, 340, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = canPlace ? 'rgba(46, 204, 113, 0.35)' : 'rgba(231, 76, 60, 0.35)';
    ctx.beginPath();
    ctx.arc(wx, wy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = canPlace ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#e67e22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ctx.canvas.width / 2 - 10, ctx.canvas.height / 2);
  ctx.lineTo(ctx.canvas.width / 2 + 10, ctx.canvas.height / 2);
  ctx.moveTo(ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);
  ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height / 2 + 10);
  ctx.stroke();
  ctx.restore();
}

export function drawMinimap(minimapCtx, cache, player, allies, enemies) {
  minimapCtx.drawImage(cache.canvas, 0, 0);

  const { scaleX, scaleY } = cache;

  for (const ally of allies) {
    if (ally.rescued && ally.wounded) {
      minimapCtx.fillStyle = '#e74c3c';
      minimapCtx.fillRect(ally.x * scaleX - 3, ally.y * scaleY - 3, 6, 6);
    } else if (ally.rescued && ally.alive) {
      minimapCtx.fillStyle = '#2ecc71';
      minimapCtx.fillRect(ally.x * scaleX - 2, ally.y * scaleY - 2, 4, 4);
    } else if (!ally.rescued) {
      minimapCtx.fillStyle = '#3498db';
      minimapCtx.fillRect(ally.x * scaleX - 2, ally.y * scaleY - 2, 4, 4);
    }
  }

  for (const enemy of enemies) {
    if (enemy.alive) {
      const colors = { cannon: '#8e44ad', sniper: '#9b59b6', vehicle: '#d35400', boss: '#ffd700', soldier: '#e74c3c' };
      minimapCtx.fillStyle = colors[enemy.type] || '#e74c3c';
      const s = enemy.type === 'boss' ? 6 : enemy.type === 'vehicle' || enemy.type === 'cannon' ? 5 : 3;
      minimapCtx.fillRect(enemy.x * scaleX - s / 2, enemy.y * scaleY - s / 2, s, s);
    }
  }

  minimapCtx.fillStyle = '#2ecc71';
  minimapCtx.beginPath();
  minimapCtx.arc(player.x * scaleX, player.y * scaleY, 3, 0, Math.PI * 2);
  minimapCtx.fill();
}
