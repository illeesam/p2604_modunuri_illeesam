# EcAdminApi(백엔드) → illeesam Synology NAS 배포 가이드 (초보자용)

작성일: 2026-09-02
대상: Docker/서버 배포 경험이 적은 개발자

이 문서는 "**명령어를 입력한다 → 이런 결과가 나온다 → 이렇게 테스트한다 → 이런 결과가 나오면 성공이다**"
형식으로, 실제로 따라 하면서 확인할 수 있게 정리했습니다.

> 🖥 = 내 컴퓨터(Windows)에서 입력하는 명령
> 📦 = SSH로 NAS에 접속한 뒤, NAS 안에서 입력하는 명령
>
> 검정 배경 박스 왼쪽의 `경로>` 부분은 "이 명령을 어느 폴더/어느 컴퓨터에서 입력하는지"를 보여주는 프롬프트(안내표시)입니다 — 그 뒤에 오는 글자만 실제로 입력하면 됩니다.

## 목차

1. [지금까지 완료된 작업 요약](#1-지금까지-완료된-작업-요약)
2. [수동 배포 매뉴얼](#2-수동-배포-매뉴얼)
3. [GitHub Actions 자동 배포 설정 및 매뉴얼](#3-github-actions-자동-배포-설정-및-매뉴얼)
4. [DB 접속 정보](#4-db-접속-정보)
5. [기타 참고사항 (트러블슈팅/용어)](#5-기타-참고사항-트러블슈팅용어)

---

## 1. 지금까지 완료된 작업 요약

| 작업 | 상태 |
|---|---|
| Synology NAS에 Docker Compose로 백엔드(EcAdminApi) 배포 | ✅ 완료 (dev 프로파일, 정상 동작 확인) |
| nginx로 정적 파일 서빙 + API 리버스 프록시 구조 구성 | ✅ 완료 |
| GitHub Actions 워크플로 6개 정리 (프론트/백엔드 × NAS/GitHub Pages × 빌드검증/배포) | ✅ 완료 |
| "배포"/"deploy" 커밋 메시지로만 실제 배포되게 하는 안전장치 | ✅ 완료 |
| NAS 특유의 버그 2건 발견·수정 (아래 5장 트러블슈팅 참조) | ✅ 완료 |
| 프론트(FO/BO 화면) `dist/` NAS 배포 | ✅ 완료 — 별도 문서 [illeesam_synology_FE_배포가이드.md](illeesam_synology_FE_배포가이드.md) 참조 |

**지금 떠 있는 서비스**:
- 백엔드 API(디버그 직결): http://illeesam.synology.me:21080
- 공개 진입점(nginx, 프론트+API 전부 이 주소로): http://illeesam.synology.me:21000

**바로 테스트해볼 수 있는 공개 API 예시** (로그인 없이 접근 가능, 공통코드 페이징 조회):

<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>http://illeesam.synology.me:21080/api/co/sy/code/page?pageNo=1&amp;pageSize=10</code></pre>
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>http://illeesam.synology.me:21000/api/co/sy/code/page?pageNo=1&amp;pageSize=10   <span style="color:#7f7;">← nginx 경유(정식 경로)</span></code></pre>

브라우저 주소창에 붙여넣으면 아래처럼 나오면 정상입니다(총 1,219건, 페이지당 10건이면 122페이지).
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>{"ok":true,"status":200,"data":{"pageList":[...],"pageTotalCount":1219,"pageTotalPage":122,...}}</code></pre>

---

## 2. 수동 배포 매뉴얼

내 컴퓨터에서 직접 빌드하고, 직접 NAS로 올려서 띄우는 방법입니다.
GitHub Actions 없이도 이 순서대로 하면 배포됩니다.

### 준비물

| 항목 | 값 |
|---|---|
| NAS 주소 | `illeesam.synology.me` |
| SSH 포트 | `10022` |
| 계정 | `illeesam` |
| 비밀번호 | `s******9*!` (일부만 표시, 실제 값은 별도 보관) |
| Docker 배포 위치(NAS 안) | `/volume1/docker/shopjoy/backend/` |
| 프론트 파일 위치(NAS 안) | `/volume1/docker/shopjoy/frontend/` |

> ⚠ SSH 접속에는 **OpenSSH 클라이언트**(Windows 10/11에 기본 내장, `ssh`/`scp` 명령)를 사용합니다.
> PowerShell이나 명령 프롬프트(cmd)에 그대로 입력하면 됩니다.

### STEP 1 — 🖥 로컬에서 jar 빌드

**명령어**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406\_apps_be\EcAdminApi&gt;</span> ./gradlew clean bootJar -x test</code></pre>

**결과값**: 몇 초~몇십 초 후 아래처럼 나오면 성공입니다.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>BUILD SUCCESSFUL in 24s</code></pre>

**결과물 위치**: `_apps_be\EcAdminApi\build\libs\EcAdminApi-0.0.1-SNAPSHOT.jar` (약 140MB 파일)

**테스트 방법**: 아래 명령으로 파일이 실제로 생겼는지 확인합니다.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406\_apps_be\EcAdminApi&gt;</span> dir build\libs\EcAdminApi-0.0.1-SNAPSHOT.jar</code></pre>

**테스트 결과**: 파일 크기와 수정시각이 방금 빌드한 시각으로 나오면 성공입니다. 파일이 없다고 나오면 위 gradlew 명령이 실패한 것이니 화면에 뜬 에러 메시지를 확인합니다.

---

### STEP 2 — 🖥 NAS로 접속해서 배포 폴더가 있는지 확인

**명령어**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~&gt;</span> ssh -p 10022 illeesam@illeesam.synology.me</code></pre>

처음 접속이면 "계속 접속하시겠습니까?" 같은 문구가 나오는데 `yes` 입력 → 비밀번호 입력(화면에 글자가 안 보이는 게 정상, 그대로 입력 후 Enter).

**결과값**: NAS 안으로 들어가지면(프롬프트가 `illeesam@illeesam:~$` 같은 모양으로 바뀌면) 성공입니다.

**테스트 방법**: 접속된 상태(📦)에서 아래 입력.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:~$</span> ls -la /volume1/docker/shopjoy/backend/</code></pre>

**테스트 결과**: `docker-compose.yml`, `.env`, `nginx.conf`, `EcAdminApi-0.0.1-SNAPSHOT.jar` 같은 파일들이 보이면 정상입니다(이미 1차 배포가 돼 있는 상태). 폴더 자체가 없다고 나오면 아래 명령으로 먼저 만듭니다.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:~$</span> mkdir -p /volume1/docker/shopjoy/backend/logs /volume1/docker/shopjoy/frontend</code></pre>
확인이 끝나면 `exit` 입력해서 NAS 접속을 종료하고 내 컴퓨터로 돌아옵니다.

---

### STEP 3 — 🖥 새로 빌드한 jar 파일을 NAS로 전송

**명령어**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406\_apps_be\EcAdminApi&gt;</span> scp -P 10022 build\libs\EcAdminApi-0.0.1-SNAPSHOT.jar illeesam@illeesam.synology.me:/volume1/docker/shopjoy/backend/</code></pre>
비밀번호 입력 요구하면 입력.

**결과값**: 전송 진행률(%)이 쭉 올라가다가 100%가 되면서 명령이 끝납니다. 파일이 140MB 정도라 몇십 초~몇 분 걸릴 수 있습니다.

**테스트 방법**: STEP 2처럼 다시 SSH 접속해서
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:~$</span> ls -lh /volume1/docker/shopjoy/backend/EcAdminApi-0.0.1-SNAPSHOT.jar</code></pre>

**테스트 결과**: 파일 크기가 130~150M 정도로 나오고, 수정 시각이 방금이면 성공입니다.

> ⚠ **주의**: `scp`/`ssh`는 실제 경로(`/volume1/...`)를 그대로 쓰면 됩니다. 다만 **FileZilla 같은 SFTP 프로그램**을 쓴다면 얘기가 다릅니다 — Synology의 SFTP는 `/volume1`을 접속 루트(`/`)로 취급해서, SFTP 프로그램 안에서는 `/volume1/docker/...`가 아니라 `/docker/...`로 들어가야 합니다. (자세한 이유는 5장 트러블슈팅 참조)

---

### STEP 4 — 📦 NAS에서 Docker 이미지 다시 빌드

**명령어** (STEP 2처럼 SSH로 NAS에 접속한 상태에서):
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:~$</span> cd /volume1/docker/shopjoy/backend
<span style="color:#7f7;">illeesam@illeesam:backend$</span> /usr/local/bin/docker compose build</code></pre>

> 왜 `docker`가 아니라 `/usr/local/bin/docker`인가?: NAS의 SSH 기본 환경에서는 `docker` 명령의 전체 경로가 자동으로 안 잡혀 있어서, 전체 경로를 직접 써줘야 확실합니다.

**결과값**: 화면에 이미지 빌드 과정(레이어 다운로드/복사)이 쭉 나오다가 마지막에 별다른 에러 없이 명령 프롬프트로 돌아오면 성공입니다. jar 파일만 이미지 안에 복사하는 방식이라 몇 초~1분이면 끝납니다.

**테스트 방법**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:backend$</span> /usr/local/bin/docker images | grep ecadminapi</code></pre>

**테스트 결과**: `shopjoy/ecadminapi   latest   ...` 줄이 방금 시각으로 나오면 성공입니다.

---

### STEP 5 — 📦 새 이미지로 컨테이너 재기동

**명령어**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:backend$</span> /usr/local/bin/docker compose up -d --force-recreate ecadminapi</code></pre>

**결과값**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>Container 210-ecadminApi  Recreate
Container 210-ecadminApi  Recreated
Container 210-ecadminApi  Started</code></pre>
이렇게 나오면 성공입니다.

**테스트 방법 1** — 컨테이너 상태 확인 (기동 후 1분 정도 기다렸다가):
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:backend$</span> /usr/local/bin/docker compose ps</code></pre>

**테스트 결과 1**: `STATUS` 컬럼에 `Up X minutes (healthy)`라고 나오면 성공입니다.
`(health: starting)`이면 아직 기동 중이니 30초~1분 더 기다렸다가 다시 확인합니다.
만약 계속 재시작을 반복하면(`Restarting`) 아래 로그 확인 명령으로 원인을 봅니다.

<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:backend$</span> /usr/local/bin/docker compose logs --tail 50 ecadminapi</code></pre>

**테스트 방법 2** — 실제 API 응답 확인 (NAS 안에서):
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:backend$</span> curl http://localhost:21080/actuator/health</code></pre>

**테스트 결과 2**: 아래처럼 나오면 완전히 성공입니다.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>{"status":"UP"}</code></pre>

**테스트 방법 3** — 🖥 내 컴퓨터(브라우저)에서 외부 접속 확인:

브라우저 주소창에 아래 URL을 입력합니다.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>http://illeesam.synology.me:21080/actuator/health</code></pre>

**테스트 결과 3**: 화면에 `{"status":"UP"}`이 그대로 보이면 배포 성공, 외부에서도 정상 접속되는 것까지 확인된 것입니다.

---

### STEP 6 — 📦 (선택) 배포 후 정리

<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:backend$</span> exit</code></pre>
로 NAS SSH 접속을 종료합니다. 컨테이너는 `restart: unless-stopped` 옵션이 있어서, NAS를 재부팅해도 자동으로 다시 켜집니다.

---

## 3. GitHub Actions 자동 배포 설정 및 매뉴얼

`git push`만 하면, 위의 STEP 1~5 과정을 GitHub의 서버가 대신 실행해줍니다.
단, **커밋 메시지에 `deploy` 또는 `배포`라는 단어가 들어 있을 때만** 실제로 배포가 진행됩니다
(평범한 커밋은 검증만 하고 배포는 건너뜁니다 — 실수로 매번 배포되는 걸 막기 위한 안전장치).

### 3-1. 워크플로 파일 구성 (`.github/workflows/`)

| 파일명 | 역할 | 언제 배포되나 |
|---|---|---|
| `shopjoy-be-illeesam-synol-build.yml` | 백엔드 컴파일이 되는지만 확인(배포 안 함) | 백엔드 소스가 바뀔 때마다 항상 |
| `shopjoy-be-illeesam-synol-deploy.yml` | 백엔드를 Synology NAS에 실제 배포 | 커밋 메시지에 `deploy`/`배포` 포함 시 |
| `shopjoy-fe-illeesam-synol-build.yml` | 프론트 빌드가 되는지만 확인(배포 안 함) | 프론트 소스가 바뀔 때마다 항상 |
| `shopjoy-fe-illeesam-synol-deploy.yml` | 프론트를 Synology NAS에 실제 배포 | 커밋 메시지에 `deploy`/`배포` 포함 시 |
| `shopjoy-fe-illeesam-github-build.yml` | 프론트 빌드가 되는지만 확인(배포 안 함) | 프론트 소스가 바뀔 때마다 항상 |
| `shopjoy-fe-illeesam-github-deploy.yml` | 프론트를 GitHub Pages에 실제 배포 | 커밋 메시지에 `deploy`/`배포` 포함 시 |

> "be" = 백엔드(EcAdminApi), "fe" = 프론트(FO/BO 화면), "synol" = Synology NAS로 배포, "github" = GitHub Pages로 배포

### 3-2. 최초 1회 환경설정 (이미 돼 있으면 건너뛰어도 됨)

**설정 위치**: GitHub 리포지토리 페이지 → 상단 `Settings` 탭 → 왼쪽 메뉴 `Secrets and variables` → `Actions`

**① NAS 접속 시크릿 등록** (`New repository secret` 버튼으로 5개 등록):

| 이름(Name) | 값(Value) |
|---|---|
| `SYNOLOGY_HOST` | `illeesam.synology.me` |
| `SYNOLOGY_PORT` | `10022` |
| `SYNOLOGY_USER` | `illeesam` |
| `SYNOLOGY_PASSWORD` | (실제 비밀번호, 일부만 `s******9*!`) |
| `SYNOLOGY_SSH_KEY` | (SSH 키를 안 쓰면 비워둬도 됨 — 비밀번호 인증으로도 동작) |

**테스트 방법**: 시크릿 등록 후 `Settings → Secrets and variables → Actions` 목록에 5개 이름이 보이는지 확인 (값은 등록 후 다시 볼 수 없는 게 정상입니다 — GitHub 보안 정책).

**② GitHub Pages 활성화** (프론트를 GitHub Pages에도 배포하고 싶을 때만 필요):

`Settings` → 왼쪽 메뉴 `Pages` → `Build and deployment` → `Source`를 **`GitHub Actions`**로 변경.

**테스트 방법**: 저장 후 다시 `Settings → Pages`에 들어갔을 때 Source가 `GitHub Actions`로 표시되면 성공.

**③ NAS 쪽 `.env` 파일 준비** (이미 완료돼 있음, 참고용):

`/volume1/docker/shopjoy/backend/.env` 파일이 NAS에 미리 있어야 합니다(GitHub Actions는 이 파일을 만들지 않습니다 — 비밀번호 같은 민감정보를 깃허브에 올리지 않기 위해 일부러 그렇게 만들었습니다). 지금은 `dev` 프로파일로 이미 준비돼 있습니다.

### 3-3. 실제 배포하는 방법

**명령어** (🖥 내 컴퓨터, 프로젝트 폴더에서):
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> git add .
<span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> git commit -m "상품관리 화면 수정 deploy"
<span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> git push</code></pre>

> 포인트: 커밋 메시지 어디에든 `deploy` 또는 `배포`라는 글자만 들어 있으면 됩니다.
> 예) `"버그 수정 배포"`, `"deploy: 주문화면 개선"`, `"긴급 deploy"` 전부 인식됩니다.

**결과값**: `git push` 명령 자체는 평소와 똑같이 끝납니다(별다른 메시지 없음). 실제 배포 진행 상황은 GitHub 웹사이트에서 확인합니다.

**테스트 방법**:
1. 브라우저에서 GitHub 리포지토리 페이지 접속
2. 상단 `Actions` 탭 클릭
3. 방금 push한 커밋 이름으로 된 작업이 목록 맨 위에 뜨는지 확인
4. 그 작업을 클릭하면 실시간으로 진행 상황(초록 체크 ✅ / 빨간 X ❌ / 노란 원 🟡 진행중)이 보임

**테스트 결과**:
- 모든 단계가 초록 체크 ✅ 로 끝나면 배포 성공
- 성공 후 STEP 5의 테스트 방법 3(브라우저에서 `http://illeesam.synology.me:21080/actuator/health` 접속)으로 실제 반영됐는지 최종 확인
- 빨간 X ❌ 가 뜨면 그 단계를 클릭해서 나오는 로그(에러 메시지)를 확인 — 대부분 시크릿 미등록이거나 NAS 접속 문제

### 3-4. 배포 안 되게(스킵) 하고 싶을 때

커밋 메시지에 `deploy`/`배포` 단어를 그냥 안 쓰면 됩니다. 예를 들어:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> git commit -m "오타 수정"
<span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> git push</code></pre>
이러면 Actions 탭에 작업은 뜨지만, 빌드 검증만 하고 실제 NAS/Pages 배포 단계는 회색(⊘ Skipped)으로 표시됩니다.

### 3-5. 수동으로 즉시 실행하고 싶을 때 (커밋 없이)

1. GitHub 리포지토리 → `Actions` 탭
2. 왼쪽에서 원하는 워크플로 이름 클릭 (예: `shopjoy-be-illeesam-synol-deploy`)
3. 오른쪽 `Run workflow` 버튼 클릭 → `Run workflow` 다시 클릭

**테스트 결과**: 목록에 새 작업이 뜨고 진행되면 성공 (이 방식은 커밋 메시지 단어 체크 없이 무조건 배포됩니다).

---

## 4. DB 접속 정보

애플리케이션이 접속하는 PostgreSQL 정보입니다 (Synology NAS 안에 Docker 컨테이너로 떠 있음).

| 항목 | 값 |
|---|---|
| 종류 | PostgreSQL 17 (Docker 컨테이너) |
| 외부 접속 주소 | `illeesam.synology.me` |
| 외부 접속 포트 | `17632` |
| 컨테이너 내부에서 접속 시 주소 | `host.docker.internal` (5장 트러블슈팅 참조 — 중요) |
| DB 이름 | `postgres` |
| 스키마 | `shopjoy_2604` |
| 계정 | `postgres` |
| 비밀번호 | `************esam` (뒷 4자리만 표시) |

**연결 문자열(JDBC, 참고용)**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>jdbc:p6spy:postgresql://illeesam.synology.me:17632/postgres?currentSchema=shopjoy_2604</code></pre>
(운영 코드가 p6spy라는 SQL 로깅 도구를 경유해서 접속하도록 되어 있어 `postgresql://` 앞에 `p6spy:`가 붙습니다.)

**컨테이너 안에서 이 DB에 접속하는 서비스(EcAdminApi)의 `.env` 설정** (`/volume1/docker/shopjoy/backend/.env`):
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=3000
DB_HOST=host.docker.internal
DB_PORT=17632</code></pre>
(DB 이름/스키마/계정/비밀번호는 `dev` 프로파일의 기본값을 그대로 쓰므로 `.env`에 안 적어도 됩니다. 다른 값을 쓰고 싶으면 `DB_NAME`/`DB_SCHEMA`/`DB_USERNAME`/`DB_PASSWORD`를 추가로 적으면 됩니다.)

---

## 5. 기타 참고사항 (트러블슈팅/용어)

### 5-1. 겪었던 문제 ① — SFTP 프로그램에서 파일이 안 보임/전송 실패

**증상**: FileZilla 같은 SFTP 프로그램으로 `/volume1/docker/...` 경로에 접속하면 "그런 폴더 없음" 에러.

**원인**: Synology의 SFTP 서비스는 접속하자마자 `/volume1`을 최상위 루트(`/`)로 취급합니다. 즉 SFTP 프로그램 안에서 보는 `/`가 실제로는 `/volume1`입니다.

**해결**: SFTP 프로그램에서는 `/volume1/docker/shopjoy/backend`가 아니라 `/docker/shopjoy/backend`로 접속합니다.
(반면 `ssh`/`scp` 명령이나 SSH 터미널 안에서는 이 문제 없이 실제 경로 `/volume1/docker/...`를 그대로 쓰면 됩니다 — SFTP만의 특이 동작입니다.)

### 5-2. 겪었던 문제 ② — 백엔드 컨테이너가 DB 접속 타임아웃으로 안 뜸

**증상**: 로그에 아래처럼 나오면서 기동 실패.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>org.postgresql.util.PSQLException: The connection attempt failed.
Caused by: java.net.SocketTimeoutException: Connect timed out</code></pre>

**원인**: DB(Postgres)가 앱과 **같은 NAS** 안에 떠 있는데, 앱 컨테이너가 DB 주소를 `illeesam.synology.me`(NAS 자기 자신의 인터넷 주소)로 접속하려 하면, "내 컨테이너 → 인터넷 → 공유기 → 다시 내 NAS"로 한 바퀴 돌아 들어오는 경로(전문 용어로 **NAT 헤어핀**)를 타게 됩니다. 이 경로가 공유기/방화벽 설정에 따라 막히거나 느려서 타임아웃이 납니다.

**해결**: `docker-compose.yml`에 아래 설정을 추가해서, "호스트(NAS 자기 자신)"를 가리키는 별명(`host.docker.internal`)을 컨테이너 안에 만들어주고, `.env`의 `DB_HOST`를 그 별명으로 지정합니다.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>extra_hosts:
  - "host.docker.internal:host-gateway"</code></pre>
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>DB_HOST=host.docker.internal</code></pre>
이렇게 하면 컨테이너가 인터넷을 거치지 않고 곧바로 NAS 자신에게 접속합니다.

> 이미 `docker-compose.yml`과 `.env`에 반영되어 있어서, 이 문서대로 배포하면 이 문제를 다시 겪지 않습니다. 혹시 `docker-compose.yml`을 새로 만들거나 다른 서버로 옮길 때는 이 설정을 잊지 않도록 주의합니다.

### 5-3. 자주 쓰는 확인/운영 명령어 모음 (📦 NAS SSH 접속 후)

| 하고 싶은 것 | 명령어 |
|---|---|
| 컨테이너 상태 한눈에 보기 | `/usr/local/bin/docker compose ps` |
| 실시간 로그 보기(Ctrl+C로 중단) | `/usr/local/bin/docker compose logs -f ecadminapi` |
| 최근 로그 50줄만 보기 | `/usr/local/bin/docker compose logs --tail 50 ecadminapi` |
| 컨테이너만 재시작(코드 변경 없이) | `/usr/local/bin/docker compose restart ecadminapi` |
| 스택 전체 정지 | `/usr/local/bin/docker compose down` |
| 스택 다시 켜기 | `/usr/local/bin/docker compose up -d` |

(모든 명령은 먼저 `cd /volume1/docker/shopjoy/backend`로 이동한 뒤 실행합니다.)

### 5-4. `dev` 프로파일과 `prod` 프로파일의 차이 (왜 지금 dev로 배포했는지)

지금은 **`dev` 프로파일**로 배포돼 있습니다. `prod`(운영) 프로파일은 아래 값들이 **필수**라서 하나라도 없으면 서버가 아예 기동되지 않습니다.

| 필수 값 | 설명 |
|---|---|
| `JWT_SECRET` | 로그인 토큰 암호화 키 |
| `LICENSE_SECRET` | 라이선스 검증 키 |
| `FRONTEND_DIR` | 프론트 파일 실제 경로 |
| `FRONTEND_BASE_URL` | 프론트 공개 주소 |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | 파일 업로드(S3) 키 |
| `NCP_ACCESS_KEY` / `NCP_SECRET_KEY` | 파일 업로드(네이버클라우드) 키 |

나중에 `prod`로 전환하려면, 위 값들을 실제 값으로 채워서 `/volume1/docker/shopjoy/backend/.env`에 추가하고 `SPRING_PROFILES_ACTIVE=prod`로 바꾼 뒤, STEP 5(컨테이너 재기동)를 다시 실행하면 됩니다.

### 5-5. 용어 설명

| 용어 | 뜻 |
|---|---|
| jar 파일 | 자바로 만든 프로그램을 실행 가능한 형태로 묶은 파일. `java -jar 파일명`으로 실행 |
| Docker 이미지 | 프로그램 + 실행 환경을 통째로 담은 "설치 패키지" 같은 것 |
| Docker 컨테이너 | 그 이미지를 실제로 실행시킨 상태(=지금 돌아가고 있는 프로그램) |
| docker compose | 여러 개의 컨테이너(백엔드+nginx 등)를 한 번에 관리하는 도구, 설정은 `docker-compose.yml`에 적음 |
| 헬스체크(health check) | "이 서버가 정상적으로 잘 살아있나?"를 자동으로 확인하는 기능. `{"status":"UP"}`이 정상 응답 |
| nginx | 웹서버 프로그램. 여기서는 (1) 정적 파일(HTML/JS/CSS) 서빙 (2) API 요청을 백엔드로 전달(리버스 프록시) 역할 |
| .env 파일 | 비밀번호처럼 민감하거나 환경마다 바뀌는 값을 따로 모아두는 파일. 깃허브에는 올리지 않음 |
