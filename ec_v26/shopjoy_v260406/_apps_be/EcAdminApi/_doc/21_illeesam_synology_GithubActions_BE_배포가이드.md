# GitHub Actions 자동 배포 — 백엔드(EcAdminApi) 전체 설정 참고서 (초보자용)

작성일: 2026-09-04 / 분리일: 2026-09-04(기존 "GithubActions_배포가이드"에서 BE/FE로 분리)
대상: Docker/서버 배포 경험이 적은 개발자

이 문서는 **백엔드(EcAdminApi)** GitHub Actions 자동 배포의 전체 구조와 최초 1회 환경설정을 다루는 참고서입니다. 프론트(FO/BO 화면) 쪽은 별도 문서 [21_illeesam_synology_GithubActions_FE_배포가이드.md](21_illeesam_synology_GithubActions_FE_배포가이드.md) 참조.

실제로 "지금 배포해야 할 때 어떤 명령을 치면 되는지"는 더 짧은 문서를 보세요 → [14_illeesam_synology_BE_자동배포가이드(npm script).md](<14_illeesam_synology_BE_자동배포가이드(npm script).md>)

수동 배포(GitHub Actions 없이 내 컴퓨터에서 직접) 방법은 [11_illeesam_synology_BE_수동배포가이드(synology).md](<11_illeesam_synology_BE_수동배포가이드(synology).md>) 참조.

## 목차

1. [워크플로 파일 목록](#1-워크플로-파일-목록)
2. [최초 1회 환경설정](#2-최초-1회-환경설정)
3. [배포 스킵/수동 실행](#3-배포-스킵수동-실행)

---

## 1. 워크플로 파일 목록

위치: `.github/workflows/`

| 파일명 | 역할 | 언제 배포되나 |
|---|---|---|
| `shopjoy-be-illeesam-synol-build.yml` | 백엔드 컴파일이 되는지만 확인(배포 안 함) | 백엔드 소스가 바뀔 때마다 항상 |
| `shopjoy-be-illeesam-synol-deploy.yml` | 백엔드를 Synology NAS에 실제 배포 | 커밋 메시지에 `deploy`/`배포` 포함 시 |

> "be" = 백엔드(EcAdminApi), "synol" = Synology NAS로 배포. 백엔드는 GitHub Pages(정적 호스팅)로는 배포되지 않습니다(자바 애플리케이션이라 실행 서버가 필요) — GitHub Pages는 프론트 전용입니다.

---

## 2. 최초 1회 환경설정 (이미 돼 있으면 건너뛰어도 됨)

**설정 위치**: GitHub 리포지토리 페이지 → 상단 `Settings` 탭 → 왼쪽 메뉴 `Secrets and variables` → `Actions`

**① NAS 접속 시크릿 등록** (`New repository secret` 버튼으로 5개 등록):

| 이름(Name) | 값(Value) |
|---|---|
| `SYNOLOGY_HOST` | `illeesam.synology.me` |
| `SYNOLOGY_PORT` | `10022` |
| `SYNOLOGY_USER` | `illeesam` |
| `SYNOLOGY_PASSWORD` | (실제 비밀번호, 일부만 `s******9*!`) |
| `SYNOLOGY_SSH_KEY` | (SSH 키를 안 쓰면 비워둬도 됨 — 비밀번호 인증으로도 동작) |

> 이 5개 시크릿은 [FE 문서](21_illeesam_synology_GithubActions_FE_배포가이드.md)의 Synology 배포(`shopjoy-fe-illeesam-synol-deploy.yml`)와 **공용**입니다 — 한 번만 등록하면 BE/FE 둘 다에 쓰입니다.

**테스트 방법**: 시크릿 등록 후 `Settings → Secrets and variables → Actions` 목록에 5개 이름이 보이는지 확인 (값은 등록 후 다시 볼 수 없는 게 정상입니다 — GitHub 보안 정책).

**② NAS 쪽 `.env` 파일 준비** (이미 완료돼 있음, 참고용):

`/volume1/docker/shopjoy/backend/.env` 파일이 NAS에 미리 있어야 합니다(GitHub Actions는 이 파일을 만들지 않습니다 — 비밀번호 같은 민감정보를 깃허브에 올리지 않기 위해 일부러 그렇게 만들었습니다). 지금은 `dev` 프로파일로 이미 준비돼 있습니다.

---

## 3. 배포 스킵/수동 실행

### 배포 안 되게(스킵) 하고 싶을 때

커밋 메시지에 `deploy`/`배포` 단어를 그냥 안 쓰면 됩니다. 예를 들어:
```
~\ec_v26\shopjoy_v260406> git commit -m "오타 수정"
~\ec_v26\shopjoy_v260406> git push
```
이러면 Actions 탭에 작업은 뜨지만, 빌드 검증만 하고 실제 배포 단계는 회색(⊘ Skipped)으로 표시됩니다.

### 수동으로 즉시 실행하고 싶을 때 (커밋 없이)

1. GitHub 리포지토리 → `Actions` 탭
2. 왼쪽에서 `shopjoy-be-illeesam-synol-deploy` 클릭
3. 오른쪽 `Run workflow` 버튼 클릭 → `Run workflow` 다시 클릭

**테스트 결과**: 목록에 새 작업이 뜨고 진행되면 성공 (이 방식은 커밋 메시지 단어 체크 없이 무조건 배포됩니다). 완료 후 확인은 [14번 문서](<14_illeesam_synology_BE_자동배포가이드(npm script).md>)의 테스트 URL 참조.
