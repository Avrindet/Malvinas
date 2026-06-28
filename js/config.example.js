/**
 * Plantilla de pagos — copiá este archivo a config.js y completá tus links.
 * Guía completa: ver PAGOS.md en la raíz del proyecto.
 */

/** Datos del vendedor (solo informativos, se muestran en pantalla si querés). */
export const PAYMENT_SELLER = {
  name: 'Tu nombre o proyecto',
  email: 'tu@email.com',
};

/**
 * Links de Mercado Pago (Link de pago / Producto).
 * Dejá vacío ('') hasta tener el link real. El juego avisa si falta configurar.
 */
export const MERCADO_PAGO_LINKS = {
  /** Continuar misión tras derrota — sugerido $500 ARS */
  abono: '',
  /** Paquete de munición in-game — sugerido $200 ARS */
  ammo: '',
};

export const ABONO_CONFIG = {
  amount: 500,
  currency: 'ARS',
  paymentUrl: MERCADO_PAGO_LINKS.abono || 'https://www.mercadopago.com.ar/',
  label: 'Abono — Continuar misión',
  description: 'Con tu abono apoyás el desarrollo del juego y podés retomar la misión fallida.',
};

export const AMMO_SHOP_CONFIG = {
  amount: 200,
  currency: 'ARS',
  paymentUrl: MERCADO_PAGO_LINKS.ammo || 'https://www.mercadopago.com.ar/',
  label: 'Paquete de munición',
  description: 'Recibís un cargador de reserva completo para el arma que tenés equipada.',
};

/** Grabación real opcional; si useRecording es false, suena banda militar sintetizada. */
export const MENU_MUSIC = {
  useRecording: false,
  recordingUrl: 'audio/marcha-malvinas.mp3',
};

/** URL pública al publicar (GitHub Pages, Netlify, etc.). */
export const SITE_CONFIG = {
  publicUrl: 'https://TU_USUARIO.github.io/malvinas/',
  title: 'Malvinas — Por los caídos',
  description: 'Juego de combate y campaña por las Islas Malvinas.',
  shareText: 'Jugá Malvinas — Por los caídos. Campaña por el archipiélago.',
};
