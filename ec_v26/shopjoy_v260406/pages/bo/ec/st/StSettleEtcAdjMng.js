/* ShopJoy Admin - 정산기타조정 */
window.StSettleEtcAdjMng = {
  name: 'StSettleEtcAdjMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: '', selectedId: null, isNew: false});
    const codes = reactive({
      settle_etc_adj_types: [],
      settle_adj_statuses: [],
      date_range_opts: [],
    });

    /* 정산 기타 조정 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.settle_etc_adj_types = codeStore.sgGetGrpCodes('SETTLE_ETC_ADJ_TYPE');
        codes.settle_adj_statuses = codeStore.sgGetGrpCodes('SETTLE_ADJ_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleEtcAdjMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else if (cmd === 'searchParam-date-range') {
        return handleDateRangeChange();
      } else if (cmd === 'etcAdjs-add') {
        return openNew();
      } else if (cmd === 'form-save') {
        return handleSave();
      } else if (cmd === 'form-cancel') {
        return closeForm();
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleEtcAdjMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'etcAdjs-row-approve') {
        return doApprove(param);
      } else if (cmd === 'etcAdjs-row-edit') {
        return openEdit(param);
      } else if (cmd === 'etcAdjs-row-delete') {
        return handleDelete(param);
      } else if (cmd === 'etcAdjs-set-page') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchData('PAGE_CLICK'); }
        return;
      } else if (cmd === 'etcAdjs-size-change') {
        pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

            const dateEnd   = ref('');

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.bofGetDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.bofGetDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const vendorList = reactive([]);
    const cfVendors = computed(() => vendorList.filter(v => v.vendorType === '판매업체'));

    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        const [resV, resA] = await Promise.all([
          boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '정산기타조정', '목록조회'),
          (() => {
            const params = {
              pageNo: pager.pageNo, pageSize: pager.pageSize,
              ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
            };
            // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
            if (params.searchValue && !params.searchType) {
              params.searchType = 'id,vendorNm,reason';
            }
            return boApiSvc.stSettleEtcAdj.getPage(params, '정산기타조정', '목록조회');
          })()
        ]);
        vendorList.splice(0, vendorList.length, ...(resV.data?.data?.pageList || resV.data?.data?.list || []));
        const data = resA.data?.data;
        etcAdjList.splice(0, etcAdjList.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || etcAdjList.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchData('DEFAULT');
    });

    const etcAdjList = reactive([]);

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

        const form = reactive({});
    const errors = reactive({});
    const isNew  = ref(false);

  /* 정산 기타 조정 _initSearchParam */
  const _initSearchParam = () => ({ searchType: '', searchValue: '', type: '', status: '' });
  const searchParam = reactive(_initSearchParam());

    /* openNew — 신규 열기 */
    const openNew = () => {
      Object.assign(form, { adjId: null, adjDate: new Date().toISOString().slice(0,10), vendorId: '', vendorNm: '', adjType: '기타', adjAmt: 0, reason: '', aprvStatusCd: '대기', regUserNm: '관리자' });
      uiState.selectedId = '__new__'; uiState.isNew = true;
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* openEdit — 열기 */
    const openEdit = (r) => { Object.assign(form, {...r}); uiState.selectedId = r.adjId; uiState.isNew = false; Object.keys(errors).forEach(k => delete errors[k]); };

    /* closeForm — 닫기 */
    const closeForm = () => { uiState.selectedId = null; };

    /* 정산 기타 조정 저장 */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!form.vendorId) { errors.vendorId = '업체를 선택하세요.'; }
      if (!form.adjType)  { errors.adjType  = '유형을 선택하세요.'; }
      if (!form.reason)   { errors.reason   = '사유를 입력하세요.'; }
      if (Object.keys(errors).length) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const v = cfVendors.value.find(x => x.vendorId === Number(form.vendorId));
      if (v) { form.vendorNm = v.vendorNm; }
      const ok = await showConfirm('저장', '기타조정을 저장하시겠습니까?');
      if (!ok) { return; }
      if (uiState.isNew) { form.adjId = 'ETCADJ-' + String(etcAdjList.length + 1).padStart(3, '0'); etcAdjList.unshift({ ...form }); }
      else { const idx = etcAdjList.findIndex(x => x.adjId === form.adjId); if (idx !== -1) Object.assign(etcAdjList[idx], { ...form }); }
      closeForm();
      try {
        const res = await (uiState.isNew ? boApiSvc.stSettleEtcAdj.create({ ...form }, '정산기타조정', '저장') : boApiSvc.stSettleEtcAdj.update(form.adjId, { ...form }, '정산기타조정', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('저장되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (r) => {
      const ok = await showConfirm('삭제', `[${r.adjId}]를 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = etcAdjList.findIndex(x => x.adjId === r.adjId); if (idx !== -1) etcAdjList.splice(idx, 1); if (uiState.selectedId === r.adjId) closeForm();
      try {
        const res = await boApiSvc.stSettleEtcAdj.remove(r.adjId, '정산기타조정', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* 정산 기타 조정 fnAprvBadge */
    const _SETTLE_ADJ_STATUS_FB = { '승인':'badge-green', '대기':'badge-blue', '반려':'badge-red' };
    /* fnAprvBadge — 유틸 */
    const fnAprvBadge = s => coUtil.cofCodeBadge('SETTLE_ADJ_STATUS', s, _SETTLE_ADJ_STATUS_FB[s] || 'badge-gray');

    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => ({ '위약금':'badge-red', '인센티브':'badge-green', '세금조정':'badge-orange', '기타':'badge-gray' }[t] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = n => (n >= 0 ? '' : '-') + Math.abs(Number(n)).toLocaleString() + '원';

    /* onSearch — 조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

        // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'dateRange', label: '정산일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'type', label: '유형', type: 'select', options: () => codes.settle_etc_adj_types, nullLabel: '유형 전체' },
      { key: 'status', label: '상태', type: 'select', options: () => codes.settle_adj_statuses, nullLabel: '상태 전체' },
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [
          { value: 'id',       label: 'ID' },
          { value: 'vendorNm', label: '업체명' },
          { value: 'reason',   label: '사유' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력', width: '180px' },
    ];

    const baseGridColumns = [
      { key: 'adjId',        label: '조정ID' },
      { key: 'adjDate',      label: '조정일자' },
      { key: 'vendorNm',     label: '업체명' },
      { key: 'adjType',      label: '유형', badge: (row) => fnTypeBadge(row.adjType) },
      { key: 'adjAmt',       label: '조정금액', fmt: fmtW,
        cellStyle: (v, row) => row.adjAmt < 0
          ? 'color:#e74c3c;font-weight:700' : 'color:#27ae60;font-weight:700' },
      { key: 'reason',       label: '사유',
        cellStyle: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' },
      { key: 'aprvStatusCd', label: '승인상태', badge: (row) => fnAprvBadge(row.aprvStatusCd) },
      { key: 'regUserNm',    label: '등록자' },
    ];

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 기타조정 추가/수정 ============
    const baseFormColumns = [
      { key: 'vendorId', label: '업체', type: 'select', required: true, nullLabel: '선택',
        options: () => (cfVendors.value || []).map(v => ({ value: v.vendorId, label: v.vendorNm })) },
      { key: 'adjType',  label: '조정유형', type: 'select', required: true, nullable: false,
        options: () => codes.settle_etc_adj_types },
      { key: 'adjAmt',   label: '조정금액(원)', type: 'number', placeholder: '음수 입력 시 차감' },
      { key: 'adjDate',  label: '조정일자', type: 'date' },
      { type: 'rowBreak' },
      { key: 'reason',   label: '사유', type: 'text', required: true,
        placeholder: '기타조정 사유를 입력하세요.', colSpan: 4 },
    ];

    // ===== return (템플릿 노출) ===============================================


    return {
      uiState, codes, pager, etcAdjList, searchParam, form, errors,
      baseSearchColumns, baseGridColumns, baseFormColumns,
      handleBtnAction, handleSelectAction,
      cfVendors,
      fnAprvBadge, fnTypeBadge, fmtW,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">정산기타조정</div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">판촉비·위약금·보증금 등 정산조정 외 기타 항목을 별도 관리합니다.</span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 정산조정(StSettleAdjMng)에서 처리하기 어려운 비정형 항목을 등록합니다. • 항목 유형: 판촉비 / 위약금 / 보증금 / 기타 차감 등 • 승인 후 정산마감 집계에 포함됩니다. • 승인 상태: 대기 / 승인 / 반려
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card" style="margin-top:12px">
    <div class="toolbar">
      <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      <div style="margin-left:auto">
        <button class="btn btn-primary" @click="handleBtnAction('etcAdjs-add')">+ 기타조정 추가</button>
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="etcAdjList" :pager="pager" row-key="adjId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'" :row-actions="true"
      :row-class="(r) => uiState.selectedId===r.adjId ? 'selected' : ''"
      @set-page="n => handleSelectAction('etcAdjs-set-page', n)" @size-change="handleSelectAction('etcAdjs-size-change')">
      <template #head-actions>액션</template>
      <template #row-actions="{ row: r }">
        <button class="btn btn-sm btn-primary" @click="handleSelectAction('etcAdjs-row-edit', r)">수정</button>
        <button class="btn btn-sm btn-danger"  @click="handleSelectAction('etcAdjs-row-delete', r)">삭제</button>
      </template>
    </bo-grid>
  </div>
    <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 편집 폼 (BoFormArea 자동 렌더) ================================= -->
  <!-- ===== ■. 상세 패널 =================================================== -->
  <div v-if="uiState.selectedId" class="card" style="margin-top:12px">
    <div style="font-weight:700;margin-bottom:16px">{{ uiState.isNew ? '기타조정 추가' : '기타조정 수정' }}</div>
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :cols="4"
      @save="handleBtnAction('form-save')" @cancel="handleBtnAction('form-cancel')" />
  </div>
</div>

    <!-- ===== □.□. 폼 영역 ================================================== -->
  <!-- ===== □. 상세 패널 =================================================== -->`,
};
