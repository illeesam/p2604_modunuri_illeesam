/* ShopJoy Admin - 전시위젯 목록 (UI용 배치 위젯) */
window.DpDispWidgetMng = {
  name: 'DpDispWidgetMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const codes = reactive({ disp_widget_types: [], active_statuses: [] });
    const widgetCounts = reactive({});
    const uiState = reactive({ loading: false, isPageCodeLoad: false, selectedType: null, sortKey: '', sortDir: 'asc' });
    const widgets = reactive([]);

    /* 위젯유형 → 카테고리 매핑 (좌측 트리용 — 서브카테고리당 유형 1:1 유지해야 필터 정확) */
    const WIDGET_TYPE_CATEGORY = {
      'image_banner':     'Image > Banner',
      'popup':            'Image > Popup',
      'product_slider':   'Product > Slider',
      'product':          'Product > Grid',
      'cond_product':     'Product > CondGrid',
      'chart_bar':        'Etc > Chart',
      'chart_line':       'Etc > Chart',
      'chart_pie':        'Etc > Chart',
      'text_banner':      'Text > RichText',
      'html_editor':      'Text > RichText',
      'textarea':         'Text > Title',
      'markdown':         'Text > Markdown',
      'info_card':        'Etc > InfoCard',
      'file':             'Etc > File',
      'file_list':        'Etc > FileList',
      'barcode':          'Etc > Code',
      'qrcode':           'Etc > Code',
      'barcode_qrcode':   'Etc > Code',
      'video_player':     'Etc > Video',
      'payment_widget':   'Etc > Widget',
      'approval_widget':  'Etc > Widget',
      'widget_embed':     'Etc > Widget',
      'map_widget':       'Etc > Map',
      'coupon':           'Promo > Coupon',
      'cache_banner':     'Promo > Cache',
      'countdown':        'Promo > Countdown',
      'event_banner':     'Promo > EventBanner',
    };

    /* allTypeCounts — 전체 위젯유형별 카운트 (최초 전체 조회 시 1회 저장, 필터 후에도 고정) */
    const allTypeCounts = reactive({});   // { image_banner: 10, product: 5, ... }
    const allTotalCount = ref(0);

    /* cfWidgetTree — allTypeCounts 기반 트리 (필터와 무관하게 고정) */
    const cfWidgetTree = computed(() => {
      const map = {};
      for (const [typeCd, cnt] of Object.entries(allTypeCounts)) {
        if (!cnt) continue;
        const catPath = WIDGET_TYPE_CATEGORY[typeCd] || ('Etc > ' + typeCd);
        const parts = catPath.split('>').map(s => s.trim());
        const top = parts[0] || 'Etc';
        const sub = parts[1] || '기타';
        if (!map[top]) { map[top] = {}; }
        if (!map[top][sub]) { map[top][sub] = { types: [], count: 0 }; }
        if (!map[top][sub].types.includes(typeCd)) { map[top][sub].types.push(typeCd); }
        map[top][sub].count += cnt;
      }
      return Object.keys(map).sort().map(top => ({
        label: top,
        count: Object.values(map[top]).reduce((s, n) => s + n.count, 0),
        children: Object.keys(map[top]).sort().map(sub => ({
          label: sub,
          types: map[top][sub].types,
          count: map[top][sub].count,
        })),
      }));
    });
    const openTopNodes = reactive(new Set(['Image', 'Product', 'Text', 'Promo', 'Etc']));

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispWidgetMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        listGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        uiState.selectedType = null;
        listGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchData('DEFAULT');
      // 위젯 신규 등록 (인라인 패널)
      } else if (cmd === 'widgets-add') {
        return openNew();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 좌측 위젯유형 트리 전체 보기
      } else if (cmd === 'pathTree-all') {
        uiState.selectedType = null;
        searchParam.type = '';
        listGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'widgets-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'widgets-pager-setPage') {
        return setPage(param);
      } else if (cmd === 'treeNode-toggle') {
        openTopNodes.has(param) ? openTopNodes.delete(param) : openTopNodes.add(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispWidgetMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'widgets-pager-sizeChange') {
        return onSizeChange();
      // 좌측 위젯유형 트리 노드 선택
      } else if (cmd === 'pathTree-select') {
        return selectNode(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 로 컬럼별 분기 가능 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ DpDispWidgetMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'widgets-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [미리보기]/[수정]/[삭제] 등
        if (colKey === 'btn_row_edit')    { return handleLoadDetail(row.widgetId); }
        if (colKey === 'btn_row_delete')  { return handleDelete(row); }
        if (colKey === 'btn_row_preview') { return handleOpenPreview('widget', row.widgetId); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__', 'widgetInfo'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.widgetId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ searchType: '', searchValue: '', type: '', status: '' });
    const searchParam = reactive(_initSearchParam());
    /* applied: 결과에 실제 반영된 검색 조건. searchParam 과 다르면 [조회] 버튼 강조 */
    const applied = reactive({ type: '', status: '' });
    const cfFilterDirty = computed(() =>
      searchParam.searchValue !== applied.searchValue ||
      searchParam.type !== applied.type ||
      searchParam.status !== applied.status
    );

    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    const listGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 (항상 표시. 진입 시 빈 신규 폼) ===== */
    const detailPanel = reactive({
      selectedId: '__new__',  // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      openMode: 'edit',
      reloadTrigger: 0,
      resetSeq: 0,            // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,          // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_widget_types = codeStore.sgGetGrpCodes('DISP_WIDGET_TYPE');
      /* 상태 = use_yn(Y/N) — 검색 시 useYn 파라미터로 전달 (구 ACTIVE_STATUS '활성' 값은 백엔드 Y/N 비교와 불일치) */
      codes.active_statuses = [{ codeValue: 'Y', codeLabel: '활성' }, { codeValue: 'N', codeLabel: '비활성' }];
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
      listGridPager.pageNo = 1;
      handleSearchData('DEFAULT');
    };



    /* fnLoadAllTypeCounts — 필터 없이 전체 위젯유형별 카운트 1회 로드 (트리 고정용) */
    const fnLoadAllTypeCounts = async () => {
      try {
        const res = await boApiSvc.dpWidget.getPage({ pageNo: 1, pageSize: 10000 }, '전시위젯관리', '전체카운트');
        const rows = res.data?.data?.pageList || res.data?.data?.list || [];
        Object.keys(allTypeCounts).forEach(k => { delete allTypeCounts[k]; });
        for (const w of rows) {
          if (w.widgetTypeCd) {
            allTypeCounts[w.widgetTypeCd] = (allTypeCounts[w.widgetTypeCd] || 0) + 1;
          }
        }
        allTotalCount.value = rows.length;
      } catch (e) { console.error('[fnLoadAllTypeCounts]', e); }
    };

    /* handleSearchData — 처리 */
    const handleSearchData = async () => {
      uiState.loading = true;
      try {
        const { type, status, searchType, searchValue } = searchParam;
        /* dp_widget (실제 배치된 위젯 인스턴스) — 메인 데이터 */
        const widgetParams = {
          pageNo: listGridPager.pageNo, pageSize: listGridPager.pageSize,
          ...getSortParam(),
          ...(searchValue ? { searchValue: searchValue.trim() } : {}),
          ...(searchType ? { searchType }                     : {}),
          ...(type   ? { widgetTypeCd: type } : {}),  /* 백엔드 DpWidgetDto.Request.widgetTypeCd */
          ...(status ? { useYn: status }       : {}),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (widgetParams.searchValue && !widgetParams.searchType) {
          widgetParams.searchType = 'widgetNm,widgetDesc,tag';
        }
        const res = await boApiSvc.dpWidget.getPage(widgetParams, '전시위젯관리', '조회');
        const dW = res.data?.data;
        let rows = dW?.pageList || dW?.list || [];
        /* 복수 유형 선택(chart류) — 서버가 단일 type만 지원하므로 클라이언트 후필터 */
        const selTypes = uiState.selectedType;
        if (Array.isArray(selTypes) && selTypes.length > 1 && !searchParam.type) {
          rows = rows.filter(w => selTypes.includes(w.widgetTypeCd));
        }
        widgets.splice(0, widgets.length, ...rows);
        listGridPager.pageTotalCount = dW?.pageTotalCount || 0;
        listGridPager.pageTotalPage  = dW?.pageTotalPage  || 1;
        coUtil.cofBuildPagerNums(listGridPager);
        /* 결과에 반영된 조건 기록 */
        applied.searchValue = searchParam.searchValue;
        applied.type        = searchParam.type;
        applied.status      = searchParam.status;
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
      if (isAppReady.value) { fnLoadCodes(); }
      fnLoadAllTypeCounts();   // 트리 카운트: 필터 무관 전체 1회 로드
      handleSearchData('DEFAULT');
    });



    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

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
    const wTypeLabel = (v) => codes.disp_widget_types.find(t => t.codeValue === v)?.codeLabel || v;

    /* wIcon — w 아이콘 */
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* loadView — 보기모드 진입 (그리드 셀/제목 클릭 → 보기모드로 상세 열기) */
    const loadView = (id) => {
      detailPanel.selectedId = id;
      detailPanel.openMode = 'view';
      detailPanel.active = true;
      detailPanel.reloadTrigger++;
    };

    /* handleLoadDetail — 상세 조회 (행 선택 → 활성) */
    const handleLoadDetail = (id) => {
      detailPanel.selectedId = id;
      detailPanel.openMode = 'edit';
      detailPanel.active = true;     // 행 선택 → 저장/취소 노출
      detailPanel.reloadTrigger++;
    };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = true;     // 신규 입력 가능 → 저장/취소 노출
      detailPanel.resetSeq++;
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispWidgetMng') {
        /* 저장 완료 등: 영역은 유지하고 빈 신규 폼으로 초기화 */
        if (opts.reload) handleSearchData('RELOAD');
        resetDetailToNew();
        return;
      }
      /* 취소: 패널은 그대로 두고 상세영역만 빈 신규 폼으로 초기화 */
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    /* key 에 resetSeq 포함 — 취소/닫기 시 ++ 하면 remount 되어 폼 초기화. 그 외 id 변경은 props.dtlId / reloadTrigger watch 로 내용만 교체 */
    const cfDetailKey = computed(() => `open_${detailPanel.resetSeq}`);


    /* fnStatusCls — 유틸 */
    const fnStatusCls = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnStatusLabel — 유틸 */
    const fnStatusLabel = (v) => v === 'Y' ? '활성' : '비활성';

    /* fnDispEnv — ^PROD^DEV^ → "PROD, DEV" 포맷 */
    const fnDispEnv = (v) => {
      if (!v) return '-';
      return v.split('^').filter(s => s.trim()).join(', ') || v;
    };

    /* fnSubNodeStyle — 좌 트리 서브노드 스타일 (속성값 && 금지 우회) */
    const fnSubNodeStyle = (subTypes) => {
      const sel = uiState.selectedType;
      const isSelected = Array.isArray(sel) && sel.join(',') === (Array.isArray(subTypes) ? subTypes.join(',') : '');
      return 'display:flex;align-items:center;gap:6px;padding:3px 10px 3px 28px;cursor:pointer;border-radius:6px;font-size:12px;'
        + (isSelected ? 'background:#fff0f4;font-weight:700;color:#c0254b;' : 'color:#666;');
    };



    /* 적용 필터 없음 여부 (template 속성값 && 금지 회피용) */
    const cfNoFilter = computed(() => !applied.searchValue && !applied.type && !applied.status);

    /* fnRowStyle — 행 스타일 */
    const fnRowStyle = (row) => (detailPanel.selectedId === row.widgetId ? 'background:#fff8f8;' : '') + 'height:74px;';

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= listGridPager.pageTotalPage) { listGridPager.pageNo = n; handleSearchData(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { listGridPager.pageNo = 1; handleSearchData(); };

    /* handleOpenPreview — 미리보기 팝업 */
    const handleOpenPreview = (mode, id) => {
      window.open(window.pageUrl('bo-disp-ui.html') + '?mode=' + mode + '&id=' + id,
        '_blank', 'width=1440,height=900,scrollbars=yes,resizable=yes');
    };

    /* selectNode — 위젯유형 노드 선택 (types: 서브카테고리의 widgetTypeCd 배열) */
    const selectNode = (types) => {
      uiState.selectedType = types;
      /* 서버는 단일 widgetTypeCd만 지원 — 단일이면 서버 필터, 복수(chart류)면 서버 전체조회 후 클라이언트 후필터 */
      if (Array.isArray(types) && types.length === 1) {
        searchParam.type = types[0];
      } else {
        searchParam.type = '';          // 서버는 전체 조회 — handleSearchData에서 후필터
      }
      listGridPager.pageNo = 1;
      resetDetailToNew();
      handleSearchData();
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (d) => {
      const ok = await showConfirm('삭제', `[${d.widgetNm || d.widgetId}] 위젯을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.dpWidget.remove(d.widgetId, '전시위젯관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        if (detailPanel.selectedId === d.widgetId) { resetDetailToNew(); }
        handleSearchData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* 검색바 :columns 자동 렌더 정의 (전시패널관리 검색바와 동일 스타일) */
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'widgetNm',   label: '이름' },
          { value: 'widgetDesc', label: '설명' },
          { value: 'tag',        label: '태그' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '130px' },
      { key: 'searchValue', type: 'text',   label: '검색어',    placeholder: '검색어 입력', width: '200px' },
      { key: 'type',        type: 'select', label: '위젯 유형', options: () => codes.disp_widget_types, nullLabel: '전체' },
      { key: 'status',      type: 'select', label: '상태',      options: () => codes.active_statuses,   nullLabel: '전체' },
    ];

    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'reg' 와 sortKey 일치) */
    columns.listGrid = [
      { key: 'widgetId',   label: 'ID',       style: 'width:56px;', link: true,
        cellStyle: 'color:#aaa;font-size:11px;vertical-align:top;padding-top:12px;font-family:monospace;',
        fmt: (v) => v ? '#' + String(v).slice(-6) : '-' },
      { key: 'widgetInfo', label: '위젯 정보', sortKey: 'reg' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      widgets, uiState, widgetCounts, codes, searchParam, applied, listGridPager, detailPanel,
      cfWidgetTree, openTopNodes, allTotalCount,                                        // 위젯유형 트리
      handleBtnAction, handleSelectAction, handleGridCellAction,                      // dispatch (모든 이벤트 / 액션 라우팅)
      handleOpenPreview,                                                              // 미리보기
      cfFilterDirty, cfSiteNm, cfDetailEditId, cfDetailKey, cfNoFilter, // computed
      selectedId: computed(() => detailPanel.selectedId),                             // computed
      wTypeLabel, wIcon,                                             // 헬퍼
      fnStatusCls, fnStatusLabel, fnDispEnv, fnSubNodeStyle, fnRowStyle, // 헬퍼
      inlineNavigate,                                                                 // Dtl 콜백 (closure 필요)
    };
  },
  template: /* html */`
<bo-page>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <template #title>
    <span style="font-size:14px;font-weight:600;color:#333;">
      전시위젯관리
    </span>
    <span style="font-size:13px;font-weight:400;color:#999;margin:0 8px;">
      &gt;
    </span>
    <span style="font-size:14px;font-weight:600;color:#666;">
      전시위젯관리
    </span>
    <span style="font-size:13px;font-weight:400;color:#888;display:block;margin-top:4px;">
      위젯 유형별 리소스 등록·재활용
    </span>
  </template>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 검색 필터 (전시패널관리 검색바와 동일 — bo-search-area :columns) ====== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :show-actions="false"
      :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <div class="search-actions">
        <span v-if="cfFilterDirty" style="font-size:11px;color:#e8587a;font-weight:600;align-self:center;">
          변경됨 →
        </span>
        <button @click="handleBtnAction('searchParam-list')" class="btn btn_search"
          :style="cfFilterDirty ? 'box-shadow:0 0 0 3px rgba(232,88,122,0.35);' : ''">
          조회
        </button>
        <button @click="handleBtnAction('searchParam-reset')" class="btn btn_reset">
          초기화
        </button>
      </div>
    </bo-search-area>
  </bo-container>
  <!-- ===== □. 검색 필터 =================================================== -->
  <!-- ===== ■. 본문: 좌측 트리 + 우측 목록 ======================================= -->
  <div class="bo-2col">
    <!-- ===== ■.■. 좌측 위젯유형 트리 =========================================== -->
    <bo-container title="📂 위젯유형">
      <template #toolbar-actions>
        <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">
          #ec_disp_widget
        </span>
        <span v-if="uiState.selectedType != null" @click="handleBtnAction('pathTree-all')" style="font-size:11px;color:#1677ff;cursor:pointer;">
          전체보기
        </span>
      </template>
      <div style="max-height:65vh;overflow:auto;padding:6px 0;">
        <!-- 전체 항목 -->
        <div @click="handleBtnAction('pathTree-all')"
          :style="'display:flex;align-items:center;gap:6px;padding:4px 10px;cursor:pointer;border-radius:6px;'+(uiState.selectedType==null?'background:#fff0f4;font-weight:700;color:#c0254b;':'')"
        >
          <span style="font-size:13px;">📦</span>
          <span style="font-size:13px;">전체</span>
          <span style="margin-left:auto;font-size:11px;color:#aaa;">{{ allTotalCount }}</span>
        </div>
        <!-- 카테고리 트리 -->
        <div v-for="top in cfWidgetTree" :key="top.label" style="margin-top:2px;">
          <div @click="handleBtnAction('treeNode-toggle', top.label)"
            style="display:flex;align-items:center;gap:4px;padding:4px 10px;cursor:pointer;font-weight:600;font-size:13px;color:#555;user-select:none;">
            <span>{{ openTopNodes.has(top.label) ? '▼' : '▶' }}</span>
            <span>{{ top.label }}</span>
            <span style="margin-left:auto;font-size:11px;color:#aaa;">{{ top.count }}</span>
          </div>
          <div v-if="openTopNodes.has(top.label)">
            <div v-for="sub in top.children" :key="sub.label"
              @click="handleSelectAction('pathTree-select', sub.types)"
              :style="fnSubNodeStyle(sub.types)"
            >
              <span>{{ sub.label }}</span>
              <span style="margin-left:auto;font-size:11px;color:#aaa;">{{ sub.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </bo-container>
    <!-- ===== □.□. 좌측 위젯유형 트리 =========================================== -->
    <!-- ===== ■.■. 우측 목록 ================================================= -->
    <bo-container title="전시위젯" :count-text="listGridPager.pageTotalCount + '건'">
      <template #toolbar-actions>
        <span v-if="uiState.selectedType != null" style="color:#e8587a;font-family:monospace;font-size:12px;align-self:center;">
          {{ Array.isArray(uiState.selectedType) ? uiState.selectedType.join(', ') : uiState.selectedType }}
        </span>
        <span v-if="cfNoFilter" style="color:#bbb;font-size:11px;">필터 없음</span>
        <span v-if="applied.searchValue" style="font-size:11px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:10px;padding:1px 8px;">
          검색: {{ applied.searchValue }}
        </span>
        <span v-if="applied.type" style="font-size:11px;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:10px;padding:1px 8px;">
          유형: {{ wTypeLabel(applied.type) }}
        </span>
        <span v-if="applied.status" style="font-size:11px;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;border-radius:10px;padding:1px 8px;">
          상태: {{ applied.status === 'Y' ? '활성' : '비활성' }}
        </span>
        <button @click="handleBtnAction('widgets-add')" class="btn btn_new" style="margin-left:auto;height:30px;padding:0 14px;">
          + 신규등록
        </button>
      </template>
      <!-- ===== ■.■.■. 목록 ================================================== -->
      <bo-grid bare :columns="columns.listGrid" :rows="widgets" row-key="widgetId" :selected-key="detailPanel.selectedId" :pager="listGridPager"
        :sort-state="uiState" :row-style="fnRowStyle"
        empty-text="등록된 위젯이 없습니다."
        @sort="key => handleBtnAction('widgets-sort', key)"
        grid-id="widgets-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
        <template #cell-widgetInfo="{ row }">
          <td style="padding:10px 12px;vertical-align:top;">
            <div style="margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              <span style="font-size:15px;margin-right:4px;">
                {{ wIcon(row.widgetTypeCd) }}
              </span>
              <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">
                {{ wTypeLabel(row.widgetTypeCd) }}
              </span>
              <span class="title-link" @click="handleGridCellAction('widgets-cellClick', 'widgetInfo', row)"
                :style="'font-size:14px;font-weight:700;margin-left:8px;'+(selectedId===row.widgetId?'color:#e8587a;':'color:#222;')">
                {{ row.widgetNm }}
              </span>
              <span class="badge" :class="fnStatusCls(row.useYn)" style="font-size:11px;margin-left:8px;">
                {{ fnStatusLabel(row.useYn) }}
              </span>
            </div>
            <!-- ===== ■.■.■.■.■.■. 영역 ============================================ -->
            <div style="display:flex;flex-wrap:nowrap;gap:14px;font-size:11px;color:#555;line-height:1.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              <span style="flex-shrink:0;overflow:hidden;text-overflow:ellipsis;max-width:240px;">
                <b style="color:#888;">
                  타이틀:
                </b>
                {{ row.widgetTitle || '-' }}
              </span>
              <span style="flex-shrink:0;overflow:hidden;text-overflow:ellipsis;max-width:280px;">
                <b style="color:#888;">
                  설명:
                </b>
                {{ row.widgetDesc || '-' }}
              </span>
              <span style="flex-shrink:0;">
                <b style="color:#888;">
                  라이브러리:
                </b>
                <span v-if="row.widgetLibRefYn === 'Y'" style="display:inline-block;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;margin-left:3px;font-family:monospace;">
                  {{ row.widgetLibNm || ('#'+String(row.widgetLibId||'').slice(-6)) }}
                </span>
                <span v-else style="color:#999;font-size:11px;">
                  직접 작성
                </span>
              </span>
              <span style="flex-shrink:0;">
                <b style="color:#888;">
                  정렬:
                </b>
                <span style="background:#dbeafe;color:#1d4ed8;border-radius:10px;padding:1px 8px;font-weight:700;margin-left:3px;">
                  {{ row.sortOrd || 0 }}
                </span>
              </span>
              <span style="flex-shrink:0;">
                <b style="color:#888;">
                  환경:
                </b>
                <span style="font-family:monospace;font-size:10px;color:#666;">
                  {{ fnDispEnv(row.dispEnv) }}
                </span>
              </span>
              <span style="flex-shrink:0;">
                <b style="color:#888;">
                  등록일:
                </b>
                {{ row.regDate ? String(row.regDate).slice(0,10) : '-' }}
              </span>
              <span style="flex-shrink:0;">
                <b style="color:#888;">
                  사이트:
                </b>
                <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">
                  {{ cfSiteNm }}
                </span>
              </span>
            </div>
          </td>
        </template>
        <template #row-actions="{ row, gridId }">
          <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
            <button class="btn btn_preview btn-icon" title="미리보기" @click.stop="handleGridCellAction(gridId, 'btn_row_preview', row)">👁</button>
            <button class="btn btn_row_edit" style="white-space:nowrap;" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
            <button class="btn btn_row_delete" style="white-space:nowrap;" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
          </div>
        </template>
      </bo-grid>
      <bo-pager :pager="listGridPager" :on-set-page="n => handleBtnAction('widgets-pager-setPage', n)" :on-size-change="() => handleSelectAction('widgets-pager-sizeChange')" />
    </bo-container>
    <!-- ===== /우측 목록 ===================================================== -->
  </div>
  <!-- ===== □. 본문: 좌측 트리 + 우측 목록 ======================================= -->
  <!-- ===== ■. 인라인 상세 (항상 표시 / 진입 시 빈 신규 폼, 전체 폭) ============== -->
  <dp-disp-widget-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="cfDetailEditId"
    :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailPanel.active"
    :reload-trigger="detailPanel.reloadTrigger"
    @close="handleBtnAction('detailPanel-close')"
    />
</bo-page>
<!-- ===== □. 인라인 상세 ================================================== -->
`
};
