/* ShopJoy Admin - 정산조정 */
window.StSettleAdjMng = {
  name: 'StSettleAdjMng',
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
      settle_adj_types: [],
      settle_adj_statuses: [],
      date_range_opts: [],
    });

    /* 정산 조정 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.settle_adj_types = codeStore.sgGetGrpCodes('SETTLE_ADJ_TYPE_KR');
        codes.settle_adj_statuses = codeStore.sgGetGrpCodes('SETTLE_ADJ_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

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
          boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '정산조정관리', '목록조회'),
          (() => {
            const params = {
              pageNo: pager.pageNo, pageSize: pager.pageSize,
              ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
            };
            // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
            if (params.searchValue && !params.searchType) {
              params.searchType = 'adjId,vendorNm,reason';
            }
            return boApiSvc.stSettleAdj.getPage(params, '정산조정관리', '목록조회');
          })()
        ]);
        vendorList.splice(0, vendorList.length, ...(resV.data?.data?.pageList || resV.data?.data?.list || []));
        const data = resA.data?.data;
        adjList.splice(0, adjList.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || adjList.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
    });

    const adjList = reactive([]);

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

        const form = reactive({});
    const errors = reactive({});
    const isNew  = ref(false);

  /* 정산 조정 _initSearchParam */
  const _initSearchParam = () => ({ searchType: '', searchValue: '', type: '', status: '' });
  const searchParam = reactive(_initSearchParam());

    const schema = window.yup.object({
      vendorId: window.yup.number().required('업체를 선택하세요.').min(1, '업체를 선택하세요.'),
      adjType:  window.yup.string().required('조정유형을 선택하세요.'),
      adjAmt:   window.yup.number().required('조정금액을 입력하세요.'),
      reason:   window.yup.string().required('사유를 입력하세요.'),
    });

    /* openNew — 신규 열기 */
    const openNew = () => {
      Object.assign(form, { adjId: null, adjDate: new Date().toISOString().slice(0,10), vendorId: '', vendorNm: '', adjType: '매출조정', adjAmt: 0, reason: '', aprvStatusCd: '대기', regUserNm: '관리자' });
      uiState.selectedId = '__new__'; uiState.isNew = true;
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* openEdit — 열기 */
    const openEdit = (r) => { Object.assign(form, {...r}); uiState.selectedId = r.adjId; uiState.isNew = false; Object.keys(errors).forEach(k => delete errors[k]); };

    /* closeForm — 닫기 */
    const closeForm = () => { uiState.selectedId = null; };

    /* 정산 조정 저장 */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) {
      console.error('[catch-info]', err); err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const v = cfVendors.value.find(x => x.vendorId === Number(form.vendorId));
      if (v) form.vendorNm = v.vendorNm;
      const ok = await showConfirm('저장', '정산조정을 저장하시겠습니까?');
      if (!ok) return;
      if (uiState.isNew) { form.adjId = 'ADJ-' + Date.now(); adjList.unshift({ ...form }); }
      else { const idx = adjList.findIndex(x => x.adjId === form.adjId); if (idx !== -1) Object.assign(adjList[idx], { ...form }); }
      closeForm();
      try {
        const res = await (uiState.isNew ? boApiSvc.stSettleAdj.create({ ...form }, '정산조정관리', '등록') : boApiSvc.stSettleAdj.update(form.adjId, { ...form }, '정산조정관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('저장되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (r) => {
      const ok = await showConfirm('삭제', `[${r.adjId}] 정산조정을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = adjList.findIndex(x => x.adjId === r.adjId); if (idx !== -1) adjList.splice(idx, 1); if (uiState.selectedId === r.adjId) closeForm();
      try {
        const res = await boApiSvc.stSettleAdj.remove(r.adjId, '정산조정관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* doApprove — 실행 */
    const doApprove = async (r) => {
      const ok = await showConfirm('승인', '정산조정을 승인하시겠습니까?');
      if (!ok) return;
      r.aprvStatusCd = '승인';
      try {
        const res = await boApiSvc.stSettleAdj.approve(r.adjId, { aprvStatusCd: '승인' }, '정산조정관리', '상태변경');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('승인되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 정산 조정 fnAprvBadge */
    const _SETTLE_ADJ_STATUS_FB = { '승인':'badge-green', '대기':'badge-blue', '반려':'badge-red' };
    /* fnAprvBadge — 유틸 */
    const fnAprvBadge = s => coUtil.cofCodeBadge('SETTLE_ADJ_STATUS', s, _SETTLE_ADJ_STATUS_FB[s] || 'badge-gray');

    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => ({ '매출조정':'badge-blue', '수수료조정':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');

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
      { key: 'type', label: '유형', type: 'select', options: () => codes.settle_adj_types, nullLabel: '유형 전체' },
      { key: 'status', label: '상태', type: 'select', options: () => codes.settle_adj_statuses, nullLabel: '상태 전체' },
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [
          { value: 'adjId',    label: '조정ID' },
          { value: 'vendorNm', label: '업체명' },
          { value: 'reason',   label: '사유' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력', width: '200px' },
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

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 조정 추가/수정 ================
    const baseFormColumns = [
      { key: 'vendorId', label: '업체', type: 'select', required: true, nullLabel: '선택',
        options: () => (cfVendors.value || []).map(v => ({ value: v.vendorId, label: v.vendorNm })) },
      { key: 'adjType',  label: '조정유형', type: 'select', required: true, nullable: false,
        options: () => codes.settle_adj_types },
      { key: 'adjAmt',   label: '조정금액(원)', type: 'number', required: true, placeholder: '음수 입력 시 차감' },
      { key: 'adjDate',  label: '조정일자', type: 'date' },
      { type: 'rowBreak' },
      { key: 'reason',   label: '사유', type: 'text', required: true,
        placeholder: '조정 사유를 입력하세요.', colSpan: 4 },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { uiState, codes, handleDateRangeChange, pager, adjList, baseSearchColumns, baseGridColumns, cfVendors, form, errors, openNew, openEdit, closeForm, handleSave, handleDelete, doApprove, fnAprvBadge, fnTypeBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange, baseFormColumns };
  },
  template: /* html */`
<div>
  <div class="page-title">정산조정</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">수집원장 데이터에 업체별 추가·차감 조정 항목을 입력하여 최종 정산액을 보정합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 조정 유형: 추가(+) / 차감(-) / 위약금 / 프로모션 분담금 등 • 조정 항목은 담당자 승인 후 정산마감에 반영됩니다. • 승인 상태: 대기 / 승인 / 반려 • 마감 완료된 기간의 조정은 재오픈 후 처리해야 합니다.
    </div>
  </div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <div class="card" style="margin-top:12px">
    <div class="toolbar">
      <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      <div style="margin-left:auto">
        <button class="btn btn-primary" @click="openNew">+ 조정 추가</button>
      </div>
    </div>
    <bo-grid
      :columns="baseGridColumns" :rows="adjList" :pager="pager" row-key="adjId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'" :row-actions="true"
      :row-class="(r) => uiState.selectedId===r.adjId ? 'selected' : ''"
      @set-page="setPage" @size-change="onSizeChange">
      <template #head-actions>액션</template>
      <template #row-actions="{ row: r }">
        <button v-if="r.aprvStatusCd==='대기'" class="btn btn-sm btn-green" @click="doApprove(r)">승인</button>
        <button class="btn btn-sm btn-primary" @click="openEdit(r)">수정</button>
        <button class="btn btn-sm btn-danger"  @click="handleDelete(r)">삭제</button>
      </template>
    </bo-grid>
  </div>
  <!-- 편집 폼 (BoFormArea 자동 렌더) -->
  <div v-if="uiState.selectedId" class="card" style="margin-top:12px">
    <div style="font-weight:700;margin-bottom:16px">{{ uiState.isNew ? '조정 추가' : '조정 수정' }}</div>
    <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
      :cols="4"
      @save="handleSave" @cancel="closeForm" />
  </div>
</div>
`,
};
