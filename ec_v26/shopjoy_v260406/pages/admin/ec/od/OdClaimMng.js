/* ShopJoy Admin - 클레임관리 목록 + 하단 ClaimDtl 임베드 */
window.OdClaimMng = {
  name: 'OdClaimMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const searchType = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    /* 하단 상세 */
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odClaimMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = Vue.reactive({ kw: '', type: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.claims.filter(c => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !c.claimId.toLowerCase().includes(kw) && !c.userNm.toLowerCase().includes(kw) && !c.prodNm.toLowerCase().includes(kw)) return false;
      if (applied.type && c.type !== applied.type) return false;
      if (applied.status && c.status !== applied.status) return false;
      const _d = String(c.requestDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
      return true;
    }));
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const typeBadge = t => ({ '취소': 'badge-gray', '반품': 'badge-orange', '교환': 'badge-blue' }[t] || 'badge-gray');
    const statusBadge = s => ({
      '신청': 'badge-orange', '승인': 'badge-blue', '수거중': 'badge-blue',
      '처리중': 'badge-purple', '환불대기': 'badge-orange',
      '완료': 'badge-green', '거부': 'badge-red', '철회': 'badge-gray',
    }[s] || 'badge-gray');
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        type: searchType.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchType.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', type: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (c) => {
      const ok = await props.showConfirm('삭제', `[${c.claimId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.claims.findIndex(x => x.claimId === c.claimId);
      if (idx !== -1) props.adminData.claims.splice(idx, 1);
      if (selectedId.value === c.claimId) selectedId.value = null;
      try {
        const res = await window.adminApi.delete(`claims/${c.claimId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'클레임ID',key:'claimId'},{label:'회원명',key:'userNm'},{label:'주문ID',key:'orderId'},{label:'유형',key:'type'},{label:'상태',key:'statusCd'},{label:'상품명',key:'prodNm'},{label:'사유',key:'reasonCd'},{label:'요청일',key:'requestDate'}], '클레임목록.csv');

    /* 일괄선택 */
    const checked = ref(new Set());
    const toggleCheck = (id) => { const s = new Set(checked.value); if (s.has(id)) s.delete(id); else s.add(id); checked.value = s; };
    const isChecked = (id) => checked.value.has(id);
    const allChecked = computed(() => pageList.value.length > 0 && pageList.value.every(c => checked.value.has(c.claimId)));
    const toggleCheckAll = () => {
      const s = new Set(checked.value);
      if (allChecked.value) pageList.value.forEach(c => s.delete(c.claimId));
      else pageList.value.forEach(c => s.add(c.claimId));
      checked.value = s;
    };
    const claimStatusCodes = (props.adminData.codes || [])
      .filter(c => c.codeGrp === 'CLAIM_STATUS' && c.useYn === 'Y')
      .sort((a, b) => a.sortOrd - b.sortOrd);
    const claimStatusForType = type => claimStatusCodes
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + type + '^'))
      .map(c => c.codeLabel);
    const CLAIM_STATUS_BY_TYPE = { '취소': claimStatusForType('CANCEL'), '반품': claimStatusForType('RETURN'), '교환': claimStatusForType('EXCHANGE') };
    const CLAIM_TYPE_OPTIONS = ['취소','반품','교환'];
    const APPROVAL_ACTIONS = ['승인','반려','보류'];
    const REQ_TARGETS = ['주문','상품','배송','추가결재'];
    const DEFAULT_TMPL = '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';
    const bulkOpen = ref(false);
    const bulkTab = ref('status');
    const bulkForm = reactive({
      statusByType: { '취소':'', '반품':'', '교환':'' }, type: '',
      apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'추가결재', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });
    const onApprToChange = () => {
      const m = (props.adminData.members || []).find(x => String(x.userId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.userNm || ''; bulkForm.apprToPhone = m.phone || ''; bulkForm.apprToEmail = m.email || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };
    const onReqTargetChange = () => {
      const ids = Array.from(checked.value);
      const first = props.adminData.claims.find(c => ids.includes(c.claimId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문')    bulkForm.reqTargetNm = first.orderId || '';
      else if (bulkForm.reqTarget === '상품') bulkForm.reqTargetNm = first.prodNm || '';
      else if (bulkForm.reqTarget === '배송') bulkForm.reqTargetNm = first.dlivId || (first.orderId ? '배송('+first.orderId+')' : '');
      else bulkForm.reqTargetNm = first.claimId || '';
    };
    const buildTmplMsg = computed(() => {
      return (bulkForm.tmplMsg || '')
        .replace('{target}', bulkForm.reqTarget || '-')
        .replace('{targetNm}', bulkForm.reqTargetNm || '-')
        .replace('{amount}', Number(bulkForm.reqAmount||0).toLocaleString())
        .replace('{reason}', bulkForm.reqReason || '-');
    });
    const checkedByType = computed(() => {
      const r = { '취소':[], '반품':[], '교환':[] };
      props.adminData.claims.forEach(c => { if (checked.value.has(c.claimId) && r[c.type]) r[c.type].push(c.claimId); });
      return r;
    });
    const openBulk = () => {
      if (!checked.value.size) { props.showToast('항목을 선택하세요.', 'error'); return; }
      bulkTab.value = 'status';
      bulkForm.statusByType = { '취소':'', '반품':'', '교환':'' };
      bulkForm.type = '';
      bulkForm.apprAction = ''; bulkForm.apprComment = '';
      bulkForm.apprToUserId = ''; bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = '';
      bulkForm.reqTarget = '추가결재'; bulkForm.reqTargetNm = ''; bulkForm.reqAmount = 0; bulkForm.reqReason = ''; bulkForm.tmplMsg = DEFAULT_TMPL;
      onReqTargetChange();
      bulkOpen.value = true;
    };
    const bulkPreview = computed(() => {
      if (!bulkOpen.value) return '';
      const ids = Array.from(checked.value);
      const selected = props.adminData.claims.filter(c => ids.includes(c.claimId));
      let rows = [];
      if (bulkTab.value === 'status') {
        rows = selected
          .filter(c => bulkForm.statusByType[c.type])
          .map(c => `- [${c.claimId} / ${c.userNm} (${c.type})] [클레임관리] 클레임상태 변경: ${c.status || '-'} → ${bulkForm.statusByType[c.type]}`);
      } else if (bulkTab.value === 'type') {
        if (!bulkForm.type) return '';
        rows = selected.map(c => `- [${c.claimId} / ${c.userNm}] [클레임관리] 클레임유형 변경: ${c.type || '-'} → ${bulkForm.type}`);
      } else if (bulkTab.value === 'approval') {
        if (!bulkForm.apprAction) return '';
        rows = selected.map(c => `- [${c.claimId} / ${c.userNm}] [클레임관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (bulkTab.value === 'approvalReq') {
        if (!bulkForm.apprToUserId) return '';
        rows = selected.map(c => `- [${c.claimId} / ${c.userNm}] [클레임관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) return '';
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });
    const saveBulk = async () => {
      if (!checked.value.size) { props.showToast('항목을 선택하세요.', 'error'); bulkOpen.value = false; return; }
      if (bulkTab.value === 'status') {
        const changes = CLAIM_TYPE_OPTIONS
          .filter(t => bulkForm.statusByType[t] && checkedByType.value[t].length)
          .map(t => ({ type: t, status: bulkForm.statusByType[t], ids: checkedByType.value[t] }));
        if (!changes.length) { props.showToast('변경할 상태를 선택하세요.', 'error'); return; }
        const totalCnt = changes.reduce((s,c)=>s+c.ids.length,0);
        const msg = changes.map(c => `[${c.type}] ${c.ids.length}건 → ${c.status}`).join('\n');
        const ok = await props.showConfirm('일괄 클레임상태 변경', `${msg}\n\n총 ${totalCnt}건을 변경하시겠습니까?`);
        if (!ok) return;
        changes.forEach(ch => {
          props.adminData.claims.forEach(c => { if (ch.ids.includes(c.claimId)) c.status = ch.status; });
        });
        checked.value = new Set();
        bulkOpen.value = false;
        try {
          const res = await window.adminApi.put('claims/bulk-status', { changes });
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${totalCnt}건 변경되었습니다.`, 'success');
        } catch (err) {
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (bulkTab.value === 'type') {
        const val = bulkForm.type;
        if (!val) { props.showToast('변경할 클레임유형을 선택하세요.', 'error'); return; }
        const ids = Array.from(checked.value);
        const ok = await props.showConfirm('일괄 클레임유형 변경', `선택한 ${ids.length}건의 클레임유형을 [${val}](으)로 변경하시겠습니까?`);
        if (!ok) return;
        props.adminData.claims.forEach(c => { if (ids.includes(c.claimId)) c.type = val; });
        checked.value = new Set();
        bulkOpen.value = false;
        try {
          const res = await window.adminApi.put('claims/bulk-type', { ids, type: val });
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 변경되었습니다.`, 'success');
        } catch (err) {
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (bulkTab.value === 'approval') {
        if (!bulkForm.apprAction) { props.showToast('결재처리 구분을 선택하세요.', 'error'); return; }
        const ids = Array.from(checked.value);
        const ok = await props.showConfirm('일괄 결재처리', `선택한 ${ids.length}건을 [${bulkForm.apprAction}] 처리하시겠습니까?`);
        if (!ok) return;
        props.adminData.claims.forEach(c => { if (ids.includes(c.claimId)) { c.apprStatus = bulkForm.apprAction; c.apprComment = bulkForm.apprComment; } });
        checked.value = new Set(); bulkOpen.value = false;
        try {
          const res = await window.adminApi.put('claims/bulk-approval', { ids, action: bulkForm.apprAction, comment: bulkForm.apprComment });
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 처리되었습니다.`, 'success');
        } catch (err) {
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (bulkTab.value === 'approvalReq') {
        if (!bulkForm.apprToUserId) { props.showToast('추가결재자(회원)를 선택하세요.', 'error'); return; }
        const ids = Array.from(checked.value);
        const ok = await props.showConfirm('일괄 추가결재요청', `선택한 ${ids.length}건을 [${bulkForm.apprToNm}](으)로 추가결재요청 하시겠습니까?`);
        if (!ok) return;
        props.adminData.claims.forEach(c => { if (ids.includes(c.claimId)) {
          c.apprToUserId = bulkForm.apprToUserId; c.apprToNm = bulkForm.apprToNm;
          c.reqTarget = bulkForm.reqTarget; c.reqTargetNm = bulkForm.reqTargetNm;
          c.reqAmount = Number(bulkForm.reqAmount||0); c.reqReason = bulkForm.reqReason;
        } });
        checked.value = new Set(); bulkOpen.value = false;
        try {
          const res = await window.adminApi.put('claims/bulk-approvalReq', { ids, ...bulkForm, tmplMsgRendered: buildTmplMsg.value });
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 요청되었습니다.`, 'success');
        } catch (err) {
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      }
    };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteNm, searchKw, searchType, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, typeBadge, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, exportExcel, checked, toggleCheck, isChecked, allChecked, toggleCheckAll, CLAIM_STATUS_BY_TYPE, CLAIM_TYPE_OPTIONS, APPROVAL_ACTIONS, REQ_TARGETS, bulkOpen, bulkTab, bulkForm, checkedByType, openBulk, saveBulk, bulkPreview, onApprToChange, onReqTargetChange, buildTmplMsg };
  },
  template: /* html */`
<div>
  <div class="page-title">클레임관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="클레임ID / 회원명 / 상품명 검색" />
      <select v-model="searchType"><option value="">유형 전체</option><option>취소</option><option>반품</option><option>교환</option></select>
      <select v-model="searchStatus">
        <option value="">상태 전체</option>
        <option>신청</option><option>승인</option><option>수거중</option>
        <option>처리중</option><option>환불대기</option><option>완료</option><option>거부</option><option>철회</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>클레임목록 <span class="list-count">{{ total }}건</span>
        <span v-if="checked.size" style="margin-left:10px;font-size:12px;color:#1565c0;font-weight:700;">선택 {{ checked.size }}건</span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-blue btn-sm" :disabled="!checked.size" @click="openBulk">📝 변경작업 선택</button>
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th style="width:36px;text-align:center;"><input type="checkbox" :checked="allChecked" @change="toggleCheckAll" /></th>
        <th>클레임ID</th><th>회원</th><th>주문ID</th><th>상품</th><th>사유</th><th>클레임상태</th><th>신청일</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="c in pageList" :key="c.claimId"
          :style="(selectedId===c.claimId?'background:#fff8f9;':'') + (isChecked(c.claimId)?'background:#eef6fd;':'')">
          <td style="text-align:center;"><input type="checkbox" :checked="isChecked(c.claimId)" @change="toggleCheck(c.claimId)" /></td>
          <td><span class="title-link" @click="loadDetail(c.claimId)" :style="selectedId===c.claimId?'color:#e8587a;font-weight:700;':''">{{ c.claimId }}<span v-if="selectedId===c.claimId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
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
          <td style="font-size:12px;color:#2563eb;">{{ siteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(c.claimId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(c)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 하단 상세: ClaimDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <od-claim-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :admin-data="adminData"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="detailEditId"
    />
  </div>

  <!-- 변경작업 모달 -->
  <div v-if="bulkOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;" @click.self="bulkOpen=false">
    <div style="background:#fff;border-radius:12px;width:640px;max-width:94vw;box-shadow:0 20px 50px rgba(0,0,0,0.3);overflow:hidden;max-height:90vh;display:flex;flex-direction:column;">
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <b style="font-size:14px;">변경작업 <span style="color:#1565c0;">({{ checked.size }}건 선택)</span></b>
        <button class="btn btn-secondary btn-sm" @click="bulkOpen=false">✕</button>
      </div>
      <div style="display:flex;gap:6px;padding:10px 14px 0;background:#fafafa;">
        <button v-for="t in [{id:'status',label:'클레임상태'},{id:'type',label:'클레임유형'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t.id"
          @click="bulkTab=t.id"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: bulkTab===t.id?800:600,background: bulkTab===t.id?'#fff':'transparent',color: bulkTab===t.id?'#e8587a':'#888',borderBottom: bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">{{ t.label }}</button>
      </div>
      <div style="padding:20px 18px;">
        <div v-if="bulkTab==='status'">
          <div v-for="t in CLAIM_TYPE_OPTIONS" :key="t" class="form-group" :style="{opacity: checkedByType[t].length ? 1 : 0.4}">
            <label class="form-label">
              <span :style="{display:'inline-block',fontSize:'10px',padding:'2px 8px',borderRadius:'10px',color:'#fff',fontWeight:700,marginRight:'6px',background: t==='취소'?'#ef4444':t==='반품'?'#FFBB00':'#3b82f6'}">{{ t }}</span>
              상태
              <span style="font-size:11px;color:#1565c0;margin-left:4px;">(대상 {{ checkedByType[t].length }}건)</span>
            </label>
            <select class="form-control" v-model="bulkForm.statusByType[t]" :disabled="!checkedByType[t].length">
              <option value="">{{ checkedByType[t].length ? '선택하세요 (미선택시 변경안함)' : '선택된 항목 없음' }}</option>
              <option v-for="s in CLAIM_STATUS_BY_TYPE[t]" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div v-if="bulkTab==='type'">
          <label class="form-label">변경할 클레임유형</label>
          <select class="form-control" v-model="bulkForm.type">
            <option value="">선택하세요</option>
            <option v-for="t in CLAIM_TYPE_OPTIONS" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div v-if="bulkTab==='approval'">
          <div class="form-group">
            <label class="form-label">결재처리 구분</label>
            <select class="form-control" v-model="bulkForm.apprAction">
              <option value="">선택하세요</option>
              <option v-for="a in APPROVAL_ACTIONS" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">결재 코멘트</label>
            <textarea class="form-control" v-model="bulkForm.apprComment" rows="2" placeholder="(선택)"></textarea>
          </div>
        </div>
        <div v-if="bulkTab==='approvalReq'">
          <div class="form-group">
            <label class="form-label">추가결재자 (회원선택)</label>
            <select class="form-control" v-model="bulkForm.apprToUserId" @change="onApprToChange">
              <option value="">선택하세요</option>
              <option v-for="m in adminData.members" :key="m.userId" :value="m.userId">{{ m.userNm }} ({{ m.userId }})</option>
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
                <option v-for="t in REQ_TARGETS" :key="t" :value="t">{{ t }}</option>
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
            <div style="margin-top:6px;padding:8px 10px;background:#f6f8fa;border-radius:6px;font-family:monospace;font-size:11.5px;white-space:pre-wrap;color:#333;border:1px dashed #d0d7de;">{{ buildTmplMsg }}</div>
          </div>
        </div>
      </div>
      <div style="padding:10px 18px 14px;border-top:1px solid #eee;background:#fafafa;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:6px;">📋 작업내용</div>
        <textarea readonly :value="bulkPreview || '탭에서 변경값을 선택하면 작업내용이 자동으로 표시됩니다.'"
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
