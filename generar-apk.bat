@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

rem Si lo abren con doble clic, relanzar en ventana que no se cierra sola
if /i not "%~1"=="keepopen" (
  start "Malvinas - Generar APK" cmd /k "%~f0" keepopen
  exit /b
)

title Malvinas - Generar APK para Play Store
cd /d "%~dp0"
set "LOG=%~dp0generar-apk.log"

echo. > "%LOG%"
call :log "=== Inicio %date% %time% ==="

echo.
echo  ========================================
echo   Malvinas - Generar app Android (TWA)
echo  ========================================
echo.
echo  Guia completa: PLAY-STORE.md
echo  Log de esta ejecucion: generar-apk.log
echo.

call :find_node
if errorlevel 1 goto :fail_node

call :find_java
if errorlevel 1 goto :fail_java

set "BW=npx --yes @bubblewrap/cli"
call :log "Usando: %BW%"

echo  Comprobando entorno (puede tardar la primera vez)...
call :log "Ejecutando bubblewrap doctor"
call %BW% doctor
set "DOC_ERR=!ERRORLEVEL!"
call :log "bubblewrap doctor exit: !DOC_ERR!"

if !DOC_ERR! neq 0 (
  echo.
  echo  [!] bubblewrap doctor reporto problemas.
  echo      Revisa arriba que Node, Java y Android SDK esten OK.
  echo      Guia: PLAY-STORE.md
  goto :end
)

if not exist "android\app" (
  echo.
  echo  Primera vez: se abrira un asistente interactivo.
  echo  Responde las preguntas en pantalla.
  echo.
  cd android
  call %BW% init --manifest=https://avrindet.github.io/Malvinas/manifest.webmanifest
  set "INIT_ERR=!ERRORLEVEL!"
  cd ..
  call :log "bubblewrap init exit: !INIT_ERR!"
  if !INIT_ERR! neq 0 goto :end
  echo.
  echo  IMPORTANTE: actualiza .well-known/assetlinks.json con el SHA256
  echo  del keystore y hace git push. Ver PLAY-STORE.md - Paso 4
  goto :end
)

echo.
echo  Generando APK y AAB firmados...
cd android
call %BW% build
set "BUILD_ERR=!ERRORLEVEL!"
cd ..
call :log "bubblewrap build exit: !BUILD_ERR!"

if !BUILD_ERR! neq 0 (
  echo.
  echo  Error al compilar. Revisa PLAY-STORE.md
  goto :end
)

echo.
echo  Listo. Archivos en la carpeta android:
echo    - app-release-signed.apk   (probar en el celular)
echo    - app-release-bundle.aab   (subir a Play Console)
goto :end

:fail_node
echo  [X] Node.js no esta instalado o no esta en el PATH.
echo.
echo  Si ya lo instalaste:
echo    1. Cerra esta ventana
echo    2. Reinicia la PC (o cierra sesion y volve a entrar)
echo    3. Volve a ejecutar generar-apk.bat
echo.
echo  Descarga: https://nodejs.org/en/download  (Windows Installer .msi)
goto :end

:fail_java
echo  [X] Java JDK no esta instalado o no esta en el PATH.
echo.
echo  Descarga JDK 17: https://adoptium.net/
echo  Guia: PLAY-STORE.md
goto :end

:find_node
where node >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%v in ('node -v 2^>^&1') do call :log "Node: %%v"
  exit /b 0
)
if exist "%ProgramFiles%\nodejs\node.exe" (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
  for /f "delims=" %%v in ('node -v 2^>^&1') do call :log "Node: %%v"
  exit /b 0
)
exit /b 1

:find_java
where java >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%v in ('java -version 2^>^&1 ^| findstr /i version') do call :log "Java: %%v"
  exit /b 0
)
if exist "C:\Program Files\Eclipse Adoptium\jdk-17*\bin\java.exe" (
  for /d %%d in ("C:\Program Files\Eclipse Adoptium\jdk-17*") do set "PATH=%%d\bin;%PATH%"
  for /f "delims=" %%v in ('java -version 2^>^&1 ^| findstr /i version') do call :log "Java: %%v"
  exit /b 0
)
exit /b 1

:log
echo %~1
echo %~1>> "%LOG%"
exit /b 0

:end
echo.
echo  === Fin ===  (detalle en generar-apk.log)
echo  Presiona una tecla para cerrar...
pause >nul
endlocal
exit /b 0
