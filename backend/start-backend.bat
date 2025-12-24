@echo off
setlocal enabledelayedexpansion

REM Start backend server
cd /d e:\RecoveredProjects\water-distribution-system\backend
echo Starting Water Distribution System Backend...
echo Current Directory: %cd%
echo.

REM Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found
    pause
    exit /b 1
)

REM Start the server
npm run dev

pause
