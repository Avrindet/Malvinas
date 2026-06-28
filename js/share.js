import { SITE_CONFIG } from './config.js';

/** URL pública para compartir (sin query ni hash). */
export function getShareUrl() {
  const configured = (SITE_CONFIG.publicUrl || '').trim();
  if (configured) {
    return configured.replace(/\/?$/, '/');
  }
  const { origin, pathname } = window.location;
  const base = pathname.endsWith('/') ? pathname : `${pathname.replace(/\/[^/]*$/, '/')}`;
  return `${origin}${base}`;
}

/** URL absoluta de un asset (p. ej. imagen Open Graph). */
export function getAbsoluteAssetUrl(relativePath) {
  const base = getShareUrl();
  const path = relativePath.replace(/^\//, '');
  return new URL(path, base).href;
}

let toastTimer = null;

function showShareToast(message) {
  let el = document.getElementById('share-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'share-toast';
    el.className = 'share-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2800);
}

/**
 * Compartir el juego (Web Share API, portapapeles o prompt).
 * @param {{ title?: string, text?: string }} [options]
 */
export async function shareGame(options = {}) {
  const url = getShareUrl();
  const title = options.title || SITE_CONFIG.title;
  const text = options.text || SITE_CONFIG.shareText;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, method: 'native' };
    } catch (err) {
      if (err?.name === 'AbortError') return { ok: false, cancelled: true };
    }
  }

  const payload = `${text}\n\n${url}`;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
      showShareToast('Link copiado — pegalo en WhatsApp o Telegram');
      return { ok: true, method: 'clipboard' };
    }
  } catch {
    /* fallback abajo */
  }

  window.prompt('Copiá este link para compartir:', url);
  return { ok: true, method: 'prompt' };
}
