# EcCdnApi — 개요 및 배포가이드

2026-09-06 신설. EcAdminApi 와 완전히 분리된 별도 배포 단위(Spring Boot, Java 17, Gradle) —
동영상 스트리밍 / 상품이미지 링크 / 파일 업로드 전용 CDN 서버.

## 1. 용도

| 용도 | 설명 |
|---|---|
| 동영상 스트리머 서버 | 상품 동영상 리뷰 등에 사용. 업로드 시 **첫 프레임 미리보기 이미지**와 **썸네일 이미지**를 항상 함께 만든다. HTTP Range 요청을 지원해 탐색(seek)이 자연스럽다. |
| 상품이미지 링크 서버 | 이미지를 저장하고 고유 URL(`/cf/file/{fileId}`)로 직접 서빙(`<img src>`로 바로 사용). |
| 파일 업로드 서버 | AWS S3 / Naver Cloud Object Storage 방식과 비슷한 REST 업로드/삭제 API. 파일당 최대 **120MB**, 초과 시 예외. |

## 2. 아키텍처

```
브라우저 → EcAdminApi(멀티파트 수신) → [accessToken] → EcCdnApi(실제 저장+DB 기록)
브라우저 ← ─────────────────────────────  <img>/<video> 직접 GET  ← EcCdnApi(nginx 경유, /cf/**)
```

- **업로드/삭제는 EcAdminApi 가 대신 호출**한다(EcCdnApi 를 브라우저가 직접 두드리지 않음) — `co/ext/cdn/CfCdnApiClient.java` 참조.
- **원본/썸네일/프레임/스트리밍 GET 은 브라우저가 직접** EcCdnApi 를 호출한다(nginx 의 `/cf/` 프록시 경유, 공개 permitAll).
- EcAdminApi 와 EcCdnApi 는 **accessToken(30초) + refreshToken(7일)** 기반 id/pwd 인증으로 통신한다. accessToken 이 매우 짧기 때문에 `CfCdnApiClient` 는 매 호출 직전 만료 여부를 확인하고, 필요하면 refresh(또는 refreshToken 마저 만료면 재로그인)한다. 401 응답을 받으면 1회 재로그인 후 재시도.
- DB는 EcAdminApi 와 **같은 Postgres 서버/스키마**(`illeesam.synology.me:17632`, `shopjoy_2604`)를 쓰되, **`cf_` 전용 테이블(`cf_client`, `cf_file`)만 EcCdnApi 가 독립적으로 소유**한다(`sy_attach` 재사용 안 함 — 2026-09-06 결정).
- 배포는 EcAdminApi 와 **완전히 별도**(별도 docker-compose.yml, 별도 NAS 디렉터리) — 단, nginx 가 만드는 `shopjoy-net` 네트워크를 공유해서 서비스명(`eccdnapi`)으로 통신한다.

## 3. API

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/auth/login` | 없음 | `{id, pwd}` → `{accessToken, refreshToken, expiresIn:30}` |
| POST | `/api/auth/refresh` | 없음 | `{refreshToken}` → 새 accessToken(같은 refreshToken 재사용) |
| POST | `/api/cdn/upload` | 없음(permitAll) | 멀티파트(`file`, `thumbnail` bool) → 파일 메타 + URL들 |
| DELETE | `/api/cdn/file/{fileId}` | 없음(permitAll) | 원본+썸네일+프레임 전부 삭제 |
| GET | `/cf/file/{fileId}` | 없음(공개) | 원본 파일 서빙 |
| GET | `/cf/thumbnail/{fileId}` | 없음(공개) | 썸네일 서빙(없으면 400) |
| GET | `/cf/frame/{fileId}` | 없음(공개) | 동영상 첫 프레임 서빙(동영상 아니면 400) |
| GET | `/cf/stream/{fileId}` | 없음(공개) | 동영상 스트리밍(Range 지원, `Accept-Ranges: bytes`) |

**업로드 처리 규칙**(요청사항 그대로):
- 파일 용량이 **120MB** 초과 → `CfFileTooLargeException`(413)
- **동영상**: 항상 첫 프레임(`_frame.jpg`) + 그 프레임 기반 썸네일(`_thumbnail.jpg`) 생성 시도(실패해도 업로드 자체는 유지)
- **이미지**: `thumbnail=true` 요청 시에만 `_thumbnail.{ext}` 생성
- 그 외 일반 파일: 원본만 저장

## 4. 로컬 실행

```bash
cd _apps_be/EcCdnApi
./gradlew.bat bootRun --args=--spring.profiles.active=local   # Windows
```

기본 DB 접속(illeesam.synology.me 공유 개발DB)과 JWT 더미 시크릿이 `application-local.yml` 에 있어 별다른 설정 없이 뜬다. ffmpeg 가 로컬 PATH 에 없으면 동영상 첫 프레임 추출만 조용히 실패하고(업로드는 성공) 나머지는 정상 동작한다.

## 5. 최초 1회 수동 배포 (NAS)

EcAdminApi 의 `_doc/11번 문서`(수동배포가이드)와 같은 절차. **순서가 중요하다** — EcAdminApi(nginx 포함) 가 먼저 떠서 `shopjoy-net` 네트워크를 만들어둔 상태여야 한다.

1. **DB DDL 적용** — `_doc/ddl_pgsql/ec/cf_client.sql`, `cf_file.sql` 을 real DB(shopjoy_2604)에 실행.
2. **cf_client 계정 시딩** — EcAdminApi 가 로그인할 계정 1건 INSERT(비밀번호는 BCrypt 해시로 저장). 예시 시딩값(2026-09-06 실제 적용됨):
   - `client_id = ecadminapi`
   - 평문 비밀번호(운영에서는 재발급 권장): `ecCdnApi2026SecureKe**`
3. **NAS 디렉터리 준비**: `/volume1/docker/shopjoy/eccdnapi/` 에 `Dockerfile`, `docker-compose.yml`, `.env`(`env.dev` 참고해서 직접 작성, `CF_JWT_SECRET`/`DB_PASSWORD`/`CF_CDN_CLIENT_PWD` 등 실제 값 채움) 배치.
4. **저장소/로그 볼륨 폴더 생성**: `mkdir -p /volume1/docker/shopjoy/cdn-storage /volume1/docker/eccdnapi/logs`
5. **최초 기동**: `cd /volume1/docker/shopjoy/eccdnapi && docker compose up -d --build`
6. **nginx 반영 확인** — `nginx.conf`(upstream `ec_cdn_api`)와 `locations.conf`(`/cf/` 프록시)가 이미 EcAdminApi 배포에 포함되어 있으므로, EcAdminApi 를 최신 상태로 재배포하면 자동 반영된다. `https://21000.illeesam.synology.me/cf/file/{fileId}` 로 확인.

## 6. 반복 배포 (자동 스크립트)

최초 수동 배포 이후에는 jar 갱신만 하면 되므로 자동 스크립트를 쓴다 — `_apps_be/EcAdminApi/_doc/14번 문서`(BE 자동배포가이드)와 완전히 같은 패턴.

```bash
npm run deploy:dev-synol-be-ecCdnApi
```

- `scripts/deploy-dev-synol-be-ecCdnApi.js` 실행 — Gradle 빌드 → jar SFTP 전송 → `docker compose build/up` → healthy 대기 → actuator 헬스체크.
- `deploy:dev-synol-full`(BE+FE) 에는 **포함되지 않는다** — EcCdnApi 를 건드렸을 때만 별도로 실행.
- NAS 접속정보는 `scripts/.synology-deploy.env` 공유(EcAdminApi 배포 스크립트와 동일 파일).

## 7. 환경변수 (.env, NAS 전용 — git 미추적)

`env.dev` 파일이 예시 템플릿. 실제 `.env` 는 `/volume1/docker/shopjoy/eccdnapi/.env` 에 직접 작성.

| 키 | 설명 |
|---|---|
| `DB_HOST/PORT/NAME/SCHEMA/USERNAME/PASSWORD` | EcAdminApi 와 동일 Postgres. **`DB_HOST` 는 `host.docker.internal` 고정** — `illeesam.synology.me`(공인 DDNS)로 두면 컨테이너 안에서 자기 자신에게 NAT 헤어핀을 타서 접속 타임아웃(실제로 2026-09-06 겪음, docker-compose.yml `extra_hosts` 와 짝) |
| `CF_JWT_SECRET` | Base64 HMAC 키. **local 더미 시크릿과 절대 같으면 안 됨** |
| `CF_STORAGE_ROOT` | 컨테이너 안 저장 경로(`/app/storage`, docker-compose 볼륨과 짝) |
| `CF_FFMPEG_PATH` | `ffmpeg`(PATH 상 — Dockerfile 이 apt-get 으로 설치) |
| `SERVER_PORT` / `SPRING_PROFILES_ACTIVE` | `3000` / `dev` |

## 8. 관리자 화면 (static/, Vue 3 CDN)

`src/main/resources/static/` — Spring Boot 가 자동으로 루트에 서빙(`/index.html` 등). 빌드 없이
Vue 3(CDN, `vue.global.prod.min.js` 3.4.21 — shopjoy_v260406 본프로젝트와 동일 버전, 단 EcCdnApi 는
로컬 vendor 사본이 없어 cdnjs 에서 직접 로드)로 작성. **shopjoy_v260406 의 BO 화면 구조를 최대한
그대로 참고**했다:

```
static/
├── index.html            (shell — 상단헤더 + 좌측메뉴 + 우측콘텐츠 프레임, bo.html 축소판)
├── cf-video-popup.html   (동영상 재생 전용 팝업 — window.open 으로만 열림)
├── css/cf-admin.css      (공통 스타일 — 카드/검색바/버튼 의미클래스 등 BO 감각 재현)
└── js/
    ├── cfAuth.js          (fetch/JSON 파싱 + 토스트 래퍼 — 로그인 없음, 2026-09-06)
    ├── CfClientMng.js     (window.CfClientMng — cf_client 관리 컴포넌트)
    └── CfFileMng.js       (window.CfFileMng — cf_file 관리 컴포넌트)
```

**접속**: `https://21000.illeesam.synology.me/cdn-admin/` (nginx 가 `/cdn-admin/*` → EcCdnApi 자기
static 루트로 rewrite+프록시 — EcAdminApi 자기 프론트도 `index.html`/`css`/`js` 를 갖고 있어 prefix
없이 노출하면 파일명이 겹쳐 그쪽이 대신 응답해버리는 문제가 있었다, 2026-09-06). 디버그용 직접 접근은
`http://illeesam.synology.me:21090/index.html`(prefix 없음, nginx 안 거침).

**화면 구성** (요청사항 그대로):
- 상단(shell-header) / 좌측메뉴(shell-sidebar: cf_file ↔ cf_client 전환) / 우측콘텐츠(shell-main) 3분할 프레임
- 각 관리화면 내부는 **상단검색 / 중단목록(카드형식) / 하단상세** 3단 구성(BO 표준 레이아웃과 동일 원칙)
- 목록은 표가 아닌 **카드 그리드**(`card-grid`, `item-card`) — cf_file 은 이미지=원본 축소, 동영상=**첫 프레임/썸네일을 카드 바탕이미지**로 사용 + ▶ 배지
- 리소스 원본/썸네일 보기는 `window.open()` 새창
- 동영상은 `cf-video-popup.html` 전용 팝업(`window.open`)으로 재생 — `<video poster="{썸네일 URL}">` 이라 재생 전엔 썸네일이 바탕화면처럼 보임
- cf_file 화면 상단에 첨부(업로드) 박스 — 파일 선택 + "썸네일 생성" 체크박스(이미지 첨부시만 의미, 동영상은 항상 자동 생성) + 업로드 버튼

**로그인 없음**(2026-09-06, 요청사항 "여기에선 로그인 안해도 되") — `SecurityConfig` 가
`/api/cdn/**` 를 통째로 `permitAll` 로 열어뒀다. 화면은 열자마자 바로 조회/업로드/삭제가 된다.
EcCdnApi 자체의 accessToken(30초)/refreshToken(7일) 로그인 체계(`CfAuthController`,
`CfJwtProvider`, `CfTokenAuthFilter`, `cf_client` 테이블)는 코드상 그대로 남아있다 — 지금은
아무 경로도 그걸 강제하지 않을 뿐, 나중에 EcAdminApi 의 `CfCdnApiClient`(대기 상태)를 실제로
연동할 때 서버-서버 호출 구간만 다시 인증을 강제하고 싶어질 수 있어 남겨뒀다. `ecadminapi`/
`admin` 두 cf_client 계정도 그대로 DB 에 있다(로그인 기능이 다시 필요해지면 바로 재사용 가능).

⚠️ **보안 트레이드오프**: `/api/cdn/**` 가 완전히 공개라, `https://21000.illeesam.synology.me/cdn-admin/`
URL 을 아는 사람은 누구나 파일 업로드/삭제·cf_client 계정 생성/삭제(비밀번호 재설정 포함)까지
가능하다. 내부 개발용 도구로만 쓰는 전제하에 받아들인 트레이드오프 — 외부에 URL 이 노출되면
안 된다.

**신규 백엔드 엔드포인트**(이 화면 전용, 로그인 불필요):
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/cdn/client/page` | cf_client 목록(검색: clientId/clientNm) |
| GET | `/api/cdn/client/{clientId}` | cf_client 상세 |
| POST | `/api/cdn/client` | cf_client 신규 등록 |
| PUT | `/api/cdn/client/{clientId}` | cf_client 수정(비밀번호는 값 있을 때만 재해시) |
| DELETE | `/api/cdn/client/{clientId}` | cf_client 삭제 |
| GET | `/api/cdn/file/page` | cf_file 목록(검색: 원본파일명 + 미디어유형 필터) |
| GET | `/api/cdn/file/{fileId}` | cf_file 상세 메타(공개 바이너리 서빙 `/cf/file/{id}` 와는 별개 경로) |

## 9. EcAdminApi 쪽 연동 상태 (중요)

`co/ext/cdn/CfCdnApiClient.java` 는 로그인/refresh/업로드/삭제를 전부 구현해 **호출할 준비는 되어 있지만, 2026-09-06 기준 아직 어디서도 호출되지 않는다.** 기존 `CmUploadService`(로컬 디스크 저장, `storage_type_cd=LOCAL`)를 이 클라이언트로 교체하거나 `storage_type_cd=CDN` 분기를 추가하는 작업은 **의도적으로 분리한 다음 단계**다 — 이미 운영 중인 업로드 흐름(여러 BO 화면이 의존)을 건드리는 리스크가 있어, EcCdnApi 자체가 실제 배포되어 안정적으로 동작하는 걸 먼저 확인한 뒤 진행하는 게 안전하다는 판단.

`app.cf-cdn.base-url/client-id/client-pwd` 설정은 `application.yml` 에 이미 추가되어 있다(EcAdminApi).

## 10. 관련 파일

| 파일 | 역할 |
|---|---|
| `_apps_be/EcCdnApi/` | Spring Boot 프로젝트 전체 |
| `_doc/ddl_pgsql/ec/cf_client.sql`, `cf_file.sql` | DDL(source of truth) |
| `scripts/deploy-dev-synol-be-ecCdnApi.js` | 자동 배포 스크립트 |
| `_apps_be/EcAdminApi/co/ext/cdn/CfCdnApiClient.java` | EcAdminApi → EcCdnApi 호출 클라이언트(대기 상태) |
| `_apps_be/EcAdminApi/nginx.conf`, `locations.conf` | `/cf/` 프록시(upstream `ec_cdn_api`) |
