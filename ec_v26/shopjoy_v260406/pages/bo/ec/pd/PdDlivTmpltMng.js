/* ShopJoy Admin - 배송템플릿관리 */
window.PdDlivTmpltMng = {
  name: 'PdDlivTmpltMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const dlivTmplts = reactive([]);              // 배송템플릿 목록 (메인 그리드)
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null, descOpen: false, sortKey: '', sortDir: 'asc', isNew: false });
    const codes = reactive({
      dliv_template_types: [],
      use_yn: [],
      dliv_methods: [{value:'COURIER',label:'택배'},{value:'DIRECT',label:'직접배송'},{value:'PICKUP',label:'방문수령'}],
      dliv_pay_types: [{value:'PREPAY',label:'선결제'},{value:'COD',label:'착불'}],
      couriers: [{value:'CJ',label:'CJ'},{value:'LOGEN',label:'LOGEN'},{value:'LOTTE',label:'LOTTE'},{value:'HANJIN',label:'HANJIN'},{value:'POST',label:'POST'},{value:'EPOST',label:'EPOST'},{value:'KGB',label:'KGB'}],
    });
    const form = reactive({});                    // 상세 폼 데이터
    const SORT_MAP = { nm: { asc: 'dlivTmpltNm asc', desc: 'dlivTmpltNm desc' } };
    const METHOD_LABELS = { COURIER:'택배', DIRECT:'직접배송', PICKUP:'방문수령' };
    const PAY_LABELS = { PREPAY:'선결제', COD:'착불' };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdDlivTmpltMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        return handleSearchList();
      // 신규 등록 패널 열기
      } else if (cmd === 'dlivTmplts-add') {
        return openNew();
      // 안내 설명 토글
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      // 상세 폼 저장
      } else if (cmd === 'form-save') {
        return handleSave();
      // 상세 폼 삭제
      } else if (cmd === 'form-delete') {
        return handleDelete();
      // 상세 폼 닫기
      } else if (cmd === 'form-close') {
        uiState.selectedId = null;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/정렬/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdDlivTmpltMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 행 클릭 → 상세 열기
      if (cmd === 'dlivTmplts-rowOpen') {
        return openDetail(param);
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'dlivTmplts-sort') {
        return onSort(param);
      // 페이지 번호 변경
      } else if (cmd === 'dlivTmplts-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'dlivTmplts-pager-sizeChange') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ method: '', use: '' });
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* getSortParam — 정렬 파라미터 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

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
        console.error('[catch-info]', _);
      }
    };

    /* openDetail — 상세 열기 (토글) */
    const openDetail = (row) => {
      if (uiState.selectedId === row.dlivTmpltId) { uiState.selectedId = null; return; }
      Object.assign(form, { ...row });
      uiState.selectedId = row.dlivTmpltId;
      uiState.isNew = false;
    };

    /* openNew — 신규 등록 폼 열기 */
    const openNew = () => {
      Object.assign(form, { dlivTmpltId: null, siteId: 1, vendorId: null, dlivTmpltNm: '', dlivMethodCd: 'COURIER', dlivPayTypeCd: 'PREPAY', dlivCourierCd: 'CJ', dlivCost: 3000, freeDlivMinAmt: 50000, islandExtraCost: 5000, returnCost: 3000, exchangeCost: 6000, returnCourierCd: 'CJ', returnAddrZip: '', returnAddr: '', returnAddrDetail: '', returnTelNo: '', baseDlivYn: 'N', useYn: 'Y' });
      uiState.selectedId = '__new__';
      uiState.isNew = true;
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      if (!form.dlivTmpltNm) { showToast('템플릿명은 필수입니다.', 'error'); return; }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      const isNewTmplt = uiState.isNew;
      const src = dlivTmplts;
      if (isNewTmplt) { form.dlivTmpltId = 'DT' + String(Date.now()).slice(-6); src.push({ ...form }); uiState.selectedId = form.dlivTmpltId; uiState.isNew = false; }
      else { const si = src.findIndex(t => t.dlivTmpltId === form.dlivTmpltId); if (si !== -1) Object.assign(src[si], form); }
      try {
        const res = await boApiSvc.pdDlivTmplt.save(form.dlivTmpltId || null, { ...form }, '배송템플릿관리', isNewTmplt ? '등록' : '저장');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async () => {
      if (!cfSelectedRow.value) { return; }
      const ok = await showConfirm('삭제', `[${cfSelectedRow.value.dlivTmpltNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const si = dlivTmplts.findIndex(t => t.dlivTmpltId === cfSelectedRow.value.dlivTmpltId); if (si !== -1) dlivTmplts.splice(si, 1); uiState.selectedId = null;
      try {
        const res = await boApiSvc.pdDlivTmplt.remove(cfSelectedRow.value.dlivTmpltId, '배송템플릿관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnYnBadge — 사용여부 배지 */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnMethodBadge — 배송방법 배지 (sy_code DLIV_METHOD code_opt1 우선) */
    const _DLIV_METHOD_FB = { COURIER:'badge-blue', DIRECT:'badge-orange', PICKUP:'badge-green' };
    const fnMethodBadge = v => coUtil.cofCodeBadge('DLIV_METHOD', v, _DLIV_METHOD_FB[v] || 'badge-gray');

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

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    const cfSelectedRow = computed(() => dlivTmplts.find(t => t.dlivTmpltId === uiState.selectedId) || null);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', label: '템플릿명', type: 'text', placeholder: '템플릿명 검색' },
      { key: 'method', label: '배송방법', type: 'select', options: () => codes.dliv_methods, nullLabel: '전체' },
      { key: 'use', label: '사용여부', type: 'select', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
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

    // 기본 폼 — cols=3 기준 자연 배치
    columns.baseForm = [
      /* 1행: 템플릿명(2) + 배송방법(1) */
      { key: 'dlivTmpltNm',      label: '템플릿명', type: 'text', required: true, colSpan: 2 },
      { key: 'dlivMethodCd',     label: '배송방법', type: 'select', nullable: false,
        options: () => codes.dliv_methods },
      /* 2행: 결제유형 + 택배사 + 기본배송비 */
      { key: 'dlivPayTypeCd',    label: '배송비 결제유형', type: 'select', nullable: false,
        options: () => codes.dliv_pay_types },
      { key: 'dlivCourierCd',    label: '배송 택배사', type: 'select', nullLabel: '없음',
        options: () => codes.couriers },
      { key: 'dlivCost',         label: '기본 배송비 (원)', type: 'number' },
      /* 3행: 무료배송 최소 + 도서산간 + 반품배송비 편도 */
      { key: 'freeDlivMinAmt',   label: '무료배송 최소금액 (원)', type: 'number' },
      { key: 'islandExtraCost',  label: '도서산간 추가배송비 (원)', type: 'number' },
      { key: 'returnCost',       label: '반품배송비 편도 (원)', type: 'number' },
      /* 4행: 교환배송 왕복 + 반품 택배사 + 반품지 우편번호 */
      { key: 'exchangeCost',     label: '교환배송비 왕복 (원)', type: 'number' },
      { key: 'returnCourierCd',  label: '반품 택배사', type: 'select', nullLabel: '없음',
        options: () => codes.couriers },
      { key: 'returnAddrZip',    label: '반품지 우편번호', type: 'text' },
      /* 5행: 반품지 전화번호 + 기본배송지 + 사용여부 */
      { key: 'returnTelNo',      label: '반품지 전화번호', type: 'text' },
      { key: 'baseDlivYn',       label: '기본 배송지', type: 'select', options: () => codes.use_yn },
      { key: 'useYn',            label: '사용여부', type: 'select', options: () => codes.use_yn },
      /* 6~7행: 반품지 주소/상세주소 (전체 폭) */
      { key: 'returnAddr',       label: '반품지 주소', type: 'text', colSpan: 3 },
      { key: 'returnAddrDetail', label: '반품지 상세주소', type: 'text', colSpan: 3 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, codes, searchParam, pager, dlivTmplts, form,                            // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                              // dispatch
      fnYnBadge, fnMethodBadge, METHOD_LABELS, PAY_LABELS,                              // 헬퍼
    };
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    배송템플릿관리
  </div>
  <!-- ===== ■. 안내 설명 박스 (접기/펼치기) ================================== -->
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span>
      <strong style="color:#1a7a52">
        배송템플릿
      </strong>
      은 상품에 공통 적용할 배송비 조건을 미리 정의해두는 설정입니다.
    </span>
    <button @click="handleBtnAction('desc-toggle')" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" style="margin-top:6px">
      ✔ 무료·고정·조건부(금액/수량) 배송비 방식을 선택하고
      <strong>
        상품 등록 시 템플릿을 연결
      </strong>
      해 재사용합니다.
      <br>
      ✔ 도서·산간 지역 추가 배송비,
      <strong>
        반품지 주소
      </strong>
      를 함께 관리합니다.
      <br>
      ✔ 업체(벤더)별로 독립 설정이 가능하며, 여러 상품이 동일 템플릿을 공유할 수 있습니다.
      <br>
      <span style="color:#888;font-size:12px">
        예) 3만원 이상 무료배송, 제주·도서 추가 3,000원
      </span>
    </div>
  </div>
  <!-- ===== □. 안내 설명 박스 ================================================ -->
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 그리드 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        배송템플릿 목록
      </span>
      <span class="list-count">
        총 {{ pager.pageTotalCount }}건
      </span>
      <button class="btn btn-primary btn-sm" style="margin-left:auto" @click="handleBtnAction('dlivTmplts-add')">
        + 신규
      </button>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="columns.baseGrid" :rows="dlivTmplts" row-key="dlivTmpltId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-class="(row) => uiState.selectedId===row.dlivTmpltId ? 'active' : ''"
      @sort="key => handleSelectAction('dlivTmplts-sort', key)" @row-click="row => handleSelectAction('dlivTmplts-rowOpen', row)" @set-page="n => handleSelectAction('dlivTmplts-pager-setPage', n)" @size-change="handleSelectAction('dlivTmplts-pager-sizeChange')">
    </bo-grid>
        <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('dlivTmplts-pager-setPage', n)" :on-size-change="() => handleSelectAction('dlivTmplts-pager-sizeChange')" />
  </div>
  <!-- ===== □. 목록 그리드 =================================================== -->
  <!-- ===== ■. 상세 패널 (신규/수정 폼) ====================================== -->
  <div class="card" v-if="uiState.selectedId">
    <!-- ===== ■.■. 상세 툴바: 제목만 (저장/삭제/닫기는 하단 form-actions) ======== -->
    <div class="toolbar">
      <span class="list-title">
        {{ uiState.isNew ? '배송템플릿 신규 등록' : '배송템플릿 상세 / 수정' }}
        <span v-if="!uiState.isNew && form.dlivTmpltId" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
          #{{ form.dlivTmpltId }}
        </span>
      </span>
    </div>
    <!-- ===== □.□. 상세 툴바 ================================================ -->
    <!-- ===== ■.■. 상세 입력폼 (BoFormArea 자동 렌더) ======================== -->
    <div style="padding:12px">
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="columns.baseForm" :form="form" :errors="{}"
        :cols="3" :show-actions="false" />
      <!-- ===== ■.■.■. 하단 액션 (저장/삭제/닫기) — .form-actions 가 중앙 정렬 ===== -->
      <div class="form-actions">
        <button class="btn btn-blue" @click="handleBtnAction('form-save')">
          저장
        </button>
        <button v-if="!uiState.isNew" class="btn btn-danger" @click="handleBtnAction('form-delete')">
          삭제
        </button>
        <button class="btn btn-secondary" @click="handleBtnAction('form-close')">
          닫기
        </button>
      </div>
    </div>
  </div>
  <!-- ===== □. 상세 패널 =================================================== -->
</div>
`
};
