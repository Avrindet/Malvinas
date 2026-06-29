import { TILE_SIZE, TILE, GRENADE_RADIUS, GRENADE_DAMAGE, BOSS_CONFIGS,
  RECAPTURE_RANGE, RECAPTURE_TIME,
  MORTAR_PLACE_RANGE, MORTAR_MIN_DIST_PLAYER, MORTAR_FIRE_RANGE,
  MORTAR_BLAST_RADIUS, MORTAR_DAMAGE,
} from './constants.js';
import { LEVELS, collectSpawnPoints, pickRandomSpawnPoint, tileCenter, getMissionObjectives, checkCollision, getTileAt } from './levels.js';
import { Player, Ally, Bullet, createEnemy, drawExplosion } from './entities.js';
import {
  Grenade, Mine, PowerUp, POWERUP_TYPES, spawnMinesOnMap,
  MortarEmplacement, MortarShell,
} from './combat-extras.js';
import { WeatherSystem, drawFogVision } from './weather.js';
import {
  drawMapCached, drawCrosshair, drawMinimap, drawLevelBanner, drawWarningSign,
  drawMissionBriefing, drawOutOfAmmoHint, drawWoundedHint, drawMortarPreview,
  drawTutorialHint, drawWoundedPointer, buildMapCache, buildMinimapCache,
  drawMapAmbience, drawAtmosphericVignette, drawSkyBackground, drawAtmosphereTint,
} from './renderer.js';
import { getLevelAtmosphere, isNearWater } from './atmosphere.js';
import { Input } from './input.js';
import { HUD, MenuManager } from './hud.js';
import { AudioManager } from './audio.js';
import { EffectsManager } from './effects.js';
import { TouchControls } from './touch-controls.js';
import { TutorialManager } from './tutorial.js';
import {
  createEmptyMissionStats, recordMissionVictory,
} from './campaign-stats.js';
import {
  saveMission, clearMissionSave, loadMissionSave,
} from './mission-save.js';
import {
  applyPlayerDifficulty,
  getActiveModifiers,
  loadDifficultyId,
  pickEnemyTypeWithDifficulty,
  scaleEnemyDamage,
  scaleSpawnIntervalMs,
  scaleWaveEnemyCount,
  setActiveDifficulty,
} from './difficulty.js';
import { evaluateBonusObjectives, getBonusSummary } from './bonus-objectives.js';

export class Game {
  constructor(canvas, minimapCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.minimapCanvas = minimapCanvas;
    this.minimapCtx = minimapCanvas.getContext('2d');
    this.input = new Input(canvas);
    this.touch = new TouchControls(canvas, this.input);
    this.hud = new HUD();
    this.audio = new AudioManager();
    this.effects = new EffectsManager();
    this.camera = { x: 0, y: 0 };

    this.state = 'menu';
    this.level = null;
    this.map = null;
    this.mapCache = null;
    this.player = null;
    this.allies = [];
    this.enemies = [];
    this.bullets = [];
    this.grenades = [];
    this.mines = [];
    this.powerups = [];
    this.explosions = [];
    this.weather = null;

    this.wave = 0;
    this.kills = 0;
    this.alliesRescued = 0;
    this.waveTimer = 0;
    this.enemiesToSpawn = 0;
    this.spawnTimer = 0;
    this.waveActive = false;
    this.allWavesDone = false;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossActive = false;
    this.spawnPoints = [];
    this.minimapCache = null;
    this.powerupTimer = 12;
    this.gKeyHeld = false;
    this.mKeyHeld = false;
    this.mortarMode = false;
    this.mortar = null;
    this.mortarShells = [];
    this.mortarAutoFiredOnce = false;

    this.bannerText = '';
    this.bannerTimer = 0;
    this.alerts = [];
    this.fogAlertShown = false;
    this.preWaveAlertShown = false;
    this.frameTime = 0;
    this.frameCount = 0;
    this.defeatSnapshot = null;
    this.lastTime = 0;
    this.wasReloading = false;
    this.menuRef = null;
    this.briefingTimer = 0;
    this.briefingDuration = 8;
    this.wavesReady = false;
    this.ammoShopDismissed = false;
    this.difficultyId = loadDifficultyId();
    this.modifiers = getActiveModifiers();
    this.tutorial = null;
    this.lastWaveNotified = 0;
    this.missionStats = createEmptyMissionStats();
    this.autoSaveTimer = 30;
    this._prevPlayerX = 0;
    this._prevPlayerY = 0;
    this._footstepTimer = 0;
    this._vehicleExhaustTimer = 0;
    this.atmosphere = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  ensureAudio() {
    this.audio.init();
  }

  async unlockAudio() {
    const ok = await this.audio.unlock();
    if (ok) this.startMenuMusic();
    return ok;
  }

  startMenuMusic() {
    this.audio.init();
    if (this.audio.ctx?.state === 'suspended') {
      this.audio.ctx.resume();
    }
    this.audio.startMenuMusic();
  }

  startCombatMusic() {
    this.ensureAudio();
    this.audio.startCombatWind();
    this.audio.startCombatAmbience(this.atmosphere);
  }

  openAmmoShop() {
    if (this.state !== 'playing' || !this.player?.isOutOfAmmo()) return;
    this.state = 'ammo-shop';
    this.audio.duckMusic(true);
    this.menuRef?.showAmmoShop(this.player);
  }

  closeAmmoShop() {
    this.state = 'playing';
    this.ammoShopDismissed = true;
    this.audio.duckMusic(false);
    this.menuRef?.hideAmmoShop();
  }

  completeAmmoPurchase() {
    if (!this.player) return;
    this.player.purchaseAmmoPack();
    this.ammoShopDismissed = false;
    this.state = 'playing';
    this.audio.duckMusic(false);
    this.audio.playReload();
  }

  checkAmmoShop() {
    if (!this.player?.isOutOfAmmo()) {
      this.ammoShopDismissed = false;
      return;
    }
    if (this.input.wasPressed('KeyB')) {
      this.openAmmoShop();
      return;
    }
    if (!this.ammoShopDismissed && !this.menuRef?.isAmmoShopVisible()) {
      this.openAmmoShop();
    }
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.audio.duckMusic(true);
      this.persistMissionSave();
      this.menuRef?.showPause();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.audio.duckMusic(false);
      this.menuRef?.hidePause();
    }
  }

  pauseToMenu() {
    this.state = 'menu';
    this.audio.duckMusic(false);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.minimapCanvas.width = 140;
    this.minimapCanvas.height = 100;
    this.input.syncCanvasScale(this.canvas);
    if (this.map) {
      this.minimapCache = buildMinimapCache(
        this.map, this.minimapCanvas.width, this.minimapCanvas.height,
      );
    }
  }

  showBanner(text, isContinue = false) {
    this.bannerText = text;
    this.bannerTimer = 3;
    if (!isContinue) {
      this.wave = 0;
      this.waveActive = false;
      this.enemiesToSpawn = 0;
      this.wavesReady = false;
    } else {
      this.waveTimer = 2.5;
      this.wavesReady = true;
      this.briefingTimer = 0;
    }
  }

  endBriefing() {
    this.briefingTimer = 0;
    if (!this.wavesReady) {
      this.waveTimer = 3.5;
      this.wavesReady = true;
    }
  }

  dismissBriefingInput() {
    return this.input.wasPressed('Space') || this.input.wasPressed('Enter')
      || this.input.wasPressed('Escape') || this.input.mouse.justPressed;
  }

  startLevel(levelId, restore = null) {
    const difficultyId = restore?.difficultyId ?? loadDifficultyId();
    setActiveDifficulty(difficultyId);
    this.difficultyId = difficultyId;
    this.modifiers = getActiveModifiers();

    this.level = LEVELS[levelId];
    this.map = this.level.generate();
    const start = tileCenter(this.level.playerStart.x, this.level.playerStart.y);
    this.player = new Player(start.x, start.y);
    this.allies = this.level.allies.map((a, i) => {
      const pos = tileCenter(a.x, a.y);
      const isMortarOperator = this.level.mortarOperator === i;
      return new Ally(pos.x, pos.y, i, { isMortarOperator });
    });
    this.enemies = [];
    this.bullets = [];
    this.grenades = [];
    this.explosions = [];
    this.mines = spawnMinesOnMap(this.map);
    this.powerups = [];
    this.powerupTimer = 10;
    this.weather = new WeatherSystem(this.level.weather || 'clear');
    this.kills = 0;
    this.alliesRescued = 0;
    this.missionStats = createEmptyMissionStats();
    this.spawnTimer = 0;
    this.allWavesDone = false;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossActive = false;
    this.gKeyHeld = false;
    this.mKeyHeld = false;
    this.mortarMode = false;
    this.mortar = null;
    this.mortarShells = [];
    this.mortarAutoFiredOnce = false;
    this.alerts = [];
    this.fogAlertShown = false;
    this.preWaveAlertShown = false;
    this.effects = new EffectsManager();
    this.briefingTimer = this.briefingDuration;
    this.wavesReady = false;
    this.ammoShopDismissed = false;
    this.tutorial = new TutorialManager(levelId, false);
    this.lastWaveNotified = 0;
    this.autoSaveTimer = 30;
    this.wave = 0;
    this.waveActive = false;
    this.waveTimer = 0;
    this.enemiesToSpawn = 0;

    const fullRestore = restore?.version === 1 && restore.player;
    const abonoRestore = restore && !fullRestore;

    if (!fullRestore) {
      applyPlayerDifficulty(this.player, this.modifiers);
    }

    if (fullRestore) {
      this.applyMissionRestore(restore);
    } else if (abonoRestore) {
      this.kills = restore.kills ?? 0;
      this.alliesRescued = restore.alliesRescued ?? 0;
      this.briefingTimer = 0;
      this.wavesReady = true;
      this.tutorial = new TutorialManager(levelId, true);
      this.lastWaveNotified = Math.max(0, (restore.wave ?? 1) - 1);
      for (let i = 0; i < restore.alliesRescued && i < this.allies.length; i++) {
        this.allies[i].rescued = true;
        this.allies[i].active = true;
      }
      this.wave = Math.max(0, (restore.wave ?? 1) - 1);
      this.waveActive = false;
      this.waveTimer = 2;
      this.player.health = this.player.maxHealth;
    }

    this.mapCache = buildMapCache(this.map);
    this.spawnPoints = collectSpawnPoints(this.map);
    this.minimapCache = buildMinimapCache(this.map, this.minimapCanvas.width, this.minimapCanvas.height);
    this.level.objectives = getMissionObjectives(this.level);
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;
    this.atmosphere = getLevelAtmosphere(this.level);
    this._prevPlayerX = this.player.x;
    this._prevPlayerY = this.player.y;
    this._footstepTimer = 0;
    this.state = 'playing';
    this.startCombatMusic();
  }

  getDefeatSnapshot() {
    return {
      levelId: this.level.id,
      alliesRescued: this.alliesRescued,
      wave: Math.max(1, this.wave),
      kills: this.kills,
    };
  }

  getMissionStats() {
    const bonusResults = evaluateBonusObjectives(this.level, this.getBonusContext());
    const bonus = getBonusSummary(bonusResults);
    return {
      kills: this.kills,
      alliesRescued: this.allies.filter((a) => a.rescued).length,
      heals: this.missionStats.heals,
      recaptures: this.missionStats.recaptures,
      mortarShots: this.missionStats.mortarShots,
      rescues: this.missionStats.rescues,
      woundedEver: this.missionStats.woundedEver,
      bonus,
    };
  }

  getBonusContext() {
    return {
      recaptures: this.missionStats.recaptures,
      mortarOnTrench: this.missionStats.mortarOnTrench,
      slowHeal: this.missionStats.slowHeal,
      woundedEver: this.missionStats.woundedEver,
      heals: this.missionStats.heals,
      vehicleKills: this.missionStats.vehicleKills,
      bossPhaseReached: this.missionStats.bossPhaseReached,
      alliesRescued: this.allies.filter((a) => a.rescued).length,
      totalAllies: this.allies.length,
    };
  }

  registerEnemyKill(enemy) {
    if (enemy.type === 'vehicle') this.missionStats.vehicleKills++;
  }

  checkBossPhaseAlerts() {
    for (const enemy of this.enemies) {
      if (enemy.type === 'boss' && enemy.phaseChanged) {
        enemy.phaseChanged = false;
        this.missionStats.bossPhaseReached = true;
        this.showAlert('⚠ JEFE ENRAGECIDO — FASE FINAL', 'boss', 5);
      }
    }
  }

  getMissionSaveData() {
    if (!this.level || !this.player) return null;
    return {
      version: 1,
      levelId: this.level.id,
      difficultyId: this.difficultyId,
      player: {
        x: this.player.x,
        y: this.player.y,
        health: this.player.health,
        armor: this.player.armor,
        weaponIndex: this.player.weaponIndex,
        grenades: this.player.grenades,
        weapons: this.player.weapons.map((w) => ({ clip: w.clip, reserve: w.reserve })),
      },
      allies: this.allies.map((a) => ({
        i: a.slotIndex,
        rescued: a.rescued,
        wounded: a.wounded,
        active: a.active,
        health: a.health,
        x: a.x,
        y: a.y,
        atMortar: a.atMortar,
        movingToMortar: a.movingToMortar,
        mortarTargetX: a.mortarTargetX,
        mortarTargetY: a.mortarTargetY,
      })),
      mortar: this.mortar?.placed ? {
        x: this.mortar.x,
        y: this.mortar.y,
        active: this.mortar.active,
        cooldown: this.mortar.cooldown,
      } : null,
      wave: this.wave,
      waveTimer: this.waveTimer,
      waveActive: this.waveActive,
      enemiesToSpawn: this.enemiesToSpawn,
      spawnTimer: this.spawnTimer,
      allWavesDone: this.allWavesDone,
      bossSpawned: this.bossSpawned,
      bossDefeated: this.bossDefeated,
      bossActive: this.bossActive,
      kills: this.kills,
      alliesRescued: this.alliesRescued,
      missionStats: { ...this.missionStats },
      lastWaveNotified: this.lastWaveNotified,
      wavesReady: this.wavesReady,
      mortarAutoFiredOnce: this.mortarAutoFiredOnce,
    };
  }

  persistMissionSave() {
    const data = this.getMissionSaveData();
    if (data) saveMission(data);
  }

  applyMissionRestore(restore) {
    const p = restore.player;
    this.player.x = p.x;
    this.player.y = p.y;
    this.player.health = p.health;
    this.player.armor = p.armor ?? 0;
    this.player.weaponIndex = p.weaponIndex ?? 0;
    this.player.grenades = p.grenades ?? this.player.grenades;
    this.player.reloading = false;
    for (let i = 0; i < p.weapons.length && i < this.player.weapons.length; i++) {
      this.player.weapons[i].clip = p.weapons[i].clip;
      this.player.weapons[i].reserve = p.weapons[i].reserve;
    }

    for (const ad of restore.allies) {
      const ally = this.allies[ad.i];
      if (!ally) continue;
      ally.rescued = ad.rescued;
      ally.wounded = ad.wounded;
      ally.active = ad.active;
      ally.health = ad.health;
      ally.x = ad.x;
      ally.y = ad.y;
      ally.atMortar = ad.atMortar;
      ally.movingToMortar = ad.movingToMortar;
      ally.mortarTargetX = ad.mortarTargetX ?? ally.x;
      ally.mortarTargetY = ad.mortarTargetY ?? ally.y;
    }

    if (restore.mortar) {
      this.mortar = new MortarEmplacement(restore.mortar.x, restore.mortar.y);
      this.mortar.active = restore.mortar.active;
      this.mortar.cooldown = restore.mortar.cooldown ?? 0;
      this.mortarAutoFiredOnce = restore.mortarAutoFiredOnce ?? true;
    }

    this.wave = restore.wave ?? 0;
    this.waveTimer = restore.waveTimer ?? 2;
    this.waveActive = restore.waveActive ?? false;
    this.enemiesToSpawn = restore.enemiesToSpawn ?? 0;
    this.spawnTimer = restore.spawnTimer ?? 1;
    this.allWavesDone = restore.allWavesDone ?? false;
    this.bossSpawned = restore.bossSpawned ?? false;
    this.bossDefeated = restore.bossDefeated ?? false;
    this.bossActive = restore.bossActive ?? false;
    this.kills = restore.kills ?? 0;
    this.alliesRescued = restore.alliesRescued ?? 0;
    this.missionStats = { ...createEmptyMissionStats(), ...restore.missionStats };
    this.lastWaveNotified = restore.lastWaveNotified ?? this.wave;
    this.wavesReady = restore.wavesReady ?? true;
    this.briefingTimer = 0;
    this.enemies = [];
    this.bullets = [];
    this.grenades = [];
    this.mortarShells = [];
    this.explosions = [];
  }

  hasWoundedCompanions() {
    return this.allies.some((a) => a.rescued && a.wounded);
  }

  getNearestWoundedAlly() {
    let nearest = null;
    let minDist = Infinity;
    for (const ally of this.allies) {
      if (!ally.rescued || !ally.wounded) continue;
      const d = Math.hypot(ally.x - this.player.x, ally.y - this.player.y);
      if (d < minDist) {
        minDist = d;
        nearest = ally;
      }
    }
    return nearest;
  }

  onCompanionWounded(ally) {
    this.missionStats.woundedEver = true;
    ally.woundedAt = performance.now();
    this.tutorial?.notify('wounded');
  }

  applyAllyDamage(ally, amount) {
    const result = ally.takeDamage(amount);
    if (result === 'wounded') {
      if (ally.isMortarOperator) {
        ally.atMortar = false;
        ally.movingToMortar = false;
      }
      this.onCompanionWounded(ally);
      this.syncMortarState();
    }
  }

  pickEnemyType() {
    return pickEnemyTypeWithDifficulty(this.level, this.wave, this.modifiers);
  }

  damagePlayer(amount) {
    this.player.takeDamage(scaleEnemyDamage(amount, this.modifiers));
  }

  showAlert(text, type = 'attack', duration = 4) {
    const existing = this.alerts.findIndex((a) => a.text === text);
    if (existing >= 0) {
      this.alerts[existing].timer = duration;
      this.alerts[existing].duration = duration;
      return;
    }
    if (this.alerts.length >= 4) this.alerts.shift();
    this.alerts.push({ text, type, timer: duration, duration });
    this.audio.playAlert(type);
  }

  updateAlerts(dt) {
    for (let i = this.alerts.length - 1; i >= 0; i--) {
      this.alerts[i].timer -= dt;
      if (this.alerts[i].timer <= 0) {
        this.alerts[i] = this.alerts[this.alerts.length - 1];
        this.alerts.pop();
      }
    }
  }

  checkWeatherAlerts() {
    if (this.weather.fogWarningActive && !this.fogAlertShown) {
      this.showAlert('⚠ SE ACERCA LA NIEBLA', 'fog', 5);
      this.fogAlertShown = true;
    }
    if (!this.weather.fogWarningActive && !this.weather.fogActive) {
      this.fogAlertShown = false;
    }
  }

  spawnBoss() {
    const spawns = this.spawnPoints.filter(
      (p) => Math.hypot(p.x - this.player.x, p.y - this.player.y) > 250,
    );
    const pt = spawns.length ? spawns[(Math.random() * spawns.length) | 0] : pickRandomSpawnPoint(this.spawnPoints);
    this.enemies.push(createEnemy('boss', pt.x, pt.y, this.level.id));
    const cfg = BOSS_CONFIGS[this.level.id];
    this.bannerText = `⚠ JEFE: ${cfg.name}`;
    this.bannerTimer = 3;
    this.showAlert('⚠ COMANDANTE ENEMIGO DETECTADO', 'boss', 4);
  }

  update(dt) {
    if (this.state === 'ammo-shop') {
      this.effects.update(dt);
      this.input.clearFrame();
      return;
    }
    if (this.state === 'paused') {
      if (this.input.wasPressed('Escape')) this.togglePause();
      this.effects.update(dt);
      this.input.clearFrame();
      return;
    }
    if (this.state !== 'playing') return;

    if (this.briefingTimer > 0) {
      this.briefingTimer -= dt;
      if (this.dismissBriefingInput() || this.briefingTimer <= 0) this.endBriefing();
      this.effects.update(dt);
      this.frameTime += dt * 1000;
      this.input.clearFrame();
      return;
    }

    if (this.input.wasPressed('Escape')) {
      this.togglePause();
      this.input.clearFrame();
      return;
    }

    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    this.weather.update(dt);
    this.audio.updateCombatWind(this.weather);
    this.audio.updateCombatAmbience(isNearWater(this.map, this.player.x, this.player.y));
    this.checkWeatherAlerts();
    this.updateAlerts(dt);
    this.effects.update(dt);
    this.frameTime += dt * 1000;
    this.touch?.update(this.player, this.camera);
    this.player.weatherSpread = this.weather.getSpreadBonus();
    const prevHealth = this.player.health;
    const prevX = this.player.x;
    const prevY = this.player.y;
    this.player.update(dt, this.input, this.map, this.camera);

    const moved = Math.hypot(this.player.x - prevX, this.player.y - prevY);
    if (moved > 6 && this.player.alive) {
      this._footstepTimer -= dt;
      if (this._footstepTimer <= 0) {
        const tile = getTileAt(this.map, this.player.x, this.player.y);
        this.effects.addFootstepDust(this.player.x, this.player.y + 8, tile);
        if (!this.player.inTrench && Math.random() < 0.45) this.audio.playFootstep();
        this._footstepTimer = this.player.inTrench ? 0.32 : 0.2;
      }
    }

    if (this.player.reloading && !this.wasReloading) this.audio.playReload();
    this.wasReloading = this.player.reloading;

    this.checkAmmoShop();

    if (!this.player.alive) {
      this.defeatSnapshot = this.getDefeatSnapshot();
      this.state = 'defeat';
      return;
    }

    if (this.input.isDown('KeyE')) {
      for (const ally of this.allies) {
        if (ally.canRescue(this.player)) {
          ally.rescue();
          this.syncAlliesRescued();
          this.missionStats.rescues++;
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 15);
          this.audio.playRescue();
          this.tutorial?.notify('rescue', { isOperator: ally.isMortarOperator });
          if (ally.isMortarOperator && this.mortar?.placed && !this.mortar.active) {
            this.mortar.active = true;
            ally.mortarTargetX = this.mortar.x;
            ally.mortarTargetY = this.mortar.y;
            ally.movingToMortar = true;
          }
        }
      }
    }
    if (this.input.wasPressed('KeyE')) {
      for (const ally of this.allies) {
        if (ally.canHeal(this.player)) {
          if (ally.woundedAt && performance.now() - ally.woundedAt > 30000) {
            this.missionStats.slowHeal = true;
          }
          ally.heal();
          ally.woundedAt = 0;
          this.missionStats.heals++;
          this.audio.playHeal();
          this.effects.addHealEffect(ally.x, ally.y);
          this.effects.addFloatingText(ally.x, ally.y - 20, 'Curado', '#2ecc71');
          this.tutorial?.notify('heal');
          if (ally.isMortarOperator && this.mortar?.placed) {
            this.mortar.active = true;
            ally.mortarTargetX = this.mortar.x;
            ally.mortarTargetY = this.mortar.y;
            ally.movingToMortar = true;
          }
          this.syncMortarState();
        }
      }
    }

    if (this.tutorial?.getHint() && this.input.wasPressed('Space')) {
      this.tutorial.skipStep();
    }

    this.handleMortarInput();

    if (this.input.isDown('KeyG') && !this.gKeyHeld && this.player.canThrowGrenade()) {
      const g = this.player.throwGrenade();
      this.grenades.push(new Grenade(g.x, g.y, g.angle));
      this.audio.playGrenadeThrow();
    }
    this.gKeyHeld = this.input.isDown('KeyG');

    const now = performance.now();
    if (!this.mortarMode && this.input.mouse.down && this.player.weapon.auto) {
      if (this.player.canFire(now)) {
        this.bullets.push(new Bullet(this.player.fire(now)));
        this.audio.playGunshot(this.player.weaponIndex);
        this.effects.addGunSmoke(
          this.player.x + Math.cos(this.player.angle) * 22,
          this.player.y + Math.sin(this.player.angle) * 22,
          this.player.angle,
          this.player.weapon.explosive ? 1.6 : 0.75,
        );
      }
    } else if (!this.mortarMode && this.input.mouse.justPressed && !this.player.weapon.auto) {
      if (this.player.canFire(now)) {
        this.bullets.push(new Bullet(this.player.fire(now)));
        this.audio.playGunshot(this.player.weaponIndex);
        this.effects.addGunSmoke(
          this.player.x + Math.cos(this.player.angle) * 22,
          this.player.y + Math.sin(this.player.angle) * 22,
          this.player.angle,
          this.player.weapon.explosive ? 1.6 : 0.75,
        );
      }
    }

    if (this.bannerTimer <= 0 && this.wavesReady && !this.hasWoundedCompanions()) {
      this.updateWaves(dt);
    }

    for (const enemy of this.enemies) enemy.update(dt, this.player, this.map, this.bullets, this.allies);
    this.emitCombatSmoke(dt);
    this.updateRecapture(dt);
    for (const ally of this.allies) ally.update(dt, this.player, this.map, this.enemies, this.bullets);

    if (this.mortar) this.mortar.update(dt);
    this.updateAutoMortar();
    for (let i = this.mortarShells.length - 1; i >= 0; i--) {
      const hit = this.mortarShells[i].update(dt);
      if (hit) this.doExplosion(hit.x, hit.y, MORTAR_BLAST_RADIUS, MORTAR_DAMAGE);
      if (!this.mortarShells[i].alive) {
        this.mortarShells[i] = this.mortarShells[this.mortarShells.length - 1];
        this.mortarShells.pop();
      }
    }

    const wind = this.weather.getWindDrift();
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const drift = (b.owner === 'player' || b.owner === 'ally') ? wind : null;
      b.update(dt, this.map, drift);
      if (!b.alive) { this.bullets[i] = this.bullets[this.bullets.length - 1]; this.bullets.pop(); }
    }

    for (let i = this.grenades.length - 1; i >= 0; i--) {
      this.grenades[i].update(dt, this.map);
      if (!this.grenades[i].alive) {
        this.doExplosion(this.grenades[i].x, this.grenades[i].y, GRENADE_RADIUS, GRENADE_DAMAGE);
        this.grenades[i] = this.grenades[this.grenades.length - 1];
        this.grenades.pop();
      }
    }

    for (const mine of this.mines) mine.update(dt);
    for (const pu of this.powerups) pu.update(dt);

    this.checkMineCollisions();
    this.checkPowerupCollisions();
    this.handleCollisions();
    this.checkBossPhaseAlerts();

    if (this.player.health < prevHealth) {
      this.audio.playHit();
      this.effects.addDamageFlash(0.32 + (prevHealth - this.player.health) * 0.008);
    }

    this.powerupTimer -= dt;
    if (this.powerupTimer <= 0 && this.powerups.filter((p) => p.alive).length < 3) {
      const pt = pickRandomSpawnPoint(this.spawnPoints);
      const types = Object.values(POWERUP_TYPES);
      this.powerups.push(new PowerUp(pt.x, pt.y, types[(Math.random() * types.length) | 0]));
      this.powerupTimer = 16 + Math.random() * 12;
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].life -= dt;
      if (this.explosions[i].life <= 0) {
        this.explosions[i] = this.explosions[this.explosions.length - 1];
        this.explosions.pop();
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].alive) {
        if (this.enemies[i].type === 'boss') {
          this.bossDefeated = true;
          this.bossActive = false;
          this.allWavesDone = true;
        }
        this.enemies[i] = this.enemies[this.enemies.length - 1];
        this.enemies.pop();
      }
    }

    this.mines = this.mines.filter((m) => m.alive);
    this.powerups = this.powerups.filter((p) => p.alive);

    const shake = this.effects.getCameraOffset();
    this.camera.x = this.player.x - this.canvas.width / 2 + shake.x;
    this.camera.y = this.player.y - this.canvas.height / 2 + shake.y;
    const maxCamX = Math.max(0, this.map[0].length * TILE_SIZE - this.canvas.width);
    const maxCamY = Math.max(0, this.map.length * TILE_SIZE - this.canvas.height);
    this.camera.x = Math.max(0, Math.min(this.camera.x, maxCamX));
    this.camera.y = Math.max(0, Math.min(this.camera.y, maxCamY));

    this.syncMortarState();
    this.checkVictory();

    if (this.state === 'playing' && this.briefingTimer <= 0) {
      this.autoSaveTimer -= dt;
      if (this.autoSaveTimer <= 0) {
        this.persistMissionSave();
        this.autoSaveTimer = 30;
      }
    }

    this.input.clearFrame();
    this.frameCount++;
  }

  updateWaves(dt) {
    if (this.allWavesDone && this.bossDefeated) return;
    if (this.bossActive) return;
    if (this.hasWoundedCompanions()) return;

    if (!this.waveActive) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 3 && this.waveTimer > 0 && this.wave < this.level.waves.length && !this.preWaveAlertShown) {
        this.showAlert('⚠ AVISO: Fuerzas inglesas en movimiento', 'attack', 3);
        this.preWaveAlertShown = true;
      }
      if (this.waveTimer <= 0 && this.wave < this.level.waves.length) {
        this.wave++;
        if (this.wave !== this.lastWaveNotified) {
          this.lastWaveNotified = this.wave;
          this.tutorial?.notify('wave_start');
        }
        this.waveActive = true;
        this.enemiesToSpawn = scaleWaveEnemyCount(
          this.level.waves[this.wave - 1].count,
          this.modifiers,
        );
        this.spawnTimer = 0.5;
        this.preWaveAlertShown = false;
        this.showAlert(`⚠ OLEADA ${this.wave} — ¡LOS INGLESES ATACAN!`, 'attack', 4);
      }
    }

    if (this.waveActive && this.enemiesToSpawn > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.spawnPoints.length > 0) {
        const spawn = pickRandomSpawnPoint(this.spawnPoints);
        const dist = Math.hypot(spawn.x - this.player.x, spawn.y - this.player.y);
        if (dist > 200) {
          const type = this.pickEnemyType();
          if (type === 'soldier' && Math.random() < 0.18 && this.enemiesToSpawn >= 2) {
            this.enemies.push(createEnemy('soldier', spawn.x, spawn.y, this.level.id));
            this.enemies.push(createEnemy('soldier', spawn.x + 30, spawn.y, this.level.id));
            this.enemiesToSpawn -= 2;
          } else {
            this.enemies.push(createEnemy(type, spawn.x, spawn.y, this.level.id));
            this.enemiesToSpawn--;
          }
        }
        this.spawnTimer = scaleSpawnIntervalMs(
          this.level.waves[this.wave - 1].interval,
          this.modifiers,
        ) / 1000;
      }
    }

    if (this.waveActive && this.enemiesToSpawn <= 0 && this.enemies.length === 0) {
      this.waveActive = false;
      if (this.wave >= this.level.waves.length && !this.bossSpawned) {
        this.spawnBoss();
        this.bossSpawned = true;
        this.bossActive = true;
      } else if (this.wave < this.level.waves.length) {
        this.waveTimer = 3;
        this.preWaveAlertShown = false;
      }
    }
  }

  checkMineCollisions() {
    for (const mine of this.mines) {
      if (!mine.alive) continue;
      if (Math.hypot(this.player.x - mine.x, this.player.y - mine.y) < mine.radius + 10) {
        mine.alive = false;
        this.player.takeDamage(mine.damage);
        this.doExplosion(mine.x, mine.y, 40, 30);
      }
    }
  }

  checkPowerupCollisions() {
    for (const pu of this.powerups) {
      if (!pu.alive) continue;
      if (Math.hypot(this.player.x - pu.x, this.player.y - pu.y) < pu.radius + 10) {
        pu.apply(this.player);
        pu.alive = false;
      }
    }
  }

  handleCollisions() {
    for (const bullet of this.bullets) {
      if (!bullet.alive) continue;
      if (bullet.owner === 'player' || bullet.owner === 'ally') {
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const hitR = enemy.getHitRadius ? enemy.getHitRadius() : 14;
          if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < hitR) {
            bullet.alive = false;
            if (bullet.explosive) this.doExplosion(bullet.x, bullet.y, bullet.radius, bullet.damage);
            else {
              const wasAlive = enemy.alive;
              enemy.takeDamage(bullet.damage);
              if (!enemy.alive && wasAlive) {
                this.kills++;
                this.registerEnemyKill(enemy);
                this.effects.addKillMarker(enemy.x, enemy.y, enemy.type === 'boss');
              }
            }
            break;
          }
        }
      } else if (bullet.owner === 'enemy') {
        if (Math.hypot(bullet.x - this.player.x, bullet.y - this.player.y) < 14) {
          bullet.alive = false;
          if (bullet.explosive) this.doExplosionOnTeam(bullet.x, bullet.y, bullet.radius, bullet.damage);
          else this.damagePlayer(bullet.damage);
          continue;
        }
        for (const ally of this.allies) {
          if (!ally.active || !ally.alive) continue;
          if (Math.hypot(bullet.x - ally.x, bullet.y - ally.y) < 14) {
            bullet.alive = false;
            if (bullet.explosive) this.doExplosionOnTeam(bullet.x, bullet.y, bullet.radius, bullet.damage);
            else this.applyAllyDamage(ally, bullet.damage);
            break;
          }
        }
      }
    }
  }

  doExplosionOnTeam(x, y, radius, damage) {
    this.explosions.push({ x, y, radius, life: 0.35 });
    this.audio.playExplosion();
    this.effects.addExplosionShake(x, y, radius, this.player.x, this.player.y);
    const pd = Math.hypot(x - this.player.x, y - this.player.y);
    if (pd < radius) this.damagePlayer(damage * (1 - pd / radius));
    for (const ally of this.allies) {
      if (!ally.active || !ally.alive) continue;
      const d = Math.hypot(x - ally.x, y - ally.y);
      if (d < radius) this.applyAllyDamage(ally, damage * (1 - d / radius));
    }
  }

  doExplosion(x, y, radius, damage) {
    this.explosions.push({ x, y, radius, life: 0.3 });
    this.audio.playExplosion();
    this.effects.addExplosionShake(x, y, radius, this.player.x, this.player.y);
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(x - enemy.x, y - enemy.y);
      if (dist < radius) {
        const wasAlive = enemy.alive;
        enemy.takeDamage(damage * (1 - dist / radius));
        if (!enemy.alive && wasAlive) {
          this.kills++;
          this.registerEnemyKill(enemy);
          this.effects.addKillMarker(enemy.x, enemy.y, enemy.type === 'boss');
        }
      }
    }
  }

  checkVictory() {
    if (!this.allWavesDone || !this.bossDefeated) return;
    if (this.hasWoundedCompanions()) return;
    const allSaved = this.allies.every((a) => a.rescued && !a.wounded);
    const mortarOk = this.level.mortarOperator == null || this.mortar?.placed;
    if (allSaved && mortarOk) {
      this.tutorial?.notify('victory');
      this.state = 'victory';
    }
  }

  getMortarOperator() {
    const idx = this.level?.mortarOperator;
    if (idx == null) return null;
    return this.allies[idx] ?? null;
  }

  syncAlliesRescued() {
    this.alliesRescued = this.allies.filter((a) => a.rescued).length;
  }

  syncMortarState() {
    if (!this.mortar?.placed) return;
    const op = this.getMortarOperator();
    this.mortar.active = !!(op?.rescued && !op.wounded && op.active);
  }

  canPlaceMortarAt(wx, wy) {
    if (!this.player || !this.map) return false;
    const op = this.getMortarOperator();
    if (!op?.rescued || op.wounded || this.mortar?.placed) return false;
    const distPlayer = Math.hypot(wx - this.player.x, wy - this.player.y);
    if (distPlayer > MORTAR_PLACE_RANGE || distPlayer < MORTAR_MIN_DIST_PLAYER) return false;
    return !checkCollision(this.map, wx, wy, 14);
  }

  placeMortar(wx, wy) {
    const op = this.getMortarOperator();
    if (!op) return;
    this.mortar = new MortarEmplacement(wx, wy);
    if (getTileAt(this.map, wx, wy) === TILE.TRENCH) {
      this.missionStats.mortarOnTrench = true;
    }
    op.mortarTargetX = wx;
    op.mortarTargetY = wy;
    op.movingToMortar = true;
    op.atMortar = false;
    this.tutorial?.notify('mortar_placed');
    this.showAlert('✓ Mortero desplegado — el artillero tomará posición y disparará solo', 'attack', 4);
  }

  findMortarTarget() {
    if (!this.mortar?.placed) return null;
    let best = null;
    let bestScore = -Infinity;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.mortar.x, enemy.y - this.mortar.y);
      if (d > MORTAR_FIRE_RANGE) continue;
      const score = (enemy.type === 'boss' ? 1000 : 0)
        + (enemy.type === 'cannon' || enemy.type === 'vehicle' ? 200 : 0)
        - d;
      if (score > bestScore) {
        bestScore = score;
        best = enemy;
      }
    }
    return best;
  }

  emitCombatSmoke(dt) {
    for (const enemy of this.enemies) {
      if (!enemy.alive || !enemy.smokeEmit) continue;
      const intensity = enemy.type === 'cannon' ? 1.5
        : enemy.type === 'vehicle' ? 1.2
          : enemy.type === 'boss' ? 1.3
            : enemy.type === 'sniper' ? 0.9 : 0.65;
      this.effects.addGunSmoke(enemy.x, enemy.y, enemy.angle, intensity);
      enemy.smokeEmit = false;
    }
    for (const ally of this.allies) {
      if (!ally.smokeEmit) continue;
      this.effects.addGunSmoke(ally.x, ally.y, ally.angle, 0.55);
      ally.smokeEmit = false;
    }

    this._vehicleExhaustTimer -= dt;
    if (this._vehicleExhaustTimer <= 0) {
      for (const enemy of this.enemies) {
        if (enemy.type !== 'vehicle' || !enemy.alive) continue;
        this.effects.addExhaustSmoke(enemy.x, enemy.y, enemy.angle);
      }
      this._vehicleExhaustTimer = 0.35;
    }
  }

  updateAutoMortar() {
    if (!this.mortar?.placed || !this.mortar.active || !this.mortar.canFire()) return;
    const op = this.getMortarOperator();
    if (!op?.atMortar || op.wounded) return;

    const target = this.findMortarTarget();
    if (target) {
      op.angle = Math.atan2(target.y - op.y, target.x - op.x);
    }
    if (!target || !this.mortar.canFire()) return;

    this.mortarShells.push(this.mortar.fireAt(target.x, target.y));
    this.missionStats.mortarShots++;
    this.effects.addGunSmoke(this.mortar.x, this.mortar.y - 8, op.angle, 1.8);
    if (!this.mortarAutoFiredOnce) {
      this.mortarAutoFiredOnce = true;
      this.tutorial?.notify('mortar_fire');
    }
    this.audio.playGrenadeThrow();
  }

  handleMortarInput() {
    if (this.level?.mortarOperator == null) {
      this.mortarMode = false;
      return;
    }
    const op = this.getMortarOperator();
    const canPlace = !!op?.rescued && !op.wounded && !this.mortar?.placed;
    const touchMode = !!this.touch?.enabled;

    if (touchMode) {
      if (this.input.wasPressed('KeyM')) {
        if (canPlace) this.mortarMode = !this.mortarMode;
        else this.mortarMode = false;
      }
    } else {
      this.mortarMode = this.input.isDown('KeyM') && canPlace;
    }

    if (this.touch?.enabled) {
      document.body.classList.toggle('mortar-mode', this.mortarMode);
    }

    if (!canPlace) this.mortarMode = false;

    if (!this.mortarMode || !this.input.mouse.justPressed || this.mortar?.placed) return;

    const wx = this.input.mouse.x + this.camera.x;
    const wy = this.input.mouse.y + this.camera.y;
    if (this.canPlaceMortarAt(wx, wy)) {
      this.placeMortar(wx, wy);
      if (touchMode) this.mortarMode = false;
    }
  }

  updateRecapture(dt) {
    for (const ally of this.allies) {
      if (!ally.rescued || !ally.alive || ally.wounded) continue;
      let enemyNear = false;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - ally.x, e.y - ally.y) < RECAPTURE_RANGE) {
          enemyNear = true;
          break;
        }
      }
      if (enemyNear) {
        ally.recaptureTimer += dt;
        if (ally.recaptureTimer >= RECAPTURE_TIME) this.recaptureAlly(ally);
      } else {
        ally.recaptureTimer = Math.max(0, ally.recaptureTimer - dt * 1.5);
      }
    }
  }

  recaptureAlly(ally) {
    const wasMortarOp = ally.isMortarOperator;
    ally.recapture();
    this.missionStats.recaptures++;
    this.syncAlliesRescued();
    if (wasMortarOp && this.mortar) this.mortar.active = false;
    this.tutorial?.notify('recapture');
    this.showAlert('⚠ COMPAÑERO RECAPTURADO — ¡Rescatálo de nuevo!', 'attack', 4);
  }

  render() {
    if (!['playing', 'paused', 'ammo-shop', 'victory', 'defeat'].includes(this.state)) return;
    if (!this.map || !this.mapCache) return;

    const renderCam = this.camera;

    drawSkyBackground(this.ctx, this.canvas.width, this.canvas.height, this.atmosphere, this.frameTime);
    drawMapCached(this.ctx, this.mapCache, renderCam, this.canvas.width, this.canvas.height);
    drawMapAmbience(this.ctx, this.map, renderCam, this.canvas.width, this.canvas.height, this.frameTime);

    this.ctx.save();
    this.ctx.translate(-renderCam.x, -renderCam.y);

    for (const mine of this.mines) mine.draw(this.ctx);
    for (const pu of this.powerups) pu.draw(this.ctx);
    if (this.mortar?.placed) this.mortar.draw(this.ctx);
    for (const shell of this.mortarShells) shell.draw(this.ctx);
    for (const ally of this.allies) ally.draw(this.ctx);
    for (const enemy of this.enemies) enemy.draw(this.ctx);
    this.player.draw(this.ctx);
    for (const g of this.grenades) g.draw(this.ctx);
    for (const bullet of this.bullets) bullet.draw(this.ctx);
    for (const exp of this.explosions) drawExplosion(this.ctx, exp.x, exp.y, exp.radius);
    this.effects.drawWorldMarkers(this.ctx, renderCam);

    this.ctx.restore();

    if (this.weather?.fogActive) {
      drawFogVision(this.ctx, this.player, renderCam, this.canvas.width, this.canvas.height, this.weather.fogIntensity);
    }
    this.weather?.drawOverlay(this.ctx, this.canvas.width, this.canvas.height);

    drawAtmosphereTint(this.ctx, this.canvas.width, this.canvas.height, this.atmosphere);
    drawAtmosphericVignette(this.ctx, this.canvas.width, this.canvas.height);
    this.effects.drawScreenOverlay(this.ctx, this.canvas.width, this.canvas.height);

    if (this.state !== 'paused' && this.briefingTimer <= 0 && this.state !== 'ammo-shop') {
      if (this.mortarMode) {
        const wx = this.input.mouse.x + renderCam.x;
        const wy = this.input.mouse.y + renderCam.y;
        drawMortarPreview(
          this.ctx, renderCam, this.player, wx, wy,
          this.mortar, this.canPlaceMortarAt(wx, wy),
          this.touch?.enabled,
        );
      } else {
        drawCrosshair(this.ctx, this.input.mouse.x, this.input.mouse.y);
      }
    }

    if (this.player?.isOutOfAmmo() && this.state === 'playing') {
      drawOutOfAmmoHint(this.ctx, this.canvas.width, this.canvas.height, this.player.weapon.name);
    }

    if (this.hasWoundedCompanions() && this.state === 'playing' && this.briefingTimer <= 0) {
      drawWoundedHint(this.ctx, this.canvas.width, this.canvas.height);
      const wounded = this.getNearestWoundedAlly();
      drawWoundedPointer(
        this.ctx, wounded, renderCam,
        this.canvas.width, this.canvas.height, this.frameTime,
      );
    }

    const tutorialHint = this.tutorial?.getHint();
    if (tutorialHint && this.state === 'playing' && this.briefingTimer <= 0) {
      drawTutorialHint(
        this.ctx, tutorialHint, this.canvas.width, this.canvas.height,
        this.hasWoundedCompanions(),
      );
    }

    if (this.briefingTimer > 0) {
      drawMissionBriefing(
        this.ctx, this.level, this.briefingTimer, this.briefingDuration,
        this.canvas.width, this.canvas.height,
      );
    } else if (this.bannerTimer > 0) {
      drawLevelBanner(this.ctx, this.bannerText, this.bannerTimer, this.canvas.width, this.canvas.height);
    }

    if (!this.hasWoundedCompanions()) {
      const portrait = this.canvas.height > this.canvas.width;
      const maxShow = portrait ? 2 : 3;
      const step = portrait ? 48 : 54;
      let alertOffset = 0;
      for (const alert of this.alerts.slice(-maxShow)) {
        drawWarningSign(
          this.ctx, alert.text, alert.type, alert.timer, alert.duration,
          this.canvas.width, this.canvas.height, this.frameTime, alertOffset,
        );
        alertOffset += step;
      }
    }

    if (this.minimapCache && this.frameCount % 2 === 0) {
      drawMinimap(this.minimapCtx, this.minimapCache, this.player, this.allies, this.enemies);
    }

    this.hud.update(
      this.player, this.wave, this.kills, this.allies,
      this.weather, this.bossActive, this.mortar,
    );
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    try { this.update(dt); this.render(); } catch (err) { console.error('Error en el juego:', err); }
    requestAnimationFrame((t) => this.loop(t));
  }

  run() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }
}

export function initGame() {
  const canvas = document.getElementById('game-canvas');
  const minimap = document.getElementById('minimap');
  const game = new Game(canvas, minimap);

  const menu = new MenuManager(LEVELS, {
    onStart: (levelId) => {
      clearMissionSave();
      game.unlockAudio().then(() => {
        game.startLevel(levelId);
        game.showBanner(LEVELS[levelId].name);
      });
    },
    onContinueMission: () => {
      const save = loadMissionSave();
      if (!save || save.version !== 1) return;
      game.ensureAudio();
      game.startLevel(save.levelId, save);
      game.showBanner(LEVELS[save.levelId].name, true);
    },
    onContinue: (snapshot) => {
      game.ensureAudio();
      game.startLevel(snapshot.levelId, snapshot);
      game.showBanner(LEVELS[snapshot.levelId].name, true);
    },
    onShowMenu: () => game.startMenuMusic(),
    onPauseResume: () => game.togglePause(),
    onPauseRetry: () => {
      clearMissionSave();
      game.ensureAudio();
      game.startLevel(game.level.id);
      game.showBanner(game.level.name);
    },
    onPauseMenu: () => {
      game.persistMissionSave();
      game.pauseToMenu();
      menu.showMenu();
    },
    onToggleMute: () => {
      game.ensureAudio();
      return game.audio.toggleMute();
    },
    getMuteState: () => !game.audio.isMuted(),
    onAmmoPurchased: () => game.completeAmmoPurchase(),
    onAmmoShopClose: () => game.closeAmmoShop(),
    getSnapshot: () => game.defeatSnapshot,
  });

  game.menuRef = menu;

  const unlockScreen = document.getElementById('audio-unlock-screen');
  const unlockBtn = document.getElementById('btn-audio-unlock');

  const doUnlock = async () => {
    try {
      await game.unlockAudio();
    } catch (err) {
      console.warn('No se pudo activar el audio:', err);
    }
    unlockScreen?.classList.remove('active');
    menu.showMenu();
  };

  unlockBtn?.addEventListener('click', doUnlock);
  unlockScreen?.addEventListener('click', (e) => {
    if (e.target === unlockScreen) doUnlock();
  });

  const origUpdate = game.update.bind(game);
  game.update = function (dt) {
    origUpdate(dt);
    if (game.state === 'victory') {
      const isFinal = game.level.id >= LEVELS.length - 1;
      const stats = game.getMissionStats();
      clearMissionSave();
      recordMissionVictory(stats, game.level.id);
      menu.notifyMissionAchievements(stats, game.level.id, stats.bonus);
      game.audio.playVictory(isFinal);
      game.startMenuMusic();
      menu.showVictory(game.level, stats);
      game.state = 'menu-pause';
    } else if (game.state === 'defeat') {
      clearMissionSave();
      game.startMenuMusic();
      menu.showDefeat(game.defeatSnapshot);
      game.state = 'menu-pause';
    }
  };

  game.run();
  window.__malvinasReady = true;
  return game;
}
