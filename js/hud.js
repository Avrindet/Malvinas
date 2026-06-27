import { ABONO_CONFIG, AMMO_SHOP_CONFIG } from './config.js';
import { getPaymentSetupStatus, logPaymentSetupWarnings, openPaymentUrl } from './payments.js';
import {
  drawIslandsMap, loadLiberatedRegions, saveLiberatedRegion,
} from './islands-map.js';
import {
  loadCampaignStats, resetCampaignStats, renderStatsGrid,
} from './campaign-stats.js';
import {
  hasMissionSave, getMissionSaveSummary, formatSaveTime,
} from './mission-save.js';
import { renderBonusObjectivesHtml } from './bonus-objectives.js';
import { FALLEN_COUNT, renderTributeHtml } from './credits.js';

export class HUD {
  constructor() {
    this.healthFill = document.getElementById('health-fill');
    this.healthValue = document.getElementById('health-value');
    this.statWave = document.getElementById('stat-wave');
    this.statKills = document.getElementById('stat-kills');
    this.statAllies = document.getElementById('stat-allies');
    this.statGrenades = document.getElementById('stat-grenades');
    this.statWeather = document.getElementById('stat-weather');
    this.ammoCurrent = document.getElementById('ammo-current');
    this.ammoReserve = document.getElementById('ammo-reserve');
    this.weaponLabel = document.getElementById('weapon-label');
    this.weaponSlots = document.querySelectorAll('.weapon-slot');
    this.last = {};
  }

  update(player, wave, kills, allies, weather, bossActive, mortar) {
    const health = Math.ceil(player.health);
    const pct = (player.health / player.maxHealth) * 100;
    const ammo = player.ammoState;
    const clipText = player.reloading ? '...' : String(ammo.clip);
    const weaponName = player.weapon.name;
    const weatherText = bossActive ? '⚠ JEFE' : (weather?.getLabel() || '—');
    const totalAllies = allies?.length ?? 0;
    const freeAllies = allies?.filter((a) => a.rescued && !a.wounded).length ?? 0;
    const woundedCount = allies?.filter((a) => a.rescued && a.wounded).length ?? 0;
    const alliesText = totalAllies ? `${freeAllies}/${totalAllies}` : '0';
    const mortarText = woundedCount > 0
      ? `${woundedCount} herido(s) — curá con [E]`
      : mortar?.placed
      ? (mortar.active ? 'Mortero — fuego automático' : 'Mortero sin operador')
      : (allies?.some((a) => a.isMortarOperator && a.rescued) ? 'M: colocar mortero' : '—');

    if (this.last.pct !== pct) {
      this.healthFill.style.width = `${pct}%`;
      this.last.pct = pct;
    }
    if (this.last.health !== health) {
      this.healthValue.textContent = health;
      this.last.health = health;
    }
    if (this.last.wave !== wave) {
      this.statWave.textContent = wave;
      this.last.wave = wave;
    }
    if (this.last.kills !== kills) {
      this.statKills.textContent = kills;
      this.last.kills = kills;
    }
    if (this.last.allies !== alliesText) {
      this.statAllies.textContent = alliesText;
      this.statAllies.title = mortarText;
      this.last.allies = alliesText;
    }
    if (this.last.grenades !== player.grenades) {
      this.statGrenades.textContent = player.grenades;
      this.last.grenades = player.grenades;
    }
    if (this.last.weather !== weatherText) {
      this.statWeather.textContent = weatherText;
      this.last.weather = weatherText;
    }
    if (this.last.clip !== clipText) {
      this.ammoCurrent.textContent = clipText;
      this.last.clip = clipText;
    }
    if (this.last.reserve !== ammo.reserve) {
      this.ammoReserve.textContent = ammo.reserve;
      this.ammoReserve.style.color = ammo.reserve <= 0 && ammo.clip <= 0 ? '#e74c3c' : '';
      this.last.reserve = ammo.reserve;
    }
    if (this.last.weaponName !== weaponName) {
      this.weaponLabel.textContent = weaponName;
      this.last.weaponName = weaponName;
    }
    if (this.last.weaponIndex !== player.weaponIndex) {
      this.weaponSlots.forEach((slot, i) => {
        slot.classList.toggle('active', i === player.weaponIndex);
      });
      this.last.weaponIndex = player.weaponIndex;
    }
  }
}

export class MenuManager {
  constructor(levels, callbacks) {
    this.levels = levels;
    this.onStart = callbacks.onStart;
    this.onContinueMission = callbacks.onContinueMission;
    this.onContinue = callbacks.onContinue;
    this.onPauseResume = callbacks.onPauseResume;
    this.onPauseRetry = callbacks.onPauseRetry;
    this.onPauseMenu = callbacks.onPauseMenu;
    this.onToggleMute = callbacks.onToggleMute;
    this.getMuteState = callbacks.getMuteState;
    this.onShowMenu = callbacks.onShowMenu;
    this.onAmmoPurchased = callbacks.onAmmoPurchased;
    this.onAmmoShopClose = callbacks.onAmmoShopClose;
    this.getSnapshot = callbacks.getSnapshot;
    this.selectedLevel = 0;
    this.unlockedLevels = this.loadProgress();
    this.liberatedRegions = loadLiberatedRegions();
    this.mapPulse = 0;
    this.pendingAbono = false;
    this.campaignStats = loadCampaignStats();
    this._creditsReturnTo = 'menu';

    this.menuScreen = document.getElementById('menu-screen');
    this.victoryScreen = document.getElementById('victory-screen');
    this.campaignVictoryScreen = document.getElementById('campaign-victory-screen');
    this.creditsScreen = document.getElementById('credits-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.defeatScreen = document.getElementById('defeat-screen');
    this.abonoScreen = document.getElementById('abono-screen');
    this.ammoShopScreen = document.getElementById('ammo-shop-screen');
    this.levelSelect = document.getElementById('level-select');
    this.menuMapCanvas = document.getElementById('menu-map');
    this.victoryMapCanvas = document.getElementById('victory-map');
    this.campaignMapCanvas = document.getElementById('campaign-map');
    this.btnPauseMute = document.getElementById('btn-pause-mute');
    this.btnContinueMission = document.getElementById('btn-continue-mission');

    document.getElementById('btn-start').addEventListener('click', () => {
      this.hideAll();
      this.onStart(this.selectedLevel);
    });

    this.btnContinueMission?.addEventListener('click', () => {
      if (!hasMissionSave()) return;
      this.hideAll();
      this.onContinueMission?.();
    });

    document.getElementById('btn-pause-resume').addEventListener('click', () => {
      this.hidePause();
      this.onPauseResume();
    });
    document.getElementById('btn-pause-retry').addEventListener('click', () => {
      this.hideAll();
      this.onPauseRetry();
    });
    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      this.hideAll();
      this.onPauseMenu();
    });
    document.getElementById('btn-pause-mute').addEventListener('click', () => {
      const on = this.onToggleMute();
      this.updateMuteButton(on);
    });
    document.getElementById('btn-campaign-menu').addEventListener('click', () => {
      resetCampaignStats();
      this.campaignStats = loadCampaignStats();
      this.showMenu();
    });

    document.getElementById('btn-campaign-credits')?.addEventListener('click', () => {
      this._creditsReturnTo = 'campaign';
      this.showCredits();
    });

    document.getElementById('btn-tribute')?.addEventListener('click', () => {
      this._creditsReturnTo = 'menu';
      this.showCredits();
    });

    document.getElementById('btn-credits-close')?.addEventListener('click', () => {
      this.creditsScreen.classList.remove('active');
      if (this._creditsReturnTo === 'campaign') {
        this.campaignVictoryScreen.classList.add('active');
      } else {
        this.showMenu();
      }
    });

    document.getElementById('btn-next').addEventListener('click', () => {
      this.hideAll();
      const next = Math.min(this.selectedLevel + 1, this.levels.length - 1);
      this.selectedLevel = next;
      this.onStart(next);
    });

    document.getElementById('btn-menu').addEventListener('click', () => this.showMenu());
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.hideAll();
      this.onStart(this.selectedLevel);
    });
    document.getElementById('btn-menu-defeat').addEventListener('click', () => this.showMenu());
    document.getElementById('btn-abono').addEventListener('click', () => this.showAbono());
    document.getElementById('btn-abono-cancel').addEventListener('click', () => {
      this.abonoScreen.classList.remove('active');
      this.defeatScreen.classList.add('active');
    });
    document.getElementById('btn-abono-pay').addEventListener('click', () => {
      if (!openPaymentUrl(ABONO_CONFIG.paymentUrl, ABONO_CONFIG.label)) return;
      this.pendingAbono = true;
      document.getElementById('abono-confirm-box').style.display = 'block';
    });
    document.getElementById('btn-abono-confirm').addEventListener('click', () => {
      const checked = document.getElementById('abono-paid-check').checked;
      if (!checked) {
        alert('Marcá la casilla confirmando que realizaste el abono.');
        return;
      }
      this.registerAbono();
      const snap = this.getSnapshot();
      this.hideAll();
      if (snap) this.onContinue(snap);
    });

    document.getElementById('abono-amount').textContent =
      `$${ABONO_CONFIG.amount} ${ABONO_CONFIG.currency}`;
    document.getElementById('abono-desc').textContent = ABONO_CONFIG.description;

    document.getElementById('ammo-shop-amount').textContent =
      `$${AMMO_SHOP_CONFIG.amount} ${AMMO_SHOP_CONFIG.currency}`;
    document.getElementById('ammo-shop-desc').textContent = AMMO_SHOP_CONFIG.description;

    document.getElementById('btn-ammo-pay').addEventListener('click', () => {
      if (!openPaymentUrl(AMMO_SHOP_CONFIG.paymentUrl, AMMO_SHOP_CONFIG.label)) return;
      document.getElementById('ammo-confirm-box').style.display = 'block';
    });
    document.getElementById('btn-ammo-confirm').addEventListener('click', () => {
      const checked = document.getElementById('ammo-paid-check').checked;
      if (!checked) {
        alert('Marcá la casilla confirmando que realizaste el pago.');
        return;
      }
      document.getElementById('ammo-paid-check').checked = false;
      document.getElementById('ammo-confirm-box').style.display = 'none';
      this.hideAmmoShop();
      this.onAmmoPurchased?.();
    });
    document.getElementById('btn-ammo-close').addEventListener('click', () => {
      this.hideAmmoShop();
      this.onAmmoShopClose?.();
    });

    this.renderLevelSelect();
    this.updateContinueMissionButton();
    this.updatePaymentSetupNotice();
    this.startMapAnimation();

    const payStatus = getPaymentSetupStatus(ABONO_CONFIG, AMMO_SHOP_CONFIG);
    logPaymentSetupWarnings(payStatus);
  }

  updatePaymentSetupNotice() {
    let el = document.getElementById('payment-setup-notice');
    const status = getPaymentSetupStatus(ABONO_CONFIG, AMMO_SHOP_CONFIG);

    if (status.allConfigured) {
      el?.remove();
      return;
    }

    if (!el) {
      el = document.createElement('p');
      el.id = 'payment-setup-notice';
      el.className = 'payment-setup-notice';
      const menuRight = document.querySelector('.menu-right');
      menuRight?.insertBefore(el, menuRight.querySelector('#btn-continue-mission'));
    }

    const missing = [];
    if (!status.abono) missing.push('abono');
    if (!status.ammo) missing.push('munición');
    el.textContent = `⚙ Pagos: configurá links de ${missing.join(' y ')} en js/config.js (ver PAGOS.md)`;
  }

  startMapAnimation() {
    const tick = () => {
      this.mapPulse += 0.016;
      if (this.menuScreen.classList.contains('active')) {
        drawIslandsMap(this.menuMapCanvas, {
          liberatedLevels: this.liberatedRegions,
          currentLevel: this.selectedLevel,
          pulse: this.mapPulse,
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('malvinas-progress');
      return saved ? JSON.parse(saved) : [0];
    } catch {
      return [0];
    }
  }

  loadCampaignKills() {
    return loadCampaignStats().totalKills;
  }

  saveProgress(levelId) {
    if (!this.unlockedLevels.includes(levelId + 1) && levelId + 1 < this.levels.length) {
      this.unlockedLevels.push(levelId + 1);
    }
    localStorage.setItem('malvinas-progress', JSON.stringify(this.unlockedLevels));
    this.liberatedRegions = saveLiberatedRegion(levelId);
    this.renderLevelSelect();
  }

  registerAbono() {
    const count = parseInt(localStorage.getItem('malvinas-abonos') || '0', 10) + 1;
    localStorage.setItem('malvinas-abonos', String(count));
    document.getElementById('abono-paid-check').checked = false;
    document.getElementById('abono-confirm-box').style.display = 'none';
    this.pendingAbono = false;
  }

  renderLevelSelect() {
    this.levelSelect.innerHTML = '';
    for (const level of this.levels) {
      const locked = !this.unlockedLevels.includes(level.id);
      const liberated = this.liberatedRegions.includes(level.id);
      const div = document.createElement('div');
      div.className = `level-option${locked ? ' locked' : ''}${level.id === this.selectedLevel ? ' selected' : ''}`;
      div.innerHTML = `
        <div class="level-name">${locked ? '🔒 ' : liberated ? '✓ ' : ''}${level.name}</div>
        <div class="level-desc">${level.region} — ${level.description}</div>
      `;
      if (!locked) {
        div.addEventListener('click', () => {
          this.selectedLevel = level.id;
          this.renderLevelSelect();
          drawIslandsMap(this.menuMapCanvas, {
            liberatedLevels: this.liberatedRegions,
            currentLevel: this.selectedLevel,
            pulse: this.mapPulse,
          });
        });
      }
      this.levelSelect.appendChild(div);
    }
  }

  showMenu() {
    this.hideAll();
    this.menuScreen.classList.add('active');
    this.liberatedRegions = loadLiberatedRegions();
    this.campaignStats = loadCampaignStats();
    this.renderLevelSelect();
    this.updateContinueMissionButton();
    this.updatePaymentSetupNotice();
    drawIslandsMap(this.menuMapCanvas, {
      liberatedLevels: this.liberatedRegions,
      currentLevel: this.selectedLevel,
      pulse: this.mapPulse,
    });
    this.onShowMenu?.();
  }

  showCredits() {
    const countEl = document.getElementById('credits-count');
    const bodyEl = document.getElementById('credits-body');
    if (countEl) countEl.textContent = String(FALLEN_COUNT);
    if (bodyEl) bodyEl.innerHTML = renderTributeHtml();
    this.hideAll();
    this.creditsScreen.classList.add('active');
  }

  showVictory(level, stats = {}) {
    this.liberatedRegions = this.saveProgress(level.id);
    this.campaignStats = loadCampaignStats();

    const isFinal = level.id >= this.levels.length - 1;
    if (isFinal) {
      this.showCampaignVictory(stats);
      return;
    }

    document.getElementById('victory-text').textContent =
      `${level.name} recuperada en honor de quienes cayeron en ${level.region}. La reivindicación continúa.`;

    const missionStatsEl = document.getElementById('mission-stats');
    if (missionStatsEl) {
      const bonusHtml = stats.bonus ? renderBonusObjectivesHtml(stats.bonus) : '';
      missionStatsEl.innerHTML = `
        ${renderStatsGrid(stats, {
          kills: 'BAJAS (misión)',
          allies: 'COMPAÑEROS LIBRES',
          heals: 'CURADOS',
          recaptures: 'RECAPTURAS',
          mortar: 'DISPAROS MORTERO',
          rescueEvents: 'RESCATES',
        })}
        ${bonusHtml}
      `;
    }

    drawIslandsMap(this.victoryMapCanvas, {
      highlightLevel: level.id,
      liberatedLevels: this.liberatedRegions,
    });
    this.victoryScreen.classList.add('active');
  }

  showCampaignVictory(stats = {}) {
    const allLevels = this.levels.map((l) => l.id);
    const campaign = loadCampaignStats();
    drawIslandsMap(this.campaignMapCanvas, {
      liberatedLevels: allLevels,
      pulse: this.mapPulse,
    });

    const statsEl = document.getElementById('campaign-stats');
    statsEl.innerHTML = `
      <div class="stat-item">
        <span class="stat-value">${stats.kills ?? 0}</span>
        <span class="stat-label">BAJAS (última misión)</span>
      </div>
      ${renderStatsGrid(campaign, {
        kills: 'BAJAS (campaña)',
        allies: 'RESCATES TOTALES',
        heals: 'CURADOS',
        recaptures: 'RECAPTURAS SUFRIDAS',
        mortar: 'DISPAROS MORTERO',
        rescueEvents: 'RESCATES (E)',
      })}
      ${stats.bonus ? renderBonusObjectivesHtml(stats.bonus) : ''}
      <div class="stat-item">
        <span class="stat-value">${campaign.missionsCompleted}/6</span>
        <span class="stat-label">MISIONES</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${campaign.regionsLiberated}/6</span>
        <span class="stat-label">REGIONES</span>
      </div>
    `;
    this.campaignVictoryScreen.classList.add('active');
  }

  updateContinueMissionButton() {
    if (!this.btnContinueMission) return;
    const summary = getMissionSaveSummary();
    if (summary) {
      this.btnContinueMission.disabled = false;
      this.btnContinueMission.textContent =
        `Continuar: ${summary.levelName} (oleada ${Math.max(1, summary.wave)})`;
      this.btnContinueMission.title = `Guardado ${formatSaveTime(summary.savedAt)}`;
    } else {
      this.btnContinueMission.disabled = true;
      this.btnContinueMission.textContent = 'Continuar misión guardada';
      this.btnContinueMission.title = 'No hay misión guardada';
    }
  }

  showPause() {
    this.pauseScreen.classList.add('active');
    this.updateMuteButton(this.getMuteState?.() ?? true);
  }

  hidePause() {
    this.pauseScreen.classList.remove('active');
  }

  updateMuteButton(soundOn) {
    if (!this.btnPauseMute) return;
    this.btnPauseMute.textContent = soundOn ? '🔊 Sonido activado' : '🔇 Sonido silenciado';
  }

  isPauseVisible() {
    return this.pauseScreen.classList.contains('active');
  }

  showDefeat(snapshot) {
    this.selectedLevel = snapshot?.levelId ?? this.selectedLevel;
    document.getElementById('defeat-detail').textContent = snapshot
      ? `Caíste en ${this.levels[snapshot.levelId]?.name || 'misión'}. Por los caídos, hay que seguir. Oleada ${snapshot.wave}, ${snapshot.alliesRescued} aliados rescatados.`
      : 'Has caído en combate. La memoria de Malvinas nos impulsa a seguir.';
    this.defeatScreen.classList.add('active');
  }

  showAmmoShop(player) {
    const pack = player.getAmmoPackSize();
    const unit = player.weapon.explosive ? 'proyectiles' : 'balas';
    document.getElementById('ammo-shop-weapon').textContent = player.weapon.name;
    document.getElementById('ammo-shop-rounds').textContent = `+${pack} ${unit}`;
    document.getElementById('ammo-confirm-box').style.display = 'none';
    document.getElementById('ammo-paid-check').checked = false;
    this.ammoShopScreen.classList.add('active');
  }

  hideAmmoShop() {
    this.ammoShopScreen.classList.remove('active');
  }

  isAmmoShopVisible() {
    return this.ammoShopScreen.classList.contains('active');
  }

  showAbono() {
    this.defeatScreen.classList.remove('active');
    document.getElementById('abono-confirm-box').style.display = 'none';
    document.getElementById('abono-paid-check').checked = false;
    this.abonoScreen.classList.add('active');
  }

  hideAll() {
    this.menuScreen.classList.remove('active');
    this.victoryScreen.classList.remove('active');
    this.campaignVictoryScreen.classList.remove('active');
    this.creditsScreen?.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.defeatScreen.classList.remove('active');
    this.abonoScreen.classList.remove('active');
    this.ammoShopScreen.classList.remove('active');
    document.getElementById('audio-unlock-screen')?.classList.remove('active');
  }
}
