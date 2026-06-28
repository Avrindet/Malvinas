import { initGame } from './game.js';
import { initPwa } from './pwa.js';
import { syncStatAchievements } from './achievements.js';

initPwa();
syncStatAchievements();
initGame();
