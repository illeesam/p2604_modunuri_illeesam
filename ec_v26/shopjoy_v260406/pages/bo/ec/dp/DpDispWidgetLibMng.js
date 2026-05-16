/* ShopJoy Admin - 위젯라이브러리 목록 */
window.DpDispWidgetLibMng = {
  name: 'DpDispWidgetLibMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const widgetLibs = reactive([]);
    const uiState = reactive({ loading: false, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ disp_widget_types: [], active_statuses: [] });

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_widget_types = codeStore.sgGetGrpCodes('DISP_WIDGET_TYPE');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // 코드 주입

    /* -- 검색 -- */
    const _initSearchParam = () => ({ searchType: '', searchValue: '', type: '', status: '' });
    const searchParam = reactive(_initSearchParam());
    /* applied: 현재 결과에 실제로 반영된 검색 조건. searchParam 과 다르면 [조회] 버튼 강조 */
    const applied = reactive({ type: '', status: '' });
    const cfFilterDirty = computed(() =>
      searchParam.searchValue !== applied.searchValue ||
      searchParam.type !== applied.type ||
      searchParam.status !== applied.status
    );

    const SORT_MAP = { nm: { asc: 'widgetNm asc', desc: 'widgetNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const { type, status, searchType, searchValue, ...restParam } = searchParam;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...Object.fromEntries(Object.entries(restParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(searchValue ? { searchValue: searchValue.trim() } : {}),
          ...(searchType ? { searchType }                     : {}),
          ...(type   ? { typeCd: type }  : {}),  /* mapper 는 typeCd 파라미터를 받음 */
          ...(status ? { useYn: status } : {}),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'widgetNm,widgetLibDesc,tag';
        }
        const res = await boApiSvc.dpWidgetLib.getPage(params, '전시위젯라이브러리', '조회');
        const d = res.data?.data;
        widgetLibs.splice(0, widgetLibs.length, ...(d?.pageList || d?.list || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage  = d?.pageTotalPage  || 1;
        fnBuildPagerNums();
        /* 결과에 반영된 조건 기록 */
        applied.searchValue     = searchParam.searchValue;
        applied.type   = searchParam.type;
        applied.status = searchParam.status;
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    /* pathLabel */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));


    const WIDGET_ICONS = {
      'image_banner':'🖼', 'product_slider':'🛒', 'product':'📦',
      'cond_product':'🔍', 'chart_bar':'📊',      'chart_line':'📈',
      'chart_pie':'🥧',   'text_banner':'📝',     'info_card':'ℹ️',
      'popup':'💬',        'file':'📎',            'file_list':'📁',
      'coupon':'🎟',       'html_editor':'📄',     'event_banner':'🎉',
      'cache_banner':'💰', 'widget_embed':'🧩',    'textarea':'📋',
      'markdown':'📑',       'barcode':'🔖',           'qrcode':'📱',
      'barcode_qrcode':'🔖', 'video_player':'▶️',      'countdown':'⏱',
      'payment_widget':'💳', 'approval_widget':'✅',   'map_widget':'🗺',
    };

    /* wTypeLabel */
    const wTypeLabel = (v) => window.safeArrayUtils.safeFind(codes.disp_widget_types, t => t.codeValue === v)?.codeLabel || v;

    /* wIcon */
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 목록조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* onReset */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      handleSearchList('DEFAULT');
    };

    /* -- 표시경로 트리 -- */
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* -- 하단 인라인 Dtl --
     * 정책: 행상세/행수정 클릭 시 항상 상세 API 재조회. 같은 id 재클릭이어도 닫지 않고 reloadTrigger 만 ++ */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* openNew */
    const openNew     = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispWidgetLibMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    /* key 는 'open' / 'closed' 두 값만 — id 가 바뀌어도 컴포넌트 remount 안 함 */
    const cfDetailKey = computed(() => uiStateDetail.selectedId === null ? 'closed' : 'open');

    /* setPage */
    const setPage = (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList(); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    /* fnStatusCls */
    const fnStatusCls   = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnStatusLabel */
    const fnStatusLabel = (v) => v === 'Y' ? '활성' : '비활성';

    /* 삭제 */
    const handleDelete = async (lib) => {
      const ok = await showConfirm('삭제', `[${lib.widgetNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = widgetLibs.findIndex(x => x.widgetLibId === lib.widgetLibId);
      if (idx !== -1) widgetLibs.splice(idx, 1);
      if (uiStateDetail.selectedId === lib.widgetLibId) { uiStateDetail.selectedId = null; }
      try {
        const res = await boApiSvc.dpWidgetLib.remove(lib.widgetLibId, '전시위젯라이브러리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        if (showToast) showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    // -- return ---------------------------------------------------------------

    return { widgetLibs, uiState, codes, searchParam, applied, cfFilterDirty, pager,
      onSearch, onReset, setPage, onSizeChange,
      selectNode,
      fnBuildPagerNums,
      wIcon, wTypeLabel,
      uiStateDetail, cfDetailEditId, cfDetailKey, handleLoadDetail, openNew, closeDetail, inlineNavigate,
      handleDelete, fnStatusCls, fnStatusLabel, onSort, sortIcon };
  },
  template: /* html */`
<div>
  <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}</style>
  <div class="page-title">위젯라이브러리관리</div>
  <div class="card">
    <div class="search-bar">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'widgetNm',   label: '이름' },
          { value: 'widgetLibDesc', label: '설명' },
          { value: 'tag',  label: '태그' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <select v-model="searchParam.type">
        <option value="">타입 전체</option>
        <option v-for="t in codes.disp_widget_types" :key="t.codeValue" :value="t.codeValue">{{ t.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <div class="search-actions" style="display:flex;align-items:center;gap:6px;">
        <span v-if="cfFilterDirty" style="font-size:11px;color:#e8587a;font-weight:600;animation:pulse 1.2s ease-in-out infinite;">변경됨 →</span>
        <button class="btn btn-primary" @click="onSearch"
          :style="cfFilterDirty ? 'box-shadow:0 0 0 3px rgba(232,88,122,0.35);animation:pulse 1.2s ease-in-out infinite;' : ''">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:minmax(180px,22fr) 78fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;min-width:180px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#ec_disp_widget_lib</span></span>
        <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-path-tree biz-cd="ec_disp_widget_lib" :selected="uiState.selectedPath" @select="selectNode" />
      </div>
    </div>
    <div>
      <div class="card">
        <div class="toolbar" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="list-title">위젯라이브러리 <span class="list-count">{{ pager.pageTotalCount }}건</span><span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">#{{ uiState.selectedPath }}</span></span>
          <!-- -- 적용 중인 필터 표시 ------------------------------------------- -->
          <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;font-size:11px;">
            <span v-if="!applied.searchValue && !applied.type && !applied.status" style="color:#999;">필터 없음</span>
            <span v-if="applied.searchValue" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:10px;padding:1px 8px;">검색: {{ applied.searchValue }}</span>
            <span v-if="applied.type" style="background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:10px;padding:1px 8px;">유형: {{ wTypeLabel(applied.type) }}</span>
            <span v-if="applied.status" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;border-radius:10px;padding:1px 8px;">상태: {{ applied.status === 'Y' ? '활성' : '비활성' }}</span>
          </div>
          <button class="btn btn-primary btn-sm" style="margin-left:auto;" @click="openNew">+ 신규</button>
        </div>
        <table class="bo-table">
          <thead><tr><th style="width:36px;text-align:center;">번호</th><th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">이름 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th><th>타입</th><th>상태</th><th style="text-align:right">관리</th></tr></thead>
          <tbody>
            <tr v-if="widgetLibs.length===0"><td colspan="5" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-else v-for="(lib, idx) in widgetLibs" :key="lib.widgetLibId">
              <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
              <td><span class="title-link" @click="handleLoadDetail(lib.widgetLibId)">{{ wIcon(lib.widgetTypeCd) }} {{ lib.widgetNm }}</span></td>
              <td><span class="tag">{{ wTypeLabel(lib.widgetTypeCd) }}</span></td>
              <td><span class="badge" :class="fnStatusCls(lib.useYn)">{{ fnStatusLabel(lib.useYn) }}</span></td>
              <td><div class="actions">
                <button class="btn btn-blue btn-sm" @click="handleLoadDetail(lib.widgetLibId)">수정</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(lib)">삭제</button>
              </div></td>
            </tr>
          </tbody>
        </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
      </div>
    </div>
  </div>
  <div v-if="uiStateDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <dp-disp-widget-lib-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchList"
    />
  </div>
</div>
`
};
