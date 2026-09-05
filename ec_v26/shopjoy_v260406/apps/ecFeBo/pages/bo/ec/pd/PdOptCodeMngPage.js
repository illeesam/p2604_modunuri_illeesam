/* ShopJoy Admin - 상품옵션관리 (좌측 메뉴 진입, bo-pd-opt-code-mng.html iframe 인라인)
 * PdProdMng 의 "⚙ 상품옵션코드관리" 모달과 동일한 화면을 메뉴로도 진입 가능하게 함
 */
window.PdOptCodeMngPage = {
  name: 'PdOptCodeMngPage',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup() {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { computed } = Vue;
    const cfOptCodeMngUrl = computed(() => window.pageUrl('bo-pd-opt-code-mng.html'));

    return { cfOptCodeMngUrl };
  },
  template: /* html */`
<bo-page title="상품옵션관리"
  desc-summary="상품 옵션 코드(PROD_OPT_CATEGORY)를 3단 계층으로 등록·관리합니다.">
  <template #actions>
    <span style="font-size:11px;color:#bbb;">{{ cfOptCodeMngUrl }}</span>
  </template>
  <bo-container bare>
    <div style="position:relative;width:100%;height:calc(100vh - 220px);min-height:560px;overflow:hidden;border:1px solid #eee;border-radius:8px;">
      <iframe src="bo-pd-opt-code-mng.html" style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe>
    </div>
  </bo-container>
</bo-page>
`,
};
