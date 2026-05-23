/* ShopJoy Admin - 게시판관리 */
window.SyBbmMng = {
  name: 'SyBbmMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const bbms = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null});
    const codes = reactive({ bbm_type: [], bbm_status: [], use_yn: [] });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'bbmNm,bbmCode';
        }
        const res = await boApiSvc.syBbm.getPage(params, '게시판모드관리', '목록조회');
        const data = res.data?.data;
        bbms.splice(0, bbms.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || bbms.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* 표시경로 트리/픽커 (sy_path biz_cd=sy_bbm) */
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; handleSearchList(); };

    /* 게시판 마스터 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.bbm_type = codeStore.sgGetGrpCodes('BBM_TYPE');
      codes.bbm_status = codeStore.sgGetGrpCodes('BBM_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    /* 표시경로 선택 → bo-path-pick-field 컴포넌트 내장 (보일러플레이트 제거) */
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* 게시판 마스터 _initSearchParam */
    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', type: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());
const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const detailModal = reactive({
      show: false,
      dtlId: null,
      dtlMode: 'view', // 'view' | 'edit'
      reloadTrigger: 0 // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
    });

    /* 게시판 마스터 loadView */
    const loadView = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'view') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'view'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 게시판 마스터 상세조회 */
    const handleLoadDetail = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'edit') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 게시판 마스터 openNew */
    const openNew = () => { detailModal.dtlId = '__new__'; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 게시판 마스터 closeDetail */
    const closeDetail = () => { detailModal.show = false; detailModal.dtlId = null; };

    /* 게시판 마스터 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syBbmMng') { detailModal.show = false; detailModal.dtlId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}`);

    /* 게시판 마스터 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 게시판 마스터 fnTypeBadge */
    const _BBM_TYPE_FB = { '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' };
    const fnTypeBadge = t => coUtil.cofCodeBadge('BBM_TYPE', t, _BBM_TYPE_FB[t] || 'badge-gray');

    /* 게시판 마스터 fnYnBadge */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* 게시판 마스터 fnCommentBadge */
    const fnCommentBadge = v => ({ '불가': 'badge-gray', '댓글허용': 'badge-blue', '대댓글허용': 'badge-green' }[v] || 'badge-gray');

    /* 게시판 마스터 fnAttachBadge */
    const fnAttachBadge  = v => ({ '불가': 'badge-gray', '1개': 'badge-orange', '2개': 'badge-orange', '3개': 'badge-orange', '목록': 'badge-blue' }[v] || 'badge-gray');

    /* 게시판 마스터 fnContentBadge */
    const fnContentBadge = v => ({ '불가': 'badge-gray', 'textarea': 'badge-blue', 'htmleditor': 'badge-green' }[v] || 'badge-gray');

    /* 게시판 마스터 fnScopeBadge */
    const fnScopeBadge   = v => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[v] || 'badge-gray');

    /* 게시판 마스터 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 게시판 마스터 onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };

    /* 게시판 마스터 setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* 게시판 마스터 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 게시판 마스터 삭제 */
    const handleDelete = async (b) => {
      const ok = await showConfirm('삭제', `[${b.bbmNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = bbms.findIndex(x => x.bbmId === b.bbmId);
      if (idx !== -1) bbms.splice(idx, 1);
      if (detailModal.dtlId === b.bbmId) { detailModal.show = false; detailModal.dtlId = null; }
      try {
        const res = await boApiSvc.syBbm.remove(b.bbmId, '게시판모드관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 게시판 마스터 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(bbms, [{label:'ID',key:'bbmId'},{label:'게시판명',key:'bbmNm'},{label:'유형',key:'bbmTypeCd'},{label:'사용여부',key:'useYn'},{label:'등록일',key:'regDate'}], '게시판목록.csv');

    /* BoGrid 컬럼 정의 (특수셀은 #cell-* 슬롯으로 override) */
        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'bbmNm',   label: '게시판명' },
          { value: 'bbmCode', label: '코드' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.bbm_type, nullLabel: '유형 전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    const baseGridColumns = [
      { key: 'pathId',        label: '표시경로', pathPick: 'sy_bbm' },
      { key: 'bbmCode',       label: '게시판코드',
        cellInnerStyle: 'font-size:11px;color:#555;font-family:monospace;' },
      { key: 'bbmNm',         label: '게시판명', link: true,
        cellInnerStyle: (v) => detailModal.dtlId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'bbmTypeCd',     label: '유형', badge: (row) => fnTypeBadge(row.bbmTypeCd) },
      { key: 'allowComment',  label: '댓글허용', badge: (row) => fnCommentBadge(row.allowComment), fmt: (v) => v || '불가' },
      { key: 'allowAttach',   label: '첨부허용', badge: (row) => fnAttachBadge(row.allowAttach), fmt: (v) => v || '불가' },
      { key: 'contentTypeCd', label: '내용입력', badge: (row) => fnContentBadge(row.contentTypeCd), fmt: (v) => v || '-' },
      { key: 'scopeTypeCd',   label: '공개범위', badge: (row) => fnScopeBadge(row.scopeTypeCd), fmt: (v) => v || '-' },
      { key: 'allowLike',     label: '좋아요', badge: (row) => fnYnBadge(row.allowLike), fmt: (v) => v === 'Y' ? '허용' : '불가' },
      { key: 'bbsCount',      label: '게시글수', align: 'center', fmt: (v) => v || 0 },
      { key: 'sortOrd',       label: '정렬순서', align: 'center' },
      { key: 'useYn',         label: '사용여부', badge: (row) => fnYnBadge(row.useYn), fmt: (v) => v === 'Y' ? '사용' : '미사용' },
      { key: 'siteNm',        label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
      { key: 'regDate',       label: '등록일' },
    ];
    const fnRowStyle = (b) => detailModal.dtlId === b.bbmId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    // -- return ---------------------------------------------------------------

    return { bbms, uiState, codes, cfSiteNm, searchParam, pager, fnTypeBadge, fnYnBadge, fnCommentBadge, fnAttachBadge, fnContentBadge, fnScopeBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, detailModal, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel,
      selectNode,
      baseSearchColumns, baseGridColumns, fnRowStyle };
  },
  template: /* html */`
<div>
  <div class="page-title">게시판관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <!-- -- 좌: 표시경로 트리 --------------------------------------------------- -->
    <bo-path-tree-card biz-cd="sy_bbm" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath" @select="selectNode" />
    <!-- -- 우: 목록 + 상세 --------------------------------------------------- -->
    <div>
      <bo-grid
        :columns="baseGridColumns" :rows="bbms" :pager="pager" row-key="bbmId"
        list-title="게시판목록" :count-text="pager.pageTotalCount + '건'"
        :row-style="fnRowStyle"
        @set-page="setPage" @size-change="onSizeChange" @row-click="row => handleLoadDetail(row.bbmId)">
        <template #toolbar-actions>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
            <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
          </div>
        </template>
        <template #head-actions>
          <th style="text-align:right">관리</th>
        </template>
        <template #row-actions="{ row }">
          <td>
            <div class="actions">
              <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.bbmId)">수정</button>
              <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
            </div>
          </td>
        </template>
      </bo-grid>
      <div v-if="detailModal.show" style="margin-top:4px;">
        <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
          <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
        </div>
        <sy-bbm-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId" :tab-mode="cfIsViewMode"
          :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
          :reload-trigger="detailModal.reloadTrigger"
          :on-list-reload="handleSearchList"
          />
      </div>
    </div>
  </div>
</div>
`
};
