/* ShopJoy Admin - 배송템플릿관리 */
window.PdDlivTmpltMng = {
  name: 'PdDlivTmpltMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const searchKw     = ref('');
    const searchMethod = ref('');
    const searchUse    = ref('');
    const applied      = reactive({ kw: '', method: '', use: '' });
    const pager        = reactive({ page: 1, size: 20 });
    const selectedId   = ref(null);

    const DLIV_METHODS   = ['COURIER','DIRECT','PICKUP'];
    const DLIV_PAY_TYPES = ['PREPAY','COD'];
    const COURIERS       = ['CJ','LOGEN','LOTTE','HANJIN','POST','EPOST','KGB'];
    const METHOD_LABELS  = { COURIER:'택배', DIRECT:'직접배송', PICKUP:'방문수령' };
    const PAY_LABELS     = { PREPAY:'선결제', COD:'착불' };

    const filtered = computed(() => {
      const kw = applied.kw.toLowerCase();
      return (props.adminData.dlivTmplts || []).filter(t => {
        if (kw && !t.dlivTmpltNm.toLowerCase().includes(kw)) return false;
        if (applied.method && t.dlivMethodCd !== applied.method) return false;
        if (applied.use && t.useYn !== applied.use) return false;
        return true;
      });
    });
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const selectedRow = computed(() => (props.adminData.dlivTmplts||[]).find(t => t.dlivTmpltId === selectedId.value) || null);
    const form = reactive({});
    const isNew = ref(false);

    const openDetail = (row) => {
      if (selectedId.value === row.dlivTmpltId) { selectedId.value = null; return; }
      Object.assign(form, { ...row });
      selectedId.value = row.dlivTmpltId;
      isNew.value = false;
    };
    const openNew = () => {
      Object.assign(form, { dlivTmpltId: null, siteId: 1, vendorId: null, dlivTmpltNm: '', dlivMethodCd: 'COURIER', dlivPayTypeCd: 'PREPAY', dlivCourierCd: 'CJ', dlivCost: 3000, freeDlivMinAmt: 50000, islandExtraCost: 5000, returnCost: 3000, exchangeCost: 6000, returnCourierCd: 'CJ', returnAddrZip: '', returnAddr: '', returnAddrDetail: '', returnTelNo: '', baseDlivYn: 'N', useYn: 'Y' });
      selectedId.value = '__new__';
      isNew.value = true;
    };
    const closeDetail = () => { selectedId.value = null; };
    const doSave = async () => {
      if (!form.dlivTmpltNm) { props.showToast('템플릿명은 필수입니다.', 'error'); return; }
      const ok = await props.showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      const isNewTmplt = isNew.value;
      const src = props.adminData.dlivTmplts;
      if (isNewTmplt) { form.dlivTmpltId = 'DT' + String(Date.now()).slice(-6); src.push({ ...form }); selectedId.value = form.dlivTmpltId; isNew.value = false; }
      else { const si = src.findIndex(t => t.dlivTmpltId === form.dlivTmpltId); if (si !== -1) Object.assign(src[si], form); }
      try {
        const res = await (isNewTmplt ? window.adminApi.post(`pd/dliv-tmplts/${form.dlivTmpltId||''}`, { ...form }) : window.adminApi.put(`pd/dliv-tmplts/${form.dlivTmpltId||''}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const doDelete = async () => {
      if (!selectedRow.value) return;
      const ok = await props.showConfirm('삭제', `[${selectedRow.value.dlivTmpltNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const si = props.adminData.dlivTmplts.findIndex(t => t.dlivTmpltId === selectedRow.value.dlivTmpltId); if (si !== -1) props.adminData.dlivTmplts.splice(si, 1); closeDetail();
      try {
        const res = await window.adminApi.delete(`pd/dliv-tmplts/${selectedRow.value.dlivTmpltId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, method: searchMethod.value, use: searchUse.value }); pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchMethod.value = ''; searchUse.value = ''; Object.assign(applied, { kw: '', method: '', use: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const ynBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';
    const methodBadge = v => ({ COURIER:'badge-blue', DIRECT:'badge-orange', PICKUP:'badge-green' }[v] || 'badge-gray');

    const descOpen = ref(false);

    return { descOpen,
             searchKw, searchMethod, searchUse, pager, pageNums, totalPages, setPage, total, pageList, onSearch, onReset,
             selectedId, form, isNew, openDetail, openNew, closeDetail, doSave, doDelete,
             ynBadge, methodBadge, DLIV_METHODS, DLIV_PAY_TYPES, COURIERS, METHOD_LABELS, PAY_LABELS , PAGE_SIZES , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">배송템플릿관리</div>
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span><strong style="color:#1a7a52">배송템플릿</strong>은 상품에 공통 적용할 배송비 조건을 미리 정의해두는 설정입니다.</span>
    <button @click="descOpen=!descOpen" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" style="margin-top:6px">
      ✔ 무료·고정·조건부(금액/수량) 배송비 방식을 선택하고 <strong>상품 등록 시 템플릿을 연결</strong>해 재사용합니다.<br>
      ✔ 도서·산간 지역 추가 배송비, <strong>반품지 주소</strong>를 함께 관리합니다.<br>
      ✔ 업체(벤더)별로 독립 설정이 가능하며, 여러 상품이 동일 템플릿을 공유할 수 있습니다.<br>
      <span style="color:#888;font-size:12px">예) 3만원 이상 무료배송, 제주·도서 추가 3,000원</span>
    </div>
  </div>
  <div class="card">
      <div class="search-bar">
        <label class="search-label">템플릿명</label>
        <input class="form-control" v-model="searchKw" @keyup.enter="onSearch" placeholder="템플릿명 검색">
        <label class="search-label">배송방법</label>
        <select class="form-control" v-model="searchMethod">
          <option value="">전체</option><option v-for="m in DLIV_METHODS" :key="m" :value="m">{{ m }}</option>
        </select>
        <label class="search-label">사용여부</label>
        <select class="form-control" v-model="searchUse"><option value="">전체</option><option value="Y">Y</option><option value="N">N</option></select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">배송템플릿 목록</span>
        <span class="list-count">총 {{ total }}건</span>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" @click="openNew">+ 신규</button>
      </div>
      <table class="admin-table">
        <thead><tr>
          <th>템플릿명</th>
          <th style="width:90px">배송방법</th>
          <th style="width:80px">결제유형</th>
          <th style="width:100px;text-align:right">기본배송비</th>
          <th style="width:120px;text-align:right">무료배송조건</th>
          <th style="width:100px;text-align:right">반품배송비</th>
          <th style="width:70px;text-align:center">기본</th>
          <th style="width:60px;text-align:center">사용</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in pageList" :key="row.dlivTmpltId" :class="{active:selectedId===row.dlivTmpltId}" @click="openDetail(row)" style="cursor:pointer">
            <td><span class="title-link">{{ row.dlivTmpltNm }}</span></td>
            <td><span :class="['badge',methodBadge(row.dlivMethodCd)]">{{ row.dlivMethodCd }}</span></td>
            <td><span class="badge badge-gray">{{ row.dlivPayTypeCd }}</span></td>
            <td style="text-align:right">{{ (row.dlivCost||0).toLocaleString() }}원</td>
            <td style="text-align:right">{{ row.freeDlivMinAmt ? (row.freeDlivMinAmt).toLocaleString()+'원 이상' : '무조건 유료' }}</td>
            <td style="text-align:right">{{ (row.returnCost||0).toLocaleString() }}원</td>
            <td style="text-align:center"><span :class="['badge',row.baseDlivYn==='Y'?'badge-orange':'badge-gray']">{{ row.baseDlivYn }}</span></td>
            <td style="text-align:center"><span :class="['badge',ynBadge(row.useYn)]">{{ row.useYn }}</span></td>
          </tr>
          <tr v-if="!pageList.length"><td colspan="8" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
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
    <!-- 상세 폼 -->
    <div class="card" v-if="selectedId">
      <div class="toolbar">
        <span class="list-title">{{ isNew ? '신규 등록' : '상세 / 수정' }}</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-blue btn-sm" @click="doSave">저장</button>
          <button v-if="!isNew" class="btn btn-danger btn-sm" @click="doDelete">삭제</button>
          <button class="btn btn-secondary btn-sm" @click="closeDetail">닫기</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px">
        <div class="form-group"><label class="form-label">템플릿명 <span style="color:red">*</span></label><input class="form-control" v-model="form.dlivTmpltNm"></div>
        <div class="form-group"><label class="form-label">배송방법</label>
          <select class="form-control" v-model="form.dlivMethodCd"><option v-for="m in DLIV_METHODS" :key="m" :value="m">{{ m }}</option></select>
        </div>
        <div class="form-group"><label class="form-label">배송비 결제유형</label>
          <select class="form-control" v-model="form.dlivPayTypeCd"><option v-for="p in DLIV_PAY_TYPES" :key="p" :value="p">{{ p }}</option></select>
        </div>
        <div class="form-group"><label class="form-label">배송 택배사</label>
          <select class="form-control" v-model="form.dlivCourierCd"><option value="">없음</option><option v-for="c in COURIERS" :key="c" :value="c">{{ c }}</option></select>
        </div>
        <div class="form-group"><label class="form-label">기본 배송비 (원)</label><input class="form-control" type="number" v-model.number="form.dlivCost"></div>
        <div class="form-group"><label class="form-label">무료배송 최소금액 (원)</label><input class="form-control" type="number" v-model.number="form.freeDlivMinAmt"></div>
        <div class="form-group"><label class="form-label">도서산간 추가배송비 (원)</label><input class="form-control" type="number" v-model.number="form.islandExtraCost"></div>
        <div class="form-group"><label class="form-label">반품배송비 편도 (원)</label><input class="form-control" type="number" v-model.number="form.returnCost"></div>
        <div class="form-group"><label class="form-label">교환배송비 왕복 (원)</label><input class="form-control" type="number" v-model.number="form.exchangeCost"></div>
        <div class="form-group"><label class="form-label">반품 택배사</label>
          <select class="form-control" v-model="form.returnCourierCd"><option value="">없음</option><option v-for="c in COURIERS" :key="c" :value="c">{{ c }}</option></select>
        </div>
        <div class="form-group"><label class="form-label">반품지 우편번호</label><input class="form-control" v-model="form.returnAddrZip"></div>
        <div class="form-group"><label class="form-label">반품지 전화번호</label><input class="form-control" v-model="form.returnTelNo"></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">반품지 주소</label><input class="form-control" v-model="form.returnAddr"></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">반품지 상세주소</label><input class="form-control" v-model="form.returnAddrDetail"></div>
        <div class="form-group"><label class="form-label">기본 배송지</label>
          <select class="form-control" v-model="form.baseDlivYn"><option value="Y">Y</option><option value="N">N</option></select>
        </div>
        <div class="form-group"><label class="form-label">사용여부</label>
          <select class="form-control" v-model="form.useYn"><option value="Y">Y</option><option value="N">N</option></select>
        </div>
      </div>
    </div>
</div>`
};
