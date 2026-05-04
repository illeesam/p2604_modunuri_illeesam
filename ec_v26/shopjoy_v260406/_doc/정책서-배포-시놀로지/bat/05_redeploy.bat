@echo off
chcp 65001 > nul
title [ShopJoy] 05. Full Redeploy (Build + Upload + Restart)

echo ============================================================
echo  ShopJoy EcAdminApi - 전체 재배포 (원클릭)
echo ============================================================
echo.
echo  역할: 소스 변경 후 서버 반영까지 3단계를 자동으로 처리합니다.
echo        각 단계 실패 시 즉시 중단되므로 결과 메시지를 확인하세요.
echo.
echo  순서:
echo    [1] Gradle clean build -x test  (소스 → JAR 컴파일)
echo    [2] SCP 업로드                  (JAR → NAS 전송)
echo    [3] docker restart              (새 JAR 로 Spring Boot 재기동)
echo.
echo  패스워드: song5xxxxx  ([2][3] 단계에서 각 1회 입력)
echo.

set "PROJECT_DIR=C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi"
set "NAS_HOST=illeesam.synology.me"
set "NAS_PORT=10022"
set "NAS_USER=illeesam"
set "NAS_REMOTE_PATH=/volume1/docker/ecadminapi/app/EcAdminApi.jar"
set "CONTAINER=210-ecadminApi"

rem ═══════════════════════════════════════
rem  STEP 1: Gradle Clean Build
rem  clean: 이전 빌드 캐시 삭제 (Mapper XML 등 구 버전 제거)
rem  build: 전체 컴파일 + JAR 생성
rem  -x test: 단위 테스트 생략 (시간 단축)
rem ═══════════════════════════════════════
echo [STEP 1/3] Gradle clean build -x test ...
echo            약 1~3 분 소요됩니다. 잠시 기다려주세요.
echo.
cd /d "%PROJECT_DIR%"
call .\gradlew.bat clean build -x test

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] 빌드 실패. 재배포 중단.
    echo         위 로그에서 BUILD FAILED 원인을 확인하세요.
    pause
    exit /b %ERRORLEVEL%
)
echo [STEP 1/3] 빌드 완료
echo.

rem ═══════════════════════════════════════
rem  STEP 2: SCP Upload
rem  build\libs\ 에서 EcAdminApi-*.jar 를 자동 탐색하여
rem  NAS 의 고정 경로 /volume1/.../EcAdminApi.jar 로 덮어씁니다.
rem ═══════════════════════════════════════
set "JAR_FILE="
for /f "delims=" %%f in ('dir /b /s "build\libs\EcAdminApi-*.jar" 2^>nul') do set "JAR_FILE=%%f"

if "%JAR_FILE%"=="" (
    echo [ERROR] JAR 파일을 찾을 수 없습니다. 빌드 결과 확인
    pause
    exit /b 1
)

echo [STEP 2/3] SCP 업로드: %JAR_FILE%
echo            패스워드 입력: song5xxxxx
echo.
scp -P %NAS_PORT% "%JAR_FILE%" %NAS_USER%@%NAS_HOST%:%NAS_REMOTE_PATH%

if %ERRORLEVEL% neq 0 (
    echo [ERROR] 업로드 실패. 재배포 중단.
    echo         NAS 접속 또는 OpenSSH 설치 여부를 확인하세요.
    pause
    exit /b %ERRORLEVEL%
)
echo [STEP 2/3] 업로드 완료
echo.

rem ═══════════════════════════════════════
rem  STEP 3: Container Restart
rem  docker restart: 컨테이너를 stop 후 start 합니다.
rem  재시작 시 마운트된 EcAdminApi.jar (새 버전) 를 읽어 Spring Boot 기동.
rem  기동 완료까지 약 20~40 초 소요됩니다.
rem ═══════════════════════════════════════
echo [STEP 3/3] 컨테이너 재시작: %CONTAINER%
echo            패스워드 입력: song5xxxxx
echo.
ssh -p %NAS_PORT% %NAS_USER%@%NAS_HOST% "docker restart %CONTAINER% && docker ps --filter name=%CONTAINER% --format 'STATUS: {{.Status}}'"

if %ERRORLEVEL% neq 0 (
    echo [ERROR] 컨테이너 재시작 실패.
    echo         NAS SSH 접속 및 컨테이너 상태를 08_status.bat 으로 확인하세요.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo  [SUCCESS] 전체 재배포 완료
echo  Spring Boot 기동까지 약 20~40 초 소요됩니다.
echo  Health : http://%NAS_HOST%:21080/actuator/health
echo  Swagger: http://%NAS_HOST%:21080/swagger-ui.html
echo  로그확인: 04_logs.bat 실행
echo ============================================================
echo.
pause
