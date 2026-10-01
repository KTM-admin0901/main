@echo off
rem Intranet portal: pull -> clasp push -> redeploy to the EXISTING deployment (URL stays the same).
rem Run from the repo folder:  deploy.cmd
setlocal
cd /d "%~dp0"

set SCRIPT_ID=1sd32gR9Ah_5v5qGSXmyfxWyGEO8v6ZnZDPQZ908FwlVffOQx6sWXJ1VP
set DEPLOYMENT_ID=AKfycbxOQfCmCwiy4My5VwY83qIxaZyEo4NC0pkTCUMZI2nL0y2t2Gjjxf-oDAMZYxyArbnbQg
set BRANCH=claude/internal-intranet-platform-bicxmr

echo [1/5] git pull
git fetch origin %BRANCH% || goto :err
git checkout %BRANCH% || goto :err
git pull origin %BRANCH% || goto :err

echo [2/5] npm install
call npm i --no-audit --no-fund || goto :err

echo [3/5] clasp project file
if not exist .clasp.json (
  powershell -NoProfile -Command "Set-Content -Encoding ascii .clasp.json '{\"scriptId\":\"%SCRIPT_ID%\",\"rootDir\":\"src\"}'" || goto :err
)

echo [4/5] clasp login (browser opens only if not logged in yet)
if not exist "%USERPROFILE%\.clasprc.json" call npx clasp login || goto :err

echo [5/5] push and redeploy
call npx clasp push -f || goto :err
call npx clasp deploy -i %DEPLOYMENT_ID% -d "auto deploy" || goto :err

echo.
echo DONE. Portal URL is unchanged.
echo If you added/changed apps in Setup.gs, run registerApps once in the GAS editor (npx clasp open).
exit /b 0

:err
echo.
echo FAILED. Copy the messages above and send them to Claude.
exit /b 1
