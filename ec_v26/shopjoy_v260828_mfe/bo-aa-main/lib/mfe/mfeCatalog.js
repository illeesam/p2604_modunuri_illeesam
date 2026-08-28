/* mfeCatalog.js — 지연로드용 "가벼운 목차". 실제 화면 코드는 전혀 안 싣고, 어떤
 * 대메뉴(menuKey)에 어떤 도메인 폴더가 어떤 소그룹(중메뉴, group)으로 기여하는지,
 * 그리고 그 안에 어떤 화면(id/label)이 있는지까지 미리 선언한다(2026-08-28 — 처음엔
 * 그룹명까지만 알았는데, "좌측 메뉴에 화면 이름까지 미리 보이면 좋겠다"는 요청으로
 * 화면 목록도 카탈로그에 포함시켰다). 각 manifest.js 의 register() 호출과 id/label이
 * 겹치는 게 유일한 단점인데, 이게 "메뉴 트리 모양은 미리 알아야 하지만 그 화면의
 * 실제 코드(comp)는 나중에 불러온다"는 지연로드 트리 방식의 근본적인 특성이다 —
 * 실제 사내 관리자 시스템도 메뉴는 DB/설정으로 미리 내려주고 화면 번들만 코드
 * 스플리팅하는 경우가 많다.
 *
 * mfe.html / mfe-*.html 이 이 파일 하나만 부팅 시 로드하면, 나머지 7개 도메인의
 * 실제 코드(화면 파일들)는 사용자가 그 "소그룹(중메뉴)" 이나 그 안의 특정 화면을
 * 처음 클릭할 때 window.MFE_REGISTRY.ensureFolderLoaded() 가 그때 가서 그 폴더
 * 하나만 동적으로 불러온다 — 로드 단위는 여전히 "폴더(소그룹) 하나"다(화면 하나만
 * 콕 집어 로드하진 않는다 — 같은 폴더 안의 화면들은 어차피 한 manifest.js 가
 * 한꺼번에 register() 하므로).
 *
 * 이 파일이 셸(mfe.html)이 아는 유일한 "도메인 목록"이다 — 새 도메인을 추가할 때
 * 손대는 곳이 여기 한 줄로 줄어든다.
 */
/* ══════════════ 새 도메인(마이크로 레포) 추가 시 체크리스트 (2026-08-28) ══════════════
 * 1. 형제 폴더 생성 — `bo-aa-main/`과 같은 레벨(중첩 금지). 예: `pd-brand/`
 * 2. 그 폴더 안에 `manifest.js` 작성 — 기존 7개(예: bo-pd-pd/manifest.js) 그대로 베껴서
 *    시작할 것. 지켜야 할 것:
 *      - `const`만 쓴다(`var`/`let` 금지 — 재할당 없는 값은 항상 const, 프로젝트 컨벤션)
 *      - 불러올 스크립트 목록은 `scripts` 변수로, `register()`에 넘길 화면 목록은
 *        `screens` 변수로(내부 컴포넌트가 있으면 `innerComps`도) 먼저 선언한 뒤 주입한다
 *        — Promise.all(...)/register(...) 호출부에 리터럴을 인라인으로 쓰지 않는다
 *      - 마지막에 반드시 `R._domainReady(base)` 호출 — 안 하면 그 폴더를 기다리는
 *        `ensureFolderLoaded()` Promise가 영원히 안 풀린다
 *      - `.catch(function (err) { console.error('[폴더명 manifest] 로드 실패:', err); })`
 *        빠뜨리지 말 것 — 화면 파일 하나만 404여도 전체가 조용히 안 뜨는 원인이 됨
 *      - **`window.컴포넌트명`은 도메인 폴더를 넘어 항상 유일해야 한다** — 원본 프로젝트
 *        컨벤션대로 모든 화면 파일이 `window.ComponentName = {...}`으로 export하는데, 이건
 *        JS 전역이라 다른 도메인 폴더(=별도 git 레포)가 우연히 같은 이름을 쓰면 나중에
 *        로드된 쪽이 조용히 무시된다(2026-08-28, `bo-cu-ba`/`bo-sy-ba` 둘 다 `CmNoticeDtl`을
 *        쓰게 만들어 직접 재현·확인함 — `mfeShell.js`의 `_registerOne()`이 이제 이런 충돌을
 *        `console.warn`으로 알려주지만, 알림일 뿐 원인 제거는 아니다). 새 화면 파일을
 *        만들기 전에 다른 도메인 폴더에 같은 이름이 이미 있는지 확인할 것(주석 안에
 *        glob 을 쓰면 `*` 다음에 `/`가 와서 블록주석을 조기 종료시키므로 폴더를 풀어
 *        나열한다):
 *        `grep -rn "window\.컴포넌트명\s*=" ../bo-ab-home/pages ../bo-pd-pd/pages ../bo-pd-cate/pages ../bo-cu-ba/pages ../bo-cu-co/pages ../bo-sy-ba/pages ../bo-sy-org/pages`
 * 3. 그 폴더 안에 `dev.html` 작성 — 다른 도메인 없이 `../bo-aa-main/`의 공용 런타임 +
 *    자기 `manifest.js` 하나만 정적 로드해서 "이 도메인이 혼자서도 돌아가는지" 확인용.
 *    기존 dev.html(예: bo-sy-ba/dev.html) 그대로 복사 후 스크립트 목록만 자기 화면으로 교체
 * 4. **여기(`mfeCatalog.js`)에 `R.registerCatalog(menuKey, folder, group, screens)` 한
 *    줄 추가** — 이게 셸이 이 새 도메인의 존재를 아는 유일한 지점이다:
 *      - `menuKey` — 기존 대메뉴에 합류(예: 'bo-pd')면 그대로, 완전히 새 대메뉴면
 *        `mfe.html`/`mfe-*.html`의 `mfeBootShell([...])` 호출 배열에도 새 항목 추가 필요
 *      - `group` — 소그룹(중메뉴) 라벨. 기존 대메뉴에 합류할 때 다른 그룹 이름과
 *        겹치지 않게(같은 그룹명이면 좌측 메뉴에서 같은 소그룹으로 섞여 보임)
 *      - `screens` — `[{id, label}, ...]`. **id/label이 `manifest.js`의 `register()`가
 *        넘기는 실제 값과 정확히 같아야 한다** — 안 그러면 로드 전엔 카탈로그 자리표시
 *        이름이 보이다가, 로드 후 실제 항목으로 안 바뀌고 둘 다(자리표시+실제) 보이는
 *        버그가 난다
 *      - 같은 대메뉴 안에서 화면 `id`가 다른 도메인과 겹치면 안 된다(사이드바/탭의
 *        `:key`가 깨짐) — 겹칠 상황이면 `bo-cu-ba`/`bo-cu-co`처럼 접미어(`_co` 등)로 구분
 * 5. `_git_shopjoy-mfe-domain-{도메인명}.txt` 마커 파일 추가 — 다른 도메인 폴더의
 *    파일을 그대로 본떠서, 이 폴더가 실제로는 별도 git 레포라는 걸 문서화(폴더명의
 *    정렬용 접두어는 절대 이 파일 안의 "실제 레포명"에 넣지 않는다)
 * 6. `bo-aa-main/README.md`의 "메뉴 구성" 표에 새 행 추가
 * 7. 수정 끝나면 `node --check` + `&`/`&&` 템플릿 크래시 패턴 스윕(아래 커맨드) —
 *    루트 `CLAUDE.md` "검증 루틴" 참고
 * 이 체크리스트 밖에서 셸(`mfeShell.js`)이나 레지스트리(`mfeRegistry.js`)를 고칠 필요는
 * 없다 — 고쳐야 한다면 그건 "새 도메인 추가"가 아니라 인프라 자체를 바꾸는 작업이다.
 * ════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var R = window.MFE_REGISTRY;

  R.registerCatalog('bo-home', '../bo-ab-home/', null, [
    { id: 'bo-ab-home-dashboardBoEc01', label: 'EC 대시보드 1' },
    { id: 'bo-ab-home-dashboardBoEc02', label: 'EC 대시보드 2' },
  ]);
  R.registerCatalog('bo-pd', '../bo-pd-pd/', '상품', [
    { id: 'bo-pd-pd-pdTagMng', label: '상품태그관리' },
    { id: 'bo-pd-pd-pdRestockNotiMng', label: '재입고알림관리' },
  ]);
  R.registerCatalog('bo-pd', '../bo-pd-cate/', '카테고리', [
    { id: 'bo-pd-cate-pdCategoryMng', label: '카테고리관리' },
    { id: 'bo-pd-cate-pdCategoryProdMng', label: '카테고리상품관리' },
  ]);
  R.registerCatalog('bo-cu', '../bo-cu-ba/', '고객', [
    { id: 'bo-cu-ba-cmNoticeMng', label: '공지사항관리' },
    { id: 'bo-cu-ba-cmFaqMng', label: 'FAQ관리' },
  ]);
  R.registerCatalog('bo-cu', '../bo-cu-co/', '공통업무', [
    { id: 'bo-cu-co-cmNoticeMng', label: '공지사항관리' },
    { id: 'bo-cu-co-cmFaqMng', label: 'FAQ관리' },
  ]);
  R.registerCatalog('bo-sy', '../bo-sy-ba/', '기준정보', [
    { id: 'bo-sy-ba-syBrandMng', label: '브랜드관리' },
    { id: 'bo-sy-ba-syCodeMng', label: '공통코드관리' },
    // bo-sy-ba-cmNoticeDtl — bo-cu-ba/pages/bo/cu/ba/CmNoticeDtl.js 를 그대로 복사해온 파일명/전역명
    // 중복 테스트용(2026-08-28). bo-sy-ba/manifest.js 상단 주석 참고.
    { id: 'bo-sy-ba-cmNoticeDtl', label: '공지사항상세(파일명중복테스트)' },
  ]);
  R.registerCatalog('bo-sy', '../bo-sy-org/', '조직', [
    { id: 'bo-sy-org-syUserMng', label: '사용자관리' },
    { id: 'bo-sy-org-syDeptMng', label: '부서관리' },
  ]);
})();
