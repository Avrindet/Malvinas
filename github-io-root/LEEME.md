# Asset links en la raíz de github.io

Android busca el archivo acá:

**https://avrindet.github.io/.well-known/assetlinks.json**

En un repo de proyecto (`Malvinas`) el archivo queda en `/Malvinas/.well-known/` y **la barra del navegador sigue visible** en la app.

## Solución (una sola vez)

1. Creá un repo en GitHub llamado exactamente **`Avrindet.github.io`** (público)
2. Subí solo la carpeta `.well-known` de este directorio (`github-io-root/.well-known/`)
3. Activá GitHub Pages en ese repo (branch `main`, carpeta root)
4. Verificá que abra: https://avrindet.github.io/.well-known/assetlinks.json
5. **Desinstalá** la app Malvinas del celular e instalá de nuevo el `.apk`

Sin este paso, la app abre como pestaña de Chrome (con barra arriba).
