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
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const codes = reactive({ disp_widget_types: [], active_statuses: [] });
    const widgetCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState = reactive({ loading: false, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const widgetLibs = reactive([]);
    const widgets = reactive([]);

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispWidgetMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 위젯 신규 등록 (인라인 패널)
      } else if (cmd === 'widgets-add') {
        return openNew();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 좌측 표시경로 트리 전체 보기
      } else if (cmd === 'pathTree-all') {
        uiState.selectedPath = null;
        pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispWidgetMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'widgets-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'widgets-pager-setPage') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'widgets-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 클릭 → 상세/편집 패널 열기
      } else if (cmd === 'widgets-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'widgets-rowDelete') {
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
    /* applied: 결과에 실제 반영된 검색 조건. searchParam 과 다르면 [조회] 버튼 강조 */
    const applied = reactive({ type: '', status: '' });
    const cfFilterDirty = computed(() =>
      searchParam.searchValue !== applied.searchValue ||
      searchParam.type !== applied.type ||
      searchParam.status !== applied.status
    );

    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    const detailPanel = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });
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
      handleSearchData('DEFAULT');
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.dpWidget.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(widgetCounts).forEach(k => { delete widgetCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) widgetCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };

    /* handleSearchData — 처리 */
    const handleSearchData = async () => {
      uiState.loading = true;
      try {
        const { type, status, searchType, searchValue } = searchParam;
        /* dp_widget (실제 배치된 위젯 인스턴스) — 메인 데이터 */
        const widgetParams = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...(searchValue ? { searchValue: searchValue.trim() } : {}),
          ...(searchType ? { searchType }                     : {}),
          ...(type   ? { typeCd: type }  : {}),
          ...(status ? { useYn: status } : {}),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (widgetParams.searchValue && !widgetParams.searchType) {
          widgetParams.searchType = 'widgetNm,widgetDesc,tag';
        }
        const [res, resLibs] = await Promise.all([
          boApiSvc.dpWidget.getPage(widgetParams, '전시위젯관리', '조회'),
          /* widgetLib 은 라이브러리 참조 표시(widget_lib_nm)용으로 함께 로드 (path 트리는 widget_lib 의 path_id 기준이라 lib 도 필요) */
          boApiSvc.dpWidgetLib.getPage({ pageNo: 1, pageSize: 10000 }, '전시위젯관리', '라이브러리조회'),
        ]);
        const dW = res.data?.data;
        widgets.splice(0, widgets.length, ...(dW?.pageList || dW?.list || []));
        const dLibs = resLibs.data?.data;
        widgetLibs.splice(0, widgetLibs.length, ...(dLibs?.pageList || dLibs?.list || []));
        pager.pageTotalCount = dW?.pageTotalCount || 0;
        pager.pageTotalPage  = dW?.pageTotalPage  || 1;
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
      handleSearchData('DEFAULT');
    });

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

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

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => {
      detailPanel.selectedId = id;
      detailPanel.openMode = 'edit';
      detailPanel.reloadTrigger++;
    };

    /* openNew — 신규 열기 */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { detailPanel.selectedId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispWidgetMng') { detailPanel.selectedId = null; if (opts.reload) handleSearchData('RELOAD'); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    /* key 는 'open' / 'closed' 두 값만 사용 — id 가 바뀌어도 컴포넌트 remount 하지 않고 props.dtlId / reloadTrigger watch 로 내용만 교체 */
    const cfDetailKey = computed(() => detailPanel.selectedId === null ? 'closed' : 'open');

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnStatusCls — 유틸 */
    const fnStatusCls = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnStatusLabel — 유틸 */
    const fnStatusLabel = (v) => v === 'Y' ? '활성' : '비활성';

    /* contentSummary — content 요약 */
    const contentSummary = (d) => d?.widgetLibDesc || d?.contents || d?.desc || '';

    /* 적용 필터 없음 여부 (template 속성값 && 금지 회피용) */
    const cfNoFilter = computed(() => !applied.searchValue && !applied.type && !applied.status);

    /* fnRowStyle — 행 스타일 */
    const fnRowStyle = (row) => (detailPanel.selectedId === row.widgetId ? 'background:#fff8f8;' : '') + 'height:74px;cursor:pointer;';

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData(); };

    /* selectNode — 노드 선택 */
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; detailPanel.selectedId = null; handleSearchData(); };

    /* handleDelete — 삭제 */
    const handleDelete = async (d) => {
      const ok = await showConfirm('삭제', `[${d.widgetNm || d.widgetId}] 위젯을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.dpWidget.remove(d.widgetId, '전시위젯관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        handleSearchData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'reg' 와 sortKey 일치) */
    const listGridColumns = [
      { key: 'widgetId',   label: 'ID',       style: 'width:56px;', link: true,
        cellStyle: 'color:#aaa;font-size:11px;vertical-align:top;padding-top:12px;font-family:monospace;',
        fmt: (v) => v ? '#' + String(v).slice(-6) : '-' },
      { key: 'widgetInfo', label: '위젯 정보', sortKey: 'reg' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      widgets, widgetLibs, uiState, widgetCounts, codes, searchParam, applied, pager, detailPanel, // 상태 / 데이터
      listGridColumns,                                                                // 컬럼 정의
      handleBtnAction, handleSelectAction,                                            // dispatch (모든 이벤트 / 액션 라우팅)
      cfFilterDirty, cfSiteNm, cfDetailEditId, cfDetailKey, cfNoFilter,               // computed
      selectedId: computed(() => detailPanel.selectedId),                             // computed
      pathLabel, wTypeLabel, wIcon, sortIcon,                                         // 헬퍼
      fnStatusCls, fnStatusLabel, contentSummary, fnRowStyle,                         // 헬퍼
      inlineNavigate,                                                                 // Dtl 콜백 (closure 필요)
      showToast, showConfirm, showRefModal, setApiRes,                                // Dtl 콜백
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
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
  </div>
  <!-- ===== □. 페이지 타이틀 ================================================= -->
  <!-- ===== ■. 검색 필터 =================================================== -->
  <div class="card" style="padding:14px 18px;margin-bottom:14px;">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div class="form-group" style="margin:0;min-width:180px;flex:1;">
        <label class="form-label">
          검색어
        </label>
        <bo-multi-check-select
          v-model="searchParam.searchType"
          :options="[
          { value: 'widgetNm',   label: '이름' },
          { value: 'widgetDesc', label: '설명' },
          { value: 'tag',  label: '태그' },
          ]"
          placeholder="검색대상 전체"
          all-label="전체 선택"
          min-width="160px" />
        <input v-model="searchParam.searchValue" class="form-control" placeholder="검색어 입력" @keyup.enter="handleBtnAction('searchParam-list')" style="margin:0;" />
      </div>
      <div class="form-group" style="margin:0;width:160px;">
        <label class="form-label">
          위젯 유형
        </label>
        <select v-model="searchParam.type" class="form-control" style="margin:0;">
          <option value="">
            전체
          </option>
          <option v-for="t in codes.disp_widget_types" :key="t?.codeValue" :value="t.codeValue">
            {{ t.codeLabel }}
          </option>
        </select>
      </div>
      <div class="form-group" style="margin:0;width:110px;">
        <label class="form-label">
          상태
        </label>
        <select v-model="searchParam.status" class="form-control" style="margin:0;">
          <option value="">
            전체
          </option>
          <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">
            {{ c.codeLabel }}
          </option>
        </select>
      </div>
      <span v-if="cfFilterDirty" style="font-size:11px;color:#e8587a;font-weight:600;align-self:center;">
        변경됨 →
      </span>
      <button @click="handleBtnAction('searchParam-list')" class="btn btn-primary" style="height:36px;padding:0 20px;"
        :style="cfFilterDirty ? 'box-shadow:0 0 0 3px rgba(232,88,122,0.35);' : ''">
        조회
      </button>
      <button @click="handleBtnAction('searchParam-reset')"  class="btn btn-outline" style="height:36px;padding:0 16px;">
        초기화
      </button>
    </div>
  </div>
  <!-- ===== □. 검색 필터 =================================================== -->
  <!-- ===== ■. 본문: 좌측 트리 + 우측 목록 ======================================= -->
  <div style="display:flex;gap:12px;align-items:flex-start;">
    <!-- ===== ■.■. 좌측 표시경로 =============================================== -->
    <div class="card" style="width:240px;min-width:180px;flex-shrink:0;padding:12px;max-height:calc(100vh - 260px);overflow-y:auto;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">
          📂 표시경로
          <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">
            #ec_disp_widget
          </span>
        </span>
        <span v-if="uiState.selectedPath != null" @click="handleBtnAction('pathTree-all')" style="font-size:11px;color:#1677ff;cursor:pointer;">
          전체보기
        </span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-path-tree biz-cd="ec_disp_widget" :counts="widgetCounts" :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
      </div>
    </div>
    <!-- ===== □.□. 좌측 표시경로 =============================================== -->
    <!-- ===== ■.■. 우측 목록 ================================================= -->
    <div style="flex:1;min-width:0;width:100%;">
      <!-- ===== ■.■.■. 목록 ================================================== -->
      <bo-grid :columns="listGridColumns" :rows="widgets" :pager="pager" row-key="widgetId"
        :sort-state="uiState" list-title="전시위젯" :row-style="fnRowStyle"
        :count-text="pager.pageTotalCount + '건'"
        empty-text="등록된 위젯이 없습니다."
        @sort="key => handleSelectAction('widgets-sort', key)"
        @set-page="n => handleSelectAction('widgets-pager-setPage', n)"
        @size-change="handleSelectAction('widgets-pager-sizeChange')"
        @row-click="(r) => handleSelectAction('widgets-rowEdit', r.widgetId)" row-actions>
        <template #toolbar-actions>
          <span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;font-size:12px;align-self:center;">
            #{{ uiState.selectedPath }}
          </span>
          <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;font-size:11px;">
            <span v-if="cfNoFilter" style="color:#bbb;">
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
          <button @click="handleBtnAction('widgets-add')" class="btn btn-primary btn-sm" style="height:30px;padding:0 14px;">
            + 신규등록
          </button>
        </template>
        <template #cell-widgetInfo="{ row }">
          <td style="padding:10px 12px;vertical-align:top;">
            <div style="margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              <span style="font-size:15px;margin-right:4px;">
                {{ wIcon(row.widgetTypeCd) }}
              </span>
              <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">
                {{ wTypeLabel(row.widgetTypeCd) }}
              </span>
              <span class="title-link" @click="handleSelectAction('widgets-rowEdit', row.widgetId)"
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
                  {{ row.dispEnv || '^PROD^' }}
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
        <template #row-actions="{ row }">
          <div class="actions" style="justify-content:flex-end;">
            <button @click.stop="handleSelectAction('widgets-rowEdit', row.widgetId)" class="btn btn-blue btn-sm">
              수정
            </button>
            <button @click.stop="handleSelectAction('widgets-rowDelete', row)" class="btn btn-danger btn-sm">
              삭제
            </button>
          </div>
        </template>
      </bo-grid>
    </div>
    <!-- ===== /우측 목록 ===================================================== -->
  </div>
  <!-- ===== /본문 flex =================================================== -->
  <!-- ===== □.□. 우측 목록 ================================================= -->
  <!-- ===== □. 본문: 좌측 트리 + 우측 목록 ======================================= -->
  <!-- ===== ■. 인라인 상세 ================================================== -->
  <div v-if="selectedId !== null" style="margin-top:16px;">
    <dp-disp-widget-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="detailPanel.reloadTrigger"
      @close="handleBtnAction('detailPanel-close')"
      />
  </div>
</div>
<!-- ===== □. 인라인 상세 ================================================== -->
`
};
