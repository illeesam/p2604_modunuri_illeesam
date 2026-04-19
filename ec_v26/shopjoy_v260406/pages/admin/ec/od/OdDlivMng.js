/* ShopJoy Admin - 배송관리 목록 + 하단 DlivDtl 임베드 */
window.OdDlivMng = {
  name: 'OdDlivMng',
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

    /* DlivDtl 에 넘길 navigate: 'odDlivMng' 이동 요청 → 패널 닫기로 인터셉트 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odDlivMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };

    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = Vue.reactive({ kw: '', status: '', dateStart: '', dateEnd: '' });

    /* 목록 */
    const filtered = computed(() => props.adminData.deliveries.filter(d => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !d.dlivId.toLowerCase().includes(kw) && !d.orderId.toLowerCase().includes(kw)
            && !d.userNm.toLowerCase().includes(kw) && !d.receiver.toLowerCase().includes(kw)) return false;
      if (applied.status && d.status !== applied.status) return false;
      const _d = String(d.regDate || '').slice(0, 10);
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

    const statusBadge = s => ({
      '준비중': 'badge-orange', '출고완료': 'badge-blue', '배송중': 'badge-blue',
      '배송완료': 'badge-green', '배송실패': 'badge-red',
    }[s] || 'badge-gray');

    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage  = n  => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (d) => {
      const ok = await props.showConfirm('삭제', `[${d.dlivId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.deliveries.findIndex(x => x.dlivId === d.dlivId);
      if (idx !== -1) props.adminData.deliveries.splice(idx, 1);
      if (selectedId.value === d.dlivId) selectedId.value = null;
      try {
        const res = await window.adminApi.delete(`deliveries/${d.dlivId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'배송ID',key:'deliveryId'},{label:'주문ID',key:'orderId'},{label:'수령인',key:'receiverName'},{label:'연락처',key:'receiverPhone'},{label:'주소',key:'address'},{label:'택배사',key:'courierCd'},{label:'운송장',key:'trackingNo'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '배송목록.csv');

    /* 일괄선택 */
    const checked = ref(new Set());
    const toggleCheck = (id) => { const s = new Set(checked.value); if (s.has(id)) s.delete(id); else s.add(id); checked.value = s; };
    const isChecked = (id) => checked.value.has(id);
    const allChecked = computed(() => pageList.value.length > 0 && pageList.value.every(d => checked.value.has(d.dlivId)));
    const toggleCheckAll = () => {
      const s = new Set(checked.value);
      if (allChecked.value) pageList.value.forEach(d => s.delete(d.dlivId));
      else pageList.value.forEach(d => s.add(d.dlivId));
      checked.value = s;
    };
    const DLIV_STATUS_OPTIONS = ['준비중','출고완료','배송중','배송완료','배송실패'];
    const COURIER_OPTIONS = ['CJ대한통운','롯데택배','한진택배','우체국택배','로젠택배'];
    const APPROVAL_ACTIONS = ['승인','반려','보류'];
    const REQ_TARGETS = ['주문','상품','배송','추가결재'];
    const DEFAULT_TMPL = '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';
    const bulkOpen = ref(false);
    const bulkTab = ref('status');
    const bulkForm = reactive({
      status:'', courier:'', trackingNo:'', apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'배송', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });
    const onApprToChange = () => {
      const m = (props.adminData.members || []).find(x => String(x.userId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.userNm || ''; bulkForm.apprToPhone = m.phone || ''; bulkForm.apprToEmail = m.email || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };
    const onReqTargetChange = () => {
      const ids = Array.from(checked.value);
      const first = props.adminData.deliveries.find(d => ids.includes(d.dlivId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문')      bulkForm.reqTargetNm = first.orderId || '';
      else if (bulkForm.reqTarget === '배송') bulkForm.reqTargetNm = first.dlivId || '';
      else if (bulkForm.reqTarget === '상품') {
        const o = (props.adminData.orders || []).find(x => x.orderId === first.orderId);
        bulkForm.reqTargetNm = o ? (o.prodNm || '') : '';
      } else bulkForm.reqTargetNm = first.dlivId || '';
    };
    const buildTmplMsg = computed(() => (bulkForm.tmplMsg || '')
      .replace('{target}', bulkForm.reqTarget || '-')
      .replace('{targetNm}', bulkForm.reqTargetNm || '-')
      .replace('{amount}', Number(bulkForm.reqAmount||0).toLocaleString())
      .replace('{reason}', bulkForm.reqReason || '-'));
    const openBulk = () => {
      if (!checked.value.size) { props.showToast('항목을 선택하세요.', 'error'); return; }
      bulkTab.value = 'status';
      Object.assign(bulkForm, {
        status:'', courier:'', trackingNo:'', apprAction:'', apprComment:'',
        apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
        reqTarget:'배송', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
      });
      onReqTargetChange();
      bulkOpen.value = true;
    };
    const bulkPreview = computed(() => {
      if (!bulkOpen.value) return '';
      const ids = Array.from(checked.value);
      const selected = props.adminData.deliveries.filter(d => ids.includes(d.dlivId));
      let rows = [];
      if (bulkTab.value === 'status') {
        if (!bulkForm.status) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 배송상태 변경: ${d.status || '-'} → ${bulkForm.status}`);
      } else if (bulkTab.value === 'courier') {
        if (!bulkForm.courier && !bulkForm.trackingNo) return '';
        rows = selected.map(d => {
          const parts = [];
          if (bulkForm.courier) parts.push(`택배사: ${d.courier || '-'} → ${bulkForm.courier}`);
          if (bulkForm.trackingNo) parts.push(`운송장: ${d.trackingNo || '-'} → ${bulkForm.trackingNo}`);
          return `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 택배정보 변경: ${parts.join(', ')}`;
        });
      } else if (bulkTab.value === 'approval') {
        if (!bulkForm.apprAction) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (bulkTab.value === 'approvalReq') {
        if (!bulkForm.apprToUserId) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) return '';
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });
    const saveBulk = async () => {
      const ids = Array.from(checked.value);
      if (!ids.length) { props.showToast('항목을 선택하세요.', 'error'); bulkOpen.value = false; return; }
      if (bulkTab.value === 'status') {
        if (!bulkForm.status) { props.showToast('변경할 배송상태를 선택하세요.', 'error'); return; }
        const ok = await props.showConfirm('일괄 배송상태 변경', `선택한 ${ids.length}건을 [${bulkForm.status}] 상태로 변경하시겠습니까?`);
        if (!ok) return;
        props.adminData.deliveries.forEach(d => { if (ids.includes(d.dlivId)) d.status = bulkForm.status; });
        checked.value = new Set(); bulkOpen.value = false;
        try {
          const res = await window.adminApi.put('deliveries/bulk-status', { ids, status: bulkForm.status });
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 변경되었습니다.`, 'success');
        } catch (err) {
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (bulkTab.value === 'courier') {
        if (!bulkForm.courier && !bulkForm.trackingNo) { props.showToast('택배사 또는 운송장번호를 입력하세요.', 'error'); return; }
        const ok = await props.showConfirm('일괄 택배정보 변경', `선택한 ${ids.length}건의 택배정보를 변경하시겠습니까?`);
        if (!ok) return;
        props.adminData.deliveries.forEach(d => {
          if (ids.includes(d.dlivId)) {
            if (bulkForm.courier) d.courier = bulkForm.courier;
            if (bulkForm.trackingNo) d.trackingNo = bulkForm.trackingNo;
          }
        });
        checked.value = new Set(); bulkOpen.value = false;
        try {
          const res = await window.adminApi.put('deliveries/bulk-courier', { ids, courier: bulkForm.courier, trackingNo: bulkForm.trackingNo });
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 변경되었습니다.`, 'success');
        } catch (err) {
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (bulkTab.value === 'approval') {
        if (!bulkForm.apprAction) { props.showToast('결재처리 구분을 선택하세요.', 'error'); return; }
        const ok = await props.showConfirm('일괄 결재처리', `선택한 ${ids.length}건을 [${bulkForm.apprAction}] 처리하시겠습니까?`);
        if (!ok) return;
        props.adminData.deliveries.forEach(d => { if (ids.includes(d.dlivId)) { d.apprStatus = bulkForm.apprAction; d.apprComment = bulkForm.apprComment; } });
        checked.value = new Set(); bulkOpen.value = false;
        try {
          const res = await window.adminApi.put('deliveries/bulk-approval', { ids, action: bulkForm.apprAction, comment: bulkForm.apprComment });
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 처리되었습니다.`, 'success');
        } catch (err) {
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      } else if (bulkTab.value === 'approvalReq') {
        if (!bulkForm.apprToUserId) { props.showToast('추가결재자(회원)를 선택하세요.', 'error'); return; }
        const ok = await props.showConfirm('일괄 추가결재요청', `선택한 ${ids.length}건을 [${bulkForm.apprToNm}](으)로 추가결재요청 하시겠습니까?`);
        if (!ok) return;
        props.adminData.deliveries.forEach(d => { if (ids.includes(d.dlivId)) {
          d.apprToUserId = bulkForm.apprToUserId; d.apprToNm = bulkForm.apprToNm;
          d.reqTarget = bulkForm.reqTarget; d.reqTargetNm = bulkForm.reqTargetNm;
          d.reqAmount = Number(bulkForm.reqAmount||0); d.reqReason = bulkForm.reqReason;
        } });
        checked.value = new Set(); bulkOpen.value = false;
        try {
          const res = await window.adminApi.put('deliveries/bulk-approvalReq', { ids, ...bulkForm, tmplMsgRendered: buildTmplMsg.value });
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast(`${ids.length}건 요청되었습니다.`, 'success');
        } catch (err) {
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
      }
    };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteNm, searchKw, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, exportExcel, checked, toggleCheck, isChecked, allChecked, toggleCheckAll, DLIV_STATUS_OPTIONS, COURIER_OPTIONS, APPROVAL_ACTIONS, REQ_TARGETS, bulkOpen, bulkTab, bulkForm, openBulk, saveBulk, bulkPreview, onApprToChange, onReqTargetChange, buildTmplMsg };
  },
  template: /* html */`
<div>
  <div class="page-title">배송관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="배송ID / 주문ID / 회원명 / 수령인 검색" />
      <select v-model="searchStatus">
        <option value="">상태 전체</option><option>준비중</option><option>출고완료</option><option>배송중</option><option>배송완료</option><option>배송실패</option>
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
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>배송목록 <span class="list-count">{{ total }}건</span>
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
        <th>배송ID</th><th>주문ID</th><th>회원</th><th>수령인</th><th>택배사</th><th>운송장번호</th><th>배송지</th><th>상태</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="d in pageList" :key="d.dlivId"
          :style="(selectedId===d.dlivId?'background:#fff8f9;':'') + (isChecked(d.dlivId)?'background:#eef6fd;':'')">
          <td style="text-align:center;"><input type="checkbox" :checked="isChecked(d.dlivId)" @change="toggleCheck(d.dlivId)" /></td>
          <td>
            <span class="title-link" @click="loadDetail(d.dlivId)" :style="selectedId===d.dlivId?'color:#e8587a;font-weight:700;':''">
              {{ d.dlivId }}<span v-if="selectedId===d.dlivId" style="font-size:10px;margin-left:3px;">▼</span>
            </span>
          </td>
          <td><span class="ref-link" @click="showRefModal('order', d.orderId)">{{ d.orderId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('member', d.userId)">{{ d.userNm }}</span></td>
          <td>{{ d.receiver }}</td>
          <td>{{ d.courier }}</td>
          <td>{{ d.trackingNo || '-' }}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ d.address }}</td>
          <td><span class="badge" :class="statusBadge(d.status)">{{ d.status }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(d.dlivId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(d)">삭제</button>
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

  <!-- 하단 상세: DlivDtl 컴포넌트 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <od-dliv-dtl
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
    <div style="background:#fff;border-radius:12px;width:480px;max-width:92vw;box-shadow:0 20px 50px rgba(0,0,0,0.3);overflow:hidden;">
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <b style="font-size:14px;">변경작업 <span style="color:#1565c0;">({{ checked.size }}건 선택)</span></b>
        <button class="btn btn-secondary btn-sm" @click="bulkOpen=false">✕</button>
      </div>
      <div style="display:flex;gap:6px;padding:10px 14px 0;background:#fafafa;">
        <button v-for="t in [{id:'status',label:'배송상태'},{id:'courier',label:'택배사·운송장'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t.id"
          @click="bulkTab=t.id"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: bulkTab===t.id?800:600,background: bulkTab===t.id?'#fff':'transparent',color: bulkTab===t.id?'#e8587a':'#888',borderBottom: bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">{{ t.label }}</button>
      </div>
      <div style="padding:20px 18px;">
        <div v-if="bulkTab==='status'">
          <label class="form-label">변경할 배송상태</label>
          <select class="form-control" v-model="bulkForm.status">
            <option value="">선택하세요</option>
            <option v-for="s in DLIV_STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div v-if="bulkTab==='courier'">
          <div class="form-group">
            <label class="form-label">택배사</label>
            <select class="form-control" v-model="bulkForm.courier">
              <option value="">선택하세요</option>
              <option v-for="c in COURIER_OPTIONS" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">운송장번호</label>
            <input class="form-control" v-model="bulkForm.trackingNo" placeholder="(선택한 항목 모두 동일 번호로 변경)" />
          </div>
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
