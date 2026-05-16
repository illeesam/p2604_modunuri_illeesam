/* ShopJoy Admin - 전시위젯 목록 (UI용 배치 위젯) */
window.DpDispWidgetMng = {
  name: 'DpDispWidgetMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const codes = reactive({ disp_widget_types: [], active_statuses: [] });
    const uiState = reactive({ loading: false, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const widgetLibs = reactive([]);
    const widgets = reactive([]);

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_widget_types = codeStore.sgGetGrpCodes('DISP_WIDGET_TYPE');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);

    // 코드 주입

    /* _initSearchParam */
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
      handleSearchData('DEFAULT');
    };

    /* sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
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
          widgetParams.searchType = 'def_nm,def_desc,def_tag';
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
      handleSearchData('DEFAULT');    });

    /* pathLabel */
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const cfSiteNm = computed(() => boUtil.getSiteNm());

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
    const wTypeLabel = (v) => codes.disp_widget_types.find(t => t.codeValue === v)?.codeLabel || v;

    /* wIcon */
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';

    /* -- 검색 -- */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 목록조회 */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchData('DEFAULT'); };

    /* onReset */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      handleSearchData('DEFAULT');
    };
  

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* 정책: 수정 클릭 시 항상 상세 API 호출. 같은 id 재클릭이어도 닫지 않고 reload 만 트리거 */
    const handleLoadDetail = (id) => {
      uiStateDetail.selectedId = id;
      uiStateDetail.openMode = 'edit';
      uiStateDetail.reloadTrigger++;
    };

    /* openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispWidgetMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchData('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    /* key 는 'open' / 'closed' 두 값만 사용 — id 가 바뀌어도 컴포넌트 remount 하지 않고 props.dtlId / reloadTrigger watch 로 내용만 교체 */
    const cfDetailKey = computed(() => uiStateDetail.selectedId === null ? 'closed' : 'open');

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnStatusCls */
    const fnStatusCls = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnStatusLabel */
    const fnStatusLabel = (v) => v === 'Y' ? '활성' : '비활성';

    /* contentSummary */
    const contentSummary = (d) => d?.widgetLibDesc || d?.contents || d?.desc || '';

    /* setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData(); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData(); };

    /* -- 표시경로 트리 -- */
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; handleSearchData(); };

    /* 삭제 */
    const handleDelete = async (d) => {
      const ok = await showConfirm('삭제', `[${d.widgetNm || d.widgetId}] 위젯을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        await boApiSvc.dpWidget.remove(d.widgetId, '전시위젯관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        handleSearchData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    // -- return ---------------------------------------------------------------

    return { widgets, widgetLibs, uiState, pathLabel,
      codes, wTypeLabel, wIcon,
      searchParam, applied, cfFilterDirty, pager,
      onSearch, onReset,
      cfSiteNm,
      setPage, onSizeChange,
      uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId),
      handleLoadDetail, openNew, closeDetail, inlineNavigate,
      cfDetailEditId, cfDetailKey,
      selectNode,
      fnStatusCls, fnStatusLabel, contentSummary, handleDelete, onSort, sortIcon,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">
    <span style="font-size:14px;font-weight:600;color:#333;">전시위젯관리</span>
    <span style="font-size:13px;font-weight:400;color:#999;margin:0 8px;">&gt;</span>
    <span style="font-size:14px;font-weight:600;color:#666;">전시위젯관리</span>
    <span style="font-size:13px;font-weight:400;color:#888;display:block;margin-top:4px;">위젯 유형별 리소스 등록·재활용</span>
  </div>

  <!-- -- 검색 필터 ---------------------------------------------------------- -->
  <div class="card" style="padding:14px 18px;margin-bottom:14px;">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
      <div class="form-group" style="margin:0;min-width:180px;flex:1;">
        <label class="form-label">검색어</label>
        <bo-multi-check-select
          v-model="searchParam.searchType"
          :options="[
            { value: 'def_nm',   label: '이름' },
            { value: 'def_desc', label: '설명' },
            { value: 'def_tag',  label: '태그' },
          ]"
          placeholder="검색대상 전체"
          all-label="전체 선택"
          min-width="160px" />
        <input v-model="searchParam.searchValue" class="form-control" placeholder="검색어 입력" @keyup.enter="() => onSearch?.()" style="margin:0;" />
      </div>
      <div class="form-group" style="margin:0;width:160px;">
        <label class="form-label">위젯 유형</label>
        <select v-model="searchParam.type" class="form-control" style="margin:0;">
          <option value="">전체</option>
          <option v-for="t in codes.disp_widget_types" :key="t?.codeValue" :value="t.codeValue">{{ t.codeLabel }}</option>
        </select>
      </div>
      <div class="form-group" style="margin:0;width:110px;">
        <label class="form-label">상태</label>
        <select v-model="searchParam.status" class="form-control" style="margin:0;">
          <option value="">전체</option>
          <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <span v-if="cfFilterDirty" style="font-size:11px;color:#e8587a;font-weight:600;align-self:center;">변경됨 →</span>
      <button @click="onSearch" class="btn btn-primary" style="height:36px;padding:0 20px;"
        :style="cfFilterDirty ? 'box-shadow:0 0 0 3px rgba(232,88,122,0.35);' : ''">조회</button>
      <button @click="onReset"  class="btn btn-outline" style="height:36px;padding:0 16px;">초기화</button>
    </div>
  </div>

  <!-- -- 본문: 좌측 트리 + 우측 목록 ---------------------------------------------- -->
  <div style="display:flex;gap:12px;align-items:flex-start;">

  <!-- -- 좌측 표시경로 -------------------------------------------------------- -->
  <div class="card" style="width:240px;min-width:180px;flex-shrink:0;padding:12px;max-height:calc(100vh - 260px);overflow-y:auto;">
    <div class="toolbar" style="margin-bottom:6px;">
      <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#ec_disp_widget</span></span>
      <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
    </div>
    <div style="max-height:65vh;overflow:auto;">
      <bo-path-tree biz-cd="ec_disp_widget" :selected="uiState.selectedPath" @select="selectNode" />
    </div>
  </div>

  <!-- -- 우측 목록 ---------------------------------------------------------- -->
  <div style="flex:1;min-width:0;width:100%;">
  <!-- -- 목록 ------------------------------------------------------------- -->
  <div class="card" style="padding:0;">
    <div style="padding:12px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:13px;color:#555;">총 <b>{{ pager.pageTotalCount }}</b>건</span>
      <span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;font-size:12px;">#{{ uiState.selectedPath }}</span>
      <!-- 적용 중인 필터 뱃지 -->
      <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;font-size:11px;">
        <span v-if="!applied.searchValue && !applied.type && !applied.status" style="color:#bbb;">필터 없음</span>
        <span v-if="applied.searchValue" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:10px;padding:1px 8px;">검색: {{ applied.searchValue }}</span>
        <span v-if="applied.type" style="background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:10px;padding:1px 8px;">유형: {{ wTypeLabel(applied.type) }}</span>
        <span v-if="applied.status" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;border-radius:10px;padding:1px 8px;">상태: {{ applied.status === 'Y' ? '활성' : '비활성' }}</span>
      </div>
      <button @click="openNew" class="btn btn-primary btn-sm" style="margin-left:auto;height:30px;padding:0 14px;">+ 신규등록</button>
    </div>

    <table class="bo-table" style="table-layout:fixed;width:100%;">
      <colgroup>
        <col style="width:56px;">
        <col>
        <col style="width:120px;">
      </colgroup>
      <thead>
        <tr>
          <th>ID</th>
          <th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">위젯 정보 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th>
          <th style="text-align:right;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="widgets.length===0">
          <td colspan="3" style="text-align:center;padding:30px;color:#ccc;">등록된 위젯이 없습니다.</td>
        </tr>
        <tr v-else v-for="(d, idx) in widgets" :key="d?.widgetId"
          :style="(selectedId===d.widgetId ? 'background:#fff8f8;' : '') + 'height:74px;'">
          <td style="color:#aaa;font-size:11px;vertical-align:top;padding-top:12px;width:56px;font-family:monospace;">{{ d.widgetId ? '#'+String(d.widgetId).slice(-6) : '-' }}</td>
          <td style="padding:10px 12px;vertical-align:top;">
            <div style="margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              <span style="font-size:15px;margin-right:4px;">{{ wIcon(d.widgetTypeCd) }}</span>
              <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">{{ wTypeLabel(d.widgetTypeCd) }}</span>
              <span class="title-link" @click="handleLoadDetail(d.widgetId)"
                :style="'font-size:14px;font-weight:700;margin-left:8px;'+(selectedId===d.widgetId?'color:#e8587a;':'color:#222;')">{{ d.widgetNm }}</span>
              <span class="badge" :class="fnStatusCls(d.useYn)" style="font-size:11px;margin-left:8px;">{{ fnStatusLabel(d.useYn) }}</span>
            </div>
            <div style="display:flex;flex-wrap:nowrap;gap:14px;font-size:11px;color:#555;line-height:1.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              <span style="flex-shrink:0;overflow:hidden;text-overflow:ellipsis;max-width:240px;"><b style="color:#888;">타이틀:</b> {{ d.widgetTitle || '-' }}</span>
              <span style="flex-shrink:0;overflow:hidden;text-overflow:ellipsis;max-width:280px;"><b style="color:#888;">설명:</b> {{ d.widgetDesc || '-' }}</span>
              <span style="flex-shrink:0;"><b style="color:#888;">라이브러리:</b>
                <span v-if="d.widgetLibRefYn === 'Y'" style="display:inline-block;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;margin-left:3px;font-family:monospace;">{{ d.widgetLibNm || ('#'+String(d.widgetLibId||'').slice(-6)) }}</span>
                <span v-else style="color:#999;font-size:11px;">직접 작성</span>
              </span>
              <span style="flex-shrink:0;"><b style="color:#888;">정렬:</b>
                <span style="background:#dbeafe;color:#1d4ed8;border-radius:10px;padding:1px 8px;font-weight:700;margin-left:3px;">{{ d.sortOrd || 0 }}</span>
              </span>
              <span style="flex-shrink:0;"><b style="color:#888;">환경:</b>
                <span style="font-family:monospace;font-size:10px;color:#666;">{{ d.dispEnv || '^PROD^' }}</span>
              </span>
              <span style="flex-shrink:0;"><b style="color:#888;">등록일:</b> {{ d.regDate ? String(d.regDate).slice(0,10) : '-' }}</span>
              <span style="flex-shrink:0;"><b style="color:#888;">사이트:</b>
                <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ cfSiteNm }}</span>
              </span>
            </div>
          </td>
          <td style="vertical-align:top;padding-top:10px;width:120px;">
            <div class="actions" style="justify-content:flex-end;">
              <button @click.stop="handleLoadDetail(d.widgetId)" class="btn btn-blue btn-sm">수정</button>
              <button @click.stop="handleDelete(d)" class="btn btn-danger btn-sm">삭제</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  </div><!-- -- /우측 목록 ----------------------------------------------------------- -->
  </div><!-- -- /본문 flex --------------------------------------------------------- -->

  <!-- -- 인라인 상세 --------------------------------------------------------- -->
  <div v-if="selectedId !== null" style="margin-top:16px;">
    <dp-disp-widget-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="uiStateDetail.reloadTrigger"
      @close="closeDetail"
      :on-list-reload="handleSearchData"
    />
  </div>
</div>
`
};
