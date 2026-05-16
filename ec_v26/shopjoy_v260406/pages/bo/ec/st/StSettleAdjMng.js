/* ShopJoy Admin - 정산조정 */
window.StSettleAdjMng = {
  name: 'StSettleAdjMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
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
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


            const dateEnd   = ref('');

    /* 정산 조정 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const vendorList = reactive([]);
    const cfVendors = computed(() => vendorList.filter(v => v.vendorType === '판매업체'));

    /* 정산 조정 목록조회 */
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
              params.searchType = 'def_adjId,def_vendorNm,def_reason';
            }
            return boApiSvc.stSettleAdj.getPage(params, '정산조정관리', '목록조회');
          })()
        ]);
        vendorList.splice(0, vendorList.length, ...(resV.data?.data?.list || []));
        const data = resA.data?.data;
        adjList.splice(0, adjList.length, ...(data?.list || []));
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

    /* 정산 조정 fnBuildPagerNums */
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

    /* 정산 조정 openNew */
    const openNew = () => {
      Object.assign(form, { adjId: null, adjDate: new Date().toISOString().slice(0,10), vendorId: '', vendorNm: '', adjType: '매출조정', adjAmt: 0, reason: '', aprvStatusCd: '대기', regUserNm: '관리자' });
      uiState.selectedId = '__new__'; uiState.isNew = true;
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* 정산 조정 openEdit */
    const openEdit = (r) => { Object.assign(form, {...r}); uiState.selectedId = r.adjId; uiState.isNew = false; Object.keys(errors).forEach(k => delete errors[k]); };

    /* 정산 조정 closeForm */
    const closeForm = () => { uiState.selectedId = null; };

    /* 정산 조정 저장 */
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

    /* 정산 조정 삭제 */
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

    /* 정산 조정 doApprove */
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
    const fnAprvBadge = s => ({ '승인':'badge-green', '대기':'badge-blue', '반려':'badge-red' }[s] || 'badge-gray');

    /* 정산 조정 fnTypeBadge */
    const fnTypeBadge = t => ({ '매출조정':'badge-blue', '수수료조정':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');

    /* 정산 조정 fmtW */
    const fmtW = n => (n >= 0 ? '' : '-') + Math.abs(Number(n)).toLocaleString() + '원';

    /* 정산 조정 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    /* 정산 조정 onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };

    /* 정산 조정 setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData('PAGE_CLICK'); } };

    /* 정산 조정 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    // -- return ---------------------------------------------------------------

    return { uiState, codes, handleDateRangeChange, pager, adjList, cfVendors, form, errors, openNew, openEdit, closeForm, handleSave, handleDelete, doApprove, fnAprvBadge, fnTypeBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">정산조정</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">수집원장 데이터에 업체별 추가·차감 조정 항목을 입력하여 최종 정산액을 보정합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 조정 유형: 추가(+) / 차감(-) / 위약금 / 프로모션 분담금 등
• 조정 항목은 담당자 승인 후 정산마감에 반영됩니다.
• 승인 상태: 대기 / 승인 / 반려
• 마감 완료된 기간의 조정은 재오픈 후 처리해야 합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="uiState.dateRange" @change="handleDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" />
      <span style="line-height:32px">~</span>
      <input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.type" style="width:120px">
        <option value="">유형 전체</option><option v-for="c in codes.settle_adj_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status" style="width:100px">
        <option value="">상태 전체</option><option v-for="c in codes.settle_adj_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'def_adjId',    label: '조정ID' },
          { value: 'def_vendorNm', label: '업체명' },
          { value: 'def_reason',   label: '사유' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" style="width:200px" @keyup.enter="() => onSearch?.()" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div class="toolbar">
      <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      <div style="margin-left:auto"><button class="btn btn-primary" @click="openNew">+ 조정 추가</button></div>
    </div>
    <table class="bo-table">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th>조정ID</th><th>조정일자</th><th>업체명</th><th>유형</th><th>조정금액</th><th>사유</th><th>승인상태</th><th>등록자</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="(r, idx) in adjList" :key="r?.adjId" :class="{selected: uiState.selectedId===r.adjId}">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td>{{ r.adjId }}</td>
          <td>{{ r.adjDate }}</td>
          <td>{{ r.vendorNm }}</td>
          <td><span class="badge" :class="fnTypeBadge(r.adjType)">{{ r.adjType }}</span></td>
          <td :style="r.adjAmt<0?'color:#e74c3c;font-weight:700':'color:#27ae60;font-weight:700'">{{ fmtW(r.adjAmt) }}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.reason }}</td>
          <td><span class="badge" :class="fnAprvBadge(r.aprvStatusCd)">{{ r.aprvStatusCd }}</span></td>
          <td>{{ r.regUserNm }}</td>
          <td class="actions">
            <button v-if="r.aprvStatusCd==='대기'" class="btn btn-sm btn-green" @click="doApprove(r)">승인</button>
            <button class="btn btn-sm btn-primary" @click="openEdit(r)">수정</button>
            <button class="btn btn-sm btn-danger"  @click="handleDelete(r)">삭제</button>
          </td>
        </tr>
        <tr v-if="!adjList.length"><td colspan="10" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- 편집 폼 ----------------------------------------------------------- -->
  <div v-if="uiState.selectedId" class="card" style="margin-top:12px">
    <div style="font-weight:700;margin-bottom:16px">{{ uiState.isNew ? '조정 추가' : '조정 수정' }}</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">업체 <span style="color:red">*</span></label>
        <select class="form-control" :class="{'is-invalid':errors.vendorId}" v-model.number="form.vendorId">
          <option value="">선택</option>
          <option v-for="v in cfVendors" :key="v?.vendorId" :value="v.vendorId">{{ v.vendorNm }}</option>
        </select>
        <div v-if="errors.vendorId" class="field-error">{{ errors.vendorId }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">조정유형 <span style="color:red">*</span></label>
        <select class="form-control" :class="{'is-invalid':errors.adjType}" v-model="form.adjType">
          <option v-for="c in codes.settle_adj_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
        <div v-if="errors.adjType" class="field-error">{{ errors.adjType }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">조정금액(원) <span style="color:red">*</span></label>
        <input class="form-control" :class="{'is-invalid':errors.adjAmt}" v-model.number="form.adjAmt" type="number" placeholder="음수 입력 시 차감" />
        <div v-if="errors.adjAmt" class="field-error">{{ errors.adjAmt }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">조정일자</label>
        <input class="form-control" v-model="form.adjDate" type="date" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">사유 <span style="color:red">*</span></label>
      <input class="form-control" :class="{'is-invalid':errors.reason}" v-model="form.reason" placeholder="조정 사유를 입력하세요." />
      <div v-if="errors.reason" class="field-error">{{ errors.reason }}</div>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="handleSave">저장</button>
      <button class="btn btn-secondary" @click="closeForm">취소</button>
    </div>
  </div>
</div>
`,
};
