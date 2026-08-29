# CLAUDE.md

`shopjoy_v260828_mfe/` 에서 작업할 때 Claude Code(claude.ai/code)가 지켜야 할 이 프로젝트만의
약속을 정리합니다. 이 폴더는 `shopjoy_v260406`(실제 BO 프로젝트)의 리소스를 재사용해
"탑메뉴 기준 마이크로프론트엔드가 무빌드·Vue3 CDN 로컬 로드 구조에서 실제로 성립하는지"
보여주는 데모입니다. 원본 프로젝트의 CLAUDE.md 정책(테이블 별칭, PageResult 필드명 등
백엔드/DB 관련 전부)은 그대로 적용됩니다 — 이 파일은 **이 데모 폴더에서만 추가로 지킬
것**만 다룹니다.

아키텍처 전체 설명(지연로드 동작 원리, 폴더 배치, 실행 방법, 메뉴 구성표, 알려진 한계)은
**[`bo-ap-global/README.md`](bo-ap-global/README.md)**가 단일 소스입니다 — 이 파일과 내용이 겹치면
그쪽이 더 상세합니다.

## 이 폴더 자체는 워크스페이스이지 git 레포가 아니다

`shopjoy_v260828_mfe/` 바로 밑에 `bo-ap-global/`(셸) + 원래 7개 예시 도메인 폴더로
시작했다가, 2026-08-29에 **실제 프로젝트(`shopjoy_v260406`) 좌측 메뉴 전체(12개
대메뉴)를 복제**하면서 도메인 폴더가 한때 34개까지 늘었습니다. 같은 날 후속
재구조화로 "형상관리 단위(git 레포)"와 "지연로드 단위"를 분리해 **11개 레포**
(`bo-ec-mb`/`bo-ec-pd`/`bo-ec-od`/`bo-ec-pm`/`bo-ec-dp`/`bo-ec-cu`/`bo-ec-cm`/
`bo-ec-st`/`bo-md`/`bo-sy`/`bo-zd`)로 다시 합쳤습니다 — 소그룹(중메뉴)별 지연로드
단위는 그대로 유지한 채, 각 레포 **내부**에 소그룹 하위 디렉터리(`bo-ec-mb/member/`,
`bo-ec-mb/grade/` 등)를 두고 그 안에 각자 별도 `manifest.js`를 넣는 방식입니다 —
`mfeCatalog.js`의 `registerCatalog(menuKey, folder, ...)`는 레포 경계가 아니라
**`manifest.js` 파일의 물리적 위치**만 보고 동작하므로, git 레포 수를 줄이면서도
소그룹 단위 지연로드 granularity를 그대로 지킬 수 있습니다. `bo-zd`는 유일하게
**대메뉴 2개**(`bo-devtools`=`bo-zd/devtools/`, `bo-simul`=`bo-zd/simul/`)를 레포
하나가 담당합니다(둘 다 개발자 전용 zd 패키지라 형상관리까지 묶는 게 자연스럽다고
판단) — 나머지는 전부 대메뉴 1개 = 레포 1개입니다(이 원리와 각 레포의 정확한
내부 구조·소그룹 매핑은
[`bo-ap-global/README.md`](bo-ap-global/README.md)의 "형상관리 단위와 지연로드
단위 분리" 절 + "현재 추가된 폴더" 표가 단일 소스). 복제 도메인은 원본 7개 예시와
네이밍 규칙이 다릅니다(아래 "새 도메인 추가" 절의 `id`/`name:` 패턴은 **예시 7개
도메인 전용** — 복제 도메인은 원본 페이지ID가 이미 유일해서, 원본 소스가
`pages/bo/ec/` 밑이면 `bo-ec-{대메뉴코드}-` 접두어를, `pages/bo/sy|md|zd/` 밑이면
`bo-` 접두어만 붙입니다, README 참고). 도메인 레포들은 `bo-ap-global/`과
**완전한 형제**로 놓여 있습니다(중첩 금지). `bo-` 접두어는 정렬용이 아니라
**의미론적** 접두어입니다(2026-08-29, `aa-main`/`ab-home`/... → `bo-aa-main`/
`bo-ap-home`/...로 전면 변경. 셸 폴더는 이후 한 번 더 `bo-aa-main` → `bo-ap-global`로
개명 — "main"이 특정 도메인처럼 읽힐 수 있어 "공용/전역 런타임"이라는 역할을 더
분명히 드러내려는 목적) — 원본 프로젝트의 `bo-`/`fo-` 파일명 규칙(관리자
화면=`bo-`, 사용자 화면=`fo-`)을 폴더 단위로 확장한 것으로, 이 폴더들이 전부
관리자(Back Office) 화면이라는 뜻입니다. `bo-` 뒤의 `aa-`/`ab-` 서브접두어는
예전(2026-08-28) 정렬 관례를 그대로 이어받은 것 — 셸(`bo-ap-global`)이 파일탐색기
최상단 + 홈(`bo-ap-home`)보다 앞에 오도록 `aa < ab` 알파벳순으로 고정한 것뿐입니다
(도메인 레포들은 이런 서브접두어 없이 `bo-{도메인}` 그대로). 어느 경우든 각
레포의 `_git_shopjoy-mfe-*.txt` 마커 파일에 적힌 "실제 git 레포명"에는 이
접두어들을 절대 넣지 않습니다. VS Code에서 Live Server를 쓸 땐 **이 컨테이너
폴더를 워크스페이스로 열어야** `../` 형제 참조가 깨지지 않습니다(`bo-ap-global/`만
단독으로 열면 404).

## 새 도메인(마이크로 레포) 추가 시

체크리스트는 두 곳에 있습니다 — 실제로 손대는 순서대로:
1. **[`bo-ap-global/lib/mfe/mfeCatalog.js`](bo-ap-global/lib/mfe/mfeCatalog.js) 맨 위 주석** —
   6단계 상세 체크리스트(왜 그래야 하는지 이유 포함)
2. **[`bo-ap-global/README.md`](bo-ap-global/README.md)의 "새 도메인(마이크로 레포) 추가하기"** —
   같은 체크리스트 요약

`manifest.js`를 새로 짤 때 지킬 코드 스타일(요약, 근거는 mfeCatalog.js 주석 참고):
- `var`/`let` 금지, **`const`만**(재할당 없는 값은 항상 const)
- `Promise.all([...])`/`register(...)`에 리터럴을 인라인으로 넣지 말고, `scripts`/
  `screens`(+ 내부 컴포넌트가 있으면 `innerComps`) 변수로 먼저 선언한 뒤 주입
- 마지막에 반드시 `R._domainReady(base)` — 안 하면 `ensureFolderLoaded()`가 영원히 안 풀림
- `.catch(...)`로 로드 실패를 콘솔에 남길 것 — 화면 파일 하나만 404여도 전체가 조용히
  안 뜨는 원인이 됨
- **화면 파일은 `export default`(ES 모듈) 필수, `window.ComponentName` 금지**
  (2026-08-29 전체 20개 화면 + 내부 Dtl 컴포넌트 전면 전환 — 처음엔 물리적으로 중복
  존재하는 파일만 예외적으로 전환했는데, 결국 전체를 이 방식으로 통일했다). 자세한
  방법·이유는 바로 아래 "ES 모듈 전환" 절 참고
- **예시 7개 도메인(`bo-ap-global` 밖의 원조 데모 폴더)의 레지스트리 `id`/`name:`
  는 `bo-{대메뉴}-{소그룹}-{원래이름 첫글자 소문자}` 패턴**(예: `PdTagMng` →
  `id:'bo-pd-pd-pdTagMng'`, `name:` 도 동일). 실제 프로젝트 복제 도메인(11개 레포)은
  **`bo-ec-{대메뉴코드}-{소그룹}-{원래이름 첫글자 소문자}`** 패턴을 씁니다(2026-08-29
  같은 날 후속 재구조화로 소그룹 세그먼트를 추가 — 처음엔 소그룹을 안 넣었다가,
  레포 하나가 소그룹 여러 개를 담당하게 되면서 id만 보고 물리적 위치를 못 찾는
  문제가 생겨 소그룹까지 포함하도록 확장했다). 예: `PmEventMng`(`bo-ec-pm/event/`) →
  `id:'pm-event-pmEventMng'`, `name:` 동일 — `{대메뉴코드}`는 레포가 속한 대메뉴
  코드, `{소그룹}`은 화면이 실제로 담긴 하위 디렉터리 이름입니다(크로스도메인
  흡수 화면도 원래 소스 도메인이 아니라 **현재 담긴 위치**를 따릅니다. 예:
  `MbCustInfoMng`가 `bo-ec-cu/ba/`에 흡수됐으면 `id`는
  `'cu-ba-mbCustInfoMng'`), 원본 소스가 `pages/bo/sy|md|zd/` 밑이면(소그룹은
  안 넣고) **`bo-`접두어만** 붙입니다(예: `SyUserMng` → `id:'sy-org-syUserMng'` — sy/md/zd
  는 이 확장 대상이 아닙니다). 둘 다 `id`와 `name:`은
  항상 같은 문자열입니다 — **유일한 예외가 `PdProdMng`**: 5개 형제 화면이
  `<pd-prod-mng>` 태그로 직접 감싸 쓰므로 `name:`은 원본 그대로 `'PdProdMng'`(접두어
  없음)를 유지하고, `id:'pd-pd-pdProdMng'`만 카탈로그 식별자로 접두어를
  붙입니다(자세한 이유는 README 참고). `export default`로 바뀌면서 이 값은 더
  이상 "충돌 방지"용이 아니라(모듈 자체가 전역을 안 쓰니 충돌이 구조적으로
  불가능해짐) 사이드바/탭/URL에 쓰이는 **화면 식별자**로서의 역할만 남았다 —
  그래도 값은 그대로 유지한다(이미 카탈로그와 맞춰뒀고, 바꿀 이유가 없음)

## ES 모듈 전환 (2026-08-29, 전체 화면 적용)

셸/레지스트리/Vue/Pinia/coUtil/공용 컴포넌트(`BoGrid` 등)는 **classic `<script>` +
`window.*` 전역 그대로**(도메인 간 중복이 없어 애초에 충돌 위험이 없다). **도메인
화면 파일 20개만** `window.ComponentName = {...}` 대신 `export default {...}`로
바꿨다 — 처음엔 "물리적으로 중복 존재하는 파일만" 예외적으로 전환했는데, 실제로
`bo-ec-cu-ba`/`bo-ec-cu-co`가 `CmNoticeMng.js`/`CmFaqMng.js`도 중복 복사돼 있었던 걸
발견한 뒤로 "언제 전환할지 판단"보다 "화면 파일은 전부 이 방식"으로 확정했다:

```js
// 화면 파일 — window 전역에 자기를 안 씀
export default { name: 'bo-sy-ba-cmNoticeDtl', ... };

// manifest.js — loadScript() 대신 loadModule()
const scripts = [ R.loadModule(base + 'pages/bo/sy/ba/CmNoticeDtl.js'), ... ];
Promise.all(scripts).then(function (results) {
  const screens = [{ id: '...', comp: results[0].default, ... }]; // 모듈 네임스페이스 → default export
  ...
});
```

- `loadScript()`(classic `<script>`)와 `loadModule()`(동적 `import()`)는 같은 `manifest.js`의
  `Promise.all([...])` 배열 안에 섞어 써도 무방하다 — 다만 지금은 화면 파일이 전부
  ESM이라 실제로는 각 `manifest.js`가 `loadModule()`만 쓴다
- Vue/coUtil/boApiSvc 등 공용 전역을 읽는 코드는 모듈 안에서도 그대로 동작한다(모듈은
  전역을 "쓰지만" 않을 뿐, "읽는" 건 classic 스크립트와 동일 — `setup()`/`template`/props
  등 화면 내부 로직은 원본과 100% 동일, 바뀌는 건 맨 위 export 방식뿐)
- `registerComponents([{tag:'CmNoticeDtl', comp: ...}])`의 `tag`는 그대로 문자열
  하드코딩이다 — `<cm-notice-dtl>` 템플릿 태그는 `comp.name`이 아니라 이 `tag`로 찾으므로
  ESM 전환과 무관하게 안 바뀐다
- `dev.html`은 손댈 필요 없음 — `manifest.js` 자체는 여전히 `<script src="manifest.js">`로
  불리고, 그 **안에서만** `import()`를 쓰는 거라 즉시로드/지연로드 둘 다 그대로 동작
- 브라우저 네이티브 ESM(정적 `import`/동적 `import()`) 지원은 2017~2019년부터 사실상
  전 브라우저에 있음 — 신기술 아님. 유일한 주의점은 서버가 `.js`를 올바른 MIME
  타입(`text/javascript`)으로 서빙해야 한다는 것(Live Server는 기본으로 맞음)
- 새 화면을 추가할 때도 처음부터 `export default`로 쓴다 — `window.ComponentName`
  방식으로 새로 짜지 말 것

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
| 같은 대메뉴에 기여하는 두 폴더(`bo-ec-cu-ba`/`bo-ec-cu-co`)를 열면 화면이 하얗게 빔 | 두 폴더가 같은 `window.CmNoticeMng` 등 전역명을 공유하는데 `Promise.all`로 병렬 로드하면 레이스 컨디션 발생 | `mfeRegistry.js` — `ensureMenuLoaded`를 **순차**(`for...of`+`await`) 로드로 전환 |
| 한 번 로드 실패한 소그룹은 재클릭해도 영원히 같은 실패만 재현(새로고침 전엔 재시도 불가) | `ensureFolderLoaded`가 실패 시 `pendingLoads[key]`를 안 지워서 rejected Promise가 캐시에 영구히 남음 | `mfeRegistry.js` — `onerror`에서도 `delete pendingLoads[key]` |
| (경미) 세션이 길어질수록 `tickListeners` 배열이 계속 자람 | `ensureMenuLoaded`의 카탈로그 없음(dev.html) 폴백 폴링 콜백이 resolve 후에도 배열에서 안 빠짐 | `mfeRegistry.js` — resolve 시 `splice`로 자기 자신 제거 |
| 여러 화면(PdTagMng 등)이 전부 렌더 실패 | `window.boApp`가 정의 안 돼 있어서 각 화면의 `const { showToast } = window.boApp` 구조분해가 setup() 맨 위에서 throw | `mfeShell.js` — `window.boApp = { showToast, showConfirm }` 부여 |
| 서로 다른 도메인 폴더가 같은 `window.컴포넌트명`을 쓰면 나중 것이 아무 경고 없이 무시됨(2026-08-28, `bo-ec-cu-co`+`bo-sy-ba` 둘 다 `CmNoticeDtl`로 재현 — registerComponents 태그 경로와 register() 의 comp.name 폴백 경로가 서로 다른데도 같은 이름으로 부딪힘) | `_registerLoadedComponents()`가 이미 등록된 이름이면 그냥 `return`(비교 없음) | `mfeShell.js` — `_registerOne()`이 이름은 같은데 객체가 다르면 `console.warn`(일반 안전장치, 지금도 유지). 근본 해결은 단계적으로 갔다 — ①이름 분리(`Bo{메뉴}{소그룹}원래이름`)로 우선 봉합 → ②실제로 물리 중복인 `bo-ec-cu-ba`/`bo-sy-ba`의 `CmNoticeDtl.js`만 ES 모듈로 전환 → ③이후 `bo-ec-cu-ba`/`bo-ec-cu-co`의 `CmNoticeMng.js`/`CmFaqMng.js`도 중복 복사된 걸 발견해서 결국 **20개 화면 파일 전체**를 `export default`+`R.loadModule()`로 전환(2026-08-29) — 이제 화면 컴포넌트는 window 전역을 아예 안 쓰므로 이 클래스의 버그 자체가 구조적으로 재발 불가능하다. 자세한 건 아래 "ES 모듈 전환" 절 참고 |

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
