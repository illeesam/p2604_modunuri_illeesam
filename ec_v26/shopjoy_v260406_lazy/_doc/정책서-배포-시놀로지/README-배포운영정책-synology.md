# ShopJoy EcAdminApi — 배포 및 운영 정책서

> 작성 기준: 2026-05-04  
> 작업 도구: **MobaXterm**  
> 환경: Synology NAS + Docker Container Manager

---

## 목차

1. [인프라 구성 요약](#1-인프라-구성-요약)
2. [접속 정보](#2-접속-정보)
3. [MobaXterm 세션 등록 (최초 1회)](#3-mobaxterm-세션-등록-최초-1회)
4. [최초 배포](#4-최초-배포)
5. [재배포 (소스 변경 시)](#5-재배포-소스-변경-시)
6. [서버 시작](#6-서버-시작)
7. [서버 종료](#7-서버-종료)
8. [서버 자원 접속 방법](#8-서버-자원-접속-방법)
9. [BAT 파일 목록](#9-bat-파일-목록)
10. [트러블슈팅](#10-트러블슈팅)

---

## 1. 인프라 구성 요약

```
[로컬 개발 PC]
  └─ MobaXterm (SSH 터미널 + SFTP 브라우저)
        │
        │  SSH/SFTP  :10022
        ▼
[Synology NAS — illeesam.synology.me]
  └─ Docker Container Manager
        ├─ 컨테이너: 210-ecadminApi          ← Spring Boot 3 / Java 17
        │    외부포트 → 내부포트
        │    HTTP  21080 → 3000
        │    HTTPS 21043 → 443
        │    Telnet 21023 → 23
        │    FTP   21021 → 21
        │    SFTP  21022 → 22
        │    네트워크: bridge
        │
        └─ 컨테이너: 176-postgres-17.2       ← PostgreSQL 17.2
             외부포트: 17632 → 5432
             DB: postgres / Schema: shopjoy_2604
```

**컨테이너 운영 방식 요약**:

| 상황 | 사용 명령 | 설명 |
|---|---|---|
| 최초 배포 (컨테이너 없음) | `docker run` | 컨테이너 **새로 생성** + 기동 |
| 소스 변경 후 재배포 | JAR 교체 + `docker restart` | 컨테이너는 그대로, JAR만 교체 후 재시작 |
| 서버 시작 (stop 상태에서) | `docker start` | 기존 컨테이너를 다시 시작 |
| 서버 종료 | `docker stop` | 컨테이너 정지 (컨테이너는 삭제되지 않음) |

> `docker run`은 **최초 1회만** 실행합니다. 이미 컨테이너가 존재하는 상태에서 `docker run`을 다시 실행하면 오류가 발생합니다.  
> 이후에는 항상 `start` / `stop` / `restart`를 사용하세요.

---

## 2. 접속 정보

### NAS 접속

| 항목 | 값 |
|---|---|
| 도메인 | `illeesam.synology.me` |
| SSH 포트 | `10022` |
| FTP 포트 | `10021` |
| SFTP 포트 | `10022` |
| 계정 | `illeesam` |
| 패스워드 | `song5xxxxx` |

### DB 접속

| 항목 | 값 |
|---|---|
| Host | `illeesam.synology.me` |
| Port | `17632` |
| Database | `postgres` |
| Schema | `shopjoy_2604` |
| Username | `postgres` |
| Password | `postgre********` |

### API 접속

| 항목 | URL |
|---|---|
| HTTP API | `http://illeesam.synology.me:21080` |
| Swagger UI | `http://illeesam.synology.me:21080/swagger-ui.html` |
| Health Check | `http://illeesam.synology.me:21080/actuator/health` |

### GitHub

| 항목 | URL |
|---|---|
| 전체 저장소 | `https://github.com/illeesam/p2604_modunuri_illeesam_20260420backup` |
| EcAdminApi | `https://github.com/illeesam/p2604_modunuri_illeesam_20260420backup/tree/main/ec_v26/shopjoy_v260406/_apps/EcAdminApi` |

> **보안 주의**: 이 파일은 내부 문서용입니다. 공개 Git 저장소에 커밋하지 마세요.

---

## 3. MobaXterm 세션 등록 (최초 1회)

> MobaXterm은 SSH / SFTP / DB 접속을 세션으로 등록해두면 이후 더블클릭만으로 바로 접속할 수 있습니다.

### 3-1. SSH 세션 등록

> NAS 터미널(쉘)에 접속하기 위한 세션입니다. Docker 명령어를 직접 실행할 때 사용합니다.

1. MobaXterm 상단 **Session** 버튼 클릭
2. **SSH** 탭 선택
3. 다음 값 입력:

   | 항목 | 값 |
   |---|---|
   | Remote host | `illeesam.synology.me` |
   | Port | `10022` |
   | Username | `illeesam` |

4. **Bookmark settings** 탭 → Session name: `ShopJoy-NAS`
5. **OK** 클릭 저장
6. 좌측 세션 목록에서 `ShopJoy-NAS` 더블클릭 → 패스워드: `song5xxxxx`

### 3-2. SFTP 세션 등록

> NAS 파일 시스템을 GUI로 탐색하는 세션입니다. JAR 파일 업로드·로그 파일 다운로드 시 활용합니다.

1. MobaXterm → **Session** → **SFTP** 탭
2. 다음 값 입력:

   | 항목 | 값 |
   |---|---|
   | Remote host | `illeesam.synology.me` |
   | Port | `10022` |
   | Username | `illeesam` |

3. Session name: `ShopJoy-NAS-SFTP`
4. **OK** 클릭 저장

### 3-3. DB 세션 등록

> PostgreSQL에 직접 SQL을 실행하는 세션입니다. 데이터 조회·수정·DDL 작업 시 사용합니다.

1. MobaXterm → **Session** → **Database** 탭
2. 다음 값 입력:

   | 항목 | 값 |
   |---|---|
   | Database type | `PostgreSQL` |
   | Host | `illeesam.synology.me` |
   | Port | `17632` |
   | Login | `postgres` |
   | Password | `postgre********` |
   | Database | `postgres` |

3. Session name: `ShopJoy-DB`

### 3-4. 패스워드 자동 저장 (선택)

SSH 세션 접속 후 MobaXterm이 패스워드 저장 여부를 물으면 **Yes** 선택.  
이후 BAT 파일 실행 시 패스워드 입력 없이 자동 처리됩니다.

---

## 4. 최초 배포

> **컨테이너가 아직 없는 상태**에서 처음으로 배포하는 절차입니다.  
> 이미 `210-ecadminApi` 컨테이너가 존재한다면 이 섹션은 건너뛰고 **5. 재배포**로 이동하세요.

### 순서 요약

```
[1] GitHub에서 소스 Clone
[2] 로컬 Gradle 빌드
[3] NAS SSH 접속 → 디렉터리 구조 생성
[4] NAS SSH 접속 → 환경변수 파일 생성
[5] JAR 파일 NAS 업로드
[6] NAS SSH 접속 → Docker 컨테이너 생성 및 기동  ← 최초 1회만
[7] 기동 확인
```

---

### [1] GitHub 소스 Clone (로컬 PC)

> 개발 PC에 소스코드를 내려받습니다.

```cmd
git clone https://github.com/illeesam/p2604_modunuri_illeesam_20260420backup.git
```

또는 ZIP 다운로드:  
`https://github.com/illeesam/p2604_modunuri_illeesam_20260420backup/archive/refs/heads/main.zip`

---

### [2] Gradle 빌드 (로컬 PC)

> 소스코드를 컴파일하여 실행 가능한 JAR 파일을 만듭니다.  
> `-x test`는 단위 테스트를 건너뛰어 빌드 시간을 단축합니다.  
> `clean`은 이전 빌드 캐시를 모두 삭제합니다 — Mapper XML 수정 시 반드시 필요합니다.

**원클릭**: `bat\01_build.bat` 더블클릭

또는 직접 실행:

```cmd
cd C:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi
.\gradlew.bat clean build -x test
```

> 빌드 성공 시 `build\libs\EcAdminApi-{버전}.jar` 파일이 생성됩니다.  
> **⚠️ Mapper XML 수정 후에는 반드시 `clean build`** — `build`만 하면 Gradle 캐시에서 구 버전 XML을 그대로 JAR에 포함시킵니다.

---

### [3] NAS 디렉터리 구조 생성 (MobaXterm SSH)

> NAS에 JAR 파일, 로그, 환경변수 파일을 보관할 디렉터리를 만듭니다.  
> `-p` 옵션은 중간 경로가 없어도 한 번에 전체 경로를 생성합니다.  
> 이미 존재하는 폴더에 실행해도 오류가 나지 않으므로 안전합니다.

`ShopJoy-NAS` 세션 접속 후:

```bash
mkdir -p /volume1/docker/ecadminapi/app      # JAR 파일 위치
mkdir -p /volume1/docker/ecadminapi/logs     # 애플리케이션 로그 위치
mkdir -p /volume1/docker/ecadminapi/config   # 환경변수 파일 위치
```

---

### [4] 환경변수 파일 생성 (MobaXterm SSH)

> Spring Boot가 시작될 때 읽는 환경변수(DB접속정보, JWT Secret 등)를 파일로 저장합니다.  
> `<< 'EOF' ... EOF` 는 heredoc 문법으로, 여러 줄을 한 번에 파일에 씁니다.  
> `chmod 600`은 파일 소유자만 읽을 수 있도록 권한을 제한합니다 (보안).

```bash
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

# 파일 내용 확인 (정상 생성 여부 검증)
cat /volume1/docker/ecadminapi/config/ecadminapi.env
```

> **`DB_HOST=172.17.0.1` 이유**: Docker 컨테이너 내부에서는 `localhost`가 컨테이너 자신을 가리킵니다.  
> NAS 호스트(PostgreSQL 컨테이너가 있는 곳)에 접근하려면 Docker bridge 네트워크의 게이트웨이 IP인 `172.17.0.1`을 사용해야 합니다.

---

### [5] JAR 업로드 (로컬 PC)

> 빌드한 JAR 파일을 NAS의 `/volume1/docker/ecadminapi/app/EcAdminApi.jar` 경로에 올립니다.  
> 컨테이너가 이 경로를 `/app/EcAdminApi.jar`로 마운트해서 실행합니다.

**원클릭**: `bat\02_upload.bat` 더블클릭

또는 MobaXterm SFTP 탭(`ShopJoy-NAS-SFTP`)에서 파일 드래그:
- 로컬: `_apps\EcAdminApi\build\libs\EcAdminApi-{버전}.jar`
- 원격: `/volume1/docker/ecadminapi/app/EcAdminApi.jar` (파일명은 `EcAdminApi.jar`로 고정)

---

### [6] 컨테이너 생성 및 최초 기동 (MobaXterm SSH)

> **`docker run`은 최초 1회만 실행합니다.** 컨테이너를 새로 생성하고 동시에 기동합니다.  
> 이미 `210-ecadminApi` 컨테이너가 존재하면 오류가 발생합니다.  
> 이후 JAR 교체 시에는 `docker restart`만 하면 됩니다.

```bash
docker run -d \
  --name 210-ecadminApi \
  --env-file /volume1/docker/ecadminapi/config/ecadminapi.env \
  -v /volume1/docker/ecadminapi/app:/app \
  -v /volume1/docker/ecadminapi/logs:/app/logs \
  -p 21080:3000 \
  -p 21043:443 \
  -p 21023:23 \
  -p 21021:21 \
  -p 21022:22 \
  --restart unless-stopped \
  eclipse-temurin:17-jre \
  java -jar /app/EcAdminApi.jar
```

**옵션 설명**:

| 옵션 | 설명 |
|---|---|
| `-d` | 백그라운드(detached) 모드로 실행. 터미널이 닫혀도 컨테이너는 계속 실행됩니다. |
| `--name 210-ecadminApi` | 컨테이너 이름 지정. 이후 `docker start/stop/restart` 시 이 이름을 사용합니다. |
| `--env-file ...ecadminapi.env` | 환경변수 파일을 읽어 컨테이너 내부에 주입합니다. DB접속정보·JWT 등이 여기서 설정됩니다. |
| `-v .../app:/app` | NAS의 `/volume1/docker/ecadminapi/app` 폴더를 컨테이너 내부의 `/app`으로 마운트. JAR 파일을 여기에 올리면 컨테이너가 읽습니다. |
| `-v .../logs:/app/logs` | NAS의 logs 폴더를 컨테이너 로그 출력 경로로 마운트. 컨테이너를 삭제해도 로그가 NAS에 남습니다. |
| `-p 21080:3000` | NAS 외부 포트 `21080` → 컨테이너 내부 포트 `3000` (Spring Boot HTTP 포트). |
| `--restart unless-stopped` | NAS 재부팅 시 컨테이너를 자동으로 다시 시작합니다. `docker stop`으로 수동 정지한 경우에는 자동 시작하지 않습니다. |
| `eclipse-temurin:17-jre` | Java 17 JRE가 포함된 Docker 이미지. Spring Boot 3 실행에 필요합니다. |
| `java -jar /app/EcAdminApi.jar` | 컨테이너 시작 시 실행할 명령. 마운트된 JAR를 JVM으로 실행합니다. |

---

### [7] 기동 확인

> 컨테이너가 정상적으로 시작되었는지, Spring Boot가 완전히 뜨는지 확인합니다.  
> Spring Boot는 시작까지 보통 20~40초 소요됩니다.

```bash
# 컨테이너가 Running 상태인지 확인
docker ps | grep 210-ecadminApi

# 실시간 기동 로그 확인 — "Started EcAdminApiApplication" 문자열이 나오면 정상
# Ctrl+C 로 로그 추적 종료
docker logs -f 210-ecadminApi
```

브라우저에서 확인:
- `http://illeesam.synology.me:21080/actuator/health` → `{"status":"UP"}` 응답 확인

---

## 5. 재배포 (소스 변경 시)

> **컨테이너는 그대로 두고 JAR만 교체 후 재시작합니다.**  
> `docker run`을 다시 실행하지 않습니다. 컨테이너 설정(포트, 볼륨, 환경변수)은 변경되지 않습니다.

### 순서 요약

```
[1] 로컬 Gradle 빌드       ← 소스코드 → JAR 파일 생성
[2] JAR 파일 NAS 업로드    ← 기존 JAR를 새 JAR로 덮어쓰기
[3] NAS 컨테이너 재시작    ← 새 JAR를 읽어 Spring Boot 재기동
[4] 기동 확인
```

### 전체 원클릭

**`bat\05_redeploy.bat`** 더블클릭 → 빌드 + 업로드 + 재시작 자동 처리  
(각 단계 실패 시 자동 중단되므로 결과 메시지를 확인하세요)

---

### [1] Gradle 빌드 (로컬 PC)

> 변경된 소스코드를 새 JAR로 빌드합니다.

**원클릭**: `bat\01_build.bat`

```cmd
cd _apps\EcAdminApi
.\gradlew.bat clean build -x test
```

---

### [2] JAR 업로드 (로컬 PC)

> 새로 빌드된 JAR를 NAS에 덮어씁니다. 컨테이너는 `/app/EcAdminApi.jar`를 참조하므로 파일명을 고정합니다.

**원클릭**: `bat\02_upload.bat`

---

### [3] 컨테이너 재시작

> 컨테이너를 재시작하면 JVM이 종료되고, 마운트된 `/app/EcAdminApi.jar`(=새 JAR)를 다시 읽어 Spring Boot가 기동됩니다.

**원클릭**: `bat\03_restart.bat`

또는 MobaXterm SSH에서:

```bash
docker restart 210-ecadminApi
```

---

### [4] 기동 확인

**원클릭**: `bat\08_status.bat`

또는 MobaXterm SSH에서:

```bash
# 실시간 로그로 정상 기동 확인 (Ctrl+C로 종료)
docker logs -f 210-ecadminApi
```

---

## 6. 서버 시작

> `docker stop`으로 정지된 컨테이너를 다시 기동합니다.  
> 컨테이너가 이미 존재하므로 설정·볼륨·환경변수가 그대로 유지됩니다.

**원클릭**: `bat\06_start.bat`

또는 MobaXterm SSH에서:

```bash
docker start 210-ecadminApi

# 시작 후 정상 기동 로그 확인 (Ctrl+C로 종료)
docker logs -f 210-ecadminApi
```

확인: `http://illeesam.synology.me:21080/actuator/health` → `{"status":"UP"}`

---

## 7. 서버 종료

> 컨테이너를 정지합니다. **컨테이너는 삭제되지 않습니다.** 언제든 `docker start`로 재기동할 수 있습니다.

**원클릭**: `bat\07_stop.bat` (실행 전 "정말 종료하시겠습니까?" 확인 메시지 표시)

또는 MobaXterm SSH에서:

```bash
docker stop 210-ecadminApi
```

> **`docker stop` vs `docker rm` 차이**:
> - `docker stop`: 컨테이너를 **정지**만 합니다. `docker start`로 다시 시작 가능합니다.
> - `docker rm`: 컨테이너를 **삭제**합니다. 삭제 후에는 `docker run`으로 다시 생성해야 합니다.  
>   → 운영 중에는 `docker rm`을 실행하지 마세요.

> **`--restart unless-stopped` 동작**:  
> NAS 재부팅 시 자동으로 컨테이너를 시작합니다.  
> 단, `docker stop`으로 **수동 정지**한 경우에는 NAS 재부팅 후에도 자동 시작하지 않습니다.  
> 영구적으로 자동 시작을 비활성화하려면: `docker update --restart=no 210-ecadminApi`

---

## 8. 서버 자원 접속 방법

### 8-1. API 서버

| 목적 | URL |
|---|---|
| HTTP API 기본 | `http://illeesam.synology.me:21080` |
| Swagger UI | `http://illeesam.synology.me:21080/swagger-ui.html` |
| Health Check | `http://illeesam.synology.me:21080/actuator/health` |

### 8-2. PostgreSQL DB (MobaXterm)

MobaXterm 좌측 세션 목록 → `ShopJoy-DB` 더블클릭

또는 DBeaver / DataGrip 등 DB 클라이언트:

| 항목 | 값 |
|---|---|
| Host | `illeesam.synology.me` |
| Port | `17632` |
| Database | `postgres` |
| Username | `postgres` |
| Password | `postgre********` |
| Schema | `shopjoy_2604` |

### 8-3. NAS 파일 시스템 (MobaXterm SFTP)

`ShopJoy-NAS-SFTP` 더블클릭 → 파일 탐색기로 브라우징

| 원격 경로 | 내용 |
|---|---|
| `/volume1/docker/ecadminapi/app/` | JAR 파일 위치 (`EcAdminApi.jar`) |
| `/volume1/docker/ecadminapi/logs/` | 애플리케이션 로그 |
| `/volume1/docker/ecadminapi/config/` | 환경변수 파일 (`ecadminapi.env`) |

### 8-4. 컨테이너 내부 접속 (디버깅)

> 컨테이너 내부 쉘에 직접 접속하여 파일 구조, 프로세스, 환경변수를 확인할 때 사용합니다.

MobaXterm SSH(`ShopJoy-NAS`) 에서:

```bash
# 컨테이너 내부 bash 쉘 접속 (exit 명령으로 빠져나옴)
docker exec -it 210-ecadminApi /bin/bash

# 컨테이너 내부에서 환경변수 확인
docker exec 210-ecadminApi env | grep -E "DB_|SPRING_"

# 최근 로그 100줄 출력 (실시간 아님)
docker logs 210-ecadminApi --tail 100

# 실시간 로그 스트림 (Ctrl+C로 종료)
docker logs -f 210-ecadminApi
```

---

## 9. BAT 파일 목록

> 위치: `_doc/정책서참고파일/bat/`  
> **전제**: Windows OpenSSH 설치 필요 (`ssh`, `scp` 명령 사용)  
>   - Windows 10/11: 설정 → 앱 → 선택적 기능 → OpenSSH 클라이언트 설치  
>   - 또는 MobaXterm 실행 후 해당 터미널에서 BAT 실행

| 파일명 | 기능 | 비고 |
|---|---|---|
| `01_build.bat` | Gradle `clean build -x test` | 빌드만 |
| `02_upload.bat` | JAR → NAS SCP 업로드 | 패스워드 입력 필요 |
| `03_restart.bat` | NAS 컨테이너 재시작 | 패스워드 입력 필요 |
| `04_logs.bat` | 실시간 로그 스트림 | Ctrl+C 로 종료 |
| `05_redeploy.bat` | **빌드 + 업로드 + 재시작** | 재배포 원클릭 |
| `06_start.bat` | 컨테이너 시작 | 패스워드 입력 필요 |
| `07_stop.bat` | 컨테이너 정지 (확인 후) | 패스워드 입력 필요 |
| `08_status.bat` | 컨테이너 상태 + Health 확인 | |

---

## 10. 트러블슈팅

### 컨테이너가 시작되지 않음

```bash
# MobaXterm SSH에서 — 최근 50줄 로그로 오류 원인 확인
docker logs 210-ecadminApi --tail 50
```

| 증상 | 원인 | 해결 |
|---|---|---|
| `Connection refused` (DB 접속 오류) | `DB_HOST` 오류 | `ecadminapi.env`의 `DB_HOST=172.17.0.1` 확인 |
| `JAR not found` / `No such file` | JAR 파일 없음 | `/volume1/docker/ecadminapi/app/EcAdminApi.jar` 존재 확인 |
| `port is already allocated` | 포트 충돌 | `docker ps -a` 로 동일 포트 사용 컨테이너 확인 |
| `Conflict. The container name is already in use` | `docker run` 중복 실행 | 이미 컨테이너가 존재함. `docker start 210-ecadminApi` 로 시작 |

### API 응답 없음

```bash
# 컨테이너가 Running 상태인지 확인 (Exit 상태이면 start 필요)
docker ps -a | grep 210-ecadminApi

# Health 직접 확인 (응답 없으면 Spring Boot 기동 중이거나 포트 오류)
curl http://illeesam.synology.me:21080/actuator/health
```

### 소스 수정 후에도 구 코드가 실행됨 (Mapper XML 등)

```cmd
rem 반드시 clean build 사용 — build 만 하면 캐시된 구 버전 Mapper XML이 JAR에 포함됨
.\gradlew.bat clean build -x test
```

### PostgreSQL 접속 실패

```bash
# postgres 컨테이너가 Running 상태인지 확인
docker ps | grep 176-postgres-17.2

# postgres 컨테이너 내부에서 DB 목록 확인
docker exec -it 176-postgres-17.2 psql -U postgres -c "\l"

# shopjoy_2604 스키마 확인
docker exec -it 176-postgres-17.2 psql -U postgres -c "\dn" postgres
```

### 컨테이너를 완전히 삭제하고 다시 만들어야 할 때

> 포트나 볼륨 설정을 바꾸어야 하는 경우에만 사용합니다. 일반적인 재배포에는 불필요합니다.

```bash
# 1. 컨테이너 정지 후 삭제
docker stop 210-ecadminApi
docker rm 210-ecadminApi

# 2. [6] 컨테이너 생성 명령(docker run)을 다시 실행
```

### 로그 파일 위치

| 위치 | 설명 |
|---|---|
| NAS: `/volume1/docker/ecadminapi/logs/ecadminapi.log` | 전체 로그 (50MB 롤링) |
| NAS: `/volume1/docker/ecadminapi/logs/ecadminapi-error.log` | 에러 로그 (90일 보관) |

```bash
# MobaXterm SSH에서 에러 로그 최근 100줄 확인
tail -100 /volume1/docker/ecadminapi/logs/ecadminapi-error.log

# 특정 키워드로 로그 검색 (예: Exception 검색)
grep -i "exception" /volume1/docker/ecadminapi/logs/ecadminapi.log | tail -30
```
