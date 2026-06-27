@echo off
chcp 65001 >nul 2>&1
title Malvinas - Publicar en GitHub
cd /d "%~dp0"

echo.
echo  ========================================
echo   Malvinas - Guia para publicar online
echo  ========================================
echo.
echo  1. Crea un repo en https://github.com/new
echo  2. Ejecuta estos comandos (reemplaza TU_USUARIO y el nombre del repo):
echo.
echo     git init
echo     git add .
echo     git commit -m "Malvinas - juego publicado"
echo     git branch -M main
echo     git remote add origin https://github.com/TU_USUARIO/malvinas.git
echo     git push -u origin main
echo.
echo  3. En GitHub: Settings ^> Pages ^> Source: GitHub Actions
echo  4. Tu juego quedara en: https://TU_USUARIO.github.io/malvinas/
echo.
echo  Mas detalles en README.md
echo.

if exist ".git" (
  echo  [Git] Repositorio detectado en esta carpeta.
  git status -sb 2>nul
  echo.
) else (
  echo  [Git] Aun no hay repositorio. Ejecuta: git init
  echo.
)

pause
