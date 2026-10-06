@echo off
chcp 65001 >nul
title DailyFlow AI - Local Development Launcher
color 0B

echo ========================================================
echo        🚀 DailyFlow AI - Full-Stack Dev Launcher
echo ========================================================
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Verify Backend .env
if not exist "backend\.env" (
    echo [!] backend\.env not found. Creating from .env.example...
    copy "backend\.env.example" "backend\.env" >nul
    echo [*] Created backend\.env - remember to fill in DATABASE_URL and JWT_SECRET!
)

:: 3. Verify Frontend .env
if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env" >nul
        echo [*] Created frontend\.env
    )
)

:: 4. Check dependencies
if not exist "backend\node_modules" (
    echo [*] Installing backend dependencies...
    cd backend && call npm install && cd ..
)

if not exist "frontend\node_modules" (
    echo [*] Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)

echo.
echo ========================================================
echo   Starting Backend (port 4000) & Frontend (port 5173)...
echo ========================================================
echo.

:: 5. Launch Backend in separate window
start "DailyFlow Backend (Port 4000)" cmd /k "cd backend && npm run dev"

:: 6. Launch Frontend in separate window
start "DailyFlow Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

:: 7. Wait briefly and open browser
timeout /t 3 /nobreak >nul
echo [*] Opening DailyFlow in your browser...
start http://localhost:5173

echo.
echo [✓] Both servers are running in separate terminal windows.
echo     - Backend:  http://localhost:4000
echo     - Frontend: http://localhost:5173
echo.
echo Press any key to close this launcher window (servers stay running)...
pause >nul
