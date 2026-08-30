# ShopJoy EcAdminApi — 배포 정책서 인덱스

> 작성 기준: 2026-05-04

---

## 배포 방식 선택 가이드

| 방식 | 문서 | 특징 | 적합한 경우 |
|---|---|---|---|
| **A. Synology 직접 실행** | [README-배포운영정책-synology.md](README-배포운영정책-synology.md) | NAS에 JAR을 업로드하여 `eclipse-temurin:17-jre` 이미지로 실행. JAR을 마운트하는 방식. | 현재 운영 방식. NAS 단일 서버, 빠른 JAR 교체 |
| **B. Docker 단독** | [README-배포운영정책-docker.md](README-배포운영정책-docker.md) | JAR을 포함한 자체 Docker 이미지 빌드. `docker run`으로 실행. | 이미지 기반 배포, CI/CD, 다중 서버 배포 |
| **C. Docker Compose** | [README-배포운영정책-docker-compose.md](README-배포운영정책-docker-compose.md) | YAML 선언적 구성. `docker compose up`으로 실행. | 다중 컨테이너(앱+DB+Redis 등), 로컬 개발, 환경별 분리 |

---

## 빠른 명령 비교표

| 동작 | A. Synology | B. Docker | C. Compose |
|---|---|---|---|
| **빌드** | `gradlew clean build` | `gradlew clean build` + `docker build -t ...` | `docker compose build` |
| **JAR 업로드** | SCP로 NAS 전송 | (이미지에 포함) | (이미지에 포함) |
| **최초 실행** | `docker run` (긴 옵션) | `docker run` (긴 옵션) | `docker compose up -d` |
| **재배포** | JAR 교체 + `docker restart` | `docker build` + `stop/rm/run` | `docker compose up -d --build` |
| **시작** | `docker start <컨테이너>` | `docker start <컨테이너>` | `docker compose start` |
| **정지** | `docker stop <컨테이너>` | `docker stop <컨테이너>` | `docker compose stop` |
| **로그** | `docker logs -f <컨테이너>` | `docker logs -f <컨테이너>` | `docker compose logs -f <서비스>` |

---

## 폴더 구성

```
_doc/정책서-배포-시놀로지/
├─ README.md                                      ← 이 파일 (인덱스)
├─ README-배포운영정책-synology.md                ← A. Synology 직접 실행 방식
├─ README-배포운영정책-docker.md                  ← B. Docker 단독 방식
├─ README-배포운영정책-docker-compose.md          ← C. Docker Compose 방식
├─ bat/                                           ← Windows 배치 파일 (A 방식 자동화)
│   └─ 01_build.bat ~ 08_status.bat
├─ sh/                                            ← Linux/Mac 셸 스크립트 (A 방식 자동화)
│   └─ 01_build.sh ~ 08_status.sh
└─ docker/                                        ← B/C 방식 템플릿 파일
    ├─ Dockerfile                                  ← 멀티스테이지 빌드
    ├─ .dockerignore                               ← 빌드 컨텍스트 제외 목록
    ├─ docker-compose.yml                          ← 앱 단독 Compose
    ├─ docker-compose.with-postgres.yml            ← 앱 + DB 통합 Compose
    ├─ .env.example                                ← 환경변수 템플릿
    └─ README.md                                   ← docker 폴더 사용법
```

---

## 추천 학습 순서

1. **현재 운영 환경 이해 → A**: `README-배포운영정책-synology.md`
2. **이미지 기반 배포 이해 → B**: `README-배포운영정책-docker.md`
3. **선언적 구성으로 정리 → C**: `README-배포운영정책-docker-compose.md`

---

## 공통 접속 정보

자세한 접속 정보 및 보안 주의사항은 [README-배포운영정책-synology.md](README-배포운영정책-synology.md#2-접속-정보) 참조.

| 항목 | 값 |
|---|---|
| NAS | `illeesam.synology.me:10022` (계정: `illeesam`) |
| API | `http://illeesam.synology.me:21080` |
| Health | `http://illeesam.synology.me:21080/actuator/health` |
| Swagger | `http://illeesam.synology.me:21080/swagger-ui.html` |
| DB | `illeesam.synology.me:17632` (postgres / shopjoy_2604) |
| GitHub | https://github.com/illeesam/p2604_modunuri_illeesam_20260420backup |
