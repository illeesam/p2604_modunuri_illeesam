@echo off
chcp 65001 > nul
title [ShopJoy] 04. Live Logs

echo ============================================================
echo  ShopJoy EcAdminApi - 실시간 로그
echo ============================================================
echo.
echo  역할: NAS 컨테이너의 로그를 실시간으로 스트리밍합니다.
echo        Spring Boot 기동 상태, API 요청/응답, 오류 메시지를
echo        실시간으로 확인할 수 있습니다.
echo.
echo  [--tail 100] 접속 시점 기준 최근 100 줄부터 출력합니다.
echo  [-f]         새 로그가 출력될 때마다 자동으로 화면에 추가됩니다.
echo               (follow 모드 - Ctrl+C 로 종료)
echo.
echo  기동 완료 확인 문자열:
echo    "Started EcAdminApiApplication in X.XXX seconds"
echo.
echo  NAS  : illeesam.synology.me:10022
echo  컨테이너: 210-ecadminApi
echo.
echo [STEP 1/1] 실시간 로그 스트림 시작... (Ctrl+C 로 종료)
echo            패스워드 입력: song5xxxxx
echo.

ssh -p 10022 illeesam@illeesam.synology.me "docker logs -f --tail 100 210-ecadminApi"

echo.
echo [INFO] 로그 스트림 종료 (Ctrl+C 또는 SSH 연결 끊김)
pause
