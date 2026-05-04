@echo off
chcp 65001 > nul
title [ShopJoy] 03. Container Restart

echo ============================================================
echo  ShopJoy EcAdminApi - NAS 컨테이너 재시작
echo ============================================================
echo.
echo  역할: NAS 의 Docker 컨테이너를 재시작합니다.
echo        재시작하면 JVM 이 종료되고, 마운트된 EcAdminApi.jar 를
echo        새로 읽어 Spring Boot 가 다시 기동됩니다.
echo        → 소스 변경 후 02_upload.bat 완료 시 이 파일을 실행하세요.
echo.
echo  [주의] 컨테이너가 완전히 뜨는 데 약 20~40 초 소요됩니다.
echo         재시작 후 04_logs.bat 으로 기동 로그를 확인하세요.
echo.
echo  NAS  : illeesam.synology.me:10022
echo  컨테이너: 210-ecadminApi
echo.
echo [STEP 1/1] SSH 접속 후 docker restart 실행 중...
echo            패스워드 입력: song5xxxxx
echo.

ssh -p 10022 illeesam@illeesam.synology.me "docker restart 210-ecadminApi && echo '[OK] 재시작 완료' && docker ps --filter name=210-ecadminApi --format 'STATUS: {{.Status}}'"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] SSH 명령 실패.
    echo  - NAS 접속 가능 여부 확인 (illeesam.synology.me:10022)
    echo  - 패스워드: song5xxxxx
    echo  - 컨테이너가 존재하는지 확인: 08_status.bat
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo  [SUCCESS] 컨테이너 재시작 완료
echo  Spring Boot 기동 로그 확인: 04_logs.bat 실행
echo  기동 완료 확인: http://illeesam.synology.me:21080/actuator/health
echo ============================================================
echo.
pause
