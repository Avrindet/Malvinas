/** Textos del homenaje a los caídos en Malvinas (1982). */

export const FALLEN_COUNT = 649;

export const TRIBUTE_LINES = [
  'A quienes no volvieron del Atlántico Sur.',
  'A las familias que esperaron en silencio.',
  'A los veteranos que llevan la memoria en el cuerpo y en el alma.',
  'Sabemos de los abusos y el maltrato que sufrieron muchos combatientes en las islas, a manos de sus superiores.',
  'Honrar su memoria también es no callar esa verdad.',
  'Las islas Malvinas son argentinas — la reivindicación continúa.',
  'Por los caídos, por los que regresaron, por las generaciones que vendrán.',
];

export function renderTributeHtml() {
  return TRIBUTE_LINES.map((line) => `<p class="tribute-line">${line}</p>`).join('');
}
