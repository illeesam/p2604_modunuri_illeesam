# 프론트(FO/BO 화면) → illeesam Synology NAS 배포 가이드 — 기본(HTTP) 설정 (초보자용)

작성일: 2026-09-02
대상: Docker/서버 배포 경험이 적은 개발자

이 문서는 "**명령어를 입력한다 → 이런 결과가 나온다 → 이렇게 테스트한다 → 이런 결과가 나오면 성공이다**"
형식으로, 실제로 따라 하면서 확인할 수 있게 정리했습니다.

> 🖥 = 내 컴퓨터(Windows)에서 입력하는 명령
> 📦 = SSH로 NAS에 접속한 뒤, NAS 안에서 입력하는 명령
>
> 백엔드(EcAdminApi) 배포는 별도 문서 [11_illeesam_synology_BE_수동배포가이드.md](11_illeesam_synology_BE_수동배포가이드.md) 참조. 이 문서는 **프론트(FO 사용자 화면 + BO 관리자 화면)** 배포만 다룹니다.
>
> **이 문서는 기본(HTTP) 설정만 다룹니다.** HTTPS 전환(DSM 리버스 프록시+인증서, `crypto.subtle` 로그인 문제 해결)은 별도 문서 [13_illeesam_synology_FE_HTTPS_설정가이드.md](13_illeesam_synology_FE_HTTPS_설정가이드.md) 참조 — 실제 로그인까지 정상 동작하려면 그 문서까지 마쳐야 합니다.

## 목차

1. [지금까지 완료된 작업 요약](#1-지금까지-완료된-작업-요약)
2. [수동 배포 매뉴얼](#2-수동-배포-매뉴얼)
3. [GitHub Actions 자동 배포](#3-github-actions-자동-배포) — 빠른 실행은 [15번 문서](15_illeesam_synology_FE_자동배포가이드.md)
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

> ⚠ 백엔드(EcAdminApi)가 `dev` 프로파일로 떠 있어야 로그인 등 실제 데이터 연동 기능이 동작합니다. 백엔드 상태는 [11_illeesam_synology_BE_수동배포가이드.md](11_illeesam_synology_BE_수동배포가이드.md)의 STEP 5 테스트 방법 3을 참고해서 먼저 확인하세요.
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
| 계정 | `illeesam` |
| 비밀번호 | `s******9*!` (일부만 표시, 실제 값은 별도 보관) |
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
~\ec_v26\shopjoy_v260406> scp -P 10022 dist.tar.gz illeesam@illeesam.synology.me:/volume1/docker/shopjoy/
```

**명령어 설명** (`scp`는 파일을 원격 컴퓨터로 복사/전송하는 명령입니다):

| 부분 | 뜻 |
|---|---|
| `scp` | 파일 전송 명령 |
| `-P 10022` | 접속 포트 지정 (⚠ `ssh`의 `-p`(소문자)와 달리 `scp`는 **대문자 `-P`**) |
| `dist.tar.gz` | 보낼 파일(내 컴퓨터 쪽) |
| `illeesam@illeesam.synology.me:/volume1/docker/shopjoy/` | 받는 쪽 — `계정@주소:저장할폴더경로` |

비밀번호 입력 요구하면 입력.

**결과값**: 전송률(%)이 올라가다가 100%로 끝납니다(10MB 정도라 몇 초~몇십 초).

**테스트 방법**: **두 번째 터미널 창(NAS 접속용)**을 새로 열어서 SSH로 접속합니다.

```
~> ssh -p 10022 illeesam@illeesam.synology.me
```

**실제로 입력하는 과정 예시** (계정/비밀번호 입력 부분까지):
```
~> ssh -p 10022 illeesam@illeesam.synology.me
illeesam@illeesam.synology.me's password: 
illeesam@illeesam:~$
```
- `...'s password:` 에서 비밀번호를 입력하면 화면에 글자가 안 보이는 게 정상입니다(보안 때문) — 그대로 입력 후 Enter.
- 프롬프트가 `illeesam@illeesam:~$` 모양으로 바뀌면 접속 성공입니다.

접속되면 그대로 이어서 입력:
```
illeesam@illeesam:~$ ls -lh /volume1/docker/shopjoy/dist.tar.gz
```

**명령어 설명**: `ls -lh`는 파일 목록을 상세정보(`-l`)와 함께, 용량은 `10M`처럼 사람이 읽기 편한 단위(`-h`)로 보여줍니다.

**테스트 결과**: 파일 크기가 10MB 안팎, 수정 시각이 방금이면 성공입니다.

> 이 창은 **닫지 말고 그대로 켜둔 채** STEP 4로 넘어가세요.

---

### STEP 4 — 📦 기존 파일을 지우고 새 파일로 교체

**명령어** (STEP 3에서 열어둔 **두 번째 창(📦)**에 이어서 입력):
```
illeesam@illeesam:~$ rm -rf /volume1/docker/shopjoy/frontend/*
illeesam@illeesam:~$ tar -xzf /volume1/docker/shopjoy/dist.tar.gz -C /volume1/docker/shopjoy/frontend
illeesam@illeesam:~$ rm -f /volume1/docker/shopjoy/dist.tar.gz
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
illeesam@illeesam:~$ ls -la /volume1/docker/shopjoy/frontend | head -10
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

## 3. GitHub Actions 자동 배포

`git push`만 하면 GitHub 서버가 대신 배포해줍니다(커밋 메시지에 `deploy`/`배포` 포함 시). 백엔드+프론트 공통 매뉴얼은 별도 문서로 분리했습니다:

→ [15_illeesam_synology_FE_자동배포가이드.md](15_illeesam_synology_FE_자동배포가이드.md) 참조 (전체 환경설정은 [21번 문서](21_illeesam_synology_GithubActions_배포가이드.md))

---

## 4. 기타 참고사항 (트러블슈팅/용어)

겪었던 문제, 용어 설명은 별도 문서로 분리했습니다:

→ [9012_illeesam_synology_FE_트러블슈팅용어.md](9012_illeesam_synology_FE_트러블슈팅용어.md)
