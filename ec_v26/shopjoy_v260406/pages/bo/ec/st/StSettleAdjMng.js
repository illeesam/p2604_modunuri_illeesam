/* ShopJoy Admin - 정산조정 */
window.StSettleAdjMng = {
  name: 'StSettleAdjMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: '', selectedId: null, isNew: false});
    const codes = reactive({
      settle_adj_types: [],
      settle_adj_statuses: [],
      date_range_opts: [],
    });

    /* 정산 조정 fnLoadCodes */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StSettleAdjMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGrid.pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      } else if (cmd === 'settleAdjs-add') {
        return openNew();
      } else if (cmd === 'baseForm-save') {
        return handleSave();
      } else if (cmd === 'baseForm-cancel') {
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
      console.log(' ■■ StSettleAdjMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'settleAdjs-rowApprove') {
        return doApprove(param);
      } else if (cmd === 'settleAdjs-rowEdit') {
        return openEdit(param);
      } else if (cmd === 'settleAdjs-rowDelete') {
        return handleDelete(param);
      } else if (cmd === 'settleAdjs-pager-setPage') {
        if (param >= 1 && param <= baseGrid.pager.pageTotalPage) { baseGrid.pager.pageNo = param; handleSearchData('PAGE_CLICK'); }
        return;
      } else if (cmd === 'settleAdjs-pager-sizeChange') {
        baseGrid.pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
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

    const vendors = reactive([]);
    const cfVendors = computed(() => vendors.filter(v => v.vendorType === '판매업체'));

    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        const [resV, resA] = await Promise.all([
          boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '정산조정관리', '목록조회'),
          (() => {
            const params = {
              pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize,
              ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
            };
            // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
            if (params.searchValue && !params.searchType) {
              params.searchType = 'adjId,vendorNm,reason';
            }
            return boApiSvc.stSettleAdj.getPage(params, '정산조정관리', '목록조회');
          })()
        ]);
        vendors.splice(0, vendors.length, ...(resV.data?.data?.pageList || resV.data?.data?.list || []));
        const data = resA.data?.data;
        adjs.splice(0, adjs.length, ...(data?.pageList || data?.list || []));
        baseGrid.pager.pageTotalCount = data?.pageTotalCount || adjs.length;
        baseGrid.pager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;
        Object.assign(baseGrid.pager.pageCond, data?.pageCond || baseGrid.pager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchData('DEFAULT');
    });

    const adjs = reactive([]);

    const baseGrid = coUtil.cofGrid(() => handleSearchData(), { pageSize: 10 });
    /* openEdit — 열기 */
    const openEdit = (r) => { Object.assign(baseForm, {...r}); uiState.selectedId = r.adjId; uiState.isNew = false; Object.keys(errors).forEach(k => delete errors[k]); };

    /* closeForm — 닫기 */
    const closeForm = () => { uiState.selectedId = null; };

    /* 정산 조정 저장 */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(baseForm, { abortEarly: false }); }
      catch (err) {
      console.error('[catch-info]', err); err.inner.forEach(e => { errors[e.path] = e.message; }); showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const v = cfVendors.value.find(x => x.vendorId === Number(baseForm.vendorId));
      if (v) { baseForm.vendorNm = v.vendorNm; }
      const ok = await showConfirm('저장', '정산조정을 저장하시겠습니까?');
      if (!ok) { return; }
      if (uiState.isNew) { baseForm.adjId = 'ADJ-' + Date.now(); adjs.unshift({ ...baseForm }); }
      else { const idx = adjs.findIndex(x => x.adjId === baseForm.adjId); if (idx !== -1) Object.assign(adjs[idx], { ...baseForm }); }
      closeForm();
      try {
        const res = await (uiState.isNew ? boApiSvc.stSettleAdj.create({ ...baseForm }, '정산조정관리', '등록') : boApiSvc.stSettleAdj.update(baseForm.adjId, { ...baseForm }, '정산조정관리', '저장'));
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
      const ok = await showConfirm('삭제', `[${r.adjId}] 정산조정을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = adjs.findIndex(x => x.adjId === r.adjId); if (idx !== -1) adjs.splice(idx, 1); if (uiState.selectedId === r.adjId) closeForm();
      try {
        const res = await boApiSvc.stSettleAdj.remove(r.adjId, '정산조정관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* doApprove — 실행 */
    const doApprove = async (r) => {
      const ok = await showConfirm('승인', '정산조정을 승인하시겠습니까?');
      if (!ok) { return; }
      r.aprvStatusCd = '승인';
      try {
        const res = await boApiSvc.stSettleAdj.approve(r.adjId, { aprvStatusCd: '승인' }, '정산조정관리', '상태변경');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('승인되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
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
    const onSearch = () => { baseGrid.pager.pageNo = 1; handleSearchData('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    정산조정
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      수집원장 데이터에 업체별 추가·차감 조정 항목을 입력하여 최종 정산액을 보정합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 조정 유형: 추가(+) / 차감(-) / 위약금 / 프로모션 분담금 등 • 조정 항목은 담당자 승인 후 정산마감에 반영됩니다. • 승인 상태: 대기 / 승인 / 반려 • 마감 완료된 기간의 조정은 재오픈 후 처리해야 합니다.
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
      <span class="list-count">
        총 {{ baseGrid.pager.pageTotalCount }}건
      </span>
      <div style="margin-left:auto">
        <button class="btn btn-primary" @click="handleBtnAction('settleAdjs-add')">
          + 조정 추가
        </button>
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="adjs" :pager="baseGrid.pager" row-key="adjId"
      list-title="목록" :count-text="baseGrid.pager.pageTotalCount + '건'" :row-actions="true"
      :row-class="(r) => uiState.selectedId===r.adjId ? 'selected' : ''"
      @set-page="n => handleSelectAction('settleAdjs-pager-setPage', n)" @size-change="handleSelectAction('settleAdjs-pager-sizeChange')">
      <template #head-actions>
        액션
      </template>
      <template #row-actions="{ row: r }">
        <button v-if="r.aprvStatusCd==='대기'" class="btn btn-sm btn-green" @click="handleSelectAction('settleAdjs-rowApprove', r)">
          승인
        </button>
        <button class="btn btn-sm btn-primary" @click="handleSelectAction('settleAdjs-rowEdit', r)">
          수정
        </button>
        <button class="btn btn-sm btn-danger"  @click="handleSelectAction('settleAdjs-rowDelete', r)">
          삭제
        </button>
      </template>
    </bo-grid>
  </div>
  <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 편집 폼 (BoFormArea 자동 렌더) ================================= -->
  <!-- ===== ■. 상세 패널 =================================================== -->
  <div v-if="uiState.selectedId" class="card" style="margin-top:12px">
    <div style="font-weight:700;margin-bottom:16px">
      {{ uiState.isNew ? '조정 추가' : '조정 수정' }}
    </div>
    <!-- ===== ■.■. 폼 영역 ================================================== -->
    <bo-form-area :columns="baseFormColumns" :form="baseForm" :errors="errors"
      :cols="4"
      @save="handleBtnAction('baseForm-save')" @cancel="handleBtnAction('baseForm-cancel')" />
  </div>
</div>
<!-- ===== □.□. 폼 영역 ================================================== -->
<!-- ===== □. 상세 패널 =================================================== -->
`,
};
