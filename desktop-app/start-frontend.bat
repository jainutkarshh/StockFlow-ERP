@echo off
setlocal enabledelayedexpansion

REM Start frontend server
cd /d e:\RecoveredProjects\water-distribution-system\desktop-app
echo Starting Water Distribution System Frontend (Electron)...
echo Current Directory: %cd%
echo.

REM Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found
    pause
    exit /b 1
)

REM Start the Electron app
npm run dev

pause
