@echo off
chcp 65001 > nul
title [ShopJoy] 06. Container Start

echo ============================================================
echo  ShopJoy EcAdminApi - 컨테이너 시작
echo ============================================================
echo.
echo  역할: 정지(stop) 상태의 컨테이너를 다시 기동합니다.
echo        컨테이너가 이미 존재하므로 포트·볼륨·환경변수 설정이
echo        그대로 유지됩니다. (docker run 재실행 불필요)
echo.
echo  [주의] 컨테이너가 완전히 뜨는 데 약 20~40 초 소요됩니다.
echo         기동 완료 확인: http://illeesam.synology.me:21080/actuator/health
echo.
echo  컨테이너: 210-ecadminApi
echo.
echo [STEP 1/1] docker start 실행 중...
echo            패스워드 입력: song5xxxxx
echo.

ssh -p 10022 illeesam@illeesam.synology.me "docker start 210-ecadminApi && echo '[OK] 시작 완료' && docker ps --filter name=210-ecadminApi --format 'STATUS: {{.Status}}'"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] 시작 실패.
    echo  - NAS SSH 접속 가능 여부 확인 (illeesam.synology.me:10022)
    echo  - 컨테이너 존재 여부 확인: 08_status.bat
    echo  - 컨테이너가 없는 경우 README 의 [6] docker run 명령 참조
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo  [SUCCESS] 컨테이너 시작 완료
echo  Spring Boot 기동까지 약 20~40 초 소요됩니다.
echo  Health : http://illeesam.synology.me:21080/actuator/health
echo  로그확인: 04_logs.bat 실행
echo ============================================================
echo.
pause
