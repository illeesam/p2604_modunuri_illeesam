# 백엔드(EcAdminApi) → 자동 배포 (빠른 실행 가이드)

작성일: 2026-09-04
대상: Docker/서버 배포 경험이 적은 개발자

명령어 하나로 [11_illeesam_synology_BE_수동배포가이드.md](11_illeesam_synology_BE_수동배포가이드.md)의 STEP들을 대신 실행해줍니다. **방식이 2가지**입니다:

| | `npm run deploy:be-dev-synol` | `npm run deploy:dev-github` |
|---|---|---|
| 누가 실행하나 | **내 컴퓨터**가 직접 NAS에 SSH 접속 | **GitHub 서버**가 대신 실행 |
| 속도 | 빠름(바로 시작) | 느림(커밋 push 후 GitHub이 처리하는 몇 분 대기) |
| 내 컴퓨터를 꺼도 되나 | ❌ (내 컴퓨터가 직접 하는 거라 켜져 있어야 함) | ✅ (push만 하면 내 컴퓨터는 꺼도 됨) |
| 사전 준비 | `scripts/.synology-deploy.env`에 NAS 접속정보 필요 | GitHub 리포지토리 시크릿 등록 필요 |
| 대상 구분 | 백엔드만 배포 | 안 됨(바뀐 파일 기준으로 자동 결정) |

**평소엔 `deploy:be-dev-synol`을 쓰시면 됩니다(더 빠르고 간단함).** 프론트까지 같이 배포하려면 [15번 문서](15_illeesam_synology_FE_자동배포가이드.md)의 `deploy:fe-dev-synol`을 이어서 실행하세요.

---

## 방식 A — `npm run deploy:be-dev-synol` (직접 SSH, 권장)

**사전 준비**: `scripts/.synology-deploy.env` 파일이 없다면 먼저 만드세요(딱 1번만, 프론트 배포와 공용):
```
SYNOLOGY_HOST=illeesam.synology.me
SYNOLOGY_PORT=10022
SYNOLOGY_USER=illeesam
SYNOLOGY_PASSWORD=실제비밀번호
```
> 이 파일은 `.gitignore`에 등록돼 있어 깃허브에 절대 올라가지 않습니다.

**명령어** (🖥 내 컴퓨터, 프로젝트 폴더에서):
```
~\ec_v26\shopjoy_v260406> npm run deploy:be-dev-synol
```

**명령어 설명**: `scripts/deployBeDevSynology.js`를 실행합니다. 이 스크립트가 안에서 하는 일 — [11_illeesam_synology_BE_수동배포가이드.md](11_illeesam_synology_BE_수동배포가이드.md)의 STEP 1~5와 완전히 동일합니다.

| 단계 | 하는 일 |
|---|---|
| 1 | `gradlew clean bootJar -x test`로 로컬 빌드 |
| 2 | SSH(SFTP)로 jar 파일을 NAS에 전송 |
| 3 | NAS에서 `docker compose build` (이미지 재빌드) |
| 4 | NAS에서 `docker compose up -d --force-recreate ecadminapi` (재기동) |
| 5 | `docker compose ps`로 상태 출력 |

**결과값**: 콘솔에 각 단계가 그대로 출력되고, 마지막에 `[완료] 백엔드 배포 끝` 이 나오면 성공입니다.

**테스트 방법**: 브라우저 주소창에 아래 URL 입력.
```
http://illeesam.synology.me:21080/actuator/health
```

**테스트 결과**: `{"status":"UP"}`이 보이면 성공입니다.

---

## 방식 B — `npm run deploy:dev-github` (GitHub Actions 경유)

**사전 준비**가 아직이라면 [21_illeesam_synology_GithubActions_배포가이드.md](21_illeesam_synology_GithubActions_배포가이드.md) 참조(시크릿 등록 등).

**명령어**:
```
~\ec_v26\shopjoy_v260406> npm run deploy:dev-github
```

이 명령은 지금까지 바뀐 파일을 전부 커밋(메시지에 `deploy` 자동 포함)하고 push합니다. 백엔드 파일이 실제로 바뀌었을 때만 GitHub Actions가 그걸 인식해서 배포합니다.

**테스트 방법**: GitHub 리포지토리 → `Actions` 탭 → `shopjoy-be-illeesam-synol-deploy` 작업 확인 → 완료 후 위와 같은 헬스체크 URL로 최종 확인.

**커밋 없이 수동 실행**: GitHub `Actions` 탭 → `shopjoy-be-illeesam-synol-deploy` → `Run workflow` 버튼.

---

## 문제가 생겼을 때

트러블슈팅/용어는 별도 문서 참조 → [9011_illeesam_synology_BE_트러블슈팅용어.md](9011_illeesam_synology_BE_트러블슈팅용어.md)
