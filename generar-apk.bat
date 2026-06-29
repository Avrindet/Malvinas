@echo off
chcp 65001 >nul 2>&1
title Malvinas - Generar APK para Play Store
cd /d "%~dp0"

echo.
echo  ========================================
echo   Malvinas - Generar app Android (TWA)
echo  ========================================
echo.
echo  Guia completa: PLAY-STORE.md
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  [X] Node.js no esta instalado.
  echo      Descargalo de https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where java >nul 2>&1
if errorlevel 1 (
  echo  [X] Java JDK no esta instalado.
  echo      Necesario para Bubblewrap. Ver PLAY-STORE.md
  echo.
  pause
  exit /b 1
)

where bubblewrap >nul 2>&1
if errorlevel 1 (
  echo  Instalando Bubblewrap (solo la primera vez)...
  call npm install -g @bubblewrap/cli
  if errorlevel 1 (
    echo  No se pudo instalar Bubblewrap.
    pause
    exit /b 1
  )
)

echo  Comprobando entorno...
call bubblewrap doctor
if errorlevel 1 (
  echo.
  echo  Corregi lo que marque bubblewrap doctor (Android SDK, etc.)
  echo  Ver PLAY-STORE.md
  pause
  exit /b 1
)

if not exist "android\app" (
  echo.
  echo  Primera vez: hay que inicializar el proyecto Android.
  echo  Se abrira un asistente interactivo.
  echo.
  cd android
  call bubblewrap init --manifest=https://avrindet.github.io/Malvinas/manifest.webmanifest
  if errorlevel 1 (
    cd ..
    pause
    exit /b 1
  )
  cd ..
  echo.
  echo  IMPORTANTE: actualiza .well-known/assetlinks.json con el SHA256
  echo  de tu keystore y hace git push antes de probar en el celular.
  echo  Ver PLAY-STORE.md - Paso 4
  echo.
  pause
  exit /b 0
)

echo.
echo  Generando APK y AAB firmados...
cd android
call bubblewrap build
set BUILD_ERR=%ERRORLEVEL%
cd ..

if %BUILD_ERR% neq 0 (
  echo.
  echo  Error al compilar. Revisa PLAY-STORE.md
  pause
  exit /b 1
)

echo.
echo  Listo. Archivos en la carpeta android:
echo    - app-release-signed.apk   (probar en el celular)
echo    - app-release-bundle.aab   (subir a Play Console)
echo.
pause
