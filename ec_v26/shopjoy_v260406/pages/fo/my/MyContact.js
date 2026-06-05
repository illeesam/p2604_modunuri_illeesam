/* ShopJoy - My 문의 페이지 (#page=myContact) */
window.MyContact = {
  name: 'MyContact',
  props: {
    navigate:    { type: Function, required: true },                    // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { reactive, computed, onMounted, watch } = Vue;
    const showToast            = window.foApp.showToast;  // 토스트 알림
    const showConfirm          = window.foApp.showConfirm;  // 확인 모달

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    const myStore = window.useFoMyStore();

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MyContact.js : handleBtnAction -> ', cmd, param);
      // 날짜 필터 조회
      if (cmd === 'searchParam-dateSearch') {
        return onSearch(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MyContact.js : handleSelectAction -> ', cmd, param);
      // 문의 펼침 토글
      if (cmd === 'contacts-toggle') {
        expandedInquiry.value = expandedInquiry.value === param ? null : param;
      // 문의 취소
      } else if (cmd === 'contacts-cancel') {
        return cancelInquiry(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
        handleSearchData();
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const { inquiries, expandedInquiry } = Pinia.storeToRefs(myStore);

    const inquiryPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 50, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const paginate = myStore.paginate;

    const { dateRange, onDateSearch } = window.myDateFilterHelper();
    // 날짜/기간 필터는 서버(API)가 처리 — inquiries 는 이미 조회기간 내 결과.
    const cfDateFilteredInquiries = computed(() => inquiries.value);

    /* cancelInquiry — 취소 */
    const cancelInquiry = async id => {
      const ok = await showConfirm('문의 취소', '이 문의를 취소하시겠습니까?', 'warning');
      if (!ok) { return; }
      const item = inquiries.value.find(x => x.inquiryId === id);
      if (item) { item.status = '취소됨'; }
      showToast('문의가 취소되었습니다.', 'success');
    };

    /* handleSearchData — 처리 */
    const handleSearchData = async () => {
      const params = { dateType: 'reg_date', dateStart: dateRange.start, dateEnd: dateRange.end };
      await myStore.loadInquiries(params);
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* onSearch — 조회 */
    const onSearch = async (dateParams) => {
      if (dateParams) { onDateSearch(dateParams); }
      await handleSearchData();
    };
    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, codes,                                                        // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                   // dispatch
      // ===== contacts 영역 ====================================================
      myStore, inquiries, expandedInquiry,
      inquiryPager, paginate, cfDateFilteredInquiries,
    };
  },
  template: /* html */ `
<fo-page bare>
<fo-my-layout :navigate="navigate" :cart-count="cartCount" active-page="myContact">
  <MyDateFilter @search="handleBtnAction('searchParam-dateSearch', $event)" />
  <!-- ===== ■. 영역 ====================================================== -->
  <PagerHeader :total="cfDateFilteredInquiries.length" :pager="inquiryPager" />
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <div v-if="!cfDateFilteredInquiries.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">
    문의 내역이 없습니다.
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div v-for="q in paginate(cfDateFilteredInquiries, inquiryPager)" :key="q.inquiryId"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:10px;">
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <div style="flex:1;cursor:pointer;" @click="handleSelectAction('contacts-toggle', q.inquiryId)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:0.75rem;font-weight:700;padding:3px 8px;border-radius:20px;color:#fff;"
            :style="'background:'+myStore.inquiryStatusColor(q.status)">
            {{ q.status }}
          </span>
          <span style="font-size:0.78rem;color:var(--text-muted);">
            {{ q.category }}
          </span>
          <span style="font-size:0.78rem;color:var(--text-muted);">
            {{ q.date }}
          </span>
        </div>
        <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">
          {{ q.title }}
        </div>
      </div>
      <button v-if="q.status==='요청'" @click="handleSelectAction('contacts-cancel', q.inquiryId)"
        style="padding:6px 14px;border:1.5px solid #ef4444;border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.8rem;font-weight:600;white-space:nowrap;">
        취소
      </button>
    </div>
    <div v-if="expandedInquiry===q.inquiryId" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
      <div style="background:var(--bg-base);border-radius:6px;padding:12px;font-size:0.85rem;color:var(--text-secondary);margin-bottom:10px;">
        {{ q.content }}
      </div>
      <!-- ===== ■.■. 문의 첨부파일 ============================================ -->
      <div v-if="q.contentAttachGrpId" style="margin-bottom:10px;">
        <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px;">
          📎 첨부파일
        </div>
        <base-attach-grp :model-value="q.contentAttachGrpId" :ref-id="q.inquiryId"
          grp-code="CONTACT_CONTENT_ATTACH" grp-nm="문의 첨부파일"
          display-mode="list" :readonly="true" />
      </div>
      <div v-if="q.answer" style="background:var(--blue-dim);border-radius:6px;padding:12px;font-size:0.85rem;color:var(--text-primary);">
        <span style="font-size:0.78rem;font-weight:700;color:var(--blue);display:block;margin-bottom:4px;">
          📩 답변
        </span>
        {{ q.answer }}
      </div>
      <!-- ===== ■.■. 답변 첨부파일 ============================================ -->
      <div v-if="q.answer && q.answerAttachGrpId" style="margin-top:10px;">
        <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px;">
          📎 답변 첨부파일
        </div>
        <base-attach-grp :model-value="q.answerAttachGrpId" :ref-id="q.inquiryId"
          grp-code="CONTACT_ANSWER_ATTACH" grp-nm="답변 첨부파일"
          display-mode="list" :readonly="true" />
      </div>
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <Pagination :total="inquiries.length" :pager="inquiryPager" />
</fo-my-layout>
<!-- ===== □. 영역 ====================================================== -->
</fo-page>
`,
  components: {
    FoPage:      window.FoPage,
    FoMyLayout:    window.foMyLayout,
    PagerHeader: window.PagerHeader,
    Pagination:  window.Pagination,
  }
};
