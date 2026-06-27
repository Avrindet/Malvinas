const STORAGE_KEY = 'malvinas-tutorial-complete';

const STEPS = [
  {
    id: 'intro',
    title: 'Guía de combate — Paso 1/6',
    text: 'Usá WASD para moverte. Los compañeros en azul necesitan rescate: acercate y presioná [E].',
  },
  {
    id: 'rescue_more',
    title: 'Paso 2/6',
    text: '¡Bien! Seguí rescatando al equipo. Buscá al artillero con 🎯 — operará el mortero.',
  },
  {
    id: 'mortar_place',
    title: 'Paso 3/6',
    text: 'Presioná [M] y hacé clic para colocar el mortero. El artillero irá solo al puesto.',
  },
  {
    id: 'mortar_fire',
    title: 'Paso 4/6',
    text: 'El mortero dispara solo contra los ingleses en rango. Vos seguí combatiendo.',
  },
  {
    id: 'recapture',
    title: 'Paso 5/6',
    text: '¡Cuidado! Si un inglés se acerca mucho a un compañero, puede recapturarlo. Mantenelos cubiertos.',
  },
  {
    id: 'heal',
    title: 'Paso 6/6',
    text: 'Si un compañero es herido queda inactivo (rojo). Curálo con [E] para reanudar la misión.',
  },
];

export function isTutorialComplete() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTutorialComplete() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export class TutorialManager {
  constructor(levelId, fromRestore = false) {
    this.enabled = levelId === 0 && !fromRestore && !isTutorialComplete();
    this.step = 0;
  }

  getHint() {
    if (!this.enabled || this.step >= STEPS.length) return null;
    return STEPS[this.step];
  }

  skipStep() {
    if (!this.enabled) return;
    this.step += 1;
    this.checkFinished();
  }

  notify(event, data = {}) {
    if (!this.enabled) return;

    switch (event) {
      case 'rescue':
        if (this.step === 0) this.step = 1;
        if (data.isOperator && this.step <= 1) this.step = 2;
        break;
      case 'mortar_placed':
        if (this.step <= 2) this.step = 3;
        break;
      case 'mortar_fire':
        if (this.step <= 3) this.step = 4;
        break;
      case 'wave_start':
        if (this.step <= 3) this.step = Math.max(this.step, 4);
        break;
      case 'recapture':
        if (this.step <= 4) this.step = 4;
        break;
      case 'wounded':
        if (this.step <= 5) this.step = 5;
        break;
      case 'heal':
        if (this.step === 5) this.step = 6;
        break;
      case 'victory':
        this.finish();
        break;
      default:
        break;
    }
    this.checkFinished();
  }

  checkFinished() {
    if (this.step >= STEPS.length) this.finish();
  }

  finish() {
    if (!this.enabled) return;
    this.enabled = false;
    markTutorialComplete();
  }
}
