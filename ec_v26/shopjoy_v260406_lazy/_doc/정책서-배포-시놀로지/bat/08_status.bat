@echo off
chcp 65001 > nul
title [ShopJoy] 08. Server Status Check

echo ============================================================
echo  ShopJoy EcAdminApi - 서버 상태 확인
echo ============================================================
echo.
echo  역할: 컨테이너 상태와 API 응답을 한 번에 확인합니다.
echo        재배포 후, 기동 후, 문제 발생 시 먼저 실행하세요.
echo.
echo  확인 항목:
echo    [1] 210-ecadminApi 컨테이너 상태 (Running / Exited 등)
echo    [2] 176-postgres-17.2 DB 컨테이너 상태
echo    [3] API Health Check (HTTP 응답 {"status":"UP"} 확인)
echo.
echo  패스워드 입력: song5xxxxx
echo.

rem ── STEP 1: ecadminApi 컨테이너 상태 ─────────────────────────
echo [STEP 1/3] ecadminApi 컨테이너 상태 확인...
echo            Running: 정상 실행 중
echo            Exited : 정지 상태 (06_start.bat 으로 재시작)
echo.
ssh -p 10022 illeesam@illeesam.synology.me "docker ps -a --filter name=210-ecadminApi --format 'NAME: {{.Names}}  STATUS: {{.Status}}  PORTS: {{.Ports}}'"
echo.

rem ── STEP 2: PostgreSQL 컨테이너 상태 ─────────────────────────
echo [STEP 2/3] PostgreSQL 컨테이너 상태 확인...
echo            DB 컨테이너가 Exited 상태이면 API 도 DB 접속 오류 발생
echo.
ssh -p 10022 illeesam@illeesam.synology.me "docker ps -a --filter name=176-postgres-17.2 --format 'NAME: {{.Names}}  STATUS: {{.Status}}'"
echo.

rem ── STEP 3: API Health Check ──────────────────────────────────
echo [STEP 3/3] API Health Check...
echo            정상: {"status":"UP"}
echo            실패: 컨테이너가 기동 중이거나 포트 오류
echo.
curl -s --connect-timeout 5 http://illeesam.synology.me:21080/actuator/health
if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARN] API Health Check 실패
    echo        - 컨테이너가 기동 중일 수 있습니다 (기동까지 약 20~40 초)
    echo        - 컨테이너가 Exited 상태이면 06_start.bat 실행
    echo        - 로그 확인: 04_logs.bat
)
echo.

echo ============================================================
echo  Swagger UI : http://illeesam.synology.me:21080/swagger-ui.html
echo  Health     : http://illeesam.synology.me:21080/actuator/health
echo ============================================================
echo.
pause
