@echo off
chcp 65001 >nul 2>&1
title Malvinas - Publicar en la web
cd /d "%~dp0"

echo.
echo  ==========================================
echo   Malvinas - Publicar online
echo  ==========================================
echo.
echo  OPCION A - Rapido (sin Git):
echo    1. Comprimi en ZIP: index.html, .nojekyll, css\, js\
echo    2. Arrastralo a https://app.netlify.com/drop
echo    3. Proba la URL en el celular
echo.
echo  OPCION B - GitHub Pages (recomendado):
echo    1. Instala Git: https://git-scm.com/download/win
echo    2. Crea repo en https://github.com/new
echo    3. Sigue PUBLICAR-WEB.md
echo.

where git >nul 2>&1
if %errorlevel%==0 (
  echo  [Git] Instalado.
  git --version
  if exist ".git" (
    git status -sb 2>nul
  ) else (
    echo  [Git] Aun no hay repositorio en esta carpeta.
    echo        Ejecuta: git init
  )
) else (
  echo  [Git] NO instalado - usa Netlify Drop o instala Git primero.
)

echo.
start "" "PUBLICAR-WEB.md"
pause
