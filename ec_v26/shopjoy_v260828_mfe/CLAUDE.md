# CLAUDE.md

`shopjoy_v260828_mfe/` 에서 작업할 때 Claude Code(claude.ai/code)가 지켜야 할 이 프로젝트만의
약속을 정리합니다. 이 폴더는 `shopjoy_v260406`(실제 BO 프로젝트)의 리소스를 재사용해
"탑메뉴 기준 마이크로프론트엔드가 무빌드·Vue3 CDN 로컬 로드 구조에서 실제로 성립하는지"
보여주는 데모입니다. 원본 프로젝트의 CLAUDE.md 정책(테이블 별칭, PageResult 필드명 등
백엔드/DB 관련 전부)은 그대로 적용됩니다 — 이 파일은 **이 데모 폴더에서만 추가로 지킬
것**만 다룹니다.

아키텍처 전체 설명(지연로드 동작 원리, 폴더 배치, 실행 방법, 메뉴 구성표, 알려진 한계)은
**[`bo-aa-main/README.md`](bo-aa-main/README.md)**가 단일 소스입니다 — 이 파일과 내용이 겹치면
그쪽이 더 상세합니다.

## 이 폴더 자체는 워크스페이스이지 git 레포가 아니다

`shopjoy_v260828_mfe/` 바로 밑에 `bo-aa-main/`(셸) + 7개 도메인 폴더(`bo-ab-home`,
`bo-pd-pd`, `bo-pd-cate`, `bo-cu-ba`, `bo-cu-co`, `bo-sy-ba`, `bo-sy-org`)가 **완전한
형제**로 놓여 있습니다(중첩 금지). `bo-` 접두어는 정렬용이 아니라 **의미론적**
접두어입니다(2026-08-29, `aa-main`/`ab-home`/... → `bo-aa-main`/`bo-ab-home`/...로
전면 변경) — 원본 프로젝트의 `bo-`/`fo-` 파일명 규칙(관리자 화면=`bo-`, 사용자
화면=`fo-`)을 폴더 단위로 확장한 것으로, 이 8개 폴더가 전부 관리자(Back Office)
화면이라는 뜻입니다. `bo-` 뒤의 `aa-`/`ab-` 서브접두어는 예전(2026-08-28) 정렬
관례를 그대로 이어받은 것 — 셸(`bo-aa-main`)이 파일탐색기 최상단 + 홈(`bo-ab-home`)
보다 앞에 오도록 `aa < ab` 알파벳순으로 고정한 것뿐입니다(도메인 폴더들은 이런
서브접두어 없이 `bo-{도메인}` 그대로). 어느 경우든 각 폴더의
`_git_shopjoy-mfe-*.txt` 마커 파일에 적힌 "실제 git 레포명"에는 이 접두어들을 절대
넣지 않습니다. VS Code에서 Live Server를 쓸 땐 **이 컨테이너 폴더를 워크스페이스로
열어야** `../` 형제 참조가 깨지지 않습니다(`bo-aa-main/`만 단독으로 열면 404).

## 새 도메인(마이크로 레포) 추가 시

체크리스트는 두 곳에 있습니다 — 실제로 손대는 순서대로:
1. **[`bo-aa-main/lib/mfe/mfeCatalog.js`](bo-aa-main/lib/mfe/mfeCatalog.js) 맨 위 주석** —
   6단계 상세 체크리스트(왜 그래야 하는지 이유 포함)
2. **[`bo-aa-main/README.md`](bo-aa-main/README.md)의 "새 도메인(마이크로 레포) 추가하기"** —
   같은 체크리스트 요약

`manifest.js`를 새로 짤 때 지킬 코드 스타일(요약, 근거는 mfeCatalog.js 주석 참고):
- `var`/`let` 금지, **`const`만**(재할당 없는 값은 항상 const)
- `Promise.all([...])`/`register(...)`에 리터럴을 인라인으로 넣지 말고, `scripts`/
  `screens`(+ 내부 컴포넌트가 있으면 `innerComps`) 변수로 먼저 선언한 뒤 주입
- 마지막에 반드시 `R._domainReady(base)` — 안 하면 `ensureFolderLoaded()`가 영원히 안 풀림
- `.catch(...)`로 로드 실패를 콘솔에 남길 것 — 화면 파일 하나만 404여도 전체가 조용히
  안 뜨는 원인이 됨
- **`window.컴포넌트명`/`name:`/레지스트리 `id` 는 전부 `Bo{대메뉴}{소그룹}원래이름`
  패턴 필수** (2026-08-29, 14개 화면 전체 + 내부 Dtl 컴포넌트에 소급 적용 — 예:
  `PdTagMng`(`bo-pd-pd`) → `window.BoPdPdPdTagMng`/`name:'BoPdPdPdTagMng'`,
  `id:'boPdPdPdTagMng'`(camelCase는 id에만)). `Bo`는 8개 폴더 전부 공통(관리자 화면
  표시)이고, `{대메뉴}{소그룹}` 부분이 폴더명(`bo-` 및 순수 정렬용 접두어 `aa-`/`ab-`
  제외)에서 기계적으로 나온다 — 새 도메인을 추가할 때도 이 규칙만 따르면 다른 도메인과
  이름이 겹칠지 고민할 필요가 없다(예전엔 "정말 겹칠 때만" 예외적으로 붙였는데, 실제로
  적용해보니 `bo-cu-ba`/`bo-cu-co`가 `CmNoticeMng.js`/`CmFaqMng.js`도 물리적으로
  복사돼 있어서 똑같이 이름이 겹쳐 있었다 — "언제 붙일지 판단"보다 "항상 붙인다"가
  더 안전해서 전체 적용으로 확정). 원본 프로젝트 컨벤션(모든 컴포넌트를
  `window.ComponentName`으로 export)이 JS 전역이라, 다른 도메인이 같은 이름을 쓰면
  나중에 로드된 쪽이 조용히 무시됨 — 실제 `setup()`/`template`/props 등 로직은 원본과
  100% 동일, 바뀌는 건 식별자뿐이다. `mfeShell.js`의 `_registerOne()`이 그래도 충돌이
  남아있으면 `console.warn`으로 알려준다(안전장치, 아래 "버그 재발 방지 메모" 참고).
  파일도 진짜로 여러 도메인에 물리적으로 중복 존재하는 경우(예: `CmNoticeDtl.js`가
  `bo-cu-co`/`bo-sy-ba`에 복사됨)는 `pages/bo/{menu}/{sub}/`처럼 도메인 경로를 실제
  파일 경로에 새겨두면(장차 여러 레포를 하나로 합칠 때 `pages/` 트리가 안 겹침)
  더 좋다 — 각 도메인에 유일하게 하나만 있는 화면 파일까지 옮길 필요는 없다

## 지연로드(lazy load) 단위 = 폴더(소그룹) — 화면 1개 단위 아님

- 카탈로그(`mfeCatalog.js`)는 부팅 즉시 로드 — 화면 이름은 코드 로드 전에도 좌측 메뉴에
  보임(placeholder)
- 실제 코드는 사용자가 **소그룹(중메뉴) 또는 그 안의 화면**을 처음 클릭하는 시점에만
  `ensureFolderLoaded()`로 그 폴더 하나만 로드
- 대메뉴 버튼 클릭(`selectMenu`)은 그 대메뉴에 이미 열려있던 화면이 있으면 그대로 두고,
  처음 들어가는 대메뉴면 **카탈로그의 첫 번째 소그룹만** 자동으로 엶(대메뉴 전체를
  로드하는 게 아님)
- URL 딥링크(`?menu=x&screen=y`)로 바로 들어오는 경우, 카탈로그의 `screens` 목록에서
  그 화면을 갖고 있는 폴더 **하나만** 찾아 로드(카탈로그에 없는 화면이거나 카탈로그
  자체가 없는 `dev.html`일 때만 대메뉴 전체 로드로 폴백)
- 새 폴더/화면을 추가해도 이 granularity 를 그대로 따르면 됩니다 — 대메뉴 단위나
  전체 일괄 로드로 되돌리지 마세요(원래 100+ 도메인 확장을 가정한 성능 설계입니다)

## 이번 세션에서 실제로 겪은 버그 — 재발 방지용 메모

같은 실수를 반복하지 않도록, 원인과 고친 위치를 남깁니다:

| 증상 | 원인 | 고친 곳 |
|---|---|---|
| 메뉴 클릭해도 본문이 계속 비어있음(에러도 없음) | `cfMenuItems`/`cfActiveItem`을 `computed()`로 만들면, `window.MFE_REGISTRY`가 반환하는 비반응형 데이터를 읽어서 로드 완료 후에도 이전 빈 결과를 캐시해버림 | `mfeShell.js` — `computed` 대신 **일반 함수**(`fnMenuItems`/`fnActiveItem`)로 전환 |
| 같은 대메뉴에 기여하는 두 폴더(`bo-cu-ba`/`bo-cu-co`)를 열면 화면이 하얗게 빔 | 두 폴더가 같은 `window.CmNoticeMng` 등 전역명을 공유하는데 `Promise.all`로 병렬 로드하면 레이스 컨디션 발생 | `mfeRegistry.js` — `ensureMenuLoaded`를 **순차**(`for...of`+`await`) 로드로 전환 |
| 한 번 로드 실패한 소그룹은 재클릭해도 영원히 같은 실패만 재현(새로고침 전엔 재시도 불가) | `ensureFolderLoaded`가 실패 시 `pendingLoads[key]`를 안 지워서 rejected Promise가 캐시에 영구히 남음 | `mfeRegistry.js` — `onerror`에서도 `delete pendingLoads[key]` |
| (경미) 세션이 길어질수록 `tickListeners` 배열이 계속 자람 | `ensureMenuLoaded`의 카탈로그 없음(dev.html) 폴백 폴링 콜백이 resolve 후에도 배열에서 안 빠짐 | `mfeRegistry.js` — resolve 시 `splice`로 자기 자신 제거 |
| 여러 화면(PdTagMng 등)이 전부 렌더 실패 | `window.boApp`가 정의 안 돼 있어서 각 화면의 `const { showToast } = window.boApp` 구조분해가 setup() 맨 위에서 throw | `mfeShell.js` — `window.boApp = { showToast, showConfirm }` 부여 |
| 서로 다른 도메인 폴더가 같은 `window.컴포넌트명`을 쓰면 나중 것이 아무 경고 없이 무시됨(2026-08-28, `bo-cu-co`+`bo-sy-ba` 둘 다 `CmNoticeDtl`로 재현 — registerComponents 태그 경로와 register() 의 comp.name 폴백 경로가 서로 다른데도 같은 이름으로 부딪힘) | `_registerLoadedComponents()`가 이미 등록된 이름이면 그냥 `return`(비교 없음) | `mfeShell.js` — `_registerOne()`이 이름은 같은데 객체가 다르면 `console.warn`(일반 안전장치). 이 두 파일은 2026-08-29 `window.BoCuCoCmNoticeDtl`/`window.BoSyBaCmNoticeDtl`로 전역명 자체를 분리 + `pages/bo/{cu/co,sy/ba}/`로 이동해 근본 해결. 이어서 `bo-cu-ba`/`bo-cu-co`가 `CmNoticeMng.js`/`CmFaqMng.js`도 물리적으로 복사돼 있어(동일 문제) `BoCuBaCmNoticeMng` 등으로 똑같이 분리하다가, 결국 14개 화면 전체에 `Bo{메뉴}{소그룹}원래이름` 패턴을 일괄 적용(`bo-cu-ba`의 `CmNoticeDtl`도 이제 `BoCuBaCmNoticeDtl`) |

## Vue 템플릿 크래시 규칙 (원본 프로젝트와 동일 — 이 데모에도 그대로 적용)

`:xxx=`/`@xxx=`/`v-xxx=` **속성값 안에 리터럴 `&`/`&&` 금지** — 이 노빌드 프로젝트가 쓰는
브라우저 런타임 Vue 컴파일러가 크래시합니다. `{{ }}` 텍스트 노드 안의 `&&`는 안전(허용).
`&&`가 필요하면 미리 계산한 boolean/함수로 빼세요(이 프로젝트의 `fnIsActive`,
`fnActiveItemMissingComp`, `flatUnloaded`, `_showSpinner` 패턴 참고).

## 수정 후 검증 루틴 (매번 필수)

`.js` 파일을 고칠 때마다 아래 두 가지를 반드시 돌리고, 결과를 보고합니다:

```bash
# 1) 구문 오류 확인
node --check <수정한 파일>

# 2) 템플릿 속성값 & / && 크래시 패턴 스윕
grep -nE '(:[a-zA-Z-]+|@[a-zA-Z.]+|v-[a-zA-Z-]+)="[^"]*&' <수정한 파일> | grep -v '&amp;\|&gt;\|&lt;'
```

여러 파일을 고쳤거나 확신이 없으면, 프로젝트 전체를 훑습니다:

```bash
for f in $(find . -name "*.js" -not -path "*/assets/cdn/*"); do node --check "$f" || echo "FAIL: $f"; done
```

## 로그인 / 테스트 계정

백엔드는 `shopjoy_v260406`과 완전히 공유합니다(`localhost:3000`, 같은 DB·같은 계정).
로그인 화면의 테스트 계정 목록(`admin1`/`admin2`/`user1`, 비밀번호 전부 `1111`)은
**클릭하면 그대로 자동 로그인**됩니다(`mfeShell.js`의 `quickLogin()`) — 새 계정을
추가로 안내하고 싶으면 로그인 화면 템플릿의 `.mfe-quick-login` 블록에 줄만 추가하면
됩니다(별도 API 경로 필요 없음, `doLogin()` 재사용).
