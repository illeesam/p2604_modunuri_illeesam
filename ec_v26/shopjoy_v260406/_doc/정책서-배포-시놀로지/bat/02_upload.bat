@echo off
chcp 65001 > nul
title [ShopJoy] 02. JAR Upload to NAS

echo ============================================================
echo  ShopJoy EcAdminApi - JAR Upload to NAS (SCP)
echo ============================================================
echo.
echo  역할: 빌드된 JAR 파일을 NAS 서버에 업로드합니다.
echo        NAS 의 Docker 컨테이너는 이 JAR 를 마운트하여 실행합니다.
echo.
echo  전송 방식: SCP (SSH 기반 보안 파일 전송)
echo  로컬 경로: build\libs\EcAdminApi-*.jar  (자동 탐색)
echo  원격 경로: /volume1/docker/ecadminapi/app/EcAdminApi.jar
echo             (파일명은 EcAdminApi.jar 로 고정 저장됩니다)
echo.
echo  [주의] 전제조건: Windows OpenSSH 설치 필요
echo         설정 - 앱 - 선택적 기능 - OpenSSH 클라이언트
echo         또는 MobaXterm 터미널에서 실행
echo.

rem ── 설정 ──────────────────────────────────────────────────────
set "PROJECT_DIR=C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi"
set "NAS_HOST=illeesam.synology.me"
set "NAS_PORT=10022"
set "NAS_USER=illeesam"
set "NAS_REMOTE_PATH=/volume1/docker/ecadminapi/app/EcAdminApi.jar"

cd /d "%PROJECT_DIR%"

rem ── JAR 파일 탐색 ──────────────────────────────────────────────
set "JAR_FILE="
for /f "delims=" %%f in ('dir /b /s "build\libs\EcAdminApi-*.jar" 2^>nul') do set "JAR_FILE=%%f"

if "%JAR_FILE%"=="" (
    echo [ERROR] JAR 파일을 찾을 수 없습니다.
    echo         먼저 01_build.bat 를 실행하여 빌드하세요.
    pause
    exit /b 1
)

echo [INFO] 업로드할 JAR: %JAR_FILE%
echo [INFO] 업로드 대상 : %NAS_USER%@%NAS_HOST%:%NAS_REMOTE_PATH%
echo.
echo [STEP 1/1] SCP 업로드 중...
echo            패스워드 입력: song5xxxxx
echo            파일 크기에 따라 1~2 분 소요될 수 있습니다.
echo.

scp -P %NAS_PORT% "%JAR_FILE%" %NAS_USER%@%NAS_HOST%:%NAS_REMOTE_PATH%

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] 업로드 실패!
    echo  - Windows OpenSSH 설치 확인 (scp 명령이 없으면 오류 발생)
    echo  - NAS 접속 가능 여부 확인 (인터넷 연결, illeesam.synology.me)
    echo  - 패스워드: song5xxxxx
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo  [SUCCESS] 업로드 완료
echo  %NAS_HOST%:%NAS_REMOTE_PATH%
echo  다음 단계: 03_restart.bat 실행 (컨테이너 재시작)
echo ============================================================
echo.
pause
