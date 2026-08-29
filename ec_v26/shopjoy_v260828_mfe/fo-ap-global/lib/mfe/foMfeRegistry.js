/* foMfeRegistry.js — FO(사용자 페이스) 마이크로프론트엔드 라우트 레지스트리.
 * BO 쪽 mfeRegistry.js(bo-ap-global/lib/mfe/mfeRegistry.js)와 같은 아이디어이지만,
 * FO는 "대메뉴/소그룹/탭"이 아니라 **`?page=xxx` 쿼리스트링 기반 단일 페이지 라우팅**
 * (foAppBase.js 참고 — 2026-08-22에 해시(#page=)에서 쿼리스트링으로 전환됨)이라 구조가
 * 더 단순하다: menuKey/group 개념 없이 pageId → comp 하나짜리 평평한 맵이다.
 *
 * 기존 shopjoy_v260406/lib/app/foAppBase.js 는 index.html이 부팅 시 pages/fo/ 전체를
 * <script> 로 미리 다 불러온 뒤, 그 결과인 전역 컴포넌트를 v-else-if 체인/`window['Home'+N]`
 * 로 직접 참조했다. 이 데모는 그 반대다 — 메인프레임(mfe.html)은 "어떤 페이지가 있는지"
 * 전혀 모른다. 각 도메인 폴더(fo-ap-home/, fo-ec-pd/, fo-ec-od/, fo-ec-my/, fo-ec-cm/, fo-zd/
 * — fo-ap-global/ 의 형제 폴더)가 자기 페이지를 스스로 이 레지스트리에 등록(register)하고,
 * 메인프레임은 `page.value`(=?page= 쿼리값)에 해당하는 컴포넌트를 등록된 것 중에서
 * 그대로 그려주기만 한다.
 *
 * 지연로드 — 실제 페이지 코드는 사용자가 그 페이지로 처음 이동하는 순간에만 불러온다:
 *   1) registerCatalog(pageId, folder) — "이 페이지는 이 폴더가 담당한다"는 가벼운 목차만
 *      미리 등록(코드 없음). foMfeCatalog.js 가 부팅 시 이것만 채운다. 폴더 하나가 여러
 *      pageId를 담당할 수 있다(예: fo-ec-cm 폴더 하나가 about/blog/contact/... 10개를 담당).
 *   2) 사용자가 그 페이지로 이동(navigate) → ensurePageLoaded(pageId) 가 그 폴더의
 *      manifest.js 를 동적 <script> 로 그때 불러온다.
 *   3) manifest.js 는 자기 페이지 파일들을 병렬로 불러온 뒤 register()를 부르고, 마지막에
 *      _domainReady()로 "다 됐다"고 알린다 — 그 폴더가 담당하는 pageId 전부가 한 번에
 *      register() 되므로, 같은 폴더의 다른 페이지로 다시 이동할 땐 추가 로드가 없다.
 * 도메인별 dev.html(단독 실행)은 카탈로그 없이 자기 manifest.js 를 정적 <script> 로
 * 바로 불러오는데, 이 경우도 ensurePageLoaded 가 "카탈로그가 비어있으면 이 페이지에 정적으로
 * 걸린 manifest.js 전부가 register()를 마칠 때까지 기다린다"로 동일하게 처리해 dev.html은
 * 코드 수정이 필요 없다(bo-ap-global/lib/mfe/mfeRegistry.js 의 2026-08-29 버그 수정과
 * 동일한 패턴 — 소그룹 여러 개가 같은 menuKey 아래 나눠 등록될 때 제일 먼저 끝난 것만
 * 반영된 채로 화면이 열려버리던 문제를 "정적 manifest.js 개수만큼 다 기다리기"로 고쳤다). */
window.FO_MFE_REGISTRY = (function () {
  const pages = {};        // { pageId: comp } — 실제 로드 완료된 페이지 컴포넌트만
  const comps = [];        // [{ tag: 'XxxSub', comp }, ...] — 페이지 안에서만 쓰는 내부 전용 컴포넌트
  const catalog = {};      // { pageId: absFolder } — 페이지 하나당 폴더 하나(가벼운 목차, 코드 없음)
  const loadedFolders = new Set();
  const pendingLoads = {}; // { absFolderKey: {promise, resolve, reject} }
  const tickListeners = [];

  /* toAbsFolder — 상대경로('../fo-ec-pd/')를 절대 URL로 정규화. manifest.js 내부에서
     document.currentScript.src 로 얻는 값과 정확히 같은 형식이 되어야 서로 매칭된다. */
  function toAbsFolder(folder) {
    return new URL(folder, document.baseURI).href;
  }

  function bumpTick() {
    tickListeners.slice().forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  }

  return {
    /* register(items) — 도메인이 자신을 스스로 등록. items: [{id, comp}]. 카탈로그로 이미
       만들어진 자리가 있어도 없어도 그냥 upsert — FO는 placeholder 개념(화면 이름 미리
       보여주기)이 없어서(사이드바가 없으므로 미리 보여줄 목록 자체가 없다) BO의 upsert
       로직보다 더 단순하다. */
    register(items) {
      (items || []).forEach((it) => { pages[it.id] = it.comp; });
    },
    /* registerComponents(list) — 페이지 템플릿 안에서만 쓰는 내부 전용 컴포넌트 등록
       (예: My 마이페이지 레이아웃 서브 컴포넌트가 있다면 여기로) */
    registerComponents(list) {
      (list || []).forEach((it) => comps.push(it));
    },
    /* getPage(pageId) — 로드 완료된 페이지 컴포넌트 (없으면 null) */
    getPage(pageId) {
      return pages[pageId] || null;
    },
    getAllComponents() {
      return comps;
    },
    getAll() {
      return pages;
    },

    /* ══════════════ 지연로드 ══════════════ */

    /* registerCatalog(pageId, folder) — "이 페이지는 이 폴더가 담당한다"만 기록.
       코드(comp)는 전혀 안 불러온다 — foMfeCatalog.js 가 부팅 시 이것만 채운다. */
    registerCatalog(pageId, folder) {
      catalog[pageId] = toAbsFolder(folder);
    },
    getCatalogFolder(pageId) {
      return catalog[pageId] || null;
    },
    isFolderLoaded(folder) {
      return loadedFolders.has(toAbsFolder(folder));
    },
    /* ensureFolderLoaded(folder) — 그 폴더의 manifest.js 를 동적 <script> 로 불러온다.
       이미 로드됐거나 로드 중이면 그 Promise 를 재사용(중복 로드 방지). manifest.js 는
       로드가 끝나면 반드시 이 폴더 키로 _domainReady() 를 불러야 이 Promise 가 풀린다. */
    ensureFolderLoaded(folder) {
      const key = toAbsFolder(folder);
      if (loadedFolders.has(key)) return Promise.resolve();
      if (pendingLoads[key]) return pendingLoads[key].promise;
      let resolveFn, rejectFn;
      const promise = new Promise((res, rej) => { resolveFn = res; rejectFn = rej; });
      pendingLoads[key] = { promise, resolve: resolveFn, reject: rejectFn };
      const s = document.createElement('script');
      s.src = key + 'manifest.js';
      s.onerror = () => {
        pendingLoads[key].reject(new Error('manifest.js 로드 실패: ' + s.src));
        delete pendingLoads[key];
      };
      document.head.appendChild(s);
      return promise;
    },
    /* ensurePageLoaded(pageId) — 그 페이지가 이미 로드됐으면 즉시 반환. 카탈로그가 있으면
       그 페이지를 담당하는 폴더 하나만 로드(다른 폴더는 안 건드림). 카탈로그가 없으면
       (dev.html) 이 페이지에 정적으로 걸린 manifest.js "전부"가 register()를 마칠 때까지
       기다린다(bo-ap-global/lib/mfe/mfeRegistry.js 의 ensureMenuLoaded 와 동일한 2026-08-29
       버그 수정 패턴 — 그중 하나만 끝난 시점에 화면을 열면 나머지는 재렌더 트리거가 없어
       계속 안 뜬다). */
    async ensurePageLoaded(pageId) {
      if (pages[pageId]) return;
      const folder = catalog[pageId];
      if (folder) { await this.ensureFolderLoaded(folder); return; }
      const expectedCount = document.querySelectorAll('script[src$="manifest.js"]').length || 1;
      if (loadedFolders.size >= expectedCount) return;
      await new Promise((resolve) => {
        const check = () => {
          if (loadedFolders.size < expectedCount) return;
          const idx = tickListeners.indexOf(check);
          if (idx !== -1) tickListeners.splice(idx, 1);
          resolve();
        };
        tickListeners.push(check);
        check();
      });
    },
    /* _domainReady(folderKey) — manifest.js 가 register() 를 다 끝낸 뒤 호출. */
    _domainReady(folderKey) {
      loadedFolders.add(folderKey);
      if (pendingLoads[folderKey]) { pendingLoads[folderKey].resolve(); delete pendingLoads[folderKey]; }
      bumpTick();
    },
    onLoadTick(fn) { tickListeners.push(fn); },
    /* loadScript(src) — classic <script> 전역(window.ComponentName) 방식 페이지용. FO도
       BO와 동일하게 새 화면은 export default(loadModule)로 짜지만, 기존 호환을 위해 남겨둔다. */
    loadScript(src) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('스크립트 로드 실패: ' + src));
        document.head.appendChild(s);
      });
    },
    /* loadModule(src) — ES 모듈 동적 import(). 화면이 window 전역을 아예 안 쓰므로 다른
       도메인과 파일명이 겹쳐도 구조적으로 충돌이 불가능하다(bo-ap-global 과 동일 원리). */
    loadModule(src) {
      return import(src);
    },
  };
})();
