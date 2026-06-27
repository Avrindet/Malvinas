@echo off
chcp 65001 >nul 2>&1
title Malvinas - Servidor Local
cd /d "%~dp0"
echo.
echo  ========================================
echo   Malvinas - Por los caidos
echo  ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
if errorlevel 1 (
  echo.
  echo  El servidor no pudo iniciarse.
  pause
)
