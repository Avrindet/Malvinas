@echo off
chcp 65001 >nul 2>&1
echo Cerrando servidores en puertos 8080-8095...
for /L %%p in (8080,1,8095) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p " ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
  )
)
echo Listo. Ahora podes ejecutar iniciar.bat de nuevo.
pause
