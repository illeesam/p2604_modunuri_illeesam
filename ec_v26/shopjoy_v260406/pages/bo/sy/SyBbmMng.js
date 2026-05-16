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

    const pathPickModal = reactive({ show: false, row: null });

    /* 게시판 마스터 openPathPick */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* 게시판 마스터 closePathPick */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* 게시판 마스터 onPathPicked */
    const onPathPicked = (pathId) => { if (pathPickModal.row) pathPickModal.row.pathId = pathId; };

    /* 게시판 마스터 pathLabel */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));
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
      dtlMode: 'view' // 'view' | 'edit'
    });

    /* 게시판 마스터 loadView */
    const loadView = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'view') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'view'; detailModal.show = true; };

    /* 게시판 마스터 상세조회 */
    const handleLoadDetail = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'edit') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'edit'; detailModal.show = true; };

    /* 게시판 마스터 openNew */
    const openNew = () => { detailModal.dtlId = '__new__'; detailModal.dtlMode = 'edit'; detailModal.show = true; };

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

    // -- return ---------------------------------------------------------------

    return { bbms, uiState, codes, cfSiteNm, searchParam, pager, fnTypeBadge, fnYnBadge, fnCommentBadge, fnAttachBadge, fnContentBadge, fnScopeBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, detailModal, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel,
      selectNode,
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel };
  },
  template: /* html */`
<div>
  <div class="page-title">게시판관리</div>
  <div class="card">
    <div class="search-bar">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'bbmNm',   label: '게시판명' },
          { value: 'bbmCode', label: '코드' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="c in codes.bbm_type" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.useYn"><option value="">사용여부 전체</option><option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <!-- -- 좌: 표시경로 트리 --------------------------------------------------- -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#sy_bbm</span></span>
        <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-path-tree biz-cd="sy_bbm" :selected="uiState.selectedPath" @select="selectNode" />
      </div>
    </div>

    <!-- -- 우: 목록 + 상세 --------------------------------------------------- -->
    <div>
      <div class="card">
        <div class="toolbar">
          <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>게시판목록 <span class="list-count">{{ pager.pageTotalCount }}건</span><span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">#{{ uiState.selectedPath }}</span></span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
            <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
          </div>
        </div>
        <table class="bo-table">
          <thead><tr>
            <th style="width:36px;text-align:center;">번호</th><th style="min-width:130px;">표시경로</th><th>게시판코드</th><th>게시판명</th><th>유형</th><th>댓글허용</th><th>첨부허용</th><th>내용입력</th><th>공개범위</th><th>좋아요</th><th>게시글수</th><th>정렬순서</th><th>사용여부</th><th>사이트명</th><th>등록일</th><th style="text-align:right">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="bbms.length===0"><td colspan="16" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-else v-for="(b, idx) in bbms" :key="b.bbmId" :style="detailModal.dtlId===b.bbmId?'background:#fff8f9;':''">
              <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
              <td>
                <div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color:b.pathId!=null?'#374151':'#9ca3af',fontWeight:b.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'6px'}">
                  <span style="flex:1;">{{ pathLabel(b.pathId) || '경로 선택...' }}</span>
                  <button type="button" @click.stop="openPathPick(b)" title="표시경로 선택" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0'}" @mouseover="$event.currentTarget.style.background='#eef2ff'" @mouseout="$event.currentTarget.style.background='#fff'">🔍</button>
                </div>
              </td>
              <td><code style="font-size:11px;color:#555;">{{ b.bbmCode }}</code></td>
              <td><span class="title-link" @click="handleLoadDetail(b.bbmId)" :style="detailModal.dtlId===b.bbmId?'color:#e8587a;font-weight:700;':''">{{ b.bbmNm }}<span v-if="detailModal.dtlId===b.bbmId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
              <td><span class="badge" :class="fnTypeBadge(b.bbmTypeCd)">{{ b.bbmTypeCd }}</span></td>
              <td><span class="badge" :class="fnCommentBadge(b.allowComment)">{{ b.allowComment || '불가' }}</span></td>
              <td><span class="badge" :class="fnAttachBadge(b.allowAttach)">{{ b.allowAttach || '불가' }}</span></td>
              <td><span class="badge" :class="fnContentBadge(b.contentTypeCd)">{{ b.contentTypeCd || '-' }}</span></td>
              <td><span class="badge" :class="fnScopeBadge(b.scopeTypeCd)">{{ b.scopeTypeCd || '-' }}</span></td>
              <td><span class="badge" :class="fnYnBadge(b.allowLike)">{{ b.allowLike==='Y'?'허용':'불가' }}</span></td>
              <td style="text-align:center;">{{ b.bbsCount || 0 }}</td>
              <td style="text-align:center;">{{ b.sortOrd }}</td>
              <td><span class="badge" :class="fnYnBadge(b.useYn)">{{ b.useYn==='Y'?'사용':'미사용' }}</span></td>
              <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
              <td>{{ b.regDate }}</td>
              <td><div class="actions">
                <button class="btn btn-blue btn-sm" @click="handleLoadDetail(b.bbmId)">수정</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(b)">삭제</button>
              </div></td>
            </tr>
          </tbody>
        </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
      </div>

      <div v-if="detailModal.show" style="margin-top:4px;">
        <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
          <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
        </div>
        <sy-bbm-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId" :tab-mode="cfIsViewMode"
          :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
          :reload-trigger="(uiStateDetail && uiStateDetail.reloadTrigger) || 0"
          :on-list-reload="handleSearchList"
        />
      </div>
    </div>
  </div>

  <path-pick-modal v-if="pathPickModal.show" biz-cd="sy_bbm"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    title="게시판 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};
