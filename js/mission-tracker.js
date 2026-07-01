/**
 * Seguimiento de objetivos de misión — panel desplegable en el HUD.
 */
import { BOSS_CONFIGS } from './constants.js';
import { evaluateBonusObjectives } from './bonus-objectives.js';

/** @typedef {{ id: string, text: string, done: boolean, required?: boolean, optional?: boolean }} MissionObjective */

/**
 * @param {import('./game.js').Game} game
 * @returns {{ primary: MissionObjective[], bonus: MissionObjective[], requiredDone: number, requiredTotal: number }}
 */
export function evaluateMissionProgress(game) {
  const level = game.level;
  const totalAllies = game.allies.length;
  const rescued = game.allies.filter((a) => a.rescued).length;
  const wounded = game.allies.some((a) => a.rescued && a.wounded);
  const wavesTotal = level.waves.length;
  const wavesDone = game.bossSpawned || game.allWavesDone || game.bossDefeated;

  let wavesCompleted = 0;
  if (wavesDone) wavesCompleted = wavesTotal;
  else if (game.wave <= 0) wavesCompleted = 0;
  else if (game.waveActive) wavesCompleted = Math.max(0, game.wave - 1);
  else wavesCompleted = Math.min(game.wave, wavesTotal);

  const bossName = BOSS_CONFIGS[level.id]?.name ?? 'jefe enemigo';

  /** @type {MissionObjective[]} */
  const primary = [
    {
      id: 'rescue',
      text: `Rescatar compañeros (${rescued}/${totalAllies})`,
      done: rescued >= totalAllies,
      required: true,
    },
    {
      id: 'healthy',
      text: wounded ? 'Curar compañeros heridos [E]' : 'Equipo sin heridos',
      done: rescued >= totalAllies && !wounded,
      required: true,
    },
    {
      id: 'waves',
      text: `Repeler oleadas (${wavesCompleted}/${wavesTotal})`,
      done: wavesDone,
      required: true,
    },
    {
      id: 'boss',
      text: `Derrotar al jefe: ${bossName}`,
      done: game.bossDefeated,
      required: true,
    },
  ];

  if (level.mortarOperator != null) {
    primary.push({
      id: 'mortar',
      text: 'Colocar mortero en trinchera [M]',
      done: !!game.mortar?.placed,
      required: true,
    });
  }

  const bonus = evaluateBonusObjectives(level, game.getBonusContext()).map((b) => ({
    id: b.id,
    text: b.text,
    done: b.done,
    optional: true,
  }));

  const requiredDone = primary.filter((o) => o.done).length;

  return {
    primary,
    bonus,
    requiredDone,
    requiredTotal: primary.length,
  };
}

export class MissionTracker {
  constructor() {
    this.root = document.getElementById('mission-tracker');
    this.btn = document.getElementById('mission-tracker-btn');
    this.panel = document.getElementById('mission-tracker-panel');
    this.countEl = document.getElementById('mission-tracker-count');
    this.listEl = document.getElementById('mission-tracker-list');
    this.open = false;
    this.lastKey = '';

    if (!this.root || !this.btn || !this.panel || !this.listEl) return;

    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setOpen(!this.open);
    });

    document.addEventListener('click', (e) => {
      if (!this.open) return;
      if (e.target.closest('#mission-tracker')) return;
      this.setOpen(false);
    });
  }

  setOpen(open) {
    this.open = open;
    this.panel.hidden = !open;
    this.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.btn.classList.toggle('open', open);
  }

  renderList(primary, bonus) {
    const rows = [];

    primary.forEach((obj, i) => {
      rows.push(this.renderRow(obj, i + 1));
    });

    if (bonus.length) {
      rows.push('<li class="mission-obj-section">Opcionales</li>');
      bonus.forEach((obj, i) => {
        rows.push(this.renderRow(obj, i + 1, true));
      });
    }

    this.listEl.innerHTML = rows.join('');
  }

  renderRow(obj, num, optional = false) {
    const cls = [
      'mission-obj',
      obj.done ? 'done' : 'pending',
      optional ? 'optional' : '',
    ].filter(Boolean).join(' ');
    const mark = obj.done ? '✓' : '○';
    return `<li class="${cls}"><span class="mission-num">${num}.</span>`
      + `<span class="mission-mark">${mark}</span> ${obj.text}</li>`;
  }

  /**
   * @param {import('./game.js').Game} game
   */
  update(game) {
    if (!this.root) return;

    const visible = game.state === 'playing' && game.briefingTimer <= 0 && !!game.level;
    this.root.hidden = !visible;
    if (!visible) {
      this.setOpen(false);
      return;
    }

    const progress = evaluateMissionProgress(game);
    const remaining = progress.requiredTotal - progress.requiredDone;

    if (this.countEl) {
      this.countEl.textContent = remaining > 0
        ? `Faltan ${remaining}`
        : '¡Listo!';
    }

    this.btn.title = remaining > 0
      ? `${remaining} objetivo(s) principal(es) pendiente(s)`
      : 'Todos los objetivos principales cumplidos';

    const key = JSON.stringify({
      p: progress.primary.map((o) => [o.id, o.done, o.text]),
      b: progress.bonus.map((o) => [o.id, o.done]),
      r: remaining,
    });

    if (key !== this.lastKey) {
      this.lastKey = key;
      this.renderList(progress.primary, progress.bonus);
    }
  }
}
