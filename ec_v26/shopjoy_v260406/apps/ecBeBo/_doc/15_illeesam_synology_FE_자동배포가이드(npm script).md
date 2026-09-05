# 프론트(FO/BO 화면) → 자동 배포 (빠른 실행 가이드)

작성일: 2026-09-04 / npm 스크립트 이름 개편: 2026-09-05
대상: Docker/서버 배포 경험이 적은 개발자

명령어 하나로 [12_illeesam_synology_FE_수동배포가이드(synology).md](<12_illeesam_synology_FE_수동배포가이드(synology).md>)의 STEP들을 대신 실행해줍니다. **방식이 2가지**입니다:

| | `npm run deploy:dev-synol-fe-vue3cdn` | `npm run deploy:dev-github-fe-vue3cdn` |
|---|---|---|
| 누가 실행하나 | **내 컴퓨터**가 직접 NAS에 SSH 접속 | **GitHub 서버**가 대신 실행 |
| 속도 | 빠름(바로 시작) | 느림(커밋 push 후 GitHub이 처리하는 몇 분 대기) |
| 내 컴퓨터를 꺼도 되나 | ❌ | ✅ |
| GitHub Pages도 같이 배포되나 | ❌ (Synology NAS만) | ✅ (Synology NAS + GitHub Pages 둘 다) |
| 사전 준비 | `scripts/.synology-deploy.env`에 NAS 접속정보 필요 | GitHub 리포지토리 시크릿 등록 필요 |

**Synology NAS만 빠르게 반영하고 싶으면 `deploy:dev-synol-fe-vue3cdn`, GitHub Pages까지 같이 갱신하려면 `deploy:dev-github-fe-vue3cdn`을 쓰세요.** 백엔드도 같이 배포하려면 [14번 문서](<14_illeesam_synology_BE_자동배포가이드(npm script).md>)의 `deploy:dev-synol-be-ecAdminApi`를 이어서 실행하거나, 백엔드+프론트를 한 번에 하려면 `npm run deploy:dev-synol-full`을 쓰세요(내부적으로 `deploy:dev-synol-be-ecAdminApi` → `deploy:dev-synol-fe-vue3cdn` 순서로 실행됩니다).

---

## 방식 A — `npm run deploy:dev-synol-fe-vue3cdn` (직접 SSH, 권장)

**사전 준비**: `scripts/.synology-deploy.env` 파일이 없다면 먼저 만드세요(딱 1번만, 백엔드 가이드와 공용):
```
SYNOLOGY_HOST=illeesam.synology.me
SYNOLOGY_PORT=10022
SYNOLOGY_USER=appuser
SYNOLOGY_PASSWORD=appu****************
```
> 이 파일은 `.gitignore`에 등록돼 있어 깃허브에 절대 올라가지 않습니다.

**명령어** (🖥 내 컴퓨터, 프로젝트 폴더에서):
```
~\ec_v26\shopjoy_v260406> npm run deploy:dev-synol-fe-vue3cdn
```

**명령어 설명**: `scripts/deploy-dev-synol-fe-ecFeBo.js`를 실행합니다. 이 스크립트가 안에서 하는 일 — [12_illeesam_synology_FE_수동배포가이드(synology).md](<12_illeesam_synology_FE_수동배포가이드(synology).md>)의 STEP 1~4와 완전히 동일합니다.

| 단계 | 하는 일 |
|---|---|
| 1 | `npm run build:dev`로 압축 빌드(`dist/` 생성) |
| 2 | `dist/`를 `dist.tar.gz`로 압축 |
| 3 | SSH(SFTP)로 NAS에 전송 |
| 4 | NAS에서 기존 파일 삭제 후 압축 해제(완전 교체) |
| 5 | 헬스체크 1/2 — NAS 내부에서 `curl localhost:21000/index.html`, `/bo.html` (nginx가 새 파일을 실제로 서빙하는지) |
| 6 | 헬스체크 2/2 — **이 컴퓨터**에서 실제 공개 주소로 `https://21000.illeesam.synology.me/index.html`, `/bo.html`, `/api/co/sy/code/page`(nginx→백엔드→DB 전체 경로) 확인 |

**결과값**: 콘솔에 각 단계가 그대로 출력되고, 마지막 헬스체크 2/2에서 `index.html`/`bo.html`/`/api/co/sy/code/page` 세 줄이 전부 `200`으로 나오면 성공입니다(`✅ 헬스체크 통과` 문구 확인). `index.html`/`bo.html`만 문제면 12번 문서, `/api/...`만 문제면 백엔드가 안 떠 있는 것이니 [14번 문서](<14_illeesam_synology_BE_자동배포가이드(npm script).md>)의 `deploy:dev-synol-be-ecAdminApi`를 실행하라는 안내가 콘솔에 그대로 출력됩니다.

**테스트 방법(수동, 스크립트가 이미 자동으로 확인하지만 눈으로도 보고 싶을 때)**: 브라우저로 아래 두 URL 열어보기.
```
https://21000.illeesam.synology.me/index.html
https://21000.illeesam.synology.me/bo.html
```

**테스트 결과**: 화면이 정상적으로 그려지면 성공입니다.

> **백엔드+프론트를 한 번에 배포하고 싶으면**: `npm run deploy:dev-synol-full` (= `deploy:dev-synol-be-ecAdminApi` 다음 `deploy:dev-synol-fe-vue3cdn`를 순서대로 실행 — 자세한 백엔드 쪽 내용은 [14번 문서](<14_illeesam_synology_BE_자동배포가이드(npm script).md>) 참조).

---

## 방식 B — `npm run deploy:dev-github-fe-vue3cdn` (GitHub Actions 경유, Synology + GitHub Pages 둘 다)

**사전 준비**가 아직이라면 [22_illeesam_synology_GithubActions_FE_배포가이드.md](22_illeesam_synology_GithubActions_FE_배포가이드.md) 참조(시크릿 등록, GitHub Pages 활성화 등).

**명령어**:
```
~\ec_v26\shopjoy_v260406> npm run deploy:dev-github-fe-vue3cdn
```

이 명령은 지금까지 바뀐 파일을 전부 커밋(메시지에 `deploy(fe): 배포` 포함)하고 push합니다. 같은 push로 `shopjoy-fe-illeesam-synol-deploy`(NAS)와 `shopjoy-fe-illeesam-github-deploy`(GitHub Pages) 두 워크플로가 함께 실행됩니다.

> ⚠ 커밋 메시지의 `(fe)`는 "의도를 남기는 표시"일 뿐입니다 — 실제로 어느 워크플로가 도는지는 GitHub Actions의 경로 필터가 "무엇이 실제로 바뀌었는지"만 보고 정합니다. 백엔드/프론트가 둘 다 바뀐 상태라면 `deploy:dev-github-full`(커밋 메시지 `deploy(full): 배포`)을 쓰는 게 더 정확한 기록이 됩니다 — 세 스크립트(`-be`/`-fe`/`-full`) 모두 실제 동작(커밋+push)은 동일하고 커밋 메시지만 다릅니다.
>
> ⚠ **GitHub Pages는 백엔드가 같이 안 뜨는 순수 정적 호스팅**이라 API 호출이 실제 백엔드를 가리키도록 `prod` 프로파일 설정이 미리 돼 있어야 합니다 — 자세한 내용은 [13_illeesam_synology_FE_HTTPS_설정가이드.md](13_illeesam_synology_FE_HTTPS_설정가이드.md) 참조.

**테스트 방법**: GitHub 리포지토리 → `Actions` 탭에서 두 워크플로 모두 확인 → 완료 후 위 URL로 최종 확인.

**커밋 없이 수동 실행**: GitHub `Actions` 탭 → `shopjoy-fe-illeesam-synol-deploy` 또는 `shopjoy-fe-illeesam-github-deploy` → `Run workflow` 버튼.

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| [`scripts/deploy-dev-synol-fe-ecFeBo.js`](../../../scripts/deploy-dev-synol-fe-ecFeBo.js) | 실제 배포 로직 — `npm run build:dev` → `dist/` 압축(tar.gz) → SFTP 전송 → NAS에서 기존 파일 삭제 후 압축 해제 → 헬스체크 2단계(NAS 내부 + 이 컴퓨터→공개 HTTPS 주소, API까지 확인) |
| [`scripts/synology-deploy-util.js`](../../../scripts/synology-deploy-util.js) | (14번 문서와 동일 공유 파일) SSH/SFTP 공통 로직 |
| [`scripts/build-minify.js`](../../../scripts/build-minify.js) | `npm run build:dev` 내부에서 실행되는 실제 빌드 로직(esbuild minify + `lib/env/profiles/*.dev.js` 프로파일 적용) |
| `scripts/.synology-deploy.env` | (14번 문서와 동일 공유 파일) NAS 접속정보 — `.gitignore` 처리돼 있어 깃허브에 안 올라감 |
| `package.json`의 `deploy:dev-synol-fe-vue3cdn` | `node scripts/deploy-dev-synol-fe-ecFeBo.js`를 실행하는 npm 스크립트 별칭 |
| `package.json`의 `deploy:dev-synol-full` | `deploy:dev-synol-be-ecAdminApi` → `deploy:dev-synol-fe-vue3cdn` 순서 실행(백엔드+프론트 한 번에) |
| `package.json`의 `deploy:dev-github-be-api`/`-fe`/`-full` | (방식 B) 커밋 메시지만 다르고 동작은 동일한 `git add && commit && push` — 실제 배포 대상은 GitHub Actions 경로 필터가 결정 |
| `.github/workflows/shopjoy-fe-illeesam-synol-deploy.yml` | (방식 B) NAS에 프론트 배포하는 GitHub Actions 워크플로 |
| `.github/workflows/shopjoy-fe-illeesam-github-deploy.yml` | (방식 B) GitHub Pages에 프론트 배포하는 워크플로(같은 push로 동시 실행) |

**`deploy-dev-synol-fe-ecFeBo.js` 핵심 로직 요약**:
```
1. npm run build:dev                              → dist/ 생성(minify + dev 프로파일 API 주소 적용)
2. tar -czf dist.tar.gz -C dist .
3. SFTP: dist.tar.gz → NAS /volume1/docker/shopjoy/
4. SSH:  기존 frontend/ 폴더 비우고 압축 해제(완전 교체)
5. SSH:  헬스체크 1/2 — NAS 내부 curl로 localhost:21000/index.html, /bo.html 확인
6. 로컬:  헬스체크 2/2 — 이 컴퓨터에서 https://21000.illeesam.synology.me 로 index.html/bo.html/
          /api/co/sy/code/page(nginx→백엔드→DB) 3개를 병렬 요청, 전부 200이어야 통과
```

> nginx가 이 `frontend/` 폴더를 어떻게 서빙하는지(볼륨 마운트, MIME 타입 등)는 [12번 문서](<12_illeesam_synology_FE_수동배포가이드(synology).md>)의 "참고" 절 참조.

---

## 문제가 생겼을 때

트러블슈팅/용어는 별도 문서 참조 → [9012_illeesam_synology_FE_트러블슈팅용어.md](9012_illeesam_synology_FE_트러블슈팅용어.md)
