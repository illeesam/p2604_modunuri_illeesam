# docker-compose 테스트 가이드 (명령어 응답 포함)

> **로컬 Windows PC** 또는 **Synology NAS** 에서  
> GitHub Actions 없이 docker-compose를 직접 실행하는 방법  
> ✅ 정상 응답 / ❌ 오류 응답 / 🔧 해결방법 포함

---

## 📁 전제: 프로젝트 구조

```
C:\_pjt_github\p2604_modunuri_illeesam\
├── .github\workflows\deploy-ec-admin.yml
├── ec_v26\shopjoy_v260406\_apps_be\EcAdminApi\
│   ├── Dockerfile
│   ├── gradlew
│   ├── build.gradle
│   └── src\...
└── _github_workflow_synol_dockercompose\
    ├── docker-compose.yml
    ├── .env.example
    └── .env                ← .env.example 복사 후 작성 (Git 비포함)
```

---
---

# 1. 윈도우 로컬 PC 테스트

---

## 1-1. 사전 준비

### Docker 버전 확인

```powershell
docker --version
docker compose version
```

✅ 정상:
```
Docker version 26.1.1, build 4cf5afa
Docker Compose version v2.27.0
```

❌ 오류: 명령어를 찾을 수 없음
```
'docker'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는
배치 파일이 아닙니다.
```
🔧 해결: https://www.docker.com/products/docker-desktop 에서 Docker Desktop 설치 후 재시작

❌ 오류: docker compose 미지원
```
docker: 'compose' is not a docker command.
```
🔧 해결: Docker Desktop을 최신 버전으로 업데이트 (v20.10 이상 필요)

---

### Docker Desktop 실행 상태 확인

```powershell
docker info
```

✅ 정상:
```
Client: Docker Engine - Community
 Version:    26.1.1
...
Server: Docker Desktop
 Engine:
  Version:          26.1.1
  OS/Arch:          linux/amd64
...
```

❌ 오류: Docker Desktop 미실행
```
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.47/info":
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```
🔧 해결: Docker Desktop 앱 실행 후 트레이 아이콘이 초록불 될 때까지 대기 (30초~1분)

---

## 1-2. .env 파일 작성

```powershell
cd C:\_pjt_github\p2604_modunuri_illeesam\_github_workflow_synol_dockercompose
copy .env.example .env
code .env
```

✅ 정상:
```
        1개 파일이 복사되었습니다.
```

❌ 오류: .env.example 없음
```
지정된 파일을 찾을 수 없습니다.
```
🔧 해결: 경로 확인 후 .env.example 파일이 존재하는지 확인
```powershell
ls C:\_pjt_github\p2604_modunuri_illeesam\_github_workflow_synol_dockercompose\
```

**로컬 테스트용 .env 권장 설정:**

```dotenv
API_PORT=31000
DB_PORT=5432
REDIS_PORT=6379
DB_USER=illeesam
DB_PASSWORD=postgresqlilleesam
DB_NAME=shopjoy_db
SPRING_PROFILES_ACTIVE=dev
JPA_DDL_AUTO=update
JPA_SHOW_SQL=true
FLYWAY_ENABLED=false
JWT_SECRET=local_test_jwt_secret_key_minimum_32_chars
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
KAKAO_CLIENT_ID=test_kakao_client_id
KAKAO_CLIENT_SECRET=test_kakao_client_secret
KAKAO_REDIRECT_URI=http://localhost:31000/auth/kakao/callback
MAX_FILE_SIZE=10MB
MAX_REQUEST_SIZE=50MB
```

---

## 1-3. ec-admin-api 이미지 빌드

```powershell
cd C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps_be\EcAdminApi
docker build -t ec-admin-api:latest .
```

✅ 정상 (빌드 진행 중):
```
[+] Building 245.3s (12/12) FINISHED                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                           0.0s
 => [internal] load metadata for docker.io/library/eclipse-temurin:17-jdk     1.2s
 => [build 1/4] FROM eclipse-temurin:17-jdk@sha256:...                        0.0s
 => [build 2/4] WORKDIR /app                                                   0.0s
 => [build 3/4] COPY . .                                                       0.3s
 => [build 4/4] RUN ./gradlew bootJar -x test                               230.1s
 => [stage-1 1/3] FROM eclipse-temurin:17-jdk                                  0.0s
 => [stage-1 2/3] WORKDIR /app                                                 0.0s
 => [stage-1 3/3] COPY --from=build /app/build/libs/*.jar app.jar             1.2s
 => exporting to image                                                         3.1s
 => => naming to docker.io/library/ec-admin-api:latest                        0.0s
```

✅ 정상 (빌드 완료 확인):
```powershell
docker images | findstr ec-admin-api
```
```
ec-admin-api   latest   a1b2c3d4e5f6   2 minutes ago   350MB
```

❌ 오류: Dockerfile 없음
```
ERROR: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory
```
🔧 해결: 경로 확인 — Dockerfile이 EcAdminApi 루트에 있는지 확인
```powershell
ls C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps_be\EcAdminApi\Dockerfile
```

❌ 오류: gradlew 실행 권한 없음 (Windows에서는 드물지만 WSL 환경 시 발생)
```
RUN ./gradlew bootJar -x test
------
permission denied: ./gradlew
```
🔧 해결: Dockerfile에 chmod 추가
```dockerfile
RUN chmod +x gradlew && ./gradlew bootJar -x test
```

❌ 오류: Java 버전 불일치
```
> Task :compileJava FAILED
error: invalid source release: 17
```
🔧 해결: Dockerfile의 JDK 버전을 build.gradle의 sourceCompatibility와 맞춤
```dockerfile
FROM eclipse-temurin:17-jdk AS build   # 17로 통일
```

❌ 오류: 네트워크 타임아웃 (의존성 다운로드 실패)
```
> Could not resolve com.example:library:1.0.0
  > Network error
```
🔧 해결: Docker Desktop 네트워크 설정 확인, VPN 해제 후 재시도

---

## 1-4. docker-compose 실행

```powershell
cd C:\_pjt_github\p2604_modunuri_illeesam\_github_workflow_synol_dockercompose
docker compose up -d
```

✅ 정상:
```
[+] Running 5/5
 ✔ Network shopjoy_network   Created                                           0.1s
 ✔ Volume "postgres_data"    Created                                           0.0s
 ✔ Volume "redis_data"       Created                                           0.0s
 ✔ Container shopjoy_db      Started                                           0.8s
 ✔ Container shopjoy_redis   Started                                           0.6s
 ✔ Container ec_admin_api    Started                                           1.2s
```

❌ 오류: .env 파일 없음
```
WARN[0000] The "DB_USER" variable is not set. Defaulting to a blank string.
WARN[0000] The "DB_PASSWORD" variable is not set. Defaulting to a blank string.
```
🔧 해결: .env 파일 생성 확인
```powershell
ls .env
```

❌ 오류: ec-admin-api 이미지 없음
```
[+] Running 2/3
 ✔ Container shopjoy_db     Started
 ✔ Container shopjoy_redis  Started
 ✗ Container ec_admin_api   Error
Error response from daemon: No such image: ec-admin-api:latest
```
🔧 해결: 이미지 먼저 빌드
```powershell
cd ..\ec_v26\shopjoy_v260406\_apps_be\EcAdminApi
docker build -t ec-admin-api:latest .
```

❌ 오류: 포트 충돌
```
Error response from daemon: driver failed programming external connectivity on endpoint shopjoy_db:
Bind for 0.0.0.0:5432 failed: port is already allocated
```
🔧 해결: 충돌 포트 확인 후 .env에서 변경
```powershell
netstat -ano | findstr :5432
# .env 에서 DB_PORT=5433 으로 변경 후 재실행
```

❌ 오류: docker-compose.yml 없음
```
no configuration file provided: not found
```
🔧 해결: 경로 확인
```powershell
ls docker-compose.yml
# 없으면 _github_workflow_synol_dockercompose 폴더로 이동했는지 확인
```

---

### 순서 보장 기동 (권장)

```powershell
docker compose up -d postgres redis
```

✅ 정상:
```
[+] Running 4/4
 ✔ Network shopjoy_network  Created                                            0.1s
 ✔ Volume "postgres_data"   Created                                            0.0s
 ✔ Volume "redis_data"      Created                                            0.0s
 ✔ Container shopjoy_db     Started                                            0.8s
 ✔ Container shopjoy_redis  Started                                            0.6s
```

```powershell
Start-Sleep -Seconds 15
docker compose up -d ec-admin-api
```

✅ 정상:
```
[+] Running 1/1
 ✔ Container ec_admin_api   Started                                            1.4s
```

---

## 1-5. 기동 확인

### 컨테이너 상태

```powershell
docker compose ps
```

✅ 정상 (전체 healthy):
```
NAME             IMAGE                  COMMAND                  SERVICE        CREATED         STATUS                   PORTS
ec_admin_api     ec-admin-api:latest    "java -jar app.jar"      ec-admin-api   2 minutes ago   Up 2 minutes (healthy)   0.0.0.0:31000->31000/tcp
shopjoy_db       postgres:15-alpine     "docker-entrypoint.s…"   postgres       3 minutes ago   Up 3 minutes (healthy)   0.0.0.0:5432->5432/tcp
shopjoy_redis    redis:7-alpine         "docker-entrypoint.s…"   redis          3 minutes ago   Up 3 minutes (healthy)   0.0.0.0:6379->6379/tcp
```

❌ 오류: 컨테이너 재시작 반복
```
NAME             IMAGE                  STATUS
ec_admin_api     ec-admin-api:latest    Restarting (1) 30 seconds ago
```
🔧 해결: 로그 확인으로 원인 파악
```powershell
docker compose logs --tail 50 ec-admin-api
# DB 연결 오류, 환경변수 누락 등 확인
```

❌ 오류: 컨테이너 즉시 종료
```
NAME             IMAGE                  STATUS
ec_admin_api     ec-admin-api:latest    Exited (1) 5 seconds ago
```
🔧 해결:
```powershell
docker compose logs ec-admin-api
# 종료 직전 오류 메시지 확인
```

---

### 헬스체크

```powershell
curl http://localhost:31000/actuator/health
```

✅ 정상:
```json
{"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"},"diskSpace":{"status":"UP","details":{"total":499963174912,"free":354687574016,"threshold":10485760,"exists":true}},"ping":{"status":"UP"}}}
```

❌ 오류: 연결 거부 (컨테이너 미기동)
```
curl : 원격 서버에 연결할 수 없습니다.
```
🔧 해결:
```powershell
docker compose ps        # 컨테이너 상태 확인
docker compose logs ec-admin-api  # 기동 로그 확인
```

❌ 오류: DB DOWN
```json
{"status":"DOWN","components":{"db":{"status":"DOWN","details":{"error":"org.springframework.jdbc.CannotGetJdbcConnectionException: Failed to obtain JDBC Connection"}}}}
```
🔧 해결:
```powershell
docker compose ps postgres          # postgres 상태 확인
docker compose logs postgres        # postgres 로그 확인
docker compose restart postgres     # postgres 재시작
```

❌ 오류: Redis DOWN
```json
{"status":"DOWN","components":{"redis":{"status":"DOWN","details":{"error":"org.springframework.data.redis.RedisConnectionFailureException"}}}}
```
🔧 해결:
```powershell
docker compose restart redis
```

---

### 로그 확인

```powershell
docker compose logs -f ec-admin-api
```

✅ 정상 (Spring Boot 기동 완료):
```
ec_admin_api  |   .   ____          _            __ _ _
ec_admin_api  |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
ec_admin_api  | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
ec_admin_api  |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
ec_admin_api  |   '  |____| .__|_| |_|_| |_\__, | / / / /
ec_admin_api  |  =========|_|==============|___/=/_/_/_/
ec_admin_api  |  :: Spring Boot ::                (v3.x.x)
ec_admin_api  |
ec_admin_api  | INFO  --- [main] c.s.EcAdminApiApplication : Starting EcAdminApiApplication
ec_admin_api  | INFO  --- [main] o.s.b.w.e.tomcat.TomcatWebServer  : Tomcat started on port 31000
ec_admin_api  | INFO  --- [main] c.s.EcAdminApiApplication : Started EcAdminApiApplication in 12.345 seconds
```

❌ 오류 로그: DB 연결 실패
```
ec_admin_api  | WARN  --- [main] o.h.e.j.e.i.JdbcEnvironmentInitiator : HHH90000012: Encountered a SqlException
ec_admin_api  | ERROR --- [main] o.s.b.SpringApplication : Application run failed
ec_admin_api  | Caused by: org.postgresql.util.PSQLException: Connection refused.
ec_admin_api  |   Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.
```
🔧 해결: postgres 컨테이너 상태 및 .env DB 접속정보 확인

❌ 오류 로그: JWT Secret 누락
```
ec_admin_api  | ERROR --- [main] o.s.b.SpringApplication : Application run failed
ec_admin_api  | Caused by: java.lang.IllegalArgumentException: JWT secret key must be at least 32 characters
```
🔧 해결: .env 의 JWT_SECRET 값 32자 이상으로 설정

❌ 오류 로그: Flyway 마이그레이션 실패
```
ec_admin_api  | ERROR --- [main] o.s.b.SpringApplication : Application run failed
ec_admin_api  | Caused by: org.flywaydb.core.api.exception.FlywayValidateException:
ec_admin_api  |   Validate failed: Migrations have failed validation
```
🔧 해결: 로컬 개발 시 FLYWAY_ENABLED=false 설정 또는 migration 파일 확인

---

## 1-6. DB / Redis 직접 접속 확인

### PostgreSQL 접속

```powershell
docker exec -it shopjoy_db psql -U illeesam -d shopjoy_db
```

✅ 정상:
```
psql (15.6)
Type "help" for help.

shopjoy_db=#
```

```sql
shopjoy_db=# \dt
```

✅ 테이블 있음:
```
                  List of relations
 Schema |         Name          | Type  |  Owner
--------+-----------------------+-------+----------
 public | flyway_schema_history | table | illeesam
 public | member                | table | illeesam
 public | product               | table | illeesam
(3 rows)
```

✅ 테이블 없음 (JPA_DDL_AUTO=update 이고 아직 API 미호출):
```
Did not find any relations.
```

❌ 오류: 컨테이너 미실행
```
Error response from daemon: No such container: shopjoy_db
```
🔧 해결:
```powershell
docker compose up -d postgres
```

❌ 오류: 인증 실패
```
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed:
FATAL:  password authentication failed for user "illeesam"
```
🔧 해결: .env 의 DB_USER / DB_PASSWORD 값과 psql 명령어의 -U 옵션 일치 확인

---

### Redis 접속

```powershell
docker exec -it shopjoy_redis redis-cli
```

✅ 정상:
```
127.0.0.1:6379>
```

```
127.0.0.1:6379> ping
```
✅ 정상:
```
PONG
```

```
127.0.0.1:6379> keys *
```
✅ 키 없음 (초기 상태):
```
(empty array)
```
✅ 키 있음 (세션/캐시 데이터):
```
1) "spring:session:sessions:abc123"
2) "product:cache:1001"
```

❌ 오류: 컨테이너 미실행
```
Error response from daemon: No such container: shopjoy_redis
```
🔧 해결:
```powershell
docker compose up -d redis
```

---

## 1-7. 코드 수정 후 재빌드 반영

```powershell
cd C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps_be\EcAdminApi
docker build -t ec-admin-api:latest .
```

✅ 정상 (캐시 활용으로 빠름):
```
[+] Building 45.2s (12/12) FINISHED
 => CACHED [build 1/4] FROM eclipse-temurin:17-jdk                            0.0s
 => CACHED [build 2/4] WORKDIR /app                                            0.0s
 => [build 3/4] COPY . .                                                       0.4s  ← 소스 변경으로 캐시 무효
 => [build 4/4] RUN ./gradlew bootJar -x test                                40.1s
 => [stage-1 3/3] COPY --from=build /app/build/libs/*.jar app.jar             1.1s
 => exporting to image                                                         2.8s
```

```powershell
cd C:\_pjt_github\p2604_modunuri_illeesam\_github_workflow_synol_dockercompose
docker compose up -d --no-deps --force-recreate ec-admin-api
```

✅ 정상:
```
[+] Running 1/1
 ✔ Container ec_admin_api   Started                                            1.6s
```

❌ 오류: 기존 컨테이너 충돌
```
Error response from daemon: Conflict. The container name "/ec_admin_api" is already in use
```
🔧 해결: `--force-recreate` 옵션이 있으면 발생하지 않음. 수동 제거 후 재시도:
```powershell
docker rm -f ec_admin_api
docker compose up -d ec-admin-api
```

---

## 1-8. 로컬 테스트 중지 및 정리

```powershell
docker compose stop
```

✅ 정상:
```
[+] Stopping 3/3
 ✔ Container ec_admin_api   Stopped                                            3.2s
 ✔ Container shopjoy_redis  Stopped                                            0.4s
 ✔ Container shopjoy_db     Stopped                                            0.5s
```

```powershell
docker compose down
```

✅ 정상 (볼륨 유지):
```
[+] Running 4/4
 ✔ Container ec_admin_api   Removed                                            0.1s
 ✔ Container shopjoy_redis  Removed                                            0.1s
 ✔ Container shopjoy_db     Removed                                            0.1s
 ✔ Network shopjoy_network  Removed                                            0.2s
```

```powershell
docker compose down -v
```

✅ 정상 (볼륨까지 삭제):
```
[+] Running 6/6
 ✔ Container ec_admin_api   Removed                                            0.1s
 ✔ Container shopjoy_redis  Removed                                            0.1s
 ✔ Container shopjoy_db     Removed                                            0.1s
 ✔ Volume postgres_data     Removed                                            0.0s
 ✔ Volume redis_data        Removed                                            0.0s
 ✔ Network shopjoy_network  Removed                                            0.2s
```

---

## 1-9. 로컬 트러블슈팅 추가

### 포트 사용 중 확인

```powershell
netstat -ano | findstr :31000
```

✅ 포트 미사용:
```
(출력 없음)
```

❌ 포트 사용 중:
```
  TCP    0.0.0.0:31000          0.0.0.0:0              LISTENING       12345
```
🔧 해결:
```powershell
# PID 12345 프로세스 확인
tasklist | findstr 12345
# 종료 또는 .env 포트 변경
```

### Windows 볼륨 마운트 오류

❌ 오류:
```
Error: invalid mount config for type "bind": invalid mount path: 'C:\_pjt...\uploads'
```
🔧 해결: docker-compose.yml 볼륨 경로를 상대경로로 변경
```yaml
volumes:
  - ./uploads:/app/uploads    # 상대경로 사용 (권장)
```

---
---

# 2. Synology NAS 단독 테스트

---

## 2-1. SSH 접속

```powershell
# 로컬 PC (PowerShell)
ssh illeesam@illeesam.synology.me -p 22
```

✅ 정상:
```
illeesam@illeesam.synology.me's password:
[입력 후]

illeesam@NAS:~$
```

✅ SSH 키 사용 시:
```
Welcome to DSM
illeesam@NAS:~$
```

❌ 오류: 연결 타임아웃
```
ssh: connect to host illeesam.synology.me port 22: Connection timed out
```
🔧 해결: 공유기 포트포워딩(22번), Synology 방화벽 확인, DDNS 갱신 여부 확인

❌ 오류: 인증 실패
```
Permission denied (publickey,password).
```
🔧 해결: 비밀번호 재확인, SSH 키 사용 시 authorized_keys 등록 여부 확인

❌ 오류: 포트 변경 후 미반영
```
ssh: connect to host illeesam.synology.me port 22: Connection refused
```
🔧 해결: DSM에서 SSH 포트 변경 시 -p 옵션에 변경된 포트 지정
```powershell
ssh illeesam@illeesam.synology.me -p 2222
```

---

### docker compose 버전 확인

```bash
sudo docker compose version
```

✅ 정상 (DSM 7.2 이상):
```
Docker Compose version v2.15.1
```

❌ 오류: 플러그인 없음 (DSM 7.1 이하)
```
docker: 'compose' is not a docker command.
```
🔧 해결: 하이픈 방식 사용
```bash
sudo docker-compose version
# Docker Compose version 1.29.x
```

---

## 2-2. 배포 디렉토리 준비

```bash
sudo mkdir -p /volume1/docker/ec-admin-api/uploads
sudo mkdir -p /volume1/docker/ec-admin-api/logs
sudo chown -R illeesam:users /volume1/docker/ec-admin-api
```

✅ 정상: (출력 없음 = 성공)

```bash
ls -la /volume1/docker/ec-admin-api/
```

✅ 정상:
```
total 8
drwxr-xr-x 1 illeesam users  30 May 11 10:00 .
drwxr-xr-x 1 root     root   42 May 11 09:50 ..
drwxr-xr-x 1 illeesam users   0 May 11 10:00 logs
drwxr-xr-x 1 illeesam users   0 May 11 10:00 uploads
```

❌ 오류: volume1 경로 없음
```
mkdir: cannot create directory '/volume1/docker': Permission denied
```
🔧 해결: sudo 필수
```bash
sudo mkdir -p /volume1/docker/ec-admin-api/uploads
```

---

## 2-3. docker-compose.yml SCP 전송

```powershell
# 로컬 PC PowerShell
scp -P 22 `
  C:\_pjt_github\p2604_modunuri_illeesam\_github_workflow_synol_dockercompose\docker-compose.yml `
  illeesam@illeesam.synology.me:/volume1/docker/ec-admin-api/
```

✅ 정상:
```
docker-compose.yml                              100% 2048     1.2MB/s   00:00
```

❌ 오류: 경로 없음
```
scp: /volume1/docker/ec-admin-api/: No such file or directory
```
🔧 해결: Synology에서 디렉토리 먼저 생성 (2-2 참고)

❌ 오류: 인증 실패
```
Permission denied (publickey,password).
```
🔧 해결: 포트(-P), 사용자명, 비밀번호 재확인

---

## 2-4. .env 파일 작성 및 권한 설정

```bash
cd /volume1/docker/ec-admin-api
vi .env
```

✅ vi 에디터 진입:
```
(빈 화면, 편집 모드)
# i 키로 입력 모드 진입 → 내용 붙여넣기 → ESC → :wq 저장
```

```bash
chmod 600 /volume1/docker/ec-admin-api/.env
ls -la .env
```

✅ 정상:
```
-rw------- 1 illeesam users 512 May 11 10:05 .env
```
> `rw-------` = 소유자만 읽기/쓰기, 그룹/기타 접근 불가

---

## 2-5. ec-admin-api 이미지 로드

### 로컬 PC에서 빌드 후 SCP 전송

```powershell
# 로컬 PC
docker build -t ec-admin-api:latest .
docker save ec-admin-api:latest | gzip > ec-admin-api.tar.gz
scp -P 22 ec-admin-api.tar.gz illeesam@illeesam.synology.me:/volume1/docker/ec-admin-api/
```

✅ SCP 전송 정상:
```
ec-admin-api.tar.gz                             100%  320MB   8.5MB/s   00:37
```

```bash
# Synology
cd /volume1/docker/ec-admin-api
sudo docker load < ec-admin-api.tar.gz
```

✅ 정상:
```
3b8d8f47cffc: Loading layer  77.82MB/77.82MB
8f7e6e0a0e8f: Loading layer  145.7MB/145.7MB
Loaded image: ec-admin-api:latest
```

```bash
sudo docker images | grep ec-admin-api
```

✅ 정상:
```
ec-admin-api   latest   a1b2c3d4e5f6   About a minute ago   350MB
```

❌ 오류: tar.gz 파일 손상
```
invalid tar header
```
🔧 해결: 전송된 파일 크기 확인 후 재전송
```bash
ls -lh ec-admin-api.tar.gz
# 0B 또는 비정상 크기면 재전송
```

❌ 오류: 디스크 공간 부족
```
no space left on device
```
🔧 해결:
```bash
df -h /volume1          # 디스크 사용량 확인
sudo docker image prune -f   # 미사용 이미지 정리
```

---

## 2-6. docker-compose 실행

### 순서 보장 기동 (권장)

```bash
cd /volume1/docker/ec-admin-api
sudo docker compose up -d postgres redis
```

✅ 정상:
```
[+] Running 4/4
 ✔ Network shopjoy_network  Created                                            0.2s
 ✔ Volume "postgres_data"   Created                                            0.0s
 ✔ Volume "redis_data"      Created                                            0.0s
 ✔ Container shopjoy_db     Started                                            1.1s
 ✔ Container shopjoy_redis  Started                                            0.9s
```

```bash
sleep 20
sudo docker compose ps postgres
```

✅ 정상 (healthy 확인):
```
NAME          IMAGE                COMMAND                  SERVICE    CREATED          STATUS                    PORTS
shopjoy_db    postgres:15-alpine   "docker-entrypoint.s…"   postgres   35 seconds ago   Up 34 seconds (healthy)   0.0.0.0:5432->5432/tcp
```

❌ 아직 헬스체크 중:
```
NAME          IMAGE                STATUS
shopjoy_db    postgres:15-alpine   Up 10 seconds (health: starting)
```
🔧 조치: 추가 대기 후 재확인 (healthy 될 때까지 최대 60초)

```bash
sudo docker compose up -d ec-admin-api
```

✅ 정상:
```
[+] Running 1/1
 ✔ Container ec_admin_api   Started                                            1.8s
```

❌ 오류: depends_on 헬스체크 미통과
```
dependency failed to start: container shopjoy_db is unhealthy
```
🔧 해결: postgres 로그 확인
```bash
sudo docker compose logs postgres
```

---

## 2-7. 기동 확인

### 전체 컨테이너 상태

```bash
sudo docker compose ps
```

✅ 전체 정상:
```
NAME             IMAGE                  COMMAND                  SERVICE        CREATED         STATUS                    PORTS
ec_admin_api     ec-admin-api:latest    "java -jar app.jar"      ec-admin-api   2 minutes ago   Up 2 minutes (healthy)    0.0.0.0:31000->31000/tcp
shopjoy_db       postgres:15-alpine     "docker-entrypoint.s…"   postgres       3 minutes ago   Up 3 minutes (healthy)    0.0.0.0:5432->5432/tcp
shopjoy_redis    redis:7-alpine         "docker-entrypoint.s…"   redis          3 minutes ago   Up 3 minutes (healthy)    0.0.0.0:6379->6379/tcp
```

❌ 오류: ec_admin_api 재시작 반복
```
NAME             IMAGE                  STATUS
ec_admin_api     ec-admin-api:latest    Restarting (1) 20 seconds ago
```
🔧 해결:
```bash
sudo docker compose logs --tail 50 ec-admin-api
```

---

### 헬스체크

```bash
curl http://localhost:31000/actuator/health
```

✅ 정상:
```json
{"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"},"ping":{"status":"UP"}}}
```

❌ 오류: curl 연결 거부 (API 미기동)
```
curl: (7) Failed to connect to localhost port 31000: Connection refused
```
🔧 해결:
```bash
sudo docker compose ps ec-admin-api    # 상태 확인
sudo docker compose logs ec-admin-api  # 로그 확인
```

❌ 오류: curl 타임아웃 (기동 중)
```
curl: (28) Failed to connect to localhost port 31000 after 10000ms: Timed out
```
🔧 해결: Spring Boot 기동 완료까지 대기 (최대 60~90초), 로그 확인

```bash
# 외부 접속 확인
curl http://illeesam.synology.me:31000/actuator/health
```

✅ 정상: (내부와 동일한 JSON 응답)

❌ 오류: 외부 접속 불가 (내부는 정상)
```
curl: (7) Failed to connect to illeesam.synology.me port 31000: Connection refused
```
🔧 해결: 공유기 포트포워딩 31000번 설정 확인, Synology 방화벽 31000번 허용 확인

---

### 로그 확인

```bash
sudo docker compose logs -f ec-admin-api
```

✅ 정상 (기동 완료):
```
ec_admin_api  | INFO  --- [main] o.s.b.w.e.tomcat.TomcatWebServer  : Tomcat started on port 31000
ec_admin_api  | INFO  --- [main] c.s.EcAdminApiApplication         : Started EcAdminApiApplication in 15.432 seconds
```

❌ 오류 로그: DB 연결 실패
```
ec_admin_api  | Caused by: org.postgresql.util.PSQLException:
ec_admin_api  |   Connection refused. Check that the hostname and port are correct
ec_admin_api  |   and that the postmaster is accepting TCP/IP connections.
```
🔧 해결: .env 의 DB 접속정보 확인, postgres 컨테이너 상태 확인

❌ 오류 로그: Flyway 버전 충돌
```
ec_admin_api  | FlywayValidateException: Detected failed migration to version 2
ec_admin_api  |   -> Resolve this failed migration.
```
🔧 해결:
```bash
sudo docker exec -it shopjoy_db psql -U illeesam -d shopjoy_db \
  -c "DELETE FROM flyway_schema_history WHERE success = false;"
sudo docker compose restart ec-admin-api
```

---

## 2-8. DB / Redis 접속 확인

### PostgreSQL

```bash
sudo docker exec -it shopjoy_db psql -U illeesam -d shopjoy_db
```

✅ 정상:
```
psql (15.6)
Type "help" for help.

shopjoy_db=#
```

```sql
shopjoy_db=# \dt
```

✅ 정상:
```
                  List of relations
 Schema |         Name          | Type  |  Owner
--------+-----------------------+-------+----------
 public | flyway_schema_history | table | illeesam
 public | member                | table | illeesam
(2 rows)
```

❌ 오류: 컨테이너 없음
```
Error response from daemon: No such container: shopjoy_db
```
🔧 해결:
```bash
sudo docker compose up -d postgres
```

---

### Redis

```bash
sudo docker exec -it shopjoy_redis redis-cli
127.0.0.1:6379> ping
```

✅ 정상:
```
PONG
```

```
127.0.0.1:6379> info server
```

✅ 정상 (일부):
```
# Server
redis_version:7.2.4
redis_mode:standalone
os:Linux 4.4.302+ x86_64
uptime_in_seconds:3600
```

❌ 오류: NOAUTH 인증 필요
```
(error) NOAUTH Authentication required.
```
🔧 해결: Redis에 requirepass 설정된 경우
```bash
127.0.0.1:6379> auth {비밀번호}
# OK
```

---

## 2-9. 이미지 업데이트 (재배포)

```bash
sudo docker load < ec-admin-api.tar.gz
```

✅ 정상:
```
Loaded image: ec-admin-api:latest
```

```bash
sudo docker compose up -d --no-deps --force-recreate ec-admin-api
```

✅ 정상:
```
[+] Running 1/1
 ✔ Container ec_admin_api   Started                                            2.1s
```

```bash
sudo docker image prune -f
```

✅ 정상 (이전 이미지 정리):
```
Deleted Images:
deleted: sha256:b3c4d5e6f7a8...

Total reclaimed space: 312MB
```

✅ 정리할 이미지 없음:
```
Total reclaimed space: 0B
```

---

## 2-10. 서비스 중지

```bash
sudo docker compose stop
```

✅ 정상:
```
[+] Stopping 3/3
 ✔ Container ec_admin_api   Stopped                                            5.3s
 ✔ Container shopjoy_redis  Stopped                                            0.5s
 ✔ Container shopjoy_db     Stopped                                            0.8s
```

```bash
sudo docker compose down
```

✅ 정상 (볼륨 유지):
```
[+] Running 4/4
 ✔ Container ec_admin_api   Removed                                            0.1s
 ✔ Container shopjoy_redis  Removed                                            0.1s
 ✔ Container shopjoy_db     Removed                                            0.1s
 ✔ Network shopjoy_network  Removed                                            0.3s
```

```bash
sudo docker compose down -v
```

✅ 정상 (볼륨까지 삭제):
```
[+] Running 6/6
 ✔ Container ec_admin_api   Removed                                            0.1s
 ✔ Container shopjoy_redis  Removed                                            0.1s
 ✔ Container shopjoy_db     Removed                                            0.1s
 ✔ Volume postgres_data     Removed                                            0.0s
 ✔ Volume redis_data        Removed                                            0.0s
 ✔ Network shopjoy_network  Removed                                            0.3s
```

> ⚠️ `down -v` 는 PostgreSQL 데이터가 모두 삭제됩니다. 운영 환경에서 주의!

---

## 2-11. Synology 추가 트러블슈팅

### 디스크 공간 확인

```bash
df -h /volume1
```

✅ 정상:
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda5       3.6T  1.2T  2.4T  34% /volume1
```

❌ 공간 부족:
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda5       3.6T  3.5T   50G  99% /volume1
```
🔧 해결:
```bash
sudo docker system prune -f        # 미사용 컨테이너/이미지/네트워크 정리
sudo docker image prune -af        # 전체 미사용 이미지 정리
sudo docker volume prune -f        # 미사용 볼륨 정리
```

### 네트워크 포트 사용 확인

```bash
sudo netstat -tnlp | grep -E '31000|5432|6379'
```

✅ 정상 (컨테이너가 포트 점유):
```
tcp6   0   0 :::31000   :::*   LISTEN   1234/docker-proxy
tcp6   0   0 :::5432    :::*   LISTEN   5678/docker-proxy
tcp6   0   0 :::6379    :::*   LISTEN   9012/docker-proxy
```

✅ 포트 미사용 (컨테이너 미기동):
```
(출력 없음)
```

❌ docker-proxy 외 다른 프로세스가 포트 점유:
```
tcp   0   0 0.0.0.0:5432   0.0.0.0:*   LISTEN   3456/postgres
```
🔧 해결: Synology 패키지에서 PostgreSQL 직접 설치 중인 경우 충돌. .env 포트 변경

---

## 📊 로컬 PC vs Synology 비교

| 항목 | 로컬 PC (Windows) | Synology |
|---|---|---|
| 목적 | 개발 중 통합 테스트 | 실제 서버 운영 |
| 이미지 빌드 | 로컬 직접 빌드 | 로컬 빌드 후 SCP 전송 |
| `.env` 프로파일 | `dev` | `prod` |
| `JPA_DDL_AUTO` | `update` | `validate` |
| `JPA_SHOW_SQL` | `true` | `false` |
| `FLYWAY_ENABLED` | `false` (선택) | `true` |
| 헬스체크 URL | `http://localhost:31000` | `http://illeesam.synology.me:31000` |
| sudo 필요 | 불필요 | 필요 |
| 명령어 prefix | `docker compose` | `sudo docker compose` |
| 정상 STATUS | `Up N minutes (healthy)` | `Up N minutes (healthy)` |
| 재시작 이상 | `Restarting (1) N seconds ago` | `Restarting (1) N seconds ago` |
| 종료 이상 | `Exited (1) N seconds ago` | `Exited (1) N seconds ago` |
