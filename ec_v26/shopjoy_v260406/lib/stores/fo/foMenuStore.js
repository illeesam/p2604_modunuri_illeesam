/**
 * FO (Front Office) 메뉴 정보 Pinia 스토어
 * - svMenus     : 백엔드에서 내려오는 동적 메뉴 (foAppInitStore가 saSetMenus 호출)
 * - svTopMenu   : 헤더 상단 네비게이션 (foConfig.js에서 분리)
 * - svSidebarMenu : 좌측 사이드바 섹션/항목 (foConfig.js에서 분리)
 */
window.useFoMenuStore = Pinia.defineStore('foMenu', {
  state: () => {
    return {
      svMenus: [],
      svTopMenu: [
        { icon: '🏠', menuId: 'home',     menuNm: '홈' },
        { icon: '🗂️', menuId: 'prodList', menuNm: '상품목록' },
        { icon: '📝', menuId: 'order',    menuNm: '주문하기' },
        { icon: '📞', menuId: 'contact',  menuNm: '고객센터' },
        { icon: '❓', menuId: 'faq',      menuNm: 'FAQ' },
        { icon: '🎉', menuId: 'event',    menuNm: '이벤트' },
        { icon: '📖', menuId: 'blog',     menuNm: '블로그' },
        { menuId: 'divider-disp', type: 'divider' },
        { menuId: 'dispUi01', menuNm: '전시ui1' },
        { menuId: 'dispUi02', menuNm: '전시ui2' },
        { menuId: 'dispUi03', menuNm: '전시ui3' },
        { menuId: 'dispUi04', menuNm: '전시ui4' },
        { menuId: 'dispUi05', menuNm: '전시ui5' },
        { menuId: 'dispUi06', menuNm: '전시ui6' },
      ],
      svSidebarMenu: [
        {
          section: '쇼핑',
          items: [
            { icon: '🏠', menuId: 'home',     menuNm: '홈' },
            { icon: '🗂️', menuId: 'prodList', menuNm: '상품목록' },
          ],
        },
        {
          section: '구매',
          items: [
            { icon: '📝', menuId: 'order',   menuNm: '주문하기' },
            { icon: '👤', menuId: 'myOrder', menuNm: '마이페이지', authRequired: true },
          ],
        },
        {
          section: '고객지원',
          items: [
            { icon: '📞', menuId: 'contact',  menuNm: '고객센터' },
            { icon: '❓', menuId: 'faq',      menuNm: 'FAQ' },
            { icon: '📍', menuId: 'location', menuNm: '위치안내' },
            { icon: '🏢', menuId: 'about',    menuNm: '회사소개' },
            { icon: '🎉', menuId: 'event',    menuNm: '이벤트' },
            { icon: '📖', menuId: 'blog',     menuNm: '블로그' },
          ],
        },
        {
          section: '샘플 전시',
          items: [
            { icon: '🖼', menuId: 'dispUi01', menuNm: '전시ui01' },
            { icon: '🖼', menuId: 'dispUi02', menuNm: '전시ui02' },
            { icon: '🖼', menuId: 'dispUi03', menuNm: '전시ui03' },
            { icon: '🖼', menuId: 'dispUi04', menuNm: '전시ui04' },
            { icon: '🖼', menuId: 'dispUi05', menuNm: '전시ui05' },
            { icon: '🖼', menuId: 'dispUi06', menuNm: '전시ui06' },
          ],
        },
      ],
    };
  },

  actions: {
    saSetMenus(menusData) {
      if (menusData) this.svMenus = menusData;
    },

    saClear() {
      this.svMenus = [];
    },
  },
});

// 함수형 유틸리티
window.sfGetFoMenuStore = () => {
  try { return window.useFoMenuStore?.(); } catch (e) { return null; }
};
