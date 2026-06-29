# Malvinas — Por los caídos

Juego top-down en el navegador sobre la reivindicación de las Islas Malvinas.  
Combate, rescate de compañeros, mortero, 6 regiones y campaña completa.

## Jugar en local (sin instalar nada extra)

1. Doble clic en `iniciar.bat`
2. Abrí el navegador en la URL que muestra (por ejemplo `http://localhost:8080`)
3. Tocá **Entrar** para activar el audio

Para cerrar el servidor: `cerrar-servidor.bat`

## Publicar online (GitHub Pages) — gratis

El juego es 100 % estático (HTML + CSS + JS). Se puede hospedar gratis en GitHub Pages.

### Paso 1 — Crear repositorio en GitHub

1. Entrá a [github.com/new](https://github.com/new)
2. Nombre sugerido: `malvinas` (o el que prefieras)
3. Dejalo **público**
4. No marques “Add README” (ya está en el proyecto)
5. Creá el repositorio

### Paso 2 — Subir el proyecto

En PowerShell, dentro de la carpeta `D:\Jmal`:

```powershell
git init
git add .
git commit -m "Malvinas — juego listo para publicar"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/malvinas.git
git push -u origin main
```

Reemplazá `TU_USUARIO` y el nombre del repo por los tuyos.

### Paso 3 — Activar GitHub Pages

1. En el repo: **Settings** → **Pages**
2. En **Build and deployment** → **Source**: elegí **GitHub Actions**
3. Volvé a **Actions**: debería correr el workflow **“Publicar en GitHub Pages”**
4. Cuando termine en verde, tu juego estará en:

   `https://TU_USUARIO.github.io/malvinas/`

(Si el repo se llama distinto, cambiá `malvinas` por ese nombre.)

### Actualizar el juego online

Cada vez que hagas cambios:

```powershell
git add .
git commit -m "Descripción del cambio"
git push
```

GitHub Actions republica solo en unos minutos.

## Alternativa rápida: Netlify Drop

Sin Git, si solo querés probar online:

1. Comprimí en un ZIP: `index.html`, carpeta `css/` y carpeta `js/`
2. Arrastralo a [app.netlify.com/drop](https://app.netlify.com/drop)
3. Te da una URL al instante

## Estructura del proyecto

```
malvinas/
├── index.html          # Entrada del juego
├── css/styles.css      # Estilos
├── js/                 # Lógica del juego (módulos ES)
├── iniciar.bat         # Servidor local (Windows)
├── serve.ps1           # Servidor local (PowerShell)
└── .github/workflows/  # Publicación automática
```

## Requisitos del navegador

- Chrome, Firefox, Edge o Safari recientes
- JavaScript activado
- Para audio: un clic en **Entrar** (política del navegador)

## Configuración opcional

- **Pagos (Mercado Pago):** ejecutá `configurar-pagos.bat` o leé [PAGOS.md](PAGOS.md) — links en `js/config.js`
- Textos y metadatos: `js/game-meta.js`

---

*En memoria de quienes cayeron en Malvinas. Las islas Malvinas son argentinas.*
