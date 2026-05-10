@echo off
setlocal enabledelayedexpansion
rem Auto-download Gradle distribution if needed, then run it
set DIST=gradle-8.6
set ZIP=.gradle\wrapper\%DIST%-bin.zip
set EXTRACTDIR=.gradle\wrapper\%DIST%

if exist "%EXTRACTDIR%\bin\gradle.bat" goto run

echo Gradle not found locally. Attempting to download %DIST%...
powershell -Command "try { New-Item -ItemType Directory -Force -Path '.gradle\wrapper' | Out-Null; Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/%DIST%-bin.zip' -OutFile '%ZIP%'; Expand-Archive -Force -Path '%ZIP%' -DestinationPath '.gradle\wrapper' } catch { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
  echo Failed to download or extract Gradle. Please install Gradle manually.
  exit /b 1
)

:run
"%EXTRACTDIR%\bin\gradle.bat" %*

