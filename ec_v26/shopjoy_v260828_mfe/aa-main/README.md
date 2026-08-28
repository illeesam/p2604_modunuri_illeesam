# ShopJoy MFE Demo

`shopjoy_v260406` (기존 BO) 의 실제 리소스를 재사용해서, "탑메뉴 기준 마이크로프론트엔드"가
지금 이 프로젝트 구조(무빌드 · Vue3 CDN 로컬 로드)에서 실제로 성립하는지 보여주는 샘플입니다.

## 무엇을 보여주는가

기존 `lib/app/boAppBase.js` 는 신규 화면을 추가할 때마다 메인프레임 파일 자체
(`PAGE_COMP_MAP` + `v-else-if` 체인 183분기, 3,289줄)를 고쳐야 했습니다. 이 데모는 그
반대 구조를 보여줍니다:

- **메인프레임(셸)**: `aa-main/mfe.html` + `mainframe/lib/mfe/mfeShell.js` — Vue/Pinia 부트,
  로그인, 토스트/컨펌, 좌측 메뉴/열린 탭 UI만 담당. **어떤 화면이 있는지 전혀 모릅니다.**
- **마이크로 도메인**: `home/`, `pd-pd/`, `pd-cate/`, `cu-ba/`, `cu-co/`, `sy-ba/`, `sy-org/` —
  `mainframe/`의 **형제(sibling) 폴더**로 존재합니다(= 각자 별도 git 레포라는 뜻을 폴더 배치
  자체로 표현). 각자 `manifest.js` 안에서 자기 화면 스크립트를 로드하고
  `window.MFE_REGISTRY.register(...)`로 **스스로** "나는 이 대메뉴의 이 소그룹에 속한다"고
  등록합니다.

셸은 `mainframe/lib/mfe/mfeRegistry.js`(레지스트리)에 등록된 내용을 그려주기만 합니다.
새 도메인을 추가해도 `mfe.html`에 `<script src="../새도메인/manifest.js">` 한 줄만
추가하면 됩니다 — `boAppBase.js`처럼 셸 내부의 라우팅 테이블을 고칠 필요가 없습니다.

### 대메뉴 하나 = 여러 마이크로 레포 (2026-08-28 확장)

처음엔 대메뉴(홈/상품관리/고객센터/시스템) 하나당 도메인 레포 하나였는데, 실제 BO
사이드바(좌측 메뉴 안에 "고객" · "고객센터" · "공통업무" 같은 소그룹이 여러 개 있는 것)를
재현하기 위해 **하나의 대메뉴에 여러 레포가 각자 소그룹으로 기여**하도록 확장했습니다:

| 대메뉴 | 기여 레포 | 소그룹(`group`) |
|---|---|---|
| 🏠 홈 | `home/` | (그룹 없음 — 평평하게 표시) |
| 📦 상품관리 | `pd-pd/` | 상품 |
| 📦 상품관리 | `pd-cate/` | 카테고리 |
| 💬 고객센터 | `cu-ba/` | 고객 |
| 💬 고객센터 | `cu-co/` | 공통업무 |
| ⚙️ 시스템 | `sy-ba/` | 기준정보 |
| ⚙️ 시스템 | `sy-org/` | 조직 |

각 `manifest.js`가 `register(menuKey, items)`를 호출할 때 항목에 `group: '소그룹명'`을
같이 넘기면, 셸(`mfeShell.js`의 `groupedMenuOf()`)이 **같은 대메뉴로 등록된 모든 레포의
항목을 group 기준으로 묶어** 좌측 메뉴에 그립니다. 셸은 여전히 "누가 등록했는지" 전혀
모르고 레지스트리 결과만 봅니다 — 레포가 늘어나도 셸 코드는 그대로입니다.

## UI — 좌측 메뉴 / 열린 탭 / URL 라우팅

`boAppBase.js`의 실제 BO 레이아웃을 최소 구성으로 재현했습니다:
- **좌측 메뉴**: 대메뉴 4개 + 그 아래 소그룹 + 소그룹별 화면을 항상 펼쳐서 보여줍니다. `MFE_REGISTRY`에 등록된 내용을 그대로 그리는 거라 도메인(레포)이 늘어나면 자동으로 그룹/항목도 늘어납니다.
- **열린 탭**: 좌측 메뉴에서 화면을 클릭하면 상단에 탭으로 "열리고" 유지됩니다(같은 화면 다시 클릭 시 탭 재사용). 탭 클릭으로 전환, ✕로 개별 탭 닫기 — `boAppBase.js`의 `openTabs` 배열과 동일한 개념입니다.
- **URL 라우팅**: 화면 전환 시 주소창이 `?menu=pd&screen=pdTagMng`처럼 바뀝니다(`history.pushState`). 새로고침해도 같은 화면이 유지되고, 브라우저 뒤로/앞으로가기도 동작하며, 특정 화면 URL을 그대로 복사해 공유할 수 있습니다.

## 폴더 배치 — 컨테이너 하나 안에 8개의 완전한 형제 폴더

`shopjoy_v260828_mfe/` 는 그 자체가 git 레포가 아니라, **8개의 독립 레포를
한 워크스페이스로 묶어 보여주는 컨테이너 폴더**입니다. 그 바로 밑에 전부 **완전한 형제**로
놓입니다 — 어느 쪽도 다른 쪽 안에 중첩되지 않습니다(중첩되면 나중에 각 폴더에서
`git init`할 때 부모가 이미 추적 중인 트리 안에 자식 저장소가 끼는 꼴이 되어 "독립 레포"
라는 의도와 모순됩니다):

```
shopjoy_v260828_mfe/     ← 컨테이너(워크스페이스)일 뿐, 이 자체는 git 레포 아님
├── mainframe/                     ← git 레포 1  (메인프레임 셸)
│   └── mfe.html, lib/, components/, assets/, pages/base/
├── home/                          ← git 레포 2  (홈)
├── pd-pd/                         ← git 레포 3  (상품관리 > 상품)
├── pd-cate/                       ← git 레포 4  (상품관리 > 카테고리)
├── cu-ba/                         ← git 레포 5  (고객센터 > 고객)
├── cu-co/                         ← git 레포 6  (고객센터 > 공통업무)
├── sy-ba/                         ← git 레포 7  (시스템 > 기준정보)
└── sy-org/                        ← git 레포 8  (시스템 > 조직)
```

각 도메인 폴더의 `manifest.js`는 `document.currentScript.src`로 **자기 자신이 어디서
로드됐는지**를 알아내 그 기준으로 자기 `pages/`를 찾습니다 — 그래서 셸이 이 폴더를
형제 폴더로 참조하든, 나중에 완전히 다른 CDN 오리진에서 절대 URL로 참조하든 항상
정확히 동작합니다(도메인 코드가 셸의 물리적 위치를 몰라도 되는 게 핵심).

**Live Server 실행 시**: `mfe.html`이 `../ab-home/manifest.js`처럼 형제 폴더를 참조하므로,
VS Code에서 **`shopjoy_v260828_mfe/`(컨테이너 폴더)를 워크스페이스로 열어야**
8개 형제 폴더가 전부 같은 서버 루트 아래 놓여서 `../` 참조가 정상 동작합니다
(`mainframe/` 폴더만 단독으로 열면 `../`가 서버 밖으로 나가 404가 납니다).

실제로 git 레포를 나눈다면: 8개 폴더 각각의 안에서 그대로 `git init`만 하면 바로 8개의
독립 레포가 됩니다 — 폴더 배치가 이미 끝나 있으니 추가 재배치가 필요 없습니다. 컨테이너
폴더(`shopjoy_v260828_mfe/`) 자체는 git 레포로 만들 필요가 없습니다(만들고
싶다면 8개를 submodule로 등록하는 "메타 레포" 용도 정도로만 — 이 데모의 기본 전제는
그것 없이도 동작하는, git 레벨 결합이 없는 방식입니다).

## 같은 대메뉴를 공유하는 레포끼리만 묶어보기 — `mfe-{key}.html`

`mfe.html`(7개 전부) / 도메인별 `dev.html`(자기 1개만) 말고, **"이 대메뉴에 기여하는
레포들만 같이 보고 싶다"**는 경우가 있습니다(예: sy-ba + sy-org 를 같이 띄워서 좌측
메뉴가 기준정보+조직 두 소그룹으로 잘 묶이는지 확인). 이럴 땐 `mfe.html`을 복사해서
**그 대메뉴에 해당하는 manifest.js 줄만 남기고**, `mfeBootShell()`에 그 대메뉴 하나만
넘기면 됩니다 — 셸(`mfeShell.js`) 코드는 손댈 필요가 전혀 없습니다.

예시: `mainframe/mfe-sy.html` — sy-ba + sy-org 두 레포만 로드(다른 5개는 전혀 안 부름):
```html
<!-- 도메인 로드 부분만 mfe.html 과 다름 -->
<script src="../sy-ba/manifest.js"></script>
<script src="../sy-org/manifest.js"></script>
...
<script>
  window.mfeBootShell([{ key: 'sy', label: '시스템', icon: '⚙️' }]);
</script>
```
같은 패턴으로 `mfe-pd.html`(pd-pd+pd-cate), `mfe-cu.html`(cu-ba+cu-co)도 만들어뒀습니다
— 매번 `mfe.html`을 베이스로 복사해 도메인 로드 줄과 `mfeBootShell()` 인자만 그
대메뉴 것으로 바꾸면 끝입니다.

**한 단계 더 — 서로 다른 대메뉴 여러 개를 같이 묶기**: 위 예시들은 전부 "대메뉴 1개 +
그걸 나눠 채우는 레포들"이었는데, `mfeBootShell()`에 넘기는 대메뉴 배열 자체를 2개
이상 넘기면 **서로 다른 대메뉴 여러 개**도 같이 띄울 수 있습니다. `mainframe/mfe-sy-pd.html`
이 예시입니다 — sy-ba/sy-org(대메뉴 sy) + pd-pd/pd-cate(대메뉴 pd) 4개 레포만 로드하고
(home/cu-ba/cu-co 는 안 부름), 상단바엔 시스템/상품관리 두 버튼만 뜹니다:
```html
<script src="../sy-ba/manifest.js"></script>
<script src="../sy-org/manifest.js"></script>
<script src="../pd-pd/manifest.js"></script>
<script src="../pd-cate/manifest.js"></script>
...
<script>
  window.mfeBootShell([
    { key: 'sy', label: '시스템', icon: '⚙️' },
    { key: 'pd', label: '상품관리', icon: '📦' },
  ]);
</script>
```
결국 이 데모의 "조합"은 전부 **도메인 로드 목록 + `mfeBootShell()` 인자, 이 두 곳만
고르는 문제**입니다 — 몇 개를 어떻게 섞든 셸(`mfeShell.js`) 코드는 절대 안 바뀝니다.

## 도메인 폴더 각각 단독 실행 — `dev.html`

`mfe.html`은 7개 도메인을 전부 로드하는 "통합 데모" 화면이라, 이것만으로는 "도메인이
정말 다른 도메인(같은 대메뉴를 공유하는 형제 레포 포함) 없이도 혼자 돌아가는지"를 확인할
수 없습니다. 그래서 **7개 도메인 폴더 전부에 `dev.html`**을 하나씩 뒀습니다 — 다른
도메인은 전혀 안 불러오고 `../aa-main/`의 공용 런타임(Vue/Pinia/coUtil/BoGrid 등) +
**자기 `manifest.js` 하나만** 불러와서 그 도메인의 화면만 단독으로 띄웁니다.

```
sy-org/dev.html  →  ../aa-main/... (공용 런타임) + manifest.js(자기 자신) 만 로드
                     → window.mfeBootShell([{ key:'sy', ... }])  (메뉴 1개짜리 셸)
                     ※ 같은 대메뉴(sy)를 공유하는 sy-ba 도 전혀 안 불러온다
```

예: `http://127.0.0.1:5500/sy-org/dev.html` 로 접속하면 사용자관리/부서관리 2개만 뜨는
축소판 셸이 보입니다 — sy-ba(브랜드관리/공통코드관리)를 포함해 다른 도메인 코드는 아예
로드되지도 않습니다. 이게 실제로 동작하면 "이 도메인 코드는 셸의 공용 런타임에만
의존하고, 같은 대메뉴를 공유하는 형제 레포를 포함해 다른 도메인들과는 무관하다"는 걸
직접 확인한 셈입니다. `mfe.html`과 `dev.html`은 같은 `window.mfeBootShell(대메뉴목록)`
함수를 쓰고, 넘기는 목록만 다릅니다(`mainframe/lib/mfe/mfeShell.js` 참조).

## 메뉴 구성 (전부 shopjoy_v260406 실제 화면 그대로, 수정 없이 복사)

| 대메뉴 | 소그룹 | 화면 |
|---|---|---|
| 🏠 홈 | — | EC 대시보드1 (`DashboardBoEc01`), EC 대시보드2 (`DashboardBoEc02`) |
| 📦 상품관리 | 상품 (`pd-pd/`) | 상품태그관리 (`PdTagMng`), 재입고알림관리 (`PdRestockNotiMng`) |
| 📦 상품관리 | 카테고리 (`pd-cate/`) | 카테고리관리 (`PdCategoryMng`), 카테고리상품관리 (`PdCategoryProdMng`) |
| 💬 고객센터 | 고객 (`cu-ba/`) | 공지사항관리 (`CmNoticeMng`+`CmNoticeDtl`), FAQ관리 (`CmFaqMng`+`CmFaqDtl`) |
| 💬 고객센터 | 공통업무 (`cu-co/`) | 공지사항관리, FAQ관리 (cu-ba 와 동일 화면 — 독립 레포가 각자 등록해도 충돌 없이 동작하는지 확인용) |
| ⚙️ 시스템 | 기준정보 (`sy-ba/`) | 브랜드관리 (`SyBrandMng`), 공통코드관리 (`SyCodeMng`) |
| ⚙️ 시스템 | 조직 (`sy-org/`) | 사용자관리 (`SyUserMng`+`SyUserDtl`), 부서관리 (`SyDeptMng`) |

## 실행 방법

1. **백엔드는 그대로 재사용** — `shopjoy_v260406/_apps_be/EcAdminApi`를 `localhost:3000`에
   띄워둔 상태여야 합니다(이 데모는 별도 백엔드가 없습니다 — `boApiAxios.js`가
   `http://<현재 접속 호스트>:3000/api/...`로 요청하도록 그대로 복사돼 있습니다).
2. VS Code에서 **`shopjoy_v260828_mfe/`(컨테이너 폴더)를 워크스페이스로 열고**
   `aa-main/mfe.html`을 **Live Server**로 엽니다(형제 폴더 참조 때문에 컨테이너 폴더
   기준으로 열어야 합니다 — 위 "Live Server 실행 시" 참고). `shopjoy_v260406`과 포트만
   다르면 됩니다 — 백엔드 CORS가 `allowedOriginPatterns("*")`라 어떤 포트든 됩니다.
3. 로그인 계정은 `shopjoy_v260406`과 완전히 동일합니다(같은 백엔드·같은 DB). 로그인
   화면에 테스트 계정(`admin1`/`1111` 등)이 안내돼 있습니다.

## 재사용 vs 새로 작성 — 무엇이 원본 그대로이고 무엇이 새 코드인가

| 구분 | 내용 |
|---|---|
| **원본 그대로 복사(바이트 단위 동일)** | CDN 라이브러리, `bo-global-style01.css`, `lib/utils/*`, `lib/services/*`, `lib/stores/bo/*`, `components/comp/*`, `components/modals/*`, 14개 화면 파일 + Dtl 컴포넌트들 |
| **새로 작성** | `lib/mfe/mfeRegistry.js`(레지스트리 — group 필드 지원), `lib/mfe/mfeShell.js`(단순화된 셸 — 로그인/토스트/컨펌은 `boAppBase.js`와 동일 패턴으로 재작성, 좌측메뉴 2단 그룹핑·열린 탭·URL 라우팅 자체 구현, 다중탭 kept 캐시·3/4열 뷰모드·API 응답 패널은 이 데모 범위 밖이라 생략), 각 도메인의 `manifest.js`(자기등록 매니페스트) + `dev.html`(단독 실행용), `mfe.html`, `assets/css/mfe-style.css` |

## 알려진 한계 (샘플이라 의도적으로 생략한 것)

- `boAppBase.js`의 다중탭(kept 캐시)·3/4열 뷰모드·API 응답 패널·역할(role) 매핑 등은
  이 데모 목적(라우팅 자기등록 구조 검증)과 무관해서 생략했습니다.
- 소셜 로그인/결제(Toss)/지도 SDK는 로드하지 않습니다(이 화면들이 쓰지 않음).
- Quill/xlsx/jsPDF 등도 이 화면들이 쓰지 않아 로드하지 않습니다 — 도메인이 늘어나서
  이런 라이브러리가 필요해지면, 그 도메인의 `manifest.js`가 자기 스크립트 로드 목록에
  직접 추가하면 됩니다(메인프레임 `mfe.html`을 고칠 필요 없음 — 이것도 "도메인이 자기
  의존성을 스스로 갖고 온다"는 이 구조의 장점 중 하나입니다).
- `cu-ba`/`cu-co` 는 의도적으로 같은 화면(공지사항관리/FAQ관리)을 각자 독립적으로
  등록합니다 — "여러 레포가 같은 화면을 각자 등록해도 안 깨지는지" 확인용 예시라
  실제 프로젝트라면 이렇게 중복 등록하지 않는 게 정상입니다.
