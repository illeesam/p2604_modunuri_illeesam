# ShopJoy EcAdminApi 배포 구성 가이드

## 📁 파일 배치

```
C:\_pjt_github\p2604_modunuri_illeesam\
│
├── .github\
│   └── workflows\
│       └── deploy-ec-admin.yml          ← GitHub Actions 워크플로우 (수정됨)
│
├── ec_v26\shopjoy_v260406\_apps_be\EcAdminApi\
│   └── Dockerfile                       ← 기존 유지
│
└── _github_workflow_synol_dockercompose\
    ├── README.md                        ← 이 파일
    ├── docker-compose.yml               ← Synology에 올릴 컴포즈
    └── .env.example                     ← 환경변수 템플릿 (.env 복사해서 사용)
```

### Synology 배포 디렉토리

```
/volume1/docker/ec-admin-api/
├── docker-compose.yml   ← 최초 1회 수동 업로드 (이후 변경 시에도 수동)
├── .env                 ← .env.example 복사 후 실제값 입력 (수동, Git 비포함)
├── uploads/             ← 파일 업로드 볼륨 (자동 생성)
└── logs/                ← 로그 볼륨 (자동 생성)
```

---

## 🚀 최초 배포 절차 (Synology 준비)

### 1. Synology SSH 접속

```bash
ssh illeesam@illeesam.synology.me -p {SSH_PORT}
```

### 2. 디렉토리 생성

```bash
sudo mkdir -p /volume1/docker/ec-admin-api/uploads
sudo mkdir -p /volume1/docker/ec-admin-api/logs
```

### 3. docker-compose.yml 업로드

로컬에서 SCP로 전송:

```bash
scp -P {SSH_PORT} docker-compose.yml illeesam@illeesam.synology.me:/volume1/docker/ec-admin-api/
```

또는 Synology File Station에서 직접 업로드.

### 4. .env 파일 생성

```bash
cd /volume1/docker/ec-admin-api
cp .env.example .env
vi .env   # 실제 값으로 수정
```

**반드시 변경할 항목:**

| 키 | 설명 |
|---|---|
| `DB_PASSWORD` | PostgreSQL 비밀번호 |
| `JWT_SECRET` | 32자 이상 랜덤 문자열 |
| `KAKAO_CLIENT_ID` | 카카오 앱 키 |
| `KAKAO_CLIENT_SECRET` | 카카오 앱 시크릿 |
| `KAKAO_REDIRECT_URI` | 실제 도메인으로 변경 |

### 5. DB/Redis 먼저 기동 (최초 1회)

```bash
cd /volume1/docker/ec-admin-api
sudo docker compose up -d postgres redis

# 헬스체크 확인
sudo docker compose ps
```

### 6. GitHub Actions 실행

`main` 브랜치에 `EcAdminApi` 경로 파일 push → 자동 배포

---

## ⚙️ GitHub Secrets 설정

레포 → Settings → Secrets and variables → Actions

| Secret 명 | 설명 |
|---|---|
| `SYNOLOGY_HOST` | `illeesam.synology.me` |
| `SYNOLOGY_PORT` | SSH 포트 (기본 22) |
| `SYNOLOGY_USER` | SSH 사용자명 |
| `SYNOLOGY_PASSWORD` | SSH 비밀번호 |
| `SYNOLOGY_SSH_KEY` | SSH 개인키 (선택) |

---

## 🔄 CI/CD 흐름

```
git push (main, EcAdminApi 경로)
    │
    ▼
[01] 소스 체크아웃
[02] JDK 17 설정
[03] Gradle bootJar 빌드
[04] Docker 이미지 빌드 (ec-admin-api:latest)
[05] docker save → tar.gz 압축
[06] SCP → Synology /volume1/docker/ec-admin-api/
[07] SSH 접속 후:
     ├─ docker load < ec-admin-api.tar.gz
     ├─ docker compose up -d --no-deps --force-recreate ec-admin-api
     │    (postgres, redis는 이미 떠있으면 재시작 안 함)
     └─ 상태 확인 / 로그 확인 / 임시파일 삭제
[08] 외부 HTTP 헬스체크
[09] 결과 요약
```

---

## 🛠️ Synology 수동 관리 명령어

```bash
cd /volume1/docker/ec-admin-api

# 전체 서비스 상태
sudo docker compose ps

# ec-admin-api 로그 실시간
sudo docker compose logs -f ec-admin-api

# ec-admin-api만 재시작
sudo docker compose restart ec-admin-api

# 전체 재시작 (데이터 유지)
sudo docker compose down && sudo docker compose up -d

# DB 접속
sudo docker exec -it shopjoy_db psql -U illeesam -d shopjoy_db

# Redis 접속
sudo docker exec -it shopjoy_redis redis-cli

# 내부 헬스체크
curl http://localhost:31000/actuator/health
```

---

## ⚠️ 주의사항

1. **`.env` 파일은 절대 Git에 커밋하지 마세요** → `.gitignore`에 등록
2. `docker-compose.yml`에 `ec-admin-api` 이미지 빌드 컨텍스트 없음 → **이미지는 GitHub Actions에서 주입**
3. DB 볼륨(`postgres_data`)은 `docker compose down -v` 실행 시 삭제됨 → 운영 데이터 주의
4. `docker-compose.yml` 수정 시 Synology에 수동으로 재업로드 필요
