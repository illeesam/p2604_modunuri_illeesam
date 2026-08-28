/**
 * BO 사이트 식별 정보 Pinia 스토어
 * - svSiteNo / svSiteId 만 보관한다. 읽는 곳은 coUtil.cofApiInfo (API 헤더 구성).
 *
 * ※ 공통코드는 여기가 아니라 boCodeStore 가 화면 단위로 지연 로딩한다
 *   (2026-07-30 정책. 전체 일괄 로드 saLoadCodes 는 폐기).
 * ※ 메뉴는 boMenuStore, 사용자 정보는 boAuthStore 가 갖는다.
 */
(function () {
  if (!window.Pinia) {
    console.warn('[boConfigStore] Pinia not loaded');
    return;
  }

  /* site_no → site_id 매핑 (coUtil.siteNoToSiteId 와 동일 규칙: 실 DB sy_site 기준) */
  const _toSiteId = (no) => '260401' + String(no || '01').padStart(10, '0');

  /* BO 사이트 정보 결정 + localStorage 영속화.
     우선순위: URL ?SITE_NO= → localStorage(siteNo) → '01'.
     store 생성(=로그인/앱초기화) 시점에 호출되어 modu-bo-sy-siteNo / modu-bo-sy-siteId 를 항상 남긴다. */
  const _resolveBoSite = () => {
    let no = '01', id;
    try {
      /* ⚠️ 과거의 "구 키→신 키 마이그레이션" 블록 제거:
       *   구 키와 신 키 이름이 동일(modu-bo-sy-siteNo)하게 작성돼 매 호출마다 removeItem→setItem 발생.
       *   removeItem 은 다른 탭에 oldValue→null storage 이벤트를 쏘고, bo.html 의 storage 리스너가
       *   이를 변화로 오인해 location.reload() → 무한 리로드 루프를 유발했음. */
      const u = new URLSearchParams(location.search).get('SITE_NO');
      no = u || localStorage.getItem('modu-bo-sy-siteNo') || '01';
      id = (!u && localStorage.getItem('modu-bo-sy-siteId')) || _toSiteId(no);

      // 항상 localStorage 에 영속화 (로그인만 해도 키 생성). 값이 같으면 storage 이벤트 미발생 → 안전
      if (localStorage.getItem('modu-bo-sy-siteNo') !== no) localStorage.setItem('modu-bo-sy-siteNo', no);
      if (localStorage.getItem('modu-bo-sy-siteId') !== id) localStorage.setItem('modu-bo-sy-siteId', id);
    } catch (_) {
      no = no || '01';
      id = id || '2604010000000001';
    }
    return { no, id };
  };

  window.useBoConfigStore = Pinia.defineStore('boConfig', {
    state: () => {
      const site = _resolveBoSite();
      return {
        svSiteNo: site.no,   // 사이트 번호 (01/02/03/9999)
        svSiteId: site.id,   // 사이트 ID (2604010000000001 ...)
      };
    },
  });
})();
