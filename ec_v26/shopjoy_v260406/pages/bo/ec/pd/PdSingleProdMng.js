/* ShopJoy Admin - 단품상품등록 (PdProdMng 래퍼, prodTypeCd=SINGLE 고정) */
window.PdSingleProdMng = {
  name: 'PdSingleProdMng',
  props: {
    navigate:        { type: Function, required: true }, // 페이지 이동
    initSearchValue: { type: String,   default: null },  // ZdSimul BO상세 자동 조회값
  },
  template: /* html */`
<pd-prod-mng :navigate="navigate" :init-search-value="initSearchValue" fixed-prod-type-cd="SINGLE" />
`,
};
