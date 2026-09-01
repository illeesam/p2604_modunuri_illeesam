# ShopJoy EcAdminApi — Docker Compose 배포 및 운영 정책서

> 작성 기준: 2026-05-04  
> 환경: Docker Compose v2 (Docker Engine 20.10+ / Docker Desktop)

---

## 목차

1. [개요](#1-개요)
2. [Docker 단독 vs Docker Compose 비교](#2-docker-단독-vs-docker-compose-비교)
3. [디렉터리 구조](#3-디렉터리-구조)
4. [docker-compose.yml 작성](#4-docker-composeyml-작성)
5. [.env 파일 작성](#5-env-파일-작성)
6. [최초 빌드 및 실행](#6-최초-빌드-및-실행)
7. [재배포 (소스 변경 시)](#7-재배포-소스-변경-시)
8. [서버 시작/종료/상태 확인](#8-서버-시작종료상태-확인)
9. [PostgreSQL 통합 (선택)](#9-postgresql-통합-선택)
10. [트러블슈팅](#10-트러블슈팅)

---

## 1. 개요

이 문서는 **Docker Compose**로 ShopJoy EcAdminApi를 운영하는 방법입니다.  
[README-배포운영정책-docker.md](README-배포운영정책-docker.md)와 동일한 Dockerfile을 사용하지만, `docker run` 명령 대신 **YAML 선언적 구성 파일**로 컨테이너를 관리합니다.

### Docker Compose의 장점

- **선언적 구성**: 모든 옵션이 `docker-compose.yml` 한 파일에 정리됨 — 명령어 외울 필요 없음
- **간단한 명령**: `docker compose up`, `docker compose down`만으로 전체 스택 시작/정지
- **다중 컨테이너 관리**: 앱 + DB + Redis + Nginx 등을 한 번에 운영 가능
- **자동 네트워크 생성**: 컨테이너 간 호스트명으로 통신 가능 (`postgres:5432` 등)
- **환경별 분리**: `docker-compose.dev.yml`, `docker-compose.prod.yml` 으로 환경별 구성

---

## 2. Docker 단독 vs Docker Compose 비교

| 항목 | Docker (단독) | Docker Compose |
|---|---|---|
| 실행 명령 | `docker run -d --name ... -e ... -p ... 이미지` (옵션 길어짐) | `docker compose up -d` |
| 구성 관리 | 셸 명령으로 매번 입력 | YAML 파일로 영속화 |
| 다중 컨테이너 | 각각 따로 `docker run` | 한 파일에 모두 정의 |
| 네트워크 | `--network` 수동 지정 | 자동 생성 + 서비스명으로 통신 |
| 환경별 분리 | 셸 스크립트로 분기 | `-f` 옵션으로 파일 선택 |
| 로컬 개발 | 불편함 | 매우 편리 |

---

## 3. 디렉터리 구조

```
_apps/EcAdminApi/
├─ src/
├─ build.gradle
├─ Dockerfile                 (README-배포운영정책-docker.md 참조)
├─ .dockerignore
├─ docker-compose.yml         ← 메인 compose 파일
├─ docker-compose.override.yml ← (선택) 로컬 개발용 오버라이드
├─ .env                        ← 환경변수 (compose가 자동으로 읽음)
└─ .env.example                ← 템플릿 (Git 커밋 가능)
```

---

## 4. docker-compose.yml 작성

`_apps/EcAdminApi/docker-compose.yml`:

```yaml
services:
  ecadminapi:
    # ───── 빌드 ─────
    build:
      context: .
      dockerfile: Dockerfile
    image: shopjoy/ecadminapi:latest

    # ───── 컨테이너 식별 ─────
    container_name: 210-ecadminApi

    # ───── 환경변수 (.env 파일 자동 로드) ─────
    env_file:
      - .env

    # 또는 인라인으로 직접 설정
    environment:
      JAVA_OPTS: "-Xms256m -Xmx1024m"

    # ───── 포트 매핑 ─────
    ports:
      - "21080:3000"  # HTTP (외부:내부)

    # ───── 볼륨 마운트 ─────
    volumes:
      - /volume1/docker/ecadminapi/logs:/app/logs

    # ───── 재시작 정책 ─────
    restart: unless-stopped

    # ───── Health Check (Dockerfile에 정의된 것을 오버라이드 가능) ─────
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/actuator/health"]
      interval: 30s
      timeout: 5s
      start_period: 60s
      retries: 3

    # ───── 로그 드라이버 (로그 파일 크기 제한) ─────
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

# ───── 네트워크 (선택 - 기본 네트워크 사용 시 생략 가능) ─────
networks:
  default:
    name: shopjoy-net
```

---

## 5. .env 파일 작성

Compose는 `.env` 파일을 자동으로 읽어 `${변수명}` 으로 치환합니다.

`_apps/EcAdminApi/.env`:

```bash
# Spring 프로필
SPRING_PROFILES_ACTIVE=dev

# DB 접속 정보
DB_HOST=172.17.0.1
DB_PORT=17632
DB_NAME=postgres
DB_SCHEMA=shopjoy_2604
DB_USERNAME=postgres
DB_PASSWORD=postgre********

# JWT
JWT_SECRET=c2hvcGpveTI2MDRBZG1pbkFwaVNl****************************

# License
LICENSE_ENABLED=true
LICENSE_SECRET=SJ2604-LicenseSecret-******************
```

> **보안**: `.env`는 **Git 커밋 금지** — `.gitignore`에 추가하세요.  
> 대신 `.env.example`을 만들어 키만 표시 (값은 비움) → 팀원이 복사해서 사용.

`.env.example`:
```bash
SPRING_PROFILES_ACTIVE=dev
DB_HOST=
DB_PORT=
DB_NAME=
DB_SCHEMA=
DB_USERNAME=
DB_PASSWORD=
JWT_SECRET=
LICENSE_ENABLED=true
LICENSE_SECRET=
```

---

## 6. 최초 빌드 및 실행

```bash
cd _apps/EcAdminApi

# 1. 이미지 빌드 + 컨테이너 생성 + 시작 (한 번에)
docker compose up -d --build

# 2. 기동 로그 확인
docker compose logs -f ecadminapi

# 3. 헬스 체크
curl http://localhost:21080/actuator/health
```

| 옵션 | 설명 |
|---|---|
| `up` | 컨테이너 생성 + 시작 |
| `-d` | 백그라운드(detached) 실행 |
| `--build` | Dockerfile 기준으로 이미지를 강제 재빌드 |
| `logs -f <서비스명>` | 실시간 로그 추적 |

---

## 7. 재배포 (소스 변경 시)

```bash
cd _apps/EcAdminApi

# 방법 1: 한 줄로 — 이미지 재빌드 + 재생성 + 시작
docker compose up -d --build

# 방법 2: 명시적 단계 분리
docker compose build       # 이미지만 재빌드
docker compose up -d       # 새 이미지로 컨테이너 재생성 (변경된 서비스만)

# 방법 3: 강제 재생성 (이미지 변경 없어도)
docker compose up -d --force-recreate
```

> Compose는 이미지나 환경변수가 변경된 서비스만 자동으로 재생성합니다.  
> Synology 방식의 `docker stop` → `docker rm` → `docker run` 단계가 한 줄로 단축됩니다.

---

## 8. 서버 시작/종료/상태 확인

### 시작
```bash
# 정지된 컨테이너 시작 (이미지 재빌드 없음)
docker compose start

# 또는 처음부터 (없으면 생성, 있으면 시작)
docker compose up -d
```

### 종료
```bash
# 정지만 (컨테이너 보존)
docker compose stop

# 정지 + 컨테이너 삭제 (네트워크/볼륨은 보존)
docker compose down

# 정지 + 컨테이너 + 볼륨 모두 삭제 (데이터 삭제 주의!)
docker compose down -v
```

### 상태 확인
```bash
# 실행 중인 서비스
docker compose ps

# 모든 서비스 (정지된 것 포함)
docker compose ps -a

# 로그
docker compose logs --tail 100 ecadminapi
docker compose logs -f ecadminapi    # 실시간
```

### 컨테이너 내부 접속
```bash
docker compose exec ecadminapi sh
```

---

## 9. PostgreSQL 통합 (선택)

DB까지 Compose로 함께 운영하려면:

```yaml
services:
  ecadminapi:
    build: .
    container_name: 210-ecadminApi
    env_file: .env
    environment:
      DB_HOST: postgres   # ← 컨테이너 이름으로 통신 (172.17.0.1 불필요)
    ports:
      - "21080:3000"
    depends_on:
      postgres:
        condition: service_healthy   # postgres가 healthy 상태일 때만 시작
    restart: unless-stopped

  postgres:
    image: postgres:17.2
    container_name: 176-postgres-17.2
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "17632:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres-data:
```

> 두 컨테이너가 같은 Compose 네트워크 안에 있으므로  
> ecadminapi에서 `DB_HOST=postgres` (컨테이너 서비스명)로 접근 가능 → `172.17.0.1` 불필요.

---

## 10. 트러블슈팅

### `docker compose` 명령이 인식되지 않음
- Docker Engine 20.10 미만이면 구버전: `docker-compose` (하이픈) 사용
- 최신 Docker Desktop 또는 Compose v2 플러그인 설치 권장

### 환경변수가 적용되지 않음
```bash
# 현재 구성이 어떻게 해석되는지 확인 (변수 치환 결과 출력)
docker compose config

# .env 파일 위치 확인 — 반드시 docker-compose.yml과 같은 디렉터리
```

### 빌드 캐시가 너무 오래됨
```bash
# 캐시 무시하고 새로 빌드
docker compose build --no-cache

# 사용하지 않는 이미지/컨테이너/네트워크 일괄 정리
docker system prune -a
```

### 컨테이너 간 통신 실패 (DB 접속 등)
```bash
# 같은 Compose 프로젝트의 컨테이너는 서비스명으로 통신
DB_HOST=postgres   # ← OK
DB_HOST=172.17.0.1 # ← Compose에서는 불필요 (외부 DB 사용 시에만)

# 네트워크 확인
docker network ls | grep shopjoy
docker network inspect shopjoy-net
```

### 로그가 너무 많이 쌓임
- `docker-compose.yml`의 `logging` 섹션에서 `max-size`, `max-file` 조정
- 또는 호스트의 `/var/lib/docker/containers/*/` 모니터링

### Synology Container Manager에서 docker compose 사용
- DSM 7.2+: Container Manager에 **프로젝트(Project)** 기능이 있음 → docker-compose.yml 업로드 후 GUI에서 시작/정지 가능
- 또는 SSH 접속 후 동일하게 `docker compose up -d` 실행

---

## 11. Nginx 정적 자산 서빙 + 압축/캐시 (2026-08-30 추가)

지금까지 FO/BO 정적 파일(`bo.html`, `index.html`, `pages/`, `lib/`, `components/`, `assets/` 등)을
실제로 서빙하는 계층이 없었다 — `ecadminapi` 컨테이너는 백엔드 JAR만 담고 있고, 정적 파일을
읽는 로직(`FoSeoController` 등)은 파일시스템 경로(`app.frontend.dir`)에만 의존했다. 이 절은 그
공백을 메우는 nginx 서비스 도입 방법이다.

### 11.1 구성 요약

```
공개 진입점(21000) → nginx → ┬─ 정적 파일(FO/BO 소스) 직접 서빙 + gzip 압축 + 캐시 헤더
                              └─ /api/**, /foui/**, /cdn/** → ecadminapi(3000) 프록시
```

- `docker-compose.yml`(위 §4) 에 `nginx` 서비스 추가됨 — 이미지 `nginx:1.27-alpine`
- 설정 본문은 `_apps_be/EcAdminApi/nginx.conf` (레포에 포함, 이 compose 파일과 같은 디렉터리에
  배치하면 `./nginx.conf` 상대경로로 그대로 마운트됨)
- 압축: gzip (JS/CSS/JSON/SVG 등 텍스트 계열만, 1KB 이상)
- 캐시 정책 (파일 유형별 — "빌드 없음"이라 파일명에 버전 해시가 없다는 전제로 설계):

| 대상 | Cache-Control | 이유 |
|---|---|---|
| `assets/cdn/pkg/**` (버전이 경로에 박힌 CDN 라이브러리) | `max-age=31536000, immutable` | 버전 바뀌면 경로 자체가 바뀜 — 무한 캐시 안전 |
| 이미지/폰트 (`png/jpg/svg/woff2` 등) | `max-age=604800` (7일) | 자주 안 바뀜, 배포 반영 지연은 최대 7일 감수 |
| 앱 JS/CSS/HTML (`pages/`, `lib/`, `components/`, `*.html`) | `no-cache` | 버전 해시가 없어 오래 캐시하면 배포 후에도 구버전 실행 위험 — 매 요청 서버에 재검증(ETag, 변경 없으면 304) |
| `/api/**`, `/foui/**` | 백엔드가 직접 설정(프록시만) | `FoSeoController` 는 이미 `max-age=300` 자체 설정 |
| `/cdn/**` (업로드 이미지) | `max-age=86400` (1일) | 같은 URL이 재업로드로 바뀔 수 있어 짧게만 |

### 11.2 프론트 소스 배치 (최초 1회)

2026-08-30 갱신: esbuild minify 빌드(`npm run build`, `scripts/buildMinify.js`)가 도입되면서
nginx 가 서빙할 대상은 **원본 소스가 아니라 그 산출물(`dist/`)**로 바뀌었다(§11.3 참조).
NAS 에는 그 `dist/` 내용이 도착할 빈 디렉터리만 미리 준비해두면 된다 — git 체크아웃 불필요:

```bash
# NAS SSH 접속 후
mkdir -p /volume1/docker/shopjoy/frontend
```

`docker-compose.yml` 의 nginx 볼륨마운트(`/volume1/docker/shopjoy/frontend:/usr/share/nginx/html:ro`)는
이 디렉터리를 그대로 가리킨다 — 이후 §11.3 의 `rsync` 가 이 안의 내용을 채운다.

### 11.3 배포 반영 (소스 변경 시)

**빌드는 로컬(또는 CI)에서, NAS 에는 검증된 산출물만 전송한다** — 순서가 중요하다:

```bash
# ① 로컬에서 빌드 + 검증 (dist/ 는 로컬에만 있는 산출물 — 여기서 실패해도 운영엔 영향 없음)
npm run build
#    내부적으로: dist/ 선삭제(옛 파일 잔존 방지) → esbuild minify → verify-dist
#    verify-dist 가 실패(exit 1)하면 절대 ②로 넘어가지 말 것 — 그 dist/ 는 배포 불가 상태

# ② 검증 통과한 dist/ 만 NAS로 동기화 (--delete: 로컬에 없는 옛 파일을 정리, 빈 순간 없이 반영)
rsync -avz --delete dist/ user@NAS:/volume1/docker/shopjoy/frontend/
```

`npm run build`가 ①에서 멈추면(빌드 실패든 verify-dist 실패든) **②를 실행하지 않으므로 운영
서버는 직전에 배포된 상태로 계속 정상 서비스된다** — "지우고 나서 실패하면 배포할 게 없어지는"
상황이 아니다(운영 디렉터리는 ② 시점에만, 그것도 rsync 로만 바뀐다).

캐시 정책은 여전히 `no-cache`(§11.1) 이므로 — minify 로 파일 내용은 바뀌어도 파일명 자체엔
버전 해시가 없어 이전과 동일하게 브라우저가 매 요청 서버에 재검증한다. ② 이후 즉시 반영되고
nginx 재시작/reload 도 불필요하다.

`nginx.conf` 자체를 고친 경우에만 재적용 필요:
```bash
docker compose exec nginx nginx -s reload   # 무중단 재적용
```

### 11.4 포트 정책

- **21000** — 신규 공개 진입점(nginx). 방화벽/공유기 포트포워딩은 **이 포트로만** 연결할 것
- **21080** — 기존 백엔드 직접 포트. nginx 도입 후엔 디버깅 전용으로만 남겨두고 **외부 공개 금지**
  (21080 을 그대로 열어두면 nginx 의 압축/캐시/정적서빙을 우회해 API 로 직행하게 됨)

### 11.5 검증

```bash
# gzip 압축 확인 — Content-Encoding: gzip 이 보여야 함
curl -sI -H "Accept-Encoding: gzip" http://<NAS>:21000/lib/app/boAppBase.js | grep -i content-encoding

# 캐시 헤더 확인
curl -sI http://<NAS>:21000/lib/app/boAppBase.js | grep -i cache-control        # no-cache 여야 함
curl -sI http://<NAS>:21000/assets/cdn/pkg/vue/3.4.21/vue.global.prod.js | grep -i cache-control  # immutable 이어야 함

# API 프록시 확인
curl -sI http://<NAS>:21000/api/co/sy/code/list | head -1

# SEO 랜딩 확인
curl -s http://<NAS>:21000/foui/prodDtl/<실제상품ID> | grep -i "<title>"
```

> ⚠️ 이번 세션에선 로컬에 nginx/docker 실행 환경이 없어 `nginx -t` 로 실제 문법 검증을 못 했다.
> NAS 배포 전에 반드시 `docker compose exec nginx nginx -t` 로 한 번 확인할 것.

---

## 다음 단계

- **다중 환경 분리**: `docker-compose.dev.yml`, `docker-compose.prod.yml`
- **CI/CD 자동화**: GitHub Actions에서 `docker compose build && push`(+ 프론트 git pull 자동화)
- **모니터링 추가**: Prometheus + Grafana 컨테이너 추가
- ~~**리버스 프록시**: Nginx 컨테이너 추가하여 HTTPS 종단 처리~~ → §11 로 1차 완료(HTTPS 종단은
  아직 미포함 — Let's Encrypt/certbot 연동은 별도 작업 필요)
