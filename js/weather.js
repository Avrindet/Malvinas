export const WEATHER = {
  CLEAR: 'clear',
  WIND: 'wind',
  FOG: 'fog',
  RAIN: 'rain',
};

export class WeatherSystem {
  constructor(baseType = WEATHER.CLEAR) {
    this.baseType = baseType;
    this.type = baseType;
    this.windAngle = Math.random() * Math.PI * 2;
    this.windStrength = 0.015 + Math.random() * 0.025;
    this.time = 0;

    this.fogState = 'idle';
    this.fogActive = false;
    this.fogIntensity = 0.7;
    this.fogTimer = 0;
    this.fogWarningTimer = 0;
    this.fogRollTimer = 8 + Math.random() * 14;
  }

  get fogWarningActive() {
    return this.fogState === 'warning';
  }

  startFogWarning() {
    this.fogState = 'warning';
    this.fogWarningTimer = 5;
    this.fogActive = false;
  }

  triggerFog() {
    this.fogState = 'active';
    this.fogActive = true;
    this.fogIntensity = 0.72 + Math.random() * 0.28;
    this.fogTimer = 18 + Math.random() * 28;
  }

  endFog() {
    this.fogState = 'idle';
    this.fogActive = false;
    this.type = this.baseType;
    this.fogRollTimer = 12 + Math.random() * 18;
  }

  getSpreadBonus() {
    let bonus = 0;
    if (this.baseType === WEATHER.WIND) bonus += 0.06;
    if (this.baseType === WEATHER.RAIN) bonus += 0.03;
    if (this.fogActive) bonus += 0.04 + this.fogIntensity * 0.05;
    return bonus;
  }

  getWindDrift() {
    if (this.baseType !== WEATHER.WIND) return { x: 0, y: 0 };
    return {
      x: Math.cos(this.windAngle) * this.windStrength * 80,
      y: Math.sin(this.windAngle) * this.windStrength * 80,
    };
  }

  getLabel() {
    if (this.fogWarningActive) return 'Niebla aproximándose...';
    if (this.fogActive) {
      const pct = Math.round(this.fogIntensity * 100);
      return `Niebla densa (${pct}%)`;
    }
    const labels = {
      clear: 'Despejado',
      wind: 'Viento patagónico',
      rain: 'Lluvia',
    };
    return labels[this.baseType] || 'Despejado';
  }

  update(dt) {
    this.time += dt;
    if (this.baseType === WEATHER.WIND) {
      this.windAngle += dt * 0.3;
    }

    if (this.fogState === 'active') {
      this.fogTimer -= dt;
      this.fogIntensity = Math.min(1, this.fogIntensity + dt * 0.015);
      if (this.fogTimer <= 0) this.endFog();
    } else if (this.fogState === 'warning') {
      this.fogWarningTimer -= dt;
      if (this.fogWarningTimer <= 0) this.triggerFog();
    } else {
      this.fogRollTimer -= dt;
      if (this.fogRollTimer <= 0) {
        if (Math.random() < 0.32 + Math.random() * 0.18) {
          this.startFogWarning();
        } else {
          this.fogRollTimer = 10 + Math.random() * 16;
        }
      }
    }
  }

  drawOverlay(ctx, w, h) {
    if (this.baseType === WEATHER.RAIN) {
      ctx.strokeStyle = 'rgba(180,200,220,0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 80; i++) {
        const x = ((i * 97 + this.time * 120) % w);
        const y = ((i * 53 + this.time * 200) % h);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4, y + 12);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(100,120,140,0.08)';
      ctx.fillRect(0, 0, w, h);
    }

    if (this.baseType === WEATHER.WIND) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 12; i++) {
        const y = (i / 12) * h;
        const offset = Math.sin(this.time * 2 + i) * 20;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + offset);
        ctx.stroke();
      }
    }

    if (this.fogWarningActive) {
      const pulse = 0.06 + Math.sin(this.time * 4) * 0.03;
      ctx.fillStyle = `rgba(160,170,185,${pulse})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (this.fogActive) {
      ctx.fillStyle = `rgba(140,150,165,${0.12 + this.fogIntensity * 0.18})`;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        const x = (i * 131 + this.time * 15) % w;
        const y = (i * 79 + this.time * 8) % h;
        const r = 60 + (i % 5) * 30;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(180,190,200,${0.08 * this.fogIntensity})`);
        g.addColorStop(1, 'rgba(180,190,200,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
  }
}

export function drawFogVision(ctx, player, camera, canvasW, canvasH, intensity = 0.8) {
  const px = player.x - camera.x;
  const py = player.y - camera.y;
  const maxR = Math.max(canvasW, canvasH);

  const innerClear = Math.max(18, 55 - intensity * 38);
  const midClear = innerClear + 35 - intensity * 15;
  const outerR = maxR * (0.38 + (1 - intensity) * 0.12);

  ctx.fillStyle = `rgba(90, 100, 115, ${0.25 + intensity * 0.2})`;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const grad = ctx.createRadialGradient(px, py, innerClear, px, py, outerR);
  grad.addColorStop(0, 'rgba(160,170,185,0)');
  grad.addColorStop(0.35, `rgba(130,140,155,${0.35 + intensity * 0.25})`);
  grad.addColorStop(0.65, `rgba(100,110,125,${0.55 + intensity * 0.3})`);
  grad.addColorStop(1, `rgba(70,78,92,${0.75 + intensity * 0.2})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  const grad2 = ctx.createRadialGradient(px, py, midClear, px, py, outerR * 0.7);
  grad2.addColorStop(0, 'rgba(200,210,220,0)');
  grad2.addColorStop(1, `rgba(110,120,135,${0.4 + intensity * 0.35})`);
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, canvasW, canvasH);
}
