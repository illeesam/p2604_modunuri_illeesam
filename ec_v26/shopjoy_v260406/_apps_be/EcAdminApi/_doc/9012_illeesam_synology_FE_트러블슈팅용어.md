# 프론트(FO/BO 화면) 배포 — 트러블슈팅/용어 (참고자료)

작성일: 2026-09-02
관련 문서: [12_illeesam_synology_FE_수동배포가이드.md](12_illeesam_synology_FE_수동배포가이드.md)

## 겪었던 문제 목록

| # | 증상 | 원인 | 해결 |
|---|---|---|---|
| 1 | FileZilla 같은 SFTP 프로그램으로 `/volume1/docker/shopjoy/frontend` 접속 시 "그런 폴더 없음" 에러 | Synology SFTP는 접속 즉시 `/volume1`을 접속 루트(`/`)로 취급함 | SFTP 프로그램에서는 **`/docker/shopjoy/frontend`**로 접속 (`ssh`/`scp`/SSH 터미널은 실제 경로 `/volume1/...` 그대로 사용) |
| 2 | 화면은 정상 뜨는데 로그인/목록 조회가 안 됨 | 프론트(화면)와 백엔드(API 서버)는 **서로 다른 배포** — 백엔드(EcAdminApi) 컨테이너가 안 떠 있거나 문제 있는 것 | [11_illeesam_synology_BE_수동배포가이드.md](11_illeesam_synology_BE_수동배포가이드.md) STEP 5로 백엔드 상태부터 확인 |
| 3 | 브라우저에 옛날 화면이 계속 보임 | 브라우저 캐시가 꼬임(app JS/CSS/HTML은 `Cache-Control: no-cache`라 매번 서버 확인은 하지만, 그래도 남는 경우 있음) | **Ctrl+Shift+R**(강력 새로고침) 또는 시크릿 창으로 열어서 확인 |
| 4 | 로그인 버튼 클릭 시 콘솔에 `Cannot read properties of undefined (reading 'digest')` 에러, 로그인 안 됨 (2026-09-04 발견) | 로그인 비밀번호를 SHA-256으로 해싱해서 보내는 코드(`coUtil.cofSha256`)가 브라우저의 `crypto.subtle` API를 씀 — 이 API는 **HTTPS 또는 localhost에서만** 존재(브라우저 "보안 컨텍스트" 제한). 평문 HTTP(`http://illeesam.synology.me:21000`)로 접속하면 `crypto.subtle`이 `undefined` | 임시: `crypto-js` 라이브러리로 HTTP에서도 로그인되게 우회(이미 `bo.html`/`index.html`에 적용됨). **근본 해결은 HTTPS 전환** → [13_illeesam_synology_FE_HTTPS_설정가이드.md](13_illeesam_synology_FE_HTTPS_설정가이드.md) 참조 |

## 용어 설명

| 용어 | 뜻 |
|---|---|
| `dist/` | `npm run build`로 만든, 실제 배포용 압축본 폴더(원본 소스는 그대로, 이건 사본) |
| minify(압축) | JS/CSS의 불필요한 공백·줄바꿈을 지우고 변수명을 줄여서 용량을 줄이는 작업 |
| lazy 클래스 정합성 검증 | 압축 후에도 화면 코드가 제대로 연결되는지(깨지지 않는지) 자동으로 확인하는 절차 |
| nginx | 웹서버 프로그램. 여기서는 `frontend/` 폴더 안 파일을 그대로 사용자에게 보여주는 역할 |
| no-cache | "매번 서버한테 최신인지 확인하고 받아라"는 캐시 정책 (완전히 캐시 안 하는 것과는 다름) |
