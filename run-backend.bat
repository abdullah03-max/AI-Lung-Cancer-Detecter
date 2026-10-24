@echo off
title PulmoScan AI Backend
echo ==============================================
echo Starting PulmoScan AI Backend (FastAPI)...
echo ==============================================
cd /d "%~dp0"
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
