# Docker / Docker Compose 파일 모음

이 폴더의 파일들은 **참고용 템플릿**입니다.  
실제 사용 시 `_apps/EcAdminApi/` 디렉터리로 복사해서 사용하세요.

---

## 파일 목록

| 파일 | 배치 위치 | 용도 |
|---|---|---|
| `Dockerfile` | `_apps/EcAdminApi/Dockerfile` | JAR 포함 이미지 빌드 (멀티스테이지) |
| `.dockerignore` | `_apps/EcAdminApi/.dockerignore` | 빌드 컨텍스트에서 제외할 파일 |
| `docker-compose.yml` | `_apps/EcAdminApi/docker-compose.yml` | EcAdminApi 단독 Compose 구성 |
| `docker-compose.with-postgres.yml` | `_apps/EcAdminApi/docker-compose.yml` (덮어쓰기) | EcAdminApi + PostgreSQL 통합 구성 |
| `.env.example` | `_apps/EcAdminApi/.env.example` | 환경변수 템플릿 (Git 커밋 가능) |

---

## 빠른 시작

### A. Docker 단독 사용

```bash
# 1. 파일 복사
cd c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi
copy ..\..\_doc\정책서-배포-시놀로지\docker\Dockerfile .
copy ..\..\_doc\정책서-배포-시놀로지\docker\.dockerignore .
copy ..\..\_doc\정책서-배포-시놀로지\docker\.env.example .env
notepad .env   # 실제 값 입력

# 2. 이미지 빌드
docker build -t shopjoy/ecadminapi:latest .

# 3. 컨테이너 실행
docker run -d --name 210-ecadminApi --env-file .env -p 21080:3000 --restart unless-stopped shopjoy/ecadminapi:latest

# 4. 확인
docker logs -f 210-ecadminApi
curl http://localhost:21080/actuator/health
```

### B. Docker Compose (앱 단독)

```bash
# 1. 파일 복사
cd c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi
copy ..\..\_doc\정책서-배포-시놀로지\docker\Dockerfile .
copy ..\..\_doc\정책서-배포-시놀로지\docker\.dockerignore .
copy ..\..\_doc\정책서-배포-시놀로지\docker\docker-compose.yml .
copy ..\..\_doc\정책서-배포-시놀로지\docker\.env.example .env
notepad .env

# 2. 한 줄로 빌드 + 실행
docker compose up -d --build

# 3. 확인
docker compose logs -f ecadminapi
docker compose ps
```

### C. Docker Compose (앱 + DB 통합)

```bash
# 1. 파일 복사 (PostgreSQL 통합 버전을 docker-compose.yml 로 사용)
cd c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi
copy ..\..\_doc\정책서-배포-시놀로지\docker\Dockerfile .
copy ..\..\_doc\정책서-배포-시놀로지\docker\.dockerignore .
copy ..\..\_doc\정책서-배포-시놀로지\docker\docker-compose.with-postgres.yml docker-compose.yml
copy ..\..\_doc\정책서-배포-시놀로지\docker\.env.example .env
notepad .env

# 2. 실행
docker compose up -d --build

# 3. 확인
docker compose ps
docker compose logs -f
```

---

## 자주 쓰는 명령

| 작업 | 명령 |
|---|---|
| 빌드 + 시작 | `docker compose up -d --build` |
| 정지 | `docker compose stop` |
| 정지 + 컨테이너 삭제 (볼륨 보존) | `docker compose down` |
| 정지 + 컨테이너 + 볼륨 삭제 (DB 데이터 삭제 주의!) | `docker compose down -v` |
| 로그 추적 | `docker compose logs -f ecadminapi` |
| 컨테이너 상태 | `docker compose ps` |
| 컨테이너 내부 접속 | `docker compose exec ecadminapi sh` |
| 캐시 무시 재빌드 | `docker compose build --no-cache` |
| 구성 검증 (변수 치환 확인) | `docker compose config` |

---

## 자세한 가이드

- [README-배포운영정책-docker.md](../README-배포운영정책-docker.md) — Docker 단독 방식 전체 가이드
- [README-배포운영정책-docker-compose.md](../README-배포운영정책-docker-compose.md) — Docker Compose 전체 가이드

---

## 주의사항

1. **`.env` 는 Git 커밋 금지** — 비밀번호/시크릿이 포함되어 있음
2. **`.env.example` 만 커밋** — 키 구조만 공유 (값은 비움)
3. **`docker compose down -v` 는 볼륨까지 삭제** — DB 데이터 손실 위험
4. **이미지 태그 관리** — `latest` 만 쓰지 말고 버전 태그 (`1.0.0`) 도 같이 사용하여 롤백 가능하게
5. **NAS 운영 시 `restart: unless-stopped`** — NAS 재부팅 시 자동 시작
