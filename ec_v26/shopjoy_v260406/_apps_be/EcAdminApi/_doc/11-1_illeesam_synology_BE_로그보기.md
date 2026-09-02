# 백엔드(EcAdminApi) → NAS 로그 보기

작성일: 2026-09-05
대상: Docker/서버 배포 경험이 적은 개발자

[11_illeesam_synology_BE_수동배포가이드(synology).md](<11_illeesam_synology_BE_수동배포가이드(synology).md>)의 부속 문서입니다 — 배포 자체가 아니라 **이미 떠 있는 백엔드의 로그를 확인하는 방법**만 다룹니다.

> 🖥 = 내 컴퓨터(Windows)에서 입력하는 명령
> 📦 = SSH로 NAS에 접속한 뒤, NAS 안에서 입력하는 명령
>
> 아래 1~10번 명령은 전부 0번(SSH 로그인) 이후, `cd /volume1/docker/shopjoy/backend` 상태에서 입력합니다. NAS 접속 자체를 다루는 더 자세한 내용(배포 STEP과 함께)은 [11번 문서](<11_illeesam_synology_BE_수동배포가이드(synology).md>) STEP 2도 참조하세요.

## 목차

0. [NAS 접속 (SSH 로그인)](#0-nas-접속-ssh-로그인)
1. [실시간 로그 보기](#1-실시간-로그-보기)
2. [최근 N줄만 보기](#2-최근-n줄만-보기)
3. [특정 시간대 로그 보기](#3-특정-시간대-로그-보기)
4. [에러만 걸러 보기](#4-에러만-걸러-보기)
5. [페이지 단위로 스크롤하며 보기 (`less`)](#5-페이지-단위로-스크롤하며-보기-less)
6. [줄 범위(페이지)로 잘라서 보기](#6-줄-범위페이지로-잘라서-보기)
7. [로그를 파일로 저장해서 보기](#7-로그를-파일로-저장해서-보기)
8. [DSM 웹 화면(Container Manager)에서 GUI로 보기](#8-dsm-웹-화면container-manager에서-gui로-보기)
9. [파일 로그 — 알아둘 점](#9-파일-로그--알아둘-점)
10. [GitHub Actions 배포 로그 보기](#10-github-actions-배포-로그-보기)

---

## 0. NAS 접속 (SSH 로그인)

**준비물**:

| 항목 | 값 |
|---|---|
| NAS 주소 | `illeesam.synology.me` |
| SSH 포트 | `10022` |
| 계정 | `appuser` |
| 비밀번호 | `appuser1**` (일부만 표시, 실제 값은 별도 보관) |

> ⚠ 계정을 새로 만들거나 바꿨다면 DSM 쪽 권한 설정이 옛 계정과 같은지 먼저 확인하세요 — 처음부터 만드는 과정은 [11-2번 문서](11-2_illeesam_synology_BE_appuser계정생성.md), 권한만 점검할 때는 [9011번 문서의 "계정 설정 시 주의사항"](9011_illeesam_synology_BE_트러블슈팅용어.md#계정-설정-시-주의사항-nas-쪽-배포-계정) 참조.

**명령어** (🖥 내 컴퓨터):
```
~> ssh -p 10022 appuser@illeesam.synology.me
```

**명령어 설명** (`ssh`는 다른 컴퓨터(여기선 NAS)에 원격으로 접속하는 명령입니다):

| 부분 | 뜻 |
|---|---|
| `ssh` | 원격 접속 명령 |
| `-p 10022` | 접속할 포트 번호 지정(NAS의 SSH 서비스가 10022번 포트로 열려있음) |
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

**결과값**: 접속에 성공하면 프롬프트가 아래처럼 `appuser@illeesam:~$` 모양으로 바뀝니다.
```
appuser@illeesam:~$
```

**로그 확인용 폴더로 이동** (아래 1~10번 명령은 전부 이 상태에서 입력):
```
appuser@illeesam:~$ cd /volume1/docker/shopjoy/backend
appuser@illeesam:backend$
```

**접속 종료**: 다 보고 나면 `exit` 입력.
```
appuser@illeesam:backend$ exit
```

---

## 1. 실시간 로그 보기

**명령어**:
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs -f ecadminapi
```

**명령어 설명**:

| 부분 | 뜻 |
|---|---|
| `compose logs` | 컨테이너가 출력한 로그(실행 기록) 보기 |
| `-f` | Follow — 새 로그가 찍힐 때마다 화면에 계속 이어서 보여줌(리눅스 `tail -f`와 동일 개념). **화면을 계속 붙잡고 있음** — 멈추려면 `Ctrl+C` |
| `ecadminapi` | 어느 컨테이너(서비스)의 로그를 볼지 지정 |

**언제 쓰나**: 지금 막 요청을 보내면서 백엔드가 실시간으로 뭘 하는지 지켜보고 싶을 때(예: 로그인 시도하면서 어떤 에러가 찍히는지 바로 확인).

**종료**: `Ctrl+C` — SSH 접속 자체는 안 끊기고 로그 출력만 멈춥니다.

---

## 2. 최근 N줄만 보기

**명령어**:
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 100 ecadminapi
```

**명령어 설명**: `--tail 100` = 전체 로그 중 **최근 100줄만** 보여주고 바로 끝남(`-f`가 없으므로 이어서 보여주지 않음). 재기동 직후 정상적으로 떴는지 훑어볼 때 가장 많이 씁니다. `deployDevSynolBe.js`(= `npm run deploy:dev-synol-be`)도 배포 마지막에 이걸 자동으로 30줄 찍어줍니다([14번 문서](<14_illeesam_synology_BE_자동배포가이드(npm script).md>) 참조).

**실시간+최근 동시에 보고 싶으면**: `-f`와 `--tail`을 같이 써도 됩니다.
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs -f --tail 50 ecadminapi
```
(최근 50줄을 먼저 보여준 뒤 이어서 실시간으로 계속 붙여줌)

---

## 3. 특정 시간대 로그 보기

**명령어**:
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --since 30m ecadminapi
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --since "2026-09-05T10:00:00" --until "2026-09-05T10:30:00" ecadminapi
```

**명령어 설명**:

| 부분 | 뜻 |
|---|---|
| `--since 30m` | 최근 30분 이내 로그만(`30m`/`2h`/`1d`처럼 상대시간, 또는 정확한 타임스탬프 둘 다 가능) |
| `--until <시각>` | 그 시각까지만(주로 `--since`와 같이 써서 구간을 잘라봄) |

**언제 쓰나**: "오전 10시쯤 배포했는데 그때 무슨 에러가 있었는지" 처럼 특정 시점을 짚어서 볼 때. NAS와 내 컴퓨터의 시간대가 다를 수 있으니, 먼저 `date` 명령으로 NAS 기준 현재 시각을 확인해두면 헷갈리지 않습니다.

---

## 4. 에러만 걸러 보기

**명령어**:
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 500 ecadminapi | grep -i "ERROR"
```

**명령어 설명**: `|`(파이프)로 앞 명령 결과를 `grep`에 넘겨서 `ERROR`가 들어간 줄만 걸러냅니다. `-i`는 대소문자 구분 안 함.

**앞뒤 맥락까지 같이 보고 싶으면** (에러 줄 앞 2줄 + 뒤 5줄까지):
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 500 ecadminapi | grep -i -B 2 -A 5 "ERROR"
```

| 부분 | 뜻 |
|---|---|
| `-B 2` | Before — 매칭된 줄 **앞** 2줄도 같이 출력(스택트레이스 원인 파악에 유용) |
| `-A 5` | After — 매칭된 줄 **뒤** 5줄도 같이 출력(스택트레이스 이어지는 부분) |

**특정 키워드로 찾기** (예: 특정 API 경로, 특정 회원ID 관련 로그만):
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 1000 ecadminapi | grep "user-pref"
```

---

## 5. 페이지 단위로 스크롤하며 보기 (`less`)

**명령어**:
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 2000 ecadminapi | less
```

**명령어 설명**: `docker compose logs`만 단독으로 실행하면 화면에 한 번에 주루룩 쏟아져서 위쪽 내용을 놓치기 쉽습니다. `less`는 긴 출력을 **페이지 단위로 넘겨가며** 원하는 속도로 볼 수 있게 해주는 프로그램입니다(`|`로 앞 명령 결과를 그대로 넘김).

**`less` 안에서 쓰는 키**:

| 키 | 동작 |
|---|---|
| `Space`(스페이스바) | **다음 페이지**로 이동 |
| `b` | **이전 페이지**로 이동 |
| `↓` / `Enter` | 한 줄씩 아래로 |
| `↑` | 한 줄씩 위로 |
| `/검색어` + `Enter` | 아래 방향으로 검색(예: `/ERROR`) |
| `n` | 같은 검색어로 **다음** 매칭 위치로 이동 |
| `N` | 같은 검색어로 **이전** 매칭 위치로 이동 |
| `g` | 맨 처음으로 이동 |
| `G` | 맨 끝으로 이동 |
| `q` | 종료(원래 화면으로 복귀) |

**실시간 로그도 페이지 넘기듯 보고 싶으면** (`-f` + `less +F`):
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs -f ecadminapi | less +F
```
`+F`는 `tail -f`처럼 실시간으로 따라가다가, `Ctrl+C`를 누르는 순간 일반 `less`(페이지 넘기기·검색 가능)로 전환됩니다 — 실시간으로 지켜보다가 방금 지나간 부분을 다시 스크롤해서 보고 싶을 때 유용합니다. (`less` 종료는 `q`, 다시 `+F` 모드로 돌아가려면 `F` 입력)

---

## 6. 줄 범위(페이지)로 잘라서 보기

로그가 아주 길 때 "100번째~200번째 줄만"처럼 원하는 구간만 정확히 잘라보고 싶으면:

```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 2000 ecadminapi | sed -n '100,200p'
```

**명령어 설명**: `sed -n '100,200p'` = 입력받은 내용 중 **100번째 줄부터 200번째 줄까지만** 출력합니다(`-n`으로 기본 출력을 끄고, `p`로 지정한 범위만 찍음).

**100줄씩 페이지 넘기듯 보고 싶으면**, 시작 줄만 바꿔가며 반복 실행합니다(1페이지=1~100, 2페이지=101~200, ...):
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 2000 ecadminapi | sed -n '1,100p'     # 1페이지
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 2000 ecadminapi | sed -n '101,200p'   # 2페이지
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 2000 ecadminapi | sed -n '201,300p'   # 3페이지
```

> 매번 `--tail 2000`을 새로 뜬 다음 자르는 것이라, 그 사이 새 로그가 계속 쌓이는 실시간 상황에서는 페이지 경계가 살짝 밀릴 수 있습니다 — 딱 멈춰있는 구간을 정확히 나눠 보고 싶다면 7번처럼 먼저 파일로 저장해두고 그 파일을 기준으로 자르는 게 더 정확합니다.

---

## 7. 로그를 파일로 저장해서 보기

**NAS 안에 파일로 저장** (나중에 다시 보거나, 위 6번처럼 정확한 줄 번호로 페이지를 나누고 싶을 때):
```
appuser@illeesam:backend$ /usr/local/bin/docker compose logs --tail 5000 ecadminapi > ~/ecadminapi-$(date +%Y%m%d-%H%M).log
```
`>`(리다이렉트)로 화면 출력 대신 파일에 저장합니다. 파일명에 `$(date +%Y%m%d-%H%M)`을 넣어 저장 시각이 자동으로 붙게 했습니다.

저장한 파일은 이제 일반 텍스트 파일이라 `less 파일명`, `sed -n '1,100p' 파일명`처럼 그대로 다시 페이지 넘겨볼 수 있고, 내용이 그 시점에 고정돼(실시간으로 안 늘어남) 정확한 줄 번호로 나누기에도 더 낫습니다.

**내 컴퓨터로 가져와서 보기** (에디터에서 편하게 검색·스크롤하고 싶을 때, 🖥):
```
~\ec_v26\shopjoy_v260406> scp -P 10022 appuser@illeesam.synology.me:~/ecadminapi-20260905-1430.log .
```
받은 뒤 VS Code 등으로 열어보면 됩니다(파일이 아주 크면 `--tail` 숫자를 줄여서 다시 저장하는 걸 권장 — 예: 2000줄 정도).

---

## 8. DSM 웹 화면(Container Manager)에서 GUI로 보기

명령어 없이, 브라우저에서 클릭만으로 로그를 볼 수도 있습니다 — SSH/명령어가 아직 부담스러우면 이 방법이 가장 쉽습니다.

**경로**: DSM 로그인 → **Container Manager**(구버전 DSM은 **Docker**) 앱 → 왼쪽 메뉴 **컨테이너** → `210-ecadminApi` 클릭 → 상단 **로그** 탭

| 기능 | 위 SSH 방법과 비교 |
|---|---|
| 실시간으로 새 로그가 이어서 찍힘, 마우스 스크롤로 위아래 이동 | 1번(`-f`)/5번(`less`)의 GUI 버전 |
| 상단 검색창으로 문자열 필터링 | 4번(`grep`)의 GUI 버전 |
| **다운로드** 버튼으로 로그 전체를 파일로 저장 | 7번(파일로 저장)의 GUI 버전 |

> SSH 명령어 조합이 아직 낯설면 평소엔 이 화면으로 확인하고, `grep`/`sed`처럼 정교하게 걸러야 할 때만 위 SSH 방법을 함께 쓰는 식으로 병행하는 걸 권장합니다.

---

## 9. 파일 로그 — 알아둘 점

`docker-compose.yml`에는 로그를 파일로 보관하기 위한 볼륨이 이미 마운트돼 있습니다.

```yaml
volumes:
  - /volume1/docker/ecadminapi/logs:/app/logs
```

즉 컨테이너 안 `/app/logs`에 쓰인 파일은 NAS의 `/volume1/docker/ecadminapi/logs`에 그대로 보존되어, 컨테이너를 재기동/재생성해도 로그가 안 사라지도록 설계돼 있습니다.

> ⚠ **다만 지금(2026-09) 이 NAS는 `dev` 프로파일로 떠 있고, `dev` 프로파일의 `logging.file.path`는 `application-dev.yml`에 `C:/_logs/shopjoy`(로컬 개발용 Windows 경로)로 설정돼 있습니다.** 컨테이너는 Linux라 이 경로가 그대로 유효하지 않아서, 실제로는 이 볼륨(`/app/logs`)에 파일이 정상적으로 쌓이지 않을 가능성이 높습니다 — **지금은 위 1~4번의 `docker compose logs`(컨테이너 stdout, Docker의 `json-file` 로그 드라이버가 받아서 저장)가 사실상 유일하게 신뢰할 수 있는 로그 확인 방법**입니다.
>
> `docker compose logs`가 참조하는 stdout 로그도 무한정 쌓이진 않습니다 — `docker-compose.yml`의 `logging` 설정(`max-size: 10m`, `max-file: 5`)에 따라 컨테이너당 최대 50MB(10MB × 5개)까지만 보관되고 그 이상은 오래된 파일부터 자동으로 지워집니다. 오래된 로그를 길게 보존해야 하면 이 부분을 늘리거나, NAS용 프로파일의 `logging.file.path`를 컨테이너 안 실제 경로(예: `/app/logs`)로 맞추는 별도 작업이 필요합니다(지금은 안 돼 있음 — 필요하시면 말씀해주세요).
>
> `prod` 프로파일(`application-prod.yml`)은 `logging.file.path: logs`(상대경로)라 이 문제가 없습니다 — `prod`로 전환하면(9011번 문서 참조) 이 볼륨에 실제로 롤링 파일 로그(`ecadminapi.log`, `ecadminapi-error.log`, 30~90일 보관)가 쌓입니다.

**로그 파일이 실제로 쌓이고 있는지 확인**:
```
appuser@illeesam:backend$ ls -la /volume1/docker/ecadminapi/logs
```
파일이 없거나 텅 비어 있으면 위에서 설명한 `dev` 프로파일의 경로 문제 때문일 가능성이 큽니다 — `docker compose logs`로 대신 확인하세요.

---

## 10. GitHub Actions 배포 로그 보기

`npm run deploy:dev-github-be`(또는 `-fe`/`-full`)로 배포했을 때는 NAS에 SSH로 안 들어가도 GitHub 쪽에서 바로 로그를 볼 수 있습니다.

**경로**: GitHub 리포지토리 → `Actions` 탭 → 해당 워크플로(`shopjoy-be-illeesam-synol-deploy` 등) → 최근 실행 클릭 → 각 스텝(`[6-1] 이미지 로드 + docker compose up -d` 등) 클릭하면 그 단계의 콘솔 출력이 펼쳐집니다.

이 워크플로는 배포 스텝 안에서 `docker compose logs --tail 30 ecadminapi`를 자동으로 실행해 최근 로그를 남겨두므로, 배포가 실패했을 때 원인 파악용으로 가장 먼저 볼 곳입니다 — 자세한 흐름은 [21번(BE) 문서](21_illeesam_synology_GithubActions_BE_배포가이드.md) 참조.

---

## 관련 문서

- [11_illeesam_synology_BE_수동배포가이드(synology).md](<11_illeesam_synology_BE_수동배포가이드(synology).md>) — NAS 접속/배포 STEP 전체
- [14_illeesam_synology_BE_자동배포가이드(npm script).md](<14_illeesam_synology_BE_자동배포가이드(npm script).md>) — `npm run deploy:dev-synol-be` 등 자동 배포
- [9011_illeesam_synology_BE_트러블슈팅용어.md](9011_illeesam_synology_BE_트러블슈팅용어.md) — dev/prod 프로파일 차이, 그 외 트러블슈팅
