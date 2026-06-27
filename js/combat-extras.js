import { TILE_SIZE, MORTAR_FIRE_COOLDOWN } from './constants.js';

export const POWERUP_TYPES = {
  MEDKIT: 'medkit',
  ARMOR: 'armor',
  AMMO: 'ammo',
};

export class Grenade {
  constructor(x, y, angle, owner = 'player') {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * 280;
    this.vy = Math.sin(angle) * 280;
    this.owner = owner;
    this.alive = true;
    this.fuse = 1.1;
    this.radius = 75;
    this.damage = 95;
  }

  update(dt, map) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.97;
    this.vy *= 0.97;
    this.fuse -= dt;
    if (this.fuse <= 0) this.alive = false;

    const tx = Math.floor(this.x / TILE_SIZE);
    const ty = Math.floor(this.y / TILE_SIZE);
    if (ty >= 0 && ty < map.length && tx >= 0 && tx < map[0].length) {
      const tile = map[ty][tx];
      if (tile === 2 || tile === 3) this.alive = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e8449';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x - 2, this.y - 4, 3, 0.3, Math.PI + 0.3);
    ctx.stroke();

    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(this.x + 1, this.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Mine {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.alive = true;
    this.radius = 12;
    this.damage = 35;
    this.pulse = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.pulse += dt * 4;
  }

  draw(ctx) {
    const glow = 0.4 + Math.sin(this.pulse) * 0.2;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = `rgba(192, 57, 43, ${glow * 0.25})`;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2c2c2c';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(231, 76, 60, ${glow})`;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.alive = true;
    this.pulse = 0;
    this.radius = 16;
  }

  update(dt) {
    this.pulse += dt * 3;
  }

  apply(player) {
    switch (this.type) {
      case POWERUP_TYPES.MEDKIT:
        player.health = Math.min(player.maxHealth, player.health + 40);
        break;
      case POWERUP_TYPES.ARMOR:
        player.armor = Math.min(100, (player.armor || 0) + 50);
        break;
      case POWERUP_TYPES.AMMO:
        for (const w of player.weapons) {
          w.reserve = Math.min(w.reserve + 30, 120);
        }
        {
          const ammo = player.weapons[player.weaponIndex];
          ammo.clip = Math.min(ammo.clip + 10, player.weapon.clipSize);
        }
        break;
      default: break;
    }
  }

  draw(ctx) {
    const bob = Math.sin(this.pulse) * 3;
    const pulse = 0.55 + Math.sin(this.pulse * 1.4) * 0.25;
    ctx.save();
    ctx.translate(this.x, this.y + bob);

    const colors = {
      medkit: '#e74c3c',
      armor: '#3498db',
      ammo: '#f1c40f',
    };
    const color = colors[this.type] || '#fff';

    ctx.strokeStyle = color;
    ctx.globalAlpha = pulse * 0.45;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + Math.sin(this.pulse) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icons = { medkit: '+', armor: '⛨', ammo: '◆' };
    ctx.fillText(icons[this.type] || '?', 0, 1);
    ctx.restore();
  }
}

export class MortarShell {
  constructor(sx, sy, tx, ty) {
    this.sx = sx;
    this.sy = sy;
    this.tx = tx;
    this.ty = ty;
    this.t = 0;
    this.duration = 1.2;
    this.alive = true;
    this.x = sx;
    this.y = sy;
  }

  update(dt) {
    this.t += dt / this.duration;
    if (this.t >= 1) {
      this.alive = false;
      return { x: this.tx, y: this.ty };
    }
    this.x = this.sx + (this.tx - this.sx) * this.t;
    this.y = this.sy + (this.ty - this.sy) * this.t - Math.sin(this.t * Math.PI) * 90;
    return null;
  }

  draw(ctx) {
    ctx.strokeStyle = 'rgba(230,126,34,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.sx, this.sy);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e67e22';
    ctx.shadowColor = '#e67e22';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export class MortarEmplacement {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.placed = true;
    this.active = true;
    this.cooldown = 0;
    this.angle = 0;
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
  }

  canFire() {
    return this.placed && this.active && this.cooldown <= 0;
  }

  fireAt(tx, ty) {
    this.angle = Math.atan2(ty - this.y, tx - this.x);
    this.cooldown = MORTAR_FIRE_COOLDOWN;
    return new MortarShell(this.x, this.y - 8, tx, ty);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3d4a3d';
    ctx.fillRect(-12, -2, 24, 10);
    ctx.strokeStyle = '#2c3e2c';
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, -2, 24, 10);

    ctx.save();
    ctx.rotate(this.angle);
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(-4, -14, 8, 18);
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(-3, -20, 6, 8);
    ctx.restore();

    if (!this.active) {
      ctx.fillStyle = 'rgba(231,76,60,0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function spawnMinesOnMap(map) {
  const mines = [];
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[0].length; col++) {
      if (map[row][col] === 4 && Math.random() < 0.15) {
        mines.push(new Mine(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
        ));
      }
    }
  }
  return mines;
}
