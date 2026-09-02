# 프론트(FO/BO 화면) → 자동 배포 (빠른 실행 가이드)

작성일: 2026-09-04
대상: Docker/서버 배포 경험이 적은 개발자

명령어 하나로 [12_illeesam_synology_FE_수동배포가이드.md](12_illeesam_synology_FE_수동배포가이드.md)의 STEP들을 대신 실행해줍니다. **방식이 2가지**입니다:

| | `npm run deploy:fe-dev-synol` | `npm run deploy:dev-github` |
|---|---|---|
| 누가 실행하나 | **내 컴퓨터**가 직접 NAS에 SSH 접속 | **GitHub 서버**가 대신 실행 |
| 속도 | 빠름(바로 시작) | 느림(커밋 push 후 GitHub이 처리하는 몇 분 대기) |
| 내 컴퓨터를 꺼도 되나 | ❌ | ✅ |
| GitHub Pages도 같이 배포되나 | ❌ (Synology NAS만) | ✅ (Synology NAS + GitHub Pages 둘 다) |
| 사전 준비 | `scripts/.synology-deploy.env`에 NAS 접속정보 필요 | GitHub 리포지토리 시크릿 등록 필요 |

**Synology NAS만 빠르게 반영하고 싶으면 `deploy:fe-dev-synol`, GitHub Pages까지 같이 갱신하려면 `deploy:dev-github`을 쓰세요.** 백엔드도 같이 배포하려면 [14번 문서](14_illeesam_synology_BE_자동배포가이드.md)의 `deploy:be-dev-synol`을 이어서 실행하세요.

---

## 방식 A — `npm run deploy:fe-dev-synol` (직접 SSH, 권장)

**사전 준비**: `scripts/.synology-deploy.env` 파일이 없다면 먼저 만드세요(딱 1번만, 백엔드 가이드와 공용):
```
SYNOLOGY_HOST=illeesam.synology.me
SYNOLOGY_PORT=10022
SYNOLOGY_USER=illeesam
SYNOLOGY_PASSWORD=실제비밀번호
```
> 이 파일은 `.gitignore`에 등록돼 있어 깃허브에 절대 올라가지 않습니다.

**명령어** (🖥 내 컴퓨터, 프로젝트 폴더에서):
```
~\ec_v26\shopjoy_v260406> npm run deploy:fe-dev-synol
```

**명령어 설명**: `scripts/deployFeDevSynology.js`를 실행합니다. 이 스크립트가 안에서 하는 일 — [12_illeesam_synology_FE_수동배포가이드.md](12_illeesam_synology_FE_수동배포가이드.md)의 STEP 1~4와 완전히 동일합니다.

| 단계 | 하는 일 |
|---|---|
| 1 | `npm run build:dev`로 압축 빌드(`dist/` 생성) |
| 2 | `dist/`를 `dist.tar.gz`로 압축 |
| 3 | SSH(SFTP)로 NAS에 전송 |
| 4 | NAS에서 기존 파일 삭제 후 압축 해제(완전 교체) |

**결과값**: 콘솔에 각 단계가 그대로 출력되고, 마지막에 `[완료] 프론트 배포 끝`이 나오면 성공입니다.

**테스트 방법**: 브라우저로 아래 두 URL 열어보기.
```
https://21000.illeesam.synology.me/index.html
https://21000.illeesam.synology.me/bo.html
```

**테스트 결과**: 화면이 정상적으로 그려지면 성공입니다.

---

## 방식 B — `npm run deploy:dev-github` (GitHub Actions 경유, Synology + GitHub Pages 둘 다)

**사전 준비**가 아직이라면 [21_illeesam_synology_GithubActions_배포가이드.md](21_illeesam_synology_GithubActions_배포가이드.md) 참조(시크릿 등록, GitHub Pages 활성화 등).

**명령어**:
```
~\ec_v26\shopjoy_v260406> npm run deploy:dev-github
```

이 명령은 지금까지 바뀐 파일을 전부 커밋(메시지에 `deploy` 자동 포함)하고 push합니다. 같은 push로 `shopjoy-fe-illeesam-synol-deploy`(NAS)와 `shopjoy-fe-illeesam-github-deploy`(GitHub Pages) 두 워크플로가 함께 실행됩니다.

> ⚠ **GitHub Pages는 백엔드가 같이 안 뜨는 순수 정적 호스팅**이라 API 호출이 실제 백엔드를 가리키도록 `prod` 프로파일 설정이 미리 돼 있어야 합니다 — 자세한 내용은 [13_illeesam_synology_FE_HTTPS_설정가이드.md](13_illeesam_synology_FE_HTTPS_설정가이드.md) 참조.

**테스트 방법**: GitHub 리포지토리 → `Actions` 탭에서 두 워크플로 모두 확인 → 완료 후 위 URL로 최종 확인.

**커밋 없이 수동 실행**: GitHub `Actions` 탭 → `shopjoy-fe-illeesam-synol-deploy` 또는 `shopjoy-fe-illeesam-github-deploy` → `Run workflow` 버튼.

---

## 문제가 생겼을 때

트러블슈팅/용어는 별도 문서 참조 → [9012_illeesam_synology_FE_트러블슈팅용어.md](9012_illeesam_synology_FE_트러블슈팅용어.md)
