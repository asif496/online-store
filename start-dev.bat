@echo off
REM ══════════════════════════════════════════════════════════════
REM  start-dev.bat  —  Launch backend + frontend in two windows
REM  Run this from the project root: online-store\start-dev.bat
REM ══════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════╗
echo  ║      Online Store — Dev Launcher     ║
echo  ╚══════════════════════════════════════╝
echo.

REM ── Backend ────────────────────────────────────────────────────
echo  [1/2] Starting backend on http://localhost:3000 ...
start "Online Store — Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Give the backend 2 seconds to boot before launching the frontend
timeout /t 2 /nobreak >nul

REM ── Frontend ───────────────────────────────────────────────────
echo  [2/2] Starting frontend on http://localhost:8080 ...
start "Online Store — Frontend" cmd /k "cd /d %~dp0frontend && npx http-server -p 8080 --cors -o"

echo.
echo  ✅  Both servers are starting in separate windows.
echo      Backend  →  http://localhost:3000
echo      Frontend →  http://localhost:8080
echo.
echo  Press any key to close this launcher window...
pause >nul
