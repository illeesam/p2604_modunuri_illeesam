# Synology docker-compose 단독 실행 가이드

> GitHub Actions 없이 **Synology SSH에서 직접** docker-compose를 실행하는 방법

---

## 📋 전제 조건

| 항목 | 확인 |
|---|---|
| Synology SSH 활성화 | 제어판 → 터미널 및 SNMP → SSH 서비스 활성화 |
| Docker 패키지 설치 | 패키지 센터 → Docker 설치 |
| docker compose 지원 | Docker 24+ 포함 (Synology DSM 7.2 이상 권장) |

---

## 🗂️ Synology 디렉토리 구조

```
/volume1/docker/ec-admin-api/
├── docker-compose.yml       ← 컴포즈 파일
├── .env                     ← 환경변수 (Git 비포함, 직접 작성)
├── uploads/                 ← 파일 업로드 볼륨 (자동 생성)
└── logs/                    ← 로그 볼륨 (자동 생성)
```

---

## 🔧 최초 환경 구성 (1회만)

### 1. SSH 접속

```bash
ssh illeesam@illeesam.synology.me -p 22
```

### 2. 디렉토리 생성

```bash
sudo mkdir -p /volume1/docker/ec-admin-api/uploads
sudo mkdir -p /volume1/docker/ec-admin-api/logs
cd /volume1/docker/ec-admin-api
```

### 3. docker-compose.yml 업로드

**방법 A) 로컬 PC에서 SCP 전송**

```bash
# 로컬 PC (PowerShell / bash)
scp -P 22 docker-compose.yml illeesam@illeesam.synology.me:/volume1/docker/ec-admin-api/
```

**방법 B) Synology File Station**

```
File Station → /docker/ec-admin-api 폴더 → 업로드
```

**방법 C) SSH에서 직접 작성**

```bash
sudo vi /volume1/docker/ec-admin-api/docker-compose.yml
# 내용 붙여넣기 후 :wq 저장
```

### 4. .env 파일 생성

```bash
sudo vi /volume1/docker/ec-admin-api/.env
```

`.env` 내용 (실제 값으로 수정):

```dotenv
API_PORT=31000
DB_PORT=5432
REDIS_PORT=6379

DB_USER=illeesam
DB_PASSWORD=postgresqlilleesam
DB_NAME=shopjoy_db

SPRING_PROFILES_ACTIVE=prod
JPA_DDL_AUTO=validate
JPA_SHOW_SQL=false
FLYWAY_ENABLED=true

JWT_SECRET=여기에_32자_이상_랜덤_문자열_입력
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

KAKAO_CLIENT_ID=카카오_앱_키
KAKAO_CLIENT_SECRET=카카오_앱_시크릿
KAKAO_REDIRECT_URI=http://illeesam.synology.me:31000/auth/kakao/callback

MAX_FILE_SIZE=10MB
MAX_REQUEST_SIZE=50MB
```

---

## 🐳 docker-compose 단독 실행 시나리오

> `ec-admin-api` 이미지는 GitHub Actions 없이 실행할 경우  
> **로컬에서 직접 빌드**하거나 **미리 tar.gz로 전송**해야 합니다.  
> 아래 두 가지 방법 모두 설명합니다.

---

### 방법 1) 이미지를 로컬 PC에서 빌드 후 전송

**로컬 PC에서 실행:**

```bash
# 1. 이미지 빌드
cd C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps_be\EcAdminApi
docker build -t ec-admin-api:latest .

# 2. tar.gz 압축
docker save ec-admin-api:latest | gzip > ec-admin-api.tar.gz

# 3. Synology로 전송
scp -P 22 ec-admin-api.tar.gz illeesam@illeesam.synology.me:/volume1/docker/ec-admin-api/
```

**Synology SSH에서 실행:**

```bash
cd /volume1/docker/ec-admin-api

# 4. 이미지 로드
sudo docker load < ec-admin-api.tar.gz

# 5. 이미지 확인
sudo docker images | grep ec-admin-api

# 6. 임시파일 삭제
rm -f ec-admin-api.tar.gz
```

---

### 방법 2) Synology에서 직접 빌드 (Git clone 방식)

> Synology에 Git이 설치되어 있어야 함 (패키지 센터 → Git Server)

```bash
# 1. 소스 클론
cd /volume1/docker
sudo git clone https://github.com/illeesam/p2604_modunuri_illeesam.git pjt_source

# 2. EcAdminApi 경로로 이동
cd pjt_source/ec_v26/shopjoy_v260406/_apps_be/EcAdminApi

# 3. 이미지 빌드 (Synology에서 직접)
#    ※ 빌드 중 JDK + Gradle 다운로드로 시간 소요 (10~20분)
sudo docker build -t ec-admin-api:latest .

# 4. 이미지 확인
sudo docker images | grep ec-admin-api
```

---

## ▶️ 서비스 기동 명령어

```bash
cd /volume1/docker/ec-admin-api
```

### 전체 기동 (최초 or 전체 재시작)

```bash
sudo docker compose up -d
```

### 순서 보장 기동 (권장)

```bash
# Step 1: DB / Redis 먼저
sudo docker compose up -d postgres redis

# Step 2: 헬스체크 대기 (약 15초)
sleep 15

# Step 3: API 기동
sudo docker compose up -d ec-admin-api
```

### API만 재기동 (이미지 교체 후)

```bash
sudo docker compose up -d --no-deps --force-recreate ec-admin-api
```

### 특정 서비스만 재시작

```bash
sudo docker compose restart ec-admin-api
sudo docker compose restart postgres
sudo docker compose restart redis
```

---

## ⏹️ 서비스 중지 명령어

```bash
# 컨테이너 중지 (볼륨/이미지 유지)
sudo docker compose stop

# 컨테이너 삭제 (볼륨 유지, 이미지 유지)
sudo docker compose down

# 컨테이너 + 볼륨 삭제 ⚠️ DB 데이터 삭제됨
sudo docker compose down -v
```

---

## 🔍 상태 확인 명령어

### 서비스 전체 상태

```bash
sudo docker compose ps
```

출력 예시:

```
NAME             IMAGE                  STATUS          PORTS
ec_admin_api     ec-admin-api:latest    Up 2 minutes    0.0.0.0:31000->31000/tcp
shopjoy_db       postgres:15-alpine     Up 2 minutes    0.0.0.0:5432->5432/tcp
shopjoy_redis    redis:7-alpine         Up 2 minutes    0.0.0.0:6379->6379/tcp
```

### 로그 확인

```bash
# ec-admin-api 로그 실시간
sudo docker compose logs -f ec-admin-api

# 최근 100줄
sudo docker compose logs --tail 100 ec-admin-api

# 전체 서비스 로그
sudo docker compose logs -f
```

### 헬스체크

```bash
# Synology 내부에서
curl http://localhost:31000/actuator/health

# 외부에서
curl http://illeesam.synology.me:31000/actuator/health
```

---

## 🗄️ DB / Redis 접속

```bash
# PostgreSQL 접속
sudo docker exec -it shopjoy_db psql -U illeesam -d shopjoy_db

# PostgreSQL 주요 명령어
\dt          -- 테이블 목록
\d 테이블명  -- 테이블 구조
\q           -- 종료

# Redis 접속
sudo docker exec -it shopjoy_redis redis-cli

# Redis 주요 명령어
keys *       -- 전체 키 조회
flushall     -- 전체 캐시 삭제 ⚠️
quit         -- 종료
```

---

## 🔄 이미지 업데이트 절차 (단독 실행 시)

```bash
# 1. 로컬 PC에서 새 이미지 빌드 후 tar.gz 전송 (방법 1 참고)

# 2. Synology에서 이미지 로드
cd /volume1/docker/ec-admin-api
sudo docker load < ec-admin-api.tar.gz

# 3. API 컨테이너만 재생성 (DB/Redis 무중단)
sudo docker compose up -d --no-deps --force-recreate ec-admin-api

# 4. 상태 확인
sudo docker compose ps
sudo docker compose logs --tail 30 ec-admin-api

# 5. 임시파일 정리
rm -f ec-admin-api.tar.gz

# 6. 이전 이미지 정리 (dangling 이미지)
sudo docker image prune -f
```

---

## ⚠️ 트러블슈팅

### docker compose 명령어가 없는 경우

```bash
# DSM 7.1 이하 구버전 docker-compose 플러그인 방식
sudo docker-compose up -d

# 버전 확인
sudo docker compose version
sudo docker-compose version
```

### 포트 충돌 시

```bash
# 사용 중인 포트 확인
sudo netstat -tnlp | grep -E '31000|5432|6379'

# .env에서 포트 변경 후 재기동
sudo docker compose down
sudo docker compose up -d
```

### 이미지 없이 docker compose up 실행 시

```
Error: No such image: ec-admin-api:latest
```

→ `ec-admin-api` 이미지는 docker-compose에서 자동 빌드하지 않음.  
→ 반드시 위 **방법 1 또는 방법 2**로 이미지를 먼저 로드할 것.

### 컨테이너가 계속 재시작되는 경우

```bash
sudo docker compose logs ec-admin-api --tail 50
# → 오류 메시지 확인 후 .env 값 점검
```

---

## 📌 요약 치트시트

```bash
cd /volume1/docker/ec-admin-api

sudo docker compose up -d                                        # 전체 기동
sudo docker compose up -d --no-deps --force-recreate ec-admin-api  # API만 재배포
sudo docker compose ps                                           # 상태 확인
sudo docker compose logs -f ec-admin-api                        # 로그 실시간
sudo docker compose restart ec-admin-api                        # API 재시작
sudo docker compose stop                                         # 전체 중지
sudo docker compose down                                         # 전체 삭제 (볼륨 유지)
curl http://localhost:31000/actuator/health                      # 헬스체크
```
