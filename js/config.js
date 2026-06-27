/**
 * ═══════════════════════════════════════════════════════════════
 *  CONFIGURACIÓN DE PAGOS — completá antes de publicar online
 *  Guía paso a paso: PAGOS.md (en la carpeta del juego)
 * ═══════════════════════════════════════════════════════════════
 */

/** Tu nombre o proyecto (opcional, para referencia). */
export const PAYMENT_SELLER = {
  name: '',
  email: '',
};

/**
 * Pegá acá los links que generás en Mercado Pago.
 * Formato típico: https://mpago.la/XXXXX  o  https://www.mercadopago.com.ar/checkout/v1/redirect?...
 *
 * IMPORTANTE: el monto del link en MP debe coincidir con amount de abajo.
 */
export const MERCADO_PAGO_LINKS = {
  /** Continuar misión tras perder — $500 ARS por defecto */
  abono: 'https://mpago.la/12TUPgN',
  /** Comprar munición in-game — $200 ARS por defecto */
  ammo: 'https://mpago.la/2rnJPcS',
};

/** @deprecated Usá MERCADO_PAGO_LINKS; se mantiene por compatibilidad interna. */
const MP_FALLBACK = 'https://www.mercadopago.com.ar/';

export const ABONO_CONFIG = {
  amount: 500,
  currency: 'ARS',
  paymentUrl: (MERCADO_PAGO_LINKS.abono || '').trim() || MP_FALLBACK,
  label: 'Abono — Continuar misión',
  description: 'Con tu abono apoyás el desarrollo del juego y podés retomar la misión fallida.',
};

export const AMMO_SHOP_CONFIG = {
  amount: 200,
  currency: 'ARS',
  paymentUrl: (MERCADO_PAGO_LINKS.ammo || '').trim() || MP_FALLBACK,
  label: 'Paquete de munición',
  description: 'Recibís un cargador de reserva completo para el arma que tenés equipada.',
};

/** Música del menú — grabación MP3 opcional o banda sintetizada. */
export const MENU_MUSIC = {
  useRecording: false,
  recordingUrl: 'audio/marcha-malvinas.mp3',
};
