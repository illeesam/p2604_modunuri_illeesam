# docker-compose.yml 설명서

## 개요
EC Admin API와 PostgreSQL 데이터베이스를 Docker 컨테이너로 실행하기 위한 Docker Compose 설정 파일입니다.
두 개의 서비스가 하나의 가상 네트워크로 연결되어 있습니다.

---

## 파일 구조

### 1. 버전 및 서비스 정의
```yaml
version: '3.8'
```
- Docker Compose 버전 3.8 사용 (최신 기능 지원)

---

## 서비스 상세 설명

### 📦 Service 1: PostgreSQL 데이터베이스 (`postgres`)

#### 이미지
```yaml
image: postgres:15-alpine
```
- PostgreSQL 15 버전의 Alpine Linux 기반 이미지
- 경량이면서도 안정적인 데이터베이스

#### 컨테이너 이름
```yaml
container_name: shopjoy_db
```
- 컨테이너를 `shopjoy_db`라는 이름으로 식별

#### 환경 변수
```yaml
environment:
  POSTGRES_USER: illeesam              # DB 접속 사용자명
  POSTGRES_PASSWORD: postgresqlilleesam # DB 접속 암호
  POSTGRES_DB: shopjoy_db              # 생성할 기본 데이터베이스명
```
- PostgreSQL 초기 설정 정보
- 사용자 `illeesam`으로 `shopjoy_db` 데이터베이스 생성

#### 포트 설정
```yaml
ports:
  - "5432:5432"
```
- 호스트의 5432 포트를 컨테이너의 5432 포트로 매핑
- PostgreSQL 기본 포트 사용

#### 볼륨 설정
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```
- 데이터베이스 데이터를 `postgres_data` 볼륨에 저장
- 컨테이너 재시작 후에도 데이터 유지

#### 네트워크
```yaml
networks:
  - shopjoy_network
```
- `shopjoy_network`라는 커스텀 네트워크에 연결
- 같은 네트워크의 다른 서비스와 통신 가능

#### 헬스 체크
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U illeesam"]
  interval: 10s
  timeout: 5s
  retries: 5
```
- 10초마다 `pg_isready` 명령어로 DB 상태 확인
- 5초 이내에 응답이 없으면 timeout
- 최대 5회까지 재시도
- **목적**: API 서비스가 DB 준비 완료 후 시작되도록 보장

---

### 🚀 Service 2: EC Admin API (`ec-admin-api`)

#### 빌드 설정
```yaml
build:
  context: .
  dockerfile: Dockerfile
```
- 현재 디렉토리(`.`)의 `Dockerfile`을 사용하여 이미지 빌드
- `Dockerfile`에 정의된 두 단계 빌드(multi-stage build) 실행
  - 단계 1: Gradle로 JAR 파일 빌드
  - 단계 2: 최종 런타임 이미지 생성

#### 컨테이너 이름
```yaml
container_name: ec_admin_api
```
- 컨테이너를 `ec_admin_api`라는 이름으로 식별

#### 포트 설정
```yaml
ports:
  - "31000:31000"
```
- 호스트의 31000 포트를 컨테이너의 31000 포트로 매핑
- Spring Boot 애플리케이션이 31000 포트에서 실행

#### 환경 변수 (Database)
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/shopjoy_db
SPRING_DATASOURCE_USERNAME: illeesam
SPRING_DATASOURCE_PASSWORD: postgresqlilleesam
SPRING_DATASOURCE_DRIVER_CLASS_NAME: org.postgresql.Driver
```
- **SPRING_DATASOURCE_URL**: `postgres`는 같은 네트워크의 PostgreSQL 서비스 호스트명
- **USERNAME/PASSWORD**: PostgreSQL 설정과 동일
- **DRIVER_CLASS_NAME**: PostgreSQL JDBC 드라이버 지정

#### 환경 변수 (JPA)
```yaml
SPRING_JPA_HIBERNATE_DDL_AUTO: validate
SPRING_JPA_SHOW_SQL: false
SPRING_JPA_DATABASE_PLATFORM: org.hibernate.dialect.PostgreSQL10Dialect
```
- **validate**: 기존 스키마와 매핑 검증만 수행 (자동 생성 안 함)
- **SHOW_SQL: false**: SQL 쿼리 로깅 비활성화 (성능 개선)
- **DATABASE_PLATFORM**: Hibernate가 PostgreSQL에 맞는 SQL 생성

#### 환경 변수 (JWT)
```yaml
JWT_SECRET: your_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRATION: 86400000        # 24시간 (밀리초)
JWT_REFRESH_EXPIRATION: 604800000 # 7일 (밀리초)
```
- 토큰 기반 인증 설정
- ⚠️ **보안 주의**: 프로덕션 환경에서는 환경 변수나 시크릿 관리 서비스 사용

#### 환경 변수 (파일 업로드)
```yaml
FILE_UPLOAD_PATH: /app/uploads
FILE_UPLOAD_MAX_SIZE: 10MB
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE: 10MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE: 50MB
```
- 업로드 디렉토리: 컨테이너 내 `/app/uploads`
- 단일 파일 최대 크기: 10MB
- 전체 요청 최대 크기: 50MB

#### 환경 변수 (카카오 API)
```yaml
KAKAO_CLIENT_ID: your_kakao_client_id
KAKAO_CLIENT_SECRET: your_kakao_client_secret
KAKAO_REDIRECT_URI: http://localhost:31000/auth/kakao/callback
```
- 카카오 로그인 연동 정보
- ⚠️ **보안 주의**: 실제 시크릿 키로 교체 필요

#### 환경 변수 (서버)
```yaml
SERVER_PORT: 31000
SPRING_PROFILES_ACTIVE: dev
```
- **SERVER_PORT**: 애플리케이션 포트
- **PROFILES_ACTIVE**: `dev` 프로필로 실행 (개발 환경 설정 사용)

#### 볼륨 설정
```yaml
volumes:
  - ./uploads:/app/uploads
```
- 호스트의 `./uploads` 디렉토리를 컨테이너의 `/app/uploads`에 마운트
- 업로드된 파일이 호스트에 저장되어 컨테이너 재시작 후에도 유지

#### 의존성 설정
```yaml
depends_on:
  postgres:
    condition: service_healthy
```
- PostgreSQL 서비스의 헬스 체크가 성공할 때까지 기다림
- 데이터베이스가 준비 완료 후 API 서비스 시작 보장

#### 네트워크
```yaml
networks:
  - shopjoy_network
```
- PostgreSQL과 같은 네트워크에 연결
- `postgres:5432` 주소로 데이터베이스 접근 가능

---

## 볼륨 정의

### Named Volume
```yaml
volumes:
  postgres_data:
```
- PostgreSQL 데이터를 저장하는 명명된 볼륨
- Docker가 관리하는 위치에 저장됨
- 데이터 영속성 보장

---

## 네트워크 정의

### Bridge Network
```yaml
networks:
  shopjoy_network:
    driver: bridge
```
- `bridge` 드라이버 사용 (기본값)
- `postgres`와 `ec-admin-api` 서비스가 이 네트워크로 연결
- 서비스명(`postgres`)으로 서로 통신 가능

---

## 실행 명령어

### 빌드 및 시작
```bash
docker-compose up --build
```
- Dockerfile을 기반으로 새로 빌드하고 모든 서비스 시작

### 백그라운드 실행
```bash
docker-compose up -d --build
```
- 백그라운드에서 실행 (터미널이 블로킹되지 않음)

### 서비스 중지
```bash
docker-compose down
```
- 모든 컨테이너 및 네트워크 중지 및 제거
- `volumes` 섹션의 데이터는 유지됨

### 볼륨 포함 완전 제거
```bash
docker-compose down -v
```
- 컨테이너, 네트워크, 볼륨 모두 제거
- ⚠️ 데이터베이스 데이터도 삭제됨

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f ec-admin-api
docker-compose logs -f postgres
```

### 서비스 상태 확인
```bash
docker-compose ps
```

---

## 서비스 간 통신 흐름

```
호스트
  ├─ localhost:31000  ──→ ec-admin-api:31000
  └─ localhost:5432   ──→ postgres:5432

shopjoy_network (Bridge Network)
  ├─ ec-admin-api (포트 31000)
  │   └─ postgres:5432 로 데이터베이스 연결
  └─ postgres (포트 5432)
     └─ shopjoy_db 데이터베이스
```

---

## 중요 사항 및 주의사항

### 🔒 보안 (개발 환경 전용)
1. **하드코딩된 암호**: 프로덕션 환경에서는 환경 변수나 시크릿 관리 사용
2. **JWT_SECRET**: 최소 32자 이상의 강력한 문자열로 변경
3. **KAKAO_CLIENT_SECRET**: 실제 값으로 교체
4. 민감한 정보는 `.env` 파일로 분리 권장

### 📁 파일 및 디렉토리
1. `uploads` 디렉토리가 없으면 자동 생성됨
2. 호스트에서 생성된 `uploads` 디렉토리를 수동으로 삭제하면 안 됨

### 🔄 데이터 영속성
1. PostgreSQL 데이터는 `postgres_data` 볼륨에 저장
2. `docker-compose down` 후에도 데이터 유지
3. 데이터 초기화하려면 `docker-compose down -v` 사용

### 🐛 문제 해결
```bash
# 포트 충돌 확인
netstat -ano | findstr :31000
netstat -ano | findstr :5432

# 컨테이너 강제 종료
docker-compose down --remove-orphans

# 이미지 재빌드
docker-compose build --no-cache
docker-compose up -d --build
```

---

## .env 파일 분리 예시

보안 향상을 위해 `.env` 파일을 별도로 생성할 수 있습니다:

### `.env` 파일 생성
```env
POSTGRES_USER=illeesam
POSTGRES_PASSWORD=postgresqlilleesam
POSTGRES_DB=shopjoy_db

JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters
KAKAO_CLIENT_ID=your_actual_kakao_client_id
KAKAO_CLIENT_SECRET=your_actual_kakao_client_secret
```

### `docker-compose.yml` 수정
```yaml
env_file:
  - .env

environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
  SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER}
  SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
  JWT_SECRET: ${JWT_SECRET}
  KAKAO_CLIENT_ID: ${KAKAO_CLIENT_ID}
  KAKAO_CLIENT_SECRET: ${KAKAO_CLIENT_SECRET}
  # ... 나머지 환경 변수
```

---

## 참고 링크
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [PostgreSQL Docker 이미지](https://hub.docker.com/_/postgres)
- [Spring Boot with Docker](https://spring.io/guides/gs/spring-boot-docker/)
