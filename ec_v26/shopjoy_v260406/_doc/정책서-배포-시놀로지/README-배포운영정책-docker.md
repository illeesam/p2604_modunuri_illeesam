# ShopJoy EcAdminApi — Docker 배포 및 운영 정책서

> 작성 기준: 2026-05-04  
> 환경: Docker (Synology NAS / Linux 서버 / Windows Docker Desktop 모두 호환)

---

## 목차

1. [개요](#1-개요)
2. [Synology Container Manager 방식과의 비교](#2-synology-container-manager-방식과의-비교)
3. [디렉터리 구조](#3-디렉터리-구조)
4. [Dockerfile 작성](#4-dockerfile-작성)
5. [최초 빌드 및 실행](#5-최초-빌드-및-실행)
6. [재배포 (소스 변경 시)](#6-재배포-소스-변경-시)
7. [서버 시작/종료/상태 확인](#7-서버-시작종료상태-확인)
8. [트러블슈팅](#8-트러블슈팅)

---

## 1. 개요

이 문서는 **이미지 기반 배포** 방식입니다.  
[README-배포운영정책-synology.md](README-배포운영정책-synology.md)는 JAR을 NAS에 직접 올려 `eclipse-temurin:17-jre` 이미지로 실행하는 **마운트 방식**이지만, 이 문서는 JAR을 **이미지 안에 빌드**해서 컨테이너로 실행합니다.

### 두 가지 Docker 운용 방식

| 방식 | 특징 | 적합한 경우 |
|---|---|---|
| **A. JAR 마운트** (synology 문서) | 외부 JAR 파일을 컨테이너에 마운트하여 실행 | NAS에서 빠르게 JAR만 교체하고 싶을 때 |
| **B. 이미지 빌드** (이 문서) | JAR을 포함한 Docker 이미지를 만들어 실행 | 이미지 레지스트리 사용, CI/CD, 다중 서버 배포 시 |

---

## 2. Synology Container Manager 방식과의 비교

| 항목 | Synology 직접 실행 | Docker (이 문서) |
|---|---|---|
| 베이스 이미지 | `eclipse-temurin:17-jre` 그대로 | `eclipse-temurin:17-jre` 위에 JAR 포함하여 자체 이미지 빌드 |
| JAR 위치 | NAS 호스트 디렉터리에 마운트 | 이미지 내부에 복사됨 |
| 재배포 방식 | JAR 파일만 교체 후 `docker restart` | 이미지 재빌드 → 컨테이너 재생성 |
| 실행 환경 | NAS 단일 서버 | 어디서든 `docker run` 가능 |
| 환경변수 | `--env-file` 외부 파일 | `--env-file` 또는 `docker-compose.yml` |
| CI/CD 적합성 | 낮음 | 높음 (이미지를 레지스트리에 푸시 가능) |

---

## 3. 디렉터리 구조

```
_apps/EcAdminApi/
├─ src/                       (Java 소스)
├─ build.gradle
├─ gradlew / gradlew.bat
├─ Dockerfile                 ← 새로 추가
├─ docker-compose.yml         ← 새로 추가
├─ .dockerignore              ← 새로 추가
└─ build/libs/EcAdminApi-*.jar (빌드 산출물)
```

---

## 4. Dockerfile 작성

### 4-1. 멀티 스테이지 빌드 Dockerfile

`_apps/EcAdminApi/Dockerfile`:

```dockerfile
# ═══════════════════════════════════════════════════════════
#  STAGE 1: Build (Gradle + JDK 17)
# ═══════════════════════════════════════════════════════════
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /workspace

# Gradle 캐시 활용을 위해 의존성 파일 먼저 복사
COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

# 소스 복사 후 빌드
COPY src ./src
RUN ./gradlew clean build -x test --no-daemon

# ═══════════════════════════════════════════════════════════
#  STAGE 2: Runtime (JRE only - 이미지 크기 최소화)
# ═══════════════════════════════════════════════════════════
FROM eclipse-temurin:17-jre

LABEL maintainer="illeesam"
LABEL service="ShopJoy-EcAdminApi"

# 컨테이너 내부 작업 디렉터리
WORKDIR /app

# 빌더 스테이지에서 JAR만 복사
COPY --from=builder /workspace/build/libs/EcAdminApi-*.jar /app/EcAdminApi.jar

# 로그 디렉터리 (마운트 포인트)
RUN mkdir -p /app/logs

# 컨테이너 내부 포트 (Spring Boot HTTP)
EXPOSE 3000

# JVM 옵션 (필요 시 docker run 시 -e JAVA_OPTS=... 로 오버라이드 가능)
ENV JAVA_OPTS="-Xms256m -Xmx1024m"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/actuator/health || exit 1

# 실행
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/EcAdminApi.jar"]
```

### 4-2. .dockerignore

이미지 빌드 시 불필요한 파일을 제외하여 컨텍스트 크기를 줄입니다.

`_apps/EcAdminApi/.dockerignore`:

```
.git
.gitignore
.gradle
build
.idea
*.iml
out
target
logs
*.log
README.md
node_modules
```

---

## 5. 최초 빌드 및 실행

### 5-1. 환경변수 파일 준비

호스트(NAS 또는 Linux 서버)에 환경변수 파일 생성:

```bash
mkdir -p /volume1/docker/ecadminapi/config
mkdir -p /volume1/docker/ecadminapi/logs

cat > /volume1/docker/ecadminapi/config/ecadminapi.env << 'EOF'
SPRING_PROFILES_ACTIVE=dev
DB_HOST=172.17.0.1
DB_PORT=17632
DB_NAME=postgres
DB_SCHEMA=shopjoy_2604
DB_USERNAME=postgres
DB_PASSWORD=postgre********
JWT_SECRET=c2hvcGpveTI2MDRBZG1pbkFwaVNl****************************
LICENSE_ENABLED=true
LICENSE_SECRET=SJ2604-LicenseSecret-******************
EOF

chmod 600 /volume1/docker/ecadminapi/config/ecadminapi.env
```

### 5-2. 이미지 빌드

```bash
cd _apps/EcAdminApi

# 이미지 빌드 (멀티 스테이지: Gradle 빌드 + JRE 패키징)
docker build -t shopjoy/ecadminapi:latest .

# 또는 버전 태그
docker build -t shopjoy/ecadminapi:1.0.0 -t shopjoy/ecadminapi:latest .
```

> 빌드 첫 실행은 약 5~10분 소요됩니다 (Gradle 의존성 다운로드).  
> 두 번째부터는 `--from=builder` 캐시로 1~3분으로 단축됩니다.

### 5-3. 컨테이너 실행

```bash
docker run -d \
  --name 210-ecadminApi \
  --env-file /volume1/docker/ecadminapi/config/ecadminapi.env \
  -v /volume1/docker/ecadminapi/logs:/app/logs \
  -p 21080:3000 \
  --restart unless-stopped \
  shopjoy/ecadminapi:latest
```

| 옵션 | 설명 |
|---|---|
| `-d` | 백그라운드 실행 |
| `--name` | 컨테이너 이름 |
| `--env-file` | 환경변수 파일 (DB 접속정보 등) |
| `-v ...:/app/logs` | 로그 디렉터리 호스트에 마운트 (컨테이너 삭제해도 로그 보존) |
| `-p 21080:3000` | 외부 포트 21080 → 컨테이너 내부 3000 |
| `--restart unless-stopped` | NAS 재부팅 시 자동 시작 |
| `shopjoy/ecadminapi:latest` | 위에서 빌드한 이미지 |

> Synology 방식과 달리 **JAR 마운트가 없습니다** — JAR이 이미지 내부에 포함되어 있기 때문입니다.

### 5-4. 기동 확인

```bash
# 컨테이너 상태
docker ps | grep 210-ecadminApi

# 로그 실시간 확인
docker logs -f 210-ecadminApi

# Health check
curl http://localhost:21080/actuator/health
```

---

## 6. 재배포 (소스 변경 시)

이미지 빌드 방식은 **이미지를 새로 만들고 컨테이너를 재생성**합니다.

```bash
cd _apps/EcAdminApi

# 1. 새 이미지 빌드
docker build -t shopjoy/ecadminapi:latest .

# 2. 기존 컨테이너 정지 및 삭제
docker stop 210-ecadminApi
docker rm 210-ecadminApi

# 3. 새 이미지로 컨테이너 재생성
docker run -d \
  --name 210-ecadminApi \
  --env-file /volume1/docker/ecadminapi/config/ecadminapi.env \
  -v /volume1/docker/ecadminapi/logs:/app/logs \
  -p 21080:3000 \
  --restart unless-stopped \
  shopjoy/ecadminapi:latest

# 4. 기동 확인
docker logs -f 210-ecadminApi
```

> **이미지 태그 버전 관리**:
> ```bash
> # 새 버전을 별도 태그로 빌드 → 문제 시 즉시 롤백 가능
> docker build -t shopjoy/ecadminapi:1.0.1 .
> docker run -d ... shopjoy/ecadminapi:1.0.1
> 
> # 롤백
> docker stop 210-ecadminApi && docker rm 210-ecadminApi
> docker run -d ... shopjoy/ecadminapi:1.0.0
> ```

---

## 7. 서버 시작/종료/상태 확인

### 시작
```bash
docker start 210-ecadminApi
```

### 종료
```bash
docker stop 210-ecadminApi
```

### 상태 확인
```bash
docker ps -a --filter name=210-ecadminApi
docker logs --tail 100 210-ecadminApi
docker inspect 210-ecadminApi | grep -E "Status|Health"
```

### 이미지 관리
```bash
# 이미지 목록
docker images shopjoy/ecadminapi

# 사용하지 않는 이미지 삭제
docker image prune -a

# 특정 태그 삭제
docker rmi shopjoy/ecadminapi:1.0.0
```

---

## 8. 트러블슈팅

### 빌드 실패: `gradle dependencies` 단계
- 인터넷 연결 확인 (Maven Central / Gradle Plugin Portal 접근 가능 여부)
- 사내망 환경이면 프록시 설정 또는 미러 저장소 설정 필요

### 빌드는 성공했으나 컨테이너에서 실행 실패
```bash
# 로그 확인
docker logs 210-ecadminApi --tail 50

# 컨테이너 내부 진입하여 JAR 확인
docker exec -it 210-ecadminApi sh
ls -la /app/
java -jar /app/EcAdminApi.jar  # 직접 실행하여 오류 확인
```

### Health check 실패
- `/actuator/health` 엔드포인트가 노출되어 있는지 확인 (application-dev.yml의 `management.endpoints.web.exposure.include`)
- `curl`이 컨테이너 이미지에 포함되어 있어야 함 — `eclipse-temurin:17-jre` 기본 포함

### 이미지 크기가 너무 큼
- `--from=builder`로 builder 스테이지를 제외해야 함 (이 문서의 Dockerfile은 이미 적용됨)
- `eclipse-temurin:17-jre` (200MB) → `eclipse-temurin:17-jre-alpine` (100MB) 으로 변경 가능 (단, Alpine은 glibc 미지원 — 일부 라이브러리 호환성 문제 가능)

### Docker Compose가 더 편한가요?
- 단일 컨테이너이고 옵션이 적으면 `docker run` 으로 충분
- 환경변수, 볼륨, 네트워크가 많거나 다중 컨테이너(앱 + DB + Redis 등) 운영 시 [README-배포운영정책-docker-compose.md](README-배포운영정책-docker-compose.md) 참조

---

## 다음 단계

- 이미지 레지스트리 푸시(Docker Hub / Synology Container Registry / GitHub Container Registry)
- GitHub Actions로 자동 빌드 → 푸시 → NAS 배포 파이프라인 구성
- Docker Compose로 ecadminApi + PostgreSQL을 함께 정의
