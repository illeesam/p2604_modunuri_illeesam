/* ShopJoy - Faq */
window.Faq = {
  name: 'Faq',
  props: {
    navigate: { type: Function, required: true },        // 페이지 이동
  },
  emits: [],
  setup(props) {
    // ===== [01] 초기 변수 정의 ==================================================
    const { ref, reactive, watch, onMounted } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, openFaq: null});
    const codes = reactive({});

    // ===== [02] 액션 모음 (dispatch) ==============================================

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

    // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) ==============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes,                                  // 상태
      handleBtnAction, handleSelectAction,             // dispatch
    };
  },
  template: /* html */ `
<div class="page-wrap">
  <!-- ===== ■. 페이지 타이틀 배너 ============================================== -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-1.jpg" alt="FAQ"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);">
    </div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">
        Support
      </div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">
        FAQ
      </h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="handleBtnAction('page-goHome')">
          홈
        </span>
        <span>
          /
        </span>
        <span style="color:#333;">
          FAQ
        </span>
      </div>
    </div>
  </div>
  <!-- ===== □. 페이지 타이틀 배너 ============================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card" style="padding:8px clamp(14px,3vw,28px);margin-bottom:24px;">
    <div v-for="(faq, idx) in config.faqs" :key="idx" class="faq-item">
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
  </div>
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
</div>
<!-- ===== □. 본문 영역 =================================================== -->
`
};
