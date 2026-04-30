/* ShopJoy Admin - 배송템플릿관리 */
window.PdDlivTmpltMng = {
  name: 'PdDlivTmpltMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const dlivTmplts = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null, descOpen: false});
    const codes = reactive({
      dliv_template_types: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.dliv_template_types = codeStore.snGetGrpCodes('DLIV_TEMPLATE_TYPE') || [];
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

    const searchParam = reactive({
      kw: '',
      method: '',
      use: ''
    });
    const searchParamOrg = reactive({
      kw: '',
      method: '',
      use: ''
    });

    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApi.get('/bo/ec/pd/dliv-tmplt/page', {
          params: { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) },
          ...coUtil.apiHdr('배송템플릿관리', '목록조회')
        });
        const data = res.data?.data;
        dlivTmplts.splice(0, dlivTmplts.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (_) {
      console.error('[catch-info]', _);}
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    Object.assign(searchParamOrg, searchParam); });
const applied      = reactive({ kw: '', method: '', use: '' });
    const pager        = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const selectedId   = ref(null);

    const DLIV_METHODS   = ['COURIER','DIRECT','PICKUP'];
    const DLIV_PAY_TYPES = ['PREPAY','COD'];
    const COURIERS       = ['CJ','LOGEN','LOTTE','HANJIN','POST','EPOST','KGB'];
    const METHOD_LABELS  = { COURIER:'택배', DIRECT:'직접배송', PICKUP:'방문수령' };
    const PAY_LABELS     = { PREPAY:'선결제', COD:'착불' };

    const cfPageNums   = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const cfSelectedRow = computed(() => dlivTmplts.find(t => t.dlivTmpltId === uiState.selectedId) || null);
    const form = reactive({});

    const openDetail = (row) => {
      if (uiState.selectedId === row.dlivTmpltId) { uiState.selectedId = null; return; }
      Object.assign(form, { ...row });
      uiState.selectedId = row.dlivTmpltId;
      uiState.isNew = false;
    };
    const openNew = () => {
      Object.assign(form, { dlivTmpltId: null, siteId: 1, vendorId: null, dlivTmpltNm: '', dlivMethodCd: 'COURIER', dlivPayTypeCd: 'PREPAY', dlivCourierCd: 'CJ', dlivCost: 3000, freeDlivMinAmt: 50000, islandExtraCost: 5000, returnCost: 3000, exchangeCost: 6000, returnCourierCd: 'CJ', returnAddrZip: '', returnAddr: '', returnAddrDetail: '', returnTelNo: '', baseDlivYn: 'N', useYn: 'Y' });
      uiState.selectedId = '__new__';
      uiState.isNew = true;
    };
    const closeDetail = () => { uiState.selectedId = null; };
    const handleSave = async () => {
      if (!form.dlivTmpltNm) { props.showToast('템플릿명은 필수입니다.', 'error'); return; }
      const ok = await props.showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      const isNewTmplt = uiState.isNew;
      const src = dlivTmplts;
      if (isNewTmplt) { form.dlivTmpltId = 'DT' + String(Date.now()).slice(-6); src.push({ ...form }); uiState.selectedId = form.dlivTmpltId; uiState.isNew = false; }
      else { const si = src.findIndex(t => t.dlivTmpltId === form.dlivTmpltId); if (si !== -1) Object.assign(src[si], form); }
      try {
        const res = await (isNewTmplt ? boApi.post(`/bo/ec/pd/dliv-tmplt/${form.dlivTmpltId||''}`, { ...form }, coUtil.apiHdr('배송템플릿관리', '등록')) : boApi.put(`/bo/ec/pd/dliv-tmplt/${form.dlivTmpltId||''}`, { ...form }, coUtil.apiHdr('배송템플릿관리', '저장')));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const handleDelete = async () => {
      if (!cfSelectedRow.value) return;
      const ok = await props.showConfirm('삭제', `[${cfSelectedRow.value.dlivTmpltNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const si = dlivTmplts.findIndex(t => t.dlivTmpltId === cfSelectedRow.value.dlivTmpltId); if (si !== -1) dlivTmplts.splice(si, 1); closeDetail();
      try {
        const res = await boApi.delete(`/bo/ec/pd/dliv-tmplt/${cfSelectedRow.value.dlivTmpltId}`, coUtil.apiHdr('배송템플릿관리', '삭제'));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    const onReset = async () => {
      Object.assign(searchParam, searchParamOrg);
      pager.pageNo = 1;
      await handleSearchList();
    };

    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';
    const fnMethodBadge = v => ({ COURIER:'badge-blue', DIRECT:'badge-orange', PICKUP:'badge-green' }[v] || 'badge-gray');

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, searchParam, searchParamOrg,
             pager, cfPageNums, setPage, onSearch, onReset,
             form, openDetail, openNew, closeDetail, handleSave, handleDelete,
             fnYnBadge, fnMethodBadge, DLIV_METHODS, DLIV_PAY_TYPES, COURIERS, METHOD_LABELS, PAY_LABELS  , onSizeChange, dlivTmplts };
  },
  template: `
<div>
  <div class="page-title">배송템플릿관리</div>
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span><strong style="color:#1a7a52">배송템플릿</strong>은 상품에 공통 적용할 배송비 조건을 미리 정의해두는 설정입니다.</span>
    <button @click="uiState.descOpen=!uiState.descOpen" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" style="margin-top:6px">
      ✔ 무료·고정·조건부(금액/수량) 배송비 방식을 선택하고 <strong>상품 등록 시 템플릿을 연결</strong>해 재사용합니다.<br>
      ✔ 도서·산간 지역 추가 배송비, <strong>반품지 주소</strong>를 함께 관리합니다.<br>
      ✔ 업체(벤더)별로 독립 설정이 가능하며, 여러 상품이 동일 템플릿을 공유할 수 있습니다.<br>
      <span style="color:#888;font-size:12px">예) 3만원 이상 무료배송, 제주·도서 추가 3,000원</span>
    </div>
  </div>
  <div class="card">
      <div class="search-bar">
        <label class="search-label">템플릿명</label>
        <input class="form-control" v-model="searchParam.kw" @keyup.enter="() => onSearch?.()" placeholder="템플릿명 검색">
        <label class="search-label">배송방법</label>
        <select class="form-control" v-model="searchParam.method">
          <option value="">전체</option><option v-for="m in DLIV_METHODS" :key="Math.random()" :value="m">{{ m }}</option>
        </select>
        <label class="search-label">사용여부</label>
        <select class="form-control" v-model="searchParam.use"><option value="">전체</option><option value="Y">Y</option><option value="N">N</option></select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">배송템플릿 목록</span>
        <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" @click="openNew">+ 신규</button>
      </div>
      <table class="bo-table">
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
          <tr v-for="row in dlivTmplts" :key="row?.dlivTmpltId" :class="{active:uiState.selectedId===row.dlivTmpltId}" @click="openDetail(row)" style="cursor:pointer">
            <td><span class="title-link">{{ row.dlivTmpltNm }}</span></td>
            <td><span :class="['badge',fnMethodBadge(row.dlivMethodCd)]">{{ row.dlivMethodCd }}</span></td>
            <td><span class="badge badge-gray">{{ row.dlivPayTypeCd }}</span></td>
            <td style="text-align:right">{{ (row.dlivCost||0).toLocaleString() }}원</td>
            <td style="text-align:right">{{ row.freeDlivMinAmt ? (row.freeDlivMinAmt).toLocaleString()+'원 이상' : '무조건 유료' }}</td>
            <td style="text-align:right">{{ (row.returnCost||0).toLocaleString() }}원</td>
            <td style="text-align:center"><span :class="['badge',row.baseDlivYn==='Y'?'badge-orange':'badge-gray']">{{ row.baseDlivYn }}</span></td>
            <td style="text-align:center"><span :class="['badge',fnYnBadge(row.useYn)]">{{ row.useYn }}</span></td>
          </tr>
          <tr v-if="!dlivTmplts.length"><td colspan="8" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
           <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
           <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
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
    <!-- ── 상세 폼 ───────────────────────────────────────────────────────── -->
    <div class="card" v-if="uiState.selectedId">
      <div class="toolbar">
        <span class="list-title">{{ uiState.isNew ? '신규 등록' : '상세 / 수정' }}</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-blue btn-sm" @click="handleSave">저장</button>
          <button v-if="!uiState.isNew" class="btn btn-danger btn-sm" @click="handleDelete">삭제</button>
          <button class="btn btn-secondary btn-sm" @click="closeDetail">닫기</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px">
        <div class="form-group"><label class="form-label">템플릿명 <span style="color:red">*</span></label><input class="form-control" v-model="form.dlivTmpltNm"></div>
        <div class="form-group"><label class="form-label">배송방법</label>
          <select class="form-control" v-model="form.dlivMethodCd"><option v-for="m in DLIV_METHODS" :key="Math.random()" :value="m">{{ m }}</option></select>
        </div>
        <div class="form-group"><label class="form-label">배송비 결제유형</label>
          <select class="form-control" v-model="form.dlivPayTypeCd"><option v-for="p in DLIV_PAY_TYPES" :key="Math.random()" :value="p">{{ p }}</option></select>
        </div>
        <div class="form-group"><label class="form-label">배송 택배사</label>
          <select class="form-control" v-model="form.dlivCourierCd"><option value="">없음</option><option v-for="c in COURIERS" :key="Math.random()" :value="c">{{ c }}</option></select>
        </div>
        <div class="form-group"><label class="form-label">기본 배송비 (원)</label><input class="form-control" type="number" v-model.number="form.dlivCost"></div>
        <div class="form-group"><label class="form-label">무료배송 최소금액 (원)</label><input class="form-control" type="number" v-model.number="form.freeDlivMinAmt"></div>
        <div class="form-group"><label class="form-label">도서산간 추가배송비 (원)</label><input class="form-control" type="number" v-model.number="form.islandExtraCost"></div>
        <div class="form-group"><label class="form-label">반품배송비 편도 (원)</label><input class="form-control" type="number" v-model.number="form.returnCost"></div>
        <div class="form-group"><label class="form-label">교환배송비 왕복 (원)</label><input class="form-control" type="number" v-model.number="form.exchangeCost"></div>
        <div class="form-group"><label class="form-label">반품 택배사</label>
          <select class="form-control" v-model="form.returnCourierCd"><option value="">없음</option><option v-for="c in COURIERS" :key="Math.random()" :value="c">{{ c }}</option></select>
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
