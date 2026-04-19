/* ShopJoy Admin - 주문관리 목록 + 하단 OrderDtl 임베드 */
window.OdOrderMng = {
  name: 'OdOrderMng',
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
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odOrderMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = Vue.reactive({ kw: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.orders.filter(o => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !o.orderId.toLowerCase().includes(kw) && !o.userNm.toLowerCase().includes(kw) && !o.prodNm.toLowerCase().includes(kw)) return false;
      if (applied.status && o.status !== applied.status) return false;
      const _d = String(o.orderDate || '').slice(0, 10);
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
      '입금대기': 'badge-orange', '결제완료': 'badge-blue', '상품준비중': 'badge-orange',
      '배송중': 'badge-blue', '배송완료': 'badge-green', '구매확정': 'badge-gray',
      '취소': 'badge-red', '자동취소': 'badge-red',
    }[s] || 'badge-gray');
    const payStatusBadge = s => ({
      '미결제':'badge-gray','부분결제':'badge-orange','결제완료':'badge-green',
      '결제실패':'badge-red','환불중':'badge-orange','부분환불':'badge-orange','환불완료':'badge-purple',
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
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (o) => {
      const ok = await props.showConfirm('삭제', `[${o.orderId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.orders.findIndex(x => x.orderId === o.orderId);
      if (idx !== -1) props.adminData.orders.splice(idx, 1);
      if (selectedId.value === o.orderId) selectedId.value = null;
      try {
        const res = await window.adminApi.delete(`orders/${o.orderId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'주문ID',key:'orderId'},{label:'회원명',key:'userNm'},{label:'상태',key:'statusCd'},{label:'결제금액',key:'totalAmount'},{label:'결제방법',key:'payMethodCd'},{label:'주문일',key:'orderDate'}], '주문목록.csv');

    /* 클레임 조회 */
    const claimByOrder = (orderId) =>
      (props.adminData.claims || []).find(c => c.orderId === orderId);
    const claimTypeColor = (t) => ({ '취소':'#ef4444', '반품':'#FFBB00', '교환':'#3b82f6' }[t] || '#9ca3af');
    const getItemCount = (o) => {
      const m = (o.prodNm || '').match(/외\s*(\d+)/);
      return m ? parseInt(m[1]) + 1 : 1;
    };

    /* 일괄선택 */
    const checked = ref(new Set());
    const toggleCheck = (id) => {
      const s = new Set(checked.value);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked.value = s;
    };
    const isChecked = (id) => checked.value.has(id);
    const allChecked = computed(() => pageList.value.length > 0 && pageList.value.every(o => checked.value.has(o.orderId)));
    const toggleCheckAll = () => {
      const s = new Set(checked.value);
      if (allChecked.value) pageList.value.forEach(o => s.delete(o.orderId));
      else pageList.value.forEach(o => s.add(o.orderId));
      checked.value = s;
    };
    const ORDER_STATUS_OPTIONS = ['입금대기','결제완료','상품준비중','배송중','배송완료','구매확정','취소','자동취소'];
    const PAY_METHOD_OPTIONS = ['무통장입금','가상계좌','토스페이먼츠','카카오페이','네이버페이','핸드폰결제','적립금결제','0원결제'];
    const APPROVAL_ACTIONS = ['승인','반려','보류'];
    const REQ_TARGETS = ['주문','상품','배송','추가결재'];
    const DEFAULT_TMPL = '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';
    /* 변경작업 모달 */
    const bulkOpen = ref(false);
    const bulkTab = ref('status');
    const bulkForm = reactive({
      status:'', payMethod:'', apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'주문', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });
    const onApprToChange = () => {
      const m = (props.adminData.members || []).find(x => String(x.userId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.userNm || ''; bulkForm.apprToPhone = m.phone || ''; bulkForm.apprToEmail = m.email || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };
    const onReqTargetChange = () => {
      const ids = Array.from(checked.value);
      const first = props.adminData.orders.find(o => ids.includes(o.orderId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문')      bulkForm.reqTargetNm = first.orderId || '';
      else if (bulkForm.reqTarget === '상품') bulkForm.reqTargetNm = first.prodNm || '';
      else if (bulkForm.reqTarget === '배송') {
        const d = (props.adminData.deliveries || []).find(x => x.orderId === first.orderId);
        bulkForm.reqTargetNm = d ? d.dlivId : ('배송('+first.orderId+')');
      } else bulkForm.reqTargetNm = first.orderId || '';
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
        status:'', payMethod:'', apprAction:'', apprComment:'',
        apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
        reqTarget:'주문', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
      });
      onReqTargetChange();
      bulkOpen.value = true;
    };
    const bulkPreview = computed(() => {
      if (!bulkOpen.value) return '';
      const ids = Array.from(checked.value);
      const selected = props.adminData.orders.filter(o => ids.includes(o.orderId));
      let rows = [];
      if (bulkTab.value === 'status') {
        if (!bulkForm.status) return '';
        rows = selected.map(o => `- [${o.orderId} / ${o.userNm}] [주문관리] 주문상태 변경: ${o.status || '-'} → ${bulkForm.status}`);
      } else if (bulkTab.value === 'payMethod') {
        if (!bulkForm.payMethod) return '';
        rows = selected.map(o => `- [${o.orderId} / ${o.userNm}] [주문관리] 결제수단 변경: ${o.payMethod || '-'} → ${bulkForm.payMethod}`);
      } else if (bulkTab.value === 'approval') {
        if (!bulkForm.apprAction) return '';
        rows = selected.map(o => `- [${o.orderId} / ${o.userNm}] [주문관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (bulkTab.value === 'approvalReq') {
        if (!bulkForm.apprToUserId) return '';
        rows = selected.map(o => `- [${o.orderId} / ${o.userNm}] [주문관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) return '';
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });
    const saveBulk = async () => {
      const ids = Array.from(checked.value);
      if (!ids.length) { props.showToast('항목을 선택하세요.', 'error'); bulkOpen.value = false; return; }
      const cfg = {
        status:     { field:'status',       label:'주문상태',     path:'orders/bulk-status' },
        payMethod:  { field:'payMethod',    label:'결제수단',     path:'orders/bulk-payMethod' },
        approval:   { field:'apprAction',   label:'결재처리',     path:'orders/bulk-approval' },
        approvalReq:{ field:'apprToUserId', label:'추가결재요청', path:'orders/bulk-approvalReq' },
      }[bulkTab.value];
      const val = bulkForm[cfg.field];
      if (!val) { props.showToast(`${cfg.label} 입력값을 확인하세요.`, 'error'); return; }
      const ok = await props.showConfirm(`일괄 ${cfg.label}`, `선택한 ${ids.length}건에 대해 ${cfg.label} 작업을 진행하시겠습니까?`);
      if (!ok) return;
      if (bulkTab.value === 'status')    props.adminData.orders.forEach(o => { if (ids.includes(o.orderId)) o.status = bulkForm.status; });
      if (bulkTab.value === 'payMethod') props.adminData.orders.forEach(o => { if (ids.includes(o.orderId)) o.payMethod = bulkForm.payMethod; });
      if (bulkTab.value === 'approval')  props.adminData.orders.forEach(o => { if (ids.includes(o.orderId)) { o.apprStatus = bulkForm.apprAction; o.apprComment = bulkForm.apprComment; } });
      if (bulkTab.value === 'approvalReq') props.adminData.orders.forEach(o => { if (ids.includes(o.orderId)) {
        o.apprToUserId = bulkForm.apprToUserId; o.apprToNm = bulkForm.apprToNm;
        o.reqTarget = bulkForm.reqTarget; o.reqTargetNm = bulkForm.reqTargetNm;
        o.reqAmount = Number(bulkForm.reqAmount||0); o.reqReason = bulkForm.reqReason;
      } });
      checked.value = new Set();
      bulkOpen.value = false;
      try {
        const res = await window.adminApi.put(cfg.path, { ids, ...bulkForm, tmplMsgRendered: buildTmplMsg.value });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(`${ids.length}건 처리되었습니다.`, 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteNm, searchKw, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, statusBadge, payStatusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, exportExcel, claimByOrder, claimTypeColor, getItemCount, checked, toggleCheck, isChecked, allChecked, toggleCheckAll, ORDER_STATUS_OPTIONS, PAY_METHOD_OPTIONS, APPROVAL_ACTIONS, REQ_TARGETS, bulkOpen, bulkTab, bulkForm, openBulk, saveBulk, bulkPreview, onApprToChange, onReqTargetChange, buildTmplMsg };
  },
  template: /* html */`
<div>
  <div class="page-title">주문관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="주문ID / 회원명 / 상품명 검색" />
      <select v-model="searchStatus">
        <option value="">상태 전체</option>
        <option>입금대기</option><option>결제완료</option><option>상품준비중</option>
        <option>배송중</option><option>배송완료</option><option>구매확정</option><option>취소</option><option>자동취소</option>
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
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>주문목록 <span class="list-count">{{ total }}건</span>
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
        <th>주문ID</th><th>회원</th><th>주문일시</th><th>상품</th><th>결제금액</th><th>결제수단</th><th>결제상태</th><th>주문상태</th><th>클레임상태</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="12" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="o in pageList" :key="o.orderId"
          :style="(selectedId===o.orderId?'background:#fff8f9;':'') + (isChecked(o.orderId)?'background:#eef6fd;':'')">
          <td style="text-align:center;"><input type="checkbox" :checked="isChecked(o.orderId)" @change="toggleCheck(o.orderId)" /></td>
          <td><span class="title-link" @click="loadDetail(o.orderId)" :style="selectedId===o.orderId?'color:#e8587a;font-weight:700;':''">{{ o.orderId }}<span v-if="selectedId===o.orderId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="ref-link" @click="showRefModal('member', o.userId)">{{ o.userNm }}</span></td>
          <td>{{ o.orderDate }}</td>
          <td>
            {{ o.prodNm }}
            <span style="display:inline-block;font-size:10px;padding:1px 6px;border-radius:8px;background:#e5e7eb;color:#555;font-weight:700;margin-left:4px;vertical-align:middle;">{{ getItemCount(o) }}개</span>
          </td>
          <td>{{ o.totalPrice.toLocaleString() }}원</td>
          <td>
            <span :style="{
              fontSize:'11px',padding:'2px 8px',borderRadius:'10px',fontWeight:600,
              background: o.payMethod==='계좌이체'?'#e3f2fd':o.payMethod==='카드결제'?'#f3e5f5':o.payMethod==='캐쉬'?'#fff3e0':'#e8f5e9',
              color: o.payMethod==='계좌이체'?'#1565c0':o.payMethod==='카드결제'?'#6a1b9a':o.payMethod==='캐쉬'?'#e65100':'#2e7d32',
            }">{{ o.payMethod || '-' }}</span>
          </td>
          <td>
            <span class="badge" :class="payStatusBadge(o.payStatus || (o.status==='취소'||o.status==='자동취소'?'환불완료':o.status==='입금대기'?'미결제':'결제완료'))">
              {{ o.payStatus || (o.status==='취소'||o.status==='자동취소'?'환불완료':o.status==='입금대기'?'미결제':'결제완료') }}
            </span>
          </td>
          <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
          <td>
            <span v-if="claimByOrder(o.orderId)" style="display:inline-flex;align-items:center;gap:3px;">
              <span :style="{
                fontSize:'10px',padding:'1px 6px',borderRadius:'8px',color:'#fff',fontWeight:700,
                background: claimTypeColor(claimByOrder(o.orderId).type)
              }">{{ claimByOrder(o.orderId).type }}</span>
              <span style="font-size:10px;padding:1px 6px;border-radius:8px;background:#f3f4f6;color:#374151;font-weight:600;border:1px solid #e5e7eb;">
                {{ claimByOrder(o.orderId).status }}
              </span>
            </span>
            <span v-else style="font-size:11px;color:#ccc;">-</span>
          </td>
          <td style="font-size:12px;color:#2563eb;">{{ siteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(o.orderId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(o)">삭제</button>
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

  <!-- 하단 상세: OrderDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <od-order-dtl
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
        <button v-for="t in [{id:'status',label:'주문상태'},{id:'payMethod',label:'결제수단'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t.id"
          @click="bulkTab=t.id"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: bulkTab===t.id?800:600,background: bulkTab===t.id?'#fff':'transparent',color: bulkTab===t.id?'#e8587a':'#888',borderBottom: bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">{{ t.label }}</button>
      </div>
      <div style="padding:20px 18px;">
        <div v-if="bulkTab==='status'">
          <label class="form-label">변경할 주문상태</label>
          <select class="form-control" v-model="bulkForm.status">
            <option value="">선택하세요</option>
            <option v-for="s in ORDER_STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div v-if="bulkTab==='payMethod'">
          <label class="form-label">변경할 결제수단</label>
          <select class="form-control" v-model="bulkForm.payMethod">
            <option value="">선택하세요</option>
            <option v-for="p in PAY_METHOD_OPTIONS" :key="p" :value="p">{{ p }}</option>
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
