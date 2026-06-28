/**
 * Logros y pantalla de perfil — progreso persistente en localStorage.
 */

import { loadCampaignStats } from './campaign-stats.js';

const STORAGE_KEY = 'malvinas-achievements';

/** @typedef {{ stats: import('./campaign-stats.js').DEFAULT_CAMPAIGN_STATS, unlocked: string[], liberated: number[], abonos: number }} ProfileContext */

export const ACHIEVEMENTS = [
  {
    id: 'primera_mision',
    icon: '🎖️',
    title: 'Primera victoria',
    description: 'Completá tu primera misión.',
    check: (ctx) => ctx.stats.missionsCompleted >= 1,
  },
  {
    id: 'tres_regiones',
    icon: '🗺️',
    title: 'Avance en el archipiélago',
    description: 'Liberá 3 regiones de Malvinas.',
    check: (ctx) => ctx.stats.regionsLiberated >= 3,
  },
  {
    id: 'reivindicador',
    icon: '🇦🇷',
    title: 'Malvinas reivindicadas',
    description: 'Completá las 6 misiones de la campaña.',
    check: (ctx) => ctx.stats.regionsLiberated >= 6 || ctx.stats.missionsCompleted >= 6,
  },
  {
    id: 'homenaje',
    icon: '✝️',
    title: 'En memoria de los 649',
    description: 'Visitá el homenaje a los caídos.',
    eventOnly: true,
  },
  {
    id: 'sin_heridos',
    icon: '🛡️',
    title: 'Sin bajas propias',
    description: 'Completá una misión sin que ningún compañero resulte herido.',
    eventOnly: true,
  },
  {
    id: 'perfeccion',
    icon: '⭐',
    title: 'Misión impecable',
    description: 'Cumplí todos los objetivos secundarios en una misión.',
    eventOnly: true,
  },
  {
    id: 'cazador',
    icon: '🎯',
    title: 'Cazador',
    description: 'Acumulá 50 bajas en la campaña.',
    check: (ctx) => ctx.stats.totalKills >= 50,
  },
  {
    id: 'leyenda',
    icon: '💀',
    title: 'Leyenda del combate',
    description: 'Acumulá 150 bajas en la campaña.',
    check: (ctx) => ctx.stats.totalKills >= 150,
  },
  {
    id: 'hermanos',
    icon: '🤝',
    title: 'No dejar a nadie atrás',
    description: 'Rescatá 15 compañeros en total.',
    check: (ctx) => ctx.stats.totalAlliesRescued >= 15,
  },
  {
    id: 'sanador',
    icon: '💊',
    title: 'Médico de campaña',
    description: 'Curá 10 compañeros heridos.',
    check: (ctx) => ctx.stats.totalHeals >= 10,
  },
  {
    id: 'artillero',
    icon: '💣',
    title: 'Artillero',
    description: 'Dispará 25 veces con el mortero.',
    check: (ctx) => ctx.stats.totalMortarShots >= 25,
  },
  {
    id: 'fox',
    icon: '🦊',
    title: 'Derrotar a Fox',
    description: 'Completá la misión final en Bahía Fox.',
    check: (ctx) => ctx.liberated.includes(5),
  },
  {
    id: 'apoyador',
    icon: '💚',
    title: 'Apoyo a la misión',
    description: 'Apoyá el desarrollo con un abono.',
    check: (ctx) => ctx.abonos >= 1,
  },
];

function loadUnlockedSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

function saveUnlockedSet(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function loadUnlockedAchievements() {
  return [...loadUnlockedSet()];
}

export function isAchievementUnlocked(id) {
  return loadUnlockedSet().has(id);
}

/** @returns {string[]} IDs recién desbloqueados */
export function unlockAchievement(id) {
  const set = loadUnlockedSet();
  if (set.has(id)) return [];
  set.add(id);
  saveUnlockedSet(set);
  return [id];
}

function loadLiberatedRegions() {
  try {
    const raw = localStorage.getItem('malvinas-liberated');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadAbonoCount() {
  return parseInt(localStorage.getItem('malvinas-abonos') || '0', 10);
}

export function buildProfileContext() {
  return {
    stats: loadCampaignStats(),
    unlocked: loadUnlockedAchievements(),
    liberated: loadLiberatedRegions(),
    abonos: loadAbonoCount(),
  };
}

/** Revisa logros basados en estadísticas acumuladas. */
export function syncStatAchievements() {
  const ctx = buildProfileContext();
  const set = loadUnlockedSet();
  const newly = [];

  for (const def of ACHIEVEMENTS) {
    if (def.eventOnly || set.has(def.id)) continue;
    if (def.check?.(ctx)) {
      set.add(def.id);
      newly.push(def.id);
    }
  }

  if (newly.length) saveUnlockedSet(set);
  return newly;
}

/** Llamar al ver el homenaje. */
export function recordTributeViewed() {
  return unlockAchievement('homenaje');
}

/**
 * Llamar al completar una misión.
 * @param {object} missionStats
 * @param {number} levelId
 * @param {{ done: number, total: number }} bonus
 */
export function recordMissionAchievements(missionStats, levelId, bonus = { done: 0, total: 0 }) {
  syncStatAchievements();

  const newly = [];

  if (!missionStats.woundedEver) {
    newly.push(...unlockAchievement('sin_heridos'));
  }

  if (bonus.total > 0 && bonus.done >= bonus.total) {
    newly.push(...unlockAchievement('perfeccion'));
  }

  if (levelId >= 5) {
    newly.push(...unlockAchievement('fox'));
  }

  newly.push(...syncStatAchievements());
  return [...new Set(newly)];
}

function achievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getAchievementProgressSummary() {
  const unlocked = loadUnlockedSet();
  return {
    unlocked: unlocked.size,
    total: ACHIEVEMENTS.length,
  };
}

export function renderAchievementsHtml() {
  const unlocked = loadUnlockedSet();
  const items = ACHIEVEMENTS.map((def) => {
    const done = unlocked.has(def.id);
    return `
      <div class="achievement-row${done ? ' achievement-done' : ''}">
        <span class="achievement-icon" aria-hidden="true">${def.icon}</span>
        <div class="achievement-body">
          <div class="achievement-title">${def.title}</div>
          <div class="achievement-desc">${def.description}</div>
        </div>
        <span class="achievement-badge">${done ? '✓' : '○'}</span>
      </div>
    `;
  }).join('');

  const { unlocked: count, total } = getAchievementProgressSummary();

  return `
    <div class="achievements-header">
      <span class="achievements-count">${count}/${total} medallas</span>
    </div>
    <div class="achievements-list">${items}</div>
  `;
}

export function renderProfileStatsHtml(stats) {
  const liberated = loadLiberatedRegions().length;
  const abonos = loadAbonoCount();
  const { unlocked, total } = getAchievementProgressSummary();

  return `
    <div class="profile-stats-grid">
      <div class="stat-item">
        <span class="stat-value">${stats.missionsCompleted}/6</span>
        <span class="stat-label">MISIONES</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${liberated}/6</span>
        <span class="stat-label">REGIONES</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.totalKills}</span>
        <span class="stat-label">BAJAS</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.totalAlliesRescued}</span>
        <span class="stat-label">RESCATES</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.totalHeals}</span>
        <span class="stat-label">CURADOS</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.totalMortarShots}</span>
        <span class="stat-label">MORTERO</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${unlocked}/${total}</span>
        <span class="stat-label">MEDALLAS</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${abonos}</span>
        <span class="stat-label">ABONOS</span>
      </div>
    </div>
  `;
}

let toastTimer = null;

export function showAchievementToast(ids) {
  if (!ids?.length) return;
  const titles = ids
    .map((id) => achievementById(id))
    .filter(Boolean)
    .map((a) => `${a.icon} ${a.title}`);

  if (!titles.length) return;

  let el = document.getElementById('achievement-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'achievement-toast';
    el.className = 'achievement-toast';
    document.body.appendChild(el);
  }

  el.innerHTML = `
    <div class="achievement-toast-label">Medalla desbloqueada</div>
    <div class="achievement-toast-title">${titles.join('<br>')}</div>
  `;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3200);
}
