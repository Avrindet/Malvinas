const STATS_KEY = 'malvinas-campaign-stats';
const LEGACY_KILLS_KEY = 'malvinas-campaign-kills';

export const DEFAULT_CAMPAIGN_STATS = {
  totalKills: 0,
  totalAlliesRescued: 0,
  totalHeals: 0,
  totalRecaptures: 0,
  totalMortarShots: 0,
  totalRescues: 0,
  missionsCompleted: 0,
  regionsLiberated: 0,
};

export function loadCampaignStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return { ...DEFAULT_CAMPAIGN_STATS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  const legacy = parseInt(localStorage.getItem(LEGACY_KILLS_KEY) || '0', 10);
  if (legacy > 0) {
    return { ...DEFAULT_CAMPAIGN_STATS, totalKills: legacy };
  }
  return { ...DEFAULT_CAMPAIGN_STATS };
}

export function saveCampaignStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function createEmptyMissionStats() {
  return {
    kills: 0,
    alliesRescued: 0,
    heals: 0,
    recaptures: 0,
    mortarShots: 0,
    rescues: 0,
    slowHeal: false,
    woundedEver: false,
    mortarOnTrench: false,
    vehicleKills: 0,
    bossPhaseReached: false,
  };
}

export function recordMissionVictory(missionStats, levelId) {
  const stats = loadCampaignStats();
  stats.totalKills += missionStats.kills ?? 0;
  stats.totalAlliesRescued += missionStats.alliesRescued ?? 0;
  stats.totalHeals += missionStats.heals ?? 0;
  stats.totalRecaptures += missionStats.recaptures ?? 0;
  stats.totalMortarShots += missionStats.mortarShots ?? 0;
  stats.totalRescues += missionStats.rescues ?? 0;
  stats.missionsCompleted += 1;
  stats.regionsLiberated = Math.max(stats.regionsLiberated, levelId + 1);
  saveCampaignStats(stats);
  localStorage.setItem(LEGACY_KILLS_KEY, String(stats.totalKills));
  return stats;
}

export function resetCampaignStats() {
  saveCampaignStats({ ...DEFAULT_CAMPAIGN_STATS });
  localStorage.setItem(LEGACY_KILLS_KEY, '0');
}

export function renderStatsGrid(stats, labels = {}) {
  const items = [
    { value: stats.kills ?? stats.totalKills ?? 0, label: labels.kills ?? 'BAJAS' },
    { value: stats.alliesRescued ?? stats.totalAlliesRescued ?? 0, label: labels.allies ?? 'RESCATES' },
    { value: stats.heals ?? stats.totalHeals ?? 0, label: labels.heals ?? 'CURADOS' },
    { value: stats.recaptures ?? stats.totalRecaptures ?? 0, label: labels.recaptures ?? 'RECAPTURAS' },
    { value: stats.mortarShots ?? stats.totalMortarShots ?? 0, label: labels.mortar ?? 'MORTERO' },
    { value: stats.rescues ?? stats.totalRescues ?? 0, label: labels.rescueEvents ?? 'RESCATES (E)' },
  ];
  return items.map((item) => `
    <div class="stat-item">
      <span class="stat-value">${item.value}</span>
      <span class="stat-label">${item.label}</span>
    </div>
  `).join('');
}
