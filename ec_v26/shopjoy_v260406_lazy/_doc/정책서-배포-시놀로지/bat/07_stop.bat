@echo off
chcp 65001 > nul
title [ShopJoy] 07. Container Stop

echo ============================================================
echo  ShopJoy EcAdminApi - 컨테이너 정지
echo ============================================================
echo.
echo  역할: 실행 중인 컨테이너를 정지합니다.
echo        컨테이너는 삭제되지 않습니다. (설정·볼륨 유지)
echo        언제든 06_start.bat 으로 재기동할 수 있습니다.
echo.
echo  [docker stop vs docker rm]
echo    docker stop: 컨테이너 정지만 합니다. (이 파일이 하는 동작)
echo    docker rm  : 컨테이너를 삭제합니다. 삭제 후에는 docker run
echo                 으로 다시 생성해야 합니다. (운영 중 실행 금지)
echo.
echo  컨테이너: 210-ecadminApi
echo.

set /p CONFIRM="정말 서버를 정지하시겠습니까? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo [INFO] 취소되었습니다.
    pause
    exit /b 0
)

echo.
echo [STEP 1/1] docker stop 실행 중...
echo            패스워드 입력: song5xxxxx
echo            진행 중인 요청이 처리될 때까지 최대 10 초 대기 후 정지합니다.
echo.

ssh -p 10022 illeesam@illeesam.synology.me "docker stop 210-ecadminApi && echo '[OK] 정지 완료'"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] 정지 실패.
    echo  - NAS SSH 접속 가능 여부 확인 (illeesam.synology.me:10022)
    echo  - 컨테이너 상태 확인: 08_status.bat
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo  [SUCCESS] 컨테이너 정지 완료
echo  컨테이너는 삭제되지 않았습니다. (설정 유지)
echo  재시작하려면: 06_start.bat 실행
echo ============================================================
echo.
pause
