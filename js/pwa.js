const INSTALL_DISMISS_KEY = 'malvinas-install-dismissed';

let deferredInstallPrompt = null;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
}

function getInstallBanner() {
  return document.getElementById('install-banner');
}

function showInstallBanner() {
  if (isStandalone()) return;
  if (localStorage.getItem(INSTALL_DISMISS_KEY) === '1') return;
  const banner = getInstallBanner();
  if (banner) banner.hidden = false;
}

function hideInstallBanner(persist = false) {
  const banner = getInstallBanner();
  if (banner) banner.hidden = true;
  if (persist) localStorage.setItem(INSTALL_DISMISS_KEY, '1');
}

function showIosInstallHelp() {
  alert(
    'Para instalar en iPhone/iPad:\n\n'
    + '1. Tocá el botón Compartir (cuadrado con flecha)\n'
    + '2. Elegí «Agregar a pantalla de inicio»\n'
    + '3. Tocá «Agregar»',
  );
}

export async function promptInstall() {
  if (isStandalone()) {
    alert('El juego ya está instalado o abierto como app.');
    return 'standalone';
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    hideInstallBanner(true);
    return outcome;
  }

  if (isIosSafari()) {
    showIosInstallHelp();
    return 'ios-help';
  }

  alert(
    'Para instalar:\n\n'
    + '• Chrome/Android: menú ⋮ → «Instalar app» o «Agregar a pantalla de inicio»\n'
    + '• iPhone: Compartir → «Agregar a pantalla de inicio»',
  );
  return 'manual';
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js?v=2').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated' && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        });
      });
    }).catch(() => {});
  });
}

export function initPwa() {
  registerServiceWorker();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideInstallBanner(true);
  });

  document.getElementById('btn-install')?.addEventListener('click', () => {
    promptInstall();
  });

  document.getElementById('btn-install-dismiss')?.addEventListener('click', () => {
    hideInstallBanner(true);
  });

  document.getElementById('btn-install-menu')?.addEventListener('click', () => {
    promptInstall();
  });

  if (!isStandalone() && isIosSafari() && localStorage.getItem(INSTALL_DISMISS_KEY) !== '1') {
    showInstallBanner();
  }

  if (isStandalone()) {
    document.getElementById('btn-install-menu')?.setAttribute('hidden', '');
    document.getElementById('install-banner')?.setAttribute('hidden', '');
  }
}
