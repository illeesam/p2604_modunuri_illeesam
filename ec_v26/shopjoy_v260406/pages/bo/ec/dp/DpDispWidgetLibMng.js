/* ShopJoy Admin - 위젯라이브러리 목록 */
window.DpDispWidgetLibMng = {
  name: 'DpDispWidgetLibMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const widgetLibs = reactive([]);
    const widgetLibCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState = reactive({ loading: false, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ disp_widget_types: [], active_statuses: [] });

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispWidgetLibMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
        pager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('DEFAULT');
      // 위젯Lib 신규 등록 (인라인 패널)
      } else if (cmd === 'widgetLibs-add') {
        return openNew();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 좌측 표시경로 트리 전체 보기
      } else if (cmd === 'pathTree-all') {
        uiState.selectedPath = null;
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'widgetLibs-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'widgetLibs-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispWidgetLibMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'widgetLibs-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 클릭 → 편집 패널 열기
      } else if (cmd === 'widgetLibs-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'widgetLibs-rowDelete') {
        return handleDelete(param);
      // 좌측 표시경로 트리 노드 선택
      } else if (cmd === 'pathTree-select') {
        return selectNode(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

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

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 (항상 표시, 진입 시 빈 신규 폼) ===== */
    const detailPanel = reactive({
      selectedId: '__new__',   // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      openMode: 'edit',
      reloadTrigger: 0,
      resetSeq: 0,             // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,           // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_widget_types = codeStore.sgGetGrpCodes('DISP_WIDGET_TYPE');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* getSortParam — 조회 */
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

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';
    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.dpWidgetLib.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(widgetLibCounts).forEach(k => { delete widgetLibCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) widgetLibCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };


    /* handleSearchList — 목록 조회 */
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
        /* 좌 트리 카운트 동기 갱신 */
        handleLoadPathTreeNodeCounts();
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* pathLabel — 경로 라벨 */
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

    /* wTypeLabel — w 유형 라벨 */
    const wTypeLabel = (v) => window.safeArrayUtils.safeFind(codes.disp_widget_types, t => t.codeValue === v)?.codeLabel || v;

    /* wIcon — w 아이콘 */
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';

    /* selectNode — 노드 선택 (트리 필터 변경 → 상세영역은 빈 신규 폼으로 초기화) */
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; resetDetailToNew(); handleSearchList('DEFAULT'); };

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 (행 선택 → 활성화 + 저장/취소 노출) */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew     = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispWidgetLibMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      /* 취소/닫기: 패널은 그대로 두고 상세영역만 빈 신규 폼으로 초기화 */
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    /* key 에 resetSeq 포함 → 취소 시 remount 로 폼 초기화 */
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    /* setPage — 설정 */
    const setPage = (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    /* fnStatusCls — 유틸 */
    const fnStatusCls   = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnStatusLabel — 유틸 */
    const fnStatusLabel = (v) => v === 'Y' ? '활성' : '비활성';

    /* 적용 필터 없음 여부 (template 속성값 && 금지 회피용) */
    const cfNoFilter = computed(() => !applied.searchValue && !applied.type && !applied.status);

    /* handleDelete — 삭제 */
    const handleDelete = async (lib) => {
      const ok = await showConfirm('삭제', `[${lib.widgetNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = widgetLibs.findIndex(x => x.widgetLibId === lib.widgetLibId);
      if (idx !== -1) { widgetLibs.splice(idx, 1); }
      if (detailPanel.selectedId === lib.widgetLibId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.dpWidgetLib.remove(lib.widgetLibId, '전시위젯라이브러리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0); }
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* 검색바 :columns 자동 렌더 정의 */
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'widgetNm',      label: '이름' },
          { value: 'widgetLibDesc', label: '설명' },
          { value: 'tag',           label: '태그' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type',   type: 'select', label: '유형', options: () => codes.disp_widget_types, nullLabel: '타입 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.active_statuses,   nullLabel: '상태 전체' },
    ];

    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'nm' 와 sortKey 일치) */
    columns.listGrid = [
      { key: 'widgetNm',    label: '이름', sortKey: 'nm', cellInnerClass: 'title-link',
        fmt: (v, row) => `${wIcon(row.widgetTypeCd)} ${row.widgetNm || ''}` },
      { key: 'widgetTypeCd', label: '타입',
        fmt: v => wTypeLabel(v) },
      { key: 'useYn',        label: '상태',
        badge: row => fnStatusCls(row.useYn),
        fmt:   v   => fnStatusLabel(v) },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      widgetLibs, uiState, widgetLibCounts, codes, searchParam, applied, pager, detailPanel,           // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
      cfFilterDirty, cfDetailEditId, cfDetailKey, cfNoFilter,                          // computed
      pathLabel, wIcon, wTypeLabel, sortIcon, fnStatusCls, fnStatusLabel,              // 헬퍼
      inlineNavigate,                                                                   // Dtl 콜백 (closure 필요)
      showToast, showConfirm, showRefModal, setApiRes, handleSearchList,               // Dtl 콜백
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 영역 ====================================================== -->
  <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}</style>
    <!-- ===== ■. 페이지 타이틀 ================================================= -->
    <div class="page-title">
      위젯라이브러리관리
    </div>
    <!-- ===== ■. 카드 영역 =================================================== -->
    <div class="card">
      <!-- ===== ■.■. 검색 영역 ================================================= -->
      <bo-search-area :loading="uiState.loading" :show-actions="false"
      :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
        <div class="search-actions" style="display:flex;align-items:center;gap:6px;">
          <span v-if="cfFilterDirty" style="font-size:11px;color:#e8587a;font-weight:600;animation:pulse 1.2s ease-in-out infinite;">
            변경됨 →
          </span>
          <button class="btn btn-primary btn-sm" @click="handleBtnAction('searchParam-list')"
          :style="cfFilterDirty ? 'box-shadow:0 0 0 3px rgba(232,88,122,0.35);animation:pulse 1.2s ease-in-out infinite;' : ''">
            조회
          </button>
          <button class="btn btn-secondary btn-sm" @click="handleBtnAction('searchParam-reset')">
            초기화
          </button>
        </div>
      </bo-search-area>
    </div>
    <!-- ===== □.□. 검색 영역 ================================================= -->
    <!-- ===== □. 카드 영역 =================================================== -->
    <!-- ===== ■. 본문 영역 =================================================== -->
    <div style="display:grid;grid-template-columns:minmax(180px,22fr) 78fr;gap:16px;align-items:flex-start;">
      <div class="card" style="padding:12px;min-width:180px;">
        <div class="toolbar" style="margin-bottom:6px;">
          <span class="list-title" style="font-size:13px;">
            📂 표시경로
            <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">
              #ec_disp_widget_lib
            </span>
          </span>
          <span v-if="uiState.selectedPath != null" @click="handleBtnAction('pathTree-all')" style="font-size:11px;color:#1677ff;cursor:pointer;">
            전체보기
          </span>
        </div>
        <div style="max-height:65vh;overflow:auto;">
          <bo-path-tree biz-cd="ec_disp_widget_lib" :counts="widgetLibCounts" :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
        </div>
      </div>
      <div>
        <!-- ===== ■.■.■. 목록 영역 =============================================== -->
        <bo-grid :columns="columns.listGrid" :rows="widgetLibs" row-key="widgetLibId" :pager="pager"
        :sort-state="uiState" list-title="위젯라이브러리"
        :count-text="pager.pageTotalCount + '건'"
        empty-text="데이터가 없습니다." row-clickable
        @sort="key => handleBtnAction('widgetLibs-sort', key)"
        @row-click="(r) => handleSelectAction('widgetLibs-rowEdit', r.widgetLibId)" row-actions>
          <template #toolbar-actions>
            <span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;font-size:12px;align-self:center;">
              #{{ uiState.selectedPath }}
            </span>
            <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;font-size:11px;">
              <span v-if="cfNoFilter" style="color:#999;">
                필터 없음
              </span>
              <span v-if="applied.searchValue" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:10px;padding:1px 8px;">
                검색: {{ applied.searchValue }}
              </span>
              <span v-if="applied.type" style="background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:10px;padding:1px 8px;">
                유형: {{ wTypeLabel(applied.type) }}
              </span>
              <span v-if="applied.status" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;border-radius:10px;padding:1px 8px;">
                상태: {{ applied.status === 'Y' ? '활성' : '비활성' }}
              </span>
            </div>
            <button class="btn btn-primary btn-sm" @click="handleBtnAction('widgetLibs-add')">
              + 신규
            </button>
          </template>
          <template #row-actions="{ row }">
            <div class="actions">
              <button class="btn btn-blue btn-xs" @click="handleSelectAction('widgetLibs-rowEdit', row.widgetLibId)">
                수정
              </button>
              <button class="btn btn-danger btn-xs" @click="handleSelectAction('widgetLibs-rowDelete', row)">
                삭제
              </button>
            </div>
          </template>
        </bo-grid>
        <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('widgetLibs-pager-setPage', n)" :on-size-change="() => handleSelectAction('widgetLibs-pager-sizeChange')" />
      </div>
    </div>
    <!-- ===== □. 본문 영역 =================================================== -->
    <!-- ===== ■. 상세 패널 (인라인 임베드 — 항상 표시) ========================================= -->
    <div style="margin-top:16px;">
      <div v-if="detailPanel.active" style="display:flex;justify-content:flex-end;padding:10px 0 0;">
        <button data-hide-close style="display:none;" class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
          ✕ 닫기
        </button>
      </div>
      <dp-disp-widget-lib-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :active="detailPanel.active"
      :reload-trigger="detailPanel.reloadTrigger"
      :on-list-reload="handleSearchList"
      />
    </div>
  </div>
  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
`
};
