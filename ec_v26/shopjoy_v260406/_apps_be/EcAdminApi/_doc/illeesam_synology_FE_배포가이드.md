# 프론트(FO/BO 화면) → illeesam Synology NAS 배포 가이드 (초보자용)

작성일: 2026-09-02
대상: Docker/서버 배포 경험이 적은 개발자

이 문서는 "**명령어를 입력한다 → 이런 결과가 나온다 → 이렇게 테스트한다 → 이런 결과가 나오면 성공이다**"
형식으로, 실제로 따라 하면서 확인할 수 있게 정리했습니다.

> 🖥 = 내 컴퓨터(Windows)에서 입력하는 명령
> 📦 = SSH로 NAS에 접속한 뒤, NAS 안에서 입력하는 명령
>
> 백엔드(EcAdminApi) 배포는 별도 문서 [illeesam_synology_BE_배포가이드.md](illeesam_synology_BE_배포가이드.md) 참조. 이 문서는 **프론트(FO 사용자 화면 + BO 관리자 화면)** 배포만 다룹니다.

## 목차

1. [지금까지 완료된 작업 요약](#1-지금까지-완료된-작업-요약)
2. [수동 배포 매뉴얼](#2-수동-배포-매뉴얼)
3. [GitHub Actions 자동 배포 설정 및 매뉴얼](#3-github-actions-자동-배포-설정-및-매뉴얼)
4. [기타 참고사항 (트러블슈팅/용어)](#4-기타-참고사항-트러블슈팅용어)

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

### 1-1. 환경별 프로파일 시스템 (2026-09-03 신설)

프론트가 백엔드 API를 어느 주소로 부를지(`apiOrigin`)를 **빌드할 때 미리 정해서 넣는** 방식입니다("지금이 무슨 환경인지 실행 중에 감지"하지 않음).

| 프로파일 | 빌드 명령 | `apiOrigin` 값 | 용도 |
|---|---|---|---|
| local | `npm run build:local` (=`npm run build`) | `http://호스트명:3000` | Live Server + 로컬 백엔드(3000) 직접 실행 |
| dev | `npm run build:dev` | `''` (상대경로) | **이 NAS 배포에 사용** — nginx가 같은 주소에서 프론트+API를 같이 서빙 |
| prod | `npm run build:prod` | `''` (상대경로, 기본값) | 향후 정식 운영 배포용. **GitHub Pages처럼 백엔드가 같이 안 뜨는 곳**에 쓸 거면 `lib/env/profiles/env{Bo,Fo}Consts.prod.js`의 `apiOrigin`을 실제 백엔드 주소로 직접 채워야 함 |

원리: `lib/env/envBoConsts.js`/`envFoConsts.js`(=local 원본, Live Server가 그대로 로드)와 별개로 `lib/env/profiles/` 안에 dev/prod 버전이 따로 있고, `npm run build:dev`(또는 `build:prod`)를 돌리면 그 프로파일 파일이 `dist/lib/env/` 자리를 덮어씁니다. 같은 필드에 `appTitle`(앱 이름), `appCiImage`(로고 경로), `cdnOrigin`(첨부파일 등 정적 리소스 주소)도 함께 관리됩니다.

> ⚠ Kakao/Google/Naver 같은 소셜로그인 키는 이 파일들에 넣지 않습니다 — 이미 사이트별 DB 설정(AppStore `svXxxKey`)으로 관리되는 체계가 따로 있어서, 여기 넣으면 오히려 두 개의 설정 소스가 충돌합니다.

**지금 접속 가능한 화면**:

| 화면 | URL |
|---|---|
| FO(사용자 페이지) | http://illeesam.synology.me:21000/index.html |
| BO(관리자 페이지) | http://illeesam.synology.me:21000/bo.html |

> ⚠ 백엔드(EcAdminApi)가 `dev` 프로파일로 떠 있어야 로그인 등 실제 데이터 연동 기능이 동작합니다. 백엔드 상태는 [illeesam_synology_BE_배포가이드.md](illeesam_synology_BE_배포가이드.md)의 STEP 5 테스트 방법 3을 참고해서 먼저 확인하세요.

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

### STEP 1 — 🖥 압축 빌드 (`dist/` 생성)

**명령어** (`dev` 프로파일 — 이 NAS 배포용, apiOrigin이 상대경로로 설정됨. 위 1-1 참조):
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> npm run build:dev</code></pre>

**결과값**: 아래처럼 나오면 성공입니다(수치는 그때그때 조금 다를 수 있음).
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>[1] dist/ 정리(선삭제)
[2] pages/lib/components 아래 JS 파일 압축(minify)
  ㄴ 압축 완료: 원본 9457KB → 6690KB (29.3% 감소)
[3] 루트 HTML + assets/ 복사(가공 없음)
[완료] dist/ 에 JS 339개 + HTML/assets 기록 완료

[1] BO_LAZY_CLASS_FILES 검증 ...
  결과: ✅ 전부 일치 (191개)
[2] FO_LAZY_CLASS_FILES 검증 ...
  결과: ✅ 전부 일치 (45개)
[종합] 총 0개 불일치</code></pre>

**결과물 위치**: `ec_v26\shopjoy_v260406\dist\` 폴더 (HTML/JS/CSS 압축본, 약 20MB)

**테스트 방법**: 마지막 줄이 아래인지 확인합니다.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>[종합] 총 0개 불일치</code></pre>

**테스트 결과**: `0개 불일치`가 아니라 숫자가 1 이상 나오면 **절대 다음 단계로 넘어가지 말고** 화면에 나온 파일명을 확인해서 원인을 먼저 고쳐야 합니다(압축 후에도 화면이 깨지지 않는지를 미리 걸러주는 안전장치입니다).

---

### STEP 2 — 🖥 `dist/`를 하나의 압축파일로 묶기

**명령어**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> tar -czf dist.tar.gz -C dist .</code></pre>

> 파일 하나로 묶어서 보내는 이유: `dist/` 안에 파일이 570개+ 있는데, 하나씩 전송하면 매우 느립니다. 압축파일 하나로 묶으면 훨씬 빠릅니다.

**결과값**: 별다른 출력 없이 명령이 끝나고, `dist.tar.gz` 파일이 생깁니다(약 10~11MB).

**테스트 방법**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> dir dist.tar.gz</code></pre>

**테스트 결과**: 파일이 존재하고 크기가 몇 MB로 나오면 성공입니다.

---

### STEP 3 — 🖥 NAS로 전송

**명령어**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> scp -P 10022 dist.tar.gz illeesam@illeesam.synology.me:/volume1/docker/shopjoy/</code></pre>
비밀번호 입력 요구하면 입력.

**결과값**: 전송률(%)이 올라가다가 100%로 끝납니다(10MB 정도라 몇 초~몇십 초).

**테스트 방법**: SSH로 NAS 접속 후,
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:~$</span> ls -lh /volume1/docker/shopjoy/dist.tar.gz</code></pre>

**테스트 결과**: 파일 크기가 10MB 안팎, 수정 시각이 방금이면 성공입니다.

---

### STEP 4 — 📦 기존 파일을 지우고 새 파일로 교체

**명령어** (SSH로 NAS에 접속한 상태에서):
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:~$</span> rm -rf /volume1/docker/shopjoy/frontend/*
<span style="color:#7f7;">illeesam@illeesam:~$</span> tar -xzf /volume1/docker/shopjoy/dist.tar.gz -C /volume1/docker/shopjoy/frontend
<span style="color:#7f7;">illeesam@illeesam:~$</span> rm -f /volume1/docker/shopjoy/dist.tar.gz</code></pre>

> ⚠ **완전 교체 방식입니다**: 기존 파일을 전부 지우고 새 `dist/` 내용으로 다시 채웁니다. `dist/`는 항상 필요한 파일이 전부 들어있는 "완결된 산출물"이라, 이렇게 통째로 바꿔치기해도 안전합니다(일부만 바뀌어서 옛날 파일이 남는 걱정 없음).

**결과값**: 세 명령 모두 별다른 에러 메시지 없이 끝나면 성공입니다.

**테스트 방법**:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#7f7;">illeesam@illeesam:~$</span> ls -la /volume1/docker/shopjoy/frontend | head -10</code></pre>

**테스트 결과**: `index.html`, `bo.html`, `assets`, `pages`, `lib`, `components` 등이 방금 시각으로 보이면 성공입니다.

---

### STEP 5 — 🖥 실제 반영 확인

**컨테이너를 재시작할 필요 없습니다** — nginx가 폴더를 실시간으로 읽기 때문에 파일만 바뀌면 바로 반영됩니다.

**테스트 방법 1** — 명령어로 확인:
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~&gt;</span> curl -I http://illeesam.synology.me:21000/index.html</code></pre>

**테스트 결과 1**: 첫 줄이 `HTTP/1.1 200 OK`로 나오면 성공입니다.

**테스트 방법 2** — 브라우저로 확인: 아래 두 URL을 각각 열어봅니다.
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>http://illeesam.synology.me:21000/index.html   <span style="color:#7f7;">← FO(사용자) 화면</span>
http://illeesam.synology.me:21000/bo.html      <span style="color:#7f7;">← BO(관리자) 화면</span></code></pre>

**테스트 결과 2**: 화면이 정상적으로 그려지면(하얀 화면/에러 화면이 아니라 실제 쇼핑몰/관리자 레이아웃이 보이면) 성공입니다. 브라우저 개발자도구(F12) → Console 탭에 빨간 에러가 쭉 뜨면 캐시 문제일 수 있으니 Ctrl+Shift+R(강력 새로고침)로 한 번 더 확인합니다.

---

## 3. GitHub Actions 자동 배포 설정 및 매뉴얼

`git push`만 하면, 위의 STEP 1~4 과정을 GitHub의 서버가 대신 실행해줍니다.
단, **커밋 메시지에 `deploy` 또는 `배포`라는 단어가 들어 있을 때만** 실제로 배포가 진행됩니다.

### 3-1. 관련 워크플로 파일

| 파일명 | 역할 | 언제 배포되나 |
|---|---|---|
| `shopjoy-fe-illeesam-synol-build.yml` | 프론트 빌드가 되는지만 확인(배포 안 함) | 프론트 소스가 바뀔 때마다 항상 |
| `shopjoy-fe-illeesam-synol-deploy.yml` | 프론트를 이 문서의 대상인 **Synology NAS**에 실제 배포 | 커밋 메시지에 `deploy`/`배포` 포함 시 |

(참고: `shopjoy-fe-illeesam-github-*.yml` 2개는 같은 `dist/`를 **GitHub Pages**라는 별도 주소에 배포하는 워크플로입니다 — 이 문서와는 다른 배포처라 여기서는 다루지 않습니다.)

### 3-2. 최초 1회 환경설정

**설정 위치**: GitHub 리포지토리 페이지 → 상단 `Settings` 탭 → 왼쪽 메뉴 `Secrets and variables` → `Actions`

백엔드 배포와 **동일한 시크릿 5개**를 그대로 씁니다(이미 등록돼 있으면 다시 안 해도 됩니다):

| 이름(Name) | 값(Value) |
|---|---|
| `SYNOLOGY_HOST` | `illeesam.synology.me` |
| `SYNOLOGY_PORT` | `10022` |
| `SYNOLOGY_USER` | `illeesam` |
| `SYNOLOGY_PASSWORD` | (실제 비밀번호, 일부만 `s******9*!`) |
| `SYNOLOGY_SSH_KEY` | (SSH 키를 안 쓰면 비워둬도 됨) |

**테스트 방법**: `Settings → Secrets and variables → Actions` 목록에 5개 이름이 보이는지 확인.

### 3-3. 실제 배포하는 방법

**명령어** (🖥 내 컴퓨터, 프로젝트 폴더에서):
<pre style="background:#000;color:#f0f0f0;padding:10px 14px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code><span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> git add .
<span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> git commit -m "상품목록 화면 디자인 수정 deploy"
<span style="color:#5fd7ff;">~\ec_v26\shopjoy_v260406&gt;</span> git push</code></pre>

**결과값**: `git push` 자체는 평소와 동일하게 끝납니다.

**테스트 방법**:
1. GitHub 리포지토리 → `Actions` 탭
2. `shopjoy-fe-illeesam-synol-deploy` 작업이 방금 커밋으로 실행됐는지 확인
3. 클릭해서 각 단계가 초록 체크 ✅ 인지 확인

**테스트 결과**: 모두 ✅ 면 성공. 이후 STEP 5의 테스트 방법 2(브라우저로 index.html/bo.html 열어보기)로 실제 화면이 바뀌었는지 최종 확인합니다.

> ⚠ **주의**: 이 워크플로는 NAS의 `/volume1/docker/shopjoy/frontend/` 폴더에 파일만 올립니다. nginx 컨테이너 자체가 떠 있어야(=백엔드 배포가 최초 1번은 돼 있어야) 실제로 화면이 보입니다 — 이미 되어 있는 상태이니 지금은 걱정 없습니다.

### 3-4. 배포 안 되게(스킵) 하고 싶을 때

커밋 메시지에 `deploy`/`배포` 단어를 안 쓰면, 빌드 검증만 하고 실제 NAS 배포는 건너뜁니다 (백엔드 문서 3-4와 동일한 원리).

### 3-5. 수동으로 즉시 실행하고 싶을 때 (커밋 없이)

1. GitHub 리포지토리 → `Actions` 탭
2. `shopjoy-fe-illeesam-synol-deploy` 클릭 → 오른쪽 `Run workflow` 버튼 → `Run workflow` 다시 클릭

---

## 4. 기타 참고사항 (트러블슈팅/용어)

### 4-1. SFTP 프로그램(FileZilla 등)으로 직접 옮기고 싶을 때

Synology의 SFTP는 `/volume1`을 접속 루트(`/`)로 취급합니다. 즉 SFTP 프로그램 안에서는
`/volume1/docker/shopjoy/frontend`가 아니라 **`/docker/shopjoy/frontend`**로 들어가야 합니다.
(`ssh`/`scp` 명령이나 SSH 터미널에서는 실제 경로 `/volume1/...`를 그대로 쓰면 됩니다.)

### 4-2. 화면은 뜨는데 로그인/데이터 조회가 안 될 때

프론트(화면)와 백엔드(API 서버)는 **서로 다른 배포**입니다. 화면 자체는 정상인데 로그인이나 목록 조회가 안 된다면, 십중팔구 백엔드(EcAdminApi) 컨테이너가 안 떠 있거나 문제가 있는 것입니다 → [illeesam_synology_BE_배포가이드.md](illeesam_synology_BE_배포가이드.md)의 STEP 5로 백엔드 상태부터 확인하세요.

### 4-3. 브라우저에 옛날 화면이 계속 보일 때

app JS/CSS/HTML은 `Cache-Control: no-cache`로 설정돼 있어 매번 서버에 확인은 하지만, 그래도 브라우저 캐시가 꼬였다 싶으면 **Ctrl+Shift+R**(강력 새로고침) 또는 시크릿 창으로 열어서 확인합니다.

### 4-4. 용어 설명

| 용어 | 뜻 |
|---|---|
| `dist/` | `npm run build`로 만든, 실제 배포용 압축본 폴더(원본 소스는 그대로, 이건 사본) |
| minify(압축) | JS/CSS의 불필요한 공백·줄바꿈을 지우고 변수명을 줄여서 용량을 줄이는 작업 |
| lazy 클래스 정합성 검증 | 압축 후에도 화면 코드가 제대로 연결되는지(깨지지 않는지) 자동으로 확인하는 절차 |
| nginx | 웹서버 프로그램. 여기서는 `frontend/` 폴더 안 파일을 그대로 사용자에게 보여주는 역할 |
| no-cache | "매번 서버한테 최신인지 확인하고 받아라"는 캐시 정책 (완전히 캐시 안 하는 것과는 다름) |
