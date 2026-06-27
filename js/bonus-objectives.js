export function evaluateBonusObjectives(level, ctx) {
  const defs = level.bonusObjectives ?? [];
  return defs.map((def) => ({
    id: def.id,
    text: def.text,
    done: checkBonus(def.id, { ...ctx, vehicleKillGoal: def.goal ?? 3 }),
  }));
}

function checkBonus(id, ctx) {
  switch (id) {
    case 'no_recaptures':
      return ctx.recaptures === 0;
    case 'mortar_trench':
      return ctx.mortarOnTrench === true;
    case 'quick_heal':
      return !ctx.slowHeal && (!ctx.woundedEver || ctx.heals > 0);
    case 'no_wounds':
      return !ctx.woundedEver;
    case 'vehicle_hunter':
      return ctx.vehicleKills >= (ctx.vehicleKillGoal ?? 3);
    case 'boss_phase':
      return ctx.bossPhaseReached === true;
    case 'rescue_all':
      return ctx.alliesRescued >= ctx.totalAllies;
    default:
      return false;
  }
}

export function getBonusSummary(results) {
  const done = results.filter((r) => r.done).length;
  return { done, total: results.length, results };
}

export function renderBonusObjectivesHtml(summary) {
  if (!summary.total) return '';
  const lines = summary.results.map((r) => {
    const icon = r.done ? '✓' : '○';
    const cls = r.done ? 'bonus-done' : 'bonus-pending';
    return `<div class="bonus-row ${cls}"><span class="bonus-icon">${icon}</span> ${r.text}</div>`;
  }).join('');
  return `
    <div class="bonus-objectives">
      <div class="bonus-title">Objetivos secundarios — ${summary.done}/${summary.total}</div>
      ${lines}
    </div>
  `;
}
