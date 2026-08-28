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
 * 지연로드(2026-08-28 확장) — 실제 화면 코드는 사용자가 그 대메뉴를 처음 클릭하는
 * 순간에만 불러온다:
 *   1) registerCatalog(menuKey, folder) — "이 대메뉴엔 이 폴더가 기여한다"는 아주 가벼운
 *      목차만 미리 등록(코드 없음). mfeCatalog.js 가 부팅 시 이것만 채운다.
 *   2) 사용자가 그 대메뉴를 클릭 → ensureMenuLoaded(menuKey) 가 카탈로그에 있는 폴더들의
 *      manifest.js 를 그때 동적으로 <script> 삽입해서 불러온다.
 *   3) manifest.js 는 (document.write 대신) loadScript()로 자기 화면 파일들을 병렬로
 *      불러온 뒤 register()를 부르고, 마지막에 _domainReady()로 "다 됐다"고 알린다.
 * 도메인별 dev.html(단독 실행)은 카탈로그 없이 자기 manifest.js 를 정적 <script> 로
 * 바로 불러오는데, 이 경우도 ensureMenuLoaded 가 "카탈로그가 비어있으면 register()가
 * 불릴 때까지 기다린다"로 동일하게 처리해 코드 수정 없이 그대로 동작한다.
 */
window.MFE_REGISTRY = (function () {
  const menus = {};      // { home: [{id,label,group,comp}], pd: [...], ... } — 실제 로드 완료된 화면만
  const comps = [];      // [{ tag: 'CmNoticeDtl', comp: window.CmNoticeDtl }, ...] — 내부 전용 컴포넌트
  const catalog = {};    // { menuKey: [{folder, group}, ...] } — 폴더 단위 가벼운 목차(코드 없음)
  const loadedFolders = new Set();
  const pendingLoads = {}; // { absFolderKey: {promise, resolve, reject} }
  const tickListeners = [];
  let tick = 0;

  /* toAbsFolder — 상대경로('../pd-pd/')를 절대 URL로 정규화. manifest.js 내부에서
     document.currentScript.src 로 얻는 값과 정확히 같은 형식이 되어야 서로 매칭된다. */
  function toAbsFolder(folder) {
    return new URL(folder, document.baseURI).href;
  }

  function bumpTick() {
    tick++;
    tickListeners.slice().forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  }

  return {
    /* register(menuKey, items) — 도메인이 자신을 스스로 등록. items: [{id, label, group?, comp}].
       카탈로그로 이미 만들어진 자리(같은 id)가 있으면 그 자리를 채우고(upsert), 없으면
       새로 추가한다 — 그래서 manifest.js 코드 하나로 지연로드/즉시로드 양쪽 다 동작한다. */
    register(menuKey, items) {
      if (!menus[menuKey]) menus[menuKey] = [];
      const list = menus[menuKey];
      (items || []).forEach((it) => {
        const existing = list.find((x) => x.id === it.id);
        if (existing) Object.assign(existing, it);
        else list.push(it);
      });
    },
    /* registerComponents(list) — 메뉴에 직접 안 뜨는 내부 컴포넌트(Dtl 등) 등록 */
    registerComponents(list) {
      (list || []).forEach((it) => comps.push(it));
    },
    /* getMenu(menuKey) — 특정 메뉴에 등록(로드 완료)된 화면 목록 */
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

    /* ══════════════ 지연로드 ══════════════ */

    /* registerCatalog(menuKey, folder, group, screens) — 폴더 하나가 이 대메뉴의 이
       소그룹(중메뉴)으로 기여한다는 것과, 그 안에 어떤 화면(id/label)이 있는지까지
       기록. 코드(comp)는 전혀 안 불러온다 — mfeCatalog.js 가 부팅 시 이것만 채운다.
       screens: [{id, label}] — 실제 register() 가 넘기는 값과 id/label이 같아야
       나중에 로드된 실제 항목으로 자연스럽게 교체된다(2026-08-28 — 화면 이름까지
       미리 보이도록 확장. screens 를 안 넘기면 그룹만 표시하고 화면 목록은 로드 후에만
       보인다). */
    registerCatalog(menuKey, folder, group, screens) {
      if (!catalog[menuKey]) catalog[menuKey] = [];
      catalog[menuKey].push({ folder: toAbsFolder(folder), group: group || null, screens: screens || [] });
    },
    /* getCatalog(menuKey) — 그 대메뉴에 기여하는 [{folder, group}] 목록 */
    getCatalog(menuKey) {
      return catalog[menuKey] || [];
    },
    /* getCatalogMenuKeys() — 카탈로그에 등록된 대메뉴 key 전부(디버깅/개발용) */
    getCatalogMenuKeys() {
      return Object.keys(catalog);
    },
    isFolderLoaded(folder) {
      return loadedFolders.has(toAbsFolder(folder));
    },
    /* ensureFolderLoaded(folder) — 그 폴더의 manifest.js 를 동적 <script> 로 불러온다.
       이미 로드됐거나 로드 중이면 그 Promise 를 재사용(중복 로드 방지). manifest.js 는
       로드가 끝나면 반드시 이 폴더 키로 _domainReady() 를 불러야 이 Promise 가 풀린다
       (스크립트 자체의 onload 시점 ≠ 등록 완료 시점 — manifest.js 내부에서 자기 화면
       파일들을 또 비동기로 불러오기 때문). */
    ensureFolderLoaded(folder) {
      const key = toAbsFolder(folder);
      if (loadedFolders.has(key)) return Promise.resolve();
      if (pendingLoads[key]) return pendingLoads[key].promise;
      let resolveFn, rejectFn;
      const promise = new Promise((res, rej) => { resolveFn = res; rejectFn = rej; });
      pendingLoads[key] = { promise, resolve: resolveFn, reject: rejectFn };
      const s = document.createElement('script');
      s.src = key + 'manifest.js';
      s.onerror = () => { pendingLoads[key].reject(new Error('manifest.js 로드 실패: ' + s.src)); };
      document.head.appendChild(s);
      return promise;
    },
    /* ensureMenuLoaded(menuKey) — 카탈로그에 있는 폴더들을 "전부" 로드. 대메뉴를
       통째로 열어야 하는 경우(예: URL로 특정 화면에 바로 딥링크했는데 아직 어느
       소그룹인지 모를 때의 안전장치)에만 쓴다 — 평소 탐색은 openGroup() 으로 소그룹
       하나만 로드한다(2026-08-28). 카탈로그가 비어있으면(=dev.html 처럼 이미 정적
       <script> 로 자기 manifest.js 를 부른 경우) 그 도메인이 스스로 register() 를
       부를 때까지 기다린다 — 어느 쪽이든 이 함수 하나로 커버되어 dev.html 은 코드
       수정이 필요 없다.
       ⚠ 폴더들을 병렬(Promise.all)이 아니라 "한 번에 하나씩 순차로" 로드한다
       (2026-08-28) — cu-ba/cu-co 처럼 서로 다른 폴더가 같은 window 전역명
       (window.CmFaqMng 등)을 같이 쓰는 경우, 두 폴더를 병렬로 로드하면 두 도메인의
       스크립트 로드가 겹쳐서 "어느 쪽 파일이 최종적으로 그 전역을 차지하는지"가
       레이스 컨디션이 된다 — 화면이 하얗게 빈 채로 아무 에러도 없이 안 뜨는 증상의
       원인이었다. 순차 로드는 조금 느리지만(도메인 몇 개 수준에서는 체감 안 될
       정도) 이런 전역 이름 충돌을 원천적으로 막는다. */
    async ensureMenuLoaded(menuKey) {
      const entries = catalog[menuKey] || [];
      if (entries.length) {
        for (const c of entries) await this.ensureFolderLoaded(c.folder);
        return;
      }
      if ((menus[menuKey] || []).length) return;
      await new Promise((resolve) => {
        const check = () => { if ((menus[menuKey] || []).length) resolve(); };
        tickListeners.push(check);
        check();
      });
    },
    /* _domainReady(folderKey) — manifest.js 가 register() 를 다 끝낸 뒤 호출.
       folderKey 는 manifest.js 내부의 document.currentScript.src 기반 base 값 그대로
       (ensureFolderLoaded 가 쓰는 절대경로 키와 형식이 같아 그대로 매칭된다). */
    _domainReady(folderKey) {
      loadedFolders.add(folderKey);
      if (pendingLoads[folderKey]) { pendingLoads[folderKey].resolve(); delete pendingLoads[folderKey]; }
      bumpTick();
    },
    /* onLoadTick(fn) — 도메인 로드가 끝날 때마다(순서 무관) 알림 받기. 셸이 화면을
       다시 그려야 할 시점을 아는 용도(2026-08-28). */
    onLoadTick(fn) { tickListeners.push(fn); },
    /* loadScript(src) — manifest.js 가 자기 화면 파일들을 병렬로 불러올 때 재사용하는
       공용 헬퍼. document.write 대신 이걸 쓰면 페이지 로드 후(지연로드 상황)에도
       안전하게 동작한다(document.write 는 파싱 완료 후 호출하면 문서 전체를 지워버림). */
    loadScript(src) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('스크립트 로드 실패: ' + src));
        document.head.appendChild(s);
      });
    },
  };
})();
