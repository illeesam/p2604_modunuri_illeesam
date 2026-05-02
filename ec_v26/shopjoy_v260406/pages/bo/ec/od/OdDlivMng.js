/* ShopJoy Admin - 배송관리 목록 + 하단 DlivDtl 임베드 */
window.OdDlivMng = {
  name: 'OdDlivMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const deliveries = reactive([]);
    const members = reactive([]);
    const uiState = reactive({ bulkOpen: false, loading: false, error: null, isPageCodeLoad: false, bulkTab: 'status'});
    const codes = reactive({ order_statuses: [], dliv_statuses: [], dliv_types: [], payment_methods: [], courier_codes: [], approval_actions: ['승인','반려','보류'], req_targets: ['주문','상품','배송','추가결재'], date_range_opts: [] });

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        const [delivRes, membersRes] = await Promise.all([
          boApiSvc.odDliv.getPage(params, '배송관리', '목록조회'),
          boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 10000 }, '배송관리', '목록조회')
        ]);
        deliveries.splice(0, deliveries.length, ...(delivRes.data?.data?.pageList || delivRes.data?.data?.list || []));
        members.splice(0, members.length, ...(membersRes.data?.data?.pageList || membersRes.data?.data?.list || []));
        pager.pageTotalCount = delivRes.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = delivRes.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, delivRes.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* ── 검색 파라미터 ── */
    const searchParam = reactive({
      kw: '',
      status: '',
      dateRange: '',
      dateStart: '',
      dateEnd: ''
    });
    const searchParamOrg = reactive({
      kw: '',
      status: '',
      dateRange: '',
      dateStart: '',
      dateEnd: ''
    });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
      Object.assign(searchParamOrg, searchParam);
    });

    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.order_statuses = await codeStore.snGetGrpCodes('ORDER_STATUS') || [];
        codes.dliv_statuses = await codeStore.snGetGrpCodes('DLIV_STATUS') || [];
        codes.dliv_types = await codeStore.snGetGrpCodes('DLIV_TYPE') || [];
        codes.payment_methods = await codeStore.snGetGrpCodes('PAYMENT_METHOD') || [];
        codes.courier_codes = await codeStore.snGetGrpCodes('COURIER') || [];
        codes.date_range_opts = codeStore.snGetGrpCodes('DATE_RANGE_OPT') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* DlivDtl 에 넘길 navigate: 'odDlivMng' 이동 요청 → 패널 닫기로 인터셉트 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odDlivMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 목록 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const fnStatusBadge = s => ({
      '준비중': 'badge-orange', '출고완료': 'badge-blue', '배송중': 'badge-blue',
      '배송완료': 'badge-green', '배송실패': 'badge-red',
    }[s] || 'badge-gray');

    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchData('DEFAULT');
    };
    const onReset = async () => {
      Object.assign(searchParam, searchParamOrg);
      pager.pageNo = 1;
      await handleSearchData();
    };

    const setPage  = n  => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    const handleDelete = async (d) => {
      const ok = await props.showConfirm('삭제', `[${d.dlivId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      if (!Array.isArray(deliveries)) return;
      const idx = deliveries.findIndex(x => x.dlivId === d.dlivId);
      if (idx !== -1) deliveries.splice(idx, 1);
      if (uiStateDetail.selectedId === d.dlivId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.odDliv.remove(d.dlivId, '배송관리', '삭제');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => boUtil.exportCsv(deliveries, [{label:'배송ID',key:'deliveryId'},{label:'주문ID',key:'orderId'},{label:'수령인',key:'receiverName'},{label:'연락처',key:'receiverPhone'},{label:'주소',key:'address'},{label:'택배사',key:'courierCd'},{label:'운송장',key:'trackingNo'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '배송목록.csv');

    /* 일괄선택 */
    const checked = reactive(new Set());
    const toggleCheck = (id) => { const s = new Set(checked); if (s.has(id)) s.delete(id); else s.add(id); checked = s; };
    const isChecked = (id) => checked.has(id);
    const cfAllChecked = computed(() => deliveries.length > 0 && deliveries.every(d => checked.has(d.dlivId)));
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) deliveries.forEach(d => s.delete(d.dlivId));
      else deliveries.forEach(d => s.add(d.dlivId));
      checked = s;
    };
    const COURIER_OPTIONS = ['CJ대한통운','롯데택배','한진택배','우체국택배','로젠택배'];
    const DEFAULT_TMPL = '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';
        const bulkForm = reactive({
      status:'', courier:'', trackingNo:'', apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'배송', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });
    const onApprToChange = () => {
      const m = (members).find(x => String(x.userId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.userNm || ''; bulkForm.apprToPhone = m.phone || ''; bulkForm.apprToEmail = m.email || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };
    const onReqTargetChange = () => {
      const ids = Array.from(checked);
      const first = window.safeArrayUtils.safeFind(Array.isArray(deliveries) ? deliveries : [], d => ids.includes(d.dlivId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문')      bulkForm.reqTargetNm = first.orderId || '';
      else if (bulkForm.reqTarget === '배송') bulkForm.reqTargetNm = first.dlivId || '';
      else if (bulkForm.reqTarget === '상품') {
        const o = (Array.isArray(orders) ? orders : []).find(x => x.orderId === first.orderId);
        bulkForm.reqTargetNm = o ? (o.prodNm || '') : '';
      } else bulkForm.reqTargetNm = first.dlivId || '';
    };
    const cfBuildTmplMsg = computed(() => (bulkForm.tmplMsg || '')
      .replace('{target}', bulkForm.reqTarget || '-')
      .replace('{targetNm}', bulkForm.reqTargetNm || '-')
      .replace('{amount}', Number(bulkForm.reqAmount||0).toLocaleString())
      .replace('{reason}', bulkForm.reqReason || '-'));
    const openBulk = () => {
      if (!checked.size) { props.showToast('항목을 선택하세요.', 'error'); return; }
      uiState.bulkTab = 'status';
      Object.assign(bulkForm, {
        status:'', courier:'', trackingNo:'', apprAction:'', apprComment:'',
        apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
        reqTarget:'배송', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
      });
      onReqTargetChange();
      uiState.bulkOpen = true;
    };
    const cfBulkPreview = computed(() => {
      if (!uiState.bulkOpen) return '';
      const ids = Array.from(checked);
      const selected = window.safeArrayUtils.safeFilter(deliveries, d => ids.includes(d.dlivId));
      let rows = [];
      if (uiState.bulkTab === 'status') {
        if (!bulkForm.status) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 배송상태 변경: ${d.status || '-'} → ${bulkForm.status}`);
      } else if (uiState.bulkTab === 'courier') {
        if (!bulkForm.courier && !bulkForm.trackingNo) return '';
        rows = selected.map(d => {
          const parts = [];
          if (bulkForm.courier) parts.push(`택배사: ${d.courier || '-'} → ${bulkForm.courier}`);
          if (bulkForm.trackingNo) parts.push(`운송장: ${d.trackingNo || '-'} → ${bulkForm.trackingNo}`);
          return `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 택배정보 변경: ${parts.join(', ')}`;
        });
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) return '';
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });
    const saveBulk = async () => {
      const ids = Array.from(checked);
      if (!ids.length) { props.showToast('항목을 선택하세요.', 'error'); uiState.bulkOpen = false; return; }
      if (uiState.bulkTab === 'status') {
        if (!bulkForm.status) { props.showToast('변경할 배송상태를 선택하세요.', 'error'); return; }
        const ok = await props.showConfirm('일괄 배송상태 변경', `선택한 ${ids.length}건을 [${bulkForm.status}] 상태로 변경하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(deliveries, d => { if (ids.includes(d.dlivId)) d.status = bulkForm.status; });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.bulkStatus({ ids, status: bulkForm.status }, '배송관리', '일괄처리');
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 변경되었습니다.`, 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (uiState.bulkTab === 'courier') {
        if (!bulkForm.courier && !bulkForm.trackingNo) { props.showToast('택배사 또는 운송장번호를 입력하세요.', 'error'); return; }
        const ok = await props.showConfirm('일괄 택배정보 변경', `선택한 ${ids.length}건의 택배정보를 변경하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(deliveries, d => {
          if (ids.includes(d.dlivId)) {
            if (bulkForm.courier) d.courier = bulkForm.courier;
            if (bulkForm.trackingNo) d.trackingNo = bulkForm.trackingNo;
          }
        });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.bulkCourier({ ids, courier: bulkForm.courier, trackingNo: bulkForm.trackingNo }, '배송관리', '택배정보');
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 변경되었습니다.`, 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) { props.showToast('결재처리 구분을 선택하세요.', 'error'); return; }
        const ok = await props.showConfirm('일괄 결재처리', `선택한 ${ids.length}건을 [${bulkForm.apprAction}] 처리하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(deliveries, d => { if (ids.includes(d.dlivId)) { d.apprStatus = bulkForm.apprAction; d.apprComment = bulkForm.apprComment; } });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.bulkApproval({ ids, action: bulkForm.apprAction, comment: bulkForm.apprComment }, '배송관리', '결재처리');
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 처리되었습니다.`, 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) { props.showToast('추가결재자(회원)를 선택하세요.', 'error'); return; }
        const ok = await props.showConfirm('일괄 추가결재요청', `선택한 ${ids.length}건을 [${bulkForm.apprToNm}](으)로 추가결재요청 하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(deliveries, d => { if (ids.includes(d.dlivId)) {
          d.apprToUserId = bulkForm.apprToUserId; d.apprToNm = bulkForm.apprToNm;
          d.reqTarget = bulkForm.reqTarget; d.reqTargetNm = bulkForm.reqTargetNm;
          d.reqAmount = Number(bulkForm.reqAmount||0); d.reqReason = bulkForm.reqReason;
        } });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.bulkApprovalReq({ ids, ...bulkForm, tmplMsgRendered: cfBuildTmplMsg.value }, '배송관리', '추가결재요청');
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 요청되었습니다.`, 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      }
    };

    const bulkOpen = Vue.toRef(uiState, 'bulkOpen');

    // ── return ───────────────────────────────────────────────────────────────

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), deliveries, members, uiState, codes, searchParam, searchParamOrg, handleDateRangeChange, cfSiteNm, pager, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, checked, toggleCheck, isChecked, cfAllChecked, toggleCheckAll, COURIER_OPTIONS, bulkForm, openBulk, saveBulk, cfBulkPreview, onApprToChange, onReqTargetChange, cfBuildTmplMsg };
  },
  template: /* html */`
<div>
  <div class="page-title">배송관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="배송ID / 주문ID / 회원명 / 수령인 검색" />
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.dliv_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>배송목록 <span class="list-count">{{ pager.pageTotalCount }}건</span>
        <span v-if="checked.size" style="margin-left:10px;font-size:12px;color:#1565c0;font-weight:700;">선택 {{ checked.size }}건</span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-blue btn-sm" :disabled="!checked.size" @click="openBulk">📝 변경작업 선택</button>
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th style="width:36px;text-align:center;"><input type="checkbox" :checked="cfAllChecked" @change="toggleCheckAll" /></th>
        <th style="width:36px;text-align:center;">번호</th><th>배송ID</th><th>주문ID</th><th>회원</th><th>수령인</th><th>택배사</th><th>운송장번호</th><th>배송지</th><th>상태</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="deliveries.length===0"><td colspan="12" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="(d, idx) in deliveries" :key="d?.dlivId"
          :style="(selectedId===d.dlivId?'background:#fff8f9;':'') + (isChecked(d.dlivId)?'background:#eef6fd;':'')">
          <td style="text-align:center;"><input type="checkbox" :checked="isChecked(d.dlivId)" @change="toggleCheck(d.dlivId)" /></td>
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td>
            <span class="title-link" @click="handleLoadDetail(d.dlivId)" :style="selectedId===d.dlivId?'color:#e8587a;font-weight:700;':''">
              {{ d.dlivId }}<span v-if="selectedId===d.dlivId" style="font-size:10px;margin-left:3px;">▼</span>
            </span>
          </td>
          <td><span class="ref-link" @click="showRefModal('order', d.orderId)">{{ d.orderId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('member', d.userId)">{{ d.userNm }}</span></td>
          <td>{{ d.receiver }}</td>
          <td>{{ d.courier }}</td>
          <td>{{ d.trackingNo || '-' }}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ d.address }}</td>
          <td><span class="badge" :class="fnStatusBadge(d.status)">{{ d.status }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(d.dlivId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(d)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
        <button v-for="n in pager.pageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
          <option v-for="s in pager.pageSizes" :key="Math.random()" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- ── 하단 상세: DlivDtl 컴포넌트 임베드 ──────────────────────────────────────── -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <od-dliv-dtl
      :key="selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="cfDetailEditId"
    />
  </div>

  <!-- ── 변경작업 모달 ──────────────────────────────────────────────────────── -->
  <div v-if="bulkOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;" @click.self="bulkOpen=false">
    <div style="background:#fff;border-radius:12px;width:480px;max-width:92vw;box-shadow:0 20px 50px rgba(0,0,0,0.3);overflow:hidden;">
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <b style="font-size:14px;">변경작업 <span style="color:#1565c0;">({{ checked.size }}건 선택)</span></b>
        <button class="btn btn-secondary btn-sm" @click="bulkOpen=false">✕</button>
      </div>
      <div style="display:flex;gap:6px;padding:10px 14px 0;background:#fafafa;">
        <button v-for="t in [{id:'status',label:'배송상태'},{id:'courier',label:'택배사·운송장'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t?.id"
          @click="uiState.bulkTab=t.id"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: uiState.bulkTab===t.id?800:600,background: uiState.bulkTab===t.id?'#fff':'transparent',color: uiState.bulkTab===t.id?'#e8587a':'#888',borderBottom: uiState.bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">{{ t.label }}</button>
      </div>
      <div style="padding:20px 18px;">
        <div v-if="uiState.bulkTab==='status'">
          <label class="form-label">변경할 배송상태</label>
          <select class="form-control" v-model="bulkForm.status">
            <option value="">선택하세요</option>
            <option v-for="c in codes.dliv_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div v-if="uiState.bulkTab==='courier'">
          <div class="form-group">
            <label class="form-label">택배사</label>
            <select class="form-control" v-model="bulkForm.courier">
              <option value="">선택하세요</option>
              <option v-for="c in (codes.courier_codes.length ? codes.courier_codes : COURIER_OPTIONS.map(v=>({codeValue:v,codeLabel:v})))" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">운송장번호</label>
            <input class="form-control" v-model="bulkForm.trackingNo" placeholder="(선택한 항목 모두 동일 번호로 변경)" />
          </div>
        </div>
        <div v-if="uiState.bulkTab==='approval'">
          <div class="form-group">
            <label class="form-label">결재처리 구분</label>
            <select class="form-control" v-model="bulkForm.apprAction">
              <option value="">선택하세요</option>
              <option v-for="a in codes.approval_actions" :key="Math.random()" :value="a">{{ a }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">결재 코멘트</label>
            <textarea class="form-control" v-model="bulkForm.apprComment" rows="2" placeholder="(선택)"></textarea>
          </div>
        </div>
        <div v-if="uiState.bulkTab==='approvalReq'">
          <div class="form-group">
            <label class="form-label">추가결재자 (회원선택)</label>
            <select class="form-control" v-model="bulkForm.apprToUserId" @change="onApprToChange">
              <option value="">선택하세요</option>
              <option v-for="m in members" :key="m?.userId" :value="m.userId">{{ m.userNm }} ({{ m.userId }})</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">전화번호</label>
              <input class="form-control" v-model="bulkForm.apprToPhone" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">이메일</label>
              <input class="form-control" v-model="bulkForm.apprToEmail" readonly />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">요청대상</label>
              <select class="form-control" v-model="bulkForm.reqTarget" @change="onReqTargetChange">
                <option v-for="t in codes.req_targets" :key="Math.random()" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">요청대상명</label>
              <input class="form-control" v-model="bulkForm.reqTargetNm" placeholder="수정 가능" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">요청금액</label>
            <input class="form-control" type="number" v-model.number="bulkForm.reqAmount" />
          </div>
          <div class="form-group">
            <label class="form-label">요청사유</label>
            <textarea class="form-control" v-model="bulkForm.reqReason" rows="2" placeholder="(선택)"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">전송 템플릿 <span style="font-size:10px;color:#888;">(치환: {target} {targetNm} {amount} {reason})</span></label>
            <textarea class="form-control" v-model="bulkForm.tmplMsg" rows="4" style="font-family:monospace;font-size:11.5px;"></textarea>
            <div style="margin-top:6px;padding:8px 10px;background:#f6f8fa;border-radius:6px;font-family:monospace;font-size:11.5px;white-space:pre-wrap;color:#333;border:1px dashed #d0d7de;">{{ cfBuildTmplMsg }}</div>
          </div>
        </div>
      </div>
      <div style="padding:10px 18px 14px;border-top:1px solid #eee;background:#fafafa;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:6px;">📋 작업내용</div>
        <textarea readonly :value="cfBulkPreview || '탭에서 변경값을 선택하면 작업내용이 자동으로 표시됩니다.'"
          style="width:100%;min-height:120px;max-height:200px;font-family:monospace;font-size:11.5px;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fff;resize:vertical;"></textarea>
      </div>
      <div style="padding:12px 18px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:6px;background:#fff;">
        <button class="btn btn-secondary btn-sm" @click="bulkOpen=false">취소</button>
        <button class="btn btn-primary btn-sm" @click="saveBulk">저장</button>
      </div>
    </div>
  </div>
</div>
`
};
