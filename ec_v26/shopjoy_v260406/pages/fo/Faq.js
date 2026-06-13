/* ShopJoy - Faq */
window.Faq = {
  name: 'Faq',
  props: {
    navigate: { type: Function, required: true },        // 페이지 이동
  },
  emits: [],
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, openFaq: null});
    const codes = reactive({});
    /* faqs — API(cm_faq) 로 로드. {q, a, cate} 형태로 정규화. 실패 시 SITE_CONFIG.faqs fallback */
    const faqs = reactive([]);


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Faq.js : handleBtnAction -> ', cmd, param);
      // 홈으로 이동
      if (cmd === 'page-goHome') {
        return props.navigate('home');
      // 문의하기 페이지로 이동
      } else if (cmd === 'page-goContact') {
        return props.navigate('contact');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Faq.js : handleSelectAction -> ', cmd, param);
      // FAQ 항목 토글 (param: idx)
      if (cmd === 'faqs-rowToggle') {
        uiState.openFaq = (uiState.openFaq === param ? null : param);
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleLoadFaqs — DB(cm_faq) 공개 FAQ 조회. 실패 시 SITE_CONFIG.faqs fallback */
    const handleLoadFaqs = async () => {
      uiState.loading = true;
      try {
        const res = await foApiSvc.cmFaq.getList({}, 'FAQ', '목록조회');
        const list = res.data?.data || [];
        faqs.splice(0, faqs.length, ...list.map(f => ({
          q: f.faqQuestion, a: f.faqAnswer, cate: f.pathLabel || '',
        })));
      } catch (err) {
        console.error('[handleLoadFaqs]', err);
        /* fallback: 정적 SITE_CONFIG.faqs */
        const fb = (window.SITE_CONFIG && window.SITE_CONFIG.faqs) || [];
        faqs.splice(0, faqs.length, ...fb.map(f => ({ q: f.q, a: f.a, cate: '' })));
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + FAQ 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleLoadFaqs();
    });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState, faqs, // 상태 / FAQ 목록
      handleBtnAction, handleSelectAction, // dispatch
    };
  },
  template: /* html */ `
<fo-page title="FAQ" eyebrow="Support"
  banner-img="assets/cdn/prod/img/page-title/page-title-1.jpg"
  banner-align="center 40%"
  :crumbs="[{ label:'홈', page:'home' }, { label:'FAQ' }]"
  @nav="() => handleBtnAction('page-goHome')">
  <!-- ===== ■. 카드 영역 =================================================== -->
  <fo-container card-style="padding:8px clamp(14px,3vw,28px);margin-bottom:24px;">
    <div v-for="(faq, idx) in faqs" :key="idx" class="faq-item">
      <button class="faq-question" @click="handleSelectAction('faqs-rowToggle', idx)">
        <span style="flex:1;">
          {{ faq.q }}
        </span>
        <span class="chevron" :class="{open: uiState.openFaq===idx}">
          ▼
        </span>
      </button>
      <div v-show="uiState.openFaq===idx" class="faq-answer">
        {{ faq.a }}
      </div>
    </div>
  </fo-container>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="text-align:center;padding:clamp(12px,3vw,24px) 0;">
    <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">
      원하시는 답변을 찾지 못하셨나요?
    </p>
    <button class="btn-blue" @click="handleBtnAction('page-goContact')">
      1:1 문의하기
    </button>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
</fo-page>
`
};
