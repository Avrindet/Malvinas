import {
  PLAYER_SPEED, PLAYER_RADIUS, WEAPONS, RESCUE_RANGE,
  ALLY_RADIUS, ALLY_SPEED, ALLY_SHOOT_RANGE, ALLY_SHOOT_COOLDOWN,
  ALLY_DAMAGE, ALLY_FORMATION_RADIUS,
  GRENADE_MAX, GRENADE_COOLDOWN, BOSS_CONFIGS,
  RECAPTURE_TIME, ALLY_MAX_HEALTH,
} from './constants.js';
import { checkCollision } from './levels.js';
import {
  drawSoldierPlayer, drawSoldierEnemy, drawSoldierAlly,
  drawSoldierCompanion, drawCannon, drawSniper, drawVehicle, drawBoss,
  drawBullet, drawExplosion, drawMuzzleFlash,
} from './sprites.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.health = 100;
    this.maxHealth = 100;
    this.armor = 0;
    this.angle = 0;
    this.inTrench = false;
    this.weaponIndex = 0;
    this.weapons = WEAPONS.map((w) => ({ clip: w.clipSize, reserve: w.reserve }));
    this.lastFire = 0;
    this.reloading = false;
    this.reloadStart = 0;
    this.alive = true;
    this.grenades = GRENADE_MAX;
    this.grenadeCooldown = 0;
    this.weatherSpread = 0;
    this.muzzleFlash = 0;
  }

  get weapon() { return WEAPONS[this.weaponIndex]; }
  get ammoState() { return this.weapons[this.weaponIndex]; }

  update(dt, input, map, camera) {
    if (!this.alive) return;
    const worldMouseX = input.mouse.x + camera.x;
    const worldMouseY = input.mouse.y + camera.y;
    this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

    let dx = 0; let dy = 0;
    if (input.isDown('KeyW')) dy -= 1;
    if (input.isDown('KeyS')) dy += 1;
    if (input.isDown('KeyA')) dx -= 1;
    if (input.isDown('KeyD')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len; dy /= len;
      const speed = this.inTrench ? PLAYER_SPEED * 0.5 : PLAYER_SPEED;
      const nx = this.x + dx * speed * dt;
      const ny = this.y + dy * speed * dt;
      if (!checkCollision(map, nx, this.y, PLAYER_RADIUS)) this.x = nx;
      if (!checkCollision(map, this.x, ny, PLAYER_RADIUS)) this.y = ny;
    }

    this.inTrench = input.isDown('KeyF');
    for (let i = 0; i < 4; i++) {
      if (input.isDown(`Digit${i + 1}`)) this.switchWeapon(i);
    }
    if (input.isDown('KeyR') && !this.reloading) this.startReload();
    if (this.reloading && performance.now() - this.reloadStart >= this.weapon.reloadTime) {
      this.finishReload();
    }
    if (this.grenadeCooldown > 0) this.grenadeCooldown -= dt;
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
  }

  canThrowGrenade() {
    return this.grenades > 0 && this.grenadeCooldown <= 0;
  }

  throwGrenade() {
    this.grenades--;
    this.grenadeCooldown = GRENADE_COOLDOWN;
    return { x: this.x, y: this.y, angle: this.angle };
  }

  switchWeapon(index) {
    if (index >= 0 && index < WEAPONS.length && index !== this.weaponIndex) {
      this.weaponIndex = index;
      this.reloading = false;
    }
  }

  canFire(now) {
    if (this.reloading) return false;
    if (this.ammoState.clip <= 0) { this.startReload(); return false; }
    return now - this.lastFire >= this.weapon.fireRate;
  }

  fire(now) {
    this.lastFire = now;
    this.muzzleFlash = 0.09;
    this.ammoState.clip--;
    const spread = (Math.random() - 0.5) * (this.weapon.spread + this.weatherSpread) * 2;
    return {
      x: this.x + Math.cos(this.angle) * (PLAYER_RADIUS + 4),
      y: this.y + Math.sin(this.angle) * (PLAYER_RADIUS + 4),
      angle: this.angle + spread,
      damage: this.weapon.damage,
      speed: this.weapon.bulletSpeed,
      explosive: this.weapon.explosive || false,
      radius: this.weapon.radius || 0,
      owner: 'player',
    };
  }

  startReload() {
    const ammo = this.ammoState;
    if (ammo.clip >= this.weapon.clipSize || ammo.reserve <= 0) return;
    this.reloading = true;
    this.reloadStart = performance.now();
  }

  finishReload() {
    const ammo = this.ammoState;
    const toLoad = Math.min(this.weapon.clipSize - ammo.clip, ammo.reserve);
    ammo.clip += toLoad;
    ammo.reserve -= toLoad;
    this.reloading = false;
  }

  isOutOfAmmo() {
    const ammo = this.ammoState;
    return ammo.clip <= 0 && ammo.reserve <= 0;
  }

  /** Tamaño del paquete de compra según el arma. */
  getAmmoPackSize() {
    return WEAPONS[this.weaponIndex].reserve;
  }

  purchaseAmmoPack() {
    const pack = this.getAmmoPackSize();
    this.ammoState.reserve += pack;
    this.reloading = false;
    if (this.ammoState.clip < this.weapon.clipSize && this.ammoState.reserve > 0) {
      this.startReload();
    }
    return pack;
  }

  takeDamage(amount) {
    let dmg = this.inTrench ? amount * 0.4 : amount;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, dmg * 0.6);
      this.armor -= absorbed;
      dmg -= absorbed;
    }
    this.health -= dmg;
    if (this.health <= 0) { this.health = 0; this.alive = false; }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    drawSoldierPlayer(ctx, this.angle, this.inTrench);
    if (this.muzzleFlash > 0) {
      drawMuzzleFlash(ctx, this.angle, this.muzzleFlash, 'player');
    }
    if (this.armor > 0) {
      ctx.strokeStyle = `rgba(52,152,219,${0.3 + this.armor / 200})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class Ally {
  constructor(x, y, slotIndex, options = {}) {
    this.x = x; this.y = y; this.slotIndex = slotIndex;
    this.spawnX = x; this.spawnY = y;
    this.rescued = false; this.active = false; this.alive = true;
    this.health = ALLY_MAX_HEALTH; this.maxHealth = ALLY_MAX_HEALTH;
    this.wounded = false; this.pulse = 0; this.angle = 0; this.shootCooldown = 0;
    this.woundedAt = 0;
    this.recaptureTimer = 0;
    this.isMortarOperator = !!options.isMortarOperator;
    this.atMortar = false;
    this.movingToMortar = false;
    this.mortarTargetX = 0;
    this.mortarTargetY = 0;
    this.muzzleFlash = 0;
  }

  getFormationPoint(player) {
    const a = player.angle + Math.PI + (this.slotIndex - 1.5) * 0.55;
    return { x: player.x + Math.cos(a) * ALLY_FORMATION_RADIUS, y: player.y + Math.sin(a) * ALLY_FORMATION_RADIUS };
  }

  findNearestEnemy(enemies) {
    let nearest = null; let minDist = ALLY_SHOOT_RANGE;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d < minDist) { minDist = d; nearest = e; }
    }
    return nearest;
  }

  moveToward(tx, ty, dt, map, speed) {
    const dx = tx - this.x; const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return;
    const nx = dx / dist; const ny = dy / dist;
    const newX = this.x + nx * speed * dt;
    const newY = this.y + ny * speed * dt;
    if (!checkCollision(map, newX, this.y, ALLY_RADIUS)) this.x = newX;
    if (!checkCollision(map, this.x, newY, ALLY_RADIUS)) this.y = newY;
  }

  update(dt, player, map, enemies, bullets) {
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    if (!this.rescued) { this.pulse += dt * 3; return; }
    if (this.wounded) { this.pulse += dt * 4; return; }
    if (!this.active || !this.alive) return;

    if (this.movingToMortar) {
      this.moveToward(this.mortarTargetX, this.mortarTargetY, dt, map, ALLY_SPEED * 1.25);
      if (Math.hypot(this.mortarTargetX - this.x, this.mortarTargetY - this.y) < 10) {
        this.movingToMortar = false;
        this.atMortar = true;
        this.x = this.mortarTargetX;
        this.y = this.mortarTargetY;
      }
      return;
    }

    if (this.atMortar) return;

    const formation = this.getFormationPoint(player);
    const target = this.findNearestEnemy(enemies);
    if (target) {
      this.angle = Math.atan2(target.y - this.y, target.x - this.x);
      const distToEnemy = Math.hypot(target.x - this.x, target.y - this.y);
      if (distToEnemy > 100) this.moveToward(target.x, target.y, dt, map, ALLY_SPEED * 0.85);
      else if (distToEnemy < 50) {
        this.moveToward(this.x - Math.cos(this.angle) * 40, this.y - Math.sin(this.angle) * 40, dt, map, ALLY_SPEED * 0.6);
      }
      this.shootCooldown -= dt;
      if (this.shootCooldown <= 0 && distToEnemy < ALLY_SHOOT_RANGE) {
        this.shootCooldown = ALLY_SHOOT_COOLDOWN + Math.random() * 0.25;
        this.muzzleFlash = 0.08;
        this.smokeEmit = true;
        bullets.push(new Bullet({
          x: this.x + Math.cos(this.angle) * 12, y: this.y + Math.sin(this.angle) * 12,
          angle: this.angle + (Math.random() - 0.5) * 0.08,
          damage: ALLY_DAMAGE, speed: 520, explosive: false, radius: 0, owner: 'ally',
        }));
      }
    } else {
      this.angle = player.angle;
      this.moveToward(formation.x, formation.y, dt, map, ALLY_SPEED);
    }
  }

  canRescue(player) {
    return !this.rescued && this.alive && Math.hypot(player.x - this.x, player.y - this.y) < RESCUE_RANGE;
  }

  rescue() {
    this.rescued = true;
    this.active = true;
    this.wounded = false;
    this.health = this.maxHealth;
    this.recaptureTimer = 0;
  }

  recapture() {
    this.rescued = false;
    this.active = false;
    this.wounded = false;
    this.health = this.maxHealth;
    this.atMortar = false;
    this.movingToMortar = false;
    this.recaptureTimer = 0;
    this.x = this.spawnX;
    this.y = this.spawnY;
  }

  isBeingRecaptured() {
    return this.rescued && this.recaptureTimer > 0;
  }

  getRecaptureProgress() {
    return Math.min(1, this.recaptureTimer / RECAPTURE_TIME);
  }

  canHeal(player) {
    return this.rescued && this.wounded
      && Math.hypot(player.x - this.x, player.y - this.y) < RESCUE_RANGE;
  }

  heal() {
    this.wounded = false;
    this.active = true;
    this.health = this.maxHealth;
  }

  takeDamage(amount) {
    if (this.wounded) return null;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.wounded = true;
      this.active = false;
      return 'wounded';
    }
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (!this.rescued) {
      drawSoldierAlly(ctx, this.pulse);
      if (this.isMortarOperator) {
        ctx.fillStyle = '#e67e22';
        ctx.font = 'bold 10px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('🎯', 0, -22);
      }
    } else if (this.wounded) {
      drawSoldierCompanion(ctx, this.angle);
      const glow = 0.5 + Math.sin(this.pulse) * 0.25;
      ctx.globalAlpha = glow * 0.55;
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ff3838';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 22 + Math.sin(this.pulse * 1.5) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Segoe UI';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', 0, 1);
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 9px Segoe UI';
      ctx.fillText('HERIDO', 0, -28);
    } else if (this.alive) {
      drawSoldierCompanion(ctx, this.angle);
      if (this.muzzleFlash > 0) {
        drawMuzzleFlash(ctx, this.angle, this.muzzleFlash, 'ally');
      }
      if (this.isMortarOperator && !this.atMortar) {
        ctx.fillStyle = '#e67e22';
        ctx.font = 'bold 9px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('ART', 0, -20);
      }
      if (this.isBeingRecaptured()) {
        const p = this.getRecaptureProgress();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-16, -26, 32, 5);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-16, -26, 32 * p, 5);
      }
    }
    ctx.restore();
  }
}

function pickTarget(player, allies, self) {
  let tx = player.x; let ty = player.y;
  let nearest = Math.hypot(player.x - self.x, player.y - self.y);
  for (const a of allies) {
    if (!a.active || !a.alive || a.wounded) continue;
    const d = Math.hypot(a.x - self.x, a.y - self.y);
    if (d < nearest) { nearest = d; tx = a.x; ty = a.y; }
  }
  return { x: tx, y: ty, dist: nearest };
}

export class Enemy {
  constructor(x, y) {
    this.type = 'soldier'; this.x = x; this.y = y;
    this.health = 50; this.speed = 80 + Math.random() * 40;
    this.alive = true; this.shootCooldown = 0; this.angle = 0;
    this.muzzleFlash = 0;
  }
  getHitRadius() { return 14; }
  update(dt, player, map, bullets, allies) {
    if (!this.alive) return;
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    const t = pickTarget(player, allies, this);
    const dx = t.x - this.x; const dy = t.y - this.y;
    this.angle = Math.atan2(dy, dx);
    if (t.dist > 60) {
      const nx = dx / t.dist; const ny = dy / t.dist;
      const newX = this.x + nx * this.speed * dt;
      const newY = this.y + ny * this.speed * dt;
      if (!checkCollision(map, newX, this.y, 12)) this.x = newX;
      if (!checkCollision(map, this.x, newY, 12)) this.y = newY;
    }
    this.shootCooldown -= dt;
    if (this.shootCooldown <= 0 && t.dist < 400) {
      this.shootCooldown = 1.2 + Math.random() * 0.8;
      this.muzzleFlash = 0.08;
      this.smokeEmit = true;
      bullets.push(new Bullet({
        x: this.x + Math.cos(this.angle) * 14, y: this.y + Math.sin(this.angle) * 14,
        angle: this.angle + (Math.random() - 0.5) * 0.1,
        damage: 8, speed: 300, explosive: false, radius: 0, owner: 'enemy',
      }));
    }
  }
  takeDamage(amount) { this.health -= amount; if (this.health <= 0) this.alive = false; }
  draw(ctx) {
    if (!this.alive) return;
    ctx.save(); ctx.translate(this.x, this.y);
    drawSoldierEnemy(ctx, this.angle);
    if (this.muzzleFlash > 0) drawMuzzleFlash(ctx, this.angle, this.muzzleFlash, 'enemy');
    ctx.restore();
  }
}

export class Sniper {
  constructor(x, y) {
    this.type = 'sniper'; this.x = x; this.y = y;
    this.health = 45; this.speed = 40; this.alive = true;
    this.shootCooldown = 0.5; this.angle = 0;
    this.muzzleFlash = 0;
  }
  getHitRadius() { return 13; }
  update(dt, player, map, bullets, allies) {
    if (!this.alive) return;
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    const t = pickTarget(player, allies, this);
    this.angle = Math.atan2(t.y - this.y, t.x - this.x);
    if (t.dist < 150) {
      const nx = -Math.cos(this.angle); const ny = -Math.sin(this.angle);
      const newX = this.x + nx * this.speed * dt;
      const newY = this.y + ny * this.speed * dt;
      if (!checkCollision(map, newX, this.y, 11)) this.x = newX;
      if (!checkCollision(map, this.x, newY, 11)) this.y = newY;
    } else if (t.dist > 450 && t.dist < 550) {
      const nx = Math.cos(this.angle); const ny = Math.sin(this.angle);
      const newX = this.x + nx * this.speed * 0.5 * dt;
      const newY = this.y + ny * this.speed * 0.5 * dt;
      if (!checkCollision(map, newX, this.y, 11)) this.x = newX;
      if (!checkCollision(map, this.x, newY, 11)) this.y = newY;
    }
    this.shootCooldown -= dt;
    if (this.shootCooldown <= 0 && t.dist < 550) {
      this.shootCooldown = 2.2 + Math.random() * 0.8;
      this.muzzleFlash = 0.1;
      this.smokeEmit = true;
      bullets.push(new Bullet({
        x: this.x + Math.cos(this.angle) * 16, y: this.y + Math.sin(this.angle) * 16,
        angle: this.angle + (Math.random() - 0.5) * 0.02,
        damage: 22, speed: 700, explosive: false, radius: 0, owner: 'enemy',
      }));
    }
  }
  takeDamage(amount) { this.health -= amount; if (this.health <= 0) this.alive = false; }
  draw(ctx) {
    if (!this.alive) return;
    ctx.save(); ctx.translate(this.x, this.y);
    drawSniper(ctx, this.angle);
    if (this.muzzleFlash > 0) drawMuzzleFlash(ctx, this.angle, this.muzzleFlash, 'enemy');
    ctx.restore();
  }
}

export class Vehicle {
  constructor(x, y) {
    this.type = 'vehicle'; this.x = x; this.y = y;
    this.health = 180; this.maxHealth = 180; this.speed = 35;
    this.alive = true; this.shootCooldown = 1; this.angle = 0;
    this.muzzleFlash = 0;
  }
  getHitRadius() { return 20; }
  update(dt, player, map, bullets, allies) {
    if (!this.alive) return;
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    const t = pickTarget(player, allies, this);
    this.angle = Math.atan2(t.y - this.y, t.x - this.x);
    if (t.dist > 80) {
      const nx = Math.cos(this.angle); const ny = Math.sin(this.angle);
      const newX = this.x + nx * this.speed * dt;
      const newY = this.y + ny * this.speed * dt;
      if (!checkCollision(map, newX, this.y, 18)) this.x = newX;
      if (!checkCollision(map, this.x, newY, 18)) this.y = newY;
    }
    this.shootCooldown -= dt;
    if (this.shootCooldown <= 0 && t.dist < 420) {
      this.shootCooldown = 1.8 + Math.random();
      this.muzzleFlash = 0.12;
      this.smokeEmit = true;
      bullets.push(new Bullet({
        x: this.x + Math.cos(this.angle) * 18, y: this.y + Math.sin(this.angle) * 18,
        angle: this.angle + (Math.random() - 0.5) * 0.06,
        damage: 14, speed: 280, explosive: true, radius: 35, owner: 'enemy',
      }));
    }
  }
  takeDamage(amount) { this.health -= amount; if (this.health <= 0) this.alive = false; }
  draw(ctx) {
    if (!this.alive) return;
    ctx.save(); ctx.translate(this.x, this.y);
    drawVehicle(ctx, this.angle);
    if (this.muzzleFlash > 0) drawMuzzleFlash(ctx, this.angle, this.muzzleFlash * 1.2, 'enemy');
    ctx.restore();
  }
}

export class Cannon {
  constructor(x, y) {
    this.type = 'cannon'; this.x = x; this.y = y;
    this.health = 280; this.maxHealth = 280; this.alive = true;
    this.shootCooldown = 1 + Math.random() * 2; this.angle = 0;
    this.muzzleFlash = 0;
  }
  getHitRadius() { return 22; }
  update(dt, player, map, bullets, allies) {
    if (!this.alive) return;
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    const t = pickTarget(player, allies, this);
    this.angle = Math.atan2(t.y - this.y, t.x - this.x);
    this.shootCooldown -= dt;
    if (this.shootCooldown <= 0 && t.dist < 500) {
      this.shootCooldown = 2.8 + Math.random() * 1.2;
      this.muzzleFlash = 0.14;
      this.smokeEmit = true;
      bullets.push(new Bullet({
        x: this.x + Math.cos(this.angle) * 20, y: this.y + Math.sin(this.angle) * 20,
        angle: this.angle + (Math.random() - 0.5) * 0.04,
        damage: 28, speed: 220, explosive: true, radius: 45, owner: 'enemy',
      }));
    }
  }
  takeDamage(amount) { this.health -= amount; if (this.health <= 0) this.alive = false; }
  draw(ctx) {
    if (!this.alive) return;
    ctx.save(); ctx.translate(this.x, this.y);
    drawCannon(ctx, this.angle, this.health / this.maxHealth);
    if (this.muzzleFlash > 0) drawMuzzleFlash(ctx, this.angle, this.muzzleFlash * 1.3, 'enemy');
    ctx.restore();
  }
}

export class Boss {
  constructor(x, y, config) {
    this.type = 'boss'; this.x = x; this.y = y;
    this.config = config;
    this.health = config.health;
    this.maxHealth = config.health;
    this.alive = true; this.shootCooldown = 1; this.angle = 0;
    this.burstCooldown = 4;
    this.phase = 1;
    this.phaseChanged = false;
    this.muzzleFlash = 0;
  }
  getHitRadius() { return 24; }
  update(dt, player, map, bullets, allies) {
    if (!this.alive) return;
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    const t = pickTarget(player, allies, this);
    this.angle = Math.atan2(t.y - this.y, t.x - this.x);
    const enraged = this.phase >= 2;
    this.shootCooldown -= dt;
    this.burstCooldown -= dt;
    if (this.shootCooldown <= 0) {
      this.shootCooldown = enraged ? 0.75 : 1.5;
      this.muzzleFlash = 0.1;
      this.smokeEmit = true;
      bullets.push(new Bullet({
        x: this.x + Math.cos(this.angle) * 22, y: this.y + Math.sin(this.angle) * 22,
        angle: this.angle + (Math.random() - 0.5) * 0.05,
        damage: enraged ? 24 : 20, speed: 350, explosive: true, radius: 40, owner: 'enemy',
      }));
    }
    if (this.burstCooldown <= 0) {
      this.burstCooldown = enraged ? 2.8 : 5;
      this.smokeEmit = true;
      const spread = enraged ? 5 : 3;
      for (let i = -(spread - 1) / 2; i <= (spread - 1) / 2; i++) {
        bullets.push(new Bullet({
          x: this.x, y: this.y,
          angle: this.angle + i * 0.22,
          damage: enraged ? 14 : 12, speed: 300, explosive: false, radius: 0, owner: 'enemy',
        }));
      }
    }
  }
  takeDamage(amount) {
    this.health -= amount;
    if (this.config.phased && this.phase === 1 && this.health / this.maxHealth <= 0.5) {
      this.phase = 2;
      this.phaseChanged = true;
      this.shootCooldown = 0.3;
      this.burstCooldown = 1.5;
    }
    if (this.health <= 0) this.alive = false;
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.save(); ctx.translate(this.x, this.y);
    drawBoss(ctx, this.angle, this.health / this.maxHealth, this.config.name, this.phase);
    if (this.muzzleFlash > 0) drawMuzzleFlash(ctx, this.angle, this.muzzleFlash * 1.4, 'enemy');
    ctx.restore();
  }
}

export function createEnemy(type, x, y, levelId) {
  switch (type) {
    case 'sniper': return new Sniper(x, y);
    case 'vehicle': return new Vehicle(x, y);
    case 'cannon': return new Cannon(x, y);
    case 'boss': return new Boss(x, y, BOSS_CONFIGS[levelId] || BOSS_CONFIGS[0]);
    default: return new Enemy(x, y);
  }
}

export class Bullet {
  constructor(data) {
    this.x = data.x; this.y = data.y;
    this.vx = Math.cos(data.angle) * data.speed;
    this.vy = Math.sin(data.angle) * data.speed;
    this.damage = data.damage;
    this.explosive = data.explosive;
    this.radius = data.radius;
    this.owner = data.owner;
    this.alive = true;
    this.life = 3;
  }
  update(dt, map, windDrift) {
    this.x += this.vx * dt + (windDrift?.x || 0) * dt;
    this.y += this.vy * dt + (windDrift?.y || 0) * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
    const tx = Math.floor(this.x / 40);
    const ty = Math.floor(this.y / 40);
    if (ty >= 0 && ty < map.length && tx >= 0 && tx < map[0].length) {
      const tile = map[ty][tx];
      if (tile === 2 || tile === 3) this.alive = false;
    }
  }
  draw(ctx) { drawBullet(ctx, this); }
}

export { drawExplosion };
