/* ShopJoy Admin - 카테고리상품관리 (pd_category_prod) */
window.PdCategoryProdMng = {
  name: 'PdCategoryProdMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ==================================================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const categories = reactive([]);
    const products = reactive([]);
    const categoryProds = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: window._ecCategoryProdState?.tabMode || 'tab', activeTypeCd: 'NORMAL'});
    const tab = Vue.toRef(uiState, 'tab');
    const codes = reactive({
      product_statuses: [],
      disp_yn_opts: [{ codeValue: 'Y', codeLabel: '전시' }, { codeValue: 'N', codeLabel: '비전시' }],
    });

    /* 카테고리-상품 매핑 fnLoadCodes */

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdCategoryProdMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 카테고리-상품 매핑 저장
      } else if (cmd === 'categoryProds-save') {
        return onSave();
      // 상품추가 피커 모달 열기
      } else if (cmd === 'prodPickModal-open') {
        return openPicker();
      // 상품추가 피커 모달 닫기
      } else if (cmd === 'prodPickModal-close') {
        pickerOpen.value = false;
        return;
      // 피커 내 상품 검색
      } else if (cmd === 'prodPickModal-search') {
        return onPickerSearch();
      // 좌측 트리 전체 보기 (선택 해제)
      } else if (cmd === 'categoryTree-clear') {
        cfSelectedCatId.value = null;
        return;
      // 진열 유형 탭 전환
      } else if (cmd === 'tab-typeSelect') {
        uiState.activeTypeCd = param;
        return;
      // 뷰모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdCategoryProdMng.js : handleSelectAction -> ', cmd, param);
      // 좌측 트리 노드 선택
      if (cmd === 'categoryTree-select') {
        return selectNode(param);
      // 그리드 행 삭제
      } else if (cmd === 'categoryProds-rowRemove') {
        return removeRow(param);
      // 강조옵션 토글
      } else if (cmd === 'categoryProds-rowEmphasisToggle') {
        return toggleEmphasis(param.row, param.cd);
      // 그리드 행 드래그 시작
      } else if (cmd === 'categoryProds-rowDragStart') {
        return onDragStart(param);
      // 그리드 행 드래그 오버
      } else if (cmd === 'categoryProds-rowDragOver') {
        return onDragOver(param);
      // 그리드 행 드롭 (순서 변경)
      } else if (cmd === 'categoryProds-rowDrop') {
        return onDrop();
      // 피커 모달에서 상품 선택 (추가)
      } else if (cmd === 'prodPickModal-add') {
        return addProd(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) ==============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* 선택된 카테고리 (watch 이전에 선언 필수) */
    const cfSelectedCatId = ref(null);

    /* fnCatIdsWithChildren — 유틸 */
    const fnCatIdsWithChildren = (catId) => {
      if (!catId) { return []; }
      const childIds = categories
        .filter(c => c.parentCategoryId === catId)
        .map(c => c.categoryId);
      return [catId, ...childIds];
    };

    /* handleReloadByCategory — 처리 */
    const handleReloadByCategory = async () => {
      const catId = cfSelectedCatId.value;
      if (!catId) { categoryProds.splice(0, categoryProds.length); return; }
      pager.pageNo = 1;
      searchParam.categoryId = '';
      searchParam.categoryIdsCsv = fnCatIdsWithChildren(catId).join(',');
      searchParam.typeCd = uiState.activeTypeCd;
      await handleSearchList('DEFAULT');
    };

    watch(() => cfSelectedCatId.value, handleReloadByCategory);
    watch(() => uiState.activeTypeCd, () => { if (cfSelectedCatId.value) handleReloadByCategory(); });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
    });

    /* -- 뷰모드 영속화 -- */
    if (!window._ecCategoryProdState) { window._ecCategoryProdState = { tabMode: 'tab' }; }

        watch(() => uiState.tabMode, v => { window._ecCategoryProdState.tabMode = v; });

    /* -- 진열 유형 탭 -- */
    const TYPE_TABS = [
      { cd: 'NORMAL',    nm: '일반상품' },
      { cd: 'HIGHLIGHT', nm: '하이라이트상품' },
      { cd: 'RECOMMEND', nm: '추천상품' },
      { cd: 'MAIN',      nm: '대표상품' },
      { cd: 'BANNER',    nm: '배너상품' },
      { cd: 'HOT_DEAL',  nm: '핫딜상품' },
    ];

    /* -- 강조 옵션 -- */
    const EMPHASIS_OPTS = [
      { cd: 'BOLD',       nm: '볼드',      icon: 'B' },
      { cd: 'TEXT_COLOR', nm: '글자색',    icon: 'A' },
      { cd: 'EMOTICON',   nm: '이모티콘',  icon: '😊' },
      { cd: 'MARQUEE',    nm: '흐르는글자', icon: '〜' },
    ];

    /* parseEmphasis — 파싱 Emphasis */
    const parseEmphasis  = str => str ? str.split('^').filter(Boolean) : [];

    /* hasEmphasis — 여부 확인 */
    const hasEmphasis    = (str, cd) => parseEmphasis(str).includes(cd);

    /* toggleEmphasis — 토글 */
    const toggleEmphasis = (row, cd) => {
      const s = new Set(parseEmphasis(row.emphasisCd));
      if (s.has(cd)) s.delete(cd); else s.add(cd);
      row.emphasisCd = s.size ? '^' + [...s].join('^') + '^' : '';
    };

    /* defaultDispEndDate — 기본 Disp End 날짜 */
    const defaultDispEndDate   = () => { const y = new Date().getFullYear() + 3; return `${y}-12-31`; };

    /* defaultDispStartDate — 기본 Disp 시작 날짜 */
    const defaultDispStartDate = () => new Date().toISOString().slice(0, 10);

    /* -- 검색 -- */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ prodNm: '', categoryId: '', categoryIdsCsv: '', typeCd: '' });
    const searchParam = reactive(_initSearchParam());

    /* 카테고리-상품 매핑 목록조회 */
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const { prodNm, ...restParam } = searchParam;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...Object.fromEntries(Object.entries(restParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(prodNm ? { prodNm: prodNm.trim() } : {}),
        };
        const res = await boApiSvc.pdCategory.getProds(params, '카테고리상품관리', '목록조회');
        const data = res.data?.data;
        categoryProds.splice(0, categoryProds.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage  = data?.pageTotalPage  || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (err) {
        console.error('[handleSearchList]', err);
        categoryProds.splice(0, categoryProds.length);
      }
    };

    /* onSearch — 조회 */
    const onSearch = () => {
      pager.pageNo = 1;
      Object.assign(pager.pageCond, searchParam);
      handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      onSearch();
    };

    /* handleSearchCategoriesList — 처리 */
    const handleSearchCategoriesList = async () => {
      try {
        const res = await boApiSvc.pdCategory.getPage({ pageNo: 1, pageSize: 10000 }, '카테고리관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        categories.splice(0, categories.length, ...list);
      } catch (e) {
        console.error('[handleSearchCategoriesList]', e);
      }
    };

    /* handleSearchProductsList — 처리 */
    const handleSearchProductsList = async () => {
      try {
        const res = await boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 10000 }, '카테고리상품관리', '상품목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        products.splice(0, products.length, ...list);
      } catch (e) {
        console.error('[handleSearchProductsList]', e);
      }
    };

    /* ★ onMounted — 진입 시 카테고리·상품 목록 조회 */
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await Promise.all([handleSearchCategoriesList(), handleSearchProductsList()]);
      try {
        await handleSearchList('DEFAULT');
      } catch (err) {
        console.warn('[onMounted] handleSearchList failed:', err.message);
      }
    });

    /* selectNode — 노드 선택 */
    const selectNode = id => {
      if (id === null) { cfSelectedCatId.value = null; return; }
      cfSelectedCatId.value = (cfSelectedCatId.value === id) ? null : id;
    };
    const cfSelectedCat = computed(() => categories.find(c => c.categoryId === cfSelectedCatId.value));
    const cfIsLeafCat = computed(() => !categories.some(c => c.parentCategoryId === cfSelectedCatId.value));

    /* fnDepthColor — 유틸 */
    const fnDepthColor = (d) => ({0:'#e8587a',1:'#1677ff',2:'#3ba87a'}[d] || '#999');

    /* fnDepthBullet — 유틸 */
    const fnDepthBullet = (d) => ['●','○','▪'][d] || '·';

    /* totalProdCount — 전체 상품 건수 */
    const totalProdCount = (catId) => categoryProds.filter(cp => cp.categoryId === catId).length;
    const cfTypeCountMap = computed(() => {
      const map = {};
      TYPE_TABS.forEach(t => { map[t.cd] = categoryProds.filter(cp => cp.categoryProdTypeCd === t.cd).length; });
      return map;
    });
    /* cfFilteredRows 제거: 카테고리(자식포함)+진열유형 필터는 서버(API)가 수행 → categoryProds 직접 사용 */

    /* -- 드래그 상태 -- */
    const dragoverIdx = ref(null);
    let dragStartIdx = null;

    /* onDragStart — 드래그 시작 */
    const onDragStart = (idx) => { dragStartIdx = idx; };

    /* onDragOver — 드래그 오버 */
    const onDragOver = (idx) => { dragoverIdx.value = idx; };

    /* onDrop — 이벤트 */
    const onDrop = () => {
      if (dragStartIdx !== null && dragoverIdx.value !== null && dragStartIdx !== dragoverIdx.value) {
        const temp = categoryProds[dragStartIdx];
        categoryProds.splice(dragStartIdx, 1);
        categoryProds.splice(dragoverIdx.value, 0, temp);
      }
      dragoverIdx.value = null;
      dragStartIdx = null;
    };

    /* getProdNm — 조회 */
    const getProdNm = (prodId) => {
      const prod = products.find(p => p.prodId === prodId);
      return prod?.prodNm || `[${prodId}]`;
    };

    /* getProd — 조회 */
    const getProd = (prodId) => products.find(p => p.prodId === prodId);

    /* getCatPath — 조회 */
    const getCatPath = (catId) => {
      const cat = categories.find(c => c.categoryId === catId);
      if (!cat) { return '-'; }
      const path = [cat.categoryNm];
      let parent = cat.parentCategoryId;
      while (parent && categories.some(c => c.categoryId === parent)) {
        const p = categories.find(c => c.categoryId === parent);
        path.unshift(p.categoryNm);
        parent = p.parentCategoryId;
      }
      return path.join(' > ');
    };

    /* removeRow — 제거 */
    const removeRow = (row) => {
      const idx = categoryProds.findIndex(r => r === row);
      if (idx !== -1) { categoryProds.splice(idx, 1); }
    };

    /* addProd — 추가 */
    const addProd = (prod) => {
      const exists = categoryProds.some(cp => cp.prodId === prod.prodId && cp.categoryId === cfSelectedCatId.value && cp.categoryProdTypeCd === uiState.activeTypeCd);
      if (exists) {
        if (showToast) { showToast('이미 추가된 상품입니다.', 'warning'); }
        return;
      }
      const newRow = {
        _id: Math.random(),
        _isNew: true,
        rowStatus: 'I',
        prodId: prod.prodId,
        categoryId: cfSelectedCatId.value,
        categoryProdTypeCd: uiState.activeTypeCd,
        emphasisCd: '',
        dispStartDate: defaultDispStartDate(),
        dispEndDate: defaultDispEndDate(),
        dispYn: 'Y'
      };
      categoryProds.push(newRow);
      pickerOpen.value = false;
      if (showToast) { showToast('상품이 추가되었습니다.', 'success'); }
    };

    /* -- 피커 검색 (서버 조회) -- */
    const pickerResults = reactive([]);
    const pickerOpen = ref(false);
    const pickerSearchType = ref('');
    const pickerSearch = ref('');

    /* 피커 상품 서버검색 — 검색어/검색대상을 pdProd.getPage 에 전달 (상위 50건).
       검색대상은 백엔드 지원범위(prodNm/prodId)만 사용. [조회]/Enter/모달열기 시점에만 호출. */
    /* onPickerSearch — 이벤트 */
    const onPickerSearch = async () => {
      try {
        const params = { pageNo: 1, pageSize: 50 };
        const sv = pickerSearch.value.trim();
        if (sv) {
          params.searchValue = sv;
          if (pickerSearchType.value) { params.searchType = pickerSearchType.value; }
        }
        const res = await boApiSvc.pdProd.getPage(params, '카테고리상품관리', '상품검색');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        pickerResults.splice(0, pickerResults.length, ...list);
      } catch (e) {
        console.error('[onPickerSearch]', e);
        pickerResults.splice(0, pickerResults.length);
      }
    };

    /* openPicker — 열기 */
    const openPicker = () => {
      pickerSearchType.value = '';
      pickerSearch.value = '';
      pickerOpen.value = true;
      onPickerSearch();
    };

    /* onSave — 이벤트 */
    const onSave = async () => {
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await boApiSvc.pdCategory.updateProds({ categoryProds }, '카테고리상품관리', '저장');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('저장되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };
    /* BoGrid 컬럼 — 카테고리-상품 매핑 (전시기간/전시 컬럼은 NORMAL 외 타입만) */
        // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

        // --- [컬럼 정의] ---
        const baseSearchColumns = [
      { key: 'prodNm', label: '상품명', type: 'text', placeholder: '상품명 검색', width: '280px' },
    ];

    const cfCatProdGridColumns = computed(() => {
      const cols = [
        { key: 'prodId',   label: 'ID',   style: 'width:40px;text-align:center', align: 'center', cellStyle: 'color:#aaa;' },
        { key: '_prodNm',  label: '상품명 / 강조옵션' },
        { key: '_catPath', label: '카테고리경로', style: 'width:130px;text-align:center', align: 'center',
          cellStyle: 'color:#888;line-height:1.3;', fmt: (v, row) => getCatPath(row.categoryId) },
        { key: '_price',   label: '판매가',  style: 'width:78px;text-align:right', align: 'right',
          fmt: (v, row) => (((getProd(row.prodId) || {}).salePrice || 0).toLocaleString() + '원') },
        { key: '_stock',   label: '재고',    style: 'width:44px;text-align:center', align: 'center',
          fmt: (v, row) => ((getProd(row.prodId) || {}).prodStock != null ? (getProd(row.prodId) || {}).prodStock : '-') },
        { key: '_status',  label: '상태',    style: 'width:52px;text-align:center', align: 'center',
          badge: (row) => { const n = (getProd(row.prodId) || {}).prodStatusCdNm; return n === '판매중' ? 'badge-green' : (n === '품절' ? 'badge-red' : 'badge-gray'); },
          fmt: (v, row) => ((getProd(row.prodId) || {}).prodStatusCdNm || '-') },
      ];
      if (uiState.activeTypeCd !== 'NORMAL') {
        cols.push({ key: '_dispPeriod', label: '전시기간', style: 'width:216px;text-align:center' });
        cols.push({ key: 'dispYn',      label: '전시',     style: 'width:60px;text-align:center',
          edit: 'select', options: () => codes.disp_yn_opts,
          cellStyle: (v) => v==='Y' ? 'color:#16a34a;font-weight:600;' : 'color:#9ca3af;' });
      }
      return cols;
    });
    /* fnCatProdRowStyle — 유틸 */
    const fnCatProdRowStyle = (row, idx) => {
      if (dragoverIdx.value === idx) { return 'background:#e6f4ff'; }
      if (row._isNew) { return 'background:#f6ffed'; }
      if (uiState.activeTypeCd !== 'NORMAL' && row.dispYn === 'N') { return 'background:#fafafa;opacity:0.65'; }
      return '';
    };

    /* BoGrid 컬럼 — 상품 추가 피커 */
    const catProdPickerGridColumns = [
      { key: 'prodId',    label: 'ID',       style: 'width:44px', cellStyle: 'color:#aaa;' },
      { key: 'prodNm',    label: '상품명' },
      { key: 'cateNm',    label: '카테고리', style: 'width:80px;text-align:center', align: 'center',
        cellStyle: 'color:#888;', fmt: (v) => (v || '-') },
      { key: '_price',    label: '판매가',   style: 'width:90px;text-align:right', align: 'right',
        fmt: (v, row) => ((row.salePrice || 0).toLocaleString() + '원') },
      { key: 'prodStock', label: '재고',     style: 'width:60px;text-align:center', align: 'center', fmt: v => v != null ? v : '-' },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      codes, uiState, categories, categoryProds, searchParam, pager, pickerResults,         // 상태 / 데이터
      baseSearchColumns, cfCatProdGridColumns, catProdPickerGridColumns,                    // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                  // dispatch (모든 이벤트 / 액션 라우팅)
      cfSelectedCatId, cfSelectedCat, cfIsLeafCat, cfTypeCountMap,                          // computed
      fnCatProdRowStyle, fnDepthColor, fnDepthBullet, totalProdCount,                       // 헬퍼
      TYPE_TABS, EMPHASIS_OPTS, hasEmphasis, getProdNm, getProd, getCatPath,                // 헬퍼
      dragoverIdx, pickerOpen, pickerSearchType, pickerSearch,                              // ref
    };
  },

  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    카테고리상품관리
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 상품목록 =========================================== -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">
    <!-- ===== ■.■. 좌측 카테고리 트리 ============================================ -->
    <div class="card" style="padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:#555">
          📁 카테고리
        </span>
        <div v-if="cfSelectedCatId" style="font-size:11px;color:#1677ff;cursor:pointer" @click="handleBtnAction('categoryTree-clear')">
          전체
        </div>
      </div>
      <bo-category-tree mode="tree" :selected="cfSelectedCatId" :show-count="totalProdCount" @select="id => handleSelectAction('categoryTree-select', id)" />
    </div>
    <!-- ===== □.□. 좌측 카테고리 트리 ============================================ -->
    <!-- ===== ■.■. 우측 상품 목록 ============================================== -->
    <div class="card">
      <!-- ===== ■.■.■. 선택 전 안내 ============================================= -->
      <div v-if="!cfSelectedCatId" style="text-align:center;padding:60px;color:#aaa">
        <div style="font-size:32px;margin-bottom:12px">
          📂
        </div>
        <div>
          좌측에서 카테고리를 선택하세요.
        </div>
      </div>
      <template v-else>
        <!-- ===== ■.■.■.■. 카테고리명 + 저장/추가 버튼 ================================== -->
        <div class="toolbar" style="margin-bottom:0">
          <span class="list-title">
            <span :style="{ color: fnDepthColor((cfSelectedCat?.categoryDepth||1)-1), fontWeight:700, marginRight:'4px' }">
              {{ fnDepthBullet((cfSelectedCat?.categoryDepth||1)-1) }}
            </span>
            {{ cfSelectedCat?.categoryNm }}
            <span v-if="!cfIsLeafCat" style="font-size:11px;color:#aaa;margin-left:6px">
              (하위 포함)
            </span>
          </span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" @click="handleBtnAction('prodPickModal-open')">
              + 상품추가
            </button>
            <button class="btn btn-primary btn-sm" @click="handleBtnAction('categoryProds-save')">
              저장
            </button>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 탭바 + 뷰모드 버튼 ======================================= -->
        <div class="tab-bar-row" style="margin:12px 0 0">
          <div class="tab-nav" style="flex:1;flex-wrap:wrap">
            <button v-for="tab in TYPE_TABS" :key="(tab && tab.cd)" class="tab-btn" :class="{ active: uiState.activeTypeCd===tab.cd }" @click="handleBtnAction('tab-typeSelect', tab.cd)">
            {{ tab.nm }}
            <span v-if="cfTypeCountMap[tab.cd]" class="tab-count">
              {{ cfTypeCountMap[tab.cd] }}
            </span>
          </button>
        </div>
        <div class="tab-modes">
          <button class="tab-mode-btn" :class="{ active: uiState.tabMode==='tab' }"  @click="handleBtnAction('tab-mode', 'tab')"  title="탭으로 보기">
            📑
          </button>
          <button class="tab-mode-btn" :class="{ active: uiState.tabMode==='1col' }" @click="handleBtnAction('tab-mode', '1col')" title="1열로 보기">
            1▭
          </button>
          <button class="tab-mode-btn" :class="{ active: uiState.tabMode==='2col' }" @click="handleBtnAction('tab-mode', '2col')" title="2열로 보기">
            2▭
          </button>
          <button class="tab-mode-btn" :class="{ active: uiState.tabMode==='3col' }" @click="handleBtnAction('tab-mode', '3col')" title="3열로 보기">
            3▭
          </button>
          <button class="tab-mode-btn" :class="{ active: uiState.tabMode==='4col' }" @click="handleBtnAction('tab-mode', '4col')" title="4열로 보기">
            4▭
          </button>
        </div>
      </div>
      <div style="font-size:12px;color:#aaa;margin:8px 0 4px;padding:0 2px">
        ≡ 드래그로 순서 변경 · 저장 후 반영됩니다.
      </div>
      <!-- ===== ■.■.■.■. TABLE 뷰 (tab / 1col) ============================== -->
      <bo-grid v-if="uiState.tabMode==='tab'||uiState.tabMode==='1col'"
          bare :columns="cfCatProdGridColumns" :rows="categoryProds" row-key="_id"
          draggable row-actions :row-style="fnCatProdRowStyle"
          :empty-text="searchParam.prodNm ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다. [+ 상품추가] 버튼으로 추가하세요.'"
          @reorder="handleSelectAction('categoryProds-rowDrop')">
        <template #cell-_prodNm="{ row }">
          <td>
            <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
              <span v-if="row._isNew" class="badge badge-green" style="font-size:10px">
                NEW
              </span>
              <span style="font-weight:500">
                {{ getProdNm(row.prodId) }}
              </span>
            </div>
            <div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:4px">
              <button v-for="opt in EMPHASIS_OPTS" :key="(opt && opt.cd)" @click="handleSelectAction('categoryProds-rowEmphasisToggle', { row, cd: opt.cd })" style="padding:1px 5px;border-radius:4px;font-size:10px;cursor:pointer;border:1px solid;line-height:1.5" :style="hasEmphasis(row.emphasisCd, opt.cd) ? 'background:#fce4ec;border-color:#e8587a;color:#e8587a;font-weight:700' : 'background:#f5f5f5;border-color:#ddd;color:#bbb'">
              {{ opt.icon }} {{ opt.nm }}
            </button>
          </div>
        </td>
      </template>
      <template #cell-_dispPeriod="{ row }">
        <td>
          <div style="display:flex;align-items:center;gap:2px;justify-content:center">
            <input type="date" class="form-control" v-model="row.dispStartDate"
                  style="width:100px;padding:2px 4px;font-size:11px;text-align:center" />
            <span style="color:#aaa;font-size:11px;flex-shrink:0">
              ~
            </span>
            <input type="date" class="form-control" v-model="row.dispEndDate"
                  style="width:100px;padding:2px 4px;font-size:11px;text-align:center" />
          </div>
        </td>
      </template>
      <template #row-actions="{ row }">
        <td style="text-align:center">
          <button class="btn btn-danger btn-xs" @click="handleSelectAction('categoryProds-rowRemove', row)">
            ✕
          </button>
        </td>
      </template>
    </bo-grid>
    <!-- ===== ■.■.■.■. CARD GRID 뷰 (2col / 3col / 4col) ================== -->
    <div v-else
          :style="{
          display:'grid',
          gridTemplateColumns: uiState.tabMode==='2col' ? 'repeat(2,1fr)' : uiState.tabMode==='3col' ? 'repeat(3,1fr)' : 'repeat(4,1fr)',
          gap:'10px',
          }">
      <div v-for="(row, idx) in categoryProds" :key="(row && row._id)" draggable="true" @dragstart="handleSelectAction('categoryProds-rowDragStart', idx)" @dragover.prevent="handleSelectAction('categoryProds-rowDragOver', idx)" @drop="handleSelectAction('categoryProds-rowDrop')" style="border:1px solid #eee;border-radius:10px;padding:10px;background:#fff" :style="dragoverIdx===idx ? 'border-color:#1677ff;box-shadow:0 0 0 2px #bfdbfe' : row._isNew ? 'border-color:#52c41a' : (uiState.activeTypeCd!=='NORMAL' && row.dispYn==='N') ? 'opacity:0.6' : ''">
      <!-- ===== ■.■.■.■.■.■. 카드 헤더 ========================================= -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:5px">
          <span style="cursor:grab;color:#bbb;font-size:15px;user-select:none">
            ≡
          </span>
          <span style="font-size:10px;color:#aaa">
            #{{ idx+1 }}
          </span>
          <span v-if="row._isNew" class="badge badge-green" style="font-size:10px">
            NEW
          </span>
        </div>
        <button class="btn btn-danger btn-xs" @click="handleSelectAction('categoryProds-rowRemove', row)">
          ✕
        </button>
      </div>
      <!-- ===== ■.■.■.■.■.■. 상품명 =========================================== -->
      <div style="font-weight:600;font-size:13px;margin-bottom:3px;line-height:1.4;word-break:keep-all">
        {{ getProdNm(row.prodId) }}
      </div>
      <!-- ===== ■.■.■.■.■.■. 카테고리경로 ======================================== -->
      <div style="font-size:10px;color:#888;margin-bottom:6px;background:#f5f5f5;border-radius:4px;padding:2px 6px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        {{ getCatPath(row.categoryId) }}
      </div>
      <!-- ===== ■.■.■.■.■.■. 가격/재고/상태 ====================================== -->
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap">
        <span style="font-size:12px;font-weight:700;color:#e8587a">
          {{ ((getProd(row.prodId)?.salePrice||0)).toLocaleString() }}원
        </span>
        <span style="font-size:10px;color:#999">
          재고 {{ ((getProd(row.prodId) || {}).prodStock != null ? (getProd(row.prodId) || {}).prodStock : '-') }}
        </span>
        <span :class="['badge',
                getProd(row.prodId)?.prodStatusCdNm==='판매중' ? 'badge-green' :
                getProd(row.prodId)?.prodStatusCdNm==='품절'   ? 'badge-red'   : 'badge-gray']"
                style="font-size:10px">
          {{ getProd(row.prodId)?.prodStatusCdNm || '-' }}
        </span>
      </div>
      <!-- ===== ■.■.■.■.■.■. 강조옵션 chips ==================================== -->
      <div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:7px">
        <button v-for="opt in EMPHASIS_OPTS" :key="(opt && opt.cd)" @click="handleSelectAction('categoryProds-rowEmphasisToggle', { row, cd: opt.cd })" style="padding:1px 5px;border-radius:4px;font-size:10px;cursor:pointer;border:1px solid;line-height:1.5" :style="hasEmphasis(row.emphasisCd, opt.cd) ? 'background:#fce4ec;border-color:#e8587a;color:#e8587a;font-weight:700' : 'background:#f5f5f5;border-color:#ddd;color:#bbb'">
        {{ opt.icon }} {{ opt.nm }}
      </button>
    </div>
    <!-- ===== ■.■.■.■.■.■. 전시기간 (NORMAL 제외) ============================== -->
    <template v-if="uiState.activeTypeCd!=='NORMAL'">
      <div style="display:flex;align-items:center;gap:2px;margin-bottom:4px">
        <input type="date" class="form-control" v-model="row.dispStartDate"
                  style="flex:1;padding:2px 4px;font-size:10px;min-width:0" />
        <span style="color:#aaa;font-size:10px;flex-shrink:0">
          ~
        </span>
        <input type="date" class="form-control" v-model="row.dispEndDate"
                  style="flex:1;padding:2px 4px;font-size:10px;min-width:0" />
      </div>
      <!-- ===== ■.■.■.■.■.■.■. 전시여부 ======================================== -->
      <select class="form-control" v-model="row.dispYn"
                style="width:100%;padding:2px 6px;font-size:11px"
                :style="row.dispYn==='Y' ? 'color:#16a34a;font-weight:600' : 'color:#9ca3af'">
        <option v-for="c in codes.disp_yn_opts" :key="c.codeValue" :value="c.codeValue">
          {{ c.codeLabel }}
        </option>
      </select>
    </template>
  </div>
  <div v-if="!categoryProds.length"
            style="grid-column:1/-1;text-align:center;padding:40px;color:#aaa;border:1px dashed #eee;border-radius:8px">
    등록된 상품이 없습니다. [+ 상품추가] 버튼으로 추가하세요.
  </div>
</div>
</template>
</div>
</div>
<!-- ===== □.□. 우측 상품 목록 ============================================== -->
<!-- ===== □. 좌 트리 + 우 상품목록 =========================================== -->
<!-- ===== ■. 상품 추가 피커 모달 ============================================= -->
<teleport to="body">
  <div v-if="pickerOpen"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
      @click.self="handleBtnAction('prodPickModal-close')">
    <div style="background:#fff;border-radius:14px;padding:24px;width:620px;max-height:72vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,0.22)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div>
          <strong style="font-size:15px">
            상품 추가
          </strong>
          <span style="font-size:12px;color:#aaa;margin-left:8px">
            → {{ cfSelectedCat?.categoryNm }} / {{ window.safeArrayUtils.safeFind(TYPE_TABS, t=>t.cd===uiState.activeTypeCd)?.nm }}
          </span>
        </div>
        <button class="btn btn-secondary btn-xs" @click="handleBtnAction('prodPickModal-close')">
          닫기
        </button>
      </div>
      <bo-multi-check-select
          v-model="pickerSearchType"
          :options="[
          { value: 'prodNm', label: '상품명' },
          { value: 'prodId', label: 'ID' },
          ]"
          placeholder="검색대상 전체"
          all-label="전체 선택"
          min-width="100%" />
      <div style="display:flex;gap:6px;margin:8px 0 12px 0;">
        <input class="form-control" v-model="pickerSearch"
            placeholder="검색어 입력 후 Enter" style="flex:1;margin:0;"
            @keyup.enter="handleBtnAction('prodPickModal-search')">
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('prodPickModal-search')">
          조회
        </button>
      </div>
      <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
        <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
        <bo-grid bare :columns="catProdPickerGridColumns" :rows="pickerResults" row-key="prodId"
            empty-text="검색 결과가 없습니다." row-actions>
          <template #row-actions="{ row }">
            <button class="btn btn-blue btn-xs" @click="handleSelectAction('prodPickModal-add', row)">
              추가
            </button>
          </template>
        </bo-grid>
      </div>
    </div>
  </div>
</teleport>
</div>
<!-- ===== □. 상품 추가 피커 모달 ============================================= -->
`
};
