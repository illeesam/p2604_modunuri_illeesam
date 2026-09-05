@echo off
REM ============================================================
REM IntelliJ + VSCode 듀얼 환경에서 IDE 빌드 캐시 충돌 정리
REM
REM 증상: FileNotFoundException ...Repository.class cannot be opened
REM 원인: bin/ (VSCode), out/ (IntelliJ), build/ (Gradle) 의 stale 클래스 충돌
REM 해결: 모두 삭제 후 Gradle clean build 단일 출처로 통일
REM ============================================================

cd /d "%~dp0\.."

echo [1/3] IDE 빌드 산출물 삭제 (bin, out)...
if exist bin   rmdir /S /Q bin
if exist out   rmdir /S /Q out

echo [2/3] Gradle clean...
call gradlew.bat clean
if errorlevel 1 goto :error

echo [3/3] Gradle compileJava...
call gradlew.bat compileJava
if errorlevel 1 goto :error

echo.
echo ================================================================
echo  CLEAN REBUILD SUCCESS
echo  이제 IDE 에서 'Reload Project' / 'Refresh Gradle' 한 번 실행하세요:
echo    - IntelliJ: View - Tool Windows - Gradle - Reload All Gradle Projects
echo    - VSCode  : Cmd/Ctrl+Shift+P - 'Java: Clean Java Language Server Workspace'
echo ================================================================
goto :end

:error
echo.
echo ================================================================
echo  CLEAN REBUILD FAILED. 위 에러를 확인하세요.
echo ================================================================
exit /b 1

:end
