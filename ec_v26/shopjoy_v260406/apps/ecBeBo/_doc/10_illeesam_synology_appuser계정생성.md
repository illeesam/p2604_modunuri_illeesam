# Synology NAS에 배포용 계정(`appuser`) 만들기 — DSM 관리자 화면 매뉴얼

작성일: 2026-09-05
대상: DSM(시놀로지 관리자 화면) 조작이 처음인 개발자

독립 문서입니다 — 특정 배포 방식 하나가 아니라, **이 프로젝트의 모든 배포 경로가 공통으로 쓰는 NAS 계정**을 처음부터 만드는 방법만 다룹니다.

| 적용 대상 | 문서 |
|---|---|
| 직접 SSH 배포(BE) | [11_illeesam_synology_BE_수동배포가이드(synology).md](<11_illeesam_synology_BE_수동배포가이드(synology).md>), [14_illeesam_synology_BE_자동배포가이드(npm script).md](<14_illeesam_synology_BE_자동배포가이드(npm script).md>) |
| 직접 SSH 배포(FE) | [12_illeesam_synology_FE_수동배포가이드(synology).md](<12_illeesam_synology_FE_수동배포가이드(synology).md>), [15_illeesam_synology_FE_자동배포가이드(npm script).md](<15_illeesam_synology_FE_자동배포가이드(npm script).md>) |
| GitHub Actions | [21_illeesam_synology_GithubActions_BE_배포가이드.md](21_illeesam_synology_GithubActions_BE_배포가이드.md), [22_illeesam_synology_GithubActions_FE_배포가이드.md](22_illeesam_synology_GithubActions_FE_배포가이드.md) |

이미 계정이 있고 권한만 확인하면 되는 경우는 [9011번 문서의 "계정 설정 시 주의사항"](9011_illeesam_synology_BE_트러블슈팅용어.md#계정-설정-시-주의사항-nas-쪽-배포-계정)만 봐도 충분합니다.

| 전제 | 내용 |
|---|---|
| DSM 버전 | 메뉴 이름/화면 배치가 버전마다 조금 다를 수 있음 — 정확히 같은 이름이 안 보이면 비슷한 이름(예: "사용자 홈" ↔ "User Home")을 찾을 것 |
| 이 문서의 기준값 | 계정명 `appuser`, 비밀번호 `appu****************` — 다른 값을 쓴다면 [`scripts/.synology-deploy.env`](../../../scripts/.synology-deploy.env)와 GitHub Actions 시크릿도 그 값에 맞춰 갱신 필요 |

## 목차

1. [사용자 생성](#1-사용자-생성)
2. [그룹 설정 (docker 그룹 소속)](#2-그룹-설정-docker-그룹-소속)
3. [공유 폴더 권한 (docker 폴더 읽기/쓰기)](#3-공유-폴더-권한-docker-폴더-읽기쓰기)
4. [사용자 홈 서비스 — SFTP 접속 루트 확인](#4-사용자-홈-서비스--sftp-접속-루트-확인)
5. [파일 서비스(FTP/SFTP) 활성화 확인](#5-파일-서비스ftpsftp-활성화-확인)
6. [최종 확인 (SSH 접속 테스트)](#6-최종-확인-ssh-접속-테스트)

---

## 1. 사용자 생성

**경로**: DSM 로그인 → **제어판 → 사용자 및 그룹** → **사용자** 탭 → 하단 **생성**(또는 **추가**) 버튼

| 항목 | 값 |
|---|---|
| 이름(계정명) | `appuser` |
| 설명 | (자유, 예: "ShopJoy 배포 전용 계정") |
| 이메일 | (선택 — 안 넣어도 됨) |
| 비밀번호 | `appu****************` (또는 원하는 값) |
| "사용자가 다음 로그인 시 비밀번호를 변경해야 함" | **체크 해제** — 자동화 스크립트가 로그인하는 계정이라 강제 변경이 걸리면 다음 배포부터 로그인이 막힘 |

**다음** 클릭해서 계속 진행(그룹/권한은 이어지는 마법사 단계 또는 아래 2~3번에서 별도로 설정).

**결과 확인**: 사용자 목록에 `appuser`가 새로 보이면 성공입니다.

---

## 2. 그룹 설정 (docker 그룹 소속)

**경로**: (생성 마법사 중 "사용자 그룹 결합" 단계에서 바로 설정하거나, 이미 만들었다면) **사용자 및 그룹 → 사용자 → `appuser` 더블클릭(또는 편집) → 사용자 그룹** 탭

**할 일**: **`docker`** 그룹에 체크.

| 항목 | 내용 |
|---|---|
| 왜 필요한가 | NAS SSH 안에서 `docker compose build`/`up` 같은 명령을 실행하려면 이 그룹 소속이 필요함(도커 소켓 접근 권한) |
| 빠뜨리면 | SFTP 업로드까지는 되는데 그 다음 `docker compose` 단계에서 권한 오류 발생 |

**결과 확인**: `appuser` 편집 화면의 "사용자 그룹" 탭에서 `docker`가 체크된 상태로 저장되면 성공입니다.

---

## 3. 공유 폴더 권한 (`docker` 폴더 읽기/쓰기)

**경로**: **제어판 → 공유 폴더** → `docker` 선택 → **편집** → **권한** 탭

**할 일**: `appuser`(또는 방금 만든 그룹)를 찾아서 **읽기/쓰기**로 설정.

| 항목 | 내용 |
|---|---|
| 왜 필요한가 | 배포 스크립트가 SFTP로 올리는 jar/설정 파일(`/volume1/docker/shopjoy/backend/...`)이 전부 이 `docker` 공유 폴더 안에 있음 |
| 빠뜨리면 | SFTP 로그인 자체는 성공해도 파일을 못 써서 `No such file` 같은(사실은 권한 문제인) 에러 발생 |
| 주의 | 폴더 권한만으로는 **이미 다른 계정 소유로 만들어진 기존 파일**까지는 못 지웁니다(소유권은 별개) — 9011번 문서 사례 #4 참조 |

**결과 확인**: 권한 목록에서 `appuser` 행이 "읽기/쓰기"로 표시되면 성공입니다.

---

## 4. 사용자 홈 서비스 — SFTP 접속 루트 확인

**경로**: **제어판 → 사용자 및 그룹 → 고급** 탭 → **사용자 홈** 섹션

**확인/할 일**: "사용자 홈 서비스" 관련 설정 중 **"FTP/SFTP 연결을 사용자 홈 폴더로 제한"**(또는 비슷한 이름의 옵션)이 있다면 **꺼져 있는지** 확인하세요.

> ⚠ **이 문서에서 가장 중요한 항목입니다.**

| 항목 | 내용 |
|---|---|
| 옵션이 켜져 있으면 | `appuser`로 SFTP 접속 시 접속 루트가 `/volume1` 전체가 아니라 `appuser`의 개인 홈 폴더로 좁혀짐 |
| 왜 문제인가 | 배포 스크립트(`scripts/synology-deploy-util.js`)는 "SFTP 접속 루트 = `/volume1`"이라는 전제로 경로를 계산함(`/volume1/docker/...` → `/docker/...`로 변환) — 옵션이 켜져 있으면 전혀 엉뚱한 경로를 찾아 계속 `No such file` 발생 |
| 참고 | 옛 계정(`illeesam`)은 이 옵션이 꺼져 있는 상태로 오래 써왔기 때문에 문제가 없었음 — 새 계정은 기본값이 다를 수 있으니 꼭 확인 |

**결과 확인**: 확실하지 않으면 6번(최종 확인)의 SSH 테스트로 실제 동작을 직접 확인하는 게 가장 정확합니다.

---

## 5. 파일 서비스(FTP/SFTP) 활성화 확인

**경로**: **제어판 → 파일 서비스** → **FTP/SFTP** 탭

| 항목 | 내용 |
|---|---|
| 확인할 것 | **SFTP 활성화** 체크박스가 켜져 있는지 |
| 참고 | NAS 전체 설정이라 보통 이미 켜져 있음(다른 계정으로 계속 써왔다면) |

---

## 6. 최종 확인 (SSH 접속 테스트)

여기까지 설정했으면, 실제로 SSH 접속해서 배포 스크립트가 쓰는 것과 동일한 경로가 정상적으로 보이는지 확인합니다.

**명령어** (🖥 내 컴퓨터):
```
~> ssh -p 10022 appuser@illeesam.synology.me
```

접속 성공 후(과정은 [11번 문서](<11_illeesam_synology_BE_수동배포가이드(synology).md>) STEP 2 참조), 이어서:
```
appuser@illeesam:~$ ls -la /volume1/docker/shopjoy/backend/
```

**결과 확인**:

| 결과 | 의미 |
|---|---|
| `docker-compose.yml`, `.env`, `nginx.conf` 등 파일 목록이 보임 | ✅ 정상 — 이제 배포 스크립트 실행 가능 |
| `No such file or directory` | 2~4번 중 하나가 아직 안 맞음 — 특히 4번(사용자 홈 제한) 다시 확인 |
| `Permission denied` | 3번(공유 폴더 권한)이 아직 안 맞음 |

이 확인이 끝나면 원하는 배포 방식(위 "적용 대상" 표 참조) 그대로 진행하시면 됩니다.

---

## 관련 문서

| 문서 | 내용 |
|---|---|
| [9011_illeesam_synology_BE_트러블슈팅용어.md](9011_illeesam_synology_BE_트러블슈팅용어.md) | 이 설정을 빠뜨렸을 때 나는 증상/원인 요약표 |
| [11_illeesam_synology_BE_수동배포가이드(synology).md](<11_illeesam_synology_BE_수동배포가이드(synology).md>) | BE 수동 배포 STEP |
| [12_illeesam_synology_FE_수동배포가이드(synology).md](<12_illeesam_synology_FE_수동배포가이드(synology).md>) | FE 수동 배포 STEP |
| [11-1_illeesam_synology_BE_로그보기.md](11-1_illeesam_synology_BE_로그보기.md) | 배포 후 로그 확인 |
