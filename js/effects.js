/** Efectos visuales de combate: sacudida, daño, marcadores, curación, humo y polvo. */
import { TILE } from './constants.js';

export class EffectsManager {
  constructor() {
    this.shake = 0;
    this.damageFlash = 0;
    this.killMarkers = [];
    this.particles = [];
    this.floatTexts = [];
    this.shakeSeed = 0;
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 16);
    this.damageFlash = Math.max(0, this.damageFlash - dt * 2.4);
    this.shakeSeed += dt * 55;

    for (let i = this.killMarkers.length - 1; i >= 0; i--) {
      this.killMarkers[i].life -= dt;
      if (this.killMarkers[i].life <= 0) {
        this.killMarkers[i] = this.killMarkers[this.killMarkers.length - 1];
        this.killMarkers.pop();
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'smoke') {
        p.vx *= 0.96;
        p.vy *= 0.93;
        p.vy -= 18 * dt;
        p.size += (p.grow || 10) * dt;
      } else {
        p.vy += (p.gravity ?? 120) * dt;
        p.vx *= 0.98;
      }

      if (p.life <= 0) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
      }
    }

    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const f = this.floatTexts[i];
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) {
        this.floatTexts[i] = this.floatTexts[this.floatTexts.length - 1];
        this.floatTexts.pop();
      }
    }
  }

  addExplosionShake(x, y, radius, playerX, playerY) {
    const dist = Math.hypot(x - playerX, y - playerY);
    const falloff = Math.max(0, 1 - dist / Math.max(radius * 3.2, 120));
    const power = 3.5 + falloff * 11 * Math.min(1.4, radius / 70);
    this.shake = Math.min(16, this.shake + power);
  }

  addDamageFlash(amount = 0.38) {
    this.damageFlash = Math.min(0.6, Math.max(this.damageFlash, amount));
  }

  addKillMarker(x, y, isBoss = false) {
    this.killMarkers.push({ x, y, life: isBoss ? 1.15 : 0.5, boss: isBoss });
  }

  addHealEffect(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const speed = 60 + Math.random() * 90;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        color: Math.random() < 0.5 ? '#2ecc71' : '#58d68d',
        size: 3 + Math.random() * 3,
      });
    }
  }

  addGunSmoke(x, y, angle, intensity = 1) {
    const count = Math.floor(3 + intensity * 4);
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.55;
      const a = angle + spread;
      const dist = 16 + Math.random() * 10;
      this.particles.push({
        type: 'smoke',
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist,
        vx: Math.cos(a) * (25 + Math.random() * 35) + (Math.random() - 0.5) * 15,
        vy: Math.sin(a) * (25 + Math.random() * 35) - 20 - Math.random() * 15,
        life: 0.45 + Math.random() * 0.55,
        maxLife: 1,
        size: 3 + Math.random() * 4,
        grow: 10 + Math.random() * 14,
        smokeTone: intensity > 1 ? 0.35 : 0.28,
      });
    }
  }

  addExhaustSmoke(x, y, angle) {
    this.particles.push({
      type: 'smoke',
      x: x - Math.cos(angle) * 14,
      y: y - Math.sin(angle) * 14,
      vx: -Math.cos(angle) * 15 + (Math.random() - 0.5) * 8,
      vy: -Math.sin(angle) * 15 - 8,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      size: 3,
      grow: 8,
      smokeTone: 0.22,
    });
  }

  addFootstepDust(x, y, tileType = TILE.GRASS) {
    const palette = {
      [TILE.SAND]: ['#c2b280', '#a89560'],
      [TILE.PATH]: ['#9a7620', '#7a5a18'],
      [TILE.TRENCH]: ['#6b5740', '#4a3f2e'],
      [TILE.GRASS]: ['#5a8a52', '#3d6b40'],
    };
    const colors = palette[tileType] || palette[TILE.GRASS];
    for (let i = 0; i < 4; i++) {
      const angle = Math.PI * 0.85 + Math.random() * Math.PI * 0.3;
      const speed = 18 + Math.random() * 35;
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() - 0.5) * 8,
        y: y + 6 + Math.random() * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        size: 2 + Math.random() * 2,
        color: colors[i % 2],
        gravity: 80,
      });
    }
  }

  addFloatingText(x, y, text, color = '#2ecc71') {
    this.floatTexts.push({
      x, y, text, color, life: 1.15, maxLife: 1.15, vy: -52,
    });
  }

  getCameraOffset() {
    if (this.shake <= 0.15) return { x: 0, y: 0 };
    const s = this.shake;
    return {
      x: (Math.sin(this.shakeSeed * 1.9) + Math.sin(this.shakeSeed * 3.1)) * s * 0.42,
      y: (Math.cos(this.shakeSeed * 2.2) + Math.cos(this.shakeSeed * 1.4)) * s * 0.42,
    };
  }

  drawWorldMarkers(ctx, camera) {
    for (const p of this.particles) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      const alpha = Math.min(1, p.life / (p.maxLife * 0.55));

      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'smoke') {
        const tone = p.smokeTone ?? 0.3;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size);
        g.addColorStop(0, `rgba(220,220,220,${tone + 0.15})`);
        g.addColorStop(0.5, `rgba(140,140,140,${tone})`);
        g.addColorStop(1, 'rgba(80,80,80,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const f of this.floatTexts) {
      const sx = f.x - camera.x;
      const sy = f.y - camera.y;
      const alpha = Math.min(1, f.life * 1.8);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 3;
      ctx.font = 'bold 15px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(f.text, sx, sy);
      ctx.fillText(f.text, sx, sy);
      ctx.restore();
    }

    for (const m of this.killMarkers) {
      const sx = m.x - camera.x;
      const sy = m.y - camera.y;
      const alpha = Math.min(1, m.life * 2.2);
      const grow = 1 + (m.boss ? 0.6 : 0.45) * (1 - m.life / (m.boss ? 1.15 : 0.5));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = m.boss ? '#f1c40f' : '#e74c3c';
      ctx.fillStyle = m.boss ? '#f1c40f' : '#ffffff';
      ctx.lineWidth = m.boss ? 2.5 : 1.8;
      ctx.font = `bold ${m.boss ? 15 : 12}px Segoe UI, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.boss ? '★' : '✕', sx, sy - 10 * grow);
      ctx.beginPath();
      ctx.arc(sx, sy, (m.boss ? 14 : 9) * grow, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawScreenOverlay(ctx, w, h) {
    if (this.damageFlash <= 0.01) return;
    ctx.fillStyle = `rgba(190, 25, 25, ${this.damageFlash * 0.42})`;
    ctx.fillRect(0, 0, w, h);

    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(100,0,0,${this.damageFlash * 0.38})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}
