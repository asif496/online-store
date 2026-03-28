# start-dev.ps1 — Launch backend + frontend (PowerShell)
# Usage: Right-click → Run with PowerShell
# Or from terminal: .\start-dev.ps1

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║      Online Store — Dev Launcher     ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start backend
Write-Host "  [1/2] Starting backend  → http://localhost:3000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev" `
    -WindowStyle Normal

Start-Sleep -Seconds 2

# Start frontend
Write-Host "  [2/2] Starting frontend → http://localhost:8080" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npx http-server -p 8080 --cors -o" `
    -WindowStyle Normal

Write-Host ""
Write-Host "  ✅  Both servers started in separate windows." -ForegroundColor Green
Write-Host "      Backend  → http://localhost:3000" -ForegroundColor Green
Write-Host "      Frontend → http://localhost:8080" -ForegroundColor Green
Write-Host ""
