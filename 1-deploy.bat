@echo off
cd /d "%~dp0"
echo Push to GitHub - FleetPulseApp (mobile)
echo Repo: https://github.com/prushscripts/FleetPulseApp
echo.
echo Staging all changes...
git add .
echo Committing...
git commit -m "Deploy" 2>nul || echo (no changes to commit)
echo Pushing to origin...
git push
echo.
echo Done. Remote updated on GitHub.
echo For store builds: eas build --platform ios   or   eas build --platform android
pause
