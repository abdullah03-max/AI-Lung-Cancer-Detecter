@echo off
title PulmoScan AI App Launcher
echo ====================================================
echo Starting PulmoScan AI (Backend + Frontend)...
echo ====================================================

start "PulmoScan Backend" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"
start "PulmoScan Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [+] Backend running on http://127.0.0.1:8000
echo [+] Frontend running on http://localhost:5173
echo.
echo Both services have been launched in separate windows!
pause
