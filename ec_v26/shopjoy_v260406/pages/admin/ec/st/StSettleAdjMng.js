/* ShopJoy Admin - 정산조정 */
window.StSettleAdjMng = {
  name: 'StSettleAdjMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const descOpen = ref(false);

    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const dateRange = ref('이번달');
    const dateStart = ref('');
    const dateEnd   = ref('');
    const onDateRangeChange = () => {
      if (dateRange.value) { const r = window.adminUtil.getDateRange(dateRange.value); dateStart.value = r ? r.from : ''; dateEnd.value = r ? r.to : ''; }
    };
    (() => { const r = window.adminUtil.getDateRange('이번달'); if (r) { dateStart.value = r.from; dateEnd.value = r.to; } })();

    const vendors = computed(() => (props.adminData.vendors || []).filter(v => v.vendorType === '판매업체'));

    const adjList = reactive([
      { adjId: 'ADJ-2026-001', adjDate: '2026-04-10', vendorId: 1, vendorNm: '패션스타일 주식회사', adjType: '수수료조정', adjAmt: -5000,  reason: '4월 프로모션 참여 수수료 감면', aprvStatus: '승인', regUserNm: '이관리자' },
      { adjId: 'ADJ-2026-002', adjDate: '2026-04-08', vendorId: 2, vendorNm: '트렌드웨어 LLC',     adjType: '매출조정',  adjAmt: 12000,  reason: '3월 정산 누락분 추가', aprvStatus: '대기', regUserNm: '이관리자' },
      { adjId: 'ADJ-2026-003', adjDate: '2026-04-05', vendorId: 3, vendorNm: '에코패션 Co.',       adjType: '반품조정',  adjAmt: -22000, reason: '반품 정산 재처리', aprvStatus: '승인', regUserNm: '김담당자' },
      { adjId: 'ADJ-2026-004', adjDate: '2026-03-28', vendorId: 4, vendorNm: '럭셔리브랜드 Inc.',  adjType: '수수료조정', adjAmt: -8000, reason: '계약 조건 변경 소급 적용', aprvStatus: '반려', regUserNm: '이관리자' },
      { adjId: 'ADJ-2026-005', adjDate: '2026-03-15', vendorId: 1, vendorNm: '패션스타일 주식회사', adjType: '매출조정', adjAmt: 30000, reason: '오주문 처리 수기 조정', aprvStatus: '승인', regUserNm: '김담당자' },
    ]);

    const searchKw     = ref('');
    const searchType   = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });

    const filtered = computed(() => {
      const kw = searchKw.value.trim().toLowerCase();
      return adjList.filter(r => {
        if (dateStart.value && r.adjDate < dateStart.value) return false;
        if (dateEnd.value   && r.adjDate > dateEnd.value)   return false;
        if (searchType.value   && r.adjType     !== searchType.value)   return false;
        if (searchStatus.value && r.aprvStatus  !== searchStatus.value) return false;
        if (kw && !r.adjId.toLowerCase().includes(kw) && !r.vendorNm.toLowerCase().includes(kw) && !r.reason.toLowerCase().includes(kw)) return false;
        return true;
      });
    });
    const total    = computed(() => filtered.value.length);
    const totPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => { const c=pager.page,l=totPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const selectedId = ref(null);
    const form = reactive({});
    const errors = reactive({});
    const isNew  = ref(false);

    const schema = window.yup.object({
      vendorId: window.yup.number().required('업체를 선택하세요.').min(1, '업체를 선택하세요.'),
      adjType:  window.yup.string().required('조정유형을 선택하세요.'),
      adjAmt:   window.yup.number().required('조정금액을 입력하세요.'),
      reason:   window.yup.string().required('사유를 입력하세요.'),
    });

    const openNew = () => {
      Object.assign(form, { adjId: null, adjDate: new Date().toISOString().slice(0,10), vendorId: '', vendorNm: '', adjType: '매출조정', adjAmt: 0, reason: '', aprvStatus: '대기', regUserNm: '관리자' });
      selectedId.value = '__new__'; isNew.value = true;
      Object.keys(errors).forEach(k => delete errors[k]);
    };
    const openEdit = (r) => { Object.assign(form, {...r}); selectedId.value = r.adjId; isNew.value = false; Object.keys(errors).forEach(k => delete errors[k]); };
    const closeForm = () => { selectedId.value = null; };

    const doSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try { await schema.validate(form, { abortEarly: false }); }
      catch (err) { err.inner.forEach(e => { errors[e.path] = e.message; }); props.showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const v = vendors.value.find(x => x.vendorId === Number(form.vendorId));
      if (v) form.vendorNm = v.vendorNm;
      const ok = await props.showConfirm('저장', '정산조정을 저장하시겠습니까?');
      if (!ok) return;
      if (isNew.value) { form.adjId = 'ADJ-' + Date.now(); adjList.unshift({ ...form }); }
      else { const idx = adjList.findIndex(x => x.adjId === form.adjId); if (idx !== -1) Object.assign(adjList[idx], { ...form }); }
      closeForm();
      try {
        const res = await (isNew.value ? window.adminApi.post('st/adj', { ...form }) : window.adminApi.put(`st/adj/${form.adjId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const doDelete = async (r) => {
      const ok = await props.showConfirm('삭제', `[${r.adjId}] 정산조정을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = adjList.findIndex(x => x.adjId === r.adjId); if (idx !== -1) adjList.splice(idx, 1); if (selectedId.value === r.adjId) closeForm();
      try {
        const res = await window.adminApi.delete(`st/adj/${r.adjId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const doApprove = async (r) => {
      const ok = await props.showConfirm('승인', '정산조정을 승인하시겠습니까?');
      if (!ok) return;
      r.aprvStatus = '승인';
      try {
        const res = await window.adminApi.put(`st/adj/${r.adjId}/approve`, { aprvStatus: '승인' });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('승인되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const aprvBadge = s => ({ '승인':'badge-green', '대기':'badge-blue', '반려':'badge-red' }[s] || 'badge-gray');
    const typeBadge = t => ({ '매출조정':'badge-blue', '수수료조정':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');
    const fmtW = n => (n >= 0 ? '' : '-') + Math.abs(Number(n)).toLocaleString() + '원';

    const onSearch = () => { pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchType.value = ''; searchStatus.value = ''; dateRange.value = '이번달'; onDateRangeChange(); pager.page = 1; };

    const setPage = n => { if (n >= 1 && n <= totPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    return { descOpen, DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange, vendors, searchKw, searchType, searchStatus, pager, filtered, total, totPages, pageList, pageNums, selectedId, form, errors, isNew, openNew, openEdit, closeForm, doSave, doDelete, doApprove, aprvBadge, typeBadge, fmtW, onSearch, onReset , PAGE_SIZES , setPage , onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">정산조정</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">수집원장 데이터에 업체별 추가·차감 조정 항목을 입력하여 최종 정산액을 보정합니다.</span>
    <button class="page-desc-toggle" @click="descOpen=!descOpen">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" class="page-desc-detail">• 조정 유형: 추가(+) / 차감(-) / 위약금 / 프로모션 분담금 등
• 조정 항목은 담당자 승인 후 정산마감에 반영됩니다.
• 승인 상태: 대기 / 승인 / 반려
• 마감 완료된 기간의 조정은 재오픈 후 처리해야 합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="dateStart" style="width:140px" />
      <span style="line-height:32px">~</span>
      <input type="date" v-model="dateEnd" style="width:140px" />
      <select v-model="searchType" style="width:120px">
        <option value="">유형 전체</option><option>매출조정</option><option>수수료조정</option><option>반품조정</option>
      </select>
      <select v-model="searchStatus" style="width:100px">
        <option value="">상태 전체</option><option>대기</option><option>승인</option><option>반려</option>
      </select>
      <input v-model="searchKw" placeholder="조정ID / 업체명 / 사유" style="width:200px" @keyup.enter="onSearch" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div class="toolbar">
      <span class="list-count">총 {{ total }}건</span>
      <div style="margin-left:auto"><button class="btn btn-primary" @click="openNew">+ 조정 추가</button></div>
    </div>
    <table class="admin-table">
      <thead><tr><th>조정ID</th><th>조정일자</th><th>업체명</th><th>유형</th><th>조정금액</th><th>사유</th><th>승인상태</th><th>등록자</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="r in pageList" :key="r.adjId" :class="{selected: selectedId===r.adjId}">
          <td>{{ r.adjId }}</td>
          <td>{{ r.adjDate }}</td>
          <td>{{ r.vendorNm }}</td>
          <td><span class="badge" :class="typeBadge(r.adjType)">{{ r.adjType }}</span></td>
          <td :style="r.adjAmt<0?'color:#e74c3c;font-weight:700':'color:#27ae60;font-weight:700'">{{ fmtW(r.adjAmt) }}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.reason }}</td>
          <td><span class="badge" :class="aprvBadge(r.aprvStatus)">{{ r.aprvStatus }}</span></td>
          <td>{{ r.regUserNm }}</td>
          <td class="actions">
            <button v-if="r.aprvStatus==='대기'" class="btn btn-sm btn-green" @click="doApprove(r)">승인</button>
            <button class="btn btn-sm btn-primary" @click="openEdit(r)">수정</button>
            <button class="btn btn-sm btn-danger"  @click="doDelete(r)">삭제</button>
          </td>
        </tr>
        <tr v-if="!pageList.length"><td colspan="9" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.page===1" @click="setPage(1)">«</button>
           <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
           <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.page===totPages" @click="setPage(pager.page+1)">›</button>
           <button :disabled="pager.page===totPages" @click="setPage(totPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>

  <!-- 편집 폼 -->
  <div v-if="selectedId" class="card" style="margin-top:12px">
    <div style="font-weight:700;margin-bottom:16px">{{ isNew ? '조정 추가' : '조정 수정' }}</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">업체 <span style="color:red">*</span></label>
        <select class="form-control" :class="{'is-invalid':errors.vendorId}" v-model.number="form.vendorId">
          <option value="">선택</option>
          <option v-for="v in vendors" :key="v.vendorId" :value="v.vendorId">{{ v.vendorNm }}</option>
        </select>
        <div v-if="errors.vendorId" class="field-error">{{ errors.vendorId }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">조정유형 <span style="color:red">*</span></label>
        <select class="form-control" :class="{'is-invalid':errors.adjType}" v-model="form.adjType">
          <option>매출조정</option><option>수수료조정</option><option>반품조정</option>
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
      <button class="btn btn-primary" @click="doSave">저장</button>
      <button class="btn btn-secondary" @click="closeForm">취소</button>
    </div>
  </div>
</div>
`,
};
