# Publicar Malvinas online

Tu juego ya tiene links de pago configurados. Elegí **A** (rápido, sin instalar nada) o **B** (GitHub, recomendado para actualizar después).

---

## A — Netlify Drop (5 minutos, sin Git)

Ideal para **probar hoy** desde el celular de otra persona.

1. Comprimí en un **ZIP** estos elementos de `D:\Jmal`:
   - `index.html`
   - `.nojekyll`
   - carpeta `css/`
   - carpeta `js/`
   - carpeta `audio/` (si existe)

2. Entrá a [app.netlify.com/drop](https://app.netlify.com/drop)

3. Arrastrá el ZIP

4. Netlify te da una URL tipo `https://algo-random.netlify.app`

5. Abrí esa URL en **otro celular** (otra cuenta MP para probar pagos)

**Actualizar después:** volvé a subir un ZIP nuevo.

---

## B — GitHub Pages (recomendado)

Permite actualizar con un solo `git push`.

### B1 — Instalar Git (solo una vez)

1. Descargá [Git for Windows](https://git-scm.com/download/win)
2. Instalá con opciones por defecto
3. **Cerrá y volvé a abrir** PowerShell o Cursor

### B2 — Crear repositorio en GitHub

1. [github.com/new](https://github.com/new)
2. Nombre: `malvinas` (o el que quieras)
3. **Público**
4. **No** marques “Add README”
5. Crear repositorio

### B3 — Subir el proyecto

En PowerShell:

```powershell
cd D:\Jmal
git init
git add .
git commit -m "Malvinas — juego publicado con pagos"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/malvinas.git
git push -u origin main
```

(Reemplazá `TU_USUARIO` y el nombre del repo.)

Te pedirá usuario y contraseña de GitHub. Si pide contraseña, usá un **Personal Access Token** (GitHub → Settings → Developer settings → Tokens).

### B4 — Activar GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source:** GitHub Actions
3. **Actions** → workflow **“Publicar en GitHub Pages”** → debe quedar en verde

Tu juego quedará en:

`https://TU_USUARIO.github.io/malvinas/`

---

## Probar pagos online

- Usá **otra cuenta** de Mercado Pago (no la que creó los links)
- O pedile a alguien que pruebe el link de $200 / $500

---

## Actualizar el juego online

**Netlify:** nuevo ZIP en Drop (o cuenta Netlify para deploy continuo).

**GitHub:**

```powershell
cd D:\Jmal
git add .
git commit -m "Descripción del cambio"
git push
```

En 2–5 minutos se republica solo.
