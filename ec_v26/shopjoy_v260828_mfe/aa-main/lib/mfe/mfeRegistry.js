/* mfeRegistry.js — 마이크로프론트엔드 라우트 레지스트리 (이 데모의 핵심 아이디어)
 *
 * 기존 shopjoy_v260406/lib/app/boAppBase.js 는 신규 화면 추가 시 메인프레임 파일
 * 자체(PAGE_COMP_MAP + v-else-if 체인)를 매번 고쳐야 했다(183개 분기, 3289줄).
 *
 * 이 데모는 그 반대 방향을 보여준다 — 메인프레임(mfe.html)은 "어떤 화면이 있는지" 전혀
 * 모른다. 각 도메인 폴더(ab-home/, pd-pd/, pd-cate/, cu-ba/, cu-co/, sy-ba/, sy-org/ —
 * 메인프레임 aa-main/ 의 형제 폴더)가 자기 화면을 스스로 이 레지스트리에 등록(register)
 * 하고, 메인프레임은 등록된 목록을 그대로 그려주기만 한다. 대메뉴 하나(pd/cu/sy)에
 * 여러 도메인 폴더가 소그룹(group)으로 나눠 기여할 수도 있다(2026-08-28).
 *
 * 실제 분리(git 레포 분리 등)를 한다면: 이 레지스트리 + 아래 lib/*, components/* 는
 * "메인프레임 레포"에 남고, 저 7개 도메인 폴더 각각이 "마이크로 레포"가 된다.
 * 새 도메인을 추가해도 메인프레임 파일은 한 줄(도메인 manifest.js 로드)만 추가하면 된다.
 */
window.MFE_REGISTRY = (function () {
  const menus = {};      // { home: [{id,label,comp}], pd: [...], cm: [...], sy: [...] }
  const comps = [];      // [{ tag: 'CmNoticeDtl', comp: window.CmNoticeDtl }, ...] — 화면 안에서
                          // <cm-notice-dtl> 처럼 내부적으로만 쓰이는 컴포넌트(메뉴에는 안 뜸)도
                          // Vue app.component() 등록은 필요해서 별도로 모아둔다.

  return {
    /* register(menuKey, items) — 도메인이 자신을 스스로 등록. items: [{id, label, comp}] */
    register(menuKey, items) {
      if (!menus[menuKey]) menus[menuKey] = [];
      (items || []).forEach((it) => menus[menuKey].push(it));
    },
    /* registerComponents(list) — 메뉴에 직접 안 뜨는 내부 컴포넌트(Dtl 등) 등록 */
    registerComponents(list) {
      (list || []).forEach((it) => comps.push(it));
    },
    /* getMenu(menuKey) — 특정 메뉴에 등록된 화면 목록 */
    getMenu(menuKey) {
      return menus[menuKey] || [];
    },
    /* getAllComponents() — app.component() 일괄 등록용 */
    getAllComponents() {
      return comps;
    },
    /* getAll() — 전체 등록 현황 (디버깅/개발용) */
    getAll() {
      return menus;
    },
  };
})();
