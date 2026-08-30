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

## 다음 단계

- **다중 환경 분리**: `docker-compose.dev.yml`, `docker-compose.prod.yml`
- **CI/CD 자동화**: GitHub Actions에서 `docker compose build && push`
- **모니터링 추가**: Prometheus + Grafana 컨테이너 추가
- **리버스 프록시**: Nginx 컨테이너 추가하여 HTTPS 종단 처리
