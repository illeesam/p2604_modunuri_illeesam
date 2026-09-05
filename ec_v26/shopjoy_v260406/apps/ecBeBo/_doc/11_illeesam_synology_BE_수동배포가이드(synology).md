# EcAdminApi(백엔드) → illeesam Synology NAS 배포 가이드 (초보자용)

작성일: 2026-09-02
대상: Docker/서버 배포 경험이 적은 개발자

이 문서는 "**명령어를 입력한다 → 이런 결과가 나온다 → 이렇게 테스트한다 → 이런 결과가 나오면 성공이다**"
형식으로, 실제로 따라 하면서 확인할 수 있게 정리했습니다.

> 🖥 = 내 컴퓨터(Windows)에서 입력하는 명령
> 📦 = SSH로 NAS에 접속한 뒤, NAS 안에서 입력하는 명령
>
> 코드 박스 첫 줄의 `경로>` 부분은 "이 명령을 어느 폴더/어느 컴퓨터에서 입력하는지"를 보여주는 프롬프트(안내표시)입니다 — 그 뒤에 오는 글자만 실제로 입력하면 됩니다.

### Windows ↔ Linux(NAS) 명령어가 다른 경우

**SSH로 NAS에 접속하는 순간부터는 그 창 안이 리눅스입니다** — 같은 "터미널 창"이라도 🖥(Windows) 상태일 때와 📦(SSH 접속 후, NAS 안) 상태일 때 쓰는 명령어 문법이 다릅니다. 이 문서에서 실제로 나오는 것들만 비교하면:

| 하고 싶은 것   | 🖥 Windows (cmd/PowerShell)         | 📦 Linux (NAS 안, SSH 접속 후) |
| -------------- | ----------------------------------- | ------------------------------ |
| 파일 목록 보기 | `dir`                             | `ls -la` / `ls -lh`        |
| 폴더 만들기    | `mkdir 폴더명`                    | `mkdir -p 폴더명`            |
| 폴더 이동      | `cd 경로`                         | `cd 경로` (똑같음)           |
| 원격 접속(SSH) | `ssh -p 포트 계정@주소`           | *(NAS 쪽에서는 안 씀)*       |
| 파일 전송(SCP) | `scp -P 포트 파일 계정@주소:경로` | *(NAS 쪽에서는 안 씀)*       |
| SSH 접속 종료  | *(해당 없음)*                     | `exit`                       |

> `ssh`/`scp`는 Windows 10/11에 기본 내장된 OpenSSH 클라이언트라 Windows에서도 **리눅스와 똑같은 문법**으로 씁니다 — 위 표에서 "Windows에서 입력"으로 분류된 이유는 그 명령을 입력하는 위치(🖥 창)가 Windows라는 뜻이지, 명령어 문법 자체가 Windows 전용이라는 뜻은 아닙니다.

## 목차

1. [지금까지 완료된 작업 요약](#1-지금까지-완료된-작업-요약)
2. [수동 배포 매뉴얼](#2-수동-배포-매뉴얼)
3. [GitHub Actions 자동 배포](#3-github-actions-자동-배포) — 빠른 실행은 [14번 문서](<14_illeesam_synology_BE_자동배포가이드(npm script).md>)
4. [DB 접속 정보](#4-db-접속-정보)
5. [기타 참고사항 (트러블슈팅/용어)](#5-기타-참고사항-트러블슈팅용어) — 상세는 [9011번 문서](9011_illeesam_synology_BE_트러블슈팅용어.md)
6. 배포 후 로그 확인 방법은 별도 문서 → [11-1_illeesam_synology_BE_로그보기.md](11-1_illeesam_synology_BE_로그보기.md)
7. 배포용 계정(`appuser`)을 NAS에 처음부터 만드는 방법은 별도 문서 → [10_illeesam_synology_appuser계정생성.md](10_illeesam_synology_appuser계정생성.md)

---

## 1. 지금까지 완료된 작업 요약

| 작업                                                                                  | 상태                                                                                                           |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Synology NAS에 Docker Compose로 백엔드(EcAdminApi) 배포                               | ✅ 완료 (dev 프로파일, 정상 동작 확인)                                                                         |
| nginx로 정적 파일 서빙 + API 리버스 프록시 구조 구성                                  | ✅ 완료                                                                                                        |
| GitHub Actions 워크플로 6개 정리 (프론트/백엔드 × NAS/GitHub Pages × 빌드검증/배포) | ✅ 완료                                                                                                        |
| "배포"/"deploy" 커밋 메시지로만 실제 배포되게 하는 안전장치                           | ✅ 완료                                                                                                        |
| NAS 특유의 버그 2건 발견·수정 (아래 5장 트러블슈팅 참조)                             | ✅ 완료                                                                                                        |
| 프론트(FO/BO 화면)`dist/` NAS 배포                                                  | ✅ 완료 — 별도 문서[12_illeesam_synology_FE_수동배포가이드(synology).md](<12_illeesam_synology_FE_수동배포가이드(synology).md>) 참조 |

**지금 떠 있는 서비스**:

- 백엔드 API(디버그 직결): http://illeesam.synology.me:21080
- 공개 진입점(nginx, 프론트+API 전부 이 주소로): http://illeesam.synology.me:21000

**바로 테스트해볼 수 있는 공개 API 예시** (로그인 없이 접근 가능, 공통코드 페이징 조회):

```
http://illeesam.synology.me:21080/api/co/sy/code/page?pageNo=1&pageSize=10
```

```
http://illeesam.synology.me:21000/api/co/sy/code/page?pageNo=1&pageSize=10   ← nginx 경유(정식 경로)
```

브라우저 주소창에 붙여넣으면 아래처럼 나오면 정상입니다(총 1,219건, 페이지당 10건이면 122페이지).

```
{"ok":true,"status":200,"data":{"pageList":[...],"pageTotalCount":1219,"pageTotalPage":122,...}}
```

---

## 2. 수동 배포 매뉴얼

내 컴퓨터에서 직접 빌드하고, 직접 NAS로 올려서 띄우는 방법입니다.
GitHub Actions 없이도 이 순서대로 하면 배포됩니다.

### 준비물

| 항목                     | 값                                                |
| ------------------------ | ------------------------------------------------- |
| NAS 주소                 | `illeesam.synology.me`                          |
| SSH 포트                 | `10022`                                         |
| 계정                     | `appuser`                                      |
| 비밀번호                 | `appuser1**` (일부만 표시, 실제 값은 별도 보관) |
| Docker 배포 위치(NAS 안) | `/volume1/docker/shopjoy/ecBeBo/`              |
| 프론트 파일 위치(NAS 안) | `/volume1/docker/shopjoy/frontend/`             |

> ⚠ **이 계정을 새로 만들거나 바꿨다면**(예: `illeesam` → `appuser`) NAS 쪽 DSM에서 4가지를 옛 계정과 동일하게 맞춰야 SFTP/`docker compose`가 정상 동작합니다 — 계정을 처음부터 만드는 전체 과정은 [10번 문서](10_illeesam_synology_appuser계정생성.md), 이미 있는 계정의 권한만 점검할 때는 [9011번 문서의 "계정 설정 시 주의사항"](9011_illeesam_synology_BE_트러블슈팅용어.md#계정-설정-시-주의사항-nas-쪽-배포-계정) 참조. 빠뜨리면 STEP 3(jar 전송)에서 `No such file` 같은 헷갈리는 에러가 납니다.

> ⚠ SSH 접속에는 **OpenSSH 클라이언트**(Windows 10/11에 기본 내장, `ssh`/`scp` 명령)를 사용합니다.
> PowerShell이나 명령 프롬프트(cmd)에 그대로 입력하면 됩니다.
>
> ⚠ **터미널(명령 프롬프트) 창을 2개** 띄워서 진행합니다 — **① 내 컴퓨터용 창**(🖥 표시 단계, 그냥 평소 쓰던 창)과 **② NAS 접속용 창**(📦 표시 단계, STEP 2에서 SSH로 접속한 뒤 STEP 6까지 계속 그 상태로 둡니다). 아래 각 STEP 맨 앞의 🖥/📦를 보고 "지금 어느 창에 입력해야 하는지" 확인하세요.

### STEP 1 — 🖥 로컬에서 jar 빌드

**명령어**:

```
~\ec_v26\shopjoy_v260406\apps\ecBeBo> ./gradlew clean bootJar -x test
```

**명령어 설명** (`gradlew`는 자바 프로젝트를 빌드(=소스코드를 실행 가능한 형태로 조립)하는 도구입니다):

| 부분        | 뜻                                                                  |
| ----------- | ------------------------------------------------------------------- |
| `clean`   | 예전에 빌드했던 찌꺼기 파일을 먼저 싹 지움                          |
| `bootJar` | 실제로 실행 가능한 jar 파일을 만듦                                  |
| `-x test` | 테스트 코드 실행은 건너뜀(빌드 속도를 위해 — 테스트는 별도로 확인) |

**결과값**: 몇 초~몇십 초 후 아래처럼 나오면 성공입니다.

```
BUILD SUCCESSFUL in 24s
```

**결과물 위치**: `apps\ecBeBo\build\libs\EcAdminApi-0.0.1-SNAPSHOT.jar` (약 140MB 파일)

**테스트 방법**: 아래 명령으로 파일이 실제로 생겼는지 확인합니다.

```
~\ec_v26\shopjoy_v260406\apps\ecBeBo> dir build\libs\EcAdminApi-0.0.1-SNAPSHOT.jar
```

**명령어 설명**:

| 부분    | 뜻                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------- |
| `dir` | 윈도우에서 폴더 안의 파일 목록을 보여주는 명령(파일탐색기로 그 폴더를 열어보는 것과 같은 효과) |

**테스트 결과**: 파일 크기와 수정시각이 방금 빌드한 시각으로 나오면 성공입니다. 파일이 없다고 나오면 위 gradlew 명령이 실패한 것이니 화면에 뜬 에러 메시지를 확인합니다.

---

### STEP 2 — 📦 NAS로 접속해서 배포 폴더가 있는지 확인

여기서부터 **두 번째 터미널 창(NAS 접속용)**을 새로 하나 열어서 시작합니다. 이 창은 **STEP 6까지 닫지 말고 그대로 켜두세요** — 뒤에 나오는 📦 표시 명령을 전부 이 창에 이어서 입력합니다.

**명령어**:

```
~> ssh -p 10022 appuser@illeesam.synology.me
```

**명령어 설명** (`ssh`는 다른 컴퓨터(여기선 NAS)에 원격으로 접속하는 명령입니다):

| 부분                              | 뜻                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `ssh`                           | 원격 접속 명령                                                                      |
| `-p 10022`                      | 접속할 포트 번호 지정(NAS의 SSH 서비스가 10022번 포트로 열려있음)                   |
| `appuser@illeesam.synology.me` | `계정이름@접속주소` 형식 — `appuser` 계정으로 `illeesam.synology.me`에 접속 |

**실제로 입력하는 과정 예시** (계정/비밀번호를 입력하는 부분까지 그대로 보여드립니다):

```
~> ssh -p 10022 appuser@illeesam.synology.me
The authenticity of host '[illeesam.synology.me]:10022' can't be established.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
appuser@illeesam.synology.me's password:
```

- `Are you sure you want to continue connecting...` → **처음 접속할 때만** 나옵니다. `yes` 입력 후 Enter.
- `...'s password:` → 비밀번호를 입력하는 칸입니다. **입력해도 화면에 별표(`*`)나 글자가 하나도 안 보이는 게 정상**입니다(보안 때문에 원래 안 보임) — 그냥 그대로 비밀번호 입력하고 Enter를 누르면 됩니다.

**결과값**: 접속에 성공하면 프롬프트가 아래처럼 `appuser@illeesam:~$` 모양으로 바뀝니다. 이렇게 바뀌면 성공입니다.

```
appuser@illeesam:~$
```

**테스트 방법**: 그대로 이어서 입력.

```
appuser@illeesam:~$ ls -la /volume1/docker/shopjoy/ecBeBo/
```

**명령어 설명**:

| 부분   | 뜻                                                       |
| ------ | -------------------------------------------------------- |
| `ls` | 폴더 안의 파일 목록 보기(윈도우`dir`과 같은 역할)      |
| `-l` | 파일 크기·수정시각 등 상세 정보까지 표시                |
| `-a` | 이름이`.`으로 시작하는 숨김 파일(`.env` 등)까지 표시 |

**테스트 결과**: `docker-compose.yml`, `.env`, `nginx.conf`, `EcAdminApi-0.0.1-SNAPSHOT.jar` 같은 파일들이 보이면 정상입니다(이미 1차 배포가 돼 있는 상태). 폴더 자체가 없다고 나오면 아래 명령으로 먼저 만듭니다.

```
appuser@illeesam:~$ mkdir -p /volume1/docker/shopjoy/ecBeBo/logs /volume1/docker/shopjoy/frontend
```

**명령어 설명**:

| 부분      | 뜻                                                                                  |
| --------- | ----------------------------------------------------------------------------------- |
| `mkdir` | 새 폴더 만들기                                                                      |
| `-p`    | 중간 경로 폴더가 없어도 한 번에 다 만들고, 이미 폴더가 있어도 에러 없이 그냥 넘어감 |

> 이 창은 **닫지 말고 그대로 켜둔 채** STEP 3(🖥 첫 번째 창)으로 넘어가세요. STEP 4부터 다시 이 창(📦)을 씁니다.

---

### STEP 3 — 🖥 새로 빌드한 jar 파일을 NAS로 전송

**명령어**:

```
~\ec_v26\shopjoy_v260406\apps\ecBeBo> scp -P 10022 build\libs\EcAdminApi-0.0.1-SNAPSHOT.jar appuser@illeesam.synology.me:/volume1/docker/shopjoy/ecBeBo/
```

**명령어 설명** (`scp`는 파일을 원격 컴퓨터로 복사/전송하는 명령입니다 — "이 파일을, 이 계정으로, 저 주소의, 저 경로에 갖다놔라" 형식):

| 부분                                                               | 뜻                                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `scp`                                                            | 파일 전송 명령                                                                          |
| `-P 10022`                                                       | 접속 포트 지정 (⚠`ssh`의 `-p`(소문자)와 달리 `scp`는 **대문자 `-P`**를 씁니다) |
| `build\libs\EcAdminApi-0.0.1-SNAPSHOT.jar`                       | 보낼 파일(내 컴퓨터 쪽 경로)                                                            |
| `appuser@illeesam.synology.me:/volume1/docker/shopjoy/ecBeBo/` | 받는 쪽 —`계정@주소:저장할폴더경로`                                                  |

비밀번호 입력 요구하면 입력.

**결과값**: 전송 진행률(%)이 쭉 올라가다가 100%가 되면서 명령이 끝납니다. 파일이 140MB 정도라 몇십 초~몇 분 걸릴 수 있습니다.

**테스트 방법**: STEP 2에서 열어둔 **두 번째 창(📦, NAS 접속용)**으로 돌아가서 입력.

```
appuser@illeesam:~$ ls -lh /volume1/docker/shopjoy/ecBeBo/EcAdminApi-0.0.1-SNAPSHOT.jar
```

**명령어 설명**: `-h`는 파일 크기를 바이트 숫자 그대로가 아니라 `140M`처럼 사람이 읽기 편한 단위(K/M/G)로 보여줍니다.

**테스트 결과**: 파일 크기가 130~150M 정도로 나오고, 수정 시각이 방금이면 성공입니다.

> ⚠ **주의**: `scp`/`ssh`는 실제 경로(`/volume1/...`)를 그대로 쓰면 됩니다. 다만 **FileZilla 같은 SFTP 프로그램**을 쓴다면 얘기가 다릅니다 — Synology의 SFTP는 `/volume1`을 접속 루트(`/`)로 취급해서, SFTP 프로그램 안에서는 `/volume1/docker/...`가 아니라 `/docker/...`로 들어가야 합니다. (자세한 이유는 5장 트러블슈팅 참조)

---

### STEP 4 — 📦 NAS에서 Docker 이미지 다시 빌드

**명령어** (STEP 2에서 열어둔 **두 번째 창(📦)**에 이어서 입력 — 계속 그 창을 씁니다):

```
appuser@illeesam:~$ cd /volume1/docker/shopjoy/ecBeBo
appuser@illeesam:backend$ /usr/local/bin/docker compose build
```

**명령어 설명**:

| 부분                                   | 뜻                                                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `cd /volume1/docker/shopjoy/ecBeBo` | 그 폴더로 이동(`cd`=Change Directory) — 이 뒤 `docker compose` 명령들은 전부 이 폴더 기준으로 동작해서 매번 여기로 먼저 이동해야 함 |
| `/usr/local/bin/docker`              | Docker 명령.`docker`가 아니라 전체 경로를 쓰는 이유는 아래 참고                                                                        |
| `compose build`                      | 이 폴더의`docker-compose.yml` 설정대로 Docker 이미지를 (다시) 만듦                                                                     |

> 왜 `docker`가 아니라 `/usr/local/bin/docker`인가?: NAS의 SSH 기본 환경에서는 `docker` 명령의 전체 경로가 자동으로 안 잡혀 있어서, 전체 경로를 직접 써줘야 확실합니다.

**결과값**: 화면에 이미지 빌드 과정(레이어 다운로드/복사)이 쭉 나오다가 마지막에 별다른 에러 없이 명령 프롬프트로 돌아오면 성공입니다. jar 파일만 이미지 안에 복사하는 방식이라 몇 초~1분이면 끝납니다.

**테스트 방법**:

```
appuser@illeesam:backend$ /usr/local/bin/docker images | grep ecadminapi
```

**명령어 설명**:

| 부분                  | 뜻                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker images`     | 지금 이 NAS에 만들어져 있는 Docker 이미지 전체 목록 보기                                                                                            |
| `\| grep ecadminapi` | `\|`(파이프)는 앞 명령 결과를 다음 명령에 그대로 넘기는 기호. `grep ecadminapi`는 그 목록 중 `ecadminapi`라는 글자가 들어간 줄만 걸러서 보여줌 |

**테스트 결과**: `shopjoy/ecadminapi   latest   ...` 줄이 방금 시각으로 나오면 성공입니다.

---

### STEP 5 — 📦 새 이미지로 컨테이너 재기동

**명령어**:

```
appuser@illeesam:backend$ /usr/local/bin/docker compose up -d --force-recreate ecadminapi
```

**명령어 설명**:

| 부분                 | 뜻                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `compose up`       | `docker-compose.yml`에 정의된 서비스(컨테이너)를 실행                                      |
| `-d`               | 백그라운드로 실행(터미널을 계속 붙잡고 있지 않고, 실행만 시키고 명령 프롬프트로 바로 돌아옴) |
| `--force-recreate` | 컨테이너가 이미 떠 있어도 강제로 새로 만듦(방금 빌드한 새 이미지로 확실히 교체)              |
| `ecadminapi`       | 대상 서비스 이름(이것만 재기동, nginx 등 다른 서비스는 안 건드림)                            |

**결과값**:

```
Container 210-ecadminApi  Recreate
Container 210-ecadminApi  Recreated
Container 210-ecadminApi  Started
```

이렇게 나오면 성공입니다.

**테스트 방법 1** — 컨테이너 상태 확인 (기동 후 1분 정도 기다렸다가):

```
appuser@illeesam:backend$ /usr/local/bin/docker compose ps
```

**명령어 설명**: `compose ps`는 이 폴더의 `docker-compose.yml`에 정의된 컨테이너들이 지금 어떤 상태(실행중/정지 등)인지 목록으로 보여줍니다.

**테스트 결과 1**: `STATUS` 컬럼에 `Up X minutes (healthy)`라고 나오면 성공입니다.
`(health: starting)`이면 아직 기동 중이니 30초~1분 더 기다렸다가 다시 확인합니다.
만약 계속 재시작을 반복하면(`Restarting`) 아래 로그 확인 명령으로 원인을 봅니다.

```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 50 ecadminapi
```

**명령어 설명**:

| 부분             | 뜻                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `compose logs` | 컨테이너가 출력한 로그(실행 기록) 보기                                                           |
| `--tail 50`    | 전체 로그 중**최근 50줄만** 보여줌(전체 로그는 너무 길어서 최근 것만 보는 게 보통 더 유용) |
| `ecadminapi`   | 어느 컨테이너의 로그를 볼지 지정                                                                 |

**테스트 방법 2** — 실제 API 응답 확인 (NAS 안에서):

```
appuser@illeesam:backend$ curl http://localhost:21080/actuator/health
```

**명령어 설명**: `curl`은 특정 URL로 요청을 보내고 그 응답을 화면에 그대로 출력하는 명령입니다(브라우저로 그 주소를 열어보는 것과 비슷한 효과를, 터미널에서 확인하는 것).

**테스트 결과 2**: 아래처럼 나오면 완전히 성공입니다.

```
{"status":"UP"}
```

**테스트 방법 3** — 🖥 내 컴퓨터(브라우저)에서 외부 접속 확인:

브라우저 주소창에 아래 URL을 입력합니다.

```
http://illeesam.synology.me:21080/actuator/health
```

**테스트 결과 3**: 화면에 `{"status":"UP"}`이 그대로 보이면 배포 성공, 외부에서도 정상 접속되는 것까지 확인된 것입니다.

---

### STEP 6 — 📦 (선택) 배포 후 정리

```
appuser@illeesam:backend$ exit
```

**명령어 설명**: `exit`는 지금 SSH 접속을 끊고 이 터미널 창을 내 컴퓨터 상태로 되돌리는 명령입니다.

이 명령으로 NAS SSH 접속을 종료합니다. 컨테이너는 `restart: unless-stopped` 옵션이 있어서, NAS를 재부팅해도 자동으로 다시 켜집니다.

---

### 참고 — `docker-compose.yml` / `Dockerfile` 내용

STEP 4~5에서 실행하는 `docker compose build`/`up`은 NAS의 `/volume1/docker/shopjoy/ecBeBo/docker-compose.yml` 설정을 그대로 따릅니다. 이 리포에서는 원본을 [`docker-compose.yml`](../docker-compose.yml)(`apps/ecBeBo/` — GitHub Actions 배포 워크플로도 이 경로를 원본으로 사용)에서 관리합니다. 실제 내용(요약 발췌 + 주석):

```yaml
services:
  ecadminapi:
    build:
      context: .
      dockerfile: Dockerfile
    image: shopjoy/ecadminapi:latest
    container_name: 210-ecadminApi

    # Postgres가 같은 NAS의 별도 컨테이너로 떠 있어서, 컨테이너가 DB_HOST 기본값
    # (이 NAS 자신의 공인 DDNS)으로 접속하면 NAT 헤어핀 경로를 타 실패하기 쉬움 —
    # host.docker.internal 로 호스트를 직접 가리켜 우회 (.env 의 DB_HOST 와 짝)
    extra_hosts:
      - "host.docker.internal:host-gateway"

    env_file:
      - .env                              # DB_HOST/SERVER_PORT 등 (4장 DB 접속 정보 참조)
    environment:
      JAVA_OPTS: "-Xms256m -Xmx1024m"      # 컨테이너 메모리 상한

    ports:
      - "21080:3000"                      # 디버깅용 직접 접근 — 공개 진입점은 nginx(21000)

    volumes:
      - /volume1/docker/ecadminapi/logs:/app/logs   # 로그를 호스트에 보관

    restart: unless-stopped                # NAS 재부팅 시 자동 시작

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/actuator/health"]
      interval: 30s
      timeout: 5s
      start_period: 60s
      retries: 3

  nginx:
    image: nginx:1.27-alpine
    container_name: 220-shopjoy-nginx
    depends_on:
      - ecadminapi
    ports:
      - "21000:80"                        # 실제 공개 진입점(프론트+API 전부 이 포트로)
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./locations.conf:/etc/nginx/locations.conf:ro
      - ./security-headers.conf:/etc/nginx/security-headers.conf:ro
      - /volume1/docker/shopjoy/frontend:/usr/share/nginx/html:ro   # 프론트 dist/ 산출물
    restart: unless-stopped
```

| 항목                               | 뜻                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `build.context` / `dockerfile` | `Dockerfile`로 이미지를 새로 빌드 — `docker compose build`가 이걸 실행                                                                |
| `container_name`                 | `docker compose ps`/`docker logs`에서 보이는 컨테이너 이름                                                                             |
| `extra_hosts`                    | 컨테이너 안에서`host.docker.internal`이 이 NAS 자신을 가리키게 함(DB 접속용)                                                             |
| `env_file: .env`                 | `SPRING_PROFILES_ACTIVE`/`DB_HOST`/`SERVER_PORT` 등을 여기서 주입                                                                    |
| `ports: "21080:3000"`            | 왼쪽(호스트 포트):오른쪽(컨테이너 내부 포트,`server.port=3000`)                                                                          |
| `restart: unless-stopped`        | 수동으로 끄지 않는 한 NAS 재부팅 후에도 자동 재기동                                                                                        |
| `healthcheck`                    | `docker compose ps`의 `(healthy)`/`(health: starting)` 표시가 이 설정에서 나옴                                                       |
| `nginx` 서비스                   | 정적 파일(프론트 dist/) 서빙 +`/api/**` 요청을 `ecadminapi:3000`으로 전달(리버스 프록시) — 설정 본문은 [`nginx.conf`](../nginx.conf) |

`nginx`가 `/api/**` 요청을 백엔드로 넘기는 규칙만 발췌하면(`locations.conf` — 실제 파일은 [`locations.conf`](../locations.conf)):

```nginx
location /api/ {
    proxy_pass http://ec_admin_api;   # nginx.conf 의 upstream ec_admin_api = ecadminapi:3000
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

즉 브라우저가 `https://21000.illeesam.synology.me/api/...`로 보낸 요청을 nginx가 컨테이너 내부에서 `http://ecadminapi:3000/api/...`로 그대로 전달합니다 — STEP 5의 "테스트 방법 3"이 `:21080`(백엔드 직결) 대신 nginx 경유(`:21000`) 주소로도 똑같이 동작하는 이유입니다. `nginx.conf`/`locations.conf`/`security-headers.conf` 전체(캐시 정책, MIME 타입, 보안 헤더 등)에 대한 자세한 설명은 [12번 문서](<12_illeesam_synology_FE_수동배포가이드(synology).md>)의 "참고" 절 참조.

**`Dockerfile`** (단일 스테이지 — 실제 내용은 [`Dockerfile`](../Dockerfile)):

```dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY *.jar app.jar
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "app.jar"]
```

| 항목 | 뜻 |
|---|---|
| `FROM eclipse-temurin:17-jre` | JRE(실행 전용)만 있는 이미지 — 컴파일러/Gradle 등 빌드 도구는 아예 없음 |
| `COPY *.jar app.jar` | STEP 1에서 이미 로컬(또는 CI)에서 만들어 둔 jar를 그대로 담기만 함 |
| `EXPOSE 3000` | 컨테이너가 3000번 포트로 앱을 띄운다는 표시(문서화 목적, 실제 포트 매핑은 `docker-compose.yml`의 `ports`가 결정) |

> ⚠ **2026-09-05 이전엔 멀티스테이지(컨테이너 안에서 `gradlew bootJar`로 다시 빌드)였습니다** — GitHub Actions 경로(전체 소스가 CI 체크아웃에 있음)에서는 문제없었지만, 이 문서의 STEP 1~3(로컬 빌드 → jar만 전송)처럼 **jar만 올라간 상태에서 `docker compose build`를 돌리면 `COPY gradlew.bat` 단계부터 "not found"로 실패**했습니다(NAS 폴더가 삭제됐다가 복구되는 과정에서 실제로 겪음 — 9011번 문서 참조). 지금 버전은 이미 만들어진 jar만 담으므로 이 문제가 없습니다.

---

## 3. GitHub Actions 자동 배포

`git push`만 하면 GitHub 서버가 대신 배포해줍니다(커밋 메시지에 `deploy`/`배포` 포함 시). 백엔드+프론트 공통 매뉴얼은 별도 문서로 분리했습니다:

→ [14_illeesam_synology_BE_자동배포가이드(npm script).md](<14_illeesam_synology_BE_자동배포가이드(npm script).md>) 참조 (전체 환경설정은 [21_illeesam_synology_GithubActions_BE_배포가이드.md](21_illeesam_synology_GithubActions_BE_배포가이드.md))

---

## 4. DB 접속 정보

애플리케이션이 접속하는 PostgreSQL 정보입니다 (Synology NAS 안에 Docker 컨테이너로 떠 있음).

| 항목                           | 값                                                     |
| ------------------------------ | ------------------------------------------------------ |
| 종류                           | PostgreSQL 17 (Docker 컨테이너)                        |
| 외부 접속 주소                 | `illeesam.synology.me`                               |
| 외부 접속 포트                 | `17632`                                              |
| 컨테이너 내부에서 접속 시 주소 | `host.docker.internal` (5장 트러블슈팅 참조 — 중요) |
| DB 이름                        | `postgres`                                           |
| 스키마                         | `shopjoy_2604`                                       |
| 계정                           | `postgres`                                           |
| 비밀번호                       | `************esam` (뒷 4자리만 표시)                 |

**연결 문자열(JDBC, 참고용)**:

```
jdbc:p6spy:postgresql://illeesam.synology.me:17632/postgres?currentSchema=shopjoy_2604
```

(운영 코드가 p6spy라는 SQL 로깅 도구를 경유해서 접속하도록 되어 있어 `postgresql://` 앞에 `p6spy:`가 붙습니다.)

**컨테이너 안에서 이 DB에 접속하는 서비스(EcAdminApi)의 `.env` 설정** (`/volume1/docker/shopjoy/ecBeBo/.env`):

```
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=3000
DB_HOST=host.docker.internal
DB_PORT=17632
```

(DB 이름/스키마/계정/비밀번호는 `dev` 프로파일의 기본값을 그대로 쓰므로 `.env`에 안 적어도 됩니다. 다른 값을 쓰고 싶으면 `DB_NAME`/`DB_SCHEMA`/`DB_USERNAME`/`DB_PASSWORD`를 추가로 적으면 됩니다.)

---

## 5. 기타 참고사항 (트러블슈팅/용어)

겪었던 문제, 자주 쓰는 운영 명령어, dev/prod 프로파일 차이, 용어 설명은 별도 문서로 분리했습니다:

→ [9011_illeesam_synology_BE_트러블슈팅용어.md](9011_illeesam_synology_BE_트러블슈팅용어.md)
