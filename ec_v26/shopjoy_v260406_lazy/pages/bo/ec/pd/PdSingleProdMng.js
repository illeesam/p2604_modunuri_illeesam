/* ShopJoy Admin - 단품상품등록 (PdProdMng 래퍼, prodTypeCd=SINGLE 고정)
   ⛔ 불필요한 중복으로 보고 삭제/PdProdMng 직접 라우팅 금지 — 핀 고정 탭에서 유형필터가 사라지는 회귀 재현됨.
   이유 → _doc/정책서/sy/sy.51.프로그램설계정책.md §8 고정값 래퍼 컴포넌트 패턴 */
window.PdSingleProdMng = {
  name: 'PdSingleProdMng',
  props: {
    navigate:        { type: Function, required: true }, // 페이지 이동
    openNewWindow:   { type: Function, default: () => {} }, // 실제 새 브라우저 창으로 열기 (Ctrl+클릭)
    initSearchValue: { type: String,   default: null },  // ZdSimul BO상세 자동 조회값
  },
  template: /* html */`
<pd-prod-mng :navigate="navigate" :open-new-window="openNewWindow" :init-search-value="initSearchValue" fixed-prod-type-cd="SINGLE" />
`,
};
