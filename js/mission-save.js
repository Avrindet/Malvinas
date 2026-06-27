import { LEVELS } from './levels.js';

const SAVE_KEY = 'malvinas-mission-save';

export function saveMission(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function loadMissionSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearMissionSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function hasMissionSave() {
  const save = loadMissionSave();
  return !!(save && save.version === 1 && save.levelId != null);
}

export function getMissionSaveSummary() {
  const save = loadMissionSave();
  if (!save || save.version !== 1) return null;
  const level = LEVELS[save.levelId];
  return {
    levelId: save.levelId,
    levelName: level?.name ?? `Misión ${save.levelId + 1}`,
    wave: save.wave ?? 0,
    savedAt: save.savedAt ?? 0,
  };
}

export function formatSaveTime(savedAt) {
  if (!savedAt) return '';
  const mins = Math.floor((Date.now() - savedAt) / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins === 1) return 'hace 1 minuto';
  if (mins < 60) return `hace ${mins} minutos`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? 'hace 1 hora' : `hace ${hrs} horas`;
}
