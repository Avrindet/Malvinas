@echo off
chcp 65001 >nul 2>&1
title Malvinas - Configurar pagos
cd /d "%~dp0"

echo.
echo  ==========================================
echo   Malvinas - Configurar links de pago
echo  ==========================================
echo.
echo  1. Crear cuenta en https://www.mercadopago.com.ar
echo  2. Crear dos "Links de pago":
echo       - Abono continuar mision  ($500)
echo       - Paquete de municion     ($200)
echo  3. Pegar las URLs en js\config.js
echo.
echo  Guia completa: PAGOS.md
echo.

if exist "PAGOS.md" start "" "PAGOS.md"
if exist "js\config.js" start notepad "js\config.js"

echo  Se abrio PAGOS.md y js\config.js
echo  Cuando termines, guarda config.js y proba con iniciar.bat
echo.
pause
