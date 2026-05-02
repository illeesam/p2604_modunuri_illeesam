/* ShopJoy Admin - 클레임관리 목록 + 하단 ClaimDtl 임베드 */
window.OdClaimMng = {
  name: 'OdClaimMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const claims = reactive([]);
    const members = reactive([]);
    const uiState = reactive({ bulkOpen: false, loading: false, error: null, isPageCodeLoad: false, bulkTab: 'status', sortKey: '', sortDir: 'asc' });
    const codes = reactive({ order_statuses: [], claim_types: [], claim_statuses: [], dliv_statuses: [], payment_methods: [], approval_actions: ['승인','반려','보류'], req_targets: ['주문','상품','배송','추가결재'], date_range_opts: [] });

    const SORT_MAP = { reg: { asc: 'reg_asc', desc: 'reg_desc' } };
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchData();
    };
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        const [claimsRes, membersRes] = await Promise.all([
          boApiSvc.odClaim.getPage(params, '클레임관리', '조회').catch(() => ({ data: { data: { pageList: [], pageTotalCount: 0 } } })),
          boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 10000 }, '클레임관리', '조회').catch(() => ({ data: { data: { pageList: [] } } }))
        ]);
        claims.splice(0, claims.length, ...(claimsRes.data?.data?.pageList || claimsRes.data?.data?.list || []));
        members.splice(0, members.length, ...(membersRes.data?.data?.pageList || membersRes.data?.data?.list || []));
        pager.pageTotalCount = claimsRes.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = claimsRes.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, claimsRes.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        claims.splice(0, claims.length);
        members.splice(0, members.length);
      } finally {
        uiState.loading = false;
      }
    };

    /* ── 검색 파라미터 ── */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { kw: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
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
        codes.claim_types = await codeStore.snGetGrpCodes('CLAIM_TYPE') || [];
        codes.claim_statuses = await codeStore.snGetGrpCodes('CLAIM_STATUS') || [];
        codes.dliv_statuses = await codeStore.snGetGrpCodes('DLIV_STATUS') || [];
        codes.payment_methods = await codeStore.snGetGrpCodes('PAYMENT_METHOD') || [];
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
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odClaimMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const fnTypeBadge = t => ({ '취소': 'badge-gray', '반품': 'badge-orange', '교환': 'badge-blue' }[t] || 'badge-gray');
    const fnStatusBadge = s => ({
      '신청': 'badge-orange', '승인': 'badge-blue', '수거중': 'badge-blue',
      '처리중': 'badge-purple', '환불대기': 'badge-orange',
      '완료': 'badge-green', '거부': 'badge-red', '철회': 'badge-gray',
    }[s] || 'badge-gray');
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchData('DEFAULT');
    };
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchData();
    };

    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    const handleDelete = async (c) => {
      const ok = await props.showConfirm('삭제', `[${c.claimId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      if (!Array.isArray(claims)) return;
      const idx = claims.findIndex(x => x.claimId === c.claimId);
      if (idx !== -1) claims.splice(idx, 1);
      if (uiStateDetail.selectedId === c.claimId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.odClaim.remove(c.claimId, '클레임관리', '삭제');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => boUtil.exportCsv(claims, [{label:'클레임ID',key:'claimId'},{label:'회원명',key:'userNm'},{label:'주문ID',key:'orderId'},{label:'유형',key:'type'},{label:'상태',key:'statusCd'},{label:'상품명',key:'prodNm'},{label:'사유',key:'reasonCd'},{label:'요청일',key:'requestDate'}], '클레임목록.csv');

    /* 일괄선택 */
    const checked = reactive(new Set());
    const toggleCheck = (id) => { const s = new Set(checked); if (s.has(id)) s.delete(id); else s.add(id); checked = s; };
    const isChecked = (id) => checked.has(id);
    const cfAllChecked = computed(() => claims.length > 0 && claims.every(c => checked.has(c.claimId)));
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) claims.forEach(c => s.delete(c.claimId));
      else claims.forEach(c => s.add(c.claimId));
      checked = s;
    };
    const claimStatusCodes = (codes.claim_statuses || [])
      .filter(c => c.codeGrp === 'CLAIM_STATUS' && c.useYn === 'Y')
      .sort((a, b) => a.sortOrd - b.sortOrd);
    const claimStatusForType = type => claimStatusCodes
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + type + '^'))
      .map(c => c.codeLabel);
    const CLAIM_STATUS_BY_TYPE = { '취소': claimStatusForType('CANCEL'), '반품': claimStatusForType('RETURN'), '교환': claimStatusForType('EXCHANGE') };
    const CLAIM_TYPE_OPTIONS = ['취소','반품','교환'];
    const DEFAULT_TMPL = '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';
        const bulkForm = reactive({
      statusByType: { '취소':'', '반품':'', '교환':'' }, type: '',
      apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'추가결재', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });
    const onApprToChange = () => {
      const m = (members).find(x => String(x.userId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.userNm || ''; bulkForm.apprToPhone = m.phone || ''; bulkForm.apprToEmail = m.email || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };
    const onReqTargetChange = () => {
      const ids = Array.from(checked);
      const first = window.safeArrayUtils.safeFind(Array.isArray(claims) ? claims : [], c => ids.includes(c.claimId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문')    bulkForm.reqTargetNm = first.orderId || '';
      else if (bulkForm.reqTarget === '상품') bulkForm.reqTargetNm = first.prodNm || '';
      else if (bulkForm.reqTarget === '배송') bulkForm.reqTargetNm = first.dlivId || (first.orderId ? '배송('+first.orderId+')' : '');
      else bulkForm.reqTargetNm = first.claimId || '';
    };
    const cfBuildTmplMsg = computed(() => {
      return (bulkForm.tmplMsg || '')
        .replace('{target}', bulkForm.reqTarget || '-')
        .replace('{targetNm}', bulkForm.reqTargetNm || '-')
        .replace('{amount}', Number(bulkForm.reqAmount||0).toLocaleString())
        .replace('{reason}', bulkForm.reqReason || '-');
    });
    const cfCheckedByType = computed(() => {
      const r = { '취소':[], '반품':[], '교환':[] };
      window.safeArrayUtils.safeForEach(claims, c => { if (checked.has(c.claimId) && r[c.type]) r[c.type].push(c.claimId); });
      return r;
    });
    const openBulk = () => {
      if (!checked.size) { props.showToast('항목을 선택하세요.', 'error'); return; }
      uiState.bulkTab = 'status';
      bulkForm.statusByType = { '취소':'', '반품':'', '교환':'' };
      bulkForm.type = '';
      bulkForm.apprAction = ''; bulkForm.apprComment = '';
      bulkForm.apprToUserId = ''; bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = '';
      bulkForm.reqTarget = '추가결재'; bulkForm.reqTargetNm = ''; bulkForm.reqAmount = 0; bulkForm.reqReason = ''; bulkForm.tmplMsg = DEFAULT_TMPL;
      onReqTargetChange();
      uiState.bulkOpen = true;
    };
    const cfBulkPreview = computed(() => {
      if (!uiState.bulkOpen) return '';
      const ids = Array.from(checked);
      const selected = window.safeArrayUtils.safeFilter(claims, c => ids.includes(c.claimId));
      let rows = [];
      if (uiState.bulkTab === 'status') {
        rows = selected
          .filter(c => bulkForm.statusByType[c.type])
          .map(c => `- [${c.claimId} / ${c.userNm} (${c.type})] [클레임관리] 클레임상태 변경: ${c.status || '-'} → ${bulkForm.statusByType[c.type]}`);
      } else if (uiState.bulkTab === 'type') {
        if (!bulkForm.type) return '';
        rows = selected.map(c => `- [${c.claimId} / ${c.userNm}] [클레임관리] 클레임유형 변경: ${c.type || '-'} → ${bulkForm.type}`);
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) return '';
        rows = selected.map(c => `- [${c.claimId} / ${c.userNm}] [클레임관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) return '';
        rows = selected.map(c => `- [${c.claimId} / ${c.userNm}] [클레임관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) return '';
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });
    const saveBulk = async () => {
      if (!checked.size) { props.showToast('항목을 선택하세요.', 'error'); uiState.bulkOpen = false; return; }
      if (uiState.bulkTab === 'status') {
        const changes = CLAIM_TYPE_OPTIONS
          .filter(t => bulkForm.statusByType[t] && cfCheckedByType.value[t].length)
          .map(t => ({ type: t, status: bulkForm.statusByType[t], ids: cfCheckedByType.value[t] }));
        if (!changes.length) { props.showToast('변경할 상태를 선택하세요.', 'error'); return; }
        const totalCnt = changes.reduce((s,c)=>s+c.ids.length,0);
        const msg = changes.map(c => `[${c.type}] ${c.ids.length}건 → ${c.status}`).join('\n');
        const ok = await props.showConfirm('일괄 클레임상태 변경', `${msg}\n\n총 ${totalCnt}건을 변경하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(changes, ch => {
          window.safeArrayUtils.safeForEach(claims, c => { if (ch.ids.includes(c.claimId)) c.status = ch.status; });
        });
        checked = new Set();
        uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odClaim.bulkStatus({ changes }, '클레임관리', '일괄처리');
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${totalCnt}건 변경되었습니다.`, 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (uiState.bulkTab === 'type') {
        const val = bulkForm.type;
        if (!val) { props.showToast('변경할 클레임유형을 선택하세요.', 'error'); return; }
        const ids = Array.from(checked);
        const ok = await props.showConfirm('일괄 클레임유형 변경', `선택한 ${ids.length}건의 클레임유형을 [${val}](으)로 변경하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(claims, c => { if (ids.includes(c.claimId)) c.type = val; });
        checked = new Set();
        uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odClaim.bulkType({ ids, type: val }, '클레임관리', '일괄처리');
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
        const ids = Array.from(checked);
        const ok = await props.showConfirm('일괄 결재처리', `선택한 ${ids.length}건을 [${bulkForm.apprAction}] 처리하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(claims, c => { if (ids.includes(c.claimId)) { c.apprStatus = bulkForm.apprAction; c.apprComment = bulkForm.apprComment; } });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odClaim.bulkApproval({ ids, action: bulkForm.apprAction, comment: bulkForm.apprComment }, '클레임관리', '결재처리');
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
        const ids = Array.from(checked);
        const ok = await props.showConfirm('일괄 추가결재요청', `선택한 ${ids.length}건을 [${bulkForm.apprToNm}](으)로 추가결재요청 하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(claims, c => { if (ids.includes(c.claimId)) {
          c.apprToUserId = bulkForm.apprToUserId; c.apprToNm = bulkForm.apprToNm;
          c.reqTarget = bulkForm.reqTarget; c.reqTargetNm = bulkForm.reqTargetNm;
          c.reqAmount = Number(bulkForm.reqAmount||0); c.reqReason = bulkForm.reqReason;
        } });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odClaim.bulkApprovalReq({ ids, ...bulkForm, tmplMsgRendered: cfBuildTmplMsg.value }, '클레임관리', '추가결재요청');
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

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), claims, members, uiState, codes, searchParam, handleDateRangeChange, cfSiteNm, pager, fnTypeBadge, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, checked, toggleCheck, isChecked, cfAllChecked, toggleCheckAll, CLAIM_STATUS_BY_TYPE, CLAIM_TYPE_OPTIONS, bulkForm, cfCheckedByType, openBulk, saveBulk, cfBulkPreview, onApprToChange, onReqTargetChange, cfBuildTmplMsg, onSort, sortIcon };
  },
  template: /* html */`
<div>
  <div class="page-title">클레임관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="클레임ID / 회원명 / 상품명 검색" @keyup.enter="onSearch" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="c in codes.claim_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.claim_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
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
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>클레임목록 <span class="list-count">{{ pager.pageTotalCount }}건</span>
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
        <th style="width:36px;text-align:center;">번호</th><th>클레임ID</th><th>회원</th><th>주문ID</th><th>상품</th><th>사유</th><th>클레임상태</th>
        <th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">신청일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th>
        <th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="claims.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(c, idx) in claims" :key="c?.claimId"
          :style="(selectedId===c.claimId?'background:#fff8f9;':'') + (isChecked(c.claimId)?'background:#eef6fd;':'')">
          <td style="text-align:center;"><input type="checkbox" :checked="isChecked(c.claimId)" @change="toggleCheck(c.claimId)" /></td>
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><span class="title-link" @click="handleLoadDetail(c.claimId)" :style="selectedId===c.claimId?'color:#e8587a;font-weight:700;':''">{{ c.claimId }}<span v-if="selectedId===c.claimId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userNm }}</span></td>
          <td><span class="ref-link" @click="showRefModal('order', c.orderId)">{{ c.orderId }}</span></td>
          <td>{{ c.prodNm }}</td>
          <td>{{ c.reason }}</td>
          <td>
            <span style="display:inline-flex;align-items:center;gap:3px;">
              <span :style="{
                fontSize:'10px',padding:'2px 8px',borderRadius:'10px',color:'#fff',fontWeight:700,
                background: c.type==='취소' ? '#ef4444' : c.type==='반품' ? '#FFBB00' : '#3b82f6',
              }">{{ c.type }}</span>
              <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:#f3f4f6;color:#374151;font-weight:600;border:1px solid #e5e7eb;">{{ c.status }}</span>
            </span>
          </td>
          <td>{{ c.requestDate.slice(0,10) }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(c.claimId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(c)">삭제</button>
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

  <!-- ── 하단 상세: ClaimDtl 임베드 ──────────────────────────────────────────── -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <od-claim-dtl
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
    <div style="background:#fff;border-radius:12px;width:640px;max-width:94vw;box-shadow:0 20px 50px rgba(0,0,0,0.3);overflow:hidden;max-height:90vh;display:flex;flex-direction:column;">
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <b style="font-size:14px;">변경작업 <span style="color:#1565c0;">({{ checked.size }}건 선택)</span></b>
        <button class="btn btn-secondary btn-sm" @click="bulkOpen=false">✕</button>
      </div>
      <div style="display:flex;gap:6px;padding:10px 14px 0;background:#fafafa;">
        <button v-for="t in [{id:'status',label:'클레임상태'},{id:'type',label:'클레임유형'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t?.id"
          @click="uiState.bulkTab=t.id"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: uiState.bulkTab===t.id?800:600,background: uiState.bulkTab===t.id?'#fff':'transparent',color: uiState.bulkTab===t.id?'#e8587a':'#888',borderBottom: uiState.bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">{{ t.label }}</button>
      </div>
      <div style="padding:20px 18px;">
        <div v-if="uiState.bulkTab==='status'">
          <div v-for="t in codes.claim_types.map(c=>c.codeValue)" :key="Math.random()" class="form-group" :style="{opacity: (cfCheckedByType[t]||[]).length ? 1 : 0.4}">
            <label class="form-label">
              <span :style="{display:'inline-block',fontSize:'10px',padding:'2px 8px',borderRadius:'10px',color:'#fff',fontWeight:700,marginRight:'6px',background: t==='취소'?'#ef4444':t==='반품'?'#FFBB00':'#3b82f6'}">{{ t }}</span>
              상태
              <span style="font-size:11px;color:#1565c0;margin-left:4px;">(대상 {{ (cfCheckedByType[t]||[]).length }}건)</span>
            </label>
            <select class="form-control" v-model="bulkForm.statusByType[t]" :disabled="!(cfCheckedByType[t]||[]).length">
              <option value="">{{ (cfCheckedByType[t]||[]).length ? '선택하세요 (미선택시 변경안함)' : '선택된 항목 없음' }}</option>
              <option v-for="s in CLAIM_STATUS_BY_TYPE[t]" :key="Math.random()" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div v-if="uiState.bulkTab==='type'">
          <label class="form-label">변경할 클레임유형</label>
          <select class="form-control" v-model="bulkForm.type">
            <option value="">선택하세요</option>
            <option v-for="c in codes.claim_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
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
