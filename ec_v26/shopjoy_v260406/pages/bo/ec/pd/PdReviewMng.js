/* ShopJoy Admin - 상품리뷰관리 */
window.PdReviewMng = {
  name: 'PdReviewMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const products = reactive([]);
    const members = reactive([]);
    const reviews = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null });
    const codes = reactive({
      review_statuses: [],
      review_rating_opts: [{value:'5',label:'5점'},{value:'4',label:'4점대'},{value:'3',label:'3점대'},{value:'2',label:'2점대'},{value:'1',label:'1점대'}],
      review_status_list: [{value:'ACTIVE',label:'공개'},{value:'HIDDEN',label:'숨김'},{value:'DELETED',label:'삭제'}],
    });

    /* 상품 리뷰 fnLoadCodes */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdReviewMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 페이지 크기 변경
      } else if (cmd === 'reviews-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 상세 패널 닫기
      } else if (cmd === 'baseDetail-close') {
        selectedId.value = null;
        return;
      // 상품별 리뷰 목록 닫기 (선택 해제)
      } else if (cmd === 'prodReviews-close') {
        return onProdIdClick(selectedProdId.value);
      // 상품별 리뷰 페이지 크기 변경
      } else if (cmd === 'prodReviews-pager-sizeChange') {
        return onProdReviewSizeChange();
      // 상태변경 모달 닫기 (취소)
      } else if (cmd === 'statusModal-close') {
        return closeStatusModal();
      // 상태변경 모달 저장
      } else if (cmd === 'statusModal-confirm') {
        return confirmStatusChange();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdReviewMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'reviews-sort') {
        return baseGrid.onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'reviews-pager-setPage') {
        return baseGrid.setPage(param);
      // 그리드 행 클릭 (상세 토글)
      } else if (cmd === 'reviews-rowEdit') {
        return openDetail(param);
      // 그리드 행 미리보기 (새창)
      } else if (cmd === 'reviews-rowPreview') {
        return previewProduct(param);
      // 상태변경 select intercept
      } else if (cmd === 'reviews-rowStatusChange') {
        return onStatusSelectChange(param.row, param.evt);
      // 상품ID 클릭 → 하단 상품별 리뷰 목록 토글
      } else if (cmd === 'reviews-rowProdClick') {
        return onProdIdClick(param);
      // 상품별 리뷰 페이지 번호 클릭
      } else if (cmd === 'prodReviews-pager-setPage') {
        return setProdReviewPage(param);
      // 상품별 리뷰 행 클릭 (상세 토글)
      } else if (cmd === 'prodReviews-rowEdit') {
        return openDetail(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.review_statuses = codeStore.sgGetGrpCodes('REVIEW_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // onMounted에서 API 로드
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    /* 상품 리뷰 onSort */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* onSort — 정렬 */
    /* sortIcon — 정렬 */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdReview.getPage({ pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '상품리뷰관리', '목록조회');
        const data = res.data?.data;
        reviews.splice(0, reviews.length, ...(data?.pageList || []));
        baseGrid.pager.pageTotalCount = data?.pageTotalCount || 0;
        baseGrid.pager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;        Object.assign(baseGrid.pager.pageCond, data?.pageCond || baseGrid.pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 5 });

    /* openStatusModal — 열기 */
    const openStatusModal = (row, newStatus) => {
      if (!newStatus || newStatus === row.reviewStatusCd) { return; }
      statusModal.row = row;
      statusModal.newStatus = newStatus;
      statusModal.reason = '';
      statusModal.show = true;
    };

    /* onStatusSelectChange — 이벤트 */
    const onStatusSelectChange = (row, evt) => {
      const newStatus = evt && evt.target ? evt.target.value : '';
      openStatusModal(row, newStatus);
      if (evt && evt.target && row) { evt.target.value = row.reviewStatusCd; }
    };

    /* 모달 표시용 — row 의 안전 접근 (template 의 ?. 표현식 회피) */
    const cfStatusModalRowTitle  = computed(() => (statusModal.row && statusModal.row.reviewTitle) || '');
    const cfStatusModalCurrentCd = computed(() => (statusModal.row && statusModal.row.reviewStatusCd) || '');

    /* closeStatusModal — 닫기 */
    const closeStatusModal = () => {
      statusModal.show = false;
      /* select 가 미리 새 값으로 바뀌었을 수 있으므로 원복용 트리거 */
      // row.reviewStatusCd 는 그대로 — UI 의 select 가 다음 렌더에서 동기화됨
      statusModal.row = null;
      statusModal.newStatus = '';
      statusModal.reason = '';
    };

    /* confirmStatusChange — 확인 상태 변경 */
    const confirmStatusChange = async () => {
      const row = statusModal.row;
      const newStatus = statusModal.newStatus;
      const reason = (statusModal.reason || '').trim();
      if (!row) { return; }
      if (!reason) { showToast('변경 사유를 입력해주세요.', 'error'); return; }
      try {
        const res = await boApiSvc.pdReview.updateStatus(
          row.reviewId,
          { reviewStatusCd: newStatus, statusChgReason: reason },
          '리뷰관리', '상태변경'
        );
        row.reviewStatusCd = newStatus;

        /* 상단/하단 두 목록 모두에서 같은 reviewId 찾아 상태 동기화 */
        const sync = (arr) => { const t = arr.find(r => r.reviewId === row.reviewId); if (t) t.reviewStatusCd = newStatus; };
        sync(reviews);
        sync(prodReviews);
        if (cfSelectedRow.value && cfSelectedRow.value.reviewId === row.reviewId) {
          cfSelectedRow.value.reviewStatusCd = newStatus;
        }
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(`상태가 [${STATUS_LABEL[newStatus]}] 로 변경되었습니다.`, 'success'); }
        statusModal.show = false;
      } catch (err) {
        console.error('[confirmStatusChange]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* onSearch — 조회 */
    const onSearch = async () => {
      baseGrid.pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      baseGrid.sortKey = ''; baseGrid.sortDir = 'asc';
      baseGrid.pager.pageNo = 1;
      await handleSearchList();
    };

    /* setPage — 설정 */
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    상품리뷰관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid :columns="listGridColumns" :rows="reviews" :pager="baseGrid.pager" row-key="reviewId"
    :sort-state="baseGrid" list-title="상품리뷰 목록"
    :count-text="'총 ' + baseGrid.pager.pageTotalCount + '건'"
    :row-class="fnGridRowClass" empty-text="데이터가 없습니다." row-clickable row-actions
    @sort="key => handleSelectAction('reviews-sort', key)" @set-page="n => handleSelectAction('reviews-pager-setPage', n)" @size-change="handleBtnAction('reviews-pager-sizeChange')" @row-click="r => handleSelectAction('reviews-rowEdit', r)">
    <template #row-actions="{ row }">
      <button class="btn btn-xs" style="background:#fff;border:1px solid #d9d9d9;color:#555;font-size:12px;padding:2px 6px;" title="상품 미리보기" @click.stop="handleSelectAction('reviews-rowPreview', row.prodId)">
        👁
      </button>
    </template>
  </bo-grid>
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 상품ID 클릭 시: 해당 상품의 리뷰 페이징 목록 ============================= -->
  <div class="card" v-if="selectedProdId">
    <div class="toolbar">
      <span class="list-title">
        📦 [{{ selectedProdId }}] 상품의 리뷰 목록
      </span>
      <span class="list-count">
        총 {{ prodReviewPager.pageTotalCount }}건
      </span>
      <button class="btn btn-xs" style="margin-left:auto;background:#f5f5f5;border:1px solid #ddd;color:#666;font-size:11px;padding:2px 8px;" @click="handleBtnAction('prodReviews-close')">
        ✕ 닫기
      </button>
    </div>
    <!-- ===== ■.■. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <div style="max-height:calc(100vh - 340px);min-height:480px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="prodReviewGridColumns" :rows="prodReviews" :pager="prodReviewPager"
        row-key="reviewId" :row-class="fnProdReviewRowClass"
        empty-text="해당 상품의 리뷰가 없습니다." row-clickable
        @set-page="n => handleSelectAction('prodReviews-pager-setPage', n)" @size-change="handleBtnAction('prodReviews-pager-sizeChange')" @row-click="r => handleSelectAction('prodReviews-rowEdit', r)">
      </bo-grid>
    </div>
    <!-- ===== □.□. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <!-- ===== ■.■. /그리드 스크롤 컨테이너 ========================================= -->
    <!-- ===== ■.■. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
    <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
      <bo-pager :pager="prodReviewPager" :on-set-page="n => handleSelectAction('prodReviews-pager-setPage', n)" :on-size-change="() => handleBtnAction('prodReviews-pager-sizeChange')"
        style="margin-top:0;min-height:34px;" />
    </div>
  </div>
  <!-- ===== □.□. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
  <!-- ===== □. 상품ID 클릭 시: 해당 상품의 리뷰 페이징 목록 ============================= -->
  <!-- ===== ■. 상세 패널 =================================================== -->
  <div class="card" v-if="cfSelectedRow">
    <div class="toolbar">
      <span class="list-title">
        리뷰 내용
      </span>
      <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;color:#888;">
          현재 상태:
        </span>
        <span :class="['badge', fnStatusBadge(cfSelectedRow.reviewStatusCd)]">
          {{ STATUS_LABEL[cfSelectedRow.reviewStatusCd] || cfSelectedRow.reviewStatusCd }}
        </span>
        <span style="font-size:12px;color:#888;margin-left:8px;">
          변경:
        </span>
        <select class="form-control" style="font-size:12px;padding:3px 6px;width:auto;height:28px;"
          :value="cfSelectedRow.reviewStatusCd"
          @change="handleSelectAction('reviews-rowStatusChange', { row: cfSelectedRow, evt: $event })">
          <option v-for="s in codes.review_status_list" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
        <button class="btn btn-xs" style="margin-left:6px;background:#f5f5f5;border:1px solid #ddd;color:#666;font-size:11px;padding:3px 10px;" @click="handleBtnAction('baseDetail-close')">
          ✕ 닫기
        </button>
      </span>
    </div>
    <div style="padding:16px">
      <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:#555;margin-bottom:10px;">
        <span>
          <b style="color:#888;">
            상품:
          </b>
          [{{ cfSelectedRow.prodId }}] {{ getProdNm(cfSelectedRow.prodId) || cfSelectedRow.prodNm || '' }}
        </span>
        <span>
          <b style="color:#888;">
            작성자:
          </b>
          {{ getMemNm(cfSelectedRow.memberId) }}
        </span>
        <span>
          <b style="color:#888;">
            작성일:
          </b>
          {{ cfSelectedRow.reviewDate }}
        </span>
      </div>
      <div style="font-size:16px;font-weight:600;margin-bottom:8px">
        {{ cfSelectedRow.reviewTitle }}
      </div>
      <div style="color:#f59e0b;margin-bottom:8px">
        평점: {{ Number(cfSelectedRow.rating || 0).toFixed(1) }} / 5.0
      </div>
      <div style="background:#f9f9f9;padding:12px;border-radius:6px;white-space:pre-wrap;font-size:14px">
        {{ cfSelectedRow.reviewContent }}
      </div>
      <div style="margin-top:8px;font-size:12px;color:#888">
        도움이 됐어요 {{ cfSelectedRow.helpfulCnt }} | 도움이 안됐어요 {{ cfSelectedRow.unhelpfulCnt }}
      </div>
    </div>
  </div>
  <!-- ===== □. 상세 패널 =================================================== -->
  <!-- ===== ■. 상태변경 사유 입력 모달 =========================================== -->
  <div v-if="statusModal.show"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);z-index:1500;display:flex;align-items:center;justify-content:center;"
    @click.self="handleBtnAction('statusModal-close')">
    <div class="modal-box" style="background:#fff;border-radius:16px;width:480px;max-width:92vw;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;">
      <div class="tree-modal-header" style="padding:14px 20px;border-bottom:1px solid #f0e0e7;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);">
        <div style="font-size:14px;font-weight:700;color:#222;">
          리뷰 상태 변경
        </div>
        <button @click="handleBtnAction('statusModal-close')" style="border:none;background:transparent;color:#888;font-size:18px;cursor:pointer;">
          ✕
        </button>
      </div>
      <div style="padding:18px 20px;">
        <div style="margin-bottom:14px;font-size:13px;color:#444;line-height:1.7;">
          <div>
            <b>
              리뷰
            </b>
            : {{ cfStatusModalRowTitle }}
          </div>
          <div style="margin-top:4px;">
            <b>
              상태 변경
            </b>
            :
            <span :class="['badge', fnStatusBadge(cfStatusModalCurrentCd)]" style="margin-left:6px;">
              {{ STATUS_LABEL[cfStatusModalCurrentCd] }}
            </span>
            <span style="margin:0 6px;color:#888;">
              →
            </span>
            <span :class="['badge', fnStatusBadge(statusModal.newStatus)]">
              {{ STATUS_LABEL[statusModal.newStatus] }}
            </span>
          </div>
        </div>
        <label class="form-label" style="font-size:12px;font-weight:600;color:#555;display:block;">
          변경 사유
          <span style="color:#e57373;">
            *
          </span>
        </label>
        <textarea class="form-control" v-model="statusModal.reason" rows="4"
          placeholder="상태 변경 사유를 입력해주세요. (필수)"
          style="margin:6px 0 0;width:100%;font-size:13px;box-sizing:border-box;"></textarea>
        </div>
        <div style="padding:12px 20px;border-top:1px solid #f0f0f0;background:#fafafa;display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn btn-secondary btn-sm" @click="handleBtnAction('statusModal-close')">
            취소
          </button>
          <button class="btn btn-primary btn-sm" @click="handleBtnAction('statusModal-confirm')">
            저장
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- ===== □. 상태변경 사유 입력 모달 =========================================== -->
`
};
