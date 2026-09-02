# 프론트(FO/BO 화면) → illeesam Synology NAS 배포 가이드 — 기본(HTTP) 설정 (초보자용)

작성일: 2026-09-02
대상: Docker/서버 배포 경험이 적은 개발자

이 문서는 "**명령어를 입력한다 → 이런 결과가 나온다 → 이렇게 테스트한다 → 이런 결과가 나오면 성공이다**"
형식으로, 실제로 따라 하면서 확인할 수 있게 정리했습니다.

> 🖥 = 내 컴퓨터(Windows)에서 입력하는 명령
> 📦 = SSH로 NAS에 접속한 뒤, NAS 안에서 입력하는 명령
>
> 백엔드(EcAdminApi) 배포는 별도 문서 [11_illeesam_synology_BE_수동배포가이드(synology).md](<11_illeesam_synology_BE_수동배포가이드(synology).md>) 참조. 이 문서는 **프론트(FO 사용자 화면 + BO 관리자 화면)** 배포만 다룹니다.
>
> **이 문서는 기본(HTTP) 설정만 다룹니다.** HTTPS 전환(DSM 리버스 프록시+인증서, `crypto.subtle` 로그인 문제 해결)은 별도 문서 [13_illeesam_synology_FE_HTTPS_설정가이드.md](13_illeesam_synology_FE_HTTPS_설정가이드.md) 참조 — 실제 로그인까지 정상 동작하려면 그 문서까지 마쳐야 합니다.

### Windows ↔ Linux(NAS) 명령어가 다른 경우

**SSH로 NAS에 접속하는 순간부터는 그 창 안이 리눅스입니다** — 같은 "터미널 창"이라도 🖥(Windows) 상태일 때와 📦(SSH 접속 후, NAS 안) 상태일 때 쓰는 명령어 문법이 다릅니다. 이 문서에서 실제로 나오는 것들만 비교하면:

| 하고 싶은 것 | 🖥 Windows (cmd/PowerShell) | 📦 Linux (NAS 안, SSH 접속 후) |
|---|---|---|
| 파일 목록 보기 | `dir` | `ls -la` / `ls -lh` |
| 파일/폴더 삭제 | `del 파일명` / `rmdir /s /q 폴더명` | `rm -f 파일명` / `rm -rf 폴더명` |
| 압축파일(tar.gz) 만들기·풀기 | `tar -czf ...` / `tar -xzf ...` (Windows 10 1803+ 부터 기본 내장, 문법은 리눅스와 동일) | `tar -czf ...` / `tar -xzf ...` (동일) |
| 원격 접속(SSH) | `ssh -p 포트 계정@주소` | *(NAS 쪽에서는 안 씀)* |
| 파일 전송(SCP) | `scp -P 포트 파일 계정@주소:경로` | *(NAS 쪽에서는 안 씀)* |
| SSH 접속 종료 | *(해당 없음)* | `exit` |

> `ssh`/`scp`/`tar`는 Windows에서도 리눅스와 **똑같은 문법**입니다(`ssh`/`scp`는 Windows 10/11 기본 내장 OpenSSH, `tar`도 Windows 10 1803 버전부터 기본 내장) — 표에서 "Windows에서 입력"으로 분류된 건 그 명령을 입력하는 위치(🖥 창)가 Windows라는 뜻이지, 명령어 문법이 다르다는 뜻이 아닙니다. 반대로 `dir`/`del`/`rmdir`처럼 진짜 문법 자체가 다른 것도 있습니다.

## 목차

1. [지금까지 완료된 작업 요약](#1-지금까지-완료된-작업-요약)
2. [수동 배포 매뉴얼](#2-수동-배포-매뉴얼)
3. [GitHub Actions 자동 배포](#3-github-actions-자동-배포) — 빠른 실행은 [15번 문서](<15_illeesam_synology_FE_자동배포가이드(npm script).md>)
4. [기타 참고사항 (트러블슈팅/용어)](#4-기타-참고사항-트러블슈팅용어) — 상세는 [9012번 문서](9012_illeesam_synology_FE_트러블슈팅용어.md)

---

## 1. 지금까지 완료된 작업 요약

| 작업 | 상태 |
|---|---|
| `npm run build:dev`로 `dist/`(압축본) 생성 | ✅ 완료 (343개 JS + 10개 CSS 압축, lazy 클래스 정합성 검증 통과) |
| `dist/`를 Synology NAS `/volume1/docker/shopjoy/frontend/`에 배포 | ✅ 완료 |
| nginx가 그 폴더를 읽어서 실제로 서빙하는지 확인 | ✅ 완료 (index.html/bo.html 200 정상) |
| GitHub Actions로 커밋 메시지 기반 자동 배포 구성 | ✅ 완료 |
| nginx `mime.types` 누락 버그 수정 (CSS가 `text/plain`으로 나가 스타일 미적용) | ✅ 완료 |
| API 호출 주소를 환경별 프로파일 파일(`lib/env/env{Bo,Fo}Consts.js`)로 분리 | ✅ 완료 (아래 1-1 참조) |

### 1-1. 환경별 프로파일 시스템 (2026-09-03 신설, 09-04 host/port 필드 분리)

프론트가 백엔드 API를 어느 주소(호스트+포트)로 부를지를 **빌드할 때 미리 정해서 넣는** 방식입니다("지금이 무슨 환경인지 실행 중에 감지"하지 않음).

| 프로파일 | 빌드 명령 | 용도 |
|---|---|---|
| local | `npm run build:local` (=`npm run build`) | Live Server + 로컬 백엔드(3000) 직접 실행 |
| dev | `npm run build:dev` | **이 NAS 배포에 사용** |
| prod | `npm run build:prod` | 향후 정식 운영 배포용 |

원리: `lib/env/envBoConsts.js`/`envFoConsts.js`(=local 원본, Live Server가 그대로 로드)와 별개로 `lib/env/profiles/` 안에 dev/prod 버전이 따로 있고, `npm run build:dev`(또는 `build:prod`)를 돌리면 그 프로파일 파일이 `dist/lib/env/` 자리를 덮어씁니다.

**관리되는 필드 전체**:

| 필드 | 뜻 |
|---|---|
| `runMode` | 프론트 실행 모드 |
| `appTitle` | 앱 이름(화면 타이틀 등에 사용) |
| `appCiImage` | CI(로고) 이미지 경로 |
| `baseApiHost` / `baseApiPort` | API 서버 호스트/포트 |
| `cdnApiHost` / `cdnApiPort` | 첨부파일 등 정적 리소스(`/cdn/**`) 호스트/포트 |

> ⚠ Kakao/Google/Naver 같은 소셜로그인 키는 이 파일들에 넣지 않습니다 — 이미 사이트별 DB 설정(AppStore `svXxxKey`)으로 관리되는 체계가 따로 있어서, 여기 넣으면 오히려 두 개의 설정 소스가 충돌합니다. 다만 Toss페이먼츠의 공식 문서 테스트 키(`toss.TEST_CLIENT_KEY` 등)는 토스가 자기 문서에 직접 공개해둔 값이라 예외로 이미 들어있습니다.
>
> `baseApiHost`/`baseApiPort`(및 `cdnApiHost`/`cdnApiPort`)의 **dev/prod 프로파일 실제 값과, 그 값이 HTTP가 아니라 HTTPS 서브도메인을 가리키는 이유**는 별도 문서 [13_illeesam_synology_FE_HTTPS_설정가이드.md](13_illeesam_synology_FE_HTTPS_설정가이드.md)에서 다룹니다 — 이 문서(기본 설정)에서는 프로파일 "구조"만 설명합니다.

**지금 접속 가능한 화면** (기본/디버깅용, HTTP):

| 화면 | URL |
|---|---|
| FO(사용자 페이지) | http://illeesam.synology.me:21000/index.html |
| BO(관리자 페이지) | http://illeesam.synology.me:21000/bo.html |

> ⚠ 백엔드(EcAdminApi)가 `dev` 프로파일로 떠 있어야 로그인 등 실제 데이터 연동 기능이 동작합니다. 백엔드 상태는 [11_illeesam_synology_BE_수동배포가이드(synology).md](<11_illeesam_synology_BE_수동배포가이드(synology).md>)의 STEP 5 테스트 방법 3을 참고해서 먼저 확인하세요.
>
> ⚠ **로그인은 이 HTTP 주소에서는 실패할 수 있습니다**(브라우저 보안 정책상 `crypto.subtle`이 HTTPS/localhost에서만 동작 — 임시 우회는 돼 있지만 근본 해결은 HTTPS 전환입니다). 정식 로그인 확인은 [13_illeesam_synology_FE_HTTPS_설정가이드.md](13_illeesam_synology_FE_HTTPS_설정가이드.md) 완료 후 그 문서의 HTTPS 주소로 하세요.

---

## 2. 수동 배포 매뉴얼

내 컴퓨터에서 직접 압축 빌드하고, 직접 NAS로 올려서 nginx가 서빙하게 만드는 방법입니다.
GitHub Actions 없이도 이 순서대로 하면 배포됩니다.

### 준비물

| 항목 | 값 |
|---|---|
| NAS 주소 | `illeesam.synology.me` |
| SSH 포트 | `10022` |
| 계정 | `appuser` |
| 비밀번호 | `appuser1**` (일부만 표시, 실제 값은 별도 보관) |
| 프론트 파일 위치(NAS 안) | `/volume1/docker/shopjoy/frontend/` |

> ⚠ 이 폴더는 nginx 컨테이너가 읽기전용(`:ro`)으로 마운트해서 그대로 서빙합니다. **컨테이너 재시작 없이도** 파일만 새로 올리면 다음 요청부터 바로 반영됩니다(HTML/JS/CSS는 `no-cache` 캐시 정책이라 브라우저가 매번 새로 받아갑니다).
>
> ⚠ **터미널(명령 프롬프트) 창을 2개** 띄워서 진행합니다 — **① 내 컴퓨터용 창**(🖥 표시 단계)과 **② NAS 접속용 창**(📦 표시 단계, STEP 3 테스트에서 SSH로 접속한 뒤 STEP 4까지 계속 그 상태로 둡니다). 아래 각 STEP 맨 앞의 🖥/📦를 보고 "지금 어느 창에 입력해야 하는지" 확인하세요.

### STEP 1 — 🖥 압축 빌드 (`dist/` 생성)

**명령어** (`dev` 프로파일 — 이 NAS 배포용. API 주소 필드 값은 위 1-1 참조):
```
~\ec_v26\shopjoy_v260406> npm run build:dev
```

**명령어 설명**: `package.json`에 등록된 스크립트를 실행하는 명령입니다. `build:dev`는 원본 소스(`pages/`, `lib/` 등)를 압축(minify)해서 `dist/` 폴더에 만들고, API 주소도 이 NAS(`dev` 프로파일)용 값으로 맞춰줍니다.

**결과값**: 아래처럼 나오면 성공입니다(수치는 그때그때 조금 다를 수 있음).
```
minify 빌드 시작 (dist/ 생성)
  프로파일: dev (lib/env/profiles/*.dev.js 로 교체 예정)

[1] dist/ 정리(선삭제)
[2] pages/lib/components 아래 JS 파일 압축(minify)
  ㄴ 압축 완료: 원본 9471KB → 6695KB (29.3% 감소)
[3] 루트 HTML + assets/ 복사(가공 없음)
[4] 프로파일 env 파일 적용 (dev)
  ㄴ lib/env/profiles/envBoConsts.dev.js → dist/lib/env/envBoConsts.js 로 교체
  ㄴ lib/env/profiles/envFoConsts.dev.js → dist/lib/env/envFoConsts.js 로 교체
  결과: ✅ 프로파일 적용 완료
[완료] dist/ 에 JS 343개 + HTML/assets 기록 완료 (프로파일: dev)

[1] BO_LAZY_CLASS_FILES 검증 ...
  결과: ✅ 전부 일치 (191개)
[2] FO_LAZY_CLASS_FILES 검증 ...
  결과: ✅ 전부 일치 (45개)
[종합] 총 0개 불일치
```

**결과물 위치**: `ec_v26\shopjoy_v260406\dist\` 폴더 (HTML/JS/CSS 압축본, 약 20MB)

**테스트 방법**: 마지막 줄이 아래인지 확인합니다.
```
[종합] 총 0개 불일치
```

**테스트 결과**: `0개 불일치`가 아니라 숫자가 1 이상 나오면 **절대 다음 단계로 넘어가지 말고** 화면에 나온 파일명을 확인해서 원인을 먼저 고쳐야 합니다(압축 후에도 화면이 깨지지 않는지를 미리 걸러주는 안전장치입니다).

---

### STEP 2 — 🖥 `dist/`를 하나의 압축파일로 묶기

**명령어**:
```
~\ec_v26\shopjoy_v260406> tar -czf dist.tar.gz -C dist .
```

**명령어 설명** (`tar`는 여러 파일/폴더를 압축파일 하나로 묶는 명령입니다):

| 부분 | 뜻 |
|---|---|
| `-c` | 새 압축파일 만들기(Create) |
| `-z` | gzip으로 압축(용량 줄이기) |
| `-f dist.tar.gz` | 결과 파일 이름을 `dist.tar.gz`로 지정 |
| `-C dist .` | `dist` 폴더 **안으로 들어가서** 그 안의 모든 파일(`.`)을 묶음(폴더 자체가 아니라 내용물만 묶기 위함) |

> 파일 하나로 묶어서 보내는 이유: `dist/` 안에 파일이 570개+ 있는데, 하나씩 전송하면 매우 느립니다. 압축파일 하나로 묶으면 훨씬 빠릅니다.

**결과값**: 별다른 출력 없이 명령이 끝나고, `dist.tar.gz` 파일이 생깁니다(약 10~11MB).

**테스트 방법**:
```
~\ec_v26\shopjoy_v260406> dir dist.tar.gz
```

**명령어 설명**: `dir`은 윈도우에서 폴더 안의 파일 목록을 보여주는 명령입니다.

**테스트 결과**: 파일이 존재하고 크기가 몇 MB로 나오면 성공입니다.

---

### STEP 3 — 🖥 NAS로 전송

**명령어**:
```
~\ec_v26\shopjoy_v260406> scp -P 10022 dist.tar.gz appuser@illeesam.synology.me:/volume1/docker/shopjoy/
```

**명령어 설명** (`scp`는 파일을 원격 컴퓨터로 복사/전송하는 명령입니다):

| 부분 | 뜻 |
|---|---|
| `scp` | 파일 전송 명령 |
| `-P 10022` | 접속 포트 지정 (⚠ `ssh`의 `-p`(소문자)와 달리 `scp`는 **대문자 `-P`**) |
| `dist.tar.gz` | 보낼 파일(내 컴퓨터 쪽) |
| `appuser@illeesam.synology.me:/volume1/docker/shopjoy/` | 받는 쪽 — `계정@주소:저장할폴더경로` |

비밀번호 입력 요구하면 입력.

**결과값**: 전송률(%)이 올라가다가 100%로 끝납니다(10MB 정도라 몇 초~몇십 초).

**테스트 방법**: **두 번째 터미널 창(NAS 접속용)**을 새로 열어서 SSH로 접속합니다.

```
~> ssh -p 10022 appuser@illeesam.synology.me
```

**실제로 입력하는 과정 예시** (계정/비밀번호 입력 부분까지):
```
~> ssh -p 10022 appuser@illeesam.synology.me
appuser@illeesam.synology.me's password: 
appuser@illeesam:~$
```
- `...'s password:` 에서 비밀번호를 입력하면 화면에 글자가 안 보이는 게 정상입니다(보안 때문) — 그대로 입력 후 Enter.
- 프롬프트가 `appuser@illeesam:~$` 모양으로 바뀌면 접속 성공입니다.

접속되면 그대로 이어서 입력:
```
appuser@illeesam:~$ ls -lh /volume1/docker/shopjoy/dist.tar.gz
```

**명령어 설명**: `ls -lh`는 파일 목록을 상세정보(`-l`)와 함께, 용량은 `10M`처럼 사람이 읽기 편한 단위(`-h`)로 보여줍니다.

**테스트 결과**: 파일 크기가 10MB 안팎, 수정 시각이 방금이면 성공입니다.

> 이 창은 **닫지 말고 그대로 켜둔 채** STEP 4로 넘어가세요.

---

### STEP 4 — 📦 기존 파일을 지우고 새 파일로 교체

**명령어** (STEP 3에서 열어둔 **두 번째 창(📦)**에 이어서 입력):
```
appuser@illeesam:~$ rm -rf /volume1/docker/shopjoy/frontend/*
appuser@illeesam:~$ tar -xzf /volume1/docker/shopjoy/dist.tar.gz -C /volume1/docker/shopjoy/frontend
appuser@illeesam:~$ rm -f /volume1/docker/shopjoy/dist.tar.gz
```

**명령어 설명**:

| 명령 | 뜻 |
|---|---|
| `rm -rf /volume1/docker/shopjoy/frontend/*` | 그 폴더 안의 파일을 전부 삭제. `-r`=폴더 안까지 전부(하위 폴더 포함), `-f`=확인 질문 없이 강제 진행 |
| `tar -xzf ... -C ...` | 압축 풀기(`-x`=Extract, `-z`=gzip, `-f`=대상 파일). `-C 경로`=그 경로에 풀어놓기 |
| `rm -f /volume1/docker/shopjoy/dist.tar.gz` | 다 쓴 압축파일 삭제(디스크 정리) |

> ⚠ **완전 교체 방식입니다**: 기존 파일을 전부 지우고 새 `dist/` 내용으로 다시 채웁니다. `dist/`는 항상 필요한 파일이 전부 들어있는 "완결된 산출물"이라, 이렇게 통째로 바꿔치기해도 안전합니다(일부만 바뀌어서 옛날 파일이 남는 걱정 없음).

**결과값**: 세 명령 모두 별다른 에러 메시지 없이 끝나면 성공입니다.

**테스트 방법**:
```
appuser@illeesam:~$ ls -la /volume1/docker/shopjoy/frontend | head -10
```

**명령어 설명**: `ls -la`는 상세정보+숨김파일까지 포함한 전체 목록을 보여주는데, 파일이 많을 수 있어서 `| head -10`(파이프+head)으로 **맨 위 10줄만** 잘라서 봅니다.

**테스트 결과**: `index.html`, `bo.html`, `assets`, `pages`, `lib`, `components` 등이 방금 시각으로 보이면 성공입니다. 확인이 끝나면 이 창에서 `exit` 입력해서 SSH 접속을 종료해도 됩니다.

---

### STEP 5 — 🖥 실제 반영 확인

**컨테이너를 재시작할 필요 없습니다** — nginx가 폴더를 실시간으로 읽기 때문에 파일만 바뀌면 바로 반영됩니다.

**테스트 방법 1** — 명령어로 확인:
```
~> curl -I http://illeesam.synology.me:21000/index.html
```

**명령어 설명**: `curl`은 URL로 요청을 보내는 명령이고, `-I`는 페이지 내용 전체가 아니라 **응답 헤더(상태코드 등 요약 정보)만** 보여줍니다 — 접속되는지만 빠르게 확인할 때 씁니다.

**테스트 결과 1**: 첫 줄이 `HTTP/1.1 200 OK`로 나오면 성공입니다.

**테스트 방법 2** — 브라우저로 확인: 아래 두 URL을 각각 열어봅니다.
```
http://illeesam.synology.me:21000/index.html   ← FO(사용자) 화면
http://illeesam.synology.me:21000/bo.html      ← BO(관리자) 화면
```

**테스트 결과 2**: 화면이 정상적으로 그려지면(하얀 화면/에러 화면이 아니라 실제 쇼핑몰/관리자 레이아웃이 보이면) 성공입니다. 브라우저 개발자도구(F12) → Console 탭에 빨간 에러가 쭉 뜨면 캐시 문제일 수 있으니 Ctrl+Shift+R(강력 새로고침)로 한 번 더 확인합니다.

---

### 참고 — 프론트를 실제로 서빙하는 `nginx` 컨테이너 설정

STEP 4에서 파일만 새로 올리고 컨테이너를 재시작할 필요가 없는 이유가 바로 이 설정입니다. `/volume1/docker/shopjoy/backend/docker-compose.yml`(원본은 [`docker-compose.yml`](../docker-compose.yml) — `_apps_be/EcAdminApi/`, 백엔드와 같은 폴더에서 관리) 안의 `nginx` 서비스 부분만 발췌:

```yaml
nginx:
  image: nginx:1.27-alpine
  container_name: 220-shopjoy-nginx
  depends_on:
    - ecadminapi
  ports:
    - "21000:80"                        # 실제 공개 진입점 — 프론트+API 전부 이 포트로 들어옴
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./locations.conf:/etc/nginx/locations.conf:ro
    - ./security-headers.conf:/etc/nginx/security-headers.conf:ro
    - /volume1/docker/shopjoy/frontend:/usr/share/nginx/html:ro   # ← STEP 4에서 새 파일을 채우는 그 폴더
  restart: unless-stopped
```

| 항목 | 뜻 |
|---|---|
| `image: nginx:1.27-alpine` | 프론트 전용 Dockerfile 없이 nginx 공식 이미지를 그대로 씀(정적 파일만 서빙하면 되므로 커스텀 빌드 불필요) |
| `/volume1/docker/shopjoy/frontend:/usr/share/nginx/html:ro` | **STEP 4에서 파일을 새로 채우는 그 폴더**를 nginx가 읽기전용(`:ro`)으로 마운트 — 컨테이너를 껐다 켤 필요 없이 폴더 내용만 바뀌면 다음 요청부터 즉시 반영(STEP 5가 재시작 없이 되는 이유) |
| `nginx.conf`/`locations.conf` | gzip 압축, `/api/**` → `ecadminapi:3000` 리버스 프록시, MIME 타입 설정 등 — 전체 내용은 [`nginx.conf`](../nginx.conf) |
| `ports: "21000:80"` | 왼쪽(호스트, 공개 포트):오른쪽(컨테이너 내부 nginx 기본 포트 80) |

nginx 설정은 파일 3개로 나뉘어 있습니다(전부 위 `docker-compose.yml`의 `nginx` 서비스가 `:ro`로 마운트) — 아래에서 각 파일의 프론트 서빙 관련 부분만 발췌·설명합니다.

**① `nginx.conf`** (뼈대 — mime/gzip/업스트림 정의 후 아래 두 파일을 `include`):

```nginx
http {
    include       mime.types;              # 확장자별 Content-Type 결정(.css → text/css) — 이게 없으면
    default_type  application/octet-stream; # 전부 text/plain 으로 나가 브라우저가 CSS 적용을 거부함(실제 겪은 버그)

    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json ...;
                                            # 프론트가 빌드 없이 원본 JS를 그대로 서빙하므로 전송량을 줄이기 위함

    upstream ec_admin_api {
        server ecadminapi:3000;            # 아래 locations.conf 의 proxy_pass 가 이 이름을 사용
    }

    server {
        listen 80;
        include /etc/nginx/security-headers.conf;   # ← ③
        include /etc/nginx/locations.conf;           # ← ②
    }
}
```

| 항목 | 뜻 |
|---|---|
| `include mime.types` | STEP 5 결과가 정상인데 화면 스타일만 안 먹는다면 가장 먼저 의심할 부분 — 상세는 [9012번 문서](9012_illeesam_synology_FE_트러블슈팅용어.md) |
| `upstream ec_admin_api` | 서비스명(`ecadminapi`)이 곧 컨테이너 간 DNS 이름 — `docker-compose.yml`의 서비스 이름과 반드시 일치해야 함 |
| `include locations.conf` | 실제 라우팅 규칙(어떤 요청을 정적 파일로 줄지, 어떤 요청을 백엔드로 넘길지)은 전부 아래 ②에 있음 — HTTP(80)/HTTPS(443) 두 `server` 블록이 이 파일 하나를 같이 씀(규칙 중복 관리 방지) |

**② `locations.conf`** (실제 라우팅 + 캐시 정책 — 실제 파일은 [`locations.conf`](../locations.conf)):

```nginx
# ① CDN 로컬 패키지 — 경로에 버전이 박혀있어 내용이 절대 안 바뀜 → 1년 캐시
location ~* ^/assets/cdn/pkg/ {
    root /usr/share/nginx/html;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
}

# ② 이미지/폰트 — 버전 경로 없음, 적당히 길게(7일)
location ~* \.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot)$ {
    root /usr/share/nginx/html;
    add_header Cache-Control "public, max-age=604800" always;
}

# ③ 앱 소스(JS/CSS/HTML) — "빌드 없음" 구조라 오래 캐시하면 배포 직후에도
#    브라우저가 구버전을 계속 씀 → no-cache(저장은 하되 매번 서버에 재검증)
location ~* \.(js|css|html)$ {
    root /usr/share/nginx/html;
    add_header Cache-Control "no-cache" always;
}

# ④ 백엔드 API — /api/**, /foui/**, /cdn/** 은 ecadminapi 로 프록시
location /api/ {
    proxy_pass http://ec_admin_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
# (foui/, cdn/ 도 같은 형태 — cdn/ 만 add_header Cache-Control "public, max-age=86400" 추가)

# ⑤ 그 외 전부(루트 index.html/bo.html 등) — 정적 파일 우선, 없으면 백엔드로 폴백
location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ @backend;
}
location @backend {
    proxy_pass http://ec_admin_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

| 항목 | 뜻 |
|---|---|
| ①②③ 캐시 계층 3단 | "절대 안 바뀜(1년)" / "가끔 바뀜(7일)" / "배포마다 바뀜(no-cache)"로 파일 종류별 캐시 기간을 다르게 줌 — STEP 1에서 매번 새로 만드는 `dist/`의 JS/CSS/HTML은 항상 ③(no-cache)에 걸려서, **STEP 4로 파일만 새로 올리면 컨테이너 재시작 없이 다음 요청부터 바로 새 버전이 보이는 이유**가 여기 있습니다 |
| ④ `location /api/` | `proxy_pass http://ec_admin_api`가 위 `upstream ec_admin_api`(=`ecadminapi:3000`)로 요청을 넘김 — 브라우저에서 볼 땐 프론트와 API가 같은 origin(`21000.illeesam.synology.me`)이라 CORS 자체가 필요 없는 것처럼 동작(다만 백엔드를 직접 다른 도메인에서 부르면 CORS가 필요 — [14번 문서](<14_illeesam_synology_BE_자동배포가이드(npm script).md>) 참조) |
| ⑤ `index index.html` + `try_files $uri $uri/ @backend` | `http://.../` (파일명 없는 루트 주소)로 접속해도 `index.html`을 찾아서 보여줌. 못 찾으면 `@backend`(백엔드)로 폴백 |

**③ `security-headers.conf`** (HTTP/HTTPS 두 `server` 블록 공통 보안 헤더 — 실제 파일은 [`security-headers.conf`](../security-headers.conf)):

```nginx
add_header X-Content-Type-Options "nosniff" always;        # MIME 스니핑으로 인한 콘텐츠 유형 오인 방지
add_header X-Frame-Options "SAMEORIGIN" always;             # 클릭재킹 방지(같은 출처 iframe은 허용)
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-XSS-Protection "0" always;                     # 레거시 브라우저 XSS 필터 비활성(오히려 취약점 유발 가능)
```

> CSP(Content-Security-Policy)는 일부러 안 넣었습니다 — Vue 3 CDN 런타임 컴파일러가 템플릿을 `new Function()`으로 컴파일해서 `script-src`에 `'unsafe-eval'`이 사실상 필수고, 코드 전체에 인라인 `style="..."` 속성이 많아 `style-src`도 `'unsafe-inline'` 없인 거의 다 막힙니다 — 이 상태로 CSP를 넣어도 사실상 전부 허용하는 CSP라 보호 효과가 없습니다.

---

## 3. GitHub Actions 자동 배포

`git push`만 하면 GitHub 서버가 대신 배포해줍니다(커밋 메시지에 `deploy`/`배포` 포함 시). 백엔드+프론트 공통 매뉴얼은 별도 문서로 분리했습니다:

→ [15_illeesam_synology_FE_자동배포가이드(npm script).md](<15_illeesam_synology_FE_자동배포가이드(npm script).md>) 참조 (전체 환경설정은 [22_illeesam_synology_GithubActions_FE_배포가이드.md](22_illeesam_synology_GithubActions_FE_배포가이드.md))

---

## 4. 기타 참고사항 (트러블슈팅/용어)

겪었던 문제, 용어 설명은 별도 문서로 분리했습니다:

→ [9012_illeesam_synology_FE_트러블슈팅용어.md](9012_illeesam_synology_FE_트러블슈팅용어.md)
