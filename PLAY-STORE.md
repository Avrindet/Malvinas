# Publicar en Google Play Store — Malvinas

El juego ya está online como PWA en **https://avrindet.github.io/Malvinas/**.  
Para Play Store usamos una **TWA** (Trusted Web Activity): una app Android liviana que abre tu sitio en pantalla completa, sin reescribir el juego.

---

## Qué ya está preparado en el proyecto

| Archivo | Para qué sirve |
|---------|----------------|
| `privacidad.html` | URL obligatoria de política de privacidad |
| `manifest.webmanifest` | PWA lista para Bubblewrap |
| `android/twa-manifest.json` | Plantilla de configuración Android |
| `.well-known/assetlinks.json` | Verificación dominio ↔ app (hay que completar SHA256) |
| `generar-apk.bat` | Ayuda a generar el APK/AAB |

**URL de privacidad para Play Console:**  
`https://avrindet.github.io/Malvinas/privacidad.html`

---

## Requisitos en tu PC (una sola vez)

1. **Node.js** — [nodejs.org](https://nodejs.org/) (LTS)
2. **Java JDK 17** — [adoptium.net](https://adoptium.net/)
3. **Android Studio** — [developer.android.com/studio](https://developer.android.com/studio)  
   - Durante la instalación: Android SDK + Build Tools
4. Variables de entorno (Android Studio suele configurarlas):
   - `ANDROID_HOME` o `ANDROID_SDK_ROOT`
5. Cuenta **Google Play Console** — pago único ~USD 25

---

## Paso 1 — Subir privacidad y assetlinks

Antes de generar la app, publicá en GitHub:

```powershell
cd D:\Jmal
git add privacidad.html .well-known android PLAY-STORE.md generar-apk.bat
git commit -m "Preparar Play Store: privacidad y TWA"
git push
```

Comprobá que abra:  
https://avrindet.github.io/Malvinas/privacidad.html

---

## Paso 2 — Instalar Bubblewrap

```powershell
npm install -g @bubblewrap/cli
bubblewrap doctor
```

`bubblewrap doctor` debe mostrar Node, Java y Android SDK en verde.

---

## Paso 3 — Crear el proyecto Android

```powershell
cd D:\Jmal\android
bubblewrap init --manifest=https://avrindet.github.io/Malvinas/manifest.webmanifest
```

O usando la plantilla local:

```powershell
cd D:\Jmal\android
bubblewrap init --manifest=../manifest.webmanifest
```

Durante `init`:

- **Package name:** `io.github.avrindet.malvinas` (o el que elijas; debe coincidir con `assetlinks.json`)
- **Host:** `avrindet.github.io`
- **Start URL:** `/Malvinas/`
- Creá un **keystore** nuevo (`android.keystore`) y guardá la contraseña en lugar seguro

---

## Paso 4 — Vincular dominio (assetlinks.json)

Después de crear el keystore, obtené la huella SHA256:

```powershell
keytool -list -v -keystore android\android.keystore -alias malvinas
```

Copiá la línea **SHA256** (formato `AA:BB:CC:...`) y pegala en `.well-known/assetlinks.json` reemplazando `REEMPLAZAR_CON_SHA256_DEL_KEYSTORE`.

Volvé a subir a GitHub:

```powershell
git add .well-known/assetlinks.json
git commit -m "Asset links para Play Store"
git push
```

Verificá en:  
https://avrindet.github.io/Malvinas/.well-known/assetlinks.json

**Importante (GitHub Pages):** Android también exige el archivo en la **raíz del dominio**:

https://avrindet.github.io/.well-known/assetlinks.json

Con un repo de proyecto (`Malvinas`) eso no se publica solo. Creá el repo **`Avrindet.github.io`** y subí la carpeta `github-io-root/.well-known/` de este proyecto. Ver `github-io-root/LEEME.md`.

Sin ese archivo en la raíz, la app muestra la **barra de Chrome arriba**.

Probá la vinculación:

```powershell
cd D:\Jmal\android
bubblewrap validate --url=https://avrindet.github.io/Malvinas/.well-known/assetlinks.json
```

---

## Paso 5 — Generar APK (prueba) y AAB (Play Store)

```powershell
cd D:\Jmal\android
bubblewrap build
```

Salida típica:

- `app-release-signed.apk` — para instalar y probar en el celular
- `app-release-bundle.aab` — **este subís a Play Console**

También podés ejecutar `generar-apk.bat` desde la carpeta del juego.

---

## Paso 6 — Probar en el celular

1. Activá **Opciones de desarrollador** → depuración USB (o enviá el APK por WhatsApp/Drive)
2. Instalá `app-release-signed.apk`
3. Abrí la app: debe cargar el juego en pantalla completa **sin barra del navegador**
4. Probá: menú, audio, misión, pagos MP (link externo), homenaje

Si abre Chrome con barra de direcciones, `assetlinks.json` no está bien o falta esperar unos minutos tras el deploy.

---

## Paso 7 — Play Console (ficha de la tienda)

1. [play.google.com/console](https://play.google.com/console) → **Crear app**
2. Tipo: **Juego** · Gratis (los pagos van por Mercado Pago fuera de Google Play)
3. **Producción** → **Crear versión** → subí el `.aab`
4. Completá:

| Campo | Sugerencia |
|-------|------------|
| Título | Malvinas — Por los caídos |
| Descripción corta | Campaña táctica por Malvinas. Por los caídos. |
| Descripción larga | Combate, rescate, 6 regiones, homenaje a los 649 caídos. |
| Política de privacidad | `https://avrindet.github.io/Malvinas/privacidad.html` |
| Categoría | Acción |
| Clasificación de contenido | Cuestionario IARC (violencia moderada, temática bélica) |
| Icono | `assets/icon-512.png` (512×512) |
| Gráfico de funciones | 1024×500 px (crear banner con título + mapa) |
| Capturas | Mínimo 2 del juego en celular (menú + combate) |

5. **Política de pagos:** indicá que las compras opcionales se hacen por **Mercado Pago** (enlace externo), no facturación de Google Play.

---

## Paso 8 — Actualizar la app después

Cuando cambies el juego en la web, los usuarios de la app TWA ven los cambios al abrir (como la PWA).  
Solo necesitás subir **nueva versión** a Play Store si cambiás:

- `appVersionCode` / `appVersionName` en `twa-manifest.json`
- icono, nombre del paquete, permisos Android

```powershell
cd D:\Jmal\android
bubblewrap update
bubblewrap build
```

---

## Pagos y políticas de Google

- Los links de Mercado Pago son **externos** → no usás Google Play Billing.
- En la ficha aclará: «Compras opcionales vía Mercado Pago en el navegador».
- Google puede pedir política de reembolsos: los reembolsos los gestionás vos desde el panel de Mercado Pago.

---

## Ayuda rápida

| Problema | Solución |
|----------|----------|
| `bubblewrap doctor` falla | Instalá JDK 17 y Android SDK; reiniciá PowerShell |
| App abre con barra de Chrome | Revisá `assetlinks.json` y SHA256 del keystore de release |
| Juego viejo en la app | Ctrl+F5 en web; en app cerrá y reabrí; revisá caché del `sw.js` |
| Play rechaza privacidad | URL debe ser pública HTTPS sin login |

---

## Resumen del orden

1. `git push` con `privacidad.html` y `assetlinks.json`
2. `bubblewrap init` + keystore
3. Completar SHA256 en `assetlinks.json` → `git push`
4. `bubblewrap build` → `.aab`
5. Subir a Play Console + capturas + clasificación IARC

Cuando tengas el keystore y la huella SHA256, podemos completar `assetlinks.json` juntos antes del push final.
