@echo off
echo ============================================
echo   Starting Thesis App (backend + frontend + tunnel)
echo ============================================
echo.

echo Starting Laravel backend on port 8000...
start "Backend - Laravel" cmd /k "cd /d %~dp0backend && php artisan serve --host=0.0.0.0 --port=8000"
timeout /t 2 /nobreak >nul

echo Starting Vite frontend on port 5173...
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Cloudflare tunnel (thesis-app)...
start "Tunnel - Cloudflared" cmd /k "cloudflared tunnel run thesis-app"

echo.
echo ============================================
echo   All three are launching in separate windows.
echo   Check each window for "running"/"healthy" messages.
echo   Leave all three open while you use the app.
echo   This window can be closed - it's done its job.
echo ============================================
pause
