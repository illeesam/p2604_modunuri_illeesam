# ShopJoy MFE Demo

`shopjoy_v260406` (기존 BO) 의 실제 리소스를 재사용해서, "탑메뉴 기준 마이크로프론트엔드"가
지금 이 프로젝트 구조(무빌드 · Vue3 CDN 로컬 로드)에서 실제로 성립하는지 보여주는 샘플입니다.

## 무엇을 보여주는가

기존 `lib/app/boAppBase.js` 는 신규 화면을 추가할 때마다 메인프레임 파일 자체
(`PAGE_COMP_MAP` + `v-else-if` 체인 183분기, 3,289줄)를 고쳐야 했습니다. 이 데모는 그
반대 구조를 보여줍니다:

- **메인프레임(셸)**: `bo-aa-main/mfe.html` + `bo-aa-main/lib/mfe/mfeShell.js` — Vue/Pinia 부트,
  로그인, 토스트/컨펌, 좌측 메뉴/열린 탭 UI만 담당. **어떤 화면이 있는지 전혀 모릅니다.**
- **마이크로 도메인**: `bo-ab-home/`, `bo-pd-pd/`, `bo-pd-cate/`, `bo-cu-ba/`, `bo-cu-co/`, `bo-sy-ba/`, `bo-sy-org/` —
  `bo-aa-main/`의 **형제(sibling) 폴더**로 존재합니다(= 각자 별도 git 레포라는 뜻을 폴더 배치
  자체로 표현). 각자 `manifest.js` 안에서 자기 화면 스크립트를 로드하고
  `window.MFE_REGISTRY.register(...)`로 **스스로** "나는 이 대메뉴의 이 소그룹에 속한다"고
  등록합니다.

셸은 `bo-aa-main/lib/mfe/mfeRegistry.js`(레지스트리)에 등록된 내용을 그려주기만 합니다.
새 도메인을 추가해도 `bo-aa-main/lib/mfe/mfeCatalog.js`에 한 줄만 추가하면 됩니다 —
`boAppBase.js`처럼 셸 내부의 라우팅 테이블을 고칠 필요가 없습니다.

## 지연로드(lazy load) — 화면 코드는 처음 클릭할 때만 불러옵니다 (2026-08-28)

처음엔 `mfe.html`이 부팅 시점에 7개 도메인의 `manifest.js`를 전부 정적 `<script>`로
나열해서, 열자마자 다 로드했습니다. 하지만 도메인이 100개·1,000개로 늘어난다면 이건
그대로 원본 `bo.html`(모놀리식)과 똑같은 "전부 강제 로드" 문제를 반복하는 셈입니다.
그래서 **실제 지연로드 구조로 바꿨습니다** — 사용자가 그 대메뉴를 처음 클릭하는 순간에만
그 대메뉴에 기여하는 도메인들의 코드를 불러옵니다.

### 어떻게 동작하는가

1. **카탈로그(가벼운 목차)** — `bo-aa-main/lib/mfe/mfeCatalog.js` 가 "어느 대메뉴에 어느
   폴더가 기여하는지"만 선언합니다(코드는 전혀 안 실림):
   ```js
   R.registerCatalog('bo-pd', '../bo-pd-pd/');
   R.registerCatalog('bo-pd', '../bo-pd-cate/');
   ```
2. **부팅 시** `mfe.html`은 `mfeRegistry.js` + `mfeCatalog.js` 이 두 개만 로드합니다
   (7개 도메인 실제 코드는 전혀 안 실립니다). 좌측 메뉴는 아직 비어있고, 상단바(대메뉴
   버튼)만 카탈로그 정보로 그려집니다.
3. **사용자가 대메뉴를 처음 클릭**하면 `window.MFE_REGISTRY.ensureMenuLoaded(menuKey)`가
   카탈로그에 등록된 그 대메뉴의 폴더들의 `manifest.js`를 그때 `<script>` 태그로 동적
   생성해 불러옵니다. 로딩 중엔 사이드바/본문에 "⏳ 불러오는 중..." 이 뜹니다.
4. **`manifest.js`** 는 (예전 `document.write` 대신) `window.MFE_REGISTRY.loadModule()`로
   자기 화면 파일들을 병렬로 불러온 뒤 `register()`를 호출하고, 마지막에
   `_domainReady()`로 "이 폴더 로드 완료"를 알립니다. `document.write`는 "초기 페이지
   파싱 중"에만 동작하는 방식이라(파싱이 끝난 뒤 부르면 페이지 전체가 지워짐), 나중에
   클릭 시점에 동적으로 불러와야 하는 지연로드와는 애초에 안 맞아서 방식 자체를
   바꿨습니다. `loadModule()`은 네이티브 동적 `import()`를 감싼 것으로(2026-08-29 —
   화면 파일이 전부 `export default` 방식으로 바뀌면서 `loadScript()`(classic
   `<script>` + `window.전역` 읽기) 대신 쓰게 됨), 화면이 window 전역을 아예 안
   거치므로 다른 도메인과 이름이 겹쳐도 구조적으로 충돌이 불가능합니다.
5. 한 번 로드된 대메뉴는 `loadedFolders`에 기록되어, 다시 클릭해도 재로드하지 않고
   바로 전환됩니다.

### 같은 코드로 즉시로드/지연로드 둘 다 지원

`manifest.js`는 자기가 정적 `<script src="manifest.js">`(도메인별 `dev.html`)로
불렸는지, 나중에 동적으로 불렸는지(`mfe.html` 지연로드) 전혀 모릅니다 — 어느 쪽이든
똑같은 코드로 동작합니다. `register()`가 "이미 카탈로그로 만들어진 자리가 있으면
채우고, 없으면 새로 추가"하는 upsert 방식이라 가능한 일입니다. 그래서
`bo-ab-home/dev.html`처럼 도메인 하나만 단독 실행하는 화면은 코드 수정이 전혀 필요
없었습니다.

### 대메뉴 하나 = 여러 마이크로 레포 (2026-08-28)

실제 BO 사이드바(좌측 메뉴 안에 "고객" · "고객센터" · "공통업무" 같은 소그룹이 여러 개
있는 것)를 재현하기 위해 **하나의 대메뉴에 여러 레포가 각자 소그룹으로 기여**합니다:

| 대메뉴 | 기여 레포 | 소그룹(`group`) |
|---|---|---|
| 🏠 홈 | `bo-ab-home/` | (그룹 없음 — 평평하게 표시) |
| 📦 상품관리 | `bo-pd-pd/` | 상품 |
| 📦 상품관리 | `bo-pd-cate/` | 카테고리 |
| 💬 고객센터 | `bo-cu-ba/` | 고객 |
| 💬 고객센터 | `bo-cu-co/` | 공통업무 |
| ⚙️ 시스템 | `bo-sy-ba/` | 기준정보 |
| ⚙️ 시스템 | `bo-sy-org/` | 조직 |

각 `manifest.js`가 `register(menuKey, items)`를 호출할 때 항목에 `group: '소그룹명'`을
같이 넘기면, 셸(`mfeShell.js`의 `groupedMenuOf()`)이 **같은 대메뉴로 등록된 모든 레포의
항목을 group 기준으로 묶어** 좌측 메뉴에 그립니다. 대메뉴 하나를 클릭하면
`ensureMenuLoaded()`가 그 대메뉴에 기여하는 폴더 전부(예: `pd` → `bo-pd-pd`+`bo-pd-cate`)를
병렬로 지연로드합니다.

## UI — 좌측 메뉴 / 열린 탭 / URL 라우팅

`boAppBase.js`의 실제 BO 레이아웃을 최소 구성으로 재현했습니다:
- **좌측 메뉴**: 상단에서 고른 대메뉴의 소그룹 + 화면만 보여줍니다(다른 대메뉴 항목은 안 그림 — 실제 bo.html과 동일 패턴). 로딩 중엔 스피너가 뜹니다.
- **열린 탭**: 좌측 메뉴에서 화면을 클릭하면 상단에 탭으로 "열리고" 유지됩니다(같은 화면 다시 클릭 시 탭 재사용). 탭 클릭으로 전환, ✕로 개별 탭 닫기 — `boAppBase.js`의 `openTabs` 배열과 동일한 개념입니다.
- **URL 라우팅**: 화면 전환 시 주소창이 `?menu=bo-pd&screen=bo-pd-pd-pdTagMng`처럼 바뀝니다(`history.pushState`). 새로고침해도 같은 화면이 유지되고, 브라우저 뒤로/앞으로가기도 동작하며, 특정 화면 URL을 그대로 복사해 공유할 수 있습니다.

## 폴더 배치 — 컨테이너 하나 안에 8개의 완전한 형제 폴더

`shopjoy_v260828_mfe/` 는 그 자체가 git 레포가 아니라, **8개의 독립 레포를
한 워크스페이스로 묶어 보여주는 컨테이너 폴더**입니다. 그 바로 밑에 전부 **완전한 형제**로
놓입니다 — 어느 쪽도 다른 쪽 안에 중첩되지 않습니다(중첩되면 나중에 각 폴더에서
`git init`할 때 부모가 이미 추적 중인 트리 안에 자식 저장소가 끼는 꼴이 되어 "독립 레포"
라는 의도와 모순됩니다). `bo-` 접두어는 정렬용이 아니라 **의미론적** 접두어입니다
(2026-08-29, `aa-main`/`ab-home`/`pd-pd`/... → `bo-aa-main`/`bo-ab-home`/`bo-pd-pd`/...
로 전면 변경) — 원본 프로젝트의 `bo-`/`fo-` 파일명 규칙(관리자 화면은 `bo-`, 사용자
화면은 `fo-`)을 폴더 단위로 그대로 확장한 것으로, 이 8개 폴더가 전부 **관리자(Back
Office) 화면**이라는 뜻입니다(나중에 사용자 페이스 마이크로 도메인을 추가한다면
`fo-*`가 될 자리). `bo-` 뒤의 `aa-`/`ab-` 서브접두어는 예전(2026-08-28) 정렬 관례를
그대로 이어받은 것 — 셸(`bo-aa-main`)이 파일탐색기 최상단 + 홈(`bo-ab-home`)보다
앞에 오도록 `aa < ab` 알파벳순으로 고정한 것뿐입니다(도메인 폴더들은 이런 서브
접두어 없이 `bo-{도메인}` 그대로). 어느 경우든 실제 git 레포명(`shopjoy-mfe-shell`,
`shopjoy-mfe-domain-home` 등)에는 이 접두어들을 넣지 않습니다:

```
shopjoy_v260828_mfe/     ← 컨테이너(워크스페이스)일 뿐, 이 자체는 git 레포 아님
├── bo-aa-main/                       ← git 레포 1  (메인프레임 셸)
│   └── mfe.html, lib/, components/, assets/, pages/base/
├── bo-ab-home/                       ← git 레포 2  (홈)
├── bo-pd-pd/                         ← git 레포 3  (상품관리 > 상품)
├── bo-pd-cate/                       ← git 레포 4  (상품관리 > 카테고리)
├── bo-cu-ba/                         ← git 레포 5  (고객센터 > 고객)
├── bo-cu-co/                         ← git 레포 6  (고객센터 > 공통업무)
├── bo-sy-ba/                         ← git 레포 7  (시스템 > 기준정보)
└── bo-sy-org/                        ← git 레포 8  (시스템 > 조직)
```

각 도메인 폴더의 `manifest.js`는 `document.currentScript.src`로 **자기 자신이 어디서
로드됐는지**를 알아내 그 기준으로 자기 `pages/`를 찾습니다 — 그래서 셸이 이 폴더를
형제 폴더로 참조하든, 나중에 완전히 다른 CDN 오리진에서 절대 URL로 참조하든 항상
정확히 동작합니다(도메인 코드가 셸의 물리적 위치를 몰라도 되는 게 핵심).

**Live Server 실행 시**: `mfe.html`이 `../bo-ab-home/manifest.js`처럼 형제 폴더를 참조하므로,
VS Code에서 **`shopjoy_v260828_mfe/`(컨테이너 폴더)를 워크스페이스로 열어야**
8개 형제 폴더가 전부 같은 서버 루트 아래 놓여서 `../` 참조가 정상 동작합니다
(`bo-aa-main/` 폴더만 단독으로 열면 `../`가 서버 밖으로 나가 404가 납니다).

실제로 git 레포를 나눈다면: 8개 폴더 각각의 안에서 그대로 `git init`만 하면 바로 8개의
독립 레포가 됩니다 — 폴더 배치가 이미 끝나 있으니 추가 재배치가 필요 없습니다. 컨테이너
폴더(`shopjoy_v260828_mfe/`) 자체는 git 레포로 만들 필요가 없습니다(만들고
싶다면 8개를 submodule로 등록하는 "메타 레포" 용도 정도로만 — 이 데모의 기본 전제는
그것 없이도 동작하는, git 레벨 결합이 없는 방식입니다).

## 대메뉴 일부만 노출하기 — `mfe-{key}.html`

`mfe.html`(대메뉴 4개 전부) / 도메인별 `dev.html`(자기 1개만) 말고, **"이 대메뉴만
상단바에 보이게 하고 싶다"**는 경우가 있습니다. 지연로드 전환 이후로는 `mfe.html`과
`mfe-*.html` 전부 **같은 카탈로그(`mfeCatalog.js`)를 로드**합니다(코드는 안 실리니
비용이 거의 없음) — 차이는 오직 `mfeBootShell()`에 넘기는 대메뉴 배열뿐입니다:

```html
<!-- mfe-sy.html — 상단바에 "시스템"만 뜨게 -->
<script src="lib/mfe/mfeRegistry.js"></script>
<script src="lib/mfe/mfeCatalog.js"></script>
...
<script>
  window.mfeBootShell([{ key: 'bo-sy', label: '시스템', icon: '⚙️' }]);
</script>
```

`mfe-pd.html`(상품관리만), `mfe-cu.html`(고객센터만), 그리고 **대메뉴 2개를 같이
노출**하는 `mfe-sy-pd.html`(시스템+상품관리)까지 만들어뒀습니다 — 매번 대메뉴 배열만
바꾸면 되고, 셸(`mfeShell.js`) 코드는 절대 안 바뀝니다. 어떤 조합이든 실제로 클릭한
대메뉴만 그 자리에서 로드되므로, "이 조합용 진입점을 미리 만들어야 하나"라는 고민 자체가
지연로드 도입 후로는 성능상 크게 중요하지 않습니다(원한다면 상단바 버튼 개수를
줄이는 용도로만 유용).

## 도메인 폴더 각각 단독 실행 — `dev.html`

`mfe.html`만으로는 "도메인이 정말 다른 도메인(같은 대메뉴를 공유하는 형제 레포 포함)
없이도 혼자 돌아가는지"를 확인할 수 없습니다. 그래서 **7개 도메인 폴더 전부에
`dev.html`**을 하나씩 뒀습니다 — 다른 도메인은 전혀 안 불러오고 `../bo-aa-main/`의 공용
런타임(Vue/Pinia/coUtil/BoGrid 등) + **자기 `manifest.js` 하나만** 정적으로 불러와서
그 도메인의 화면만 단독으로 띄웁니다(카탈로그 없이 즉시로드 — 위 "같은 코드로
즉시로드/지연로드 둘 다 지원" 참고).

```
bo-sy-org/dev.html  →  ../bo-aa-main/... (공용 런타임) + manifest.js(자기 자신) 만 로드
                     → window.mfeBootShell([{ key:'bo-sy', ... }])  (메뉴 1개짜리 셸)
                     ※ 같은 대메뉴(bo-sy)를 공유하는 bo-sy-ba 도 전혀 안 불러온다
```

예: `http://127.0.0.1:5500/bo-sy-org/dev.html` 로 접속하면 사용자관리/부서관리 2개만 뜨는
축소판 셸이 보입니다 — bo-sy-ba(브랜드관리/공통코드관리)를 포함해 다른 도메인 코드는 아예
로드되지도 않습니다. 이게 실제로 동작하면 "이 도메인 코드는 셸의 공용 런타임에만
의존하고, 같은 대메뉴를 공유하는 형제 레포를 포함해 다른 도메인들과는 무관하다"는 걸
직접 확인한 셈입니다. `mfe.html`과 `dev.html`은 같은 `window.mfeBootShell(대메뉴목록)`
함수를 쓰고, 넘기는 목록만 다릅니다(`bo-aa-main/lib/mfe/mfeShell.js` 참조).

## 메뉴 구성 (원래 shopjoy_v260406 실제 화면. 로직·템플릿은 그대로, 컴포넌트 식별자만 변경됨)

화면 파일은 전부 `window.ComponentName = {...}` 대신 **`export default {...}`**(ES 모듈)로
바뀌었고(2026-08-29), 레지스트리 `id`/`name:` 옵션값은 **`bo-{대메뉴}-{소그룹}-원래이름`**
패턴으로 통일했습니다 — 예: `PdTagMng`(원본, `bo-pd-pd`) → `id:'bo-pd-pd-pdTagMng'`.
`bo-`는 8개 폴더 전부 공통(관리자 화면)이라 사실상 "이 프로젝트 소속" 표시고, 실제 구분은
`{대메뉴}-{소그룹}` 부분(폴더명에서 `bo-`와 순수 정렬용 접두어를 뺀 나머지)이 합니다.
도메인 폴더 안에서 새로 화면을 추가할 때도 이 패턴을 그대로 따르면 다른 도메인과
`id`가 겹칠 걱정 없이 기계적으로 이름을 지을 수 있습니다 — 다만 진짜 충돌 방지는 이제
`id` 네이밍이 아니라 **ES 모듈 자체**(화면이 window 전역을 아예 안 씀)가 담당합니다.
`pages/` 안 실제 코드(`setup()`/`template`/props 등)는 원본과 완전히 동일합니다 —
바뀐 건 맨 위 export 방식과 식별자뿐.

| 대메뉴 | 소그룹 | 화면 |
|---|---|---|
| 🏠 홈 | — | EC 대시보드1 (`BoHomeDashboardBoEc01`), EC 대시보드2 (`BoHomeDashboardBoEc02`) |
| 📦 상품관리 | 상품 (`bo-pd-pd/`) | 상품태그관리 (`BoPdPdPdTagMng`), 재입고알림관리 (`BoPdPdPdRestockNotiMng`) |
| 📦 상품관리 | 카테고리 (`bo-pd-cate/`) | 카테고리관리 (`BoPdCatePdCategoryMng`), 카테고리상품관리 (`BoPdCatePdCategoryProdMng`) |
| 💬 고객센터 | 고객 (`bo-cu-ba/`) | 공지사항관리 (`BoCuBaCmNoticeMng`+`BoCuBaCmNoticeDtl`), FAQ관리 (`BoCuBaCmFaqMng`+`BoCuBaCmFaqDtl`) |
| 💬 고객센터 | 공통업무 (`bo-cu-co/`) | 공지사항관리 (`BoCuCoCmNoticeMng`+`BoCuCoCmNoticeDtl`), FAQ관리 (`BoCuCoCmFaqMng`+`BoCuCoCmFaqDtl`) — bo-cu-ba 와 로직은 동일한 화면(독립 레포가 각자 등록해도 충돌 없이 동작하는지 확인용), 식별자만 도메인별로 분리 |
| ⚙️ 시스템 | 기준정보 (`bo-sy-ba/`) | 브랜드관리 (`BoSyBaSyBrandMng`), 공통코드관리 (`BoSyBaSyCodeMng`), 공지사항상세·파일명중복테스트 (`BoSyBaCmNoticeDtl`, `bo-cu-ba`의 CmNoticeDtl.js를 복사해온 것 — 도메인별 식별자 분리 사례) |
| ⚙️ 시스템 | 조직 (`bo-sy-org/`) | 사용자관리 (`BoSyOrgSyUserMng`+`BoSyOrgSyUserDtl`), 부서관리 (`BoSyOrgSyDeptMng`) |

## 실행 방법

1. **백엔드는 그대로 재사용** — `shopjoy_v260406/_apps_be/EcAdminApi`를 `localhost:3000`에
   띄워둔 상태여야 합니다(이 데모는 별도 백엔드가 없습니다 — `boApiAxios.js`가
   `http://<현재 접속 호스트>:3000/api/...`로 요청하도록 그대로 복사돼 있습니다).
2. VS Code에서 **`shopjoy_v260828_mfe/`(컨테이너 폴더)를 워크스페이스로 열고**
   `bo-aa-main/mfe.html`을 **Live Server**로 엽니다(형제 폴더 참조 때문에 컨테이너 폴더
   기준으로 열어야 합니다 — 위 "Live Server 실행 시" 참고). `shopjoy_v260406`과 포트만
   다르면 됩니다 — 백엔드 CORS가 `allowedOriginPatterns("*")`라 어떤 포트든 됩니다.
3. 로그인 계정은 `shopjoy_v260406`과 완전히 동일합니다(같은 백엔드·같은 DB). 로그인
   화면에 테스트 계정(`admin1`/`1111` 등)이 안내돼 있습니다.
4. 로그인 후 상단바에서 대메뉴를 클릭하면 그 순간 네트워크 탭에 그 도메인의
   `manifest.js`+화면 파일들이 새로 로드되는 게 보입니다 — 다시 클릭하면 더 이상
   로드되지 않고 즉시 전환됩니다(지연로드 캐시 확인용).

## 재사용 vs 새로 작성 — 무엇이 원본 그대로이고 무엇이 새 코드인가

| 구분 | 내용 |
|---|---|
| **원본 그대로 복사(바이트 단위 동일)** | CDN 라이브러리, `bo-global-style01.css`, `lib/utils/*`, `lib/services/*`, `lib/stores/bo/*`, `components/comp/*`, `components/modals/*` |
| **원본에서 export 방식·식별자만 변경(로직·템플릿·props 등은 100% 동일)** | 20개 화면 파일(14개 메뉴 화면 + Dtl 등 내부 컴포넌트) — `window.ComponentName = {...}`를 `export default {...}`(ES 모듈)로, `name:` 옵션값을 `bo-{대메뉴}-{소그룹}-원래이름`으로 통일(2026-08-29, 도메인 간 이름 충돌을 구조적으로 차단 + 새 도메인 추가 시 이름을 기계적으로 지을 수 있게). 위 "메뉴 구성" 표 참고 |
| **새로 작성** | `lib/mfe/mfeRegistry.js`(레지스트리 — 카탈로그+지연로드+group 필드+`loadModule()` 지원), `lib/mfe/mfeCatalog.js`(도메인 목차), `lib/mfe/mfeShell.js`(단순화된 셸 — 로그인/토스트/컨펌은 `boAppBase.js`와 동일 패턴으로 재작성, 좌측메뉴 2단 그룹핑·열린 탭·URL 라우팅·지연로드 UI 자체 구현, 다중탭 kept 캐시·3/4열 뷰모드·API 응답 패널은 이 데모 범위 밖이라 생략), 각 도메인의 `manifest.js`(자기등록 매니페스트, `document.write` 대신 동적 `import()`+Promise) + `dev.html`(단독 실행용), `mfe.html`/`mfe-*.html`, `assets/css/mfe-style.css` |

## 새 도메인(마이크로 레포) 추가하기

셸(`mfeShell.js`)이나 레지스트리(`mfeRegistry.js`)는 손댈 필요가 없습니다 — 아래 6단계만
지키면 새 도메인이 기존 구조에 그대로 얹힙니다. 전체 체크리스트(더 자세한 이유 포함)는
[`lib/mfe/mfeCatalog.js`](lib/mfe/mfeCatalog.js) 맨 위 주석에 있습니다. 요약:

1. **형제 폴더 생성** — `bo-aa-main/`과 같은 레벨에(중첩 금지). 예: `pd-brand/`
2. **`manifest.js` 작성** — 기존 도메인(예: `bo-pd-pd/manifest.js`)을 그대로 베껴서 시작.
   `var` 대신 `const`, `scripts`/`screens`/`innerComps` 변수로 먼저 선언 후 주입, 마지막에
   `R._domainReady(base)` 필수, `.catch(...)`로 로드 실패 로깅 필수. **화면 파일은
   `export default {...}`(ES 모듈) 필수, `window.ComponentName` 금지**입니다 — 원본
   프로젝트 컨벤션(모든 컴포넌트를 `window.ComponentName`으로 export)은 JS 전역이라,
   다른 도메인이 같은 이름을 쓰면 나중에 로드된 쪽이 조용히 무시되는 문제가 실제로
   있었습니다(2026-08-28, `bo-cu-ba`/`bo-sy-ba`가 둘 다 `CmNoticeDtl`을 쓰게 만들어
   직접 재현·확인). `manifest.js`도 `R.loadScript()` 대신 `R.loadModule()`로 불러오고
   `Promise.all(scripts).then(function (results) { ... results[N].default ... })`처럼
   `.default`를 꺼내 씁니다 — 화면이 window 전역을 아예 안 쓰므로 이름이 겹쳐도
   구조적으로 충돌이 불가능합니다(`mfeShell.js`의 `_registerOne()`은 그래도 만약을
   대비한 `console.warn` 안전장치로 남아있습니다)
3. **`dev.html` 작성** — 다른 도메인 없이 이 도메인 혼자 뜨는지 확인용(기존 걸 복사 후
   스크립트 목록만 교체)
4. **`bo-aa-main/lib/mfe/mfeCatalog.js`에 `registerCatalog(menuKey, folder, group, screens)`
   한 줄 추가** — 셸이 이 도메인의 존재를 아는 유일한 지점. `screens`의 `id`/`label`은
   `manifest.js`의 `register()`가 실제로 넘기는 값과 정확히 일치해야 합니다(안 그러면
   로드 후 카탈로그 자리표시와 실제 항목이 안 바뀌고 같이 보이는 버그가 납니다). 완전히
   새 대메뉴라면 `mfe.html`/`mfe-*.html`의 `mfeBootShell([...])` 배열에도 항목을 추가하세요
5. **`_git_shopjoy-mfe-domain-{도메인명}.txt` 마커 파일 추가** — 다른 도메인 폴더 걸 본떠서
6. **이 README의 "메뉴 구성" 표에 행 추가**

수정 후에는 `node --check` + 아래 스윕 커맨드를 반드시 돌리세요(루트 `CLAUDE.md` 참고):
```bash
grep -nE '(:[a-zA-Z-]+|@[a-zA-Z.]+|v-[a-zA-Z-]+)="[^"]*&' <파일> | grep -v '&amp;\|&gt;\|&lt;'
```

## 알려진 한계 (샘플이라 의도적으로 생략한 것)

- `boAppBase.js`의 다중탭(kept 캐시)·3/4열 뷰모드·API 응답 패널·역할(role) 매핑 등은
  이 데모 목적(라우팅 자기등록 구조 검증)과 무관해서 생략했습니다.
- 소셜 로그인/결제(Toss)/지도 SDK는 로드하지 않습니다(이 화면들이 쓰지 않음).
- Quill/xlsx/jsPDF 등도 이 화면들이 쓰지 않아 로드하지 않습니다 — 도메인이 늘어나서
  이런 라이브러리가 필요해지면, 그 도메인의 `manifest.js`가 자기 스크립트 로드 목록에
  직접 추가하면 됩니다(메인프레임 `mfe.html`을 고칠 필요 없음 — 이것도 "도메인이 자기
  의존성을 스스로 갖고 온다"는 이 구조의 장점 중 하나입니다).
- `bo-cu-ba`/`bo-cu-co` 는 의도적으로 같은 화면(공지사항관리/FAQ관리)을 각자 독립적으로
  등록합니다 — "여러 레포가 같은 화면을 각자 등록해도 안 깨지는지" 확인용 예시라
  실제 프로젝트라면 이렇게 중복 등록하지 않는 게 정상입니다.
- 지연로드 실패(네트워크 오류 등) 시 토스트로만 안내하고 재시도 버튼은 없습니다 —
  다시 그 대메뉴를 클릭하면 재시도됩니다.
