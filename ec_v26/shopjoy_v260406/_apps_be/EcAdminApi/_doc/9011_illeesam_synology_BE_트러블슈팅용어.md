# 백엔드(EcAdminApi) 배포 — 트러블슈팅/용어 (참고자료)

작성일: 2026-09-02
관련 문서: [11_illeesam_synology_BE_수동배포가이드.md](11_illeesam_synology_BE_수동배포가이드.md)

## 겪었던 문제 목록

| # | 증상 | 원인 | 해결 |
|---|---|---|---|
| 1 | FileZilla 같은 SFTP 프로그램으로 `/volume1/docker/...` 경로 접속 시 "그런 폴더 없음" 에러 | Synology SFTP는 접속 즉시 `/volume1`을 최상위 루트(`/`)로 취급함 — SFTP 프로그램 안의 `/`가 실제로는 `/volume1` | SFTP 프로그램에서는 `/volume1/docker/shopjoy/backend`가 아니라 **`/docker/shopjoy/backend`**로 접속 (`ssh`/`scp`/SSH 터미널은 실제 경로 `/volume1/...` 그대로 사용 — SFTP만의 특이 동작) |
| 2 | 백엔드 컨테이너 기동 실패, 로그에 `org.postgresql.util.PSQLException: The connection attempt failed.` / `Caused by: java.net.SocketTimeoutException: Connect timed out` | DB(Postgres)가 앱과 **같은 NAS**에 떠 있는데, 앱 컨테이너가 DB 주소를 `illeesam.synology.me`(NAS 자기 자신의 인터넷 주소)로 접속 시도 → "컨테이너→인터넷→공유기→다시 NAS"로 도는 경로(**NAT 헤어핀**)를 타서 공유기/방화벽 설정에 따라 막히거나 느려짐 | `docker-compose.yml`에 `extra_hosts: - "host.docker.internal:host-gateway"` 추가 + `.env`의 `DB_HOST=host.docker.internal`로 지정 → 컨테이너가 인터넷을 안 거치고 NAS 자신에게 직접 접속 (이미 반영돼 있어 이 문서대로 배포하면 재발 안 함) |

## 자주 쓰는 확인/운영 명령어 모음 (📦 NAS SSH 접속 후)

| 하고 싶은 것 | 명령어 |
|---|---|
| 컨테이너 상태 한눈에 보기 | `/usr/local/bin/docker compose ps` |
| 실시간 로그 보기(Ctrl+C로 중단) | `/usr/local/bin/docker compose logs -f ecadminapi` |
| 최근 로그 50줄만 보기 | `/usr/local/bin/docker compose logs --tail 50 ecadminapi` |
| 컨테이너만 재시작(코드 변경 없이) | `/usr/local/bin/docker compose restart ecadminapi` |
| 스택 전체 정지 | `/usr/local/bin/docker compose down` |
| 스택 다시 켜기 | `/usr/local/bin/docker compose up -d` |

(모든 명령은 먼저 `cd /volume1/docker/shopjoy/backend`로 이동한 뒤 실행합니다.)

## `dev` 프로파일과 `prod` 프로파일의 차이 (왜 지금 dev로 배포했는지)

지금은 **`dev` 프로파일**로 배포돼 있습니다. `prod`(운영) 프로파일은 아래 값들이 **필수**라서 하나라도 없으면 서버가 아예 기동되지 않습니다.

| 필수 값 | 설명 |
|---|---|
| `JWT_SECRET` | 로그인 토큰 암호화 키 |
| `LICENSE_SECRET` | 라이선스 검증 키 |
| `FRONTEND_DIR` | 프론트 파일 실제 경로 |
| `FRONTEND_BASE_URL` | 프론트 공개 주소 |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | 파일 업로드(S3) 키 |
| `NCP_ACCESS_KEY` / `NCP_SECRET_KEY` | 파일 업로드(네이버클라우드) 키 |

나중에 `prod`로 전환하려면, 위 값들을 실제 값으로 채워서 `/volume1/docker/shopjoy/backend/.env`에 추가하고 `SPRING_PROFILES_ACTIVE=prod`로 바꾼 뒤, [11_illeesam_synology_BE_수동배포가이드.md](11_illeesam_synology_BE_수동배포가이드.md) STEP 5(컨테이너 재기동)를 다시 실행하면 됩니다.

## 용어 설명

| 용어 | 뜻 |
|---|---|
| jar 파일 | 자바로 만든 프로그램을 실행 가능한 형태로 묶은 파일. `java -jar 파일명`으로 실행 |
| Docker 이미지 | 프로그램 + 실행 환경을 통째로 담은 "설치 패키지" 같은 것 |
| Docker 컨테이너 | 그 이미지를 실제로 실행시킨 상태(=지금 돌아가고 있는 프로그램) |
| docker compose | 여러 개의 컨테이너(백엔드+nginx 등)를 한 번에 관리하는 도구, 설정은 `docker-compose.yml`에 적음 |
| 헬스체크(health check) | "이 서버가 정상적으로 잘 살아있나?"를 자동으로 확인하는 기능. `{"status":"UP"}`이 정상 응답 |
| nginx | 웹서버 프로그램. 여기서는 (1) 정적 파일(HTML/JS/CSS) 서빙 (2) API 요청을 백엔드로 전달(리버스 프록시) 역할 |
| .env 파일 | 비밀번호처럼 민감하거나 환경마다 바뀌는 값을 따로 모아두는 파일. 깃허브에는 올리지 않음 |
