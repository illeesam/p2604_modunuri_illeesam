@echo off
chcp 65001 > nul
title [ShopJoy] 01. Gradle Clean Build

echo ============================================================
echo  ShopJoy EcAdminApi - Gradle Clean Build
echo ============================================================
echo.
echo  역할: 소스코드를 컴파일하여 실행 가능한 JAR 파일을 생성합니다.
echo  결과: build\libs\EcAdminApi-*.jar
echo.
echo  [주의] clean build 를 사용합니다.
echo         build 만 하면 Gradle 캐시에서 구 버전 Mapper XML 이
echo         그대로 JAR 에 포함되어 수정 내용이 반영되지 않습니다.
echo  [-x test] 단위 테스트를 건너뛰어 빌드 시간을 단축합니다.
echo.

rem ── 프로젝트 루트로 이동 ───────────────────────────────────────
set "PROJECT_DIR=C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi"

if not exist "%PROJECT_DIR%" (
    echo [ERROR] 프로젝트 디렉터리를 찾을 수 없습니다:
    echo         %PROJECT_DIR%
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%"
echo [INFO] 빌드 디렉터리: %CD%
echo.

rem ── Gradle Clean Build ─────────────────────────────────────────
echo [STEP 1/1] gradlew clean build -x test 실행 중...
echo            빌드 시간: 약 1~3 분 소요됩니다. 잠시 기다려주세요.
echo.
call .\gradlew.bat clean build -x test

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] 빌드 실패! ERRORLEVEL=%ERRORLEVEL%
    echo         위 로그에서 BUILD FAILED 원인을 확인하세요.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo  [SUCCESS] 빌드 완료
echo  JAR 위치: build\libs\EcAdminApi-*.jar
echo  다음 단계: 02_upload.bat 실행 (NAS 업로드)
echo ============================================================
echo.
pause
