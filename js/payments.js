/** Utilidades para links de pago (Mercado Pago u otro). */

const DEFAULT_MP_HOME = 'https://www.mercadopago.com.ar/';

export function isPaymentUrlConfigured(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed === DEFAULT_MP_HOME) return false;
  if (trimmed === 'https://www.mercadopago.com.ar') return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function openPaymentUrl(url, label = 'Pago') {
  if (!isPaymentUrlConfigured(url)) {
    alert(
      'Los links de pago aún no están configurados.\n\n'
      + 'Editá js/config.js con tus links de Mercado Pago.\n'
      + 'Guía: abrí PAGOS.md en la carpeta del juego.',
    );
    return false;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function getPaymentSetupStatus(abonoConfig, ammoConfig) {
  const abono = isPaymentUrlConfigured(abonoConfig?.paymentUrl);
  const ammo = isPaymentUrlConfigured(ammoConfig?.paymentUrl);
  return {
    abono,
    ammo,
    allConfigured: abono && ammo,
    anyConfigured: abono || ammo,
  };
}

export function logPaymentSetupWarnings(status) {
  if (status.allConfigured) {
    console.info('[Malvinas] Links de pago configurados (abono + munición).');
    return;
  }
  const missing = [];
  if (!status.abono) missing.push('abono (continuar misión)');
  if (!status.ammo) missing.push('munición');
  console.warn(
    `[Malvinas] Falta configurar links de pago: ${missing.join(', ')}. `
    + 'Editá js/config.js — guía en PAGOS.md',
  );
}
