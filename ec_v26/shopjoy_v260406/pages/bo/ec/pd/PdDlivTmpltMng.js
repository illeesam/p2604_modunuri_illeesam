/* ShopJoy Admin - 배송템플릿관리 */
window.PdDlivTmpltMng = {
  name: 'PdDlivTmpltMng',
  // ===== Props 정의 ========================================================
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // ===== 상태(reactive) 선언 =============================================
    // 목록 데이터 / UI 상태 / 공통코드 캐시
    const dlivTmplts = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null, descOpen: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      dliv_template_types: [],
      use_yn: [],
      dliv_methods: [{value:'COURIER',label:'택배'},{value:'DIRECT',label:'직접배송'},{value:'PICKUP',label:'방문수령'}],
      dliv_pay_types: [{value:'PREPAY',label:'선결제'},{value:'COD',label:'착불'}],
      couriers: [{value:'CJ',label:'CJ'},{value:'LOGEN',label:'LOGEN'},{value:'LOTTE',label:'LOTTE'},{value:'HANJIN',label:'HANJIN'},{value:'POST',label:'POST'},{value:'EPOST',label:'EPOST'},{value:'KGB',label:'KGB'}],
    });

    // ===== 공통코드 로딩 ===================================================
    /* 배송 템플릿 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.dliv_template_types = codeStore.sgGetGrpCodes('DLIV_TEMPLATE_TYPE');
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ===== 검색 파라미터 ===================================================
    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ method: '', use: '' });
    const searchParam = reactive(_initSearchParam());

    // ===== 정렬 처리 =======================================================
    const SORT_MAP = { nm: { asc: 'dlivTmpltNm asc', desc: 'dlivTmpltNm desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 배송 템플릿 onSort */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // ===== 목록 조회 API ===================================================
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.pdDlivTmplt.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '배송템플릿관리', '목록조회');
        const data = res.data?.data;
        dlivTmplts.splice(0, dlivTmplts.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (_) {
      console.error('[catch-info]', _);}
    };

    // ===== 라이프사이클 ====================================================
    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');    });

    // ===== 페이저 / 라벨 맵 / 선택 행 ======================================
    const pager        = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const selectedId   = ref(null);

    const METHOD_LABELS  = { COURIER:'택배', DIRECT:'직접배송', PICKUP:'방문수령' };
    const PAY_LABELS     = { PREPAY:'선결제', COD:'착불' };

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const cfSelectedRow = computed(() => dlivTmplts.find(t => t.dlivTmpltId === uiState.selectedId) || null);

    // ===== 상세 폼 상태 + 행 열기/닫기 / 신규 ===============================
    const form = reactive({});

    /* openDetail — 열기 */
    const openDetail = (row) => {
      if (uiState.selectedId === row.dlivTmpltId) { uiState.selectedId = null; return; }
      Object.assign(form, { ...row });
      uiState.selectedId = row.dlivTmpltId;
      uiState.isNew = false;
    };

    /* openNew — 신규 열기 */
    const openNew = () => {
      Object.assign(form, { dlivTmpltId: null, siteId: 1, vendorId: null, dlivTmpltNm: '', dlivMethodCd: 'COURIER', dlivPayTypeCd: 'PREPAY', dlivCourierCd: 'CJ', dlivCost: 3000, freeDlivMinAmt: 50000, islandExtraCost: 5000, returnCost: 3000, exchangeCost: 6000, returnCourierCd: 'CJ', returnAddrZip: '', returnAddr: '', returnAddrDetail: '', returnTelNo: '', baseDlivYn: 'N', useYn: 'Y' });
      uiState.selectedId = '__new__';
      uiState.isNew = true;
    };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { uiState.selectedId = null; };

    // ===== 저장 / 삭제 =====================================================
    /* handleSave — 저장 */
    const handleSave = async () => {
      if (!form.dlivTmpltNm) { showToast('템플릿명은 필수입니다.', 'error'); return; }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      const isNewTmplt = uiState.isNew;
      const src = dlivTmplts;
      if (isNewTmplt) { form.dlivTmpltId = 'DT' + String(Date.now()).slice(-6); src.push({ ...form }); uiState.selectedId = form.dlivTmpltId; uiState.isNew = false; }
      else { const si = src.findIndex(t => t.dlivTmpltId === form.dlivTmpltId); if (si !== -1) Object.assign(src[si], form); }
      try {
        const res = await boApiSvc.pdDlivTmplt.save(form.dlivTmpltId || null, { ...form }, isNewTmplt ? '배송템플릿관리' : '배송템플릿관리', isNewTmplt ? '등록' : '저장');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async () => {
      if (!cfSelectedRow.value) return;
      const ok = await showConfirm('삭제', `[${cfSelectedRow.value.dlivTmpltNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const si = dlivTmplts.findIndex(t => t.dlivTmpltId === cfSelectedRow.value.dlivTmpltId); if (si !== -1) dlivTmplts.splice(si, 1); closeDetail();
      try {
        const res = await boApiSvc.pdDlivTmplt.remove(cfSelectedRow.value.dlivTmpltId, '배송템플릿관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    // ===== 검색 / 리셋 / 페이지 변경 =======================================
    /* onSearch — 조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* setPage — 설정 */
    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ===== 배지(badge) 헬퍼 ================================================
    /* fnYnBadge — 유틸 */
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* 배송 템플릿 fnMethodBadge — sy_code DLIV_METHOD code_opt1 우선, 없으면 FB */
    const _DLIV_METHOD_FB = { COURIER:'badge-blue', DIRECT:'badge-orange', PICKUP:'badge-green' };
    /* fnMethodBadge — 유틸 */
    const fnMethodBadge = v => coUtil.cofCodeBadge('DLIV_METHOD', v, _DLIV_METHOD_FB[v] || 'badge-gray');

    // ===== 검색영역 컬럼 정의 (BoSearchArea :columns) ======================
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    // --- [컬럼 정의] ---
    const baseSearchColumns = [
      { key: 'searchValue', label: '템플릿명', type: 'text', placeholder: '템플릿명 검색' },
      { key: 'method', label: '배송방법', type: 'select', options: () => codes.dliv_methods, nullLabel: '전체' },
      { key: 'use', label: '사용여부', type: 'select', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // ===== 그리드 컬럼 정의 (BoGrid :columns) ==============================
    const baseGridColumns = [
      { key: 'dlivTmpltNm',   label: '템플릿명', sortKey: 'nm', link: true },
      { key: 'dlivMethodCd',  label: '배송방법',   style: 'width:90px;', badge: (row) => fnMethodBadge(row.dlivMethodCd) },
      { key: 'dlivPayTypeCd', label: '결제유형',   style: 'width:80px;', badge: () => 'badge-gray' },
      { key: 'dlivCost',      label: '기본배송비', style: 'width:100px;text-align:right;', align: 'right',
        fmt: (v) => ((v || 0).toLocaleString() + '원') },
      { key: 'freeDlivMinAmt',label: '무료배송조건',style: 'width:120px;text-align:right;', align: 'right',
        fmt: (v) => (v ? v.toLocaleString() + '원 이상' : '무조건 유료') },
      { key: 'returnCost',    label: '반품배송비', style: 'width:100px;text-align:right;', align: 'right',
        fmt: (v) => ((v || 0).toLocaleString() + '원') },
      { key: 'baseDlivYn',    label: '기본',       style: 'width:70px;text-align:center;', align: 'center',
        badge: (row) => (row.baseDlivYn === 'Y' ? 'badge-orange' : 'badge-gray') },
      { key: 'useYn',         label: '사용',       style: 'width:60px;text-align:center;', align: 'center',
        badge: (row) => fnYnBadge(row.useYn) },
    ];

    const baseFormColumns = [
      { key: 'dlivTmpltNm',      label: '템플릿명', type: 'text', required: true },
      { key: 'dlivMethodCd',     label: '배송방법', type: 'select', nullable: false,
        options: () => codes.dliv_methods },
      { key: 'dlivPayTypeCd',    label: '배송비 결제유형', type: 'select', nullable: false,
        options: () => codes.dliv_pay_types },
      { key: 'dlivCourierCd',    label: '배송 택배사', type: 'select', nullLabel: '없음',
        options: () => codes.couriers },
      { key: 'dlivCost',         label: '기본 배송비 (원)', type: 'number' },
      { key: 'freeDlivMinAmt',   label: '무료배송 최소금액 (원)', type: 'number' },
      { key: 'islandExtraCost',  label: '도서산간 추가배송비 (원)', type: 'number' },
      { key: 'returnCost',       label: '반품배송비 편도 (원)', type: 'number' },
      { key: 'exchangeCost',     label: '교환배송비 왕복 (원)', type: 'number' },
      { key: 'returnCourierCd',  label: '반품 택배사', type: 'select', nullLabel: '없음',
        options: () => codes.couriers },
      { key: 'returnAddrZip',    label: '반품지 우편번호', type: 'text' },
      { key: 'returnTelNo',      label: '반품지 전화번호', type: 'text' },
      { type: 'rowBreak' },
      { key: 'returnAddr',       label: '반품지 주소', type: 'text', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'returnAddrDetail', label: '반품지 상세주소', type: 'text', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'baseDlivYn',       label: '기본 배송지', type: 'select', options: () => codes.use_yn },
      { key: 'useYn',            label: '사용여부', type: 'select', options: () => codes.use_yn },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { uiState, codes, searchParam, baseSearchColumns, baseGridColumns, baseFormColumns,
             pager, setPage, onSearch, onReset,
             form, openDetail, openNew, closeDetail, handleSave, handleDelete,
             fnYnBadge, fnMethodBadge, METHOD_LABELS, PAY_LABELS, onSizeChange, dlivTmplts, onSort, sortIcon};
  },
  // ===== 템플릿 ===========================================================
  template: `
<div>
  <!-- 페이지 타이틀 -->
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">배송템플릿관리</div>
  <!-- 안내 박스 (접기/펼치기) -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span><strong style="color:#1a7a52">배송템플릿</strong>은 상품에 공통 적용할 배송비 조건을 미리 정의해두는 설정입니다.</span>
    <button @click="uiState.descOpen=!uiState.descOpen" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" style="margin-top:6px">
      ✔ 무료·고정·조건부(금액/수량) 배송비 방식을 선택하고
      <strong>상품 등록 시 템플릿을 연결</strong>
      해 재사용합니다.
      <br>
      ✔ 도서·산간 지역 추가 배송비,
      <strong>반품지 주소</strong>
      를 함께 관리합니다.
      <br>
      ✔ 업체(벤더)별로 독립 설정이 가능하며, 여러 상품이 동일 템플릿을 공유할 수 있습니다.
      <br>
      <span style="color:#888;font-size:12px">예) 3만원 이상 무료배송, 제주·도서 추가 3,000원</span>
    </div>
  </div>
  <!-- 검색영역 -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- 목록영역 -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">배송템플릿 목록</span>
      <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      <button class="btn btn-primary btn-sm" style="margin-left:auto" @click="openNew">+ 신규</button>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="dlivTmplts" :pager="pager" row-key="dlivTmpltId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-class="(row) => uiState.selectedId===row.dlivTmpltId ? 'active' : ''"
      @sort="onSort" @row-click="openDetail" @set-page="setPage" @size-change="onSizeChange"></bo-grid>
  </div>
  <!-- 상세영역 (신규/수정 폼) -->
  <!-- ===== ■. 상세 패널 =================================================== -->
  <div class="card" v-if="uiState.selectedId">
    <!-- 상세 툴바: 제목 + 저장/삭제/닫기 -->
    <div class="toolbar">
      <span class="list-title">{{ uiState.isNew ? '신규 등록' : '상세 / 수정' }}</span>
      <div style="margin-left:auto;display:flex;gap:6px;">
        <button class="btn btn-blue btn-sm" @click="handleSave">저장</button>
        <button v-if="!uiState.isNew" class="btn btn-danger btn-sm" @click="handleDelete">삭제</button>
        <button class="btn btn-secondary btn-sm" @click="closeDetail">닫기</button>
      </div>
    </div>
    <!-- 상세 입력폼 (BoFormArea 자동 렌더) -->
    <div style="padding:12px">
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="baseFormColumns" :form="form" :errors="{}"
        :cols="2" :show-actions="false" />
    </div>
  </div>
</div>
`
};
