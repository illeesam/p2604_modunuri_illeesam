# 백엔드(EcAdminApi) 배포 — 트러블슈팅/용어 (참고자료)

작성일: 2026-09-02
관련 문서: [11_illeesam_synology_BE_수동배포가이드(synology).md](<11_illeesam_synology_BE_수동배포가이드(synology).md>)

## 겪었던 문제 목록

| # | 증상 | 원인 | 해결 |
|---|---|---|---|
| 1 | FileZilla 같은 SFTP 프로그램으로 `/volume1/docker/...` 경로 접속 시 "그런 폴더 없음" 에러 | Synology SFTP는 접속 즉시 `/volume1`을 최상위 루트(`/`)로 취급함 — SFTP 프로그램 안의 `/`가 실제로는 `/volume1` | SFTP 프로그램에서는 `/volume1/docker/shopjoy/backend`가 아니라 **`/docker/shopjoy/backend`**로 접속 (`ssh`/`scp`/SSH 터미널은 실제 경로 `/volume1/...` 그대로 사용 — SFTP만의 특이 동작) |
| 2 | 백엔드 컨테이너 기동 실패, 로그에 `org.postgresql.util.PSQLException: The connection attempt failed.` / `Caused by: java.net.SocketTimeoutException: Connect timed out` | DB(Postgres)가 앱과 **같은 NAS**에 떠 있는데, 앱 컨테이너가 DB 주소를 `illeesam.synology.me`(NAS 자기 자신의 인터넷 주소)로 접속 시도 → "컨테이너→인터넷→공유기→다시 NAS"로 도는 경로(**NAT 헤어핀**)를 타서 공유기/방화벽 설정에 따라 막히거나 느려짐 | `docker-compose.yml`에 `extra_hosts: - "host.docker.internal:host-gateway"` 추가 + `.env`의 `DB_HOST=host.docker.internal`로 지정 → 컨테이너가 인터넷을 안 거치고 NAS 자신에게 직접 접속 (이미 반영돼 있어 이 문서대로 배포하면 재발 안 함) |
| 3 | 배포 계정을 바꾼 뒤(예: `illeesam` → `appuser`) `deploy:dev-synol-be-api`/`fe` 실행 시 SFTP 업로드 단계에서 `SFTP 업로드 실패: No such file` | 새 계정이 옛 계정과 **동일한 NAS 권한**을 안 갖고 있음 — SFTP는 로그인 자체는 되지만(비밀번호 인증 통과) 그 다음 파일 접근 권한이 없어서 "파일이 없다"로 나타남(실제로는 권한 문제) | 아래 [계정 설정 시 주의사항](#계정-설정-시-주의사항-nas-쪽-배포-계정) 참조 — 4가지를 옛 계정과 동일하게 맞춰야 함 |
| 4 | 계정을 바꾼 뒤 `deploy:dev-synol-fe-vue3cdn` 실행 시 SFTP 업로드는 성공했는데 `rm: cannot remove '/volume1/docker/shopjoy/frontend/....js': Permission denied`가 파일마다 쭉 뜨면서 배포 실패(`[FE-실패]`) | `frontend/` 안의 기존 파일들이 **옛 계정(`illeesam`) 소유**로 만들어져 있음 — 새 계정(`appuser`)이 그 공유폴더에 읽기/쓰기 권한이 있어도, **이미 존재하는 파일**의 소유권 자체는 자동으로 안 넘어가서 그 파일들을 못 지움(새로 만드는 파일은 문제없음 — 기존 파일만 문제) | 관리자 권한 있는 계정(기존 `illeesam` 등)으로 SSH 접속해서 **한 번만** 소유권을 넘겨줌: `sudo chown -R appuser:docker /volume1/docker/shopjoy/frontend /volume1/docker/shopjoy/backend` — 이후로는 배포 때마다 새로 만드는 파일이 전부 `appuser` 소유가 되므로 재발 안 함(완전교체 방식이라 지우는 주체=소유자가 항상 같아짐) |
| 5 | `/volume1/docker/shopjoy/` 아래를 통째로(수동으로) 지운 뒤 `deploy:dev-synol-be-api` 실행 시 SFTP는 성공하는데 `docker compose build`에서 `failed to solve: ... COPY gradlew.bat: not found` | 옛 `Dockerfile`이 **멀티스테이지**(컨테이너 안에서 `gradlew bootJar`로 다시 빌드)라 전체 소스(`gradlew`/`gradle/`/`*.gradle.kts`/전체 자바 소스)가 NAS build context에 있어야 했음. GitHub Actions 경로(CI 체크아웃 전체가 context)는 문제없었지만, 직접 SSH 배포 경로는 jar+설정파일 몇 개만 올라가므로 애초에 이 Dockerfile 로는 절대 안 됐음 — NAS 폴더를 수동 삭제하고 나서야(기존에 어쩌다 남아있던 전체 소스까지 같이 지워지면서) 처음 드러남 | `Dockerfile`을 **단일 스테이지**(JRE 이미지 + `COPY *.jar app.jar`)로 단순화(2026-09-05, 이미 반영됨) — 로컬/CI에서 이미 만든 jar만 담으므로 build context 에 전체 소스가 필요 없어짐. 두 배포 경로 모두 이제 "jar 파일 하나"만 있으면 됨 |
| 6 | 5번과 같은 상황에서 컨테이너는 뜨는데 재기동 시 `Error response from daemon: Bind mount failed: '/volume1/docker/ecadminapi/logs' does not exist` | `docker-compose.yml`의 로그 볼륨 마운트 소스 폴더가 삭제된 뒤 안 만들어짐 — Docker는 bind mount 소스 폴더를 자동으로 안 만들어줌 | `mkdir -p /volume1/docker/ecadminapi/logs` 한 번 실행 (2026-09-05부터 `deploy-dev-synol-be-api.js`가 매 배포마다 자동으로 이 폴더를 먼저 만들어두므로 재발 안 함) |

## 계정 설정 시 주의사항 (NAS 쪽 배포 계정)

> 계정을 처음부터 만드는 화면별 상세 절차는 [10_illeesam_synology_appuser계정생성.md](<10_illeesam_synology_appuser계정생성.md>) 참조 — 여기서는 요약 체크리스트만 다룹니다.

배포 스크립트(`deploy:dev-synol-*`)나 GitHub Actions가 쓰는 NAS 계정을 새로 만들거나 바꿀 때, **DSM에서 아래 4가지를 옛 계정과 동일하게 맞춰야** SFTP 업로드/`docker compose` 명령이 정상 동작합니다. 하나라도 빠지면 SFTP 단계에서 `No such file`(권한 문제를 이렇게 표시함) 같은 헷갈리는 에러가 납니다.

| # | 확인할 곳 | 무엇을 맞춰야 하나 |
|---|---|---|
| 1 | 제어판 → 사용자 및 그룹 → (계정) → 편집 → **사용자 홈** | **"SFTP 사용자 홈 폴더로 제한"** 옵션을 꺼야 합니다. 켜져 있으면 SFTP 접속 루트가 `/volume1` 전체가 아니라 그 계정의 홈 폴더로 좁혀져서, 배포 스크립트가 계산하는 경로(`/volume1`을 뗀 상대경로)가 완전히 다른 곳을 가리키게 됩니다. |
| 2 | 제어판 → 공유 폴더 → **`docker`** → 편집 → **권한** | 그 계정(또는 소속 그룹)에 **읽기/쓰기** 권한이 있어야 합니다. 없으면 SFTP가 `/volume1/docker/...` 안에 파일을 못 씁니다. |
| 3 | 제어판 → 사용자 및 그룹 → (계정) → 편집 → **그룹** | **`docker` 그룹**에 소속돼 있어야 합니다. SFTP 업로드까지는 통과해도, 다음 단계(`docker compose build`/`up`)에서 권한 오류로 막힙니다. |
| 4 | 제어판 → 파일 서비스 → **FTP/SFTP** | SFTP 서비스 자체가 켜져 있어야 합니다(이미 다른 계정으로 써왔다면 보통 이미 켜져 있음 — 계정별 접근 제한이 따로 걸려있지 않은지만 참고로 확인). |
| 5 | (DSM 화면 아님) 관리자 계정으로 SSH 접속 | **기존에 옛 계정으로 이미 배포해둔 파일이 있다면**, 그 파일들 소유권이 아직 옛 계정으로 남아있어 새 계정이 못 지웁니다 — `sudo chown -R 새계정:docker /volume1/docker/shopjoy/frontend /volume1/docker/shopjoy/backend`를 관리자 계정으로 **한 번만** 실행(위 표#4 사례 참조). 처음부터 새 계정으로만 배포해온 경우는 해당 없음. |

> 새 계정 설정 후 첫 배포 전에 SSH로 직접 접속해서 아래 명령이 정상적으로 목록을 보여주는지 먼저 확인해보면 빠릅니다:
> ```
> (계정)@illeesam:~$ ls -la /volume1/docker/shopjoy/backend/
> ```
> 목록이 보이면 정상, "No such file"/"Permission denied" 류가 나오면 위 표를 다시 확인하세요.

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

나중에 `prod`로 전환하려면, 위 값들을 실제 값으로 채워서 `/volume1/docker/shopjoy/backend/.env`에 추가하고 `SPRING_PROFILES_ACTIVE=prod`로 바꾼 뒤, [11_illeesam_synology_BE_수동배포가이드(synology).md](<11_illeesam_synology_BE_수동배포가이드(synology).md>) STEP 5(컨테이너 재기동)를 다시 실행하면 됩니다.

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
