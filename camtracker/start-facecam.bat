@echo off
title FaceCam local server
cd /d "%~dp0"

echo.
echo  FaceCam - starting a local web server so Chrome/Edge will grant camera access.
echo  (file:// does NOT work for webcams - that is why no cameras were listed.)
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  echo  Serving this folder at http://localhost:8000
  start "" http://localhost:8000/index.html
  python -m http.server 8000
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo  Serving this folder at http://localhost:8000
  start "" http://localhost:8000/index.html
  py -m http.server 8000
  goto :eof
)

where npx >nul 2>nul
if %errorlevel%==0 (
  echo  Python not found - using npx serve instead.
  start "" http://localhost:8000/index.html
  npx --yes serve -l 8000 .
  goto :eof
)

echo  Neither Python nor Node.js was found on this PC.
echo.
echo  Easiest alternatives:
echo    - Install Python from https://python.org  (tick "Add to PATH"), then rerun this file.
echo    - Or in VS Code, install the "Live Server" extension, right-click index.html
echo      and choose "Open with Live Server".
echo.
pause
