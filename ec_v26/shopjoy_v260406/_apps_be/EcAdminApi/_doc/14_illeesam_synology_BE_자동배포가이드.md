# 백엔드(EcAdminApi) → 자동 배포 (빠른 실행 가이드)

작성일: 2026-09-04 / npm 스크립트 이름 개편: 2026-09-05
대상: Docker/서버 배포 경험이 적은 개발자

명령어 하나로 [11_illeesam_synology_BE_수동배포가이드.md](11_illeesam_synology_BE_수동배포가이드.md)의 STEP들을 대신 실행해줍니다. **방식이 2가지**입니다:

| | `npm run deploy:dev-synol-be` | `npm run deploy:dev-github-be` |
|---|---|---|
| 누가 실행하나 | **내 컴퓨터**가 직접 NAS에 SSH 접속 | **GitHub 서버**가 대신 실행 |
| 속도 | 빠름(바로 시작) | 느림(커밋 push 후 GitHub이 처리하는 몇 분 대기) |
| 내 컴퓨터를 꺼도 되나 | ❌ (내 컴퓨터가 직접 하는 거라 켜져 있어야 함) | ✅ (push만 하면 내 컴퓨터는 꺼도 됨) |
| 사전 준비 | `scripts/.synology-deploy.env`에 NAS 접속정보 필요 | GitHub 리포지토리 시크릿 등록 필요 |
| 대상 구분 | 백엔드만 배포 | 커밋 메시지는 의도 표시일 뿐 — 실제로는 바뀐 파일 기준으로 GitHub Actions가 자동 결정 |

**평소엔 `deploy:dev-synol-be`를 쓰시면 됩니다(더 빠르고 간단함).** 프론트까지 같이 배포하려면 [15번 문서](15_illeesam_synology_FE_자동배포가이드.md)의 `deploy:dev-synol-fe`를 이어서 실행하거나, 백엔드+프론트를 한 번에 하려면 `npm run deploy:dev-synol-full`을 쓰세요(내부적으로 `deploy:dev-synol-be` → `deploy:dev-synol-fe` 순서로 실행됩니다).

---

## 방식 A — `npm run deploy:dev-synol-be` (직접 SSH, 권장)

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
~\ec_v26\shopjoy_v260406> npm run deploy:dev-synol-be
```

**명령어 설명**: `scripts/deployDevSynolBe.js`를 실행합니다. 이 스크립트가 안에서 하는 일 — [11_illeesam_synology_BE_수동배포가이드.md](11_illeesam_synology_BE_수동배포가이드.md)의 STEP 1~5와 완전히 동일합니다.

| 단계 | 하는 일 |
|---|---|
| 1 | `gradlew clean bootJar -x test`로 로컬 빌드 |
| 2 | SSH(SFTP)로 jar 파일을 NAS에 전송 |
| 3 | NAS에서 `docker compose build` (이미지 재빌드) |
| 4 | NAS에서 `docker compose up -d --force-recreate ecadminapi` (재기동) |
| 5 | `docker compose ps`를 healthy 될 때까지 최대 5분 폴링 |

**결과값**: 콘솔에 각 단계가 그대로 출력되고, 마지막에 `[완료] 백엔드 배포 끝` 이 나오면 성공입니다.

**테스트 방법**: 브라우저 주소창에 아래 URL 입력.
```
http://illeesam.synology.me:21080/actuator/health
```

**테스트 결과**: `{"status":"UP"}`이 보이면 성공입니다.

추가로 DB 연동까지 실제로 되는지 확인하려면(로그인 불필요, 공통코드 페이징 조회):
```
http://illeesam.synology.me:21080/api/co/sy/code/page?pageNo=1&pageSize=10
```
`{"ok":true,"status":200,"data":{"pageList":[...],"pageTotalCount":...}}` 형태로 나오면 DB 연동까지 정상입니다.

> **백엔드+프론트를 한 번에 배포하고 싶으면**: `npm run deploy:dev-synol-full` (= `deploy:dev-synol-be` 다음 `deploy:dev-synol-fe`를 순서대로 실행 — 자세한 프론트 쪽 내용은 [15번 문서](15_illeesam_synology_FE_자동배포가이드.md) 참조).

---

## 방식 B — `npm run deploy:dev-github-be` (GitHub Actions 경유)

**사전 준비**가 아직이라면 [21_illeesam_synology_GithubActions_BE_배포가이드.md](21_illeesam_synology_GithubActions_BE_배포가이드.md) 참조(시크릿 등록 등).

**명령어**:
```
~\ec_v26\shopjoy_v260406> npm run deploy:dev-github-be
```

이 명령은 지금까지 바뀐 파일을 전부 커밋(메시지에 `deploy(be): 배포` 포함)하고 push합니다. 백엔드 파일이 실제로 바뀌었을 때만 GitHub Actions가 그걸 인식해서 배포합니다.

> ⚠ 커밋 메시지의 `(be)`는 "의도를 남기는 표시"일 뿐입니다 — 실제로 어느 워크플로가 도는지는 GitHub Actions의 경로 필터가 "무엇이 실제로 바뀌었는지"만 보고 정합니다. 백엔드/프론트가 둘 다 바뀐 상태라면 `deploy:dev-github-full`(커밋 메시지 `deploy(full): 배포`)을 쓰는 게 더 정확한 기록이 됩니다 — 세 스크립트(`-be`/`-fe`/`-full`) 모두 실제 동작(커밋+push)은 동일하고 커밋 메시지만 다릅니다.

**테스트 방법**: GitHub 리포지토리 → `Actions` 탭 → `shopjoy-be-illeesam-synol-deploy` 작업 확인 → 완료 후 위와 같은 헬스체크 URL로 최종 확인.

**커밋 없이 수동 실행**: GitHub `Actions` 탭 → `shopjoy-be-illeesam-synol-deploy` → `Run workflow` 버튼.

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| [`scripts/deployDevSynolBe.js`](../../../scripts/deployDevSynolBe.js) | 실제 배포 로직 — Gradle 빌드 → jar SFTP 전송 → NAS에서 `docker compose build`+재기동 → healthy 될 때까지 최대 5분 폴링 → `actuator/health` 응답 확인 |
| [`scripts/synologyDeployUtil.js`](../../../scripts/synologyDeployUtil.js) | `deployDevSynolBe.js`/`deployDevSynolFe.js`가 공유하는 SSH/SFTP 공통 로직(접속정보 로드, SFTP 업로드, SSH 명령 실행) |
| `scripts/.synology-deploy.env` | NAS 접속정보(호스트/포트/계정/비밀번호) — `.gitignore` 처리돼 있어 깃허브에 올라가지 않음(위 "사전 준비" 참조) |
| `package.json`의 `deploy:dev-synol-be` | `node scripts/deployDevSynolBe.js`를 실행하는 npm 스크립트 별칭 |
| `package.json`의 `deploy:dev-synol-full` | `deploy:dev-synol-be` → `deploy:dev-synol-fe` 순서 실행(백엔드+프론트 한 번에) |
| `package.json`의 `deploy:dev-github-be`/`-fe`/`-full` | (방식 B) 커밋 메시지만 다르고 동작은 동일한 `git add && commit && push` — 실제 배포 대상은 GitHub Actions 경로 필터가 결정 |
| `.github/workflows/shopjoy-be-illeesam-synol-deploy.yml` | (방식 B) push 시 GitHub 서버가 대신 실행 — 절차는 같지만 GitHub Actions 문법으로 옮긴 것 |
| `.github/workflows/shopjoy-be-illeesam-synol-build.yml` | 배포 없이 컴파일만 확인하는 CI 검증(모든 push마다 실행, 배포와는 무관) |

**`deployDevSynolBe.js` 핵심 로직 요약**:
```
1. gradlew(.bat) clean bootJar -x test           → jar 생성
2. SFTP: jar → NAS /volume1/docker/shopjoy/backend/
3. SSH:  docker compose build                     (새 이미지)
4. SSH:  docker compose up -d --force-recreate ecadminapi
5. SSH:  docker compose ps 를 3초 간격 최대 100회(5분) 반복 — "(healthy)" 뜨면 중단
6. SSH:  curl localhost:21080/actuator/health     → 실제 응답 출력
```

> `docker-compose.yml`/`Dockerfile` 자체의 내용(포트 매핑, healthcheck 설정 등)은 [11번 문서](11_illeesam_synology_BE_수동배포가이드.md)의 "참고" 절 참조.

---

## 문제가 생겼을 때

트러블슈팅/용어는 별도 문서 참조 → [9011_illeesam_synology_BE_트러블슈팅용어.md](9011_illeesam_synology_BE_트러블슈팅용어.md)
